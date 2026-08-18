const { execFile } = require('child_process');
const path = require('path');

let lastFirewallStatus = {
  platform: process.platform,
  configured: null,
  portRulesOk: false,
  programRuleOk: false,
  error: null,
};

let elevatedSetupAttempted = false;

function runNetsh(args) {
  return new Promise((resolve, reject) => {
    execFile('netsh', args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(String(stdout || ''));
    });
  });
}

function netshValue(value) {
  const text = String(value ?? '');
  return text.includes(' ') ? `"${text}"` : text;
}

async function ruleExists(ruleName) {
  if (process.platform !== 'win32') {
    return true;
  }
  try {
    const stdout = await runNetsh([
      'advfirewall',
      'firewall',
      'show',
      'rule',
      `name=${netshValue(ruleName)}`,
    ]);
    return stdout.includes(ruleName);
  } catch {
    return false;
  }
}

async function addPortRule(ruleName, tcpPort) {
  await runNetsh([
    'advfirewall',
    'firewall',
    'add',
    'rule',
    `name=${netshValue(ruleName)}`,
    'dir=in',
    'action=allow',
    'protocol=TCP',
    `localport=${tcpPort}`,
    'profile=any',
    'enable=yes',
  ]);
}

async function addProgramRule(ruleName, programPath) {
  await runNetsh([
    'advfirewall',
    'firewall',
    'add',
    'rule',
    `name=${netshValue(ruleName)}`,
    'dir=in',
    'action=allow',
    `program=${netshValue(programPath)}`,
    'profile=any',
    'enable=yes',
  ]);
}

function portRuleName(tcpPort) {
  return `SonicThinking-RemotePad-TCP-${tcpPort}`;
}

/**
 * Open the bundled PowerShell script with UAC elevation so inbound LAN ports are allowed.
 */
function promptElevatedFirewallSetup() {
  if (process.platform !== 'win32' || elevatedSetupAttempted) {
    return;
  }

  elevatedSetupAttempted = true;
  const scriptPath = path.join(__dirname, 'scripts', 'allow-lan-firewall.ps1');
  const escapedScript = scriptPath.replace(/'/g, "''");
  const command =
    `Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','${escapedScript}' -Verb RunAs`;

  execFile('powershell', ['-NoProfile', '-Command', command], { windowsHide: true }, (error) => {
    if (error) {
      console.warn('[RemotePad] Could not launch elevated firewall setup:', error.message);
    } else {
      console.log('[RemotePad] Opened Windows Firewall setup — approve the UAC prompt if shown');
    }
  });
}

/**
 * Ensure inbound TCP is allowed for Remote Pad on Windows (all profiles).
 * Tailscale is often classified as Public — Private-only rules will not help.
 * @param {number} port
 * @param {number} [extraPort]
 */
function ensureWindowsFirewallRules(port, extraPort) {
  if (process.platform !== 'win32') {
    lastFirewallStatus = {
      platform: process.platform,
      configured: true,
      portRulesOk: true,
      programRuleOk: true,
      error: null,
    };
    return;
  }

  const ports = [port];
  if (typeof extraPort === 'number' && extraPort > 0 && extraPort !== port) {
    ports.push(extraPort);
  }

  void (async () => {
    let portRulesOk = true;
    let programRuleOk = true;
    let error = null;

    try {
      for (const tcpPort of ports) {
        const ruleName = portRuleName(tcpPort);
        if (!(await ruleExists(ruleName))) {
          await addPortRule(ruleName, tcpPort);
        }
        if (!(await ruleExists(ruleName))) {
          portRulesOk = false;
        } else {
          console.log(`[RemotePad] Windows Firewall: allowed inbound TCP ${tcpPort}`);
        }
      }

      const programPath = process.execPath;
      const programRuleName = 'SonicThinking-RemotePad-App';
      if (!(await ruleExists(programRuleName))) {
        try {
          await addProgramRule(programRuleName, programPath);
        } catch (programError) {
          programRuleOk = false;
          console.warn(
            '[RemotePad] Could not add program firewall rule:',
            programError.message
          );
        }
      }
      if (!(await ruleExists(programRuleName))) {
        programRuleOk = false;
      }
    } catch (err) {
      portRulesOk = false;
      error = err instanceof Error ? err.message : String(err);
      console.warn('[RemotePad] Windows Firewall setup failed:', error);
      console.warn(
        '[RemotePad] Allow ports 8765-8766 in Windows Firewall, or approve the UAC prompt when it appears'
      );
      promptElevatedFirewallSetup();
    }

    lastFirewallStatus = {
      platform: 'win32',
      configured: portRulesOk,
      portRulesOk,
      programRuleOk,
      error,
    };
  })();
}

function getWindowsFirewallStatus() {
  if (process.platform !== 'win32') {
    return { platform: process.platform, configured: true, portRulesOk: true, programRuleOk: true, error: null };
  }
  return { ...lastFirewallStatus };
}

function openWindowsFirewallSetup() {
  elevatedSetupAttempted = false;
  promptElevatedFirewallSetup();
}

module.exports = {
  ensureWindowsFirewallRules,
  getWindowsFirewallStatus,
  openWindowsFirewallSetup,
};
