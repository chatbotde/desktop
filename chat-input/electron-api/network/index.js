const { net } = require('electron');
const { EventEmitter } = require('events');
const https = require('https');
const http = require('http');

/**
 * Network Status API Module
 * Monitors online/offline status and provides network information
 */

class NetworkMonitor extends EventEmitter {
  constructor() {
    super();
    this.isOnline = navigator ? navigator.onLine : true;
    this.checkInterval = null;
    this.checkUrls = [
      'https://www.google.com',
      'https://www.cloudflare.com',
      'https://1.1.1.1'
    ];
    this.lastCheckTime = null;
    this.lastCheckResult = null;
    this.listeners = new Set();
  }

  /**
   * Start monitoring network status
   * @param {number} interval - Check interval in milliseconds (default: 30000)
   */
  startMonitoring(interval = 30000) {
    // Initial check
    this.checkConnection();

    // Setup periodic checks
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, interval);
  }

  /**
   * Stop monitoring network status
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check internet connection
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    const wasOnline = this.isOnline;
    
    try {
      // Quick check using Electron's net module
      const online = await this.quickConnectivityCheck();
      
      this.isOnline = online;
      this.lastCheckTime = new Date();
      this.lastCheckResult = online;

      // Emit event if status changed
      if (wasOnline !== this.isOnline) {
        const event = this.isOnline ? 'online' : 'offline';
        this.emit(event, { timestamp: this.lastCheckTime });
        this.emit('status-changed', {
          online: this.isOnline,
          timestamp: this.lastCheckTime
        });
      }

      return this.isOnline;
    } catch (error) {
      console.error('Error checking connection:', error);
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Quick connectivity check using Electron's net module
   * @returns {Promise<boolean>}
   */
  async quickConnectivityCheck() {
    return new Promise((resolve) => {
      const request = net.request({
        method: 'HEAD',
        url: this.checkUrls[0]
      });

      const timeout = setTimeout(() => {
        request.abort();
        resolve(false);
      }, 5000);

      request.on('response', (response) => {
        clearTimeout(timeout);
        resolve(response.statusCode >= 200 && response.statusCode < 500);
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      request.end();
    });
  }

  /**
   * Detailed connectivity check with multiple endpoints
   * @returns {Promise<Object>}
   */
  async detailedConnectivityCheck() {
    const results = {
      online: false,
      reachable: [],
      unreachable: [],
      latency: {},
      timestamp: new Date()
    };

    for (const url of this.checkUrls) {
      const start = Date.now();
      const reachable = await this.checkUrl(url);
      const latency = Date.now() - start;

      results.latency[url] = latency;

      if (reachable) {
        results.reachable.push(url);
        results.online = true;
      } else {
        results.unreachable.push(url);
      }
    }

    return results;
  }

  /**
   * Check if a specific URL is reachable
   * @param {string} url - URL to check
   * @returns {Promise<boolean>}
   */
  async checkUrl(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, { timeout: 5000 }, (response) => {
        resolve(response.statusCode >= 200 && response.statusCode < 500);
      });

      request.on('error', () => resolve(false));
      request.on('timeout', () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Get current network status
   * @returns {Object}
   */
  getStatus() {
    return {
      online: this.isOnline,
      lastCheck: this.lastCheckTime,
      lastResult: this.lastCheckResult
    };
  }

  /**
   * Set custom check URLs
   * @param {Array<string>} urls - Array of URLs to check
   */
  setCheckUrls(urls) {
    if (Array.isArray(urls) && urls.length > 0) {
      this.checkUrls = urls;
    }
  }

  /**
   * Ping a host
   * @param {string} host - Host to ping
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<Object>}
   */
  async ping(host, timeout = 5000) {
    const start = Date.now();
    
    try {
      const reachable = await this.checkUrl(`https://${host}`);
      const latency = Date.now() - start;

      return {
        host,
        reachable,
        latency,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        host,
        reachable: false,
        latency: timeout,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Test download speed
   * @param {string} url - URL to test with
   * @param {number} duration - Test duration in ms
   * @returns {Promise<Object>}
   */
  async testSpeed(url = 'https://speed.cloudflare.com/__down?bytes=10000000', duration = 10000) {
    return new Promise((resolve) => {
      const start = Date.now();
      let downloaded = 0;

      const request = net.request(url);
      
      const timeout = setTimeout(() => {
        request.abort();
        const elapsed = Date.now() - start;
        const speedMbps = ((downloaded * 8) / (elapsed / 1000)) / 1000000;
        
        resolve({
          downloaded,
          duration: elapsed,
          speedMbps: speedMbps.toFixed(2),
          speedKBps: ((downloaded / 1024) / (elapsed / 1000)).toFixed(2)
        });
      }, duration);

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          downloaded += chunk.length;
        });

        response.on('end', () => {
          clearTimeout(timeout);
          const elapsed = Date.now() - start;
          const speedMbps = ((downloaded * 8) / (elapsed / 1000)) / 1000000;
          
          resolve({
            downloaded,
            duration: elapsed,
            speedMbps: speedMbps.toFixed(2),
            speedKBps: ((downloaded / 1024) / (elapsed / 1000)).toFixed(2)
          });
        });
      });

      request.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          error: error.message,
          downloaded: 0,
          duration: 0,
          speedMbps: '0',
          speedKBps: '0'
        });
      });

      request.end();
    });
  }

  /**
   * Get network interfaces information
   * @returns {Object}
   */
  getNetworkInterfaces() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const result = {};

    for (const [name, addresses] of Object.entries(interfaces)) {
      result[name] = addresses.map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
        mac: addr.mac
      }));
    }

    return result;
  }

  /**
   * Get active network interface
   * @returns {Object|null}
   */
  getActiveInterface() {
    const interfaces = this.getNetworkInterfaces();
    
    for (const [name, addresses] of Object.entries(interfaces)) {
      for (const addr of addresses) {
        if (!addr.internal && addr.family === 'IPv4') {
          return {
            name,
            ...addr
          };
        }
      }
    }

    return null;
  }
}

// Create singleton instance
const networkMonitor = new NetworkMonitor();

module.exports = {
  networkMonitor,
  
  // Convenience methods
  isOnline: () => networkMonitor.getStatus().online,
  checkConnection: () => networkMonitor.checkConnection(),
  detailedCheck: () => networkMonitor.detailedConnectivityCheck(),
  startMonitoring: (interval) => networkMonitor.startMonitoring(interval),
  stopMonitoring: () => networkMonitor.stopMonitoring(),
  getStatus: () => networkMonitor.getStatus(),
  setCheckUrls: (urls) => networkMonitor.setCheckUrls(urls),
  ping: (host, timeout) => networkMonitor.ping(host, timeout),
  testSpeed: (url, duration) => networkMonitor.testSpeed(url, duration),
  getNetworkInterfaces: () => networkMonitor.getNetworkInterfaces(),
  getActiveInterface: () => networkMonitor.getActiveInterface(),
  
  // Event handling
  on: (event, callback) => networkMonitor.on(event, callback),
  off: (event, callback) => networkMonitor.off(event, callback),
  once: (event, callback) => networkMonitor.once(event, callback)
};
