# Settings

Settings is a modal overlay (`SettingsOverlay` → `features/settings`). Menu groups live in `menu.ts`. Each `SettingsSectionId` has a section component under `sections/`.

| ID | Label | What it configures | Section file |
|----|-------|--------------------|--------------|
| `personalization` | Personalization | Nickname, style, custom instructions | `PersonalizationSection.tsx` |
| `account` | Account | Optional sign-in | `AccountSection.tsx` |
| `general` | General | Language, chrome, history, startup | `GeneralSection.tsx` |
| `appearance` | Appearance | Theme, palettes | `AppearanceSection.tsx` |
| `features` | Features | All feature-flag toggles | `FeaturesSection.tsx` |
| `animations` | Animations | Assistant / Lottie motion | `AnimationsSection.tsx` |
| `local-llm` | Local AI | Ollama / local endpoints | `LocalLLMSection.tsx` |
| `model-profiles` | Model Profiles | Saved provider presets | `ModelProfileListSection.tsx` |
| `custom-models` | Custom Models | API keys and custom endpoints | `CustomModelsSection.tsx` |
| `integrations` | Integrations | Composio tools | `IntegrationsSection.tsx` |
| `mcp-servers` | MCP Servers | User MCP servers + Cua | `McpServersSection.tsx` |
| `skills` | Skills | `skill.md` workflows | `SkillsSection.tsx` |
| `remote-pad` | Remote connection | QR, PIN, LiveKit | `RemotePadSection.tsx` |
| `insert-pins` | Insert pins | Number → app window | `InsertPinsSection.tsx` |
| `blocking` | App Blocking | Blocked sites/apps | `BlockingSection.tsx` |
| `voice` | Voice | TTS / cloning (if shown) | `VoiceSection.tsx` |
| `help` | Help | Shortcuts and docs | `HelpSection.tsx` |

## Adding a settings page

1. Add an id to `SettingsSectionId` and a row in `SETTINGS_MENU_GROUPS`.
2. Create `sections/MySection.tsx` and export it from `sections/index.ts`.
3. Render it from the settings modal switch (same pattern as existing sections).
4. Add a row to [features.md](features.md) and this file.

Public import: `import { SettingsModal } from '@/features/settings'`.
