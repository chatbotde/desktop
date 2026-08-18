const { randomUUID } = require('crypto');
const { buildEventKindsMap } = require('../adapters/registry');

const APPROVAL_TIMEOUT_MS = 100_000;

/**
 * @typedef {'session_start'|'prompt'|'tool_pre'|'tool_post'|'notification'|'turn_end'|'session_end'} HookKind
 */

const EVENT_KINDS = buildEventKindsMap();

function toText(value, limit = 400) {
  if (value == null) {
    return '';
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

function readToolName(payload) {
  return String(payload.tool_name || payload.toolName || payload.tool || '').trim();
}

function readToolTarget(payload) {
  const input = payload.tool_input || payload.toolInput || payload.args || {};
  if (input && typeof input === 'object') {
    for (const key of ['command', 'file_path', 'filePath', 'path', 'pattern', 'url']) {
      if (input[key]) {
        return toText(input[key]);
      }
    }
  }
  return toText(input, 200);
}

function summarise(kind, payload) {
  switch (kind) {
    case 'session_start':
      return 'Session started';
    case 'prompt': {
      const prompt = toText(payload.prompt || payload.user_prompt);
      return prompt ? `> ${prompt}` : '> (prompt submitted)';
    }
    case 'tool_pre': {
      const tool = readToolName(payload) || 'tool';
      const target = readToolTarget(payload);
      return target ? `${tool}: ${target}` : `${tool}`;
    }
    case 'tool_post': {
      const tool = readToolName(payload) || 'tool';
      return `${tool} finished`;
    }
    case 'notification':
      return toText(payload.message || payload.notification) || 'Notification';
    case 'turn_end':
      return 'Agent finished its turn';
    case 'session_end':
      return 'Session ended';
    default:
      return '';
  }
}

class HookEventRouter {
  constructor(store, handlers) {
    this.store = store;
    this.handlers = handlers;
    this.sessionIdByExternalKey = new Map();
    this.pendingApprovals = new Map();
  }

  labelFor(agentId) {
    if (this.handlers.resolveLabel) {
      const label = this.handlers.resolveLabel(agentId);
      if (label) {
        return label;
      }
    }
    return agentId || 'Agent';
  }

  resolveSession(input) {
    const externalId = String(
      input.payload.session_id || input.payload.sessionId || ''
    ).trim();
    const key = externalId ? `${input.agentId}:${externalId}` : '';

    if (key) {
      const mapped = this.sessionIdByExternalKey.get(key);
      const existing = mapped ? this.store.get(mapped) : null;
      if (existing) {
        return existing;
      }
    }

    let session =
      (Number.isFinite(input.pid) ? this.store.findByPid(input.pid) : null) ||
      this.store.findActiveByAgentId(input.agentId);

    if (session) {
      session = this.store.update(session.id, { status: 'running', hooked: true }) || session;
    } else {
      session = this.store.create({
        command: input.agentId,
        cwd: input.cwd || process.cwd(),
        label: this.labelFor(input.agentId),
        agentId: input.agentId,
        managed: false,
        interactive: false,
        hooked: true,
        pid: Number.isFinite(input.pid) ? input.pid : null,
        status: 'running',
        output: 'Connected via hook',
      });
    }

    if (key) {
      this.sessionIdByExternalKey.set(key, session.id);
    }
    return session;
  }

  async handleHookEvent(message, socket) {
    const agentId = String(message.agentId || '').trim();
    const event = String(message.event || '').trim();
    const payload =
      message.payload && typeof message.payload === 'object' ? message.payload : {};
    const kind = EVENT_KINDS[agentId]?.[event];

    if (!kind) {
      return { type: 'hook_ack', ok: true, ignored: true };
    }

    const session = this.resolveSession({
      agentId,
      cwd: String(message.cwd || ''),
      pid: Number(message.pid),
      payload,
    });

    const summary = summarise(kind, payload);
    if (summary) {
      this.handlers.onSessionLine(session.id, summary);
    }

    if (kind === 'session_end') {
      const stopped = this.store.update(session.id, { status: 'stopped' });
      if (stopped) {
        this.handlers.onSessionUpdate(stopped);
      }
      this.handlers.onSessionList();
      return { type: 'hook_ack', ok: true };
    }

    if (kind === 'turn_end' || kind === 'notification') {
      const waiting = this.store.update(session.id, { status: 'waiting' });
      if (waiting) {
        this.handlers.onSessionUpdate(waiting);
      }
    }

    if (kind !== 'tool_pre' || message.blocking !== true) {
      return { type: 'hook_ack', ok: true };
    }

    return this.requestApproval({ session, agentId, event, payload, socket });
  }

  requestApproval(input) {
    const approvalId = randomUUID();
    const approval = {
      id: approvalId,
      sessionId: input.session.id,
      agentId: input.agentId,
      label: input.session.label,
      event: input.event,
      tool: readToolName(input.payload) || 'tool',
      detail: readToolTarget(input.payload),
      requestedAt: new Date().toISOString(),
    };

    const waiting = this.store.update(input.session.id, { status: 'waiting' });
    if (waiting) {
      this.handlers.onSessionUpdate(waiting);
    }

    return new Promise((resolve) => {
      const settle = (decision, reason) => {
        const pending = this.pendingApprovals.get(approvalId);
        if (!pending) {
          return;
        }
        clearTimeout(pending.timer);
        this.pendingApprovals.delete(approvalId);
        this.handlers.onApprovalResolved(approvalId, decision);

        const resumed = this.store.update(input.session.id, { status: 'running' });
        if (resumed) {
          this.handlers.onSessionUpdate(resumed);
        }
        resolve({ type: 'hook_decision', decision, reason });
      };

      const timer = setTimeout(() => {
        this.handlers.onSessionLine(
          input.session.id,
          `No answer from phone for ${approval.tool} — leaving the decision to the desktop.`
        );
        settle('', '');
      }, APPROVAL_TIMEOUT_MS);

      this.pendingApprovals.set(approvalId, { approval, resolve: settle, timer });

      if (input.socket) {
        input.socket.once('close', () => settle('', ''));
      }

      this.handlers.onApprovalRequest(approval);
      this.handlers.onSessionLine(
        input.session.id,
        `Waiting for approval: ${approval.tool}${approval.detail ? ` — ${approval.detail}` : ''}`
      );
    });
  }

  resolveApproval(approvalId, decision, reason) {
    const pending = this.pendingApprovals.get(approvalId);
    if (!pending) {
      return false;
    }
    pending.resolve(decision, reason);
    return true;
  }

  listPendingApprovals() {
    return Array.from(this.pendingApprovals.values()).map((entry) => entry.approval);
  }

  clear() {
    for (const approvalId of Array.from(this.pendingApprovals.keys())) {
      this.resolveApproval(approvalId, '', '');
    }
    this.sessionIdByExternalKey.clear();
  }
}

module.exports = { HookEventRouter, APPROVAL_TIMEOUT_MS, EVENT_KINDS };
