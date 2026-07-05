const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("monitorApi", {
  fetchQuakes: () => ipcRenderer.invoke("monitor:quakes"),
  close: () => ipcRenderer.send("monitor:close")
});
