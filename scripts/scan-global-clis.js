const { getGlobalCliRegistry } = require('../agent-sessions/cli-global-registry');

async function main() {
  const registry = await getGlobalCliRegistry({ force: true });
  console.log(`Found ${registry.length} global CLI(s):\n`);
  for (const entry of registry) {
    console.log(`- ${entry.label} (${entry.id})`);
    console.log(`  command: ${entry.command}`);
    console.log(`  source: ${entry.source}`);
    console.log(`  binaries: ${entry.binaryNames.join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
