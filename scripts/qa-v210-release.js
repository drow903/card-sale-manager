const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const pkg = JSON.parse(read("package.json"));
const main = read("main.js");
const renderer = read("renderer.js");
const features = read("features-v200.js");
const html = read("index.html");
const styles = read("styles.css");
const guide = JSON.parse(read("assets/help-guide-content.json"));

if (pkg.version !== "2.1.0") throw new Error(`Expected version 2.1.0, found ${pkg.version}`);
if (!pkg.build.files.includes("image-matcher.js")) throw new Error("Installer is missing image-matcher.js");
if (!html.includes('<script src="image-matcher.js"></script>')) throw new Error("Image matcher is not loaded before the renderer.");
if (!renderer.includes("CSMImageMatcher.propose") || !renderer.includes("imageMatchStatusLabel")) throw new Error("The deterministic matcher is not connected to Image Review.");
if (renderer.includes("100% automatic-confirmation threshold") || html.includes("Confirm all 100% matches")) throw new Error("Old percentage-based matching copy remains.");
if (!main.includes('".heic"') || !main.includes("readable: !nativeImage.createFromPath")) throw new Error("HEIC or unreadable-image handling is incomplete.");
if (!html.includes("workspace-more-actions") || !styles.includes(".workspace-action-bar")) throw new Error("Sale Workspace toolbar cleanup is incomplete.");
["orderCardShowSubtotal", "orderCardShowShipping", "orderCardShowTotal", "orderCardShowPayment"].forEach((id) => { if (!html.includes(`id="${id}"`)) throw new Error(`Visual order option missing: ${id}`); });
if (!features.includes("visualOrderCardSettings") || !features.includes("settings.showTotal")) throw new Error("Visual order totals are not saved and rendered.");
if (!guide.sections.some((section) => section.id === "match-images") || !guide.sections.some((section) => section.id === "visual-order-cards")) throw new Error("Guide sections are missing.");

console.log(JSON.stringify({ version: pkg.version, matcher: "rules-based", workspaceToolbar: true, optionalVisualTotals: true, guideUpdated: true }));
