import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Code, FileText, Terminal, Database, Sparkles } from 'lucide-react'
import { SmartMessage } from './SmartMessage'

const demoContent = {
  markdown: `# Enhanced Output Formatting

This is a demonstration of the improved output formatting capabilities.

## Features

- **Syntax highlighting** for multiple languages
- **Professional code blocks** with copy functionality
- **Terminal output** styling
- **JSON formatting** with proper indentation
- **Smart content detection** and automatic formatting

### Code Example

\`\`\`javascript
function greetUser(name) {
  const greeting = \`Hello, \${name}!\`;
  console.log(greeting);
  return greeting;
}

// Usage
const user = "Developer";
greetUser(user);
\`\`\`

### Lists and Formatting

- Enhanced markdown parsing
- Better visual hierarchy
- Professional styling
- Copy functionality
- Responsive design

> This is a blockquote example showing improved styling with better contrast and visual appeal.

### Links and Inline Code

Check out the \`FormattedOutput\` component for more details. You can also visit [GitHub](https://github.com) for more examples.`,

  javascript: `// Advanced JavaScript Example
class ChatBot {
  constructor(name) {
    this.name = name;
    this.responses = new Map();
    this.isActive = false;
  }

  async processMessage(message) {
    try {
      const response = await this.generateResponse(message);
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateResponse(input) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(\`Response to: \${input}\`);
      }, 1000);
    });
  }
}

// Usage
const bot = new ChatBot('Buddy');
bot.processMessage('Hello!').then(console.log);`,

  python: `# Python Example with Advanced Features
import asyncio
import json
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class Message:
    content: str
    role: str
    timestamp: float

class ChatProcessor:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.messages: List[Message] = []
        self.is_processing = False
    
    async def process_message(self, content: str) -> Dict[str, any]:
        """Process a message and return formatted response"""
        try:
            self.is_processing = True
            
            # Simulate processing
            await asyncio.sleep(0.5)
            
            response = {
                "success": True,
                "data": f"Processed: {content}",
                "model": self.model_name,
                "tokens_used": len(content.split())
            }
            
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            self.is_processing = False

# Usage example
async def main():
    processor = ChatProcessor("gpt-4")
    result = await processor.process_message("Hello, world!")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())`,

  json: `{
  "chat_session": {
    "id": "session_123",
    "user": {
      "name": "Developer",
      "preferences": {
        "theme": "dark",
        "language": "en",
        "notifications": true
      }
    },
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "How do I improve my code formatting?",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "Here are some tips for better code formatting...",
        "timestamp": "2024-01-15T10:30:15Z",
        "metadata": {
          "model": "gpt-4",
          "tokens": 150,
          "processing_time": 1.2
        }
      }
    ],
    "settings": {
      "auto_format": true,
      "syntax_highlighting": true,
      "line_numbers": false,
      "word_wrap": true
    }
  }
}`,

  terminal: `$ npm install @types/node typescript
npm WARN deprecated @types/node@18.0.0: This is a stub types definition

added 2 packages, and audited 847 packages in 3s

$ tsc --init
Created a new tsconfig.json with:
  target: es2016
  module: commonjs
  strict: true
  esModuleInterop: true
  skipLibCheck: true
  forceConsistentCasingInFileNames: true

$ npm run build
> buddy@1.0.0 build
> tsc

$ npm start
> buddy@1.0.0 start
> node dist/index.js

🚀 Server running on http://localhost:3000
✅ Database connected successfully
📝 Logs saved to ./logs/app.log`
}

export function FormattingDemo() {
  const [activeDemo, setActiveDemo] = useState<keyof typeof demoContent>('markdown')

  const demos = [
    { key: 'markdown' as const, label: 'Markdown', icon: FileText },
    { key: 'javascript' as const, label: 'JavaScript', icon: Code },
    { key: 'python' as const, label: 'Python', icon: Code },
    { key: 'json' as const, label: 'JSON', icon: Database },
    { key: 'terminal' as const, label: 'Terminal', icon: Terminal },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
          <Sparkles className="w-6 h-6 text-blue-400" />
          Enhanced Output Formatting Demo
        </div>
        <p className="text-gray-400">
          Professional formatting for code, markdown, JSON, and terminal output
        </p>
      </div>

      {/* Demo selector */}
      <div className="flex flex-wrap justify-center gap-2">
        {demos.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeDemo === key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDemo(key)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Demo content */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-600/20">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {demos.find(d => d.key === activeDemo)?.label} Example
          </h3>
          <p className="text-gray-400 text-sm">
            This content will be automatically formatted based on its type
          </p>
        </div>

        {/* Show as SmartMessage (simulating assistant response) */}
        <SmartMessage
          content={demoContent[activeDemo]}
          role="assistant"
          onCopy={(text) => console.log('Copied:', text)}
        />
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-lg p-4 border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-white">Syntax Highlighting</h4>
          </div>
          <p className="text-gray-400 text-sm">
            Automatic syntax highlighting for JavaScript, Python, HTML, CSS, and more
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-lg rounded-lg p-4 border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">Smart Detection</h4>
          </div>
          <p className="text-gray-400 text-sm">
            Automatically detects content type and applies appropriate formatting
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-lg rounded-lg p-4 border border-gray-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white">Professional UI</h4>
          </div>
          <p className="text-gray-400 text-sm">
            Clean, professional interface with copy functionality and hover effects
          </p>
        </div>
      </div>
    </div>
  )
}