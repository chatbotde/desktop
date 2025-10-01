import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Send } from 'lucide-react'
import { Messages, type ChatMessage } from './Messages'

const sampleMessages: ChatMessage[] = [
    {
        id: '1',
        role: 'user',
        content: 'Can you show me a JavaScript function example?',
        timestamp: new Date(Date.now() - 300000)
    },
    {
        id: '2',
        role: 'assistant',
        content: `Here's a JavaScript function example with modern ES6+ features:

\`\`\`javascript
// Modern JavaScript function with async/await
async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const userData = await response.json();
    
    return {
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage example
const userId = 123;
fetchUserData(userId).then(result => {
  if (result.success) {
    console.log('User data:', result.data);
  } else {
    console.error('Failed to fetch user:', result.error);
  }
});
\`\`\`

This function demonstrates:
- **Async/await** for handling promises
- **Template literals** for string interpolation
- **Error handling** with try/catch
- **Modern object destructuring** and return patterns`,
        timestamp: new Date(Date.now() - 280000)
    },
    {
        id: '3',
        role: 'user',
        content: 'What about Python? Can you show a similar example?',
        timestamp: new Date(Date.now() - 200000)
    },
    {
        id: '4',
        role: 'assistant',
        content: `Here's a Python equivalent with modern features:

\`\`\`python
import asyncio
import aiohttp
import json
from typing import Dict, Any, Optional
from datetime import datetime

async def fetch_user_data(user_id: int) -> Dict[str, Any]:
    """
    Fetch user data from API with proper error handling
    
    Args:
        user_id: The ID of the user to fetch
        
    Returns:
        Dictionary containing success status and data/error
    """
    try:
        async with aiohttp.ClientSession() as session:
            url = f"/api/users/{user_id}"
            
            async with session.get(url) as response:
                if response.status != 200:
                    raise aiohttp.ClientError(
                        f"HTTP error! status: {response.status}"
                    )
                
                user_data = await response.json()
                
                return {
                    "success": True,
                    "data": user_data,
                    "timestamp": datetime.now().isoformat()
                }
                
    except Exception as error:
        print(f"Error fetching user data: {error}")
        return {
            "success": False,
            "error": str(error)
        }

# Usage example
async def main():
    user_id = 123
    result = await fetch_user_data(user_id)
    
    if result["success"]:
        print(f"User data: {json.dumps(result['data'], indent=2)}")
    else:
        print(f"Failed to fetch user: {result['error']}")

# Run the async function
if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

Key Python features shown:
- **Type hints** for better code documentation
- **Async/await** with aiohttp for HTTP requests
- **Context managers** for resource management
- **F-strings** for string formatting
- **Proper exception handling**`,
        timestamp: new Date(Date.now() - 180000)
    },
    {
        id: '5',
        role: 'user',
        content: 'Can you show me some JSON data structure examples?',
        timestamp: new Date(Date.now() - 100000)
    },
    {
        id: '6',
        role: 'assistant',
        content: `Here are some well-structured JSON examples:

## User Profile JSON
\`\`\`json
{
  "user": {
    "id": 12345,
    "username": "developer_pro",
    "email": "dev@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatars/12345.jpg",
      "bio": "Full-stack developer passionate about clean code",
      "location": {
        "city": "San Francisco",
        "country": "USA",
        "timezone": "America/Los_Angeles"
      }
    },
    "preferences": {
      "theme": "dark",
      "language": "en-US",
      "notifications": {
        "email": true,
        "push": false,
        "sms": false
      }
    },
    "metadata": {
      "createdAt": "2023-01-15T10:30:00Z",
      "lastLogin": "2024-01-15T14:22:33Z",
      "isVerified": true,
      "accountType": "premium"
    }
  }
}
\`\`\`

## API Response Structure
\`\`\`json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Alice Johnson",
        "role": "admin",
        "permissions": ["read", "write", "delete"]
      },
      {
        "id": 2,
        "name": "Bob Smith",
        "role": "user",
        "permissions": ["read"]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  },
  "meta": {
    "requestId": "req_123456789",
    "timestamp": "2024-01-15T15:30:00Z",
    "version": "v1.2.0"
  }
}
\`\`\`

These examples show:
- **Nested objects** for complex data structures
- **Arrays** for collections
- **Consistent naming** conventions (camelCase)
- **Metadata** for API responses
- **Proper data types** (strings, numbers, booleans)`,
        timestamp: new Date(Date.now() - 80000)
    },
    {
        id: '7',
        role: 'user',
        content: 'Show me some terminal commands',
        timestamp: new Date(Date.now() - 40000)
    },
    {
        id: '8',
        role: 'assistant',
        content: `Here are some useful terminal commands:

\`\`\`terminal
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/Messages.tsx
        modified:   src/styles/syntax-highlighting.css

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        src/components/FormattedOutput.tsx
        src/components/SmartMessage.tsx

$ npm run build
> buddy@1.0.0 build
> vite build

✓ 1247 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-DiwrgTda.css    8.15 kB │ gzip:  2.34 kB
dist/assets/index-C2PWchud.js   524.45 kB │ gzip: 168.23 kB
✓ built in 3.21s

$ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
a1b2c3d4e5f6   nginx:alpine   "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes   0.0.0.0:8080->80/tcp     web-server
g7h8i9j0k1l2   postgres:14    "docker-entrypoint.s…"   5 minutes ago   Up 5 minutes   0.0.0.0:5432->5432/tcp   database

$ curl -X GET "https://api.example.com/users/123" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"

{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

These commands show:
- **Git operations** for version control
- **Build processes** with npm/yarn
- **Docker container** management
- **API testing** with curl`,
        timestamp: new Date(Date.now() - 20000)
    }
]

export function TestFormatting() {
    const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages)
    const [isTyping, setIsTyping] = useState(false)
    
    // Refs and handlers for Messages component
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    const handleScroll = () => {
        // Simple scroll handler
    }
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    
    const scrollToTop = () => {
        messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const addSampleMessage = () => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `# Sample Markdown Content

This is a **demonstration** of the enhanced formatting capabilities.

## Code Block Example
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];
\`\`\`

## Features
- Syntax highlighting
- Copy functionality
- Professional styling
- Smart content detection

> This blockquote shows improved styling with better visual hierarchy.

### Inline Code
Use \`console.log()\` for debugging and \`async/await\` for promises.`,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, newMessage])
    }

    const simulateTyping = () => {
        setIsTyping(true)
        setTimeout(() => {
            setIsTyping(false)
            addSampleMessage()
        }, 2000)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard:', text)
        })
    }

    return (
        <div className="h-screen w-full flex flex-col bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <h1 className="text-xl font-bold text-white mb-2">Enhanced Output Formatting Test</h1>
                <div className="flex gap-2">
                    <Button onClick={addSampleMessage} size="sm" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Sample Message
                    </Button>
                    <Button onClick={simulateTyping} size="sm" variant="outline" className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Simulate Typing
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
                <Messages
                    messages={messages}
                    isTyping={isTyping}
                    onCopyMessage={copyToClipboard}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                    onScroll={handleScroll}
                    scrollToBottom={scrollToBottom}
                    scrollToTop={scrollToTop}
                    showScrollToTop={false}
                    isNearBottom={true}
                />
            </div>
        </div>
    )
}