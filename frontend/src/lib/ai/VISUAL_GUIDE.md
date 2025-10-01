# Visual Guide - AI Module Architecture

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Your React Application                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Component Layer                              │   │
│  │  (ChatComponent, ModelSelector, etc.)                           │   │
│  └─────────────────┬────────────────────────────────────────────────┘   │
│                    │ import { sendMessage, switchProvider } from '@/lib/ai'
│                    │                                                     │
└────────────────────┼─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI Module (@/lib/ai)                            │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer (services/)                       │  │
│  │                                                                    │  │
│  │   ┌─────────────────────────────────────────────────────────┐    │  │
│  │   │         UnifiedAIService (unified-service.ts)            │    │  │
│  │   │  • sendMessage()                                         │    │  │
│  │   │  • sendMessageWithMedia()                                │    │  │
│  │   │  • switchProvider()                                      │    │  │
│  │   │  • getAllAvailableModels()                               │    │  │
│  │   └──────────────────────┬──────────────────────────────────┘    │  │
│  └───────────────────────────┼──────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                  Registry Layer (registry/)                        │  │
│  │                                                                    │  │
│  │   ┌─────────────────────────────────────────────────────────┐    │  │
│  │   │       ProviderRegistry (provider-registry.ts)            │    │  │
│  │   │  • registerProvider()                                    │    │  │
│  │   │  • getCurrentProvider()                                  │    │  │
│  │   │  • setCurrentProvider()                                  │    │  │
│  │   │  • getAvailableProviders()                               │    │  │
│  │   └──────────────────────┬──────────────────────────────────┘    │  │
│  └───────────────────────────┼──────────────────────────────────────┘  │
│                              │                                          │
│         ┌────────────────────┼────────────────────┐                    │
│         │                    │                    │                    │
│         ▼                    ▼                    ▼                    │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐           │
│  │   Gemini    │      │   OpenAI    │      │  Anthropic  │           │
│  │  Provider   │      │  Provider   │      │  Provider   │           │
│  └─────────────┘      └─────────────┘      └─────────────┘           │
│         │                    │                    │                    │
│  ┌──────┴───────────────────────────────────────┴──────┐              │
│  │           Provider Layer (providers/)                │              │
│  │                                                      │              │
│  │   All extend: BaseAIProvider                        │              │
│  │   All implement: IAIProvider interface              │              │
│  └──────────────────────────────────────────────────────┘              │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Types Layer (types/)                            │  │
│  │                                                                    │  │
│  │   • IAIProvider (interface)                                       │  │
│  │   • BaseAIProvider (abstract class)                               │  │
│  │   • MediaAttachment, AIModel, ChatMessage (types)                 │  │
│  │   • ProviderCapabilities, AIRequestOptions (types)                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │          External AI Services              │
         ├────────────────────────────────────────────┤
         │  • Google Gemini API                       │
         │  • OpenAI API                              │
         │  • Anthropic API                           │
         └────────────────────────────────────────────┘
```

## 🔄 Message Flow Diagram

```
User Types Message
       │
       ▼
┌──────────────────┐
│  React Component │
└────────┬─────────┘
         │ sendMessage('Hello')
         ▼
┌────────────────────────┐
│   UnifiedAIService     │
│  • Validates input     │
│  • Gets current        │
│    provider            │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│   ProviderRegistry     │
│  • Returns current     │
│    provider instance   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│   GeminiProvider       │  (or OpenAI, Anthropic)
│  • Formats request     │
│  • Calls API           │
│  • Returns stream      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│   Google Gemini API    │
└────────┬───────────────┘
         │
         │ Stream Response
         ▼
Component receives chunks
         │
         ▼
User sees response appear
```

## 🏗️ Class Hierarchy

```
┌──────────────────────────┐
│     IAIProvider          │  ← Interface (contract)
│  (interface)             │
├──────────────────────────┤
│  + name: string          │
│  + capabilities          │
│  + isConfigured()        │
│  + initialize()          │
│  + sendMessage()         │
│  + sendMessageWithMedia()│
│  + clearHistory()        │
│  + setModel()            │
└────────────┬─────────────┘
             │
             │ implements
             ▼
┌──────────────────────────┐
│   BaseAIProvider         │  ← Abstract base class
│  (abstract class)        │
├──────────────────────────┤
│  # chatHistory           │
│  # systemContext         │
│  # currentModel          │
├──────────────────────────┤
│  + getChatHistory()      │  ← Implemented
│  + clearHistory()        │  ← Implemented
│  + setSystemContext()    │  ← Implemented
│  + blobToBase64()        │  ← Helper
│                          │
│  Abstract methods:       │
│  + sendMessage()         │  ← Must implement
│  + sendMessageWithMedia()│  ← Must implement
│  + getAvailableModels()  │  ← Must implement
└────────────┬─────────────┘
             │
             │ extends
   ┌─────────┼──────────┐
   │         │          │
   ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Gemini  │ │OpenAI  │ │Anthro- │
│Provider│ │Provider│ │pic     │
└────────┘ └────────┘ │Provider│
                      └────────┘
