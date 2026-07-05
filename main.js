const { app, BrowserWindow, ipcMain, dialog, shell, protocol, Notification, nativeTheme, net } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");

protocol.registerSchemesAsPrivileged([
  { scheme: "local-file", privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } }
]);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let win = null;
let monitorWin = null;
const DATA = () => path.join(app.getPath("userData"), "messages.json");
const SETTINGS = () => path.join(app.getPath("userData"), "settings.json");
const FDIR = () => path.join(app.getPath("userData"), "files");
const VDIR = () => path.join(app.getPath("userData"), "voice");

function ensure() {
  fs.mkdirSync(FDIR(), { recursive: true });
  fs.mkdirSync(VDIR(), { recursive: true });
}

function loadJSON() {
  try { return JSON.parse(fs.readFileSync(DATA(), "utf8")); } catch { return { messages: [] }; }
}
function saveJSON(d) {
  fs.mkdirSync(path.dirname(DATA()), { recursive: true });
  fs.writeFileSync(DATA(), JSON.stringify(d || { messages: [] }), "utf8");
}
function loadCfg() {
  try { return JSON.parse(fs.readFileSync(SETTINGS(), "utf8")); } catch { return { darkMode: false, theme: "blue" }; }
}
function saveCfg(d) {
  fs.mkdirSync(path.dirname(SETTINGS()), { recursive: true });
  fs.writeFileSync(SETTINGS(), JSON.stringify(d), "utf8");
}

function safeFile(name, dirFn) {
  if (!name || typeof name !== "string" || /[\/\\]/.test(name) || name.includes("..")) return null;
  const base = path.normalize(dirFn() + path.sep);
  const full = path.normalize(path.join(dirFn(), name));
  return full.startsWith(base) ? full : null;
}

const MIME = { ".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".gif":"image/gif",".webp":"image/webp",
  ".mp4":"video/mp4",".webm":"video/webm",".mov":"video/quicktime",
  ".mp3":"audio/mpeg",".wav":"audio/wav",".ogg":"audio/ogg",
  ".pdf":"application/pdf",".txt":"text/plain",".json":"application/json",".zip":"application/zip" };
function mimeOf(n) { return MIME[path.extname(n).toLowerCase()] || "application/octet-stream"; }
function catOf(m) { return m.startsWith("image/") ? "image" : m.startsWith("video/") ? "video" : m.startsWith("audio/") ? "audio" : "file"; }

function storeFile(fp) {
  const st = fs.statSync(fp);
  const ext = path.extname(fp);
  const sn = `${crypto.randomUUID()}${ext}`;
  const m = mimeOf(fp);
  fs.copyFileSync(fp, path.join(FDIR(), sn));
  return { name: path.basename(fp), storedName: sn, size: st.size, mime: m, category: catOf(m) };
}

function registerHandlers() {
  ipcMain.handle("store:load", () => { try { return loadJSON(); } catch { return { messages: [] }; } });
  ipcMain.handle("store:save", (_, d) => { try { saveJSON(d); return { ok: true }; } catch { return { ok: false }; } });
  ipcMain.handle("settings:load", () => { try { return loadCfg(); } catch { return { darkMode: false, theme: "blue" }; } });
  ipcMain.handle("settings:save", (_, d) => { try { saveCfg(d); return { ok: true }; } catch { return { ok: false }; } });

  ipcMain.handle("file:pick", async () => {
    try {
      const r = await dialog.showOpenDialog(win, { properties: ["openFile", "multiSelections"] });
      if (r.canceled) return [];
      ensure();
      return r.filePaths.map(storeFile);
    } catch { return []; }
  });

  ipcMain.handle("file:saveCanvas", (_, dataUrl) => {
    try {
      ensure();
      const b64 = String(dataUrl || "").split(",")[1];
      if (!b64) return null;
      const buf = Buffer.from(b64, "base64");
      const sn = `${crypto.randomUUID()}.png`;
      fs.writeFileSync(path.join(FDIR(), sn), buf);
      return { name: `whiteboard-${Date.now()}.png`, storedName: sn, size: buf.length, mime: "image/png", category: "image" };
    } catch { return null; }
  });

  ipcMain.handle("file:open", (_, n) => {
    const f = safeFile(n, FDIR) || safeFile(n, VDIR);
    if (f) shell.openPath(f);
  });
  ipcMain.handle("file:reveal", (_, n) => {
    const f = safeFile(n, FDIR) || safeFile(n, VDIR);
    if (f) shell.showItemInFolder(f);
  });

  ipcMain.handle("voice:save", (_, b64data) => {
    try {
      ensure();
      const b64 = String(b64data || "").split(",")[1];
      if (!b64) return null;
      const buf = Buffer.from(b64, "base64");
      const sn = `${crypto.randomUUID()}.webm`;
      fs.writeFileSync(path.join(VDIR(), sn), buf);
      return { name: `voice-${Date.now()}.webm`, storedName: sn, size: buf.length, mime: "audio/webm", category: "audio" };
    } catch { return null; }
  });

  ipcMain.handle("notify:show", (_, opts) => {
    try { if (Notification.isSupported()) new Notification({ title: opts.title || "", body: opts.body || "" }).show(); } catch {}
  });

  ipcMain.handle("theme:set", (_, mode) => { nativeTheme.themeSource = mode; });

  /* World Monitor IPC */
  ipcMain.handle("monitor:quakes", async () => {
    try {
      const resp = await net.fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  });

  ipcMain.on("monitor:open", () => {
    console.log("[Main] monitor:open received");
    if (monitorWin) { console.log("[Main] monitor already open, focusing"); monitorWin.focus(); return; }
    const monitorPath = path.join(__dirname, "monitor.html");
    console.log("[Main] creating monitor, loading:", monitorPath);
    try {
      monitorWin = new BrowserWindow({
        frame: false, fullscreen: true,
        backgroundColor: "#0a0a0a",
        webPreferences: {
          preload: path.join(__dirname, "monitor-preload.js"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false
        }
      });
      monitorWin.loadFile(monitorPath);
      monitorWin.webContents.openDevTools({ mode: "detach" });
      monitorWin.on("closed", () => { console.log("[Main] monitor closed"); monitorWin = null; });
      console.log("[Main] monitor window created successfully");
    } catch (err) {
      console.error("[Main] monitor creation failed:", err);
    }
  });

  ipcMain.on("monitor:close", () => { if (monitorWin) monitorWin.close(); });
}

function createWindow() {
  const cfg = loadCfg();
  nativeTheme.themeSource = cfg.darkMode ? "dark" : "light";
  win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 800, minHeight: 560,
    autoHideMenuBar: true,
    backgroundColor: cfg.darkMode ? "#18191a" : "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  ensure();
  registerHandlers();

  protocol.handle("local-file", async req => {
    const sn = decodeURIComponent(new URL(req.url).pathname.slice(1));
    const f = safeFile(sn, FDIR) || safeFile(sn, VDIR);
    if (!f || !fs.existsSync(f)) return new Response("Not found", { status: 404 });
    const st = fs.statSync(f);
    return new Response(Readable.toWeb(fs.createReadStream(f)), {
      headers: { "content-type": mimeOf(f), "content-length": String(st.size) }
    });
  });

  createWindow();
});

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
