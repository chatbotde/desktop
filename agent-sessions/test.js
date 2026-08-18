/* Hook pipeline tests: event routing, blocking approvals, forwarder, installer. */
const assert = require('assert');
const { SessionStore } = require('./session-store');
const { HookEventRouter } = require('./hooks/events');

async function main() {
  const store = new SessionStore();
  const lines = [];
  const approvals = [];
  const resolved = [];

  const router = new HookEventRouter(store, {
    onSessionLine: (sessionId, line) => lines.push(line),
    onSessionUpdate: () => {},
    onSessionList: () => {},
    onApprovalRequest: (approval) => approvals.push(approval),
    onApprovalResolved: (id, decision) => resolved.push({ id, decision }),
    resolveLabel: () => 'Claude Code',
  });

  // 1. A session-start hook should create exactly one session.
  await router.handleHookEvent({
    agentId: 'claude-code',
    event: 'SessionStart',
    cwd: 'C:/work',
    pid: 4242,
    payload: { session_id: 'abc-123', source: 'startup' },
  });
  assert.strictEqual(store.list().length, 1, 'expected one session');
  const session = store.list()[0];
  assert.strictEqual(session.label, 'Claude Code');
  assert.strictEqual(session.hooked, true);

  // 2. A prompt on the same external session id must reuse that session.
  await router.handleHookEvent({
    agentId: 'claude-code',
    event: 'UserPromptSubmit',
    cwd: 'C:/work',
    pid: 4242,
    payload: { session_id: 'abc-123', prompt: 'refactor the auth module' },
  });
  assert.strictEqual(store.list().length, 1, 'must not duplicate the session');
  assert.ok(
    lines.some((line) => line.includes('refactor the auth module')),
    'prompt should reach the phone log'
  );

  // 3. A blocking PreToolUse must park until answered, then return the decision.
  const pending = router.handleHookEvent({
    agentId: 'claude-code',
    event: 'PreToolUse',
    blocking: true,
    cwd: 'C:/work',
    pid: 4242,
    payload: {
      session_id: 'abc-123',
      tool_name: 'Bash',
      tool_input: { command: 'rm -rf build' },
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(approvals.length, 1, 'expected one approval request');
  assert.strictEqual(approvals[0].tool, 'Bash');
  assert.strictEqual(approvals[0].detail, 'rm -rf build');
  assert.strictEqual(store.get(session.id).status, 'waiting', 'session should show as waiting');

  assert.ok(router.resolveApproval(approvals[0].id, 'deny', 'Not from my phone'));
  const decision = await pending;
  assert.deepStrictEqual(decision, {
    type: 'hook_decision',
    decision: 'deny',
    reason: 'Not from my phone',
  });
  assert.strictEqual(store.get(session.id).status, 'running', 'session should resume');
  assert.strictEqual(resolved.length, 1);
  assert.strictEqual(router.listPendingApprovals().length, 0, 'approval must be cleared');

  // 4. Unknown events are ignored rather than creating junk sessions.
  const ignored = await router.handleHookEvent({
    agentId: 'claude-code',
    event: 'NotARealEvent',
    payload: {},
  });
  assert.strictEqual(ignored.ignored, true);
  assert.strictEqual(store.list().length, 1);

  // 5. A second agent gets its own session.
  await router.handleHookEvent({
    agentId: 'gemini-cli',
    event: 'SessionStart',
    cwd: 'C:/work',
    pid: 5151,
    payload: { session_id: 'gem-1' },
  });
  assert.strictEqual(store.list().length, 2, 'gemini should get its own session');

  await testForwarderRoundTrip();
  await testInstallerWritesValidConfig();
  testAdapterRegistry();
  testPtyLaunchPlan();
  console.log('hook pipeline smoke test passed');
}

function testPtyLaunchPlan() {
  const { isTerminalLaunch, buildPtyLaunch, writeRawToSession } = require('./core/process-wrapper');
  const { builtinTerminalCli } = require('./cli-availability');
  const { SessionStore } = require('./session-store');

  assert.strictEqual(isTerminalLaunch({ agentId: 'terminal' }), true);
  assert.strictEqual(isTerminalLaunch({ command: '' }), true);
  assert.strictEqual(isTerminalLaunch({ command: 'claude', agentId: 'claude-code' }), false);

  const terminal = buildPtyLaunch({ agentId: 'terminal', command: '', persistShell: true });
  if (process.platform === 'win32') {
    assert.strictEqual(terminal.file, 'powershell.exe');
    assert.deepStrictEqual(terminal.args, ['-NoLogo', '-NoExit']);
  } else {
    assert.ok(terminal.args.includes('-l') || terminal.file.includes('bash') || terminal.file.includes('zsh'));
  }
  assert.strictEqual(terminal.startCommand, null);

  const cli = buildPtyLaunch({ command: 'claude', args: ['--help'], agentId: 'claude-code' });
  if (process.platform === 'win32') {
    assert.ok(cli.args.includes('-Command'));
    assert.ok(String(cli.args[cli.args.length - 1]).includes('claude'));
  }

  const store = new SessionStore();
  assert.deepStrictEqual(writeRawToSession(store, 'missing', 'x'), {
    success: false,
    error: 'no_pty',
  });

  const builtin = builtinTerminalCli();
  assert.strictEqual(builtin.id, 'terminal');
  assert.strictEqual(builtin.installed, true);
}

function testAdapterRegistry() {
  const registry = require('./adapters/registry');
  const { renderDecision } = require('./hooks/decisions');
  const { claudeCodeAdapter } = require('./adapters/claude-code');

  assert.ok(registry.listAdapters().length >= 4, 'expected adapter registry entries');
  assert.ok(registry.getAdapter('claude-code'), 'claude adapter must exist');
  assert.ok(registry.getAdapter('aider')?.integration === 'managed-only');

  const sample = { decision: 'allow', reason: 'ok' };
  assert.strictEqual(
    renderDecision('claude-code', 'PreToolUse', sample),
    claudeCodeAdapter.renderDecision('PreToolUse', sample)
  );
}

/** Spawn the real forwarder against a real socket server and check the decision. */
async function testForwarderRoundTrip() {
  const path = require('path');
  const { spawn } = require('child_process');
  const { AgentSessionSocketServer } = require('./socket-server');

  const port = 9911;
  const store = new SessionStore();
  /** @type {Record<string, unknown>[]} */
  const approvals = [];

  const router = new HookEventRouter(store, {
    onSessionLine: () => {},
    onSessionUpdate: () => {},
    onSessionList: () => {},
    onApprovalRequest: (approval) => {
      approvals.push(approval);
      // Answer as soon as the card would reach the phone.
      setTimeout(() => router.resolveApproval(approval.id, 'allow', 'ok from test'), 50);
    },
    onApprovalResolved: () => {},
  });

  const server = new AgentSessionSocketServer(
    (message, socket) =>
      message.type === 'hook_event' ? router.handleHookEvent(message, socket) : { type: 'pong' },
    { port }
  );
  await server.start();

  const stdout = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(__dirname, 'hook-forwarder.js'),
        '--agent',
        'claude-code',
        '--event',
        'PreToolUse',
        '--port',
        String(port),
        '--block',
      ],
      { stdio: ['pipe', 'pipe', 'inherit'] }
    );

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', () => resolve(output));
    child.stdin.write(
      JSON.stringify({
        session_id: 'live-1',
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
      })
    );
    child.stdin.end();
  });

  await server.stop();

  assert.strictEqual(approvals.length, 1, 'forwarder should have raised one approval');
  const parsed = JSON.parse(stdout);
  assert.deepStrictEqual(
    parsed,
    {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'ok from test',
      },
    },
    'forwarder must emit Claude Code decision schema'
  );

  // With no server listening the forwarder must stay silent and exit clean,
  // otherwise a stopped Buddy would break the user's CLI.
  const offline = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        path.join(__dirname, 'hook-forwarder.js'),
        '--agent',
        'claude-code',
        '--event',
        'PreToolUse',
        '--port',
        '9912',
        '--block',
      ],
      { stdio: ['pipe', 'pipe', 'inherit'] }
    );
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('close', (code) => resolve({ output, code }));
    child.stdin.write('{}');
    child.stdin.end();
  });

  assert.strictEqual(offline.output, '', 'offline forwarder must print nothing');
  assert.strictEqual(offline.code, 0, 'offline forwarder must exit 0 so the agent continues');
}

