# Skills

User-authored workflows stored as Markdown (`skill.md`-style) in the app user-data folder.

| File | Role |
|------|------|
| `skills-service.js` | IPC: list, get, save, delete, record usage |
| `skills-store.js` | Files on disk |

Settings UI: **Skills** (`SkillsSection.tsx`).

IPC channels: `skills:list`, `skills:get`, `skills:save`, `skills:delete`, `skills:record-usage`.
