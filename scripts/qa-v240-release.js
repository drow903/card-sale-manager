const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const renderer = fs.readFileSync(path.join(root, "renderer.js"), "utf8");
const main = fs.readFileSync(path.join(root, "main.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const guide = JSON.parse(fs.readFileSync(path.join(root, "assets", "help-guide-content.json"), "utf8"));
const notes = fs.readFileSync(path.join(root, "RELEASE_NOTES.md"), "utf8");

assert.strictEqual(packageJson.version, "2.4.0", "release version must be 2.4.0");
assert(html.includes('id="moveSelectedCardsBtn"') && renderer.includes("function moveSelectedCards"), "multi-card manual post ordering is incomplete");
assert(renderer.includes("renderListings(); renderImages();") && renderer.includes("function orderedSaleImages"), "listing and image queue ordering are not synchronized");
assert(html.includes('id="renameBuyerDialog"') && renderer.includes("function renameBuyerProfile"), "direct buyer renaming is incomplete");
assert(renderer.includes("archivedOneOffOrders") && renderer.includes("before-merge-buyers"), "buyer merge must include one-off history and a safety backup");
assert(main.includes("CSM-Rotating-") && main.includes("maxBackups: Math.max(1, Math.min(10"), "portable backup rotation is missing or unbounded");
assert(main.includes("intervalMinutes") && main.includes("30 * 60 * 1000"), "the 30-minute portable backup default is missing");
assert(!/unlink\(activeCsmDocument\.path/.test(main), "backup cleanup must never delete the primary CSM file");
assert(guide.sections.some((section) => section.id === "portable-files" && JSON.stringify(section).includes("newest five")), "the user guide does not explain portable backup rotation");
assert(notes.startsWith("# Card Sale Manager 2.4.0"), "2.4.0 release notes must be current");

console.log("CSM 2.4.0 release checks passed.");
