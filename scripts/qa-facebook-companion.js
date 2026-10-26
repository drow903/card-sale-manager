const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const manifest = JSON.parse(fs.readFileSync("facebook-owner-companion/manifest.json", "utf8"));
assert.equal(manifest.manifest_version, 3);
assert(manifest.permissions.includes("scripting"), "The companion cannot repair a missing Facebook content script.");
assert(manifest.host_permissions.includes("http://127.0.0.1:43817/*"));

let contextClick;
let messageAttempts = 0;
let injections = 0;
const saved = { token: "paired-token" };
const chrome = {
  runtime: { onInstalled: { addListener() {} }, onStartup: { addListener() {} } },
  contextMenus: { removeAll(callback) { callback(); }, create() {}, onClicked: { addListener(listener) { contextClick = listener; } } },
  storage: { local: { async get(key) { return typeof key === "string" ? { [key]: saved[key] } : saved; }, async set(value) { Object.assign(saved, value); } } },
  tabs: { async sendMessage() { messageAttempts += 1; if (messageAttempts === 1) throw new Error("Receiving end does not exist"); return { commentText: "Claim", contextText: "1961 Topps card", displayedName: "Test Buyer", pageUrl: "https://www.facebook.com/groups/example" }; } },
  scripting: { async executeScript() { injections += 1; } },
  action: { setBadgeBackgroundColor() {}, setBadgeText() { return Promise.resolve(); } }
};
const fetch = async () => ({ ok: true, async json() { return { ok: true, message: "Sent" }; } });
const timers = [];
const context = vm.createContext({ chrome, fetch, console, Date, setTimeout(callback) { timers.push(callback); return 1; } });
vm.runInContext(fs.readFileSync("facebook-owner-companion/background.js", "utf8"), context);

(async () => {
  assert.equal(typeof contextClick, "function", "The right-click handler was not registered.");
  await contextClick({ menuItemId: "csm-send-comment", selectionText: "Claim" }, { id: 7, url: "https://www.facebook.com/groups/example" });
  assert.equal(injections, 1, "The extension did not inject its reader into an already-open Facebook tab.");
  assert.equal(messageAttempts, 2, "The extension did not retry after injecting the reader.");
  assert.equal(saved.lastResult.ok, true);
  assert.match(saved.lastResult.message, /sent/i);
  console.log(JSON.stringify({ pairingDiagnostics: true, existingFacebookTabRepair: true, visibleCaptureResult: true }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