```

## 📊 Provider Comparison Matrix

```
┌──────────────┬──────────┬──────────┬────────────┐
│   Feature    │  Gemini  │  OpenAI  │ Anthropic  │
├──────────────┼──────────┼──────────┼────────────┤
│ Text         │    ✅    │    ✅    │     ✅     │
│ Images       │    ✅    │    ✅    │     ✅     │
│ Audio        │    ✅    │    ✅    │     ❌     │
│ Video        │    ✅    │    ❌    │     ❌     │
│ Streaming    │    ✅    │    ✅    │     ✅     │
│ Functions    │    ✅    │    ✅    │     ✅     │
│ Max Context  │   1M     │   128K   │    200K    │
│ Max Tokens   │  8192    │   4096   │    8192    │
│ Cost (Input) │  $0.075  │  $5.00   │   $3.00    │
│ Cost (Output)│  $0.30   │  $15.00  │   $15.00   │
└──────────────┴──────────┴──────────┴────────────┘
```

## 🎯 Provider Selection Flow

```
User wants to use AI
         │
         ▼
    ┌─────────┐
    │ Select  │
    │ Model   │
    └────┬────┘
         │
         ▼
   Is model from
   current provider?
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    │         ▼
    │    Find provider
    │    with this model
    │         │
    │         ▼
    │    Switch provider
    │         │
    └────┬────┘
         │
         ▼
   Set model on
      provider
         │
         ▼
   Ready to use!
```

## 🔐 API Key Flow

```
App Starts
     │
     ▼
Load .env file
     │
     ▼
┌────────────────────┐
│ Check API keys:    │
│ • VITE_GOOGLE_API  │
│ • VITE_OPENAI_API  │
│ • VITE_ANTHROPIC   │
└─────────┬──────────┘
          │
          ▼
Initialize providers
          │
     ┌────┴────┐
     │         │
Has key?    No key?
     │         │
     ▼         ▼
Configure   Skip
Provider    Provider
     │         │
     ▼         ▼
Available   Unavailable
```

## 🗂️ File Import Map

```
Your Component
      │
      │ import { sendMessage } from '@/lib/ai'
      │
      ▼
┌─────────────┐
│  index.ts   │  Main entry point
└──────┬──────┘
       │ exports from
       │
   ┌───┴────┬────────────┬──────────┐
   │        │            │          │
   ▼        ▼            ▼          ▼
services/ registry/ providers/  types/
   │        │            │          │
   │        │            │          └─► base.ts
   │        │            │              (interfaces)
   │        │            │
   │        │            ├─► gemini-provider.ts
   │        │            ├─► openai-provider.ts
   │        │            └─► anthropic-provider.ts
   │        │
   │        └─► provider-registry.ts
   │            (manages all providers)
   │
   └─► unified-service.ts
       (high-level API)
```

## 📦 Package Dependencies

```
┌──────────────────────────────────────┐
│        Your Application              │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│         AI Module                    │
├──────────────────────────────────────┤
│  Dependencies:                       │
│  ┌────────────────────────────────┐ │
│  │  @google/genai                 │ │
│  │    └─ Used by: GeminiProvider  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  openai                        │ │
│  │    └─ Used by: OpenAIProvider  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │  @anthropic-ai/sdk             │ │
│  │    └─ Used by: AnthropicProv.  │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## 🎬 Quick Start Visual

```
Step 1: Install        Step 2: Configure       Step 3: Use
───────────────        ─────────────────       ────────────

npm install            Create .env:            import { sendMessage }
@google/genai          VITE_GOOGLE_API_KEY     from '@/lib/ai';
openai                 VITE_OPENAI_API_KEY     
@anthropic-ai/sdk      VITE_ANTHROPIC_API      const stream = await
                                               sendMessage('Hi');
                                               
                                               for await (chunk of stream) {
                                                 console.log(chunk);
                                               }
```

## 🔄 Extension Pattern

```
Want to add a new provider?
           │
           ▼
┌──────────────────────┐
│  1. Create Provider  │
│     Class            │
│  (30 lines)          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  2. Register in      │
│     Registry         │
│  (2 lines)           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  3. Export from      │
│     providers/       │
│  (1 line)            │
└──────────┬───────────┘
           │
           ▼
      ✅ DONE!
   Available everywhere
```

## 📈 Growth Path

```
Current State          Near Future            Long Term
─────────────          ────────────           ──────────

3 Providers     →      5+ Providers    →      10+ Providers
(Gemini, OpenAI,       + Cohere               + Custom APIs
 Anthropic)            + Mistral              + Local models
                       + More...              + Edge computing

Basic Features  →      Advanced        →      Enterprise
• Streaming            • Caching              • Monitoring
• Media support        • Batching             • Analytics
• Model switching      • Functions            • Cost tracking
                       • RAG support          • Team features
```

---

**This visual guide helps you understand the architecture at a glance! 🎨**

For detailed information, see:
- **ARCHITECTURE.md** - Deep dive
- **QUICK_START.md** - Get started
- **README.new.md** - Complete guide
