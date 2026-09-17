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
  scanImageFolder: (baseFolder) => ipcRenderer.invoke("images:scan-folder", baseFolder),
  startDrag: (filePath) => ipcRenderer.invoke("file:start-drag", filePath)
});
