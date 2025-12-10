const { MacOSInputMethod } = require('../index');

console.log('=== macOS Input Method - Basic Usage Example ===\n');

// Create input method instance
const inputMethod = new MacOSInputMethod();

// Check accessibility permissions first
async function checkPermissions() {
    console.log('1. Checking accessibility permissions...');
    const hasPermission = inputMethod.controller.checkAccessibilityPermissions();
    
    if (!hasPermission) {
        console.log('⚠️  Accessibility permissions required!');
        console.log('Please grant accessibility permissions in System Preferences.');
        return false;
    }
    
    console.log('✓ Accessibility permissions granted\n');
    return true;
}

// Get active application info
async function testActiveApp() {
    console.log('2. Getting active application info...');
    const appInfo = inputMethod.getActiveApplication();
    console.log('Active App:', appInfo);
    console.log('');
}

// Check if text input is active
async function testTextInputStatus() {
    console.log('3. Checking text input status...');
    const isActive = inputMethod.isTextInputActive();
    console.log('Text input active:', isActive);
    console.log('');
}

// Insert text example
async function testTextInsertion() {
    console.log('4. Testing text insertion...');
    console.log('Please click on a text field within 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = inputMethod.insertText('Hello from macOS Input Method!');
    console.log('Insert text result:', success ? '✓ Success' : '✗ Failed');
    console.log('');
}

// Insert text with typing effect
async function testTypingEffect() {
    console.log('5. Testing typing effect...');
    console.log('Please click on a text field within 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = await inputMethod.insertTextWithTyping('Typing simulation...', 100);
    console.log('Typing effect result:', success ? '✓ Success' : '✗ Failed');
    console.log('');
}

// Get cursor position
async function testCursorPosition() {
    console.log('6. Getting cursor position...');
    const position = inputMethod.getCursorPosition();
    console.log('Cursor position:', position);
    console.log('');
}

// Test selected text operations
async function testSelectedText() {
    console.log('7. Testing selected text operations...');
    console.log('Please select some text within 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const selectedText = inputMethod.getSelectedText();
    console.log('Selected text:', selectedText);
    
    if (selectedText) {
        console.log('Replacing with uppercase...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const success = inputMethod.replaceSelectedText(selectedText.toUpperCase());
        console.log('Replace result:', success ? '✓ Success' : '✗ Failed');
    }
    console.log('');
}

// Run all tests
async function runTests() {
    try {
        const hasPermission = await checkPermissions();
        
        if (!hasPermission) {
            console.log('\nPlease grant accessibility permissions and run again.');
            return;
        }
        
        await testActiveApp();
        await testTextInputStatus();
        await testTextInsertion();
        await testTypingEffect();
        await testCursorPosition();
        await testSelectedText();
        
        console.log('=== All tests completed! ===');
    } catch (error) {
        console.error('Error during tests:', error);
    }
}

// Run the tests
runTests();
