# Multiple Display Cards Usage Guide

The chat-input window now has **4 interactive display cards** that can receive content from the frontend. Each card is positioned in a different corner and has click-through functionality for full interaction.

## 🎯 How to Use

### **1. Toggle the Display Cards**
- **Buttons**: Click the numbered square icons (1, 2, 3, 4) in the chat-input action bar
- **Keyboard**: Press `Ctrl+1`, `Ctrl+2`, `Ctrl+3`, or `Ctrl+4`
- **Programmatically**: `window.chatInputAPI.toggleDisplayCard(cardNumber)`

### **2. Card Positions**
- **Card 1**: Top-left corner
- **Card 2**: Top-right corner  
- **Card 3**: Bottom-left corner
- **Card 4**: Bottom-right corner

### **3. Send Content from Frontend**

#### **Simple Text Content**
```javascript
// Send plain text to card 1
window.chatInputAPI.sendDisplayContent(1, "Hello from frontend!");

// Send HTML content to card 2
window.chatInputAPI.sendDisplayContent(2, {
  type: 'html',
  data: '<h2>Frontend Output</h2><p>This is <strong>HTML content</strong> from the frontend.</p>'
});
```

#### **Structured Content**
```javascript
// Send JSON data to card 3
window.chatInputAPI.sendDisplayContent(3, {
  type: 'json',
  data: {
    message: "Data from frontend",
    timestamp: new Date().toISOString(),
    status: "success"
  }
});

// Send Markdown content to card 4
window.chatInputAPI.sendDisplayContent(4, {
  type: 'markdown',
  data: `# Frontend Output
  
This is **markdown content** from the frontend.

- Item 1
- Item 2
- Item 3

\`code snippet\``
});
```

#### **Real-time Updates**
```javascript
// Update content periodically to different cards
setInterval(() => {
  const currentTime = new Date().toLocaleTimeString();
  window.chatInputAPI.sendDisplayContent(1, {
    type: 'text',
    data: `Current time: ${currentTime}`
  });
}, 1000);

// Update different cards with different data
setInterval(() => {
  const data = {
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    timestamp: Date.now()
  };
  window.chatInputAPI.sendDisplayContent(2, {
    type: 'json',
    data: data
  });
}, 2000);
```

### **4. Control the Display Cards**

#### **Clear Content**
```javascript
// Clear specific card
window.chatInputAPI.sendDisplayContent(1, null);

// Clear all cards
for (let i = 1; i <= 4; i++) {
  window.chatInputAPI.sendDisplayContent(i, null);
}
```

#### **Refresh Content**
```javascript
// Request fresh content for specific card
window.chatInputAPI.requestDisplayContent(1);

// Refresh all cards
for (let i = 1; i <= 4; i++) {
  window.chatInputAPI.requestDisplayContent(i);
}
```

#### **Listen for Content Requests**
```javascript
// Listen for refresh requests
window.chatInputAPI.onDisplayContent((cardNumber, content) => {
  console.log(`Display content received for card ${cardNumber}:`, content);
  // Handle the content display
});
```

## 🎨 Content Types Supported

### **Text Content**
- Plain text strings
- HTML markup
- Markdown (basic formatting)

### **Structured Data**
- JSON objects
- Arrays
- Nested data structures

### **Rich Content**
- Headers (h1, h2, h3)
- Lists (ul, ol)
- Code blocks
- Links and formatting

## 🔧 Integration Examples

### **React Component Example**
```jsx
function FrontendComponent() {
  const sendToDisplayCard = (content) => {
    if (window.chatInputAPI) {
      window.chatInputAPI.sendDisplayContent(content);
    }
  };

  return (
    <div>
      <button onClick={() => sendToDisplayCard("Hello from React!")}>
        Send to Display Card
      </button>
      
      <button onClick={() => sendToDisplayCard({
        type: 'html',
        data: '<h3>React Output</h3><p>This content came from a React component.</p>'
      })}>
        Send HTML Content
      </button>
    </div>
  );
}
```

### **Vue Component Example**
```vue
<template>
  <div>
    <button @click="sendText">Send Text</button>
    <button @click="sendJson">Send JSON</button>
  </div>
</template>

<script>
export default {
  methods: {
    sendText() {
      if (window.chatInputAPI) {
        window.chatInputAPI.sendDisplayContent("Hello from Vue!");
      }
    },
    
    sendJson() {
      if (window.chatInputAPI) {
        window.chatInputAPI.sendDisplayContent({
          type: 'json',
          data: { message: 'Vue component data', timestamp: Date.now() }
        });
      }
    }
  }
}
</script>
```

## 📱 Display Cards Features

### **Visual Design**
- **4 cards** of 400x400px each
- **Corner positioning**: Top-left, top-right, bottom-left, bottom-right
- **Glassmorphism** design with backdrop blur
- **Theme support** (dark/paper themes)
- **Responsive** design for smaller screens
- **Click-through functionality** for full interaction

### **Content Display**
- **Scrollable** content area
- **Syntax highlighting** for code
- **Markdown rendering** (basic)
- **HTML support** for rich content
- **JSON formatting** with proper indentation

### **Controls**
- **Clear button** (🗑️) to clear content
- **Refresh button** (🔄) to request new content
- **Close button** (❌) to hide the card
- **Status indicator** showing current state

## 🚀 Use Cases

1. **Debug Information**: Display real-time debug data
2. **Status Updates**: Show application status
3. **Logs**: Display log messages and errors
4. **Data Visualization**: Show charts and graphs
5. **Notifications**: Display important messages
6. **API Responses**: Show API call results
7. **User Feedback**: Display form validation results

## 🔗 API Reference

### **Methods**
- `sendDisplayContent(cardNumber, content)` - Send content to specific display card
- `requestDisplayContent(cardNumber)` - Request content refresh for specific card
- `toggleDisplayCard(cardNumber)` - Toggle specific card visibility
- `onDisplayContent(callback)` - Listen for content (callback receives cardNumber, content)

### **Content Format**
```javascript
// String content
"Plain text content"

// Object content
{
  type: 'html' | 'text' | 'json' | 'markdown',
  data: any
}
```

### **Card Numbers**
- **Card 1**: Top-left corner
- **Card 2**: Top-right corner
- **Card 3**: Bottom-left corner
- **Card 4**: Bottom-right corner

## 🚀 Use Cases for Multiple Cards

1. **Card 1**: Debug information and logs
2. **Card 2**: Real-time status updates
3. **Card 3**: API responses and data
4. **Card 4**: User notifications and alerts

The 4 display cards are now ready to receive and display content from your frontend application with full click-through interaction!
