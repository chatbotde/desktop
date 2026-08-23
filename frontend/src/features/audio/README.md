# Audio

Voice-to-prompt, recording, live waveform, and transcript insert.

## Flags

| ID | Default | Behavior |
|----|---------|----------|
| `voice-to-prompt` | on | Mic fills the prompt box |
| `audio-pill` | off | Dedicated recorder overlay (`#/o/audio`) |
| `transcription` | off | Auto STT (AssemblyAI in `services/audio/`) |
| `voice-insert` | off | Insert spoken text into the focused app |

## Public API

```ts
import { VoiceToPromptQuickInsert, AudioRecorderPill, InsertTranscriptOverlay } from '@/features/audio'
```

| File | Role |
|------|------|
| `components/VoiceToPrompt.tsx` | Record → transcript → prompt |
| `components/AudioRecorderControls.tsx` | Start / pause / stop |
| `components/MicHoverAudioPill.tsx` | Hover mic control |
| `components/InsertTranscriptOverlay.tsx` | Overlay for insert flow |
| `hooks/useAiSuggestion.ts` | Suggestions from transcript |

STT implementation: `frontend/src/services/audio/` (not this folder). TTS / cloned voices: `features/voice/`.
