#!/usr/bin/env node

/**
 * Install / uninstall global agent CLI shims into ~/.buddy/bin
 *
 *   npm run agent:install-shims
 *   npm run agent:uninstall-shims
 *   node scripts/install-agent-shims.js --status
 */

const {
  installAgentShims,
  uninstallAgentShims,
  getShimStatus,
} = require('../agent-sessions/shim-installer');

async function main() {
  const mode = process.argv[2] || '--install';

  if (mode === '--help' || mode === '-h') {
    console.log('Usage: node scripts/install-agent-shims.js [--install|--uninstall|--status]');
    process.exit(0);
  }

  if (mode === '--status') {
    console.log(JSON.stringify(getShimStatus(), null, 2));
    return;
  }

  if (mode === '--uninstall') {
    const result = uninstallAgentShims();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await installAgentShims({ force: mode === '--force' });
  console.log('');
  console.log('Buddy agent shims');
  console.log(`  bin:       ${result.binDir}`);
  console.log(`  installed: ${result.installedCount}`);
  console.log(`  skipped:   ${result.skippedCount}`);
  console.log(`  PATH:      ${result.pathChanged ? 'updated (open a new terminal)' : 'ok'}`);
  if (result.pathError) {
    console.log(`  PATH warn: ${result.pathError}`);
  }
  console.log('');
  for (const row of result.results) {
    if (row.ok) {
      console.log(`  ✓ ${row.name} → ${row.realPath}`);
    } else {
      console.log(`  · ${row.name} (${row.error})`);
    }
  }
  console.log('');
  console.log(result.note);
  console.log('After install, run e.g. `claude` or `opencode` — session appears on phone Agents.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
