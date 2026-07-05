# Messenger (Self-Chat)

A small **Electron desktop app** that looks like Facebook Messenger, but it's
just you — a private notebook styled as a chat-to-self, with full **file
attachment** support.

Type a message → it goes to disk. Drop a file → it copies to a local
`files/` folder. Close the app, reopen it, everything is still there. No
server, no network, no account, no cloud.

## Features

- Messenger-style UI: dark left rail, conversation sidebar, blue bubbles, day dividers
- Multiple self-chats (default: "Notes to Self") — add more for Ideas, Tasks, etc.
- **Attach any file type** — images, PDFs, docs, spreadsheets, audio, video, archives, code, anything
- **Two ways to attach**: click the 📎 paperclip button, or drag-and-drop files onto the chat
- **Inline previews**: images show a thumbnail, audio/video play natively, everything else gets a styled card with a category-specific icon
- Click any attachment to open it in your system's default app
- All notes + file references persisted to `data.json` in your user-data folder
- All file contents stored under `files/` next to `data.json` (named with random UUIDs)
- Search bar in the sidebar (matches chat names and message contents)
- Pin chats to the top, rename, delete, clear all messages
- Right-click any message → copy text / delete (deletions also clean up attached files)
- Keyboard shortcuts: `Enter` to send, `Esc` to dismiss menus, `/` to focus input
- Export all notes to a JSON backup
- Custom app icon, single-instance lock, native menu hidden

## Run it

```bash
# from D:\Code folder\Messenger
npm install        # first time only — pulls Electron
npm start          # launches the desktop window
```

That opens a real desktop window. The first `npm install` downloads Electron
(~90MB), takes a minute. After that `npm start` launches in 2-3 seconds.

Then:
- Type into the bottom input and hit **Enter** to drop a note
- Click the **📎 paperclip** to pick one or many files, or just drag files onto the chat
- Files are saved to a local folder; images show inline, audio/video play, other types open with the default app

## Where data lives

Your notes (`data.json`) and files (`files/`) are saved in your Electron
`userData` folder. On Windows that's typically:

```
C:\Users\<you>\AppData\Roaming\messenger-self-chat\
├── data.json      # all messages + chat metadata
└── files\         # attached file contents (UUID-named)
```

Click the **dots button** at the bottom of the left rail to open that folder
in Explorer. You can also click the **arrow-down button** to export a JSON
backup.

## Files

| File          | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| `main.js`     | Electron main — window, IPC, JSON I/O, file storage, safe-file://   |
| `preload.js`  | contextBridge — exposes a safe `window.api` (data + file methods)    |
| `index.html`  | Messenger UI markup                                                 |
| `styles.css`  | Messenger theme + file attachment bubbles + dropzone                 |
| `app.js`      | Renderer logic — state, rendering, mutations, file attach, drag-drop |
| `package.json`| `electron` devDependency, `npm start` runs it                         |

## Notes

- The renderer has `contextIsolation: true` and no Node access — all disk I/O
  happens in the main process via IPC. Safe default.
- A custom `safe-file://` protocol serves file bytes back to the renderer so
  images can render inline without exposing the filesystem.
- CSP allows only same-origin + `safe-file:` (no external scripts/fonts).
- Single-instance lock prevents multiple windows.
- UI is mobile-responsive — drag the window narrow and the sidebar collapses.
- To rebuild later, delete `package-lock.json` + `node_modules` and re-run.