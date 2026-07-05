---
kind: error_handling
name: Ad-hoc try/catch with toast feedback and graceful defaults
category: error_handling
scope:
    - '**'
source_files:
    - main.js
    - renderer.js
    - preload.js
---

This Electron desktop notebook has no centralized error-handling framework, typed error classes, or middleware. Errors are handled locally where they occur using bare `try`/`catch` blocks that fall back to user-visible toast messages or safe default values.

**Main process (Node side)**
- File I/O (`readJson`, `readSettings`) wraps `fs.readFileSync` + `JSON.parse` in `try`/`catch` and returns a sane empty object on failure so the app boots even with a corrupted store file.
- IPC handlers never throw; they return `{ ok: true }`, `null`, or an empty array when operations fail (e.g., canceled dialog, missing base64 payload). The custom `local-file://` protocol handler returns a `Response("Not found", { status: 404 })` for missing files.
- No `process.on('uncaughtException')` / `unhandledRejection` listeners exist.

**Renderer process (UI side)**
- User-facing failures surface through a small `toast(msg)` helper that briefly shows a DOM element — used for microphone permission denial, short recordings, cancelled recordings, copy-to-clipboard, pin/unpin, edit, delete, theme changes, etc.
- A single `catch (err) { toast("Microphone access denied") }` around `getUserMedia` is the only explicit catch in the renderer.
- All other async flows (`api.load`, `api.save`, `api.pickFiles`, `api.saveCanvas`, `api.saveVoice`) are called without `.catch()` or `try`/`catch`; failures silently bubble as unhandled promise rejections.
- State initialization defensively falls back to `{ messages: [] }` / `{ darkMode: false, ... }` when the preload bridge returns `null`/`undefined`.

**Preload bridge**
- Simply forwards calls via `ipcRenderer.invoke`; it does not wrap errors or translate them into a structured shape.

**Conventions observed**
- Failures are treated as non-fatal: corrupt JSON → empty store; missing file → 404 response; canceled dialog → empty array; bad base64 → `null` result.
- There is no error propagation across IPC boundaries — callers must check for `null`/empty results rather than inspecting thrown exceptions.
- No logging library, stack traces, or error-reporting endpoint is wired up.