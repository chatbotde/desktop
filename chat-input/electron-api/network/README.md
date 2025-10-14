# Network Status API

Real-time network connectivity monitoring and testing for Electron applications.

## Features

- 🌐 Online/offline detection
- 📡 Real-time status monitoring
- 🔄 Automatic connectivity checks
- 📊 Network speed testing
- 🏓 Ping functionality
- 🔌 Network interface information
- ⚡ Event-driven updates
- 🎯 Multiple endpoint testing

## Quick Start

### Main Process Setup

```javascript
const { app } = require('electron');
const network = require('./electron-api/network');

app.whenReady().then(() => {
  // Start monitoring (checks every 30 seconds)
  network.startMonitoring(30000);

  // Listen for status changes
  network.on('online', (data) => {
    console.log('Connected to internet:', data.timestamp);
  });

  network.on('offline', (data) => {
    console.log('Lost internet connection:', data.timestamp);
  });

  network.on('status-changed', (data) => {
    console.log('Network status changed:', data.online);
  });
});

app.on('before-quit', () => {
  network.stopMonitoring();
});
```

### IPC Setup

```javascript
// main.js
const { ipcMain } = require('electron');
const network = require('./electron-api/network');

ipcMain.handle('network:is-online', () => {
  return network.isOnline();
});

ipcMain.handle('network:check', async () => {
  return await network.checkConnection();
});

ipcMain.handle('network:detailed-check', async () => {
  return await network.detailedCheck();
});

ipcMain.handle('network:ping', async (event, host) => {
  return await network.ping(host);
});

ipcMain.handle('network:test-speed', async () => {
  return await network.testSpeed();
});

ipcMain.handle('network:get-interfaces', () => {
  return network.getNetworkInterfaces();
});

// Forward events to renderer
network.on('status-changed', (data) => {
  mainWindow.webContents.send('network:status-changed', data);
});
```

### Preload Script

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('network', {
  isOnline: () => ipcRenderer.invoke('network:is-online'),
  check: () => ipcRenderer.invoke('network:check'),
  detailedCheck: () => ipcRenderer.invoke('network:detailed-check'),
  ping: (host) => ipcRenderer.invoke('network:ping', host),
  testSpeed: () => ipcRenderer.invoke('network:test-speed'),
  getInterfaces: () => ipcRenderer.invoke('network:get-interfaces'),
  
  onStatusChanged: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('network:status-changed', listener);
    return () => ipcRenderer.removeListener('network:status-changed', listener);
  }
});
```

### Renderer Usage

```javascript
// renderer.js
// Check if online
const online = await window.network.isOnline();
console.log('Online:', online);

// Check connection
const connected = await window.network.check();
console.log('Connected:', connected);

// Listen for status changes
const unsubscribe = window.network.onStatusChanged((data) => {
  console.log('Network status:', data.online ? 'Online' : 'Offline');
  updateUI(data.online);
});
```

## API Reference

### Status Checking

#### `isOnline()`
Get current online status (synchronous).

```javascript
const online = network.isOnline();
console.log('Online:', online);
```

#### `checkConnection()`
Check internet connectivity (async).

```javascript
const connected = await network.checkConnection();
console.log('Connected:', connected);
```

This performs a quick HEAD request to verify connectivity.

#### `detailedCheck()`
Perform detailed connectivity check with multiple endpoints.

```javascript
const result = await network.detailedCheck();

console.log('Online:', result.online);
console.log('Reachable:', result.reachable);
console.log('Unreachable:', result.unreachable);
console.log('Latency:', result.latency);

// Example output:
// {
//   online: true,
//   reachable: ['https://www.google.com', 'https://www.cloudflare.com'],
//   unreachable: [],
//   latency: {
//     'https://www.google.com': 45,
//     'https://www.cloudflare.com': 23
//   },
//   timestamp: Date
// }
```

#### `getStatus()`
Get current status object.

```javascript
const status = network.getStatus();
console.log(status);

// Returns:
// {
//   online: true,
//   lastCheck: Date,
//   lastResult: true
// }
```

### Monitoring

#### `startMonitoring(interval)`
Start automatic network monitoring.

```javascript
// Check every 30 seconds (default)
network.startMonitoring(30000);

// Check every 10 seconds
network.startMonitoring(10000);

// Check every minute
network.startMonitoring(60000);
```

#### `stopMonitoring()`
Stop automatic monitoring.

```javascript
network.stopMonitoring();
```

### Network Testing

#### `ping(host, timeout)`
Ping a specific host.

```javascript
const result = await network.ping('google.com');
console.log('Latency:', result.latency, 'ms');
console.log('Reachable:', result.reachable);

