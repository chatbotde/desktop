# Dual AI Audio Processing System

This system allows you to choose between **Gemini AI** and **AssemblyAI** for processing audio files in your chat input application.

## 🚀 Features

### AI Provider Selection
- **Gemini AI**: Full AI conversation with audio analysis and response generation
- **AssemblyAI**: High-quality speech-to-text transcription
- **Easy Switching**: Toggle between providers with dedicated buttons
- **Visual Feedback**: Clear indication of which provider is active

### Audio Processing
- **Audio Recording**: Built-in microphone recording
- **File Upload**: Support for various audio formats (MP3, WAV, WebM, etc.)
- **Smart Routing**: Audio automatically routed to selected AI provider
- **Progress Indicators**: Visual feedback during processing

## 🎯 Use Cases

### Gemini AI (Recommended for conversations)
- **Full AI Analysis**: Audio content analysis and intelligent responses
- **Context Understanding**: Maintains conversation context
- **Multi-modal**: Can handle audio + text + images together
- **Creative Responses**: Generates helpful, contextual replies

### AssemblyAI (Recommended for transcription)
- **High Accuracy**: Industry-leading speech recognition
- **Fast Processing**: Optimized for transcription speed
- **Language Support**: Multiple language detection
- **Confidence Scoring**: Quality metrics for transcriptions

## 🛠 Setup Instructions

### 1. Environment Variables
Create a `.env` file in your project root:

```bash
# Gemini AI (Google)
VITE_GOOGLE_API_KEY=your_gemini_api_key_here

# AssemblyAI
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

### 2. Install Dependencies
```bash
npm install assemblyai @google/genai
```

### 3. API Keys
- **Gemini**: Get from [Google AI Studio](https://aistudio.google.com/)
- **AssemblyAI**: Get from [AssemblyAI Console](https://www.assemblyai.com/)

## 📱 How to Use

### Basic Usage

1. **Select AI Provider**
   - Click the **Gemini** or **AssemblyAI** button above the send button
   - Active provider is highlighted in blue

2. **Add Audio**
   - **Record**: Click "Audio Capture" from the capture dropdown
   - **Upload**: Click the upload button and select an audio file
   - **Drag & Drop**: Drag audio files directly into the chat input

3. **Send for Processing**
   - Type an optional message (e.g., "Transcribe this audio" or "Analyze this recording")
   - Click the send button
   - Audio is automatically processed by the selected AI provider

### Advanced Usage

#### Gemini AI Processing
```javascript
// Audio + text message
"Please analyze this audio and summarize the key points"

// Audio + image + text
"Compare this audio recording with the attached image"
```

#### AssemblyAI Processing
```javascript
// Simple transcription
"Transcribe this audio"

// Language-specific
"Transcribe in Spanish"
```

## 🔧 Technical Implementation

### File Structure
```
buddy/frontend/src/lib/
├── ai/
│   ├── gemini.ts              # Gemini AI service
│   └── unified-ai-service.ts  # Main AI router
└── audio/
    └── assemblyai.ts          # AssemblyAI service
```

### Key Components

#### UnifiedAIService
- Routes audio to appropriate AI provider
- Handles provider switching
- Manages service status and availability

#### Audio Processing Flow
1. **Audio Input** → Audio attachment created
2. **Provider Selection** → User chooses Gemini or AssemblyAI
3. **AI Routing** → Audio sent to selected service
4. **Processing** → AI service processes audio
5. **Response** → Results displayed in chat

### API Integration

#### Gemini AI
```typescript
import { geminiService } from './ai/gemini';

const response = await geminiService.sendMessageWithMedia(
  "Analyze this audio", 
  [audioAttachment]
);
```

#### AssemblyAI
```typescript
import { assemblyAIService } from './audio/assemblyai';

const transcription = await assemblyAIService.transcribeAudio(audioDataUrl);
```

## 🧪 Testing

### Test Page
Open `test-dual-ai.html` to test the system:

1. **Provider Selection**: Test switching between AI providers
2. **Audio Recording**: Record test audio with microphone
3. **File Upload**: Upload existing audio files
4. **AI Processing**: Test processing with both providers
5. **Service Status**: Check API availability

### Manual Testing
```javascript
// Test in browser console
async function testAudioProcessing() {
  // Record or upload audio first
  const audioBlob = await recordAudio();
  
  // Process with Gemini
  setAIProvider('gemini');
  const geminiResult = await processAudioWithAI(audioBlob, "Analyze this");
  
  // Process with AssemblyAI
  setAIProvider('assemblyai');
  const assemblyResult = await processAudioWithAI(audioBlob, "Transcribe this");
  
  console.log('Gemini:', geminiResult);
  console.log('AssemblyAI:', assemblyResult);
}
```

## 🚨 Troubleshooting

### Common Issues

#### "AssemblyAI not configured"
- Check your `VITE_ASSEMBLYAI_API_KEY` environment variable
- Verify the API key is valid and has credits
- Ensure the `assemblyai` package is installed

#### "Gemini processing failed"
- Check your `VITE_GOOGLE_API_KEY` environment variable
- Verify the API key has access to Gemini models
- Check your Google Cloud billing status

#### Audio recording not working
- Grant microphone permissions in your browser
- Check if MediaRecorder API is supported
- Try using file upload instead of recording

### Debug Mode
Enable debug logging in the browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 🔮 Future Enhancements

### Planned Features
- **Real-time Transcription**: Live audio streaming with AssemblyAI
- **Batch Processing**: Multiple audio files simultaneously
- **Custom Models**: Fine-tuned transcription models
- **Audio Editing**: Basic audio trimming and enhancement
- **Export Options**: Download transcriptions in various formats

### Integration Possibilities
- **Voice Commands**: Voice-activated AI interactions
- **Meeting Notes**: Automatic meeting transcription and summarization
- **Language Learning**: Multi-language audio processing
- **Accessibility**: Enhanced audio content for hearing-impaired users

## 📊 Performance

### Processing Times
- **AssemblyAI**: 2-5 seconds for typical audio files
- **Gemini AI**: 3-8 seconds depending on audio length and complexity

### File Size Limits
- **Maximum**: 50MB per audio file
- **Recommended**: Under 10MB for optimal performance
- **Formats**: MP3, WAV, WebM, M4A, OGG

### Quality Settings
- **AssemblyAI**: Automatic quality optimization
- **Gemini**: Configurable model selection (Gemini 2.5 Flash)

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run tests: `npm test`
5. Start development server: `npm run dev`

### Code Style
- Use TypeScript for type safety
- Follow existing code patterns
- Add comprehensive error handling
- Include JSDoc comments for functions

## 📄 License

This project is part of the Buddy application suite. See the main project license for details.

## 🆘 Support

### Getting Help
1. Check this README for common solutions
2. Review the test page for working examples
3. Check browser console for error messages
4. Verify API keys and service status

### Reporting Issues
- Include error messages from console
- Specify which AI provider failed
- Provide audio file details (format, size)
- Include browser and OS information

---

**Happy Audio Processing! 🎤✨**
