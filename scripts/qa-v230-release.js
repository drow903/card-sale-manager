const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const renderer = fs.readFileSync(path.join(root, "renderer.js"), "utf8");
const features = fs.readFileSync(path.join(root, "features-v200.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const guide = JSON.parse(fs.readFileSync(path.join(root, "assets", "help-guide-content.json"), "utf8"));

[
  "ensureOneOffState", "normalizeOneOffOrder", "oneOffTotals", "createOneOffOrder",
  "renderOneOffOrders", "buildOneOffDocument", "closeOneOffOrder", "reopenOneOffOrder",
  "ensurePaymentQrSettings", "refreshBuyerShippingAfterLineItemChange"
].forEach((name) => assert(renderer.includes(name), `missing one-off/order feature: ${name}`));

[
  "oneOffOrdersDialog", "oneOffOrderList", "oneOffOrderDetail", "paymentQrDialog",
  "archivedOneOffList", "newOneOffOrderBtn", "openOneOffOrdersBtn", "orderCardShowPaymentQrs"
].forEach((id) => assert(html.includes(`id="${id}"`), `missing UI control: ${id}`));

[".one-off-layout", ".one-off-item", ".payment-qr-row"].forEach((selector) => assert(css.includes(selector), `missing style: ${selector}`));
assert(css.includes("height: min(900px, 90vh)") && css.includes(".one-off-detail { height: 100%") && css.includes("overflow-y: auto"), "one-off order list and details must remain independently scrollable");
assert(css.includes(".dialog-card.large.quick-message-dialog") && css.includes("width:min(1280px") && css.includes("white-space:nowrap"), "reusable buyer messages must use a wide dialog with non-wrapping controls");
assert(features.includes("paymentQrs"), "visual buyer summaries must render enabled payment QR codes");
assert(renderer.includes('archiveReason: "closed"'), "closing a sale must move it to archived records");
assert(renderer.includes("state.archivedOneOffOrders.unshift(order)"), "closed one-off orders must move to one-off history");
assert(renderer.includes("state.imageFolderIndex?.signature === signature"), "image lookup must reuse the persistent folder index");
assert(renderer.includes("data-dismiss-profile-po-box"), "buyer profiles must provide a direct PO-box warning dismiss control");
assert(renderer.includes('`${normalizedAddress(profile.address)}|*`'), "PO-box dismissal must persist for the saved address");
assert(guide.sections.some((section) => section.id === "one-off-orders"), "built-in guide must explain one-off orders");

console.log("CSM 2.3 feature checks passed.");
