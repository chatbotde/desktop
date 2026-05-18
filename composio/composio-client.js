const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Composio, SessionPreset } = require('@composio/core');
const { shell } = require('electron');

class ComposioClient {
  constructor(ipcRegistry, authHandler) {
    this.ipcRegistry = ipcRegistry;
    this.authHandler = authHandler;
    this.session = null;
    this.sessionUserId = null;

    try {
      this.composio = process.env.COMPOSIO_API_KEY
        ? new Composio({ apiKey: process.env.COMPOSIO_API_KEY })
        : null;
    } catch (err) {
      console.warn(
        'ComposioClient: Failed to initialize Composio. Ensure COMPOSIO_API_KEY is set in .env',
        err.message
      );
      this.composio = null;
    }

    if (!process.env.COMPOSIO_API_KEY) {
      console.warn('ComposioClient: COMPOSIO_API_KEY is not set in .env');
    }
  }

  setup() {
    this.registerIpcHandlers();
  }

  getAuthenticatedUser() {
    const user = this.authHandler.getCurrentUser?.() ?? null;
    if (!user?.id) {
      throw new Error('Sign in to your Buddy account before connecting integrations.');
    }
    return user;
  }

  async getSession(userId) {
    if (!this.composio) {
      throw new Error('Composio is not configured. Add COMPOSIO_API_KEY to your .env file.');
    }

    if (this.session && this.sessionUserId === userId) {
      return this.session;
    }

    this.session = await this.composio.create(userId, {
      manageConnections: true,
    });
    this.sessionUserId = userId;
    return this.session;
  }

  async getConnectedToolkitSlugs(userId) {
    const session = await this.getSession(userId);
    const { items } = await session.toolkits({ limit: 50 });
    return items
      .filter((toolkit) => !toolkit.isNoAuth && (toolkit.connection?.isActive ?? false))
      .map((toolkit) => toolkit.slug);
  }

  async resolveToolkitSlugs(userId, requestedSlugs) {
    const slugs = [...new Set((requestedSlugs ?? []).filter(Boolean))];
    if (slugs.length === 0) {
      return this.getConnectedToolkitSlugs(userId);
    }
    return slugs;
  }

  async assertToolkitsConnected(userId, toolkitSlugs) {
    const session = await this.getSession(userId);
    const { items } = await session.toolkits({ limit: 50 });
    const bySlug = new Map(items.map((toolkit) => [toolkit.slug, toolkit]));

    const notConnected = toolkitSlugs.filter((slug) => {
      const toolkit = bySlug.get(slug);
      return !toolkit?.connection?.isActive;
    });

    if (notConnected.length > 0) {
      const labels = notConnected.join(', ');
      throw new Error(
        `Connect ${labels} in Settings → Integrations before asking Buddy to use ${labels}.`
      );
    }
  }

  async prepareChatTools(toolkitSlugs) {
    const user = this.getAuthenticatedUser();
    const slugs = await this.resolveToolkitSlugs(user.id, toolkitSlugs);

    if (slugs.length === 0) {
      throw new Error(
        'No connected integrations. Connect an app in Settings → Integrations, or tag one with Add in reference.'
      );
    }

    await this.assertToolkitsConnected(user.id, slugs);

    const chatSession = await this.composio.create(user.id, {
      toolkits: slugs,
      manageConnections: true,
      sessionPreset: SessionPreset.DIRECT_TOOLS,
    });

    const rawTools = await this.composio.tools.getRawToolRouterSessionTools(
      chatSession.sessionId
    );

    return {
      sessionId: chatSession.sessionId,
      toolkitSlugs: slugs,
      tools: rawTools.map((tool) => ({
        slug: tool.slug,
        description: tool.description ?? '',
        inputParameters: tool.inputParameters ?? { type: 'object', properties: {} },
      })),
    };
  }

  async executeChatTool(sessionId, toolSlug, args) {
    if (!sessionId || !toolSlug) {
      throw new Error('A Composio session and tool name are required to run integrations.');
    }

    const session = await this.composio.toolRouter.use(sessionId);
    const result = await session.execute(toolSlug, args ?? {});
    return result;
  }

  registerIpcHandlers() {
    this.ipcRegistry.register('composio:get-tools', async () => {
      try {
        const user = this.getAuthenticatedUser();
        const session = await this.getSession(user.id);
        const { items } = await session.toolkits({ limit: 50 });

        return items
          .filter((toolkit) => !toolkit.isNoAuth)
          .map((toolkit) => ({
            slug: toolkit.slug,
            name: toolkit.name,
            logo: toolkit.logo,
            isConnected: toolkit.connection?.isActive ?? false,
          }));
      } catch (error) {
        console.error('Composio: Failed to fetch tools', error);
        throw error;
      }
    });

    this.ipcRegistry.register('composio:connect-tool', async (_event, toolkitName) => {
      try {
        if (!toolkitName || typeof toolkitName !== 'string') {
          throw new Error('A toolkit name is required to connect an integration.');
        }

        const user = this.getAuthenticatedUser();
        const session = await this.getSession(user.id);
        const connectionRequest = await session.authorize(toolkitName);
        const redirectUrl = connectionRequest.redirectUrl ?? connectionRequest.url;

        if (redirectUrl) {
          await shell.openExternal(redirectUrl);
          return {
            success: true,
            message: 'Opened your browser to finish connecting this account.',
          };
        }

        return { success: false, message: 'No authorization URL was returned by Composio.' };
      } catch (error) {
        console.error('Composio: Failed to connect tool', error);
        throw error;
      }
    });

    this.ipcRegistry.register('composio:prepare-chat-tools', async (_event, options) => {
      try {
        const toolkitSlugs = options?.toolkitSlugs;
        return await this.prepareChatTools(toolkitSlugs);
      } catch (error) {
        console.error('Composio: Failed to prepare chat tools', error);
        throw error;
      }
    });

    this.ipcRegistry.register(
      'composio:execute-chat-tool',
      async (_event, { sessionId, toolSlug, args }) => {
        try {
          return await this.executeChatTool(sessionId, toolSlug, args);
        } catch (error) {
          console.error('Composio: Failed to execute chat tool', error);
          throw error;
        }
      }
    );
  }
}

module.exports = { ComposioClient };
