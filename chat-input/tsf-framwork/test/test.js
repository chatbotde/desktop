/**
 * Test script for TSF Framework
 * Run with: node test.js
 */

const tsf = require('../index');

async function runTests() {
    console.log('=== TSF Framework Test ===\n');

    // Test 1: Check if module is available
    console.log('Test 1: Module availability');
    const available = tsf.isAvailable();
    console.log('Module available:', available);
    if (!available) {
        console.error('❌ Native module not loaded. Run "npm install" first.');
        return;
    }
    console.log('✅ Passed\n');

    // Test 2: Initialize
    console.log('Test 2: Initialize TSF');
    const initialized = await tsf.initialize();
    console.log('Initialized:', initialized);
    if (!initialized) {
        console.error('❌ Failed to initialize TSF');
        return;
    }
    console.log('✅ Passed\n');

    // Test 3: Get focus info
    console.log('Test 3: Get focus information');
    const focusInfo = await tsf.getFocusInfo();
    console.log('Focus info:', JSON.stringify(focusInfo, null, 2));
    console.log('✅ Passed\n');

    // Test 4: Check if window is editable
    console.log('Test 4: Check if window is editable');
    const isEditable = await tsf.isEditableWindow();
    console.log('Is editable:', isEditable);
    console.log('✅ Passed\n');

    // Test 5: Check TSF availability
    console.log('Test 5: Check TSF availability');
    const tsfAvailable = await tsf.isTsfAvailable();
    console.log('TSF available:', tsfAvailable);
    console.log('✅ Passed\n');

    // Test 6: Interactive text insertion test
    console.log('Test 6: Text insertion (interactive)');
    console.log('⚠️  Please focus a text editor (Notepad, browser, etc.) within 5 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Attempting to insert test text...');
    const testText = 'Hello from TSF Framework! 🚀';
    const insertSuccess = await tsf.insertText(testText);
    console.log('Insert success:', insertSuccess);
    
    if (insertSuccess) {
        console.log('✅ Text should now appear in the focused application');
    } else {
        console.log('⚠️  Text insertion failed. The window may not be editable.');
    }
    console.log();

    // Test 7: Fallback method test
    console.log('Test 7: Fallback insertion method');
    console.log('⚠️  Please focus a text editor within 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Attempting fallback insertion...');
    const fallbackSuccess = await tsf.insertTextFallback('Fallback method test! 📋');
    console.log('Fallback success:', fallbackSuccess);
    console.log('✅ Passed\n');

    // Test 8: Cleanup
    console.log('Test 8: Cleanup');
    await tsf.cleanup();
    console.log('✅ Passed\n');

    console.log('=== All tests completed ===');
}

// Run tests
runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