/** The installer must produce config the agent can actually parse, and be reversible. */
async function testInstallerWritesValidConfig() {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const installer = require('./hook-installer');

  const nodeBinary = await installer.resolveNodeBinary();
  assert.ok(nodeBinary, 'node must be resolvable for hooks to install');

  // Never point this at the real ~/.claude/settings.json.
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'buddy-hook-test-'));
  const configPath = path.join(sandbox, 'settings.json');

  // Seed a user-owned hook to prove we never clobber it.
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      model: 'opus',
      hooks: {
        PreToolUse: [{ matcher: 'Bash', hooks: [{ name: 'mine', type: 'command', command: 'echo hi' }] }],
      },
    }),
    'utf8'
  );

  try {
    const result = await installer.installHooksFor('claude-code', { nodeBinary, configPath });
    assert.ok(result.installed, `install failed: ${result.error}`);

    const written = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.strictEqual(written.model, 'opus', 'unrelated settings must survive');

    const preToolUse = written.hooks.PreToolUse;
    const names = preToolUse.flatMap((group) => group.hooks.map((hook) => hook.name));
    assert.ok(names.includes('mine'), 'user hook must survive install');
    assert.ok(names.includes(installer.HOOK_NAME), 'buddy hook must be present');

    const ours = preToolUse.flatMap((g) => g.hooks).find((h) => h.name === installer.HOOK_NAME);
    assert.strictEqual(ours.command, nodeBinary, 'should exec node directly');
    assert.ok(ours.args.includes('--block'), 'PreToolUse must block');
    assert.strictEqual(ours.timeout, 120, 'Claude timeouts are in seconds');
    assert.ok(
      fs.existsSync(path.join(os.homedir(), '.buddy', 'hooks', 'buddy-hook-forwarder.js')),
      'forwarder must be copied outside the app bundle'
    );
    assert.ok(
      fs.existsSync(path.join(os.homedir(), '.buddy', 'hooks', 'buddy-hook-decisions.js')),
      'decisions helper must be copied with the forwarder'
    );

    // Installing twice must not stack duplicates.
    await installer.installHooksFor('claude-code', { nodeBinary, configPath });
    const again = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const ourCount = again.hooks.PreToolUse.flatMap((g) => g.hooks).filter(
      (h) => h.name === installer.HOOK_NAME
    ).length;
    assert.strictEqual(ourCount, 1, 'install must be idempotent');

    const removal = installer.uninstallHooksFor('claude-code', { configPath });
    assert.ok(removal.removed, `uninstall failed: ${removal.error}`);
    const after = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const leftover = (after.hooks.PreToolUse || [])
      .flatMap((g) => g.hooks)
      .filter((h) => h.name === installer.HOOK_NAME);
    assert.strictEqual(leftover.length, 0, 'uninstall must remove buddy hooks');
    assert.ok(
      (after.hooks.PreToolUse || []).flatMap((g) => g.hooks).some((h) => h.name === 'mine'),
      'uninstall must leave user hooks alone'
    );
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('FAILED:', error.message);
  process.exit(1);
});
