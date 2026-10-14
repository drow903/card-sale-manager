const fs = require("fs");

const source = fs.readFileSync("renderer.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const guide = JSON.parse(fs.readFileSync("assets/help-guide-content.json", "utf8"));

const requiredIds = [
  "experienceModeBtn", "beginnerCoach", "pickImageDialog", "pickImageChoices",
  "missingImagesDialog", "missingImagesList", "imagePreflightDialog",
  "saleReadinessDialog", "buyerConflictDialog"
];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing Beginner Mode UI: ${id}`);
}

const requiredFunctions = [
  "isBeginnerMode", "renderBeginnerCoach", "matchReviewExplanation", "openPickImage",
  "renderMissingImages", "renderImagePreflight", "saleReadinessChecks", "openSaleReadiness"
];
for (const name of requiredFunctions) {
  if (!source.includes(`function ${name}(`)) throw new Error(`Missing Beginner Mode logic: ${name}`);
}

if (!html.includes("Highly recommended for first-time users")) throw new Error("Beginner Mode is not strongly recommended during setup.");
if (!source.includes('state.preferences.experienceMode = isBeginnerMode() ? "standard" : "beginner"')) throw new Error("Mode switching is not wired.");
if (!source.includes('view === "live" && isBeginnerMode()')) throw new Error("Beginner readiness gate is not wired to Live Sale Mode.");
if (!source.includes("buyerChanged || supersedesOffer")) throw new Error("Buyer/order conflict safeguard is missing.");
if (!source.includes("Why review is needed:")) throw new Error("Image-review explanations are missing.");
if (!css.includes(".pick-image-choices") || !css.includes(".readiness-item")) throw new Error("New workflows are missing layout styles.");
if (!guide.sections.some((section) => section.id === "beginner-mode")) throw new Error("The local user guide does not explain Beginner Mode.");

const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
if (duplicates.length) throw new Error(`Duplicate UI IDs: ${duplicates.join(", ")}`);

console.log(JSON.stringify({
  beginnerRecommended: true,
  modeSwitch: true,
  imageCompare: true,
  missingImagesWorkspace: true,
  imagePreflight: true,
  readinessGate: true,
  buyerConflictProtection: true,
  guideUpdated: true
}));
