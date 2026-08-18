const { spawn } = require('child_process');

/**
 * @param {number} pid
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
function killProcessTree(pid) {
  if (!pid || pid <= 0) {
    return Promise.resolve({ success: false, error: 'invalid_pid' });
  }

  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const child = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      child.on('exit', (code) => {
        resolve(code === 0 ? { success: true } : { success: false, error: 'taskkill_failed' });
      });
      child.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      return;
    }

    try {
      process.kill(pid, 'SIGTERM');
      resolve({ success: true });
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'kill_failed',
      });
    }
  });
}

module.exports = { killProcessTree };
