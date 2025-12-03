const { ipcMain } = require('electron');
require('dotenv').config(); // Ensure env vars are loaded
let Exa;

// Dynamic import for ESM module
async function loadExa() {
    if (!Exa) {
        try {
            const module = await import('exa-js');
            Exa = module.default;
        } catch (e) {
            console.error('Failed to load exa-js:', e);
        }
    }
    return Exa;
}

async function performSearch(query) {
    const ExaClass = await loadExa();
    if (!ExaClass) {
        throw new Error("Exa library could not be loaded");
    }

    if (!process.env.EXA_API_KEY) {
        throw new Error("EXA_API_KEY is not set");
    }

    const exa = new ExaClass(process.env.EXA_API_KEY);

    try {
        const result = await exa.searchAndContents(query, {
            type: "neural",
            useAutoprompt: true,
            numResults: 3,
            text: true
        });
        return result;
    } catch (error) {
        console.error("Search error:", error);
        throw error;
    }
}

function setupSearchIpc() {
    ipcMain.handle('search:perform', async (event, query) => {
        try {
            const results = await performSearch(query);
            return { success: true, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { setupSearchIpc };
