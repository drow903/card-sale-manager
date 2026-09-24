const { app, BrowserWindow, clipboard, dialog, ipcMain, nativeImage, shell } = require("electron");
app.disableHardwareAcceleration();
// Some Windows systems cannot start Chromium's separate GPU subprocess (0xC0000135).
// The app uses local trusted content and software rendering, so keeping that work in-process
// avoids the native breakpoint loop without changing printed or on-screen output.
app.commandLine.appendSwitch("in-process-gpu");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const { spawn } = require("child_process");
const QRCode = require("qrcode");
const { automaticImageResolution, createEnvelope, imagePaths, parseEnvelope, portableData, relinkManifest, replacePaths } = require("./csm-files");

const UPDATE_REPOSITORY = "drow903/card-sale-manager";

let mainWindow;
let allowWindowClose = false;
let closeFallbackTimer = null;
let saveQueue = Promise.resolve();
let activeCsmDocument = null;
const csmInstanceId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let pendingCsmPath = process.argv.find((value) => /\.csm$/i.test(String(value || ""))) || "";

if (process.env.CARD_SALE_CAPTURE_PATH) app.disableHardwareAcceleration();

if (process.env.CARD_SALE_DATA_DIR) {
  app.setPath("userData", process.env.CARD_SALE_DATA_DIR);
  app.setPath("sessionData", path.join(process.env.CARD_SALE_DATA_DIR, "session"));
} else {
  const stableUserData = path.join(app.getPath("appData"), "card-sale-manager");
  app.setPath("userData", stableUserData);
  app.setPath("sessionData", path.join(stableUserData, "session"));
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

function dataPath() {
  const base = process.env.CARD_SALE_DATA_DIR || app.getPath("userData");
  return path.join(base, "card-sale-manager.json");
}

function backupFolderPath() {
  return path.join(path.dirname(dataPath()), "backups");
}

function stabilityLogPath() {
  return path.join(path.dirname(dataPath()), "stability.log");
}

function recentCsmPath() {
  return path.join(path.dirname(dataPath()), "recent-csm-files.json");
}

function csmLockPath(filePath) {
  return `${filePath}.lock`;
}

function csmStatus(extra = {}) {
  return {
    active: Boolean(activeCsmDocument),
    path: activeCsmDocument?.path || "",
    name: activeCsmDocument ? path.basename(activeCsmDocument.path) : "Local workspace",
    readOnly: Boolean(activeCsmDocument?.readOnly),
    conflict: Boolean(activeCsmDocument?.conflict),
    missingImages: Number(activeCsmDocument?.missingImages?.length || 0),
    revision: Number(activeCsmDocument?.revision || 0),
    savedAt: activeCsmDocument?.envelope?.savedAt || "",
    device: os.hostname(),
    missingImageFiles: (activeCsmDocument?.missingImages || []).map((item) => ({ originalPath: item.originalPath || "", fileName: item.fileName || path.basename(item.originalPath || "") })),
    ...extra
  };
}

async function recentCsmFiles() {
  try {
    const values = JSON.parse(await fs.promises.readFile(recentCsmPath(), "utf8"));
    return (Array.isArray(values) ? values : []).filter((item) => item?.path).map((item) => ({ ...item, pinned: Boolean(item.pinned), exists: fs.existsSync(item.path) })).sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.openedAt || "").localeCompare(String(a.openedAt || ""))).slice(0, 15);
  } catch { return []; }
}

async function rememberCsmFile(filePath) {
  const previous = await recentCsmFiles();
  const existing = previous.find((item) => item.path.toLowerCase() === filePath.toLowerCase());
  const next = [{ path: filePath, name: path.basename(filePath), openedAt: new Date().toISOString(), pinned: Boolean(existing?.pinned) }, ...previous.filter((item) => item.path.toLowerCase() !== filePath.toLowerCase())].slice(0, 15);
  await fs.promises.mkdir(path.dirname(recentCsmPath()), { recursive: true });
  await fs.promises.mkdir(path.dirname(recentCsmPath()), { recursive: true });
  await fs.promises.writeFile(recentCsmPath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

async function updateRecentCsmFile(filePath, action) {
  const values = await recentCsmFiles();
  const key = path.resolve(filePath).toLowerCase();
  let next = values.map(({ exists, ...item }) => item);
  if (action === "remove") next = next.filter((item) => path.resolve(item.path).toLowerCase() !== key);
  if (action === "pin") next = next.map((item) => path.resolve(item.path).toLowerCase() === key ? { ...item, pinned: !item.pinned } : item);
  await fs.promises.writeFile(recentCsmPath(), JSON.stringify(next, null, 2), "utf8");
  return recentCsmFiles();
}

function activeCsmBackupFolder() {
  if (!activeCsmDocument?.path) return "";
  return path.join(path.dirname(activeCsmDocument.path), ".csm-backups", path.basename(activeCsmDocument.path, path.extname(activeCsmDocument.path)));
}

async function listCsmBackups() {
  const folder = activeCsmBackupFolder();
  if (!folder) return [];
  let names;
  try { names = (await fs.promises.readdir(folder)).filter((name) => name.endsWith(".csm")).sort().reverse(); } catch { return []; }
  const backups = [];
  for (const name of names.slice(0, 20)) {
    const filePath = path.join(folder, name);
    try {
      const envelope = parseEnvelope(await fs.promises.readFile(filePath, "utf8"));
      const stats = await fs.promises.stat(filePath);
      backups.push({ path: filePath, name, savedAt: envelope.savedAt || stats.mtime.toISOString(), revision: Number(envelope.revision || 0), size: stats.size });
    } catch {}
  }
  return backups;
}

function isActiveCsmBackup(filePath) {
  const folder = activeCsmBackupFolder();
  if (!folder) return false;
  const relative = path.relative(path.resolve(folder), path.resolve(filePath));
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) && path.extname(relative).toLowerCase() === ".csm";
}

function readCsmLock(filePath) {
  try { return JSON.parse(fs.readFileSync(csmLockPath(filePath), "utf8")); } catch { return null; }
}

function writeCsmLock(filePath) {
  const lock = { instanceId: csmInstanceId, device: os.hostname(), pid: process.pid, updatedAt: new Date().toISOString() };
  fs.writeFileSync(csmLockPath(filePath), JSON.stringify(lock, null, 2), "utf8");
}

function releaseCsmLock(document = activeCsmDocument) {
  if (!document?.path || document.readOnly) return;
  const lockPath = csmLockPath(document.path);
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (lock.instanceId === csmInstanceId) fs.unlinkSync(lockPath);
  } catch {}
}

