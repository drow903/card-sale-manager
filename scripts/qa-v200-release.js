const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const pkg = JSON.parse(read("package.json"));
const main = read("main.js");
const preload = read("preload.js");
const renderer = read("renderer.js");
const features = read("features-v200.js");
const html = read("index.html");
const guide = JSON.parse(read("assets/help-guide-content.json"));
const manifest = JSON.parse(read("facebook-owner-companion/manifest.json"));

if (pkg.version !== "2.0.0") throw new Error(`Expected version 2.0.0, found ${pkg.version}`);
[
  "media-tools.js", "features-v200.js", "live-popout.js", "live-popout-preload.js",
  "live-popout.html", "live-popout.css", "facebook-owner-companion/**/*", "node_modules/ffmpeg-static/**/*"
].forEach((entry) => { if (!pkg.build.files.includes(entry)) throw new Error(`Installer is missing ${entry}`); });
if (!pkg.build.asarUnpack.includes("node_modules/ffmpeg-static/**/*")) throw new Error("FFmpeg must be unpacked for the installed app.");
if (!pkg.build.extraResources?.some((entry) => entry.from === "facebook-owner-companion")) throw new Error("The load-unpacked extension folder must be available outside app.asar.");
if (!main.includes('facebook:companion-status') || !main.includes('ownerEntitled()')) throw new Error("Owner companion entitlement gate is missing.");
if (!preload.includes("openLivePopout") || !features.includes("v2LivePayload")) throw new Error("Live Sale mini window bridge is incomplete.");
if (!features.includes("v2CreateOrderPage") || !html.includes("visualOrderCardDialog")) throw new Error("Visual order cards are incomplete.");
if (!features.includes("v2RenderTrailer") || !main.includes('trailer:render') || !html.includes("saleTrailerDialog")) throw new Error("Sale Trailer is incomplete.");
if (!features.includes("v2PrepareTrailerCards") || !features.includes("v2ShowTrailerImageWarnings") || !main.includes('trailer-render-error')) throw new Error("Sale Trailer image validation and diagnostics are incomplete.");
if (!features.includes("trailerIncludeIntro") || !features.includes("trailerIncludeOutro") || !features.includes("if (includeIntro)") || !features.includes("if (includeOutro)")) throw new Error("Sale Trailer intro/outro controls are incomplete.");
if (!renderer.includes("validatedAddress") || !renderer.includes("addressValidatedAt") || !renderer.includes("Buyer profile saved and address validated.")) throw new Error("Buyer profile address validation is incomplete.");
if (!read("styles.css").includes("#buyerProfileList { flex: 1 1 auto")) throw new Error("Buyer directory does not have an independent scrolling region.");
if (manifest.manifest_version !== 3 || !manifest.permissions.includes("contextMenus")) throw new Error("The browser companion is not a Manifest V3 right-click extension.");
if (!renderer.includes("sourceDetailsRemovedAt")) throw new Error("Archived sales must strip captured Facebook identifiers.");
["live-mini-window", "visual-order-cards", "sale-trailers"].forEach((id) => { if (!guide.sections.some((section) => section.id === id)) throw new Error(`Guide section missing: ${id}`); });

console.log(JSON.stringify({ version: pkg.version, ownerCapture: true, liveMiniWindow: true, visualOrderCards: true, saleTrailers: true, guideUpdated: true }));
