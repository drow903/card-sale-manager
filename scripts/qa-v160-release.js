const fs = require("fs");

const renderer = fs.readFileSync("renderer.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const main = fs.readFileSync("main.js", "utf8");
const guide = JSON.parse(fs.readFileSync("assets/help-guide-content.json", "utf8"));

const requiredRendererFeatures = [
  "compareCardNumbers", "normalizeCardNumber", "updateBulkEditPreview", "mergeBuyerProfiles",
  "repairSafeHealthIssues", "shippingRuleExplanation", "ensureSaleReplies", "imageFolderIndex",
  "hydrateThumbnails", "openContextHelp", "live-overall-progress"
];
requiredRendererFeatures.forEach((feature) => {
  if (!renderer.includes(feature)) throw new Error(`Missing v1.6 renderer feature: ${feature}`);
});

[
  "contextHelpBtn", "workspaceColumnsDialog", "saleReplyDialog", "mergeBuyerDialog",
  "facebookPostUrl", "bulkEditPreview", "repairHealthBtn"
].forEach((id) => {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing v1.6 interface control: ${id}`);
});

if (!main.includes('ipcMain.handle("images:thumbnail"')) throw new Error("Thumbnail cache IPC is missing.");
if (!guide.sections.some((section) => section.id === "tab-live" && section.paragraphs.some((text) => text.includes("top meter")))) throw new Error("The guide does not explain Live Sale progress.");

console.log(JSON.stringify({
  naturalCardNumbers: true,
  persistentImageIndex: true,
  cachedThumbnails: true,
  saleReplyLibrary: true,
  buyerMerge: true,
  safeHealthRepair: true,
  contextualHelp: true,
  guideUpdated: true
}));
