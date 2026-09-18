const { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } = require("electron");
app.disableHardwareAcceleration();
const fs = require("fs");
const path = require("path");
const https = require("https");

const UPDATE_REPOSITORY = "drow903/card-sale-manager";

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

function versionParts(value) {
  const match = String(value || "").trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map(Number) : null;
}

function isNewerVersion(candidate, current) {
  const next = versionParts(candidate);
  const installed = versionParts(current);
  if (!next || !installed) return false;
  return next.some((value, index) => value !== installed[index] && value > installed[index]
    && next.slice(0, index).every((part, prior) => part === installed[prior]));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": `Card-Sale-Manager/${app.getVersion()}`,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      timeout: 15000
    }, (response) => {
      if (response.statusCode === 404) {
        response.resume();
        resolve(null);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`GitHub returned status ${response.statusCode}.`));
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
        if (body.length > 2 * 1024 * 1024) request.destroy(new Error("Update information was too large."));
      });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error("GitHub returned unreadable update information.")); }
      });
    });
    request.on("timeout", () => request.destroy(new Error("The update check timed out.")));
    request.on("error", reject);
  });
}

function getText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { "User-Agent": `Mozilla/5.0 Card-Sale-Manager/${app.getVersion()}` }, timeout: 15000 }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 4) {
        response.resume();
        resolve(getText(new URL(response.headers.location, url).toString(), redirects + 1));
        return;
      }
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`Facebook returned status ${response.statusCode}.`)); return; }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; if (body.length > 5 * 1024 * 1024) request.destroy(new Error("The Facebook page was too large.")); });
      response.on("end", () => resolve(body));
    });
    request.on("timeout", () => request.destroy(new Error("The Facebook request timed out.")));
    request.on("error", reject);
  });
}

