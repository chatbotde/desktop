try {
  const Store = require('electron-store');
  console.log('electron-store loaded');
} catch (e) {
  console.error('Failed to load electron-store:', e.message);
}

try {
  const { v4: uuidv4 } = require('uuid');
  console.log('uuid loaded:', uuidv4());
} catch (e) {
  console.error('Failed to load uuid:', e.message);
}

try {
  const crypto = require('crypto');
  if (crypto.randomUUID) {
    console.log('crypto.randomUUID:', crypto.randomUUID());
  } else {
    console.log('crypto.randomUUID not available');
  }
} catch (e) {
  console.error('Failed to load crypto:', e.message);
}
