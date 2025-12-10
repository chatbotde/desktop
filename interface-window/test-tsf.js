/**
 * Test TSF - Simple test to verify text insertion works
 * 
 * Usage:
 * 1. Open Notepad or any text editor
 * 2. Run: node test-tsf.js
 * 3. Click on Notepad within 5 seconds
 * 4. Text will be inserted!
 */

const path = require('path');

// Load the TSF native module
const tsfPath = path.join(__dirname, 'os-system', 'tsf-framwork');
console.log('Loading TSF from:', tsfPath);

let tsf;
try {
    tsf = require(tsfPath);
    console.log('✅ TSF module loaded successfully');
} catch (err) {
    console.error('❌ Failed to load TSF module:', err);
    process.exit(1);
}

async function testInsert() {
    console.log('\n🧪 TSF Insert Test\n');
    console.log('='.repeat(50));

    // Step 1: Check if module is available
    console.log('1. Checking if TSF is available...');
    const isAvailable = tsf.isAvailable();
    console.log(`   Available: ${isAvailable}`);

    if (!isAvailable) {
        console.error('❌ TSF native module is not available');
        process.exit(1);
    }

    // Step 2: Initialize TSF
    console.log('\n2. Initializing TSF...');
    const initSuccess = await tsf.initialize();
    console.log(`   Initialized: ${initSuccess}`);

    if (!initSuccess) {
        console.error('❌ Failed to initialize TSF');
        process.exit(1);
    }

    // Step 3: Tell user to focus another app
    console.log('\n3. 🎯 ACTION REQUIRED!');
    console.log('   Open Notepad or any text editor and click in it.');
    console.log('   You have 5 seconds...\n');

    await sleep(5000);

    // Step 4: Get focus info and track the window
    console.log('4. Tracking current focused window...');
    const focusInfo = await tsf.getFocusInfo();
    console.log(`   Window: ${focusInfo.windowTitle}`);
    console.log(`   Process: ${focusInfo.processName}`);
    console.log(`   Editable: ${focusInfo.isEditable}`);

    // Store this window as target
    await tsf.setLastFocusedWindow();
    console.log('   ✅ Window captured!');

    // Step 5: Insert text
    console.log('\n5. Inserting text in 2 seconds...');
    await sleep(2000);

    const testText = `Hello from TSF! 🚀
This text was inserted automatically at ${new Date().toLocaleTimeString()}
The Insert button will work just like this!`;

    console.log('   📝 Inserting text...');
    const success = await tsf.focusAndInsertText(testText);

    if (success) {
        console.log('\n✅ SUCCESS! Text was inserted!');
        console.log('   Check your text editor to see the result.');
    } else {
        console.log('\n⚠️  focusAndInsertText returned false');
        console.log('   Trying fallback method...');

        // Try direct fallback
        const fallbackSuccess = await tsf.insertTextFallback(testText);
        if (fallbackSuccess) {
            console.log('✅ Fallback succeeded!');
        } else {
            console.log('❌ Fallback also failed');
        }
    }

    // Cleanup
    console.log('\n6. Cleaning up...');
    await tsf.cleanup();
    console.log('   Done!\n');
    console.log('='.repeat(50));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testInsert().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
