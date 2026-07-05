const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");

protocol.registerSchemesAsPrivileged([
  { scheme: "local-file", privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } }
]);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

let win;
const dataPath = () => path.join(app.getPath("userData"), "messages.json");
const filesDir = () => path.join(app.getPath("userData"), "files");

function ensureDirs() {
  fs.mkdirSync(filesDir(), { recursive: true });
}

function readJson() {
  try {
    return JSON.parse(fs.readFileSync(dataPath(), "utf8"));
  } catch {
    return { messages: [] };
  }
}

function writeJson(data) {
  fs.mkdirSync(path.dirname(dataPath()), { recursive: true });
  fs.writeFileSync(dataPath(), JSON.stringify(data || { messages: [] }, null, 2));
  return { ok: true };
}

function safeStoredPath(storedName) {
  if (!storedName || typeof storedName !== "string") return null;
  if (storedName.includes("/") || storedName.includes("\\") || storedName.includes("..")) return null;
  const root = path.normalize(filesDir() + path.sep);
  const file = path.normalize(path.join(filesDir(), storedName));
  return file.startsWith(root) ? file : null;
}

function mimeFor(name) {
  const ext = path.extname(name).toLowerCase();
  return {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
    ".pdf": "application/pdf", ".txt": "text/plain", ".json": "application/json", ".zip": "application/zip"
  }[ext] || "application/octet-stream";
}

function categoryFor(mime) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "file";
}

function storedMeta(filePath) {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const mime = mimeFor(filePath);
  fs.copyFileSync(filePath, path.join(filesDir(), storedName));
  return {
    name: path.basename(filePath),
    storedName,
    size: stat.size,
    mime,
    category: categoryFor(mime)
  };
}

function registerProtocol() {
  protocol.handle("local-file", async request => {
    const storedName = decodeURIComponent(new URL(request.url).pathname.slice(1));
    const file = safeStoredPath(storedName);
    if (!file || !fs.existsSync(file)) return new Response("Not found", { status: 404 });
    const stat = fs.statSync(file);
    return new Response(Readable.toWeb(fs.createReadStream(file)), {
      headers: { "content-type": mimeFor(file), "content-length": String(stat.size) }
    });
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 760,
    minHeight: 520,
    autoHideMenuBar: true,
    backgroundColor: "#f6f7f9",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.handle("store:load", () => readJson());
ipcMain.handle("store:save", (_event, data) => writeJson(data));
ipcMain.handle("file:pick", async () => {
  const result = await dialog.showOpenDialog(win, { properties: ["openFile", "multiSelections"] });
  if (result.canceled) return [];
  ensureDirs();
  return result.filePaths.map(storedMeta);
});
ipcMain.handle("file:saveCanvas", (_event, dataUrl) => {
  ensureDirs();
  const base64 = String(dataUrl || "").split(",")[1];
  if (!base64) return null;
  const buffer = Buffer.from(base64, "base64");
  const storedName = `${crypto.randomUUID()}.png`;
  fs.writeFileSync(path.join(filesDir(), storedName), buffer);
  return { name: `whiteboard-${Date.now()}.png`, storedName, size: buffer.length, mime: "image/png", category: "image" };
});
ipcMain.handle("file:open", (_event, storedName) => {
  const file = safeStoredPath(storedName);
  if (file) shell.openPath(file);
});
ipcMain.handle("file:reveal", (_event, storedName) => {
  const file = safeStoredPath(storedName);
  if (file) shell.showItemInFolder(file);
});

app.whenReady().then(() => {
  ensureDirs();
  registerProtocol();
  createWindow();
});
app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
