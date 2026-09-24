const { contextBridge, ipcRenderer } = require("electron");
const XLSX = require("xlsx");

contextBridge.exposeInMainWorld("cardSale", {
  load: () => ipcRenderer.invoke("data:load"),
  save: (payload) => ipcRenderer.invoke("data:save", payload),
  backup: (reason) => ipcRenderer.invoke("data:backup", reason),
  csmStatus: () => ipcRenderer.invoke("csm:status"),
  openCsm: (filePath, options) => ipcRenderer.invoke("csm:open", filePath, options),
  saveCsm: (payload, options) => ipcRenderer.invoke("csm:save", payload, options),
  saveCsmAs: (payload) => ipcRenderer.invoke("csm:save-as", payload),
  detachCsm: () => ipcRenderer.invoke("csm:detach"),
  relinkCsmImages: () => ipcRenderer.invoke("csm:relink"),
  packageCsm: (payload) => ipcRenderer.invoke("csm:package", payload),
  csmRecentAction: (filePath, action) => ipcRenderer.invoke("csm:recent-action", filePath, action),
  restoreCsmBackup: (filePath) => ipcRenderer.invoke("csm:restore-backup", filePath),
  revealCsm: (target) => ipcRenderer.invoke("csm:reveal", target),
  onCsmOpenRequest: (callback) => { const listener = (_event, filePath) => callback(filePath); ipcRenderer.on("csm:open-request", listener); return () => ipcRenderer.removeListener("csm:open-request", listener); },
  nativeDiagnosticEvents: () => ipcRenderer.invoke("diagnostic:native-events"),
  saveDiagnosticReport: (report) => ipcRenderer.invoke("diagnostic:save", report),
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
  previewPackingSlip: (payload) => ipcRenderer.invoke("packing:preview-pdf", payload),
  exportPackingPdf: (payload) => ipcRenderer.invoke("packing:export-pdf", payload),
  choosePackingLogo: () => ipcRenderer.invoke("packing:choose-logo"),
  packingFileDataUrl: (filePath) => ipcRenderer.invoke("packing:file-data-url", filePath),
  packingQrDataUrl: (value, color) => ipcRenderer.invoke("packing:qr-data-url", value, color),
  checkForUpdate: () => ipcRenderer.invoke("app:check-update"),
  downloadAndInstallUpdate: (update) => ipcRenderer.invoke("app:download-install-update", update),
  onUpdateProgress: (callback) => { const listener = (_event, details) => callback(details); ipcRenderer.on("app:update-progress", listener); return () => ipcRenderer.removeListener("app:update-progress", listener); },
  onPrepareClose: (callback) => { const listener = () => callback(); ipcRenderer.on("app:prepare-close", listener); return () => ipcRenderer.removeListener("app:prepare-close", listener); },
  closeReady: () => ipcRenderer.invoke("app:close-ready"),
  copyText: (value) => ipcRenderer.invoke("clipboard:write", value),
  version: () => ipcRenderer.invoke("app:version")
});
