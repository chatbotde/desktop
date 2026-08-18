const fs = require('fs');
const os = require('os');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'agent-sessions', 'plugins', 'gemini-bridge');
const targetDir = path.join(os.homedir(), '.gemini', 'extensions', 'buddy-bridge');

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(src, dest);
      continue;
    }
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(sourceDir, targetDir);

console.log(`Installed Gemini CLI bridge extension:\n  ${targetDir}`);
console.log('\nRestart gemini completely (quit and reopen). Buddy must be running first (npm run dev).');
console.log('Phone chat works when Gemini writes to its session logs (interactive mode).');
console.log('Keep the Gemini terminal window available — phone input is injected into that console.');
