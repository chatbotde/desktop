/**
 * Web View Module
 * Manages WebContentsView for opening websites like YouTube
 */

const { createWebView } = require('./web-view-manager');
const { setupWebViewHandlers } = require('./handlers/web-view-handlers');

module.exports = {
  createWebView,
  setupWebViewHandlers
};
