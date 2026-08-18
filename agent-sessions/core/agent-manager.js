const { listAvailableClis } = require('../cli-availability');
const { listAgentsForUi } = require('../adapters/registry');
const {
  installHooksFor,
  installAvailableHooks,
  uninstallHooksFor,
  isHookInstalled,
} = require('../hooks/installer');

/**
 * Agent catalog for UI — combines adapter metadata with install/launch status.
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<ReturnType<typeof listAgentsForUi>>}
 */
async function listAgents(options = {}) {
  const clis = await listAvailableClis(options);
  /** @type {Record<string, boolean>} */
  const launchable = {};
  /** @type {Record<string, boolean>} */
  const installed = {};
  /** @type {Record<string, boolean>} */
  const hookInstalled = {};

  for (const cli of clis) {
    launchable[cli.id] = true;
    installed[cli.id] = cli.installed;
  }

  for (const entry of listAgentsForUi()) {
    if (entry.hooksSupported) {
      hookInstalled[entry.id] = isHookInstalled(entry.id);
    }
  }

  return listAgentsForUi({ launchable, installed, hookInstalled });
}

module.exports = {
  listAgents,
  installHooksFor,
  installAvailableHooks,
  uninstallHooksFor,
  isHookInstalled,
};
