const fs = require("fs");
const path = require("path");
const { hash } = require("blake3-wasm");

const API = "https://api.cloudflare.com/client/v4";
const ASSETS = `${API}/pages/assets`;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_BUCKET_SIZE = 40 * 1024 * 1024;
const CONTENT_TYPES = { ".css": "text/css; charset=utf-8", ".gif": "image/gif", ".html": "text/html; charset=utf-8", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".xml": "application/xml; charset=utf-8" };

function cleanConfig(config = {}) {
  const accountId = String(config.accountId || "").trim();
  const projectName = String(config.projectName || "").trim();
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new Error("Enter a valid 32-character Cloudflare Account ID.");
  if (!/^(?:[a-z0-9]|[a-z0-9][a-z0-9-]{0,57}[a-z0-9])$/i.test(projectName)) throw new Error("Enter a valid Cloudflare Pages project name.");
  return { accountId, projectName };
}

async function cloudflareRequest(url, token, options = {}, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    let body = {};
    try { body = await response.json(); } catch {}
    if (response.ok && body.success !== false) return body.result ?? body;
    const message = body.errors?.map((item) => item.message).filter(Boolean).join("; ") || body.message || `Cloudflare returned status ${response.status}.`;
    lastError = new Error(message);
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts - 1) throw lastError;
    const retryAfter = Number(response.headers.get("retry-after") || 0) * 1000;
    await new Promise((resolve) => setTimeout(resolve, retryAfter || 700 * (2 ** attempt)));
  }
  throw lastError;
}

async function testConnection(config, token) {
  const { accountId, projectName } = cleanConfig(config);
  const project = await cloudflareRequest(`${API}/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}`, token);
  return { ok: true, projectName: project.name, productionBranch: project.production_branch || "main", domains: project.domains || [], subdomain: project.subdomain || "" };
}

function walkFiles(root, current = root, output = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) walkFiles(root, fullPath, output);
    else if (entry.isFile()) output.push({ fullPath, relativePath: path.relative(root, fullPath).split(path.sep).join("/") });
  }
  return output;
}

function assetHash(buffer, filePath) {
  return hash(buffer.toString("base64") + path.extname(filePath).slice(1).toLowerCase()).toString("hex").slice(0, 32);
}

function uploadBuckets(assets) {
  const buckets = []; let bucket = []; let size = 0;
  for (const asset of assets) {
    if (bucket.length && (bucket.length >= 1000 || size + asset.size > MAX_BUCKET_SIZE)) { buckets.push(bucket); bucket = []; size = 0; }
    bucket.push(asset); size += asset.size;
  }
  if (bucket.length) buckets.push(bucket);
  return buckets;
}

async function publishDirectory(folder, config, token, onProgress = () => {}) {
  const { accountId, projectName } = cleanConfig(config);
  if (!token) throw new Error("Save a Cloudflare API token before publishing.");
  const connection = await testConnection({ accountId, projectName }, token);
  onProgress({ stage: "hashing", percent: 5, message: "Preparing catalog files…" });
  const files = walkFiles(folder);
  if (!files.length) throw new Error("The catalog folder is empty.");
  if (files.length > 20000) throw new Error("This catalog contains more than Cloudflare Pages’ 20,000-file limit.");
  const assets = files.map((file, index) => {
    const buffer = fs.readFileSync(file.fullPath);
    if (buffer.length > MAX_FILE_SIZE) throw new Error(`${file.relativePath} is larger than Cloudflare Pages’ 25 MB per-file limit.`);
    onProgress({ stage: "hashing", percent: 5 + Math.round(((index + 1) / files.length) * 20), message: `Preparing ${index + 1} of ${files.length} files…` });
    return { ...file, buffer, size: buffer.length, hash: assetHash(buffer, file.fullPath), contentType: CONTENT_TYPES[path.extname(file.fullPath).toLowerCase()] || "application/octet-stream" };
  });
  const uploadTokenResult = await cloudflareRequest(`${API}/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}/upload-token`, token);
  const jwt = uploadTokenResult.jwt;
  const hashes = [...new Set(assets.map((asset) => asset.hash))];
  const missing = await cloudflareRequest(`${ASSETS}/check-missing`, jwt, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hashes }) });
  const missingSet = new Set(Array.isArray(missing) ? missing : missing?.missing || []);
  const pending = assets.filter((asset) => missingSet.has(asset.hash));
  const buckets = uploadBuckets(pending);
  for (let index = 0; index < buckets.length; index += 1) {
    const body = buckets[index].map((asset) => ({ key: asset.hash, value: asset.buffer.toString("base64"), metadata: { contentType: asset.contentType }, base64: true }));
    await cloudflareRequest(`${ASSETS}/upload`, jwt, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    onProgress({ stage: "uploading", percent: 30 + Math.round(((index + 1) / Math.max(1, buckets.length)) * 50), message: `Uploaded ${Math.min(pending.length, (index + 1) * 1000)} of ${pending.length} new files…` });
  }
  try { await cloudflareRequest(`${ASSETS}/upsert-hashes`, jwt, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hashes }) }); } catch {}
  const manifest = Object.fromEntries(assets.map((asset) => [`/${asset.relativePath}`, asset.hash]));
  const form = new FormData();
  form.append("manifest", JSON.stringify(manifest));
  form.append("branch", connection.productionBranch || "main");
  form.append("commit_message", `Published from Card Sale Manager at ${new Date().toLocaleString()}`);
  form.append("commit_dirty", "true");
  onProgress({ stage: "deploying", percent: 88, message: "Creating the Cloudflare deployment…" });
  const deployment = await cloudflareRequest(`${API}/accounts/${accountId}/pages/projects/${encodeURIComponent(projectName)}/deployments`, token, { method: "POST", body: form });
  onProgress({ stage: "complete", percent: 100, message: "Catalog published." });
  return { ok: true, id: deployment.id, url: deployment.url || "", aliases: deployment.aliases || [], files: files.length };
}

module.exports = { assetHash, cleanConfig, publishDirectory, testConnection };
