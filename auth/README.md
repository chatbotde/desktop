# Buddy Authentication System

A desktop → web → desktop login used **only** on official SonicThinking builds.

Open-source forks and `npm run dev` use **local mode**: no login window, no guest-trial lockout. Users bring their own API keys.

| Mode | When | What users see |
|------|------|----------------|
| Local (default) | `auth/build-config.json` has `"hostedAuth": false` | Overlay opens; Settings → Account says “Local mode” |
| Hosted | Official CI, or `REQUIRE_AUTH=true` / `AUTH_SERVER_URL` | Login at sonicthinking.com (or your server) |

Force local: `SKIP_AUTH=true`. Enable hosted against your own backend: set `AUTH_SERVER_URL`.

Logic: `auth-mode.js`. Packaged official flag: `auth/build-config.json`.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Desktop App    │────▶│   Web Browser   │────▶│  Desktop App    │
│  (Electron)     │     │   (Auth Page)   │     │  (Authenticated)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │ 1. Open auth URL      │ 2. User logs in       │ 3. Redirect to
        │    in browser         │    on web             │    buddy://callback
        │                       │                       │
        ▼                       ▼                       ▼
   auth-service.js        Web Auth Pages          deep-link-handler.js
```

## File Structure

```
auth/
├── index.js              # Main entry point - exports all auth modules
├── config.js             # Configuration (URLs, tokens, settings)
├── auth-service.js       # Core authentication logic
├── token-store.js        # Secure token storage (keytar/keychain)
├── deep-link-handler.js  # Custom protocol (buddy://) handling
├── ipc-handlers.js       # IPC communication with renderer
├── auth-window.js        # Auth window UI management
├── auth-preload.js       # Preload script for renderer
├── auth.html             # Auth window UI
└── README.md             # This file
```

## Quick Start

### 1. Initialize Auth in main.js

```javascript
const { initializeAuth, authService, AuthWindow } = require('./auth');

// Initialize BEFORE app.whenReady() for deep links to work
initializeAuth().then((user) => {
  if (user) {
    console.log('User already logged in:', user.email);
  } else {
    // Show auth window
    const authWindow = new AuthWindow();
    authWindow.create();
  }
});
```

### 2. Configure Your Web Server URL

Edit `auth/config.js`:

```javascript
WEB_AUTH_URL: process.env.AUTH_SERVER_URL || 'http://localhost:3000',
```

### 3. Listen for Auth Events

```javascript
const { authService } = require('./auth');

authService.on('auth:success', (user) => {
  console.log('User logged in:', user);
  // Hide auth window, show main app
});

authService.on('auth:logout', () => {
  console.log('User logged out');
  // Show auth window
});

authService.on('auth:expired', () => {
  console.log('Session expired');
  // Prompt re-login
});
```

## API Reference

### AuthService

The main authentication service. Access via `authService` singleton or create new instance with `new AuthService()`.

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize()` | Initialize auth, restore session | `Promise<User\|null>` |
| `login(options)` | Start login flow | `void` |
| `signup(options)` | Start signup flow | `void` |
| `logout()` | Log out current user | `Promise<void>` |
| `getUser()` | Get current user | `User\|null` |
| `isLoggedIn()` | Check if authenticated | `boolean` |
| `getAccessToken()` | Get access token for API calls | `Promise<string\|null>` |
| `validateSession()` | Validate session with server | `Promise<boolean>` |
| `refreshTokens()` | Refresh auth tokens | `Promise<boolean>` |

#### Events

| Event | Data | Description |
|-------|------|-------------|
| `auth:success` | `User` | Login successful |
| `auth:logout` | - | User logged out |
| `auth:error` | `Error` | Auth error occurred |
| `auth:expired` | - | Session expired |
| `auth:restored` | `User` | Session restored on app start |
| `auth:required` | - | Authentication required |
| `auth:refreshed` | `User` | Tokens refreshed |

### TokenStore

Secure token storage using OS keychain.

