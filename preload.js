const { contextBridge, ipcRenderer } = require("electron");
const XLSX = require("xlsx");

contextBridge.exposeInMainWorld("cardSale", {
  load: () => ipcRenderer.invoke("data:load"),
  save: (payload) => ipcRenderer.invoke("data:save", payload),
  chooseSpreadsheet: () => ipcRenderer.invoke("dialog:spreadsheet"),
  parseSpreadsheet: (filePath) => {
    const workbook = XLSX.readFile(filePath, { cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return {
      name: workbook.SheetNames[0],
      rows: XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false })
    };
  },
  chooseImages: () => ipcRenderer.invoke("dialog:images"),
  chooseImageFolder: () => ipcRenderer.invoke("dialog:image-folder"),
  chooseLookupFolder: () => ipcRenderer.invoke("dialog:lookup-folder"),
  chooseLookupFolders: (title) => ipcRenderer.invoke("dialog:lookup-folders", title),
  scanImageFolder: (baseFolder) => ipcRenderer.invoke("images:scan-folder", baseFolder),
  onImageScanProgress: (callback) => { const listener = (_event, details) => callback(details); ipcRenderer.on("images:scan-progress", listener); return () => ipcRenderer.removeListener("images:scan-progress", listener); },
  startDrag: (filePath) => ipcRenderer.invoke("file:start-drag", filePath),
  downloadTemplate: () => ipcRenderer.invoke("app:download-template"),
  openDataFolder: () => ipcRenderer.invoke("app:open-data-folder"),
  openFolder: (folderPath) => ipcRenderer.invoke("app:open-folder", folderPath),
  openFacebook: (url) => ipcRenderer.invoke("facebook:open", url),
  openTracking: (url) => ipcRenderer.invoke("tracking:open", url),
  fetchFacebookPost: (url) => ipcRenderer.invoke("facebook:fetch-public", url),
  printPackingSlip: (payload) => ipcRenderer.invoke("print:packing-slip", payload),
  checkForUpdate: () => ipcRenderer.invoke("app:check-update"),
  downloadAndInstallUpdate: (update) => ipcRenderer.invoke("app:download-install-update", update),
  onUpdateProgress: (callback) => { const listener = (_event, details) => callback(details); ipcRenderer.on("app:update-progress", listener); return () => ipcRenderer.removeListener("app:update-progress", listener); },
  copyText: (value) => ipcRenderer.invoke("clipboard:write", value),
  version: () => ipcRenderer.invoke("app:version")
});
