# AI Module Folder Structure

## 📂 Complete Folder Tree

```
buddy/frontend/src/lib/ai/
│
├── 📁 types/                       # Core type definitions
│   ├── base.ts                     # IAIProvider interface, BaseAIProvider class
│   └── index.ts                    # Re-exports all types
│
├── 📁 providers/                   # AI provider implementations
│   ├── gemini-provider.ts          # Google Gemini (✅ Implemented)
│   ├── openai-provider.ts          # OpenAI GPT (✅ Implemented)
│   ├── anthropic-provider.ts       # Anthropic Claude (✅ Implemented)
│   └── index.ts                    # Re-exports all providers
│
├── 📁 registry/                    # Provider registry system
│   ├── provider-registry.ts        # ProviderRegistry class
│   └── index.ts                    # Re-exports registry
│
├── 📁 services/                    # High-level services
│   ├── unified-service.ts          # UnifiedAIService class
│   └── index.ts                    # Re-exports services
│
├── 📁 examples/                    # Usage examples
│   └── usage-examples.ts           # 10+ practical examples
│
├── 📄 index.ts                     # Main entry point (import from here!)
├── 📄 model-config.ts              # Legacy model config (backward compatibility)
│
├── 📄 ARCHITECTURE.md              # Architecture documentation (THIS IS KEY!)
├── 📄 README.new.md                # Complete usage guide
├── 📄 MIGRATION_GUIDE.md           # Migration from old to new
├── 📄 FOLDER_STRUCTURE.md          # This file
│
└── 🗑️ Legacy files (deprecated, but kept for compatibility):
    ├── gemini.ts                   # Old Gemini service
    ├── gemini-utils.ts             # Old Gemini utilities
    ├── openai.ts                   # Old OpenAI service
    ├── antropic.ts                 # Old Anthropic file
    ├── unified-ai-service.ts       # Old unified service
    └── README.md                   # Old documentation
```

## 🎯 Key Files Explained

### 1. `index.ts` - Main Entry Point
**What**: Central export point for the entire AI module  
**Use**: Import everything from here  
**Example**:
```typescript
import { sendMessage, switchProvider, getCurrentProvider } from '@/lib/ai';
```

### 2. `types/base.ts` - Core Contracts
**What**: Defines interfaces that all providers must implement  
**Contains**:
- `IAIProvider` - Interface for providers
- `BaseAIProvider` - Abstract base class
- `MediaAttachment`, `AIModel`, etc. - Shared types

### 3. `providers/` - Provider Implementations
**What**: Concrete implementations of each AI provider  
**Pattern**: Each provider extends `BaseAIProvider`  
**Files**:
- `gemini-provider.ts` - Google Gemini
- `openai-provider.ts` - OpenAI GPT
- `anthropic-provider.ts` - Anthropic Claude

### 4. `registry/provider-registry.ts` - Provider Management
**What**: Central registry for all providers  
**Features**:
- Register/unregister providers
- Switch between providers
- Get available models
- Persist selection

### 5. `services/unified-service.ts` - Simplified API
**What**: High-level API for easy use  
**Features**:
- Provider-agnostic methods
- Error handling
- Response formatting

### 6. `examples/usage-examples.ts` - Practical Examples
**What**: 10+ working code examples  
**Covers**:
- Basic messaging
- Media attachments
- Provider switching
- Model selection
- Chat history
- Error handling

## 📋 File Purposes Quick Reference

| File | Purpose | Import From | Status |
|------|---------|-------------|--------|
| `types/base.ts` | Define contracts | `@/lib/ai` | ✅ Active |
| `providers/gemini-provider.ts` | Gemini implementation | `@/lib/ai` | ✅ Active |
| `providers/openai-provider.ts` | OpenAI implementation | `@/lib/ai` | ✅ Active |
| `providers/anthropic-provider.ts` | Claude implementation | `@/lib/ai` | ✅ Active |
| `registry/provider-registry.ts` | Provider management | `@/lib/ai` | ✅ Active |
| `services/unified-service.ts` | Simplified API | `@/lib/ai` | ✅ Active |
| `index.ts` | Main exports | `@/lib/ai` | ✅ Active |
| `model-config.ts` | Legacy config | `@/lib/ai/model-config` | ⚠️ Deprecated |
| `gemini.ts` | Old Gemini service | `@/lib/ai/gemini` | ⚠️ Deprecated |

