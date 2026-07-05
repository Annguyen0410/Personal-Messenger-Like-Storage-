const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  load: () => ipcRenderer.invoke("store:load"),
  save: d => ipcRenderer.invoke("store:save", d),
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: d => ipcRenderer.invoke("settings:save", d),
  pickFiles: () => ipcRenderer.invoke("file:pick"),
  saveCanvas: d => ipcRenderer.invoke("file:saveCanvas", d),
  openFile: n => ipcRenderer.invoke("file:open", n),
  revealFile: n => ipcRenderer.invoke("file:reveal", n),
  saveVoice: d => ipcRenderer.invoke("voice:save", d),
  notify: o => ipcRenderer.invoke("notify:show", o),
  setTheme: m => ipcRenderer.invoke("theme:set", m),
  fileUrl: n => `local-file:///${encodeURIComponent(n)}`
});
