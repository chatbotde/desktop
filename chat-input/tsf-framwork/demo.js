/**
 * Interactive TSF Demo
 * This will insert text into whatever application you have focused
 */

const tsf = require('./index');

async function demo() {
    console.log('🚀 TSF Interactive Demo\n');
    
    // Initialize
    console.log('Initializing TSF...');
    await tsf.initialize();
    console.log('✅ TSF Ready!\n');
    
    // Show current focus
    const focusInfo = await tsf.getFocusInfo();
    console.log('📍 Currently focused:');
    console.log(`   Process: ${focusInfo.processName}`);
    console.log(`   Window: ${focusInfo.windowTitle}`);
    console.log(`   Editable: ${focusInfo.isEditable ? 'Yes ✅' : 'No ❌'}\n`);
    
    // Wait for user to focus something
    console.log('⏳ You have 5 seconds to focus a text editor (Notepad, browser, Word, etc.)...\n');
    await sleep(5000);
    
    // Get new focus
    const newFocus = await tsf.getFocusInfo();
    console.log('📍 Now focused:');
    console.log(`   Process: ${newFocus.processName}`);
    console.log(`   Window: ${newFocus.windowTitle}\n`);
    
    // Insert sample text
    const sampleText = `Hello from SonicPlane TSF! 🚀

This text was inserted programmatically using the Text Services Framework.
It works in ANY Windows application that accepts text input!

Current time: ${new Date().toLocaleString()}

Pretty cool, right? 😎`;

    console.log('📝 Inserting text...\n');
    const success = await tsf.insertText(sampleText);
    
    if (success) {
        console.log('✅ SUCCESS! Text was inserted into ' + newFocus.processName);
        console.log('   Check your focused application to see the result!\n');
    } else {
        console.log('❌ FAILED to insert text\n');
    }
    
    // Show TSF info
    const tsfAvailable = await tsf.isTsfAvailable();
    console.log(`📊 Method used: ${tsfAvailable ? 'TSF (native)' : 'Clipboard fallback'}\n`);
    
    // Another test with countdown
    console.log('🔄 Want to try again? Focus another app!\n');
    for (let i = 3; i > 0; i--) {
        console.log(`   ${i}...`);
        await sleep(1000);
    }
    
    const finalFocus = await tsf.getFocusInfo();
    console.log(`\n📍 Inserting into: ${finalFocus.processName}`);
    
    const shortText = `Quick test from TSF at ${new Date().toLocaleTimeString()} ⚡`;
    const success2 = await tsf.insertText(shortText);
    
    console.log(success2 ? '✅ Done!' : '❌ Failed');
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await tsf.cleanup();
    
    console.log('\n🎉 Demo complete! The TSF system works perfectly.');
    console.log('💡 You can now integrate this into your Electron app!');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
demo().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
