const assert = require('assert');
const { resolveAgentFromProcess } = require('../agent-sessions/cli-auto-detect');
const { loadManifest } = require('../agent-sessions/cli-manifest');
const { buildGlobalCliIndexes } = require('../agent-sessions/cli-global-registry');

const manifest = loadManifest();
const globalIndexes = buildGlobalCliIndexes([
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    command: 'gemini',
    packageName: '@google/gemini-cli',
    binaryNames: ['gemini'],
    pathMarkers: [
      'appdata/roaming/npm/node_modules/@google/gemini-cli/dist/index.js',
      'appdata/roaming/npm/node_modules/@google/gemini-cli/',
    ],
    source: 'npm-global',
  },
]);

/** @type {Array<{ name: string; proc: { pid: number; name: string; commandLine: string }; expect: string | null }>} */
const cases = [
  {
    name: 'gemini global npm',
    proc: {
      pid: 1,
      name: 'node.exe',
      commandLine:
        '"C:\\Program Files\\nodejs\\node.exe" C:\\Users\\me\\AppData\\Roaming\\npm/node_modules/@google/gemini-cli/dist/index.js',
    },
    expect: 'gemini-cli',
  },
  {
    name: 'opencode binary',
    proc: { pid: 2, name: 'opencode.exe', commandLine: 'opencode' },
    expect: 'opencode',
  },
  {
    name: 'claude binary uses manifest id',
    proc: { pid: 3, name: 'claude', commandLine: 'claude --help' },
    expect: 'claude-code',
  },
  {
    name: 'npx agent',
    proc: { pid: 4, name: 'node.exe', commandLine: 'npx --yes @some/new-agent-cli' },
    expect: 'new-agent-cli',
  },
  {
    name: 'vite dev server ignored',
    proc: {
      pid: 5,
      name: 'node.exe',
      commandLine: 'node node_modules/vite/bin/vite.js',
    },
    expect: null,
  },
  {
    name: 'buddy dev ignored',
    proc: {
      pid: 6,
      name: 'node.exe',
      commandLine: 'npm run dev',
    },
    expect: null,
  },
  {
    name: 'manifest label override',
    proc: {
      pid: 7,
      name: 'node.exe',
      commandLine:
        'node C:/Users/me/AppData/Roaming/npm/node_modules/@google/gemini-cli/dist/index.js',
    },
    expect: 'gemini-cli',
  },
];

let failed = 0;
for (const testCase of cases) {
  const result = resolveAgentFromProcess(testCase.proc, manifest, globalIndexes);
  const agentId = result?.agentId ?? null;
  try {
    assert.strictEqual(agentId, testCase.expect, testCase.name);
    console.log(`ok  ${testCase.name}`);
  } catch (error) {
    failed += 1;
    console.error(`fail ${testCase.name}: expected ${testCase.expect}, got ${agentId}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`\n${cases.length} auto-detect checks passed`);
