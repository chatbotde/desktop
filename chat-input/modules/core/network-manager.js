import { dom } from './dom.js';

class NetworkManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.checkInterval = null;
    }

    init() {
        window.addEventListener('online', () => this.updateStatus(true));
        window.addEventListener('offline', () => this.updateStatus(false));
        
        // Initial check
        this.updateStatus(navigator.onLine);

        // Periodic check (optional, but good for double checking)
        this.checkInterval = setInterval(() => {
            this.checkConnection();
        }, 30000);
    }

    async checkConnection() {
        if (!navigator.onLine) {
            this.updateStatus(false);
            return false;
        }

        try {
            // Simple fetch to check if we can really reach the internet
            // Using a no-cors request to a reliable public CDN
            await fetch('https://www.google.com/favicon.ico', { 
                mode: 'no-cors', 
                cache: 'no-store' 
            });
            this.updateStatus(true);
            return true;
        } catch (e) {
            // If fetch fails, we might be offline or have network issues
            // But since no-cors doesn't throw on network error usually unless completely offline
            // We rely mostly on navigator.onLine, but this catch block is for safety
            this.updateStatus(false);
            return false;
        }
    }

    updateStatus(online) {
        this.isOnline = online;
        const warningEl = dom.networkWarning;
        const sendButton = dom.sendButton;
        
        if (warningEl) {
            if (online) {
                warningEl.style.display = 'none';
                warningEl.classList.remove('visible');
            } else {
                warningEl.style.display = 'flex';
                // Small delay to allow display:flex to apply before adding class for transition
                requestAnimationFrame(() => {
                    warningEl.classList.add('visible');
                });
            }
        }

        if (sendButton) {
            if (online) {
                sendButton.classList.remove('disabled-offline');
                sendButton.title = "Send message";
            } else {
                sendButton.classList.add('disabled-offline');
                sendButton.title = "No internet connection";
            }
        }
    }

    isNetworkAvailable() {
        return this.isOnline;
    }
}

export const networkManager = new NetworkManager();
