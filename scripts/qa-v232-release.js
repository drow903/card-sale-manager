const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const renderer = fs.readFileSync(path.join(root, "renderer.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const notes = fs.readFileSync(path.join(root, "RELEASE_NOTES.md"), "utf8");

assert.strictEqual(packageJson.version, "2.3.2", "release version must be 2.3.2");
assert(html.includes('id="assignSelectedClaimsBtn"') && renderer.includes("function assignSelectedClaims"), "bulk Claims Desk assignment is incomplete");
assert(renderer.includes("function buildDerivedSaleData") && renderer.includes("function cardSearchText"), "derived-data performance indexes are missing");
assert(renderer.includes("scheduleUiTask(\"card-search\"") && renderer.includes("scheduleUiTask(\"claim-search\""), "large table searches must be debounced");
assert(renderer.includes("function refreshClaimRow"), "single-claim changes must support incremental row updates");
assert(renderer.includes("function commitPendingSnapshot") && renderer.includes("requestIdleCallback"), "snapshot and save work must move to idle time");
assert(renderer.includes("lastSavedRevision === stateRevision"), "unchanged saves must be skipped");
assert(notes.startsWith("# Card Sale Manager 2.3.2"), "2.3.2 release notes must be current");

console.log("CSM 2.3.2 release checks passed.");
