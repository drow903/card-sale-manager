const { app, BrowserWindow, dialog, ipcMain, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow;

if (process.env.CARD_SALE_CAPTURE_PATH) app.disableHardwareAcceleration();

if (process.env.CARD_SALE_DATA_DIR) {
  app.setPath("userData", process.env.CARD_SALE_DATA_DIR);
  app.setPath("sessionData", path.join(process.env.CARD_SALE_DATA_DIR, "session"));
}

function dataPath() {
  const base = process.env.CARD_SALE_DATA_DIR || app.getPath("userData");
  return path.join(base, "card-sale-manager.json");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    show: !process.env.CARD_SALE_CAPTURE_PATH,
    width: 1500,
    height: 940,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: "#f5f7fa",
    title: "Card Sale Manager",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile("index.html");
  if (process.env.CARD_SALE_CAPTURE_PATH) {
    mainWindow.webContents.once("did-finish-load", async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (process.env.CARD_SALE_CAPTURE_VIEW === "match-review") {
        await mainWindow.webContents.executeJavaScript("autoMatchImages()");
        await new Promise((resolve) => setTimeout(resolve, 2500));
      } else if (process.env.CARD_SALE_CAPTURE_VIEW === "claims") {
        await mainWindow.webContents.executeJavaScript("showView('claims')");
      } else if (process.env.CARD_SALE_CAPTURE_VIEW === "copied") {
        await mainWindow.webContents.executeJavaScript("activeSale().cards[0].hiddenAfterCopy = true; state.filter = 'copied'; document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === 'copied')); renderListings()");
      } else if (process.env.CARD_SALE_CAPTURE_VIEW === "folders") {
        await mainWindow.webContents.executeJavaScript("renderFolderSettings(); document.querySelector('#folderSettingsDialog').showModal()");
      }
      const image = await mainWindow.webContents.capturePage();
      await fs.promises.writeFile(process.env.CARD_SALE_CAPTURE_PATH, image.toPNG());
      app.quit();
    });
  }
}

app.whenReady().then(() => {
  ipcMain.handle("data:load", async () => {
    try {
      return JSON.parse(await fs.promises.readFile(dataPath(), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  });

  ipcMain.handle("data:save", async (_event, payload) => {
    const target = dataPath();
    const temp = `${target}.tmp`;
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(temp, JSON.stringify(payload, null, 2), "utf8");
    await fs.promises.rename(temp, target);
    return { ok: true, path: target };
  });

  ipcMain.handle("dialog:spreadsheet", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose a card spreadsheet",
      properties: ["openFile"],
      filters: [
        { name: "Spreadsheets", extensions: ["xlsx", "xls", "csv", "tsv"] },
        { name: "All files", extensions: ["*"] }
      ]
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("dialog:images", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose card images",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff"] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle("dialog:image-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose an image folder",
      properties: ["openDirectory"]
    });
    if (result.canceled) return [];
    const folder = result.filePaths[0];
    const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"]);
    const files = await fs.promises.readdir(folder, { withFileTypes: true });
    return files
      .filter((entry) => entry.isFile() && supported.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => path.join(folder, entry.name));
  });

  ipcMain.handle("dialog:lookup-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose the base card-image folder",
      properties: ["openDirectory"]
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("images:scan-folder", async (_event, input) => {
    const folders = (typeof input === "string" ? [input] : input?.folders || []).filter(Boolean);
    const excludedFolders = (typeof input === "string" ? [] : input?.excludedFolders || [])
      .map((folder) => path.resolve(folder).toLowerCase());
    if (!folders.length) return [];
    const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"]);
    const found = [];
    const seen = new Set();
    const isExcluded = (folder) => {
      const resolved = path.resolve(folder).toLowerCase();
      return excludedFolders.some((excluded) => resolved === excluded || resolved.startsWith(`${excluded}${path.sep}`));
    };
    async function walk(folder, root) {
      if (isExcluded(folder)) return;
      const entries = await fs.promises.readdir(folder, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(folder, entry.name);
        if (entry.isDirectory()) await walk(fullPath, root);
        else if (entry.isFile() && supported.has(path.extname(entry.name).toLowerCase())) {
          const key = fullPath.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          found.push({
            path: fullPath,
            name: entry.name,
            stem: path.basename(entry.name, path.extname(entry.name)),
            relativePath: path.join(path.basename(root), path.relative(root, fullPath))
          });
        }
      }
    }
    for (const folder of folders) {
      if (fs.existsSync(folder) && !isExcluded(folder)) await walk(folder, folder);
    }
    return found;
  });

  ipcMain.handle("file:start-drag", (event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return;
    let icon = nativeImage.createFromPath(filePath);
    if (icon.isEmpty()) icon = nativeImage.createEmpty();
    event.sender.startDrag({ file: filePath, icon: icon.resize({ width: 96, height: 96 }) });
    return true;
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
