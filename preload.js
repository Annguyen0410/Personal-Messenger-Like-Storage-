const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("messenger", {
  load: () => ipcRenderer.invoke("store:load"),
  save: data => ipcRenderer.invoke("store:save", data),
  pickFiles: () => ipcRenderer.invoke("file:pick"),
  saveCanvas: dataUrl => ipcRenderer.invoke("file:saveCanvas", dataUrl),
  openFile: storedName => ipcRenderer.invoke("file:open", storedName),
  revealFile: storedName => ipcRenderer.invoke("file:reveal", storedName),
  fileUrl: storedName => `local-file:///${encodeURIComponent(storedName)}`
});