## 🔄 Import Patterns

### ✅ Recommended (New Architecture)

```typescript
// Import from main entry point
import { 
  sendMessage, 
  switchProvider, 
  getAllAvailableModels,
  type MediaAttachment 
} from '@/lib/ai';
```

### ⚠️ Legacy (Still works, but deprecated)

```typescript
// Old way
import { geminiService } from '@/lib/ai/gemini';
import { getSelectedModel } from '@/lib/ai/model-config';
```

## 📊 Module Size and Complexity

| Component | Lines of Code | Complexity | Test Coverage |
|-----------|---------------|------------|---------------|
| Types | ~300 | Low | N/A (types) |
| Gemini Provider | ~250 | Medium | TBD |
| OpenAI Provider | ~230 | Medium | TBD |
| Anthropic Provider | ~240 | Medium | TBD |
| Registry | ~180 | Low | TBD |
| Unified Service | ~200 | Low | TBD |
| **Total New Code** | **~1,400** | **Medium** | **TBD** |

## 🗺️ Navigation Guide

### I want to...

**Add a new AI provider**  
→ See `providers/gemini-provider.ts` as template  
→ Follow pattern in `ARCHITECTURE.md`  
→ Register in `registry/provider-registry.ts`

**Use AI in my component**  
→ Import from `@/lib/ai`  
→ Check `examples/usage-examples.ts`  
→ Read `README.new.md`

**Understand the architecture**  
→ Read `ARCHITECTURE.md` (comprehensive guide)  
→ Check `types/base.ts` (interfaces)  
→ Look at provider implementations

**Migrate old code**  
→ Follow `MIGRATION_GUIDE.md`  
→ Update imports to `@/lib/ai`  
→ Test thoroughly

**Debug an issue**  
→ Check provider's `isConfigured()` method  
→ Verify API keys in `.env`  
→ Look at error messages

## 🎓 Learning Path

### Beginner
1. Read `README.new.md` - Quick Start section
2. Try examples from `examples/usage-examples.ts`
3. Build a simple chat component

### Intermediate
1. Read `ARCHITECTURE.md` - understand structure
2. Switch between providers
3. Work with media attachments
4. Understand error handling

### Advanced
1. Read `types/base.ts` - understand contracts
2. Study a provider implementation
3. Add a new provider
4. Contribute improvements

## 🔍 Finding Files

### By Purpose

**I need types/interfaces**  
```
types/base.ts
types/index.ts
```

**I need to use AI**  
```
index.ts (import from here)
services/unified-service.ts (see implementation)
```

**I need examples**  
```
examples/usage-examples.ts
README.new.md
```

**I need to add provider**  
```
providers/[name]-provider.ts (create new)
registry/provider-registry.ts (register)
```

**I need documentation**  
```
README.new.md (usage)
ARCHITECTURE.md (design)
MIGRATION_GUIDE.md (migration)
```

## 📦 Dependencies

### Required Packages

```json
{
  "@google/genai": "^0.21.0",      // Gemini
  "openai": "^4.72.0",              // OpenAI
  "@anthropic-ai/sdk": "^0.32.1"   // Anthropic
}
```

### Installation

```bash
cd buddy/frontend
npm install @google/genai openai @anthropic-ai/sdk
```

## 🚀 Quick Setup

1. **Install dependencies**
   ```bash
   npm install @google/genai openai @anthropic-ai/sdk
   ```

2. **Configure API keys** (`.env`)
   ```env
   VITE_GOOGLE_API_KEY=your_gemini_key
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_ANTHROPIC_API_KEY=your_anthropic_key
   ```

3. **Import and use**
   ```typescript
   import { sendMessage } from '@/lib/ai';
   
   const stream = await sendMessage('Hello!');
   for await (const chunk of stream) {
     console.log(chunk);
   }
   ```

## ✨ Summary

The AI module is now:
- **Scalable**: Easy to add new providers
- **Type-safe**: Full TypeScript support
- **Well-documented**: Multiple documentation files
- **Easy to use**: Simple, consistent API
- **Maintainable**: Clear structure and patterns
- **Extensible**: Registry-based architecture

Start with `README.new.md` for usage guide!
