const { MacOSInputMethod } = require('../index');

console.log('=== macOS Input Method - Custom IME Demo ===\n');
console.log('This demonstrates building a custom Input Method Editor\n');

const inputMethod = new MacOSInputMethod();
const compositions = new Map();

// Example: Pinyin to Chinese character mappings (simplified)
const pinyinMap = {
    'ni': '你',
    'hao': '好',
    'ma': '吗',
    'wo': '我',
    'shi': '是',
    'de': '的',
    'zai': '在',
    'jian': '见',
    'xie': '谢',
    'bu': '不',
    'ke': '可',
    'yi': '以',
    'tai': '太',
    'hen': '很',
    'dui': '对'
};

// Example: Emoji shortcuts
const emojiMap = {
    ':smile:': '😊',
    ':laugh:': '😂',
    ':heart:': '❤️',
    ':fire:': '🔥',
    ':star:': '⭐',
    ':check:': '✅',
    ':wave:': '👋',
    ':thumbs:': '👍'
};

// Example: Text expansion
const snippets = {
    'addr': '123 Main Street, San Francisco, CA 94102',
    'email': 'example@email.com',
    'phone': '+1 (555) 123-4567',
    'date': () => new Date().toLocaleDateString(),
    'time': () => new Date().toLocaleTimeString()
};

let currentBuffer = '';
let lastKeyTime = Date.now();

/**
 * Custom IME - Pinyin Input
 */
function handlePinyinInput(character) {
    currentBuffer += character;
    
    // Check if buffer matches any pinyin
    if (pinyinMap[currentBuffer]) {
        const chinese = pinyinMap[currentBuffer];
        
        // Delete the pinyin text
        for (let i = 0; i < currentBuffer.length; i++) {
            inputMethod.sendKeyboardShortcut('delete', {});
        }
        
        // Insert Chinese character
        inputMethod.insertText(chinese);
        currentBuffer = '';
        
        console.log(`Converted: ${currentBuffer} → ${chinese}`);
    }
    
    // Clear buffer if no match after 3 chars
    if (currentBuffer.length > 3) {
        currentBuffer = '';
    }
}

/**
 * Emoji Shortcode Expansion
 */
function handleEmojiShortcode(character) {
    if (character === ':') {
        // Start or end emoji shortcode
        const lastColon = currentBuffer.lastIndexOf(':');
        
        if (lastColon >= 0) {
            const shortcode = currentBuffer.substring(lastColon);
            const emoji = emojiMap[shortcode + ':'];
            
            if (emoji) {
                // Delete shortcode
                for (let i = 0; i <= shortcode.length; i++) {
                    inputMethod.sendKeyboardShortcut('delete', {});
                }
                
                // Insert emoji
                inputMethod.insertText(emoji);
                currentBuffer = '';
                
                console.log(`Emoji: ${shortcode}: → ${emoji}`);
            }
        }
    }
}

/**
 * Text Snippet Expansion
 */
function handleSnippetExpansion(character) {
    if (character === ' ') {
        // Check if last word is a snippet trigger
        const words = currentBuffer.trim().split(' ');
        const lastWord = words[words.length - 1];
        
        if (snippets[lastWord]) {
            // Delete trigger word
            for (let i = 0; i < lastWord.length; i++) {
                inputMethod.sendKeyboardShortcut('delete', {});
            }
            
            // Get snippet value
            const value = typeof snippets[lastWord] === 'function' 
                ? snippets[lastWord]() 
                : snippets[lastWord];
            
            // Insert expanded text
            inputMethod.insertText(value);
            currentBuffer = '';
            
            console.log(`Snippet: ${lastWord} → ${value}`);
        }
    }
}

/**
 * Auto-correction
 */
const corrections = {
    'teh': 'the',
    'recieve': 'receive',
    'occured': 'occurred',
    'seperate': 'separate',
    'definately': 'definitely'
};

function handleAutoCorrect(character) {
    if (character === ' ') {
        const words = currentBuffer.trim().split(' ');
        const lastWord = words[words.length - 1];
        
        if (corrections[lastWord]) {
            const corrected = corrections[lastWord];
            
            // Delete incorrect word
            for (let i = 0; i < lastWord.length; i++) {
                inputMethod.sendKeyboardShortcut('delete', {});
            }
            
            // Insert corrected word
            inputMethod.insertText(corrected);
            
            console.log(`Auto-corrected: ${lastWord} → ${corrected}`);
        }
    }
}

/**
 * Main input event handler
 */
function handleKeyEvent(event) {
    const now = Date.now();
    
    // Reset buffer if too much time passed
    if (now - lastKeyTime > 2000) {
        currentBuffer = '';
    }
    lastKeyTime = now;
    
    // Get the character
    const char = event.characters;
    
    if (!char || event.modifiers.command || event.modifiers.control) {
        return; // Skip special keys
    }
    
    // Add to buffer
    if (char.match(/[a-zA-Z0-9:]/)) {
        currentBuffer += char;
    } else if (char === ' ') {
        currentBuffer += ' ';
    } else {
        currentBuffer = '';
    }
    
    // Process different input methods
    // (You would typically enable only one at a time)
    
    // 1. Pinyin IME (for Chinese input)
    if (char.match(/[a-z]/)) {
        // handlePinyinInput(char);
    }
    
    // 2. Emoji shortcodes
    if (char === ':') {
        handleEmojiShortcode(char);
    }
    
    // 3. Snippet expansion
    if (char === ' ') {
        handleSnippetExpansion(char);
        handleAutoCorrect(char);
    }
    
    // Log event for debugging
    if (event.type === 'keyDown') {
        console.log(`[${event.keyCode}] ${char} (buffer: ${currentBuffer})`);
    }
}

/**
 * Start the IME
 */
async function startIME() {
    console.log('Starting custom Input Method Editor...');
    console.log('Press Ctrl+C to stop\n');
    
    console.log('Features enabled:');
    console.log('  ✓ Emoji shortcuts (e.g., :smile:, :heart:)');
    console.log('  ✓ Text snippets (addr, email, phone, date, time)');
    console.log('  ✓ Auto-correction (teh→the, recieve→receive, etc.)');
    console.log('');
    
    console.log('Try typing:');
    console.log('  - :smile: → 😊');
    console.log('  - addr → (your address)');
    console.log('  - date → (current date)');
    console.log('  - teh → the (auto-corrected)');
    console.log('');
    
    // Start monitoring keyboard events
    inputMethod.startMonitoring(handleKeyEvent);
    
    console.log('IME is now active. Type in any application!\n');
}

/**
 * Stop the IME
 */
function stopIME() {
    console.log('\nStopping Input Method Editor...');
    inputMethod.stopMonitoring();
    console.log('IME stopped.');
    process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', stopIME);

// Start the IME
if (require.main === module) {
    startIME().catch(console.error);
}

module.exports = {
    startIME,
    stopIME,
    handleKeyEvent,
    pinyinMap,
    emojiMap,
    snippets
};