```javascript
const { tokenStore } = require('./auth');

// Store tokens
await tokenStore.storeAuthTokens({
  accessToken: 'xxx',
  refreshToken: 'yyy',
});

// Get tokens
const token = await tokenStore.getAccessToken();

// Clear all tokens
await tokenStore.clearAll();
```

### Renderer API (auth-preload.js)

Available in renderer process via `window.authAPI`:

```javascript
// Actions
window.authAPI.login();
window.authAPI.signup();
window.authAPI.logout();

// Queries
const isAuth = await window.authAPI.isAuthenticated();
const user = await window.authAPI.getUser();
const token = await window.authAPI.getToken();

// Event listeners
window.authAPI.onAuthSuccess((user) => { /* ... */ });
window.authAPI.onAuthError((error) => { /* ... */ });
window.authAPI.onStateChange(({ isAuthenticated, user }) => { /* ... */ });
```

## Configuration

Edit `auth/config.js` to customize:

```javascript
module.exports = {
  // Web auth server URL
  WEB_AUTH_URL: 'https://your-auth-server.com',
  
  // Auth endpoints
  AUTH_ENDPOINTS: {
    LOGIN: '/auth/desktop-login',
    SIGNUP: '/auth/desktop-signup',
    // ...
  },
  
  // Custom protocol (buddy://)
  PROTOCOL: 'buddy',
  
  // Token storage
  KEYTAR_SERVICE: 'buddy-auth',
  
  // Session settings
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};
```

## Web Server Setup

Your web server needs these endpoints:

### Required Pages

1. `/auth/desktop-login` - Login page for desktop
2. `/auth/desktop-signup` - Signup page for desktop
3. `/auth/desktop-callback` - OAuth callback handler

### Required API Endpoints

1. `GET /api/auth/verify-token` - Verify token validity
2. `POST /api/auth/refresh-token` - Refresh expired tokens
3. `POST /api/auth/desktop-token` - Generate desktop tokens
4. `GET /api/auth/user-info` - Get user information

See the `webbuddy/app/auth/` and `webbuddy/app/api/auth/` directories for example implementations.

## Security Considerations

1. **Token Storage**: Tokens are stored in the OS keychain (Keychain on macOS, Credential Manager on Windows)

2. **CSRF Protection**: State parameter is used to prevent CSRF attacks

3. **Token Expiry**: Access tokens expire after 1 hour, refresh tokens after 30 days

4. **Secure Communication**: Always use HTTPS in production

5. **Deep Link Validation**: Only `buddy://` protocol URLs are accepted

## Troubleshooting

### Protocol Not Registered

If the custom protocol isn't working:

```javascript
const { app } = require('electron');

// Check if registered
const isRegistered = app.isDefaultProtocolClient('buddy');
console.log('Protocol registered:', isRegistered);

// Force re-register
app.setAsDefaultProtocolClient('buddy');
```

### Token Storage Failing

If keytar isn't available:

```bash
npm install keytar
npm rebuild keytar
```

The system falls back to encrypted file storage if keytar fails.

### Session Not Persisting

Ensure you're calling `initializeAuth()` early in the app lifecycle:

```javascript
// Call BEFORE app.whenReady()
initializeAuth();

app.whenReady().then(() => {
  // Auth already initialized
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVER_URL` | Web auth server URL | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `production` |

## Migration Guide

### From Basic Auth Window

If you had the basic auth window before:

```javascript
// Old
const { AuthWindow } = require('./auth');
const authWindow = new AuthWindow();
authWindow.create();

// New
const { initializeAuth, AuthWindow, authService } = require('./auth');

// Initialize first
await initializeAuth();

// Then create window if needed
if (!authService.isLoggedIn()) {
  const authWindow = new AuthWindow();
  authWindow.create();
}
```

## Contributing

When modifying the auth system:

1. Keep all auth logic in the `auth/` directory
2. Update this README for any API changes
3. Add JSDoc comments for new functions
4. Test on all platforms (Windows, macOS, Linux)
