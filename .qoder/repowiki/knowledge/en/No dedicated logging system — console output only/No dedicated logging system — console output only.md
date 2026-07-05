---
kind: logging_system
name: No dedicated logging system — console output only
category: logging_system
scope:
    - '**'
---

This repository does not implement a structured logging system. There is no logging framework, logger module, log-level strategy, or centralized logging configuration anywhere in the codebase.

Evidence:
- No `log/` or `logging/` directory exists.
- No logging library is imported in any source file (`main.js`, `renderer.js`, `app.js`, `preload.js`).
- Zero uses of `console.log`, `console.error`, `console.warn`, `console.info`, or `console.debug` across all `.js` files.
- The only reference to logging-related tooling is a dependency on the `debug` package (v4.x) that ships transitively through Electron's own dependencies; it is never required or used by application code.
- The `.gitignore` ignores `*.log` files, but no log files are produced at runtime.
- User-facing feedback is delivered exclusively via an in-app toast UI and native OS notifications (`Notification.isSupported()`), not via logs.

Conclusion: this category does not apply to the project. If logging were added, the natural place would be `main.js` for IPC/file-system operations and `renderer.js`/`app.js` for UI events, using a single shared logger module.