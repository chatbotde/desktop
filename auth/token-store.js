/**
 * Token Store
 * 
 * Secure token storage using the OS keychain (via keytar).
 * Falls back to encrypted file storage if keytar is unavailable.
 * 
 * Supports:
 * - macOS Keychain
 * - Windows Credential Manager
 * - Linux Secret Service (GNOME Keyring)
 */

const config = require('./config');

let keytar = null;
let keytarAvailable = false;

// Try to load keytar for secure storage
try {
  keytar = require('keytar');
  keytarAvailable = true;
  console.log('Auth: Keytar loaded successfully - using secure OS keychain');
} catch (error) {
  console.warn('Auth: Keytar not available, falling back to encrypted storage:', error.message);
}

// Fallback storage using electron-store or in-memory
let fallbackStore = new Map();
let electronStore = null;

try {
  // Try to use electron-store for persistent fallback
  const Store = require('electron-store');
  electronStore = new Store({
    name: 'auth-tokens',
    encryptionKey: `${config.KEYTAR_SERVICE}-fallback-key`,
  });
} catch (error) {
  console.warn('Auth: electron-store not available, using in-memory fallback');
}

class TokenStore {
  constructor() {
    this.service = config.KEYTAR_SERVICE;
  }

  // ===========================================
  // CORE TOKEN OPERATIONS
  // ===========================================

  /**
   * Store a token securely
   * @param {string} key - Token key (e.g., 'access_token')
   * @param {string} value - Token value
   * @returns {Promise<boolean>} Success status
   */
  async setToken(key, value) {
    try {
      if (keytarAvailable) {
        await keytar.setPassword(this.service, key, value);
      } else if (electronStore) {
        electronStore.set(key, value);
      } else {
        fallbackStore.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Auth: Failed to store token ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a token
   * @param {string} key - Token key
   * @returns {Promise<string|null>} Token value or null
   */
  async getToken(key) {
    try {
      if (keytarAvailable) {
        return await keytar.getPassword(this.service, key);
      } else if (electronStore) {
        return electronStore.get(key, null);
      } else {
        return fallbackStore.get(key) || null;
      }
    } catch (error) {
      console.error(`Auth: Failed to retrieve token ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a token
   * @param {string} key - Token key
   * @returns {Promise<boolean>} Success status
   */
  async deleteToken(key) {
    try {
      if (keytarAvailable) {
        return await keytar.deletePassword(this.service, key);
      } else if (electronStore) {
        electronStore.delete(key);
        return true;
      } else {
        return fallbackStore.delete(key);
      }
    } catch (error) {
      console.error(`Auth: Failed to delete token ${key}:`, error);
      return false;
    }
  }

  // ===========================================
  // HIGH-LEVEL TOKEN METHODS
  // ===========================================

  /**
   * Store authentication tokens from a successful login
   * @param {Object} tokens - Token data from auth server
   * @returns {Promise<boolean>} Success status
   */
  async storeAuthTokens(tokens) {
    const results = await Promise.all([
      tokens.accessToken && this.setToken(config.TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
      tokens.refreshToken && this.setToken(config.TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      tokens.sessionToken && this.setToken(config.TOKEN_KEYS.SESSION_TOKEN, tokens.sessionToken),
    ]);
    
    return results.every(r => r !== false);
  }

  /**
   * Get the access token
   * @returns {Promise<string|null>} Access token
   */
  async getAccessToken() {
    return this.getToken(config.TOKEN_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get the refresh token
   * @returns {Promise<string|null>} Refresh token
   */
  async getRefreshToken() {
    return this.getToken(config.TOKEN_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get the session token
   * @returns {Promise<string|null>} Session token
   */
  async getSessionToken() {
    return this.getToken(config.TOKEN_KEYS.SESSION_TOKEN);
  }

  /**
   * Store user data
   * @param {Object} userData - User information
   * @returns {Promise<boolean>} Success status
   */
  async storeUserData(userData) {
    try {
      const serialized = JSON.stringify(userData);
      return this.setToken(config.TOKEN_KEYS.USER_DATA, serialized);
    } catch (error) {
      console.error('Auth: Failed to store user data:', error);
      return false;
    }
  }

  /**
   * Get stored user data
   * @returns {Promise<Object|null>} User data
   */
  async getUserData() {
    try {
      const serialized = await this.getToken(config.TOKEN_KEYS.USER_DATA);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.error('Auth: Failed to parse user data:', error);
      return null;
    }
  }

  /**
   * Clear all stored authentication data
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    const keys = Object.values(config.TOKEN_KEYS);
    const results = await Promise.all(keys.map(key => this.deleteToken(key)));
    return results.every(r => r);
  }

  /**
   * Check if user has stored credentials
   * @returns {Promise<boolean>} Has credentials
   */
  async hasCredentials() {
    const accessToken = await this.getAccessToken();
    const sessionToken = await this.getSessionToken();
    return !!(accessToken || sessionToken);
  }

  // ===========================================
  // TOKEN PARSING UTILITIES
  // ===========================================

  /**
   * Parse a JWT token to extract payload
   * @param {string} token - JWT token
   * @returns {Object|null} Token payload or null
   */
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(payload);
    } catch (error) {
      console.error('Auth: Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   * @param {string} token - JWT token
   * @param {number} threshold - Time before expiry to consider expired (ms)
   * @returns {boolean} Is expired
   */
  isTokenExpired(token, threshold = 0) {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    return now >= (expiryTime - threshold);
  }

  /**
   * Get token expiry time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiry date or null
   */
  getTokenExpiry(token) {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }
}

// Export singleton instance
const tokenStore = new TokenStore();
module.exports = { tokenStore, TokenStore };
