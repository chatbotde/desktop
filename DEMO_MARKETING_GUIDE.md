# SonicThinking / Buddy - Demo Video & Marketing Guide

This document outlines the essential features, unique selling points, and a suggested flow for a demo video of SonicThinking. This is designed to help the marketing team understand the product's capabilities and how to best showcase them.

## 🚀 Core Value Proposition
SonicThinking is not just another chat wrapper; it's a **context-aware desktop companion** that integrates seamlessly into your workflow. It combines the power of top-tier cloud AI models with the privacy and speed of local tools.

**Key Highlights:**
*   **Agnostic AI Power:** Use the best model for the job (OpenAI, Anthropic, Gemini, DeepSeek, Cerebras, OpenRouter, and Local LLMs via Ollama).
*   **Desktop Integration:** It lives *with* you. Select text anywhere, capture screens, and record audio directly into your workflow.
*   **Privacy-First Options:** Full support for local LLMs means sensitive data never has to leave your machine.
*   **Memory & Context:** The assistant learns and remembers your preferences and context over time (via `memory-service`).

---

## 🎬 Demo Video Script & Flow

### Part 1: The "Wow" Opener (Speed & Aesthetics)
*   **Visual:** Show the sleek, modern UI (Glassmorphism, smooth animations).
*   **Action:** Open the app instantly. Type a complex query.
*   **Feature Highlight:** Show **Cerebras** or a fast model generating a response instantly.
*   **Narrative:** "Intelligence at the speed of thought. Meet SonicThinking."

### Part 2: Seamless Workflow Integration (The "Killer Feature")
*   **Visual:** User working in a browser or IDE (not in the app itself).
*   **Action:** Highlight text on a website -> Trigger the **Text Selection Popup** -> "Summarize this" or "Explain this code".
*   **Feature Highlight:** **Global Text Selection Actions**. You don't update your workflow; SonicThinking fits into it.
*   **Narrative:** "Don't switch context. Bring the intelligence to where you are."

### Part 3: Multimodal Capabilities (See & Hear)
*   **Visual:** User takes a screenshot of a chart or design.
*   **Action:** Use **Screen Capture** tool -> Ask AI "How can I improve this design?" -> AI analyzes the image.
*   **Visual:** User hits "Record" for a meeting or voice note.
*   **Action:** Capture audio directly -> AI summarizes key points or transcribes it perfectly using **Whisper**, **AssemblyAI**, or **Gemini**.
*   **Feature Highlight:** **Screen Capture**, **Voice Transcription**, & **Audio Note-Taking**.
*   **Narrative:** "Show it. Say it. Record it. SonicThinking creates structure from your raw ideas."

### Part 4: The Power User (Models & Memory)
*   **Visual:** Switch seamlessly between models (e.g., GPT-4o for reasoning, DeepSeek for coding).
*   **Action:** Ask a follow-up question that relies on previous context.
*   **Feature Highlight:** **Model Switching** & **Assistant Memory**.
*   **Narrative:** "From creative writing to complex coding, switch brains instantly. And it remembers what matters to you."

### Part 5: Privacy & Local Control
*   **Visual:** Switch to "Local" tab (Ollama).
*   **Action:** Run a query offline.
*   **Feature Highlight:** **Local LLM Support**.
*   **Narrative:** "Your data, your rules. Run powerful AI models completely offline."

---

## 📋 Essential Features List (For Marketing Copy)

### 🤖 AI Model Hub
*   **Multi-Provider Support:** One subscription/interface for OpenAI, Anthropic, Google Gemini, DeepSeek, Cerebras, Kimi, xAI, and OpenRouter.
*   **Local Intelligence:** Built-in support for Ollama (run Llama 3, Mistral, etc., locally).

### 🖥️ Desktop Superpowers
*   **Text Selection Popups:** actionable AI on any selected text across your OS.
*   **Screen Capture:** Instant screenshot analysis.
*   **Audio Intelligence:** Record voice notes, meetings, or specific audio inputs and get instant transcripts + summaries.
*   **Transcription Overlay:** Professional-grade Speech-to-Text using Whisper.
*   **Global Shortcuts:** Access your assistant without lifting your hands from the keyboard.

### 🧠 Smart Assistant
*   **Deep Memory:** Remembers user preferences and context across sessions.
*   **Thinking Indicators:** Visual feedback when the model is processing complex tasks.
*   **Markdown & Code Support:** Beautiful rendering of code blocks with one-click copy/insert.

### 🎨 Premium Experience
*   **Creative Suite:** Generate high-quality images and video directly within the chat interface using advanced models.
*   **Modern UI:** Glassmorphism, dark mode, smooth transitions.
*   **Customizable:** Settings for themes, shortcuts, and default models.
*   **Fast:** Optimized for performance with Electron.

---

## 🛠 Technical Notes for the Team
*   **Platform:** Windows, Mac, Linux (Electron-based).
*   **Privacy:** Local models run entirely on-device. Cloud models use secure API integration.
*   **Updates:** Built-in auto-updater.