function activeForeignLock(filePath) {
  const lock = readCsmLock(filePath);
  if (!lock || lock.instanceId === csmInstanceId) return null;
  const age = Date.now() - Date.parse(lock.updatedAt || 0);
  return Number.isFinite(age) && age < 12 * 60 * 60 * 1000 ? lock : null;
}

async function writeCsmBackup(filePath, reason = "save", minimumAgeMs = 15 * 60 * 1000) {
  if (!fs.existsSync(filePath)) return null;
  const folder = path.join(path.dirname(filePath), ".csm-backups", path.basename(filePath, path.extname(filePath)));
  await fs.promises.mkdir(folder, { recursive: true });
  const existing = (await fs.promises.readdir(folder)).filter((name) => name.endsWith(".csm")).sort().reverse();
  if (minimumAgeMs && existing[0]) {
    const newest = await fs.promises.stat(path.join(folder, existing[0]));
    if (Date.now() - newest.mtimeMs < minimumAgeMs) return path.join(folder, existing[0]);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(folder, `${stamp}-${String(reason).replace(/[^a-z0-9-]/gi, "-")}.csm`);
  await fs.promises.copyFile(filePath, destination);
  parseEnvelope(await fs.promises.readFile(destination, "utf8"));
  const files = (await fs.promises.readdir(folder)).filter((name) => name.endsWith(".csm")).sort().reverse();
  await Promise.all(files.slice(20).map((name) => fs.promises.unlink(path.join(folder, name)).catch(() => {})));
  return destination;
}

async function writeCsmConflictCopy(payload, sourcePath) {
  const folder = path.dirname(sourcePath);
  const extension = path.extname(sourcePath) || ".csm";
  const base = path.basename(sourcePath, extension);
  const stamp = new Date().toISOString().replace("T", " ").replace(/:/g, "-").slice(0, 19);
  let destination = path.join(folder, `${base} — Conflict Copy ${stamp}${extension}`);
  let number = 2;
  while (fs.existsSync(destination)) destination = path.join(folder, `${base} — Conflict Copy ${stamp} (${number++})${extension}`);
  const envelope = await createEnvelope(payload, destination, app.getVersion(), 1);
  await fs.promises.writeFile(destination, JSON.stringify(envelope, null, 2), "utf8");
  parseEnvelope(await fs.promises.readFile(destination, "utf8"));
  return destination;
}

async function openCsmDocument(filePath, options = {}) {
  const resolvedPath = path.resolve(filePath);
  if (path.extname(resolvedPath).toLowerCase() !== ".csm") throw new Error("Choose a Card Sale Manager .csm file.");
  const envelope = parseEnvelope(await fs.promises.readFile(resolvedPath, "utf8"));
  const foreignLock = activeForeignLock(resolvedPath);
  if (foreignLock && !options.readOnly && !options.takeOver) return { success: false, locked: true, filePath: resolvedPath, device: String(foreignLock.device || "another computer"), updatedAt: foreignLock.updatedAt || "", cloudRevision: Number(envelope.revision || 0), localRevision: Number(activeCsmDocument?.revision || 0), cloudSavedAt: envelope.savedAt || "" };
  const resolved = await automaticImageResolution(envelope, resolvedPath);
  releaseCsmLock();
  const readOnly = Boolean(options.readOnly);
  activeCsmDocument = { path: resolvedPath, revision: Number(envelope.revision || 0), documentId: envelope.documentId, readOnly, conflict: false, envelope, missingImages: resolved.missing };
  if (!readOnly) writeCsmLock(resolvedPath);
  await rememberCsmFile(resolvedPath);
  return { success: true, data: resolved.data, document: csmStatus(), autoRelinked: Object.keys(resolved.replacements).length, missingImages: resolved.missing.length };
}

async function saveActiveCsmDocument(payload, options = {}) {
  if (!activeCsmDocument) return { saved: false, document: csmStatus() };
  if (activeCsmDocument.readOnly && !options.force) return { saved: false, readOnly: true, document: csmStatus() };
  let current = null;
  try { current = parseEnvelope(await fs.promises.readFile(activeCsmDocument.path, "utf8")); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const changedElsewhere = current && (current.documentId !== activeCsmDocument.documentId || Number(current.revision || 0) !== Number(activeCsmDocument.revision || 0));
  if (changedElsewhere && !options.force) {
    const conflictCopyPath = await writeCsmConflictCopy(payload, activeCsmDocument.path);
    const lock = activeForeignLock(activeCsmDocument.path);
    activeCsmDocument.conflict = true;
    activeCsmDocument.readOnly = true;
    releaseCsmLock({ ...activeCsmDocument, readOnly: false });
    return { saved: false, conflict: true, conflictCopyPath, cloudRevision: Number(current.revision || 0), localRevision: Number(activeCsmDocument.revision || 0), cloudSavedAt: current.savedAt || "", device: String(lock?.device || "another computer"), updatedAt: lock?.updatedAt || current.savedAt || "", document: csmStatus() };
  }
  const nextRevision = Math.max(Number(current?.revision || 0), Number(activeCsmDocument.revision || 0)) + 1;
  const envelope = await createEnvelope(payload, activeCsmDocument.path, app.getVersion(), nextRevision);
  envelope.documentId = activeCsmDocument.documentId || envelope.documentId;
  const serialized = JSON.stringify(envelope, null, 2);
  const temp = `${activeCsmDocument.path}.${csmInstanceId}.tmp`;
  await writeCsmBackup(activeCsmDocument.path, options.reason || "pre-save", options.forceBackup ? 0 : undefined);
  await fs.promises.writeFile(temp, serialized, "utf8");
  parseEnvelope(await fs.promises.readFile(temp, "utf8"));
  await fs.promises.rename(temp, activeCsmDocument.path);
  activeCsmDocument.revision = nextRevision;
  activeCsmDocument.documentId = envelope.documentId;
  activeCsmDocument.envelope = envelope;
  activeCsmDocument.missingImages = (envelope.imageManifest || []).filter((item) => !item.originalPath || !fs.existsSync(item.originalPath));
  activeCsmDocument.conflict = false;
  activeCsmDocument.readOnly = false;
  writeCsmLock(activeCsmDocument.path);
  await rememberCsmFile(activeCsmDocument.path);
  return { saved: true, document: csmStatus() };
}

async function activateNewCsmDocument(filePath, payload) {
  releaseCsmLock();
  activeCsmDocument = { path: filePath, revision: 0, documentId: payload.portableDocumentId || "", readOnly: false, conflict: false, missingImages: [] };
  const result = await saveActiveCsmDocument(payload, { force: true, reason: "created" });
  return { success: true, ...result, document: csmStatus() };
}

function logStability(type, details = {}) {
  const safeDetails = Object.fromEntries(Object.entries(details || {}).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)));
  const line = `${JSON.stringify({ at: new Date().toISOString(), type, ...safeDetails })}\n`;
  fs.promises.mkdir(path.dirname(stabilityLogPath()), { recursive: true }).then(() => fs.promises.appendFile(stabilityLogPath(), line, "utf8")).catch(() => {});
}

function destroyTransientWindow(window) {
  if (!window || window.isDestroyed()) return;
  try { window.destroy(); } catch {}
}

function validateSavedData(value) {
  if (!value || !Array.isArray(value.sales) || !value.sales.length) throw new Error("Saved data did not contain any sales.");
  value.sales.forEach((sale) => {
    if (!sale || !sale.id || !Array.isArray(sale.cards)) throw new Error("Saved data contained an invalid sale.");
  });
  return value;
}

async function createDataBackup(reason = "automatic", minimumAgeMs = 0) {
  const source = dataPath();
  try {
    await fs.promises.access(source);
    const folder = backupFolderPath();
    await fs.promises.mkdir(folder, { recursive: true });
    const safeReason = String(reason).replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "automatic";
    const existing = (await fs.promises.readdir(folder)).filter((name) => name.endsWith(".json")).sort().reverse();
    if (minimumAgeMs && existing.length) {
      const newest = await fs.promises.stat(path.join(folder, existing[0]));
      if (Date.now() - newest.mtimeMs < minimumAgeMs) return path.join(folder, existing[0]);
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const destination = path.join(folder, `${stamp}-${safeReason}.json`);
    await fs.promises.copyFile(source, destination);
    JSON.parse(await fs.promises.readFile(destination, "utf8"));
    const backups = (await fs.promises.readdir(folder)).filter((name) => name.endsWith(".json")).sort().reverse();
    await Promise.all(backups.slice(20).map((name) => fs.promises.unlink(path.join(folder, name)).catch(() => {})));
    return destination;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function createDailyBackup() {
  const source = dataPath();
  try {
    await fs.promises.access(source);
    const folder = path.join(backupFolderPath(), "daily");
    await fs.promises.mkdir(folder, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const destination = path.join(folder, `${day}.json`);
    await fs.promises.copyFile(source, destination);
    validateSavedData(JSON.parse(await fs.promises.readFile(destination, "utf8")));
    const backups = (await fs.promises.readdir(folder)).filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse();
    await Promise.all(backups.slice(30).map((name) => fs.promises.unlink(path.join(folder, name)).catch(() => {})));
    return destination;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function loadRecoveryData() {
  const candidates = [`${dataPath()}.previous`];
  try {
    const backups = (await fs.promises.readdir(backupFolderPath())).filter((name) => name.endsWith(".json")).sort().reverse();
    candidates.push(...backups.map((name) => path.join(backupFolderPath(), name)));
  } catch {}
  for (const candidate of candidates) {
    try {
      const recovered = validateSavedData(JSON.parse(await fs.promises.readFile(candidate, "utf8")));
      return { ...recovered, __recovery: { source: candidate } };
    } catch {}
  }
  return null;
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
    if (!isNewerVersion(tag, app.getVersion())) return { status: "current", currentVersion: app.getVersion() };
    const preferred = assets.find((asset) => /Card-Sale-Manager.*Setup\.exe$/i.test(asset.name || ""));
    if (!preferred) return { status: "unavailable", currentVersion: app.getVersion(), version: tag.replace(/^v/, ""), releaseUrl, message: "This release does not include an automatic Windows installer." };
    const downloadUrl = preferred.browser_download_url;
    if (!downloadUrl.startsWith(`https://github.com/${UPDATE_REPOSITORY}/`)) return { status: "error", message: "The update download address was not recognized." };
    return {
      status: "available",
      currentVersion: app.getVersion(),
      version: tag.replace(/^v/, ""),
      notes: String(release.body || "").slice(0, 12000),
      releaseUrl,
      downloadUrl,
      assetName: preferred.name
    };
  } catch (error) {
    return { status: "error", currentVersion: app.getVersion(), message: error.message || "Could not check for updates." };
  }
}

function allowedUpdateUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { return false; }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "github.com") return parsed.pathname.startsWith(`/${UPDATE_REPOSITORY}/releases/download/`);
  return host === "objects.githubusercontent.com" || host === "release-assets.githubusercontent.com";
}

function downloadUpdate(url, destination, progress, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (!allowedUpdateUrl(url)) return reject(new Error("The update download address was not recognized."));
    const request = https.get(url, { headers: { "User-Agent": `Card-Sale-Manager/${app.getVersion()}` }, timeout: 30000 }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 6) {
        response.resume();
        return resolve(downloadUpdate(new URL(response.headers.location, url).toString(), destination, progress, redirects + 1));
      }
      if (response.statusCode !== 200) { response.resume(); return reject(new Error(`The update download returned status ${response.statusCode}.`)); }
      const total = Number(response.headers["content-length"] || 0);
      if (total > 600 * 1024 * 1024) { response.resume(); return reject(new Error("The update installer is unexpectedly large.")); }
      let received = 0;
      const output = fs.createWriteStream(destination, { flags: "w" });
      response.on("data", (chunk) => {
        received += chunk.length;
        if (received > 600 * 1024 * 1024) request.destroy(new Error("The update installer is unexpectedly large."));
        progress({ received, total, percent: total ? Math.min(100, Math.round((received / total) * 100)) : null });
      });
      response.pipe(output);
      output.on("finish", () => output.close(() => resolve(destination)));
      output.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("The update download timed out.")));
    request.on("error", reject);
  });
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
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile("index.html");
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.on("close", (event) => {
    if (allowWindowClose || mainWindow.isDestroyed()) return;
    event.preventDefault();
    mainWindow.webContents.send("app:prepare-close");
    clearTimeout(closeFallbackTimer);
    closeFallbackTimer = setTimeout(() => {
      allowWindowClose = true;
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    }, 5000);
  });
  if (process.env.CARD_SALE_CAPTURE_PATH) {
    mainWindow.webContents.once("did-finish-load", async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const captureName = path.basename(process.env.CARD_SALE_CAPTURE_PATH || "").toLowerCase();
      const captureView = process.env.CARD_SALE_CAPTURE_VIEW || (["dashboard", "orders", "packing", "live", "claims", "offers-accept", "offers-counter", "offers", "buyers", "health", "help", "command", "sale", "setup", "walkthrough", "pwe-label", "parser", "quick-edit", "closing", "copied", "folders", "csm-file"].find((view) => captureName.includes(view)) || "");
      if (captureView === "match-review") {
        await mainWindow.webContents.executeJavaScript("autoMatchImages()");
        await new Promise((resolve) => setTimeout(resolve, 2500));
      } else if (captureView === "claims") {
        await mainWindow.webContents.executeJavaScript("showView('claims')");
      } else if (captureView === "offers-accept") {
        await mainWindow.webContents.executeJavaScript("const card = activeSale().cards.find((item) => item.offerStatus === 'pending'); acceptOffer(card?.id); if (!card || card.offerStatus !== 'accepted' || !cardsForBuyer(card.buyer).includes(card)) throw new Error('Offer acceptance QA failed'); showView('orders')");
      } else if (captureView === "offers-counter") {
        await mainWindow.webContents.executeJavaScript("showView('offers'); openCounterOffer(activeSale().cards.find((card) => card.offerStatus === 'pending')?.id)");
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
      } else if (captureView === "packing-designer") {
        await mainWindow.webContents.executeJavaScript("showView('packing'); openPackingDesigner()");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else if (captureView === "packing-designer-qr") {
        await mainWindow.webContents.executeJavaScript("showView('packing'); openPackingDesigner(); document.querySelector('#packingSocialLink').value='https://example.com/card-sale'; updatePackingPreview()");
        await new Promise((resolve) => setTimeout(resolve, 700));
      } else if (captureView === "packing-bulk") {
        await mainWindow.webContents.executeJavaScript("showView('packing'); packingBulkSelection = new Set(buyers()); renderPackingBulk(); document.querySelector('#packingBulkDialog').showModal()");
      } else if (captureView === "setup") {
        await mainWindow.webContents.executeJavaScript("if (!document.querySelector('#setupWizardDialog').open) openSetupWizard()");
      } else if (captureView === "walkthrough") {
        await mainWindow.webContents.executeJavaScript("openWalkthrough()");
      } else if (captureView === "command-light") {
        await mainWindow.webContents.executeJavaScript("state.preferences.theme='light'; applyDisplayPreferences(); showView('command')");
      } else if (captureView === "help-light") {
        await mainWindow.webContents.executeJavaScript("state.preferences.theme='light'; applyDisplayPreferences(); showView('help')");
      } else if (captureView === "pwe-label") {
        await mainWindow.webContents.executeJavaScript("showView('packing'); openPweLabelDesigner()");
        if (captureName.includes("landscape")) await mainWindow.webContents.executeJavaScript("document.querySelector('#pweLabelOrientation').value='landscape'; updatePweLabelPreview()");
      } else if (captureView === "csm-file") {
        await mainWindow.webContents.executeJavaScript("document.querySelectorAll('dialog[open]').forEach((item) => item.close())");
        await new Promise((resolve) => setTimeout(resolve, 100));
        await mainWindow.webContents.executeJavaScript("document.querySelector('#csmFileBtn').click()");
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else if (["command", "sale", "dashboard", "orders", "packing", "live", "offers", "buyers", "health", "help"].includes(captureView)) {
        await mainWindow.webContents.executeJavaScript(`showView(${JSON.stringify(captureView)})`);
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
      const image = await mainWindow.webContents.capturePage();
      await fs.promises.writeFile(process.env.CARD_SALE_CAPTURE_PATH, image.toPNG());
      app.quit();
    });
  }
}

if (!hasSingleInstanceLock) app.quit();

app.on("second-instance", (_event, commandLine) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  const requestedFile = commandLine.find((value) => /\.csm$/i.test(String(value || "")));
  if (requestedFile) mainWindow.webContents.send("csm:open-request", requestedFile);
});

app.on("before-quit", () => releaseCsmLock());

app.on("render-process-gone", (_event, webContents, details) => {
  logStability("render-process-gone", { reason: details?.reason || "unknown", exitCode: details?.exitCode ?? -1 });
});

app.on("child-process-gone", (_event, details) => {
  logStability("child-process-gone", { processType: details?.type || "unknown", reason: details?.reason || "unknown", exitCode: details?.exitCode ?? -1, name: details?.name || "" });
});

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  ipcMain.handle("data:load", async () => {
    if (activeCsmDocument?.envelope) {
      const resolved = await automaticImageResolution(activeCsmDocument.envelope, activeCsmDocument.path);
      activeCsmDocument.missingImages = resolved.missing;
      return { ...resolved.data, __csmDocument: csmStatus(), __csmAutoRelinked: Object.keys(resolved.replacements).length, __csmMissingImages: resolved.missing.length };
    }
    if (pendingCsmPath) {
      const requestedPath = pendingCsmPath;
      pendingCsmPath = "";
      try {
        let opened = await openCsmDocument(requestedPath);
        if (opened.locked) opened = await openCsmDocument(requestedPath, { readOnly: true });
        if (opened.success) return { ...opened.data, __csmDocument: opened.document, __csmAutoRelinked: opened.autoRelinked, __csmMissingImages: opened.missingImages };
      } catch (error) {
        logStability("csm-command-line-open-failed", { reason: String(error.message || "open failed").slice(0, 160) });
      }
    }
    try {
      const saved = validateSavedData(JSON.parse(await fs.promises.readFile(dataPath(), "utf8")));
      await createDataBackup("startup", 5 * 60 * 1000);
      await createDailyBackup();
      return saved;
    } catch (error) {
      const recovered = await loadRecoveryData();
      if (recovered) return recovered;
      if (error.code === "ENOENT") return null;
      throw error;
    }
  });

  ipcMain.handle("data:save", (_event, payload) => {
    validateSavedData(payload);
    const serialized = JSON.stringify(payload, null, 2);
    const performSave = async () => {
      const target = dataPath();
      const temp = `${target}.tmp`;
      const previous = `${target}.previous`;
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await createDataBackup("pre-save", 15 * 60 * 1000);
      await fs.promises.writeFile(temp, serialized, "utf8");
      validateSavedData(JSON.parse(await fs.promises.readFile(temp, "utf8")));
      try { await fs.promises.copyFile(target, previous); } catch (error) { if (error.code !== "ENOENT") throw error; }
      await fs.promises.rename(temp, target);
      await createDailyBackup();
      const csm = await saveActiveCsmDocument(payload);
      return { ok: true, path: target, csm };
    };
    saveQueue = saveQueue.then(performSave, performSave);
    return saveQueue;
  });

  ipcMain.handle("data:backup", async (_event, reason) => ({ ok: Boolean(await createDataBackup(reason || "manual")) }));
  ipcMain.handle("csm:status", async () => ({ document: csmStatus(), recent: await recentCsmFiles(), backups: await listCsmBackups() }));
  ipcMain.handle("csm:open", async (_event, requestedPath, options = {}) => {
    let filePath = requestedPath;
    if (!filePath) {
      const result = await dialog.showOpenDialog(mainWindow, { title: "Open a Card Sale Manager file", properties: ["openFile"], filters: [{ name: "Card Sale Manager files", extensions: ["csm"] }] });
      if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
      [filePath] = result.filePaths;
    }
    try { return await openCsmDocument(filePath, options); }
    catch (error) { return { success: false, message: error.code === "ENOENT" ? "That CSM file is not available. If it is stored in OneDrive, make sure it is downloaded on this computer." : error.message }; }
  });
  ipcMain.handle("csm:save-as", async (_event, payload) => {
    const defaultName = `${String(payload?.sales?.find((sale) => sale.id === payload.activeSaleId)?.name || "Card Sale").replace(/[<>:"/\\|?*]+/g, "-")}.csm`;
    const result = await dialog.showSaveDialog(mainWindow, { title: "Save Card Sale Manager file", defaultPath: defaultName, filters: [{ name: "Card Sale Manager files", extensions: ["csm"] }] });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    try { return await activateNewCsmDocument(result.filePath.toLowerCase().endsWith(".csm") ? result.filePath : `${result.filePath}.csm`, payload); }
    catch (error) { return { success: false, message: error.message }; }
  });
  ipcMain.handle("csm:save", async (_event, payload, options = {}) => {
    try {
      if (!activeCsmDocument) return { success: false, needsSaveAs: true };
      const result = await saveActiveCsmDocument(payload, { ...options, reason: "manual", forceBackup: true });
      return { success: Boolean(result.saved), ...result };
    } catch (error) { return { success: false, message: error.message }; }
  });
  ipcMain.handle("csm:detach", async () => {
    releaseCsmLock();
    activeCsmDocument = null;
    return { success: true, document: csmStatus(), recent: await recentCsmFiles() };
  });
  ipcMain.handle("csm:recent-action", async (_event, filePath, action) => {
    if (!["pin", "remove", "reveal"].includes(action) || !filePath) return { success: false };
    if (action === "reveal") {
      if (fs.existsSync(filePath)) shell.showItemInFolder(filePath);
      else if (fs.existsSync(path.dirname(filePath))) await shell.openPath(path.dirname(filePath));
      return { success: true, recent: await recentCsmFiles() };
    }
    return { success: true, recent: await updateRecentCsmFile(filePath, action) };
  });
  ipcMain.handle("csm:restore-backup", async (_event, backupPath) => {
    if (!activeCsmDocument || !isActiveCsmBackup(backupPath)) return { success: false, message: "That recovery copy does not belong to the open CSM file." };
    try {
      const envelope = parseEnvelope(await fs.promises.readFile(backupPath, "utf8"));
      const resolved = await automaticImageResolution(envelope, activeCsmDocument.path);
      const saved = await saveActiveCsmDocument(resolved.data, { force: true, reason: "before-restore", forceBackup: true });
      return { success: true, data: resolved.data, document: saved.document, missingImages: resolved.missing.length };
    } catch (error) { return { success: false, message: error.message }; }
  });
  ipcMain.handle("csm:reveal", async (_event, target = "file") => {
    if (!activeCsmDocument?.path) return false;
    if (target === "backups") {
      const folder = activeCsmBackupFolder();
      if (folder && fs.existsSync(folder)) return shell.openPath(folder);
      return false;
    }
    shell.showItemInFolder(activeCsmDocument.path);
    return true;
  });
  ipcMain.handle("csm:relink", async () => {
    if (!activeCsmDocument?.envelope) return { success: false, message: "Open a CSM file first." };
    const result = await dialog.showOpenDialog(mainWindow, { title: "Choose the main card image folder", properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
    const missing = activeCsmDocument.missingImages?.length ? activeCsmDocument.missingImages : activeCsmDocument.envelope.imageManifest || [];
    const linked = await relinkManifest(missing, result.filePaths[0]);
    activeCsmDocument.missingImages = linked.unresolved;
    return { success: true, root: result.filePaths[0], replacements: linked.replacements, relinked: Object.keys(linked.replacements).length, unresolved: linked.unresolved.length, document: csmStatus() };
  });
  ipcMain.handle("csm:package", async (_event, payload) => {
    const result = await dialog.showOpenDialog(mainWindow, { title: "Choose where to create the portable CSM package", properties: ["openDirectory", "createDirectory"] });
    if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true };
    const saleName = String(payload?.sales?.find((sale) => sale.id === payload.activeSaleId)?.name || "Card Sale").replace(/[<>:"/\\|?*]+/g, "-");
    let packageFolder = path.join(result.filePaths[0], `${saleName} CSM Package`);
    let suffix = 2;
    while (fs.existsSync(packageFolder)) packageFolder = path.join(result.filePaths[0], `${saleName} CSM Package ${suffix++}`);
    const imagesFolder = path.join(packageFolder, "Images");
    await fs.promises.mkdir(imagesFolder, { recursive: true });
    const packagedData = portableData(payload);
    const replacements = {};
    const usedNames = new Set();
    let copied = 0; let missing = 0;
    for (const originalPath of imagePaths(packagedData)) {
      if (!fs.existsSync(originalPath)) { missing += 1; continue; }
      const extension = path.extname(originalPath);
      const stem = path.basename(originalPath, extension).replace(/[<>:"/\\|?*]+/g, "-") || "image";
      let name = `${stem}${extension}`; let number = 2;
      while (usedNames.has(name.toLowerCase()) || fs.existsSync(path.join(imagesFolder, name))) name = `${stem}-${number++}${extension}`;
      usedNames.add(name.toLowerCase());
      const destination = path.join(imagesFolder, name);
      await fs.promises.copyFile(originalPath, destination);
      replacements[originalPath] = destination;
      copied += 1;
    }
    const adjusted = replacePaths(packagedData, replacements);
    adjusted.lookupSettings = { primaryFolder: imagesFolder, additionalFolders: [], excludedFolders: [] };
    const csmPath = path.join(packageFolder, `${saleName}.csm`);
    const envelope = await createEnvelope(adjusted, csmPath, app.getVersion(), 1);
    await fs.promises.writeFile(csmPath, JSON.stringify(envelope, null, 2), "utf8");
    parseEnvelope(await fs.promises.readFile(csmPath, "utf8"));
    return { success: true, folder: packageFolder, csmPath, copied, missing };
  });
  ipcMain.handle("diagnostic:native-events", async () => {
    try {
      const text = await fs.promises.readFile(stabilityLogPath(), "utf8");
      return text.trim().split(/\r?\n/).slice(-10).map((line) => JSON.parse(line)).map((item) => ({ at: String(item.at || ""), type: String(item.type || "native"), processType: String(item.processType || ""), reason: String(item.reason || ""), exitCode: Number(item.exitCode ?? -1) }));
    } catch { return []; }
  });
  ipcMain.handle("diagnostic:save", async (_event, report) => {
    const result = await dialog.showSaveDialog(mainWindow, { title: "Save anonymous diagnostic report", defaultPath: `Card-Sale-Manager-Diagnostic-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: "JSON report", extensions: ["json"] }] });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    const numbersOnly = (value = {}) => Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "number" && Number.isFinite(item)));
    const safeReport = {
      generatedAt: new Date().toISOString(), appVersion: app.getVersion(), platform: process.platform, architecture: process.arch, electronVersion: process.versions.electron,
      reportVersion: Number(report?.reportVersion || 1), description: String(report?.description || "").slice(0, 2000),
      preferences: { theme: String(report?.preferences?.theme || "system"), compact: Boolean(report?.preferences?.compact), reducedMotion: Boolean(report?.preferences?.reducedMotion) },
      totals: numbersOnly(report?.totals), activeSale: numbersOnly(report?.activeSale),
      recentErrors: Array.isArray(report?.recentErrors) ? report.recentErrors.slice(-10).map((item) => ({ at: String(item?.at || ""), type: String(item?.type || "error"), message: String(item?.message || "").slice(0, 500) })) : [],
      nativeEvents: Array.isArray(report?.nativeEvents) ? report.nativeEvents.slice(-10).map((item) => ({ at: String(item?.at || ""), type: String(item?.type || "native"), processType: String(item?.processType || ""), reason: String(item?.reason || ""), exitCode: Number(item?.exitCode ?? -1) })) : []
    };
    await fs.promises.writeFile(result.filePath, JSON.stringify(safeReport, null, 2), "utf8");
    return { success: true, filePath: result.filePath };
  });
  ipcMain.handle("app:close-ready", async () => {
    clearTimeout(closeFallbackTimer);
    allowWindowClose = true;
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    }, 75);
    return true;
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
  ipcMain.handle("app:download-install-update", async (event, update) => {
    const url = String(update?.downloadUrl || "");
    const version = String(update?.version || "");
    const assetName = path.basename(String(update?.assetName || ""));
    if (!versionParts(version) || !/^Card-Sale-Manager.*Setup\.exe$/i.test(assetName) || !allowedUpdateUrl(url)) return { ok: false, message: "The update information was not valid." };
    const updateFolder = path.join(app.getPath("temp"), "Card Sale Manager Updates", version);
    const destination = path.join(updateFolder, assetName);
    try {
      await createDataBackup(`before-update-${version}`);
      await fs.promises.mkdir(updateFolder, { recursive: true });
      await downloadUpdate(url, destination, (details) => event.sender.send("app:update-progress", details));
      const handle = await fs.promises.open(destination, "r");
      const signature = Buffer.alloc(2);
      await handle.read(signature, 0, 2, 0);
      await handle.close();
      if (signature.toString("ascii") !== "MZ") throw new Error("The downloaded file was not a valid Windows installer.");
      event.sender.send("app:update-progress", { percent: 100, installing: true });
      const installer = spawn(destination, ["/S", "--updated"], { detached: true, stdio: "ignore" });
      installer.unref();
      setTimeout(() => app.quit(), 500);
      return { ok: true };
    } catch (error) {
      try { await fs.promises.unlink(destination); } catch {}
      return { ok: false, message: error.message || "The update could not be installed." };
    }
  });
  ipcMain.handle("app:open-update", async (_event, target) => {
    const value = String(target || "");
    const allowedPrefix = `https://github.com/${UPDATE_REPOSITORY}/`;
    if (!value.startsWith(allowedPrefix)) return false;
    await shell.openExternal(value);
    return true;
  });
  ipcMain.handle("app:version", () => app.getVersion());
  ipcMain.handle("clipboard:write", (_event, value) => { clipboard.writeText(String(value || "")); return true; });
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
    const styles = String(payload?.styles || "");
    const pageSize = ["letter", "half", "two-up", "label", "label-landscape", "compact"].includes(payload?.pageSize) ? payload.pageSize : "letter";
    const pageCss = pageSize === "half" ? "5.5in 8.5in" : pageSize === "label" ? "4in 6in" : pageSize === "label-landscape" ? "6in 4in" : pageSize === "compact" ? "4.25in 5.5in" : "letter";
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:${pageCss};margin:0}html,body{margin:0;background:#fff;color:#172333}*{box-sizing:border-box}${styles}</style></head><body>${body}</body></html>`;
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(documentHtml)}`);
    return new Promise((resolve) => printWindow.webContents.print({ silent: false, printBackground: true }, (success, reason) => {
      resolve({ success, reason });
      setTimeout(() => destroyTransientWindow(printWindow), 75);
    }));
  });

  ipcMain.handle("packing:preview-pdf", async (_event, payload) => {
    const title = String(payload?.title || "Packing slips").replace(/[<>]/g, "");
    const previewWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    const styles = String(payload?.styles || "");
    const body = String(payload?.html || "");
    const pageSize = ["letter", "half", "two-up", "label", "label-landscape", "compact"].includes(payload?.pageSize) ? payload.pageSize : "letter";
    const pageCss = pageSize === "half" ? "5.5in 8.5in" : pageSize === "label" ? "4in 6in" : pageSize === "label-landscape" ? "6in 4in" : pageSize === "compact" ? "4.25in 5.5in" : "letter";
    await previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:${pageCss};margin:0}html,body{margin:0;background:#fff;color:#172333}*{box-sizing:border-box}${styles}</style></head><body>${body}</body></html>`)}`);
    let pdf;
    try { pdf = await previewWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true }); }
    finally { destroyTransientWindow(previewWindow); }
    const previewFolder = path.join(app.getPath("temp"), "Card Sale Manager Previews");
    await fs.promises.mkdir(previewFolder, { recursive: true });
    const safeName = title.replace(/[\\/:*?"<>|]/g, "-").slice(0, 90) || "Packing slips";
    const previewPath = path.join(previewFolder, `${safeName}-${Date.now()}-preview.pdf`);
    await fs.promises.writeFile(previewPath, pdf);
    const openError = await shell.openPath(previewPath);
    return openError ? { success: false, reason: openError } : { success: true, filePath: previewPath };
  });

  ipcMain.handle("packing:export-pdf", async (_event, payload) => {
    const title = String(payload?.title || "Packing slips").replace(/[<>]/g, "");
    const result = await dialog.showSaveDialog(mainWindow, { title: "Save packing slips as PDF", defaultPath: `${title}.pdf`, filters: [{ name: "PDF", extensions: ["pdf"] }] });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    const pdfWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    const styles = String(payload?.styles || "");
    const body = String(payload?.html || "");
    const pageSize = ["letter", "half", "two-up", "label", "label-landscape", "compact"].includes(payload?.pageSize) ? payload.pageSize : "letter";
    const pageCss = pageSize === "half" ? "5.5in 8.5in" : pageSize === "label" ? "4in 6in" : pageSize === "label-landscape" ? "6in 4in" : pageSize === "compact" ? "4.25in 5.5in" : "letter";
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:${pageCss};margin:0}html,body{margin:0;background:#fff;color:#172333}*{box-sizing:border-box}${styles}</style></head><body>${body}</body></html>`)}`);
    let pdf;
    try { pdf = await pdfWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true }); }
    finally { destroyTransientWindow(pdfWindow); }
    await fs.promises.writeFile(result.filePath, pdf);
    return { success: true, filePath: result.filePath };
  });

  ipcMain.handle("packing:choose-logo", async () => {
    const result = await dialog.showOpenDialog(mainWindow, { title: "Choose a branding logo", properties: ["openFile"], filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"] }] });
    return result.canceled ? "" : result.filePaths[0];
  });

  ipcMain.handle("packing:file-data-url", async (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return "";
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", bmp: "image/bmp" })[ext] || "application/octet-stream";
    return `data:${mime};base64,${(await fs.promises.readFile(filePath)).toString("base64")}`;
  });

  ipcMain.handle("packing:qr-data-url", async (_event, value, color = "#172333") => {
    const text = String(value || "").trim();
    if (!text) return "";
    return QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 1, width: 220, color: { dark: /^#[0-9a-f]{6}$/i.test(color) ? color : "#172333", light: "#ffffffff" } });
  });

  ipcMain.handle("images:scan-folder", async (event, input) => {
    const folders = (typeof input === "string" ? [input] : input?.folders || []).filter(Boolean);
    const excludedFolders = (typeof input === "string" ? [] : input?.excludedFolders || [])
      .map((folder) => path.resolve(folder).toLowerCase());
    const excludedPaths = new Set((typeof input === "string" ? [] : input?.excludedPaths || []).map((file) => path.resolve(file).toLowerCase()));
    if (!folders.length) return [];
    const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"]);
    const found = [];
    const seen = new Set();
    const isExcluded = (folder) => {
      const resolved = path.resolve(folder).toLowerCase();
      return excludedFolders.some((excluded) => resolved === excluded || resolved.startsWith(`${excluded}${path.sep}`));
    };
    const directories = [];
    const pending = folders.filter((folder) => fs.existsSync(folder) && !isExcluded(folder)).map((folder) => ({ folder, root: folder }));
    event.sender.send("images:scan-progress", { phase: "counting", directoriesFound: pending.length, percent: 0 });
    while (pending.length) {
      const current = pending.shift();
      if (isExcluded(current.folder)) continue;
      directories.push(current);
      const entries = await fs.promises.readdir(current.folder, { withFileTypes: true });
      entries.filter((entry) => entry.isDirectory()).forEach((entry) => {
        const child = path.join(current.folder, entry.name);
        if (!isExcluded(child)) pending.push({ folder: child, root: current.root });
      });
      event.sender.send("images:scan-progress", { phase: "counting", directoriesFound: directories.length + pending.length, percent: 0 });
    }
    const totalFolders = directories.length;
    for (let index = 0; index < directories.length; index += 1) {
      const current = directories[index];
      const entries = await fs.promises.readdir(current.folder, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !supported.has(path.extname(entry.name).toLowerCase())) continue;
        const fullPath = path.join(current.folder, entry.name);
        const key = fullPath.toLowerCase();
        if (seen.has(key) || excludedPaths.has(path.resolve(fullPath).toLowerCase())) continue;
        seen.add(key);
        found.push({
          path: fullPath,
          name: entry.name,
          stem: path.basename(entry.name, path.extname(entry.name)),
          relativePath: path.join(path.basename(current.root), path.relative(current.root, fullPath))
        });
      }
      const foldersScanned = index + 1;
      event.sender.send("images:scan-progress", {
        phase: "scanning",
        foldersScanned,
        totalFolders,
        found: found.length,
        percent: totalFolders ? Math.round((foldersScanned / totalFolders) * 60) : 60
      });
    }
    event.sender.send("images:scan-progress", { phase: "scanned", foldersScanned: totalFolders, totalFolders, found: found.length, percent: 60 });
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
