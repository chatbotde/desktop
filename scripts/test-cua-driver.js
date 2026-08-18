#!/usr/bin/env node
/**
 * Standalone Cua Driver smoke test (no full Buddy UI required).
 *
 * Usage:
 *   npm run test:cua-driver
 */

const { McpStore } = require('../mcp/mcp-store');
const { McpClient } = require('../mcp/mcp-client');
const { runCuaDriverSmokeTest, resolveCuaDriverCommand } = require('../mcp/cua-driver');

async function main() {
  console.log('=== Cua Driver Smoke Test ===\n');

  const resolved = resolveCuaDriverCommand();
  if (!resolved) {
    console.error('FAIL: cua-driver is not installed or not on PATH.\n');
    console.error('Install on Windows (PowerShell):');
    console.error('  irm https://raw.githubusercontent.com/trycua/cua/main/libs/cua-driver/scripts/install.ps1 | iex');
    console.error('\nThen open a NEW terminal and run: npm run test:cua-driver');
    process.exit(1);
  }

  console.log(`Found cua-driver (${resolved.source}): ${resolved.command}\n`);

  const store = new McpStore();
  const client = new McpClient({ register: () => {} });
  client.store = store;

  const result = await runCuaDriverSmokeTest(client);

  console.log(JSON.stringify(result, null, 2));
  console.log('');

  if (result.ok) {
    console.log(`PASS: ${result.message}`);
    process.exit(0);
  }

  console.error(`FAIL at step "${result.step}": ${result.error}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