// With custom timeout
const result = await network.ping('example.com', 10000);

// Returns:
// {
//   host: 'google.com',
//   reachable: true,
//   latency: 45,
//   timestamp: Date
// }
```

#### `testSpeed(url, duration)`
Test download speed.

```javascript
const result = await network.testSpeed();
console.log('Speed:', result.speedMbps, 'Mbps');
console.log('Downloaded:', result.downloaded, 'bytes');

// Custom test
const result = await network.testSpeed(
  'https://speed.cloudflare.com/__down?bytes=10000000',
  10000  // 10 seconds
);

// Returns:
// {
//   downloaded: 10000000,
//   duration: 10000,
//   speedMbps: '8.00',
//   speedKBps: '1000.00'
// }
```

### Network Interfaces

#### `getNetworkInterfaces()`
Get all network interfaces.

```javascript
const interfaces = network.getNetworkInterfaces();
console.log(interfaces);

// Returns:
// {
//   'Wi-Fi': [
//     {
//       address: '192.168.1.100',
//       family: 'IPv4',
//       internal: false,
//       mac: 'aa:bb:cc:dd:ee:ff'
//     },
//     {
//       address: 'fe80::1',
//       family: 'IPv6',
//       internal: false,
//       mac: 'aa:bb:cc:dd:ee:ff'
//     }
//   ],
//   'Ethernet': [...]
// }
```

#### `getActiveInterface()`
Get the active network interface.

```javascript
const active = network.getActiveInterface();
console.log('Active interface:', active);

// Returns:
// {
//   name: 'Wi-Fi',
//   address: '192.168.1.100',
//   family: 'IPv4',
//   internal: false,
//   mac: 'aa:bb:cc:dd:ee:ff'
// }
```

### Configuration

#### `setCheckUrls(urls)`
Set custom URLs for connectivity checks.

```javascript
network.setCheckUrls([
  'https://www.google.com',
  'https://www.cloudflare.com',
  'https://1.1.1.1'
]);
```

## Events

The network monitor emits the following events:

### `'online'`
Emitted when connection is established.

```javascript
network.on('online', (data) => {
  console.log('Connected at:', data.timestamp);
});
```

### `'offline'`
Emitted when connection is lost.

```javascript
network.on('offline', (data) => {
  console.log('Disconnected at:', data.timestamp);
  // Show offline notification
  // Save unsaved work
  // Pause uploads
});
```

### `'status-changed'`
Emitted whenever status changes.

```javascript
network.on('status-changed', (data) => {
  console.log('Status:', data.online ? 'Online' : 'Offline');
  console.log('Changed at:', data.timestamp);
});
```

### Event Management

```javascript
// Add listener
const handler = (data) => console.log(data);
network.on('online', handler);

// Remove listener
network.off('online', handler);

// One-time listener
network.once('online', (data) => {
  console.log('Connected once');
});
```

## Complete Example

```javascript
// main.js
const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const network = require('./electron-api/network');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

