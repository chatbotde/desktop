# Voice (TTS / cloning)

Voice catalog, recorder, and provider for cloned / playback voices. Distinct from **audio** (STT / prompt mic).

## Flag

`voice-cloning` (default **on**). Settings UI: `settings/sections/VoiceSection.tsx`.

## Public API

```ts
import { VoiceProvider, VoiceManager, VoiceRecorder, useVoices } from '@/features/voice'
```

| File | Role |
|------|------|
| `VoiceProvider.tsx` | Context |
| `hooks/useVoices.ts` | List / select voices |
| `components/VoiceManager.tsx` | Manage saved voices |
| `components/VoiceRecorder.tsx` | Sample capture |
| `types.ts` | Voice types |

Keep STT and “voice to prompt” in `features/audio/`. Keep OS insert in the `voice-insert` flag effect.
