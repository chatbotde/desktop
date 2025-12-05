/**
 * Message Handlers
 * Handles PostMessage communication with iframes
 * Following Single Responsibility Principle (SRP)
 */

import { clickthroughService } from '../services/clickthrough-service.js';
import { stateManager } from '../core/state-manager.js';
import { getAllIframes } from '../utils/dom-helpers.js';

class MessageHandlers {
  /**
   * Handle messages from iframes
   * @param {MessageEvent} event - Message event
   */
  handleMessage(event) {
    if (!event.data || event.data.type !== 'clickthrough-control') {
      return;
    }
    
    const { action } = event.data;
    
    console.log('[ClickThrough] Received message from iframe:', action);
    
    switch (action) {
      case 'enable':
        clickthroughService.enable();
        this.broadcastState();
        break;
      case 'disable':
        clickthroughService.disable();
        this.broadcastState();
        break;
      case 'toggle':
        clickthroughService.toggle();
        this.broadcastState();
        break;
      case 'get-state':
        this._sendStateToIframe(event.source);
        this.broadcastState();
        break;
      default:
        console.warn('[ClickThrough] Unknown action from iframe:', action);
    }
  }

  /**
   * Broadcast current state to all iframes
   */
  broadcastState() {
    const iframes = getAllIframes();
    
    if (iframes.length === 0) return;
    
    const state = {
      type: 'clickthrough-state',
      enabled: stateManager.isEnabled()
    };
    
    iframes.forEach(iframe => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(state, '*');
        }
      } catch (error) {
        console.debug('[ClickThrough] Could not send state to iframe:', error);
      }
    });
  }

  /**
   * Send state to specific iframe window
   * @private
   * @param {Window} targetWindow - Target iframe window
   */
  _sendStateToIframe(targetWindow) {
    if (!targetWindow) return;
    
    const state = {
      type: 'clickthrough-state',
      enabled: stateManager.isEnabled()
    };
    
    try {
      targetWindow.postMessage(state, '*');
    } catch (error) {
      console.debug('[ClickThrough] Could not send state to iframe:', error);
    }
  }
}

// Export singleton instance
export const messageHandlers = new MessageHandlers();
