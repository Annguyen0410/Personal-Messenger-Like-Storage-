const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("monitorApi", {
  fetchQuakes: () => ipcRenderer.invoke("monitor:quakes"),
  fetchIndices: () => ipcRenderer.invoke("monitor:indices"),
  fetch2YYield: () => ipcRenderer.invoke("monitor:2y-yield"),
  close: () => ipcRenderer.send("monitor:close")
});
