const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CUA_DRIVER_SERVER_NAME = 'Cua Driver';

/** @returns {string | null} */
function resolveBundledCuaDriverPath() {
  if (!process.resourcesPath) return null;

  const candidates = [
    path.join(process.resourcesPath, 'cua-driver', 'cua-driver.exe'),
    path.join(process.resourcesPath, 'cua-driver', 'cua-driver'),
    path.join(process.resourcesPath, 'cua-driver', 'bin', 'cua-driver.exe'),
    path.join(process.resourcesPath, 'cua-driver', 'bin', 'cua-driver'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/** @returns {string | null} */
function resolveDefaultInstallPath() {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return null;
    const candidate = path.join(localAppData, 'Programs', 'Cua', 'cua-driver', 'bin', 'cua-driver.exe');
    return fs.existsSync(candidate) ? candidate : null;
  }

  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;

  const candidates = [
    path.join(home, '.local', 'bin', 'cua-driver'),
    path.join(home, '.cua-driver', 'bin', 'cua-driver'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/** @returns {string | null} */
function resolveCuaDriverFromPath() {
  try {
    if (process.platform === 'win32') {
      const output = execFileSync('where.exe', ['cua-driver'], {
        encoding: 'utf8',
        windowsHide: true,
      }).trim();
      const first = output.split(/\r?\n/).find(Boolean);
      return first && fs.existsSync(first) ? first : null;
    }

    const output = execFileSync('which', ['cua-driver'], {
      encoding: 'utf8',
    }).trim();
    return output && fs.existsSync(output) ? output : null;
  } catch {
    return null;
  }
}

/** @returns {{ command: string; source: 'bundled' | 'install' | 'path' } | null} */
function resolveCuaDriverCommand() {
  const bundled = resolveBundledCuaDriverPath();
  if (bundled) return { command: bundled, source: 'bundled' };

  const installed = resolveDefaultInstallPath();
  if (installed) return { command: installed, source: 'install' };

  const fromPath = resolveCuaDriverFromPath();
  if (fromPath) return { command: fromPath, source: 'path' };

  return null;
}

/**
 * @param {import('./mcp-store').McpStore} store
 * @returns {{ server: object; created: boolean } | null}
 */
function ensureCuaDriverMcpServer(store) {
  const resolved = resolveCuaDriverCommand();
  if (!resolved) return null;

  const servers = store.getServers();
  const existing = servers.find(
    (server) =>
      server.name === CUA_DRIVER_SERVER_NAME ||
      (server.transport?.type === 'stdio' &&
        server.transport?.command === resolved.command &&
        JSON.stringify(server.transport?.args ?? []) === JSON.stringify(['mcp'])),
  );

  if (existing) {
    const needsUpdate =
      existing.transport?.command !== resolved.command ||
      JSON.stringify(existing.transport?.args ?? []) !== JSON.stringify(['mcp']);

    if (needsUpdate) {
      const next = servers.map((server) =>
        server.id === existing.id
          ? {
              ...server,
              transport: {
                type: 'stdio',
                command: resolved.command,
                args: ['mcp'],
              },
              updatedAt: new Date().toISOString(),
            }
          : server,
      );
      store.saveServers(next);
      return {
        server: next.find((server) => server.id === existing.id),
        created: false,
      };
    }

    return { server: existing, created: false };
  }

  const server = store.addServer({
    name: CUA_DRIVER_SERVER_NAME,
    enabled: true,
    transport: {
      type: 'stdio',
      command: resolved.command,
      args: ['mcp'],
    },
  });

  return { server, created: true };
}

/** @param {unknown} result */
function extractTextContent(result) {
  if (!result || typeof result !== 'object') return null;
  const content = /** @type {{ content?: unknown[] }} */ (result).content;
  if (!Array.isArray(content)) return null;

  const textParts = content
    .filter((item) => item && typeof item === 'object' && /** @type {{ type?: string }} */ (item).type === 'text')
    .map((item) => String(/** @type {{ text?: string }} */ (item).text ?? ''))
    .filter(Boolean);

  if (textParts.length === 0) return null;
  return textParts.join('\n');
}

/** @param {unknown} result */
function parseToolJson(result) {
  const text = extractTextContent(result);
  if (!text) return null;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return { raw: text };

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return { raw: text };
  }
}

/** @param {unknown} result */
function parseToolPayload(result) {
  if (!result || typeof result !== 'object') return null;

  const structured = /** @type {{ structuredContent?: unknown }} */ (result).structuredContent;
  if (structured && typeof structured === 'object') {
    return /** @type {Record<string, unknown>} */ (structured);
  }

  return parseToolJson(result);
}

/**
 * @param {import('./mcp-client').McpClient} mcpClient
 */
async function runCuaDriverSmokeTest(mcpClient) {
  const resolved = resolveCuaDriverCommand();
  if (!resolved) {
    return {
      ok: false,
      step: 'resolve',
      error: 'cua-driver not found. Install: irm https://raw.githubusercontent.com/trycua/cua/main/libs/cua-driver/scripts/install.ps1 | iex',
    };
  }

  const ensured = ensureCuaDriverMcpServer(mcpClient.store);
  if (!ensured) {
    return {
      ok: false,
      step: 'register',
      error: 'Failed to register Cua Driver MCP server.',
    };
  }

  const serverId = ensured.server.id;

  try {
    await mcpClient.connectServer(serverId);
  } catch (err) {
    return {
      ok: false,
      step: 'connect',
      command: resolved.command,
      source: resolved.source,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  let tools;
  try {
    tools = await mcpClient.getConnection(serverId).listTools();
  } catch (err) {
    return {
      ok: false,
      step: 'list-tools',
      command: resolved.command,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const toolNames = tools.map((tool) => tool.name);
  const required = ['list_windows', 'get_window_state', 'click'];
  const missing = required.filter((name) => !toolNames.includes(name));

  if (missing.length > 0) {
    return {
      ok: false,
      step: 'tools',
      command: resolved.command,
      toolNames,
      error: `Missing tools: ${missing.join(', ')}`,
    };
  }

  let windowsResult;
  try {
    windowsResult = await mcpClient.getConnection(serverId).callTool('list_windows', {});
  } catch (err) {
    return {
      ok: false,
      step: 'list_windows',
      command: resolved.command,
      toolNames,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const windowsPayload = parseToolPayload(windowsResult);
  const windows = Array.isArray(windowsPayload?.windows)
    ? windowsPayload.windows
    : Array.isArray(windowsPayload)
      ? windowsPayload
      : [];

  const target =
    windows.find((window) => {
      const title = String(window?.title ?? window?.name ?? '').toLowerCase();
      return title && !title.includes('sonicthinking') && !title.includes('buddy') && !title.includes('cua.agentcursor');
    }) ?? windows[0];

  if (!target?.pid || target?.window_id == null) {
    return {
      ok: true,
      step: 'complete',
      command: resolved.command,
      source: resolved.source,
      serverId,
      toolNames,
      windowCount: windows.length,
      message: 'Connected and tools verified. No suitable target window for capture test.',
    };
  }

  let captureResult;
  try {
    captureResult = await mcpClient.getConnection(serverId).callTool('get_window_state', {
      pid: target.pid,
      window_id: target.window_id,
      capture_mode: 'vision',
    });
  } catch (err) {
    return {
      ok: false,
      step: 'get_window_state',
      command: resolved.command,
      target,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const capturePayload = parseToolPayload(captureResult);
  const hasImage =
    Boolean(capturePayload?.screenshot_base64) ||
    Boolean(capturePayload?.image_base64) ||
    (Array.isArray(captureResult?.content) &&
      captureResult.content.some((item) => item && typeof item === 'object' && item.type === 'image'));

  return {
    ok: true,
    step: 'complete',
    command: resolved.command,
    source: resolved.source,
    serverId,
    toolNames,
    windowCount: windows.length,
    target: {
      pid: target.pid,
      window_id: target.window_id,
      title: target.title ?? target.name ?? null,
    },
    captureOk: hasImage,
    message: hasImage
      ? 'Cua Driver smoke test passed (connect, tools, list_windows, window capture).'
      : 'Cua Driver connected; window state returned without embedded image (may still be usable).',
  };
}

function getCuaDriverStatus(store) {
  const resolved = resolveCuaDriverCommand();
  const servers = store.getServers();
  const registered = servers.find((server) => server.name === CUA_DRIVER_SERVER_NAME) ?? null;

  return {
    installed: Boolean(resolved),
    command: resolved?.command ?? null,
    source: resolved?.source ?? null,
    registered: Boolean(registered),
    serverId: registered?.id ?? null,
  };
}

module.exports = {
  CUA_DRIVER_SERVER_NAME,
  resolveCuaDriverCommand,
  ensureCuaDriverMcpServer,
  getCuaDriverStatus,
  runCuaDriverSmokeTest,
  parseToolJson,
  parseToolPayload,
  extractTextContent,
};
