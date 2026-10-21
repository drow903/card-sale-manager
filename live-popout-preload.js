const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("csmLive", {
  onState: (callback) => { const listener = (_event, state) => callback(state); ipcRenderer.on("live-popout:state", listener); return () => ipcRenderer.removeListener("live-popout:state", listener); },
  action: (action) => ipcRenderer.invoke("live-popout:action", action),
  startDrag: (filePath) => ipcRenderer.invoke("file:start-drag", filePath),
  opacity: (value) => ipcRenderer.invoke("live-popout:opacity", value),
  close: () => ipcRenderer.invoke("live-popout:close")
});
