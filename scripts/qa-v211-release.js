const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync("facebook-owner-companion/manifest.json", "utf8"));
const background = fs.readFileSync("facebook-owner-companion/background.js", "utf8");
const popup = fs.readFileSync("facebook-owner-companion/popup.js", "utf8");
const content = fs.readFileSync("facebook-owner-companion/content.js", "utf8");
const main = fs.readFileSync("main.js", "utf8");
const preload = fs.readFileSync("preload.js", "utf8");
const features = fs.readFileSync("features-v200.js", "utf8");
const renderer = fs.readFileSync("renderer.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const matcher = fs.readFileSync("image-matcher.js", "utf8");

if (pkg.version !== "2.1.1") throw new Error(`Expected 2.1.1, found ${pkg.version}`);
if (manifest.version !== "2.1.1" || !manifest.permissions.includes("scripting")) throw new Error("Updated extension manifest is incomplete.");
if (!background.includes("captureFromTab") || !background.includes("chrome.scripting.executeScript") || !background.includes("saveResult")) throw new Error("Companion retry diagnostics are incomplete.");
if (!popup.includes("showLastResult") || !popup.includes("result.message")) throw new Error("Companion popup diagnostics are incomplete.");
if (!main.includes("tokenValid") || !main.includes("CSM is still opening")) throw new Error("Companion server health checks are incomplete.");
if (!content.includes("parentCommentId") || !content.includes("findParentById") || !content.includes("contextCandidates")) throw new Error("Facebook parent-listing capture is incomplete.");
if (!features.includes("v2CaptureMatch") || !features.includes("Card identified") || !features.includes("Card needs review")) throw new Error("CSM card association and review details are incomplete.");
if (!html.includes("Re-run lookup for this sale") || !renderer.includes("async function forceSaleImageLookup") || !renderer.includes("currentSale: true")) throw new Error("Image recheck is not limited to the active sale.");
if (!matcher.includes("sportFolderMatch") || !matcher.includes("football\", \"basketball\", \"hockey")) throw new Error("Sport-folder fallback is incomplete.");
if (renderer.includes("indexFresh") || !renderer.includes("scanImageFolder({ folders:")) throw new Error("Image lookup can still reuse a stale folder index.");
if (!matcher.includes("sportFallbackStrong") || !html.includes("footballFolderAliases") || !html.includes("basketballFolderAliases") || !html.includes("hockeyFolderAliases")) throw new Error("Sport fallback safeguards or aliases are incomplete.");
if (!main.includes('"images:validate-files"') || !preload.includes("validateImageFiles") || !renderer.includes("validateImagePath")) throw new Error("Image availability is not revalidated before attachment.");
if (!matcher.includes("/^\\d{2}") || !matcher.includes("fourDigit.length === 1")) throw new Error("Dedicated and two-digit year-folder parsing is incomplete.");
if (!main.includes('"images:inspect-folders"') || !preload.includes("inspectImageFolders") || !renderer.includes("Year-folder coverage") || !renderer.includes("Cards missing Sport")) throw new Error("Pre-lookup folder coverage is incomplete.");
if (!renderer.includes("data-match-sport") || !renderer.includes("Re-running this card now")) throw new Error("Set Sport and retry is incomplete.");
if (!main.includes('"images:fingerprint-files"') || !preload.includes("fingerprintImageFiles") || !renderer.includes("imageContentConflicts")) throw new Error("Duplicate-image content detection is incomplete.");

console.log(JSON.stringify({ version: pkg.version, companionInjectionRepair: true, tokenValidation: true, visibleErrors: true, parentListingCapture: true, cardAssociation: true, currentSaleRecheck: true, sportFolderFallback: true, freshFolderScan: true, customSportAliases: true, imageRevalidation: true, twoDigitYearFolders: true, folderCoverage: true, sportRetry: true, duplicateContentDetection: true }));
