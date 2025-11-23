const assert = require('assert');
const os = require('os');

console.log('=== macOS Input Method - Test Suite ===\n');

// Check platform
if (os.platform() !== 'darwin') {
    console.error('Error: Tests must run on macOS');
    process.exit(1);
}

// Try to load the module
let inputMethod;
try {
    const { MacOSInputMethod } = require('../index');
    inputMethod = new MacOSInputMethod();
    console.log('✓ Module loaded successfully\n');
} catch (error) {
    console.error('✗ Failed to load module:', error.message);
    console.error('\nPlease run: npm run build\n');
    process.exit(1);
}

// Test suite
const tests = {
    'Module exports': () => {
        const exports = require('../index');
        assert(exports.MacOSInputMethod, 'MacOSInputMethod class should be exported');
        assert(exports.createInputMethod, 'createInputMethod function should be exported');
        assert(exports.version, 'version should be exported');
        console.log(`  Version: ${exports.version}`);
    },

    'Instance creation': () => {
        const im = require('../index').createInputMethod();
        assert(im, 'Should create instance');
        assert(im.insertText, 'Should have insertText method');
        assert(im.getActiveApplication, 'Should have getActiveApplication method');
    },

    'Get active application': () => {
        const appInfo = inputMethod.getActiveApplication();
        assert(typeof appInfo === 'object', 'Should return object');
        assert(typeof appInfo.name === 'string', 'Should have name property');
        assert(typeof appInfo.bundleId === 'string', 'Should have bundleId property');
        assert(typeof appInfo.pid === 'number', 'Should have pid property');
        console.log(`  Active app: ${appInfo.name}`);
    },

    'Check text input status': () => {
        const isActive = inputMethod.isTextInputActive();
        assert(typeof isActive === 'boolean', 'Should return boolean');
        console.log(`  Text input active: ${isActive}`);
    },

    'Get cursor position': () => {
        const position = inputMethod.getCursorPosition();
        // Can be null if no text field is focused
        if (position) {
            assert(typeof position.x === 'number', 'Should have x coordinate');
            assert(typeof position.y === 'number', 'Should have y coordinate');
            console.log(`  Cursor at: (${position.x}, ${position.y})`);
        } else {
            console.log('  No cursor position available (no text field focused)');
        }
    },

    'Insert text method exists': () => {
        assert(typeof inputMethod.insertText === 'function', 'insertText should be a function');
        // Don't actually insert text during tests
    },

    'Insert text with typing method exists': () => {
        assert(typeof inputMethod.insertTextWithTyping === 'function', 'insertTextWithTyping should be a function');
    },

    'Get selected text method exists': () => {
        assert(typeof inputMethod.getSelectedText === 'function', 'getSelectedText should be a function');
    },

    'Replace selected text method exists': () => {
        assert(typeof inputMethod.replaceSelectedText === 'function', 'replaceSelectedText should be a function');
    },

    'Send keyboard shortcut method exists': () => {
        assert(typeof inputMethod.sendKeyboardShortcut === 'function', 'sendKeyboardShortcut should be a function');
    },

    'Start/stop monitoring methods exist': () => {
        assert(typeof inputMethod.startMonitoring === 'function', 'startMonitoring should be a function');
        assert(typeof inputMethod.stopMonitoring === 'function', 'stopMonitoring should be a function');
    },

    'Type checks': () => {
        // Test type validation
        try {
            inputMethod.insertText(123);
            assert(false, 'Should throw TypeError for non-string');
        } catch (error) {
            assert(error instanceof TypeError, 'Should throw TypeError');
        }

        try {
            inputMethod.replaceSelectedText(null);
            assert(false, 'Should throw TypeError for null');
        } catch (error) {
            assert(error instanceof TypeError, 'Should throw TypeError');
        }

        try {
            inputMethod.startMonitoring('not a function');
            assert(false, 'Should throw TypeError for non-function callback');
        } catch (error) {
            assert(error instanceof TypeError, 'Should throw TypeError');
        }
    }
};

// Run tests
let passed = 0;
let failed = 0;

for (const [name, test] of Object.entries(tests)) {
    try {
        test();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.error(`✗ ${name}`);
        console.error(`  ${error.message}`);
        failed++;
    }
}

console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
    process.exit(1);
}

console.log('\n✓ All tests passed!');
