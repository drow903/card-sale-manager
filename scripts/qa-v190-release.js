const fs = require("fs");

const renderer = fs.readFileSync("renderer.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const main = fs.readFileSync("main.js", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

if (pkg.version !== "1.9.0") throw new Error(`Expected version 1.9.0, found ${pkg.version}`);
[
  "imageMemoryKey", "matchingDuplicateInfo", "coordinateImageAssignments", "removeAndRematchImage",
  "permanentlyDeleteArchivedSale", "performanceModeActive", "updateFacebookShortcut"
].forEach((feature) => { if (!renderer.includes(`function ${feature}`)) throw new Error(`Missing 1.9 feature: ${feature}`); });
[
  "saleFacebookShortcutBtn", "toggleClaimActivityBtn", "claimActivityWidth", "performanceModeBtn", "cancelImageLookupBtn"
].forEach((id) => { if (!html.includes(`id="${id}"`)) throw new Error(`Missing 1.9 control: ${id}`); });
if (!styles.includes("height: calc(100vh - 172px)")) throw new Error("Claims Desk does not fill the available viewport.");
if (!renderer.includes('score: -1000') || !renderer.includes('purchase date conflicts')) throw new Error("Wrong-date image candidates are not hard-rejected.");
if (!renderer.includes('window.cardSale.backup(`before-permanent-archive-delete-')) throw new Error("Archive deletion is missing its immediate backup.");
if (!main.includes('ipcMain.handle("app:show-file"')) throw new Error("Live Sale file reveal support is missing.");
console.log(JSON.stringify({ version: pkg.version, claimsDesk: true, dateSafeMatching: true, conflictResolver: true, archiveSafety: true, liveFileTools: true, performanceMode: true }));
