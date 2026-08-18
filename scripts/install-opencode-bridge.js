const fs = require('fs');
const os = require('os');
const path = require('path');

const source = path.join(__dirname, '..', 'agent-sessions', 'plugins', 'opencode-buddy-bridge.js');
const targetDir = path.join(os.homedir(), '.config', 'opencode', 'plugins');
const target = path.join(targetDir, 'buddy-bridge.js');

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);

console.log(`Installed OpenCode bridge plugin:\n  ${target}`);
console.log('\nRestart opencode completely (quit and reopen). Buddy must be running first (npm run dev).');
console.log('Phone chat shows only your messages and agent replies.');
