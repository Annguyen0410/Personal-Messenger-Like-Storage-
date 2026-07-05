# Canvas Board Feature - Cleanup & Verification

- [ ] Inspect current `app.js` for duplicated blocks related to Canvas Board feature.
- [x] Refactor `app.js` to keep only one clean implementation of canvas logic:

  - canvas open/close/toggle
  - canvas init, drawStroke, pointer/touch drawing handlers
  - undo, clear, sendCanvasToChat
  - toolbar updates (tool/color/size/strokes)
- [ ] Ensure event listeners reference existing DOM ids from `index.html`.
- [ ] Run `npm start` and verify:
  - open canvas from left rail
  - draw on canvas
  - undo/clear work
  - send to chat creates an image attachment
  - close/open app persists strokes (optional)

