# Settings

In-app settings modal. Overlay route id: `settings`.

Menu: `menu.ts`. Sections: `sections/*.tsx`. Full table: [docs/settings.md](../../../../docs/settings.md).

## Public API

```ts
import { SettingsModal, SETTINGS_MENU_ITEMS } from '@/features/settings'
```

| Area | Files |
|------|--------|
| Shell | `components/SettingsModal`, `SettingsSidebar`, `SettingsCard` |
| Feature toggles | `sections/FeaturesSection.tsx` (reads the feature-flag registry) |
| Models / keys | `CustomModelsSection`, `ModelProfileListSection`, `LocalLLMSection` |
| Phone | `RemotePadSection.tsx` |
| Pins | `InsertPinsSection.tsx` — assign with **Ctrl+Shift+P**, manage here |

Adding a page: extend `SettingsSectionId` + `SETTINGS_MENU_GROUPS`, add a section component, document in `docs/settings.md` and `docs/features.md`.
