---
kind: configuration_system
name: Electron User-Data JSON Persistence (No External Config System)
category: configuration_system
scope:
    - '**'
source_files:
    - main.js
    - preload.js
    - app.js
---

This repository does not implement a dedicated configuration system. There are no config files (`.env`, `.yaml`, `.toml`, `application.properties`), no environment-variable loading, no feature-flag framework, and no externalized runtime settings loader.

Instead, the app uses Electron's built-in user-data directory as its sole persistence layer:
- Messages are stored in `<userData>/messages.json` via `readJson`/`writeJson` in `main.js`.
- App preferences (dark mode, theme, chat background) live in `<userData>/settings.json` via `readSettings`/`writeSettings` with defaults `{ darkMode: false, theme: "blue", chatBg: "default" }`.
- Attached files and voice notes are saved under `<userData>/files` and `<userData>/voice` respectively.
- The renderer (`app.js`) never reads config directly; it communicates with the main process through IPC channels exposed by `preload.js` (`store:load`, `store:save`, `settings:load`, `settings:save`).

There is no hot-reload of settings at runtime — `nativeTheme.themeSource` is applied once during window creation from the persisted `settings.json`. No CLI flags or environment variables influence behavior.