const fs = require("fs");
const path = require("path");

const FORMAT = "card-sale-manager-workspace";
const FORMAT_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function portableData(value) {
  const data = clone(value);
  ["filter", "query", "claimQuery", "selectedBuyer", "profileBuyer"].forEach((key) => delete data[key]);
  return data;
}

function imagePaths(data) {
  const found = new Set();
  (data.sales || []).forEach((sale) => {
    (sale.cards || []).forEach((card) => { if (card.imagePath) found.add(card.imagePath); });
    (sale.images || []).forEach((image) => { if (image.path) found.add(image.path); });
  });
  const logo = data.preferences?.packingSlip?.logoPath;
  if (logo) found.add(logo);
  return [...found];
}

function lookupRoots(data) {
  const settings = data.lookupSettings || {};
  return [...new Set([settings.primaryFolder, ...(settings.additionalFolders || [])].filter(Boolean))];
}

async function createEnvelope(value, filePath, appVersion, revision = 1) {
  const data = portableData(value);
  const documentFolder = path.dirname(filePath);
  const roots = lookupRoots(data);
  const rootManifest = roots.map((root) => ({
    originalPath: root,
    name: path.basename(root),
    documentRelativePath: path.relative(documentFolder, root)
  }));
  const manifest = [];
  for (const originalPath of imagePaths(data)) {
    const rootIndex = roots.map((root, index) => ({ root, index })).filter(({ root }) => isInside(root, originalPath)).sort((a, b) => b.root.length - a.root.length)[0]?.index ?? -1;
    let stats = null;
    try { stats = await fs.promises.stat(originalPath); } catch {}
    manifest.push({
      originalPath,
      fileName: path.basename(originalPath),
      rootIndex,
      rootRelativePath: rootIndex >= 0 ? path.relative(roots[rootIndex], originalPath) : "",
      documentRelativePath: path.relative(documentFolder, originalPath),
      size: stats?.isFile() ? stats.size : null,
      modifiedAt: stats?.isFile() ? Math.round(stats.mtimeMs) : null
    });
  }
  return {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    documentId: value.portableDocumentId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    revision,
    savedAt: new Date().toISOString(),
    appVersion: String(appVersion || ""),
    imageRoots: rootManifest,
    imageManifest: manifest,
    data
  };
}

function parseEnvelope(text) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.format !== FORMAT || Number(parsed.formatVersion) !== FORMAT_VERSION || !parsed.data) throw new Error("This is not a supported Card Sale Manager file.");
  if (!Array.isArray(parsed.data.sales) || !parsed.data.sales.length) throw new Error("The CSM file does not contain any sales.");
  return parsed;
}

function replacePaths(data, replacements) {
  const next = clone(data);
  const map = new Map(Object.entries(replacements || {}).map(([from, to]) => [String(from).toLowerCase(), to]));
  const replace = (value) => map.get(String(value || "").toLowerCase()) || value;
  (next.sales || []).forEach((sale) => {
    (sale.cards || []).forEach((card) => { card.imagePath = replace(card.imagePath); });
    (sale.images || []).forEach((image) => { image.path = replace(image.path); image.name = path.basename(image.path || image.name || ""); });
  });
  if (next.preferences?.packingSlip?.logoPath) next.preferences.packingSlip.logoPath = replace(next.preferences.packingSlip.logoPath);
  return next;
}

async function automaticImageResolution(envelope, filePath) {
  const replacements = {};
  const missing = [];
  const documentFolder = path.dirname(filePath);
  for (const item of envelope.imageManifest || []) {
    if (!item.originalPath) continue;
    try { await fs.promises.access(item.originalPath); continue; } catch {}
    const candidates = [];
    if (item.documentRelativePath) candidates.push(path.resolve(documentFolder, item.documentRelativePath));
    const root = (envelope.imageRoots || [])[item.rootIndex];
    if (root?.documentRelativePath && item.rootRelativePath) candidates.push(path.resolve(documentFolder, root.documentRelativePath, item.rootRelativePath));
    const resolved = candidates.find((candidate) => fs.existsSync(candidate));
    if (resolved) replacements[item.originalPath] = resolved;
    else missing.push(item);
  }
  return { data: replacePaths(envelope.data, replacements), replacements, missing };
}

async function scanByName(folder, wantedNames, maximumFiles = 100000) {
  const wanted = new Set([...wantedNames].map((name) => String(name).toLowerCase()));
  const matches = new Map();
  const pending = [folder];
  let visited = 0;
  while (pending.length && visited < maximumFiles) {
    const current = pending.shift();
    let entries;
    try { entries = await fs.promises.readdir(current, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(fullPath);
      else if (entry.isFile()) {
        visited += 1;
        const key = entry.name.toLowerCase();
        if (wanted.has(key)) {
          const list = matches.get(key) || [];
          list.push(fullPath);
          matches.set(key, list);
        }
      }
      if (visited >= maximumFiles) break;
    }
  }
  return matches;
}

async function relinkManifest(manifest, selectedRoot) {
  const replacements = {};
  const unresolved = [];
  const remaining = [];
  for (const item of manifest || []) {
    const direct = item.rootRelativePath ? path.join(selectedRoot, item.rootRelativePath) : "";
    if (direct && fs.existsSync(direct)) replacements[item.originalPath] = direct;
    else remaining.push(item);
  }
  const matches = await scanByName(selectedRoot, new Set(remaining.map((item) => item.fileName)));
  remaining.forEach((item) => {
    const candidates = matches.get(String(item.fileName || "").toLowerCase()) || [];
    if (candidates.length === 1) replacements[item.originalPath] = candidates[0];
    else unresolved.push({ ...item, candidates: candidates.length });
  });
  return { replacements, unresolved };
}

module.exports = { FORMAT, FORMAT_VERSION, automaticImageResolution, createEnvelope, imagePaths, parseEnvelope, portableData, relinkManifest, replacePaths };
