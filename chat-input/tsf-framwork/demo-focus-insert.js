/**
 * Demo: Focus Last Window and Insert Text
 * This demonstrates the new "focus and insert" feature
 */

const tsf = require('./index');

async function demo() {
    console.log('🎯 Focus Last Window Demo\n');
    
    // Initialize
    console.log('Initializing TSF...');
    await tsf.initialize();
    console.log('✅ TSF Ready!\n');
    
    // Step 1: Show current focus
    console.log('Step 1: Checking current focus...');
    const currentFocus = await tsf.getFocusInfo();
    console.log(`📍 Currently focused: ${currentFocus.processName} - ${currentFocus.windowTitle}\n`);
    
    // Step 2: Ask user to focus an external app
    console.log('Step 2: 🎯 ACTION REQUIRED!');
    console.log('   Please click on a text editor (Notepad, browser, Word, etc.)');
    console.log('   You have 8 seconds...\n');
    
    await sleep(8000);
    
    // Step 3: Track that window
    console.log('Step 3: Tracking the focused window...');
    await tsf.setLastFocusedWindow();
    
    const trackedWindow = await tsf.getLastFocusedWindow();
    console.log(`✅ Tracked: ${trackedWindow.processName} - ${trackedWindow.windowTitle}\n`);
    
    // Step 4: Simulate user coming back to our app
    console.log('Step 4: Now imagine user switched back to our app...');
    console.log('   (In real usage, this happens when they focus your chat window)\n');
    
    // Step 5: Focus back and insert text
    console.log('Step 5: Focusing back to the tracked app and inserting text...');
    console.log('   You have 3 seconds to see it happen...\n');
    
    await sleep(3000);
    
    const testText = `✨ This was inserted automatically!

The text was sent from the demo script.
It focused back to ${trackedWindow.processName} and inserted this text at the caret position.

Time: ${new Date().toLocaleTimeString()}

This is exactly how your chat input button will work! 🚀`;

    console.log('📝 Focusing and inserting...');
    const success = await tsf.focusAndInsertText(testText);
    
    if (success) {
        console.log(`✅ SUCCESS! Text inserted into ${trackedWindow.processName}`);
        console.log('   Check your text editor to see the result!\n');
    } else {
        console.log('❌ FAILED to insert text\n');
    }
    
    // Step 6: Let's try again with a different message
    console.log('Step 6: Let\'s try one more time!');
    console.log('   Make sure the text editor is still focused...');
    console.log('   Inserting in 3 seconds...\n');
    
    await sleep(3000);
    
    const shortText = `Quick message #2 from TSF at ${new Date().toLocaleTimeString()} ⚡`;
    const success2 = await tsf.focusAndInsertText(shortText);
    
    console.log(success2 ? '✅ Done!' : '❌ Failed');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO COMPLETE!\n');
    console.log('How this works for your button:');
    console.log('1. User types in Chrome/Word/etc.');
    console.log('2. User opens your chat window (we track the previous app)');
    console.log('3. User gets AI response');
    console.log('4. User clicks your button');
    console.log('5. Your app focuses back to Chrome/Word and inserts the response!');
    console.log('\n💡 The user never has to manually switch windows or paste!');
    console.log('='.repeat(60));
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await tsf.cleanup();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
demo().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