async function checkForUpdate() {
  try {
    const release = await getJson(`https://api.github.com/repos/${UPDATE_REPOSITORY}/releases/latest`);
    if (!release || release.draft || release.prerelease) return { status: "unavailable", currentVersion: app.getVersion() };
    const tag = String(release.tag_name || "");
    if (!versionParts(tag)) return { status: "error", message: "The latest GitHub release has an unsupported version number." };
    const releaseUrl = `https://github.com/${UPDATE_REPOSITORY}/releases/tag/${tag}`;
    if (release.html_url !== releaseUrl) return { status: "error", message: "GitHub returned an unexpected release address." };
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const preferred = assets.find((asset) => /Card-Sale-Manager.*Setup\.exe$/i.test(asset.name || ""))
      || assets.find((asset) => /Card-Sale-Manager.*Portable\.exe$/i.test(asset.name || ""))
      || assets.find((asset) => /Card-Sale-Manager.*\.zip$/i.test(asset.name || ""));
    const downloadUrl = preferred?.browser_download_url || releaseUrl;
    if (!downloadUrl.startsWith(`https://github.com/${UPDATE_REPOSITORY}/`)) return { status: "error", message: "The update download address was not recognized." };
    if (!isNewerVersion(tag, app.getVersion())) return { status: "current", currentVersion: app.getVersion() };
    return {
      status: "available",
      currentVersion: app.getVersion(),
      version: tag.replace(/^v/, ""),
      notes: String(release.body || "").slice(0, 12000),
      releaseUrl,
      downloadUrl,
      assetName: preferred?.name || "GitHub release"
    };
  } catch (error) {
    return { status: "error", currentVersion: app.getVersion(), message: error.message || "Could not check for updates." };
  }
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
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const captureName = path.basename(process.env.CARD_SALE_CAPTURE_PATH || "").toLowerCase();
      const captureView = process.env.CARD_SALE_CAPTURE_VIEW || (["dashboard", "orders", "packing", "live", "claims", "buyers", "health", "parser", "quick-edit", "closing", "copied", "folders"].find((view) => captureName.includes(view)) || "");
      if (captureView === "match-review") {
        await mainWindow.webContents.executeJavaScript("autoMatchImages()");
        await new Promise((resolve) => setTimeout(resolve, 2500));
      } else if (captureView === "claims") {
        await mainWindow.webContents.executeJavaScript("showView('claims')");
      } else if (captureView === "copied") {
        await mainWindow.webContents.executeJavaScript("activeSale().cards[0].hiddenAfterCopy = true; state.filter = 'copied'; document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === 'copied')); renderListings()");
      } else if (captureView === "folders") {
        await mainWindow.webContents.executeJavaScript("renderFolderSettings(); document.querySelector('#folderSettingsDialog').showModal()");
      } else if (captureView === "parser") {
        await mainWindow.webContents.executeJavaScript("document.querySelector('#parseClaimsBtn').click(); document.querySelector('#claimComments').value='John Smith: mine 1\\nJane Doe: take #2\\nNoise that cannot be parsed'; document.querySelector('#previewClaimsBtn').click()");
      } else if (captureView === "quick-edit") {
        await mainWindow.webContents.executeJavaScript("showView('sale'); openQuickEdit(activeSale().cards[0].id)");
      } else if (captureView === "closing") {
        await mainWindow.webContents.executeJavaScript("showView('sale'); openCloseSale()");
      } else if (["dashboard", "orders", "packing", "live", "buyers", "health"].includes(captureView)) {
        await mainWindow.webContents.executeJavaScript(`showView(${JSON.stringify(captureView)})`);
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
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

  ipcMain.handle("dialog:lookup-folders", async (_event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: title || "Choose card-image folders",
      properties: ["openDirectory", "multiSelections"]
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle("app:check-update", checkForUpdate);
  ipcMain.handle("app:open-update", async (_event, target) => {
    const value = String(target || "");
    const allowedPrefix = `https://github.com/${UPDATE_REPOSITORY}/`;
    if (!value.startsWith(allowedPrefix)) return false;
    await shell.openExternal(value);
    return true;
  });
  ipcMain.handle("app:version", () => app.getVersion());
  ipcMain.handle("app:download-template", async () => {
    const result = await dialog.showSaveDialog(mainWindow, { title: "Save the card import template", defaultPath: "Card-Sale-Manager-Import-Template.xlsx", filters: [{ name: "Excel workbook", extensions: ["xlsx"] }] });
    if (result.canceled || !result.filePath) return false;
    await fs.promises.copyFile(path.join(__dirname, "assets", "Card-Sale-Manager-Import-Template.xlsx"), result.filePath);
    return true;
  });
  ipcMain.handle("app:open-data-folder", async () => {
    await fs.promises.mkdir(path.dirname(dataPath()), { recursive: true });
    return shell.openPath(path.dirname(dataPath()));
  });
  ipcMain.handle("app:open-folder", async (_event, folderPath) => {
    const value = String(folderPath || "");
    if (!value || !path.isAbsolute(value) || !fs.existsSync(value)) return "Folder not found.";
    return shell.openPath(value);
  });
  ipcMain.handle("facebook:open", async (_event, target) => {
    const value = String(target || "");
    let parsed;
    try { parsed = new URL(value); } catch { return false; }
    if (parsed.protocol !== "https:" || !/(^|\.)facebook\.com$/i.test(parsed.hostname)) return false;
    await shell.openExternal(value);
    return true;
  });
  ipcMain.handle("tracking:open", async (_event, target) => {
    const value = String(target || ""); let parsed;
    try { parsed = new URL(value); } catch { return false; }
    const allowed = ["tools.usps.com", "www.ups.com", "www.fedex.com"];
    if (parsed.protocol !== "https:" || !allowed.includes(parsed.hostname.toLowerCase())) return false;
    await shell.openExternal(value); return true;
  });
  ipcMain.handle("facebook:fetch-public", async (_event, target) => {
    const value = String(target || "");
    let parsed;
    try { parsed = new URL(value); } catch { return { ok: false, message: "Enter a valid Facebook link." }; }
    if (parsed.protocol !== "https:" || !/(^|\.)facebook\.com$/i.test(parsed.hostname)) return { ok: false, message: "Only facebook.com links are supported." };
    try {
      const html = await getText(value);
      if (/log in|login_form|checkpoint/i.test(html)) return { ok: false, message: "Facebook requires a login for this post. Open it and paste the comments instead." };
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      return { ok: true, text: text.slice(0, 250000) };
    } catch (error) { return { ok: false, message: error.message || "Could not read that Facebook post." }; }
  });
  ipcMain.handle("print:packing-slip", async (_event, payload) => {
    const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    const title = String(payload?.title || "Packing slip").replace(/[<>]/g, "");
    const body = String(payload?.html || "");
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><head><title>${title}</title><style>body{font:14px Arial;padding:32px;color:#172333}h1{font-size:24px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}.total{font-size:18px;font-weight:bold;text-align:right;margin-top:20px}</style></head><body>${body}</body></html>`)}`);
    return new Promise((resolve) => printWindow.webContents.print({ silent: false, printBackground: true }, (success, reason) => { printWindow.close(); resolve({ success, reason }); }));
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
