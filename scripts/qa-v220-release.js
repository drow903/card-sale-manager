const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const renderer = fs.readFileSync(path.join(root, "renderer.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const pkg = require(path.join(root, "package.json"));

assert(Number(pkg.version.split(".")[0]) > 2 || (Number(pkg.version.split(".")[0]) === 2 && Number(pkg.version.split(".")[1]) >= 2), "package version must include the 2.2 feature set or newer");
[
  "normalizeOrderAddOns", "orderTotals", "orderReadiness", "openCancelOrder", "applyCancelOrder",
  "ensureQuickMessages", "renderConditionalMessage", "openQuickMessages", "likelyDuplicateBuyer",
  "dismissedPoBoxWarnings", "privacyMode"
].forEach((name) => assert(renderer.includes(name), `missing renderer feature: ${name}`));
[
  "orderGroupMode", "orderViewMode", "quickMessagesBtn", "privacyModeBtn", "quickMessagesDialog", "cancelOrderDialog"
].forEach((id) => assert(html.includes(`id="${id}"`), `missing UI control: ${id}`));
[
  ".order-add-ons", ".buyer-status-group", ".quick-message-layout", ".privacy-mode"
].forEach((selector) => assert(css.includes(selector), `missing style: ${selector}`));

assert(renderer.includes("Purchased ${escapeHtml(displayPurchaseDate(card.purchaseDate))}"), "purchase date must appear in seller order/pulling UI");
assert(renderer.includes("data-pack-addon"), "packing must support add-ons");
assert(renderer.includes("order.locked = true"), "shipped orders must lock");
assert(!/PUBLIC_MESSAGE_FIELDS[^\n]*purchasePrice/.test(renderer), "private purchase price must not be a public message field");
assert(!/PUBLIC_MESSAGE_FIELDS[^\n]*purchaseDate/.test(renderer), "private purchase date must not be a public message field");

console.log("CSM 2.2 release checks passed.");
