# Media Upload Card Component

A modular, extensible component for handling media uploads with support for files, screenshots, and screen recording.

## Structure

```
media-upload-card/
├── components/          # Sub-components
│   ├── hidden-file-inputs.tsx
│   └── media-option-button.tsx
├── constants/          # Constants and configuration
│   └── media-upload-constants.ts
├── hooks/             # Custom hooks
│   ├── use-file-handler.ts
│   ├── use-file-inputs.ts
│   ├── use-media-options.ts
│   └── use-screenshot-handlers.ts
├── types/             # TypeScript types and interfaces
│   └── media-upload-types.ts
├── utils/             # Utility functions
│   └── screenshot-to-file.ts
├── media-upload-card.tsx  # Main component
├── index.ts          # Public exports
└── README.md         # This file
```

## Features

- **File Uploads**: Documents, images, videos, and audio files
- **Screenshot Capture**: Quick screenshots and area selection
- **Screen Recording**: Trigger screen recording
- **Feature Flags**: Options are shown/hidden based on feature flags
- **Extensible**: Easy to add new media options

## Usage

```tsx
import { MediaUploadCard } from '@/components/media-upload-card'

<MediaUploadCard
  onFileUpload={(files) => console.log(files)}
  onScreenshot={(screenshot) => console.log(screenshot)}
  isDarkTheme={true}
  onMoreClick={() => console.log('More clicked')}
/>
```

## Extending the Component

### Adding a New Media Option

1. Add the option to `use-media-options.ts`:
```tsx
{
  id: 'new-option',
  label: 'New Option',
  icon: YourIcon,
  action: () => handleNewOption(),
}
```

2. Add feature flag mapping in `constants/media-upload-constants.ts`:
```tsx
FEATURE_FLAGS: {
  'new-option': 'new-option-feature',
  // ...
}
```

### Adding Custom Hooks

Create new hooks in the `hooks/` directory and export them from `hooks/index.ts`.

### Adding Utility Functions

Add utility functions to the `utils/` directory and export them from `index.ts`.

## Exports

- `MediaUploadCard` - Main component
- `MediaUploadCardProps` - Component props type
- `MediaOption` - Option configuration type
- `ScreenshotData` - Screenshot data type
- `MEDIA_UPLOAD_CONSTANTS` - Constants object
- Hooks: `useFileInputs`, `useFileHandler`, `useScreenshotHandlers`, `useMediaOptions`
- Utils: `screenshotToFile`, `validateCaptureAPI`, `validateCaptureAPIMethod`

