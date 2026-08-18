const { app, shell } = require('electron');
const { SkillsStore } = require('./skills-store');

class SkillsService {
  /**
   * @param {import('../ipc-handler-registry').IpcHandlerRegistry} ipcRegistry
   */
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.store = new SkillsStore();
  }

  setup() {
    const userDataPath = app.getPath('userData');
    this.store.initialize(userDataPath);
    this.registerIpcHandlers();
    console.log(`[Skills] Ready — folder: ${this.store.getSkillsFolderPath()}`);
  }

  registerIpcHandlers() {
    this.ipcRegistry.register('skills:list', async () => {
      return this.store.listSkills();
    });

    this.ipcRegistry.register('skills:get', async (_event, idOrSlug) => {
      return this.store.getSkill(idOrSlug);
    });

    this.ipcRegistry.register('skills:save', async (_event, input) => {
      if (!input?.title?.trim() || typeof input.contentMd !== 'string') {
        throw new Error('Skill requires a title and contentMd.');
      }
      return this.store.saveSkill(input);
    });

    this.ipcRegistry.register('skills:delete', async (_event, idOrSlug) => {
      return { success: this.store.deleteSkill(idOrSlug) };
    });

    this.ipcRegistry.register('skills:record-usage', async (_event, idOrSlug) => {
      return { success: this.store.recordUsage(idOrSlug) };
    });

    this.ipcRegistry.register('skills:get-folder-path', async () => {
      return {
        skillsFolder: this.store.getSkillsFolderPath(),
        databasePath: this.store.getDatabasePath(),
      };
    });

    this.ipcRegistry.register('skills:open-folder', async () => {
      const folder = this.store.getSkillsFolderPath();
      await shell.openPath(folder);
      return { success: true, path: folder };
    });

    this.ipcRegistry.register('skills:open-skill', async (_event, idOrSlug) => {
      const skill = this.store.getSkill(idOrSlug);
      if (!skill) {
        throw new Error('Skill not found.');
      }
      shell.showItemInFolder(skill.filePath);
      return { success: true, path: skill.filePath };
    });
  }
}

module.exports = { SkillsService };