function setupNetworkHandlers() {
  // IPC handlers
  ipcMain.handle('network:is-online', () => network.isOnline());
  ipcMain.handle('network:check', () => network.checkConnection());
  ipcMain.handle('network:detailed-check', () => network.detailedCheck());
  ipcMain.handle('network:ping', (e, host) => network.ping(host));
  ipcMain.handle('network:test-speed', () => network.testSpeed());
  ipcMain.handle('network:get-interfaces', () => network.getNetworkInterfaces());
  ipcMain.handle('network:get-active', () => network.getActiveInterface());

  // Start monitoring
  network.startMonitoring(30000);

  // Handle status changes
  network.on('online', (data) => {
    console.log('✓ Internet connected');
    
    new Notification({
      title: 'Back Online',
      body: 'Internet connection restored'
    }).show();

    if (mainWindow) {
      mainWindow.webContents.send('network:status-changed', {
        online: true,
        timestamp: data.timestamp
      });
    }
  });

  network.on('offline', (data) => {
    console.log('✗ Internet disconnected');
    
    new Notification({
      title: 'No Internet',
      body: 'Internet connection lost'
    }).show();

    if (mainWindow) {
      mainWindow.webContents.send('network:status-changed', {
        online: false,
        timestamp: data.timestamp
      });
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupNetworkHandlers();
});

app.on('before-quit', () => {
  network.stopMonitoring();
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('network', {
  isOnline: () => ipcRenderer.invoke('network:is-online'),
  check: () => ipcRenderer.invoke('network:check'),
  detailedCheck: () => ipcRenderer.invoke('network:detailed-check'),
  ping: (host) => ipcRenderer.invoke('network:ping', host),
  testSpeed: () => ipcRenderer.invoke('network:test-speed'),
  getInterfaces: () => ipcRenderer.invoke('network:get-interfaces'),
  getActiveInterface: () => ipcRenderer.invoke('network:get-active'),
  
  onStatusChanged: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('network:status-changed', listener);
    return () => ipcRenderer.removeListener('network:status-changed', listener);
  }
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Network Status Monitor</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      margin: 0;
    }
    
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .online { background: #10b981; }
    .offline { background: #ef4444; }
    
    .card {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
    }
    
    button {
      padding: 10px 20px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
    }
    
    button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <h1>Network Status Monitor</h1>

  <div class="card">
    <h2>
      <span id="statusIndicator" class="status-indicator"></span>
      <span id="statusText">Checking...</span>
    </h2>
    <p id="lastCheck">Last check: Never</p>
  </div>

  <div class="card">
    <h3>Actions</h3>
    <button id="btnCheck">Check Connection</button>
    <button id="btnDetailed">Detailed Check</button>
    <button id="btnPing">Ping Google</button>
    <button id="btnSpeed">Test Speed</button>
    <button id="btnInterfaces">Show Interfaces</button>
  </div>

  <div id="results"></div>

  <script>
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const lastCheck = document.getElementById('lastCheck');
    const results = document.getElementById('results');

    function updateStatus(online) {
      statusIndicator.className = `status-indicator ${online ? 'online' : 'offline'}`;
      statusText.textContent = online ? 'Online' : 'Offline';
    }

    function log(message) {
      results.innerHTML += `<div class="card"><pre>${JSON.stringify(message, null, 2)}</pre></div>`;
    }

    // Check initial status
    (async () => {
      const online = await window.network.isOnline();
      updateStatus(online);
    })();

    // Listen for status changes
    window.network.onStatusChanged((data) => {
      updateStatus(data.online);
      lastCheck.textContent = `Last check: ${data.timestamp.toLocaleString()}`;
    });

    // Button handlers
    document.getElementById('btnCheck').addEventListener('click', async () => {
      const online = await window.network.check();
      updateStatus(online);
      log({ action: 'Quick check', online });
    });

    document.getElementById('btnDetailed').addEventListener('click', async () => {
      const result = await window.network.detailedCheck();
      log({ action: 'Detailed check', ...result });
    });

    document.getElementById('btnPing').addEventListener('click', async () => {
      const result = await window.network.ping('google.com');
      log({ action: 'Ping', ...result });
    });

    document.getElementById('btnSpeed').addEventListener('click', async () => {
      log({ action: 'Speed test', status: 'Testing...' });
      const result = await window.network.testSpeed();
      log({ action: 'Speed test', ...result });
    });

    document.getElementById('btnInterfaces').addEventListener('click', async () => {
      const interfaces = await window.network.getInterfaces();
      const active = await window.network.getActiveInterface();
      log({ action: 'Network interfaces', active, interfaces });
    });
  </script>
</body>
</html>
```

## Use Cases

### Auto-Save Before Disconnect

```javascript
network.on('offline', () => {
  saveAllUnsavedWork();
  pauseCloudSync();
  showOfflineNotification();
});

network.on('online', () => {
  resumeCloudSync();
  showOnlineNotification();
});
```

### Retry Failed Requests

```javascript
async function makeRequest() {
  if (!network.isOnline()) {
    throw new Error('No internet connection');
  }
  
  // Make request...
}
```

### Quality Adaptation

```javascript
const speedResult = await network.testSpeed();
const speedMbps = parseFloat(speedResult.speedMbps);

if (speedMbps < 1) {
  // Use low quality
  setVideoQuality('360p');
} else if (speedMbps < 5) {
  // Use medium quality
  setVideoQuality('720p');
} else {
  // Use high quality
  setVideoQuality('1080p');
}
```

## Performance Considerations

- Default check interval: 30 seconds (adjustable)
- Network checks timeout after 5 seconds
- Speed tests use 10 seconds by default
- Multiple endpoint checking for reliability
- Minimal CPU usage during idle monitoring

## Browser Compatibility

This module uses Electron's `net` API and Node.js networking. For web browsers, use the standard `navigator.onLine` and online/offline events.
