const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const numberLabel = (card) => String(card?.number ?? "").trim() ? `#${String(card.number).trim()}` : "";
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const fileUrl = (value) => value ? encodeURI(`file:///${value.replace(/\\/g, "/")}`) : "";
const DEFAULT_TEMPLATE = "{year} {brand} {player} #{number} {grade} ({flaws}) - ${claimPrice}";
const DEFAULT_CLAIM_WORDS = ["claim", "claimed", "take", "taken", "mine", "sold"];
const DEFAULT_SALE_INTRO = "Welcome to {saleName}!\n\nI’ll be posting {cardCount} cards spanning {yearRange}. To claim a card, comment {claimWords} on the individual listing.\n\nShipping:\n• PWE: {pwePrice}\n• PMWT: {pmwtPrice}\n\nPlease keep claims in the order posted. Offers will be reviewed separately. Thanks, and have fun!";
const DEFAULT_PWE_LABEL = { heading: "PLEASE DELIVER TO", returnName: "", returnAddress: "", footer: "Thank you! Please do not bend.", accent: "#071A2B", orientation: "portrait", size: "standard", font: "modern", alignment: "left", padding: "standard", showReturn: true, showHeading: true, showOrder: true, showFooter: true };
const BUILT_IN_BRAND_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 140"><rect x="18" y="34" width="62" height="74" rx="7" fill="white" stroke="#2F6BFF" stroke-width="8" transform="rotate(-13 49 71)"/><rect x="32" y="24" width="62" height="78" rx="7" fill="white" stroke="#071A2B" stroke-width="8" transform="rotate(-4 63 63)"/><path d="M62 29h37c6 0 11 5 11 11v38l-29 33-29-29V40c0-6 4-11 10-11Z" fill="#19B56B" stroke="#071A2B" stroke-width="7"/><circle cx="92" cy="47" r="6" fill="#071A2B"/><path d="m66 73 11 11 21-24" fill="none" stroke="white" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><text x="132" y="66" fill="#071A2B" font-family="Segoe UI,Arial" font-size="42" font-weight="800">CARD SALE</text><text x="134" y="96" fill="#334155" font-family="Segoe UI,Arial" font-size="24" font-weight="700" letter-spacing="8">MANAGER</text><text x="188" y="121" fill="#119754" font-family="Segoe UI,Arial" font-size="18" font-weight="700">Post. Sell. Track.</text></svg>')}`;
const PACKING_SECTIONS = [
  ["header", "Brand header"], ["buyer", "Buyer and order"], ["message", "Thank-you message"],
  ["items", "Card list"], ["totals", "Totals"], ["policy", "Return policy"],
  ["qr", "QR code and links"], ["footer", "Footer"]
];
const DEFAULT_PACKING_DESIGN = {
  name: "Standard branded slip", pageSize: "letter", accent: "#19b56b", brandName: "Card Sale Manager", contact: "Post. Sell. Track.", logoPath: "",
  socialLink: "", paymentLink: "", feedbackLink: "", upcomingLink: "", qrType: "social", qrUrl: "",
  header: "Thanks for joining the sale!", thanks: "Thank you for your purchase. I appreciate your business!", returnPolicy: "Please contact me if anything in your order needs attention.", footer: "Packed with care.",
  showAddress: true, showOrderNumber: true, showPayment: true, showShipping: true, showPrices: true, showDetails: true, showThumbnails: false, includeLabel: false,
  sectionOrder: PACKING_SECTIONS.map(([id]) => id)
};
const DEFAULT_MESSAGE_TEMPLATES = {
  orderSummary: "Hi {firstName} — here’s your total from the sale:\n\n{cardList}\n\nCards ({cardCount}): {subtotal}\nShipping ({shippingMethod}): {shipping}\n{discountLine}Total: {total}\n\nPlease confirm your mailing address when you send payment. Thanks!",
  paymentDue: "Hi {firstName} — your total is {total} including {shippingMethod} shipping. Please send payment and confirm your mailing address. Thanks!",
  paymentReceived: "Hi {firstName} — payment received. Thank you! I’ll get your cards packed and will send tracking when available.",
  shipped: "Hi {firstName} — your cards have shipped!\n\n{trackingLine}\n\nThanks again for your purchase!",
  delayed: "Hi {firstName} — a quick update: your card shipment is delayed, but I’m still working on it and will send another update as soon as it ships. Thanks for your patience.",
  counterOffer: "Hi {firstName} — the {card} was listed at {listPrice}. You offered {offerPrice}, and I’d like to counter at {counterPrice}. Let me know if that works for you."
};
const MESSAGE_TEMPLATE_FIELDS = [
  ["orderSummary", "Order confirmation"], ["paymentDue", "Payment due"], ["paymentReceived", "Payment received"],
  ["shipped", "Shipping confirmation"], ["delayed", "Shipping delayed"], ["counterOffer", "Counter offer"]
];

const starterSale = {
  id: uid(),
  name: "Sample vintage sale",
  pweShipping: 1,
  pmwtShipping: 5,
  template: DEFAULT_TEMPLATE,
  cards: [
    { id: uid(), ref: "1", year: "1961", set: "Heritage Stars", number: "12", name: "Jack Mercer", condition: "VG-EX", price: 12, purchasePrice: 6, purchaseDate: "", notes: "Light corner wear", status: "available", imagePath: "" },
    { id: uid(), ref: "2", year: "1974", set: "Court Kings", number: "8", name: "Eli Turner", condition: "EX", price: 18, purchasePrice: 9, purchaseDate: "", notes: "None", status: "offered", buyer: "Jamie Example", offerPrice: 15, offerStatus: "pending", claimType: "offer", claimedAt: new Date().toISOString(), imagePath: "" },
    { id: uid(), ref: "3", year: "1968", set: "Ice Legends", number: "30", name: "Noah Reed", condition: "VG", price: 15, purchasePrice: 7, purchaseDate: "", notes: "Soft lower-left corner", status: "claimed", buyer: "Alex Sample", claimPrice: 14, claimType: "claim", claimedAt: new Date().toISOString(), imagePath: "" }
  ],
  images: [],
  orders: { "Alex Sample": { status: "awaiting", shippingMethod: "PWE", discount: 0 } }
};

let state = { sales: [starterSale], activeSaleId: starterSale.id, selectedBuyer: "Mike R", filter: "all", query: "", claimQuery: "", lookupSettings: { primaryFolder: "", additionalFolders: [], excludedFolders: [] } };
let pendingSheet = null;
let pendingMatches = null;
let saveTimer = null;
let undoStack = [];
let selectedListingIds = new Set();
let selectedMatchIds = new Set();
let availableUpdate = null;
let parsedClaimMatches = [];
let liveIndex = 0;
let profileQuery = "";
let packingDesignerDraft = null;
let packingBulkSelection = new Set();
let setupStep = 0;
let walkthroughStep = 0;
let installedVersion = "";
let portableDocument = { active: false, path: "", name: "Local workspace", readOnly: false, conflict: false, missingImages: 0, revision: 0 };
let recentCsmFiles = [];
let csmBackups = [];
let pendingCsmConflict = null;
const runtimeErrors = [];
const scrubDiagnosticText = (value) => String(value ?? "").replace(/file:\/{2,3}[^\s)]+/gi, "[local path]").replace(/[A-Za-z]:[\\/][^\n\r]*/g, "[local path]").slice(0, 2000);
window.addEventListener("error", (event) => { runtimeErrors.push({ at: new Date().toISOString(), type: "error", message: scrubDiagnosticText(event.message || "Unknown renderer error").slice(0, 500) }); if (runtimeErrors.length > 25) runtimeErrors.shift(); });
window.addEventListener("unhandledrejection", (event) => { runtimeErrors.push({ at: new Date().toISOString(), type: "promise", message: scrubDiagnosticText(event.reason?.message || event.reason || "Unhandled promise rejection").slice(0, 500) }); if (runtimeErrors.length > 25) runtimeErrors.shift(); });
const packingPreviewSheet = typeof CSSStyleSheet !== "undefined" ? new CSSStyleSheet() : null;
if (packingPreviewSheet && typeof document !== "undefined" && document.adoptedStyleSheets) document.adoptedStyleSheets = [...document.adoptedStyleSheets, packingPreviewSheet];
const pwePreviewSheet = typeof CSSStyleSheet !== "undefined" ? new CSSStyleSheet() : null;
if (pwePreviewSheet && typeof document !== "undefined" && document.adoptedStyleSheets) document.adoptedStyleSheets = [...document.adoptedStyleSheets, pwePreviewSheet];

const clone = (value) => JSON.parse(JSON.stringify(value));

function saleSnapshotData(sale) {
  const data = clone(sale);
  delete data.versions;
  return data;
}

function snapshotSale(label, sale = activeSale()) {
  if (!sale) return;
  sale.versions ||= [];
  const version = { id: uid(), at: new Date().toISOString(), label, data: saleSnapshotData(sale) };
  sale.versions.push(version);
  undoStack.push({ saleId: sale.id, versionId: version.id });
  if (sale.versions.length > 25) sale.versions.splice(0, sale.versions.length - 25);
}

function recordAudit(type, message, details = {}, sale = activeSale()) {
  sale.audit ||= [];
  sale.audit.unshift({ id: uid(), at: new Date().toISOString(), type, message, ...details });
  if (sale.audit.length > 250) sale.audit.length = 250;
}

function allBuyerNames() {
  return [...new Set([...Object.keys(state.buyerProfiles || {}), ...state.sales.flatMap((sale) => sale.cards.filter(cardInOrder).map((card) => card.buyer).filter(Boolean))])].sort((a, b) => a.localeCompare(b));
}

function blankBuyerProfile() { return { notes: "", address: "", tags: [], aliases: [], previousAddresses: [], manuallySaved: false }; }

function buyerProfile(name, create = false) {
  state.buyerProfiles ||= {};
  if (!state.buyerProfiles[name] && create) state.buyerProfiles[name] = blankBuyerProfile();
  const profile = state.buyerProfiles[name] || blankBuyerProfile();
  profile.tags ||= [];
  profile.aliases ||= [];
  profile.previousAddresses ||= [];
  return profile;
}

function ensureBuyerProfile(name) { return buyerProfile(name, true); }

function canonicalBuyerName(name) {
  const entered = String(name || "").trim();
  if (!entered) return "";
  const lower = entered.toLowerCase();
  return Object.keys(state.buyerProfiles || {}).find((buyer) => buyer.toLowerCase() === lower || buyerProfile(buyer).aliases.some((alias) => alias.toLowerCase() === lower)) || entered;
}

function normalizedAddress(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

function addressWarnings(buyer, address = buyerProfile(buyer).address) {
  const value = String(address || "").trim();
  const warnings = [];
  if (!value) return ["Mailing address is missing"];
  if (!/\b\d{5}(?:-\d{4})?\b/.test(value)) warnings.push("ZIP code is missing or incomplete");
  if (!/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/i.test(value)) warnings.push("State abbreviation may be missing");
  if (/\b(?:apt|apartment|unit|suite|ste)\b\s*$/i.test(value)) warnings.push("Apartment or unit number is incomplete");
  const key = normalizedAddress(value);
  const duplicate = key && Object.keys(state.buyerProfiles || {}).find((name) => name !== buyer && normalizedAddress(buyerProfile(name).address) === key);
  if (duplicate) warnings.push(`Same address is also saved for ${duplicate}`);
  return warnings;
}

function claimWords() {
  state.preferences ||= {};
  state.preferences.claimWords ||= [...DEFAULT_CLAIM_WORDS];
  return state.preferences.claimWords;
}

function ensureMessageTemplates() {
  state.preferences ||= {};
  state.preferences.messageTemplates ||= {};
  const legacySummary = "Hi {firstName} — here’s your total from the sale:\n\n{cardList}\n\nCards: {subtotal}\n{discountLine}Shipping ({shippingMethod}): {shipping}\nTotal: {total}\n\nPlease confirm your mailing address when you send payment. Thanks!";
  if (state.preferences.messageTemplates.orderSummary === legacySummary) state.preferences.messageTemplates.orderSummary = DEFAULT_MESSAGE_TEMPLATES.orderSummary;
  Object.entries(DEFAULT_MESSAGE_TEMPLATES).forEach(([key, value]) => { state.preferences.messageTemplates[key] ??= value; });
  return state.preferences.messageTemplates;
}

function ensureSaleIntroTemplate() {
  state.preferences ||= {};
  state.preferences.saleIntroTemplate ||= DEFAULT_SALE_INTRO;
  return state.preferences.saleIntroTemplate;
}

function ensurePweLabelSettings() {
  state.preferences ||= {};
  state.preferences.pweLabel ||= clone(DEFAULT_PWE_LABEL);
  return state.preferences.pweLabel;
}

function importPresets() {
  state.importPresets ||= [];
  return state.importPresets;
}

function offerDeskSettings() {
  state.preferences ||= {};
  state.preferences.offerDesk ||= { query: "", status: "all", buyer: "all", margin: "all", sortKey: "card", sortDirection: "asc" };
  return state.preferences.offerDesk;
}

function orderDeskSettings() {
  state.preferences ||= {};
  state.preferences.orderDesk ||= { query: "", status: "all" };
  return state.preferences.orderDesk;
}

function trackingUrl(value) {
  const number = String(value || "").replace(/\s/g, "");
  if (!number) return "";
  if (/^1Z/i.test(number)) return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
  if (/^\d{12,15}$/.test(number)) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`;
}

function purchaseDateValue(value) {
  const code = normalizePurchaseDate(value);
  if (!/^\d{8}$/.test(code)) return null;
  const date = new Date(Number(code.slice(4)), Number(code.slice(0, 2)) - 1, Number(code.slice(2, 4)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function inventoryAgeDays(card) {
  const purchased = purchaseDateValue(card.purchaseDate);
  return purchased ? Math.max(0, Math.floor((Date.now() - purchased.getTime()) / 86400000)) : null;
}

function applyDisplayPreferences() {
  state.preferences ||= { fontScale: 1, compact: false, theme: "system", reducedMotion: false };
  state.preferences.theme ||= "system";
  document.documentElement.style.setProperty("--font-scale", state.preferences.fontScale || 1);
  document.documentElement.dataset.theme = state.preferences.theme;
  document.documentElement.dataset.reducedMotion = String(Boolean(state.preferences.reducedMotion));
  document.body.classList.toggle("compact-mode", Boolean(state.preferences.compact));
  const density = $("#densityBtn");
  if (density) density.textContent = state.preferences.compact ? "Comfortable" : "Compact";
  const theme = $("#themeBtn");
  if (theme) theme.textContent = `Theme: ${state.preferences.theme[0].toUpperCase()}${state.preferences.theme.slice(1)}`;
  const motion = $("#motionBtn");
  if (motion) motion.textContent = state.preferences.reducedMotion ? "Motion: Reduced" : "Motion: On";
}

function ensurePackingSettings() {
  state.packingTemplates ||= [];
  state.preferences ||= {};
  state.preferences.packingDesign ||= clone(DEFAULT_PACKING_DESIGN);
  const design = state.preferences.packingDesign;
  if (design.brandName === "Card Sale Manager") {
    if (String(design.accent).toLowerCase() === "#d9693d") design.accent = "#19b56b";
    if (!design.contact && !design.logoPath) design.contact = "Post. Sell. Track.";
  }
  Object.entries(DEFAULT_PACKING_DESIGN).forEach(([key, value]) => { if (design[key] == null) design[key] = clone(value); });
  design.sectionOrder = [...new Set([...(design.sectionOrder || []), ...PACKING_SECTIONS.map(([id]) => id)])].filter((id) => PACKING_SECTIONS.some(([section]) => section === id));
  state.packingPrintHistory ||= [];
  return design;
}

function activeSale() {
  return state.sales.find((sale) => sale.id === state.activeSaleId) || state.sales[0];
}

function lookupSettings() {
  state.lookupSettings ||= { primaryFolder: "", additionalFolders: [], excludedFolders: [] };
  state.lookupSettings.additionalFolders ||= [];
  state.lookupSettings.excludedFolders ||= [];
  return state.lookupSettings;
}

function normalizedCardKey(card) {
  return [card.year, card.set, card.number, card.name].map(normalizeMatchText).join("|");
}

function duplicateInfo(card, sale = activeSale()) {
  if (!card?.id) return { index: 0, total: 1, label: "" };
  const matches = sale.cards.filter((item) => normalizedCardKey(item) === normalizedCardKey(card));
  const index = matches.findIndex((item) => item.id === card.id);
  return { index, total: matches.length, label: matches.length > 1 ? `(${index + 1} of ${matches.length})` : "" };
}

function normalizePurchaseDate(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  let digits = raw.replace(/\D/g, "");
  if (/^\d{7}$/.test(digits)) digits = `0${digits}`;
  if (/^\d{8}$/.test(digits)) {
    const firstFour = Number(digits.slice(0, 4));
    if (firstFour >= 1900 && firstFour <= 2200) return `${digits.slice(4, 6)}${digits.slice(6, 8)}${digits.slice(0, 4)}`;
    return digits;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}${parsed.getFullYear()}`;
}

function displayPurchaseDate(value) {
  const code = normalizePurchaseDate(value);
  return /^\d{8}$/.test(code) ? `${code.slice(0, 2)}/${code.slice(2, 4)}/${code.slice(4)}` : code || "—";
}

function orderFor(buyer) {
  const sale = activeSale();
  ensureBuyerProfile(buyer);
  sale.pweShipping ??= 1;
  sale.pmwtShipping ??= sale.shipping ?? 5;
  sale.orders ||= {};
  sale.orders[buyer] ||= { status: "shopping", shippingMethod: pweEligible(buyer) ? "" : "PMWT", discount: 0 };
  const order = sale.orders[buyer];
  if (order.shippingMethod == null) order.shippingMethod = order.shipping != null ? (Number(order.shipping) === Number(sale.pweShipping) ? "PWE" : "PMWT") : (pweEligible(buyer) ? "" : "PMWT");
  if (!order.shippingMethod && !pweEligible(buyer)) order.shippingMethod = "PMWT";
  return order;
}

function cardInOrder(card) {
  return Boolean(card?.buyer) && card.status !== "available" && card.status !== "offered" && !(card.claimType === "offer" && ["pending", "countered"].includes(card.offerStatus));
}

function pweEligible(buyer) {
  const cards = activeSale().cards.filter((card) => card.buyer === buyer && cardInOrder(card));
  const value = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  return cards.length <= 3 && value <= 50;
}

function shippingAmount(order, sale = activeSale()) {
  if (!order.shippingMethod) return 0;
  return Number(order.shippingMethod === "PWE" ? sale.pweShipping : sale.pmwtShipping) || 0;
}

function cardsForBuyer(buyer) {
  return activeSale().cards.filter((card) => card.buyer === buyer && cardInOrder(card));
}

function buyers() {
  return [...new Set(activeSale().cards.filter(cardInOrder).map((card) => card.buyer))].sort((a, b) => a.localeCompare(b));
}

async function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  state.activeSaleId = activeSale().id;
  const result = await window.cardSale.save(state);
  if (result?.csm?.document) portableDocument = result.csm.document;
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (result?.csm?.conflict) {
    $("#saveText").textContent = `Saved locally · CSM file changed elsewhere`;
    $("#saveDot").style.background = "#f0b44b";
    if (!$("#csmConflictDialog").open) showCsmConflict(result.csm, "save");
  } else if (portableDocument.readOnly) {
    $("#saveText").textContent = `Saved locally · CSM file is read-only`;
    $("#saveDot").style.background = "#f0b44b";
  } else {
    $("#saveText").textContent = `${portableDocument.active ? "Saved locally and to CSM file" : "Changes saved locally"} · ${time}`;
    $("#saveDot").style.background = "#19b56b";
  }
  renderCsmFileManager(false);
}

function saveSoon() {
  $("#saveText").textContent = "Saving…";
  $("#saveDot").style.background = "#f0b44b";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveNow();
    } catch (error) {
      $("#saveText").textContent = "Save failed — changes still open";
      $("#saveDot").style.background = "#d4584e";
    }
  }, 250);
}

function renderCsmFileManager(refreshRecent = false) {
  const status = $("#csmDocumentStatus");
  if (!status) return;
  if (refreshRecent) window.cardSale.csmStatus().then((result) => { portableDocument = result.document; recentCsmFiles = result.recent || []; csmBackups = result.backups || []; renderCsmFileManager(false); });
  const stateLabel = portableDocument.conflict ? "Changed on another computer — local changes are protected" : portableDocument.readOnly ? "Read-only protection is active" : portableDocument.active ? "Autosaving locally and to this CSM file" : "Using CSM’s local workspace";
  status.classList.toggle("warning", portableDocument.readOnly || portableDocument.conflict || portableDocument.missingImages > 0);
  status.innerHTML = `<strong>${escapeHtml(portableDocument.name || "Local workspace")}</strong><span>${escapeHtml(stateLabel)}</span>${portableDocument.path ? `<small>${escapeHtml(portableDocument.path)}</small>` : ""}${portableDocument.missingImages ? `<small>⚑ ${portableDocument.missingImages} image${portableDocument.missingImages === 1 ? "" : "s"} need relinking.</small>` : ""}`;
  $("#saveCsmBtn").textContent = portableDocument.readOnly || portableDocument.conflict ? "Take over and save" : "Save now";
  $("#saveCsmBtn").disabled = false;
  $("#revealCsmBtn").disabled = !portableDocument.active;
  $("#relinkCsmImagesBtn").disabled = !portableDocument.active;
  $("#detachCsmBtn").disabled = !portableDocument.active;
  const missing = portableDocument.missingImageFiles || [];
  $("#csmMissingSection").classList.toggle("hidden", !missing.length);
  $("#csmMissingImages").innerHTML = missing.map((item) => {
    const links = state.sales.flatMap((sale) => sale.cards.filter((card) => String(card.imagePath || "").toLowerCase() === String(item.originalPath || "").toLowerCase()).map((card) => ({ sale, card })));
    const label = links.length ? links.map(({ sale, card }) => `${sale.name}: ${card.year} ${card.set} ${card.name} ${numberLabel(card)}`.replace(/\s+/g, " ").trim()).join(" · ") : item.fileName;
    const first = links[0];
    return `<article class="csm-manager-item"><div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(item.fileName || item.originalPath)}</small></div><div class="row-actions">${first ? `<button type="button" class="secondary" data-csm-manual-image="${escapeHtml(first.card.id)}" data-csm-sale="${escapeHtml(first.sale.id)}">Choose image</button>` : ""}<button type="button" class="secondary" data-csm-clear-image="${escapeHtml(item.originalPath)}">Leave unmatched</button></div></article>`;
  }).join("");
  $("#csmBackupSection").classList.toggle("hidden", !portableDocument.active || !csmBackups.length);
  $("#csmBackupList").innerHTML = csmBackups.map((item) => `<article class="csm-manager-item"><div><strong>${escapeHtml(new Date(item.savedAt).toLocaleString())}</strong><small>Revision ${Number(item.revision || 0)} · ${Math.max(1, Math.round(Number(item.size || 0) / 1024))} KB</small></div><button type="button" class="secondary" data-restore-csm-backup="${escapeHtml(item.path)}">Restore</button></article>`).join("");
  $("#recentCsmFiles").innerHTML = recentCsmFiles.length ? recentCsmFiles.map((item) => `<article class="recent-csm-item ${item.exists === false ? "missing" : ""}"><button type="button" class="recent-csm-main" data-open-csm="${escapeHtml(item.path)}" ${item.exists === false ? "disabled" : ""}><span>${item.pinned ? "★ " : ""}${escapeHtml(item.name || item.path.split(/[\\/]/).pop())}</span><small>${item.exists === false ? "File unavailable · " : ""}${escapeHtml(item.path)}</small></button><div class="recent-csm-actions"><button type="button" class="secondary" data-csm-recent-action="pin" data-csm-path="${escapeHtml(item.path)}">${item.pinned ? "Unpin" : "Pin"}</button><button type="button" class="secondary" data-csm-recent-action="reveal" data-csm-path="${escapeHtml(item.path)}">Show</button><button type="button" class="secondary" data-csm-recent-action="remove" data-csm-path="${escapeHtml(item.path)}">Remove</button></div></article>`).join("") : `<div class="empty-state"><p>No recent CSM files yet.</p></div>`;
  $("#csmFileBtn").textContent = portableDocument.active ? `CSM: ${portableDocument.name}` : "Portable CSM file";
  document.title = portableDocument.active ? `${activeSale().name} — Card Sale Manager` : "Card Sale Manager";
}

function showCsmConflict(result, mode, filePath = "") {
  pendingCsmConflict = { result, mode, filePath: filePath || result.filePath || portableDocument.path };
  if ($("#csmFileDialog").open) $("#csmFileDialog").close();
  const device = result.device || "another computer";
  const changedAt = result.updatedAt || result.cloudSavedAt || "an unknown time";
  const revisions = result.cloudRevision == null ? "" : `<p>Cloud revision: <strong>${Number(result.cloudRevision)}</strong> · This computer: <strong>${Number(result.localRevision || portableDocument.revision || 0)}</strong></p>`;
  $("#csmConflictSummary").innerHTML = `<article><span>Other computer</span><strong>${escapeHtml(device)}</strong></article><article><span>Last activity</span><strong>${escapeHtml(changedAt === "an unknown time" ? changedAt : new Date(changedAt).toLocaleString())}</strong></article><div>${revisions}<p>Read-only is safest. Saving as a new file keeps both versions. Take over only when the other computer is finished.</p></div>`;
  const note = $("#csmConflictCopyNote");
  note.classList.toggle("hidden", !result.conflictCopyPath);
  note.textContent = result.conflictCopyPath ? `Your unsaved version was automatically protected as ${result.conflictCopyPath.split(/[\\/]/).pop()}.` : "";
  $("#csmConflictReadOnlyBtn").textContent = mode === "open" ? "Open read-only" : "Keep protected";
  $("#csmConflictDialog").showModal();
}

async function openCsmFile(filePath = "") {
  try { await saveNow(); } catch {}
  let result = await window.cardSale.openCsm(filePath);
  if (result?.locked) {
    showCsmConflict(result, "open", result.filePath);
    return;
  }
  if (!result?.success) return result?.canceled ? null : toast(result?.message || "The CSM file could not be opened.");
  window.location.reload();
}

async function saveCsmAs() {
  try { await saveNow(); } catch {}
  const result = await window.cardSale.saveCsmAs(state);
  if (!result?.success) return result?.canceled ? null : toast(result?.message || "The CSM file could not be saved.");
  portableDocument = result.document;
  renderCsmFileManager(true);
  toast("Portable CSM file saved. Future changes will autosave to it and locally.");
}

async function savePortableCsm() {
  if (!portableDocument.active) return saveCsmAs();
  if (portableDocument.readOnly || portableDocument.conflict) {
    showCsmConflict({ ...portableDocument, localRevision: portableDocument.revision }, "save");
    return;
  }
  const result = await window.cardSale.saveCsm(state);
  if (!result?.success) {
    if (result?.conflict) portableDocument = result.document;
    renderCsmFileManager(true);
    return toast(result?.message || "The CSM file could not be saved. Your local recovery copy is still safe.");
  }
  portableDocument = result.document;
  renderCsmFileManager(true);
  toast("CSM file saved and verified.");
}

function clearMissingImagePath(originalPath) {
  const key = String(originalPath || "").toLowerCase();
  state.sales.forEach((sale) => {
    sale.cards.forEach((card) => { if (String(card.imagePath || "").toLowerCase() === key) card.imagePath = ""; });
    sale.images = sale.images.filter((image) => String(image.path || "").toLowerCase() !== key);
  });
}

function applyImageReplacements(replacements) {
  const map = new Map(Object.entries(replacements || {}).map(([from, to]) => [String(from).toLowerCase(), to]));
  const replace = (value) => map.get(String(value || "").toLowerCase()) || value;
  state.sales.forEach((sale) => {
    sale.cards.forEach((card) => { card.imagePath = replace(card.imagePath); });
    sale.images.forEach((image) => { image.path = replace(image.path); image.name = image.path.split(/[\\/]/).pop(); });
  });
  if (state.preferences?.packingSlip?.logoPath) state.preferences.packingSlip.logoPath = replace(state.preferences.packingSlip.logoPath);
}

async function relinkCsmImages() {
  let result;
  try { result = await window.cardSale.relinkCsmImages(); }
  catch (error) { return toast(`Images could not be relinked: ${error.message}`); }
  if (!result?.success) return result?.canceled ? null : toast(result?.message || "Images could not be relinked.");
  applyImageReplacements(result.replacements);
  if (result.root) lookupSettings().primaryFolder = result.root;
  portableDocument = result.document;
  await saveNow();
  render();
  toast(`${result.relinked} image${result.relinked === 1 ? "" : "s"} relinked${result.unresolved ? `; ${result.unresolved} still need review` : ""}.`);
}

async function packageCsmWorkspace() {
  try { await saveNow(); } catch {}
  const button = $("#packageCsmBtn");
  button.disabled = true; button.textContent = "Copying images…";
  let result;
  try { result = await window.cardSale.packageCsm(state); }
  catch (error) { result = { success: false, message: error.message }; }
  finally { button.disabled = false; button.textContent = "Create package with images"; }
  if (!result?.success) return result?.canceled ? null : toast(result?.message || "The portable package could not be created.");
  toast(`Package created with ${result.copied} image${result.copied === 1 ? "" : "s"}${result.missing ? `; ${result.missing} missing` : ""}.`);
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove("show"), 2200);
}

function formatLine(card, template = activeSale().template) {
  const formattedPrice = Number(card.price || 0).toFixed(2);
  const listedFlaws = /^none$/i.test(String(card.notes || "").trim()) ? "" : card.notes || "";
  const values = {
    ...card,
    brand: card.set || "",
    player: card.name || "",
    flaws: listedFlaws,
    grade: card.condition || "",
    claimPrice: formattedPrice,
    price: formattedPrice
  };
  let line = template.replace(/\{(ref|year|brand|player|number|flaws|grade|claimPrice|set|name|condition|price|notes)\}/g, (_match, key) => values[key] ?? "")
    .replace(/\(\s*\)/g, "").replace(/#\s*(?=\(|-|$)/g, "").replace(/\s+([,)])/g, "$1").replace(/([(])\s+/g, "$1").replace(/\s+/g, " ").replace(/ -\s*- /g, " - ").trim();
  const duplicate = duplicateInfo(card).label;
  if (duplicate) line = /\s-\s\$/.test(line) ? line.replace(/\s-\s\$/, ` ${duplicate} - $`) : `${line} ${duplicate}`;
  return line;
}

function render() {
  const sale = activeSale();
  $("#viewTitle").textContent = sale.name;
  $("#saleSelect").innerHTML = state.sales.map((item) => `<option value="${item.id}" ${item.id === sale.id ? "selected" : ""}>${escapeHtml(item.name)} (${item.cards.length} cards)</option>`).join("");
  renderCommandCenter();
  renderStats();
  renderListings();
  renderImages();
  renderClaims();
  renderOffers();
  renderOrders();
  renderPacking();
  renderDashboard();
  renderLiveSale();
  renderBuyerProfiles();
  renderHealthCheck();
  applyDisplayPreferences();
  renderCsmFileManager(false);
}

function renderCommandCenter() {
  const sale = activeSale();
  const pendingOffers = sale.cards.filter((card) => card.claimType === "offer" && ["pending", "countered"].includes(card.offerStatus || "pending"));
  const buyerNames = buyers();
  const unpaid = buyerNames.filter((buyer) => !["paid", "packed", "shipped"].includes(orderFor(buyer).status));
  const addressIssues = buyerNames.filter((buyer) => addressWarnings(buyer).length);
  const shippingNeeded = buyerNames.filter((buyer) => !orderFor(buyer).shippingMethod);
  const readyToPack = buyerNames.filter((buyer) => orderFor(buyer).status === "paid" && cardsForBuyer(buyer).some((card) => !card.packed));
  const readyToShip = buyerNames.filter((buyer) => cardsForBuyer(buyer).length && cardsForBuyer(buyer).every((card) => card.packed) && orderFor(buyer).status !== "shipped");
  const missingImages = sale.cards.filter((card) => card.status === "available" && !card.imagePath);
  $("#commandStats").innerHTML = [["Available", sale.cards.filter((card) => card.status === "available").length, "cards still open"], ["Pending offers", pendingOffers.length, "need a decision"], ["Unpaid orders", unpaid.length, "awaiting payment"], ["Ready to ship", readyToShip.length, "fully packed"]].map(([label, value, sub]) => `<article class="stat"><span class="label">${label}</span><strong>${value}</strong><span class="sub">${sub}</span></article>`).join("");
  const attention = [
    [pendingOffers.length, "Offers awaiting a decision", "Review offers", "offers"],
    [shippingNeeded.length, "Orders without shipping selected", "Choose shipping", "orders"],
    [addressIssues.length, "Buyer addresses need review", "Validate addresses", "buyers"],
    [unpaid.length, "Orders not marked paid", "Review payments", "orders"],
    [missingImages.length, "Available cards missing images", "Match images", "sale"]
  ].filter(([count]) => count);
  $("#commandAttention").innerHTML = attention.length ? attention.map(([count, title, action, view]) => `<button class="command-item warning" data-command-view="${view}"><span>${count}</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(action)}</small></div><b>›</b></button>`).join("") : `<div class="empty-state"><div class="empty-icon">✓</div><h3>Nothing urgent</h3><p>This sale has no outstanding warnings.</p></div>`;
  const ready = [
    [readyToPack.length, "Paid orders ready to pack", "packing"],
    [readyToShip.length, "Packed orders ready to ship", "packing"],
    [sale.cards.filter((card) => card.status === "available" && card.imagePath && !card.hiddenAfterCopy).length, "Listings ready to copy", "live"]
  ].filter(([count]) => count);
  $("#commandReady").innerHTML = ready.length ? ready.map(([count, title, view]) => `<button class="command-item ready" data-command-view="${view}"><span>${count}</span><div><strong>${escapeHtml(title)}</strong><small>Open workflow</small></div><b>›</b></button>`).join("") : `<div class="empty-state"><p>No items are ready for the next step yet.</p></div>`;
  const activity = (sale.audit || []).slice(0, 8);
  $("#commandActivity").innerHTML = activity.length ? activity.map((item) => `<div class="timeline-item"><strong>${escapeHtml(item.message)}</strong><p>${new Date(item.at).toLocaleString()}</p></div>`).join("") : `<div class="empty-state"><p>Sale activity will appear here.</p></div>`;
}

function renderStats() {
  const sale = activeSale();
  const sold = sale.cards.filter(cardInOrder);
  const paid = sold.filter((card) => orderFor(card.buyer).status === "paid" || orderFor(card.buyer).status === "packed" || orderFor(card.buyer).status === "shipped");
  const gross = sold.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const collected = paid.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const stats = [
    ["Cards listed", sale.cards.length, `${sale.cards.filter((c) => c.status === "available").length} open · ${sale.cards.filter((c) => c.status === "offered").length} with offers`],
    ["Claimed", sold.length, sale.cards.length ? `${Math.round((sold.length / sale.cards.length) * 100)}% sell-through` : "No cards yet"],
    ["Gross sales", money(gross), `${money(collected)} collected`],
    ["Active buyers", buyers().length, `${buyers().filter((b) => orderFor(b).status === "paid").length} ready to pack`]
  ];
  $("#saleStats").innerHTML = stats.map(([label, value, sub]) => `<article class="stat"><span class="label">${label}</span><strong>${value}</strong><span class="sub">${sub}</span></article>`).join("");
}

function sortedSaleCards(sale = activeSale(), cards = sale.cards) {
  return cards.slice().sort((a, b) => {
    if (sale.sortMode === "year") return String(a.year).localeCompare(String(b.year), undefined, { numeric: true }) || String(a.name).localeCompare(String(b.name));
    if (sale.sortMode === "player") return String(a.name).localeCompare(String(b.name)) || Number(a.sourceOrder ?? a.ref) - Number(b.sourceOrder ?? b.ref);
    if (sale.sortMode === "price-asc") return Number(a.price) - Number(b.price);
    if (sale.sortMode === "price-desc") return Number(b.price) - Number(a.price);
    if (sale.sortMode === "custom") return Number(a.customOrder ?? a.sourceOrder ?? a.ref) - Number(b.customOrder ?? b.sourceOrder ?? b.ref);
    return Number(a.sourceOrder ?? a.ref) - Number(b.sourceOrder ?? b.ref);
  });
}

function renderListings() {
  const sale = activeSale();
  sale.sortMode ||= "spreadsheet";
  $("#listingSort").value = sale.sortMode;
  const query = state.query.toLowerCase();
  const cards = sortedSaleCards(sale, sale.cards.filter((card) => {
    const hidden = Boolean(card.hiddenAfterCopy);
    const filterMatch = state.filter === "copied" ? hidden : !hidden && (state.filter === "all"
      || (state.filter === "available" && card.status === "available")
      || (state.filter === "claimed" && card.status !== "available")
      || (state.filter === "with-image" && Boolean(card.imagePath))
      || (state.filter === "missing-image" && !card.imagePath));
    return filterMatch && Object.values(card).join(" ").toLowerCase().includes(query);
  }));
  const validIds = new Set(sale.cards.map((card) => card.id));
  selectedListingIds = new Set([...selectedListingIds].filter((id) => validIds.has(id)));
  $("#listingRows").innerHTML = cards.map((card) => {
    const statusLabel = card.status === "available" ? "Available" : card.status === "offered" ? `Offer · ${card.buyer || "Pending"}` : card.buyer || "Claimed";
    return `<tr data-listing-row="${card.id}" draggable="${sale.sortMode === "custom"}">
      <td class="select-column"><input type="checkbox" data-select-listing="${card.id}" ${selectedListingIds.has(card.id) ? "checked" : ""} aria-label="Select ${escapeHtml(card.name)}" /></td>
      <td class="ref">${escapeHtml(card.ref)}</td>
      <td><div class="card-title">${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(numberLabel(card))} ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</div><div class="card-line">${escapeHtml(formatLine(card))}</div></td>
      <td>${escapeHtml(card.condition || "—")}</td>
      <td><strong class="money">${money(card.price)}</strong><small class="cost-note">Cost ${card.purchasePrice !== "" && card.purchasePrice != null ? money(card.purchasePrice) : "—"}</small><small class="cost-note">Purchased ${displayPurchaseDate(card.purchaseDate)}</small></td>
      <td><span class="status ${card.status === "available" ? "available" : card.status === "offered" ? "offered" : "claimed"}">${escapeHtml(statusLabel)}</span></td>
      <td><div class="row-actions">${card.hiddenAfterCopy ? `<button class="row-action" data-restore-card="${card.id}">Restore</button>` : `<button class="row-action" data-image-card="${card.id}">${card.imagePath ? "Change image" : "Add image"}</button><button class="row-action" data-rematch-card="${card.id}">Re-run lookup</button><button class="row-action" data-copy-card="${card.id}">Copy</button>`}<button class="row-action" data-edit-card="${card.id}">Edit</button><button class="row-action" data-move-card="${card.id}">Move</button><button class="row-action danger-link" data-delete-card="${card.id}">Delete</button></div></td>
    </tr>`;
  }).join("");
  $("#listingEmpty").classList.toggle("hidden", sale.cards.length !== 0);
  updateListingBulkControls(cards);
}

function resetListingView() {
  state.filter = "all";
  state.query = "";
  selectedListingIds.clear();
  const search = $("#cardSearch");
  if (search) search.value = "";
  $$('[data-filter]').forEach((button) => button.classList.toggle("active", button.dataset.filter === "all"));
}

function updateListingBulkControls(visibleCards = []) {
  const visibleIds = visibleCards.map((card) => card.id);
  const checked = visibleIds.filter((id) => selectedListingIds.has(id)).length;
  $("#listingSelectionCount").textContent = `${selectedListingIds.size} selected`;
  $("#deleteSelectedCardsBtn").disabled = selectedListingIds.size === 0;
  $("#bulkEditBtn").disabled = selectedListingIds.size === 0;
  $("#selectAllListings").checked = visibleIds.length > 0 && checked === visibleIds.length;
  $("#selectAllListings").indeterminate = checked > 0 && checked < visibleIds.length;
}

function orderedSaleImages(sale = activeSale()) {
  const imageByPath = new Map(sale.images.map((image) => [image.path.toLowerCase(), image]));
  const tiedPaths = new Set();
  const orderedImages = [];
  sortedSaleCards(sale).forEach((card) => {
    if (!card.imagePath) return;
    const key = card.imagePath.toLowerCase();
    const image = imageByPath.get(key);
    if (image && !tiedPaths.has(key)) { orderedImages.push(image); tiedPaths.add(key); }
  });
  sale.images.forEach((image) => { if (!tiedPaths.has(image.path.toLowerCase())) orderedImages.push(image); });
  return orderedImages;
}

function renderImages() {
  const sale = activeSale();
  const orderedImages = orderedSaleImages(sale);
  const visibleImages = orderedImages.filter((image) => !image.hiddenAfterDrag);
  $("#imageCount").textContent = visibleImages.length;
  const settings = lookupSettings();
  const folderCount = [settings.primaryFolder, ...settings.additionalFolders].filter(Boolean).length;
  const exclusionCount = settings.excludedFolders.length;
  $("#lookupFolderLabel").textContent = folderCount ? `${folderCount} search folder${folderCount === 1 ? "" : "s"}${exclusionCount ? ` · ${exclusionCount} excluded` : ""}` : "No lookup folder selected";
  $("#imageQueue").innerHTML = visibleImages.length ? visibleImages.map((image, index) => `<article class="image-card" draggable="true" data-image-id="${image.id}" data-image-path="${escapeHtml(image.path)}">
    <img src="${fileUrl(image.path)}" alt="${escapeHtml(image.name)}" />
    <div><strong>${escapeHtml(image.name)}</strong><span>Post image ${index + 1}</span><span class="drag-hint">Drag to Facebook ↗</span></div>
  </article>`).join("") : `<div class="empty-state"><div class="empty-icon">▧</div><h3>No sale images yet</h3><p>Add individual images or an entire folder.</p></div>`;
}

function renderClaims() {
  const sale = activeSale();
  const legacyClaims = sale.cards.filter((card) => card.claimedAt).map((card) => ({ id: `legacy-${card.id}`, at: card.claimedAt, type: card.claimType || "claim", message: `${card.claimType === "offer" ? "Offer" : "Claim"} recorded for ${card.ref} · ${card.name}`, cardId: card.id, buyer: card.buyer }));
  const claims = (sale.audit?.length ? sale.audit : legacyClaims).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
  $("#buyerNames").innerHTML = allBuyerNames().flatMap((buyer) => [buyer, ...buyerProfile(buyer).aliases]).map((buyer) => `<option value="${escapeHtml(buyer)}"></option>`).join("");
  const query = String(state.claimQuery || "").toLowerCase();
  const cards = sale.cards.filter((card) => Object.values(card).join(" ").toLowerCase().includes(query));
  $("#claimRows").innerHTML = cards.map((card) => {
    const effectivePrice = Number(card.offerPrice ?? card.claimPrice ?? card.price);
    const belowCost = Number(card.purchasePrice) > 0 && effectivePrice < Number(card.purchasePrice);
    const claimType = card.claimType || (card.offerPrice != null ? "offer" : "claim");
    return `<tr data-claim-row="${card.id}"><td class="ref">${escapeHtml(card.ref)}</td><td><div class="card-title">${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(numberLabel(card))} ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</div><div class="card-line">${escapeHtml(card.condition || "No grade")}${card.notes && !/^none$/i.test(card.notes) ? ` · ${escapeHtml(card.notes)}` : ""}</div></td><td><strong class="money">${money(card.price)}</strong><small class="cost-note">Cost ${card.purchasePrice !== "" && card.purchasePrice != null ? money(card.purchasePrice) : "—"}</small><small class="cost-note">Purchased ${displayPurchaseDate(card.purchaseDate)}</small></td><td><input type="checkbox" data-claim-type="claim" ${claimType === "claim" ? "checked" : ""} aria-label="Claim" /></td><td><input type="checkbox" data-claim-type="offer" ${claimType === "offer" ? "checked" : ""} aria-label="Offer" /></td><td><input class="offer-input ${belowCost ? "below-cost" : ""}" data-claim-offer type="number" min="0" step="0.01" value="${card.offerPrice ?? ""}" placeholder="${Number(card.price || 0).toFixed(2)}" ${claimType === "claim" ? "disabled" : ""} />${belowCost ? `<small class="cost-warning">Below cost</small>` : ""}</td><td><input class="buyer-assignment" data-claim-buyer value="${escapeHtml(card.buyer || "")}" list="buyerNames" placeholder="Buyer name" /><input class="claim-note-input" data-claim-note value="${escapeHtml(card.claimNote || "")}" placeholder="Claim note" /></td><td><div class="row-actions"><button class="row-action" data-assign-card="${card.id}">${card.buyer ? "Save / move" : "Assign"}</button>${card.buyer ? `<button class="row-action danger-link" data-clear-claim="${card.id}">Clear</button>` : ""}</div></td></tr>`;
  }).join("");
  $("#claimTimeline").innerHTML = claims.length ? claims.map((item) => `<button type="button" class="timeline-item timeline-link" ${item.cardId ? `data-timeline-card="${item.cardId}"` : ""}><strong>${escapeHtml(item.message)}</strong><p>${escapeHtml(item.buyer || item.type || "Activity")} · ${new Date(item.at).toLocaleString()}</p></button>`).join("") : `<div class="empty-state"><h3>No activity recorded</h3><p>Claims, offers and changes will appear here.</p></div>`;
}

function offerDecisionPrice(card) {
  return Number(card.counterPrice != null ? card.counterPrice : card.offerPrice);
}

function renderOffers() {
  const allOffers = activeSale().cards.filter((card) => card.claimType === "offer" && card.offerPrice != null && card.buyer);
  const settings = offerDeskSettings();
  const buyerNames = [...new Set(allOffers.map((card) => card.buyer))].sort((a, b) => a.localeCompare(b));
  if (settings.buyer !== "all" && !buyerNames.includes(settings.buyer)) settings.buyer = "all";
  const buyerFilter = $("#offerBuyerFilter");
  buyerFilter.innerHTML = `<option value="all">All buyers</option>${buyerNames.map((buyer) => `<option value="${escapeHtml(buyer)}" ${settings.buyer === buyer ? "selected" : ""}>${escapeHtml(buyer)}</option>`).join("")}`;
  $("#offerSearch").value = settings.query;
  $("#offerStatusFilter").value = settings.status;
  $("#offerMarginFilter").value = settings.margin;
  const query = settings.query.trim().toLowerCase();
  const statusFor = (card) => card.offerStatus || (card.status === "claimed" ? "accepted" : "pending");
  const offers = allOffers.filter((card) => {
    const status = statusFor(card);
    const price = offerDecisionPrice(card);
    const cost = Number(card.purchasePrice);
    const searchText = [card.ref, card.year, card.set, card.number, card.name, card.buyer].join(" ").toLowerCase();
    if (query && !searchText.includes(query)) return false;
    if (settings.status !== "all" && status !== settings.status) return false;
    if (settings.buyer !== "all" && card.buyer !== settings.buyer) return false;
    if (settings.margin === "below-cost" && !(cost > 0 && price < cost)) return false;
    if (settings.margin === "above-cost" && !(cost > 0 && price >= cost)) return false;
    if (settings.margin === "no-cost" && cost > 0) return false;
    return true;
  }).sort((a, b) => {
    const values = {
      card: (card) => `${card.year} ${card.set} ${card.name} ${card.number}`,
      buyer: (card) => card.buyer,
      listed: (card) => Number(card.price || 0),
      offer: (card) => offerDecisionPrice(card),
      cost: (card) => Number(card.purchasePrice || 0),
      status: (card) => ({ pending: 0, countered: 1, accepted: 2 })[statusFor(card)] ?? 9
    };
    const getter = values[settings.sortKey] || values.card;
    const left = getter(a); const right = getter(b);
    const result = typeof left === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true });
    return (settings.sortDirection === "desc" ? -result : result) || Number(a.sourceOrder || 0) - Number(b.sourceOrder || 0);
  });
  const pending = allOffers.filter((card) => statusFor(card) !== "accepted");
  $("#pendingOfferCount").textContent = `${pending.length} pending`;
  $("#offerShownCount").textContent = `${offers.length} of ${allOffers.length} shown`;
  $$('[data-offer-sort]').forEach((button) => { button.querySelector("span").textContent = settings.sortKey === button.dataset.offerSort ? (settings.sortDirection === "asc" ? "▲" : "▼") : ""; });
  $("#offersEmpty").classList.toggle("hidden", offers.length !== 0);
  $("#offerRows").innerHTML = offers.map((card) => {
    const status = card.offerStatus || (card.status === "claimed" ? "accepted" : "pending");
    const accepted = status === "accepted";
    const proposedPrice = offerDecisionPrice(card);
    const belowCost = Number(card.purchasePrice) > 0 && proposedPrice < Number(card.purchasePrice);
    const statusLabel = accepted ? `Accepted at ${money(card.claimPrice ?? proposedPrice)}` : status === "countered" ? `Countered at ${money(card.counterPrice)}` : "Awaiting decision";
    return `<tr data-offer-row="${card.id}"><td><div class="offer-card-cell">${card.imagePath ? `<img src="${fileUrl(card.imagePath)}" alt="" />` : `<span class="offer-card-placeholder">${escapeHtml(card.ref)}</span>`}<div><strong>${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(numberLabel(card))} ${escapeHtml(card.name)}</strong><small>${escapeHtml(card.condition || "No grade")}${card.notes && !/^none$/i.test(card.notes) ? ` · ${escapeHtml(card.notes)}` : ""}</small></div></div></td><td><strong>${escapeHtml(card.buyer)}</strong></td><td class="money">${money(card.price)}</td><td><strong class="money">${money(card.offerPrice)}</strong>${card.counterPrice != null ? `<small class="offer-note">Your counter: ${money(card.counterPrice)}</small>` : ""}</td><td><strong class="money">${card.purchasePrice !== "" && card.purchasePrice != null ? money(card.purchasePrice) : "—"}</strong>${belowCost ? `<small class="cost-warning">Decision price is below cost</small>` : ""}</td><td><span class="status ${accepted ? "accepted" : status === "countered" ? "countered" : "pending"}">${escapeHtml(statusLabel)}</span></td><td>${accepted ? `<span class="accepted-note">Added to ${escapeHtml(card.buyer)}’s order</span>` : `<div class="offer-actions"><button class="primary" data-accept-offer="${card.id}">Accept ${money(proposedPrice)}</button><button class="secondary" data-counter-offer="${card.id}">${status === "countered" ? "Revise counter" : "Counter"}</button><button class="secondary danger-button" data-reject-offer="${card.id}">Reject</button></div>`}</td></tr>`;
  }).join("");
}

function renderOrders() {
  const allNames = buyers();
  const settings = orderDeskSettings();
  $("#orderSearch").value = settings.query;
  $("#orderStatusFilter").value = settings.status;
  const query = settings.query.trim().toLowerCase();
  const names = allNames.filter((buyer) => {
    const order = orderFor(buyer); const flags = orderFlags(buyer);
    if (query && !buyer.toLowerCase().includes(query)) return false;
    if (settings.status === "attention" && !flags.length) return false;
    if (settings.status === "unpaid" && ["paid", "packed", "shipped"].includes(order.status)) return false;
    if (["paid", "packed", "shipped"].includes(settings.status) && order.status !== settings.status) return false;
    if (settings.status === "missing-address" && buyerProfile(buyer).address?.trim()) return false;
    return true;
  });
  if (!allNames.includes(state.selectedBuyer)) state.selectedBuyer = allNames[0] || "";
  $("#buyerCount").textContent = names.length === allNames.length ? `${allNames.length} active order${allNames.length === 1 ? "" : "s"}` : `${names.length} of ${allNames.length} orders shown`;
  $("#buyerList").innerHTML = names.length ? names.map((buyer) => {
    const cards = cardsForBuyer(buyer);
    const total = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price), 0);
    const order = orderFor(buyer);
    const flags = orderFlags(buyer);
    const visualStatus = ["paid", "packed", "shipped"].includes(order.status) ? order.status : "unpaid";
    return `<button class="buyer-button order-${visualStatus} ${flags.length ? "has-warning" : ""} ${buyer === state.selectedBuyer ? "active" : ""}" data-buyer="${escapeHtml(buyer)}"><strong>${escapeHtml(buyer)}</strong><span class="buyer-total">${money(total + shippingAmount(order) - Number(order.discount))}</span><small>${cards.length} cards · ${escapeHtml(order.shippingMethod || "Shipping needed")} · ${escapeHtml(order.status)}${flags.length ? ` · ⚑ ${flags.length}` : ""}</small><span class="order-state-badge">${escapeHtml(flags.length ? "Needs attention" : visualStatus)}</span></button>`;
  }).join("") : `<div class="empty-state"><p>${allNames.length ? "No orders match these filters." : "Orders appear as soon as you record a claim."}</p></div>`;
  renderOrderDetail();
}

function orderFlags(buyer) {
  const cards = cardsForBuyer(buyer);
  const order = orderFor(buyer);
  const profile = buyerProfile(buyer);
  const flags = [];
  addressWarnings(buyer, profile.address).forEach((warning) => flags.push(warning));
  if (!order.shippingMethod) flags.push("Shipping not selected");
  if (!["paid", "packed", "shipped"].includes(order.status)) flags.push("Unpaid balance");
  if (["paid", "packed", "shipped"].includes(order.status) && cards.some((card) => !card.packed)) flags.push("Packing incomplete");
  if (!pweEligible(buyer) && order.shippingMethod === "PWE") flags.push("PWE limit exceeded");
  return flags;
}

function buyerHistory(buyer) {
  const cards = state.sales.flatMap((sale) => sale.cards).filter((card) => card.buyer === buyer && cardInOrder(card));
  const countBy = (field) => cards.reduce((result, card) => { const value = String(card[field] || "").trim(); if (value) result[value] = (result[value] || 0) + 1; return result; }, {});
  const top = (record) => Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  return { cards, spent: cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0), player: top(countBy("name")), brand: top(countBy("set")), year: top(countBy("year")) };
}

function repeatBuyerMatches(buyer) {
  const history = buyerHistory(buyer);
  if (history.cards.length < 2) return [];
  return activeSale().cards.filter((card) => card.status === "available" && (card.name === history.player || card.set === history.brand || card.year === history.year)).slice(0, 5);
}

function renderOrderDetail() {
  const buyer = state.selectedBuyer;
  if (!buyer) {
    $("#orderDetail").innerHTML = `<div class="empty-state"><div class="empty-icon">◎</div><h3>No buyer selected</h3><p>Record a claim to create the first order.</p></div>`;
    return;
  }
  const cards = cardsForBuyer(buyer);
  const order = orderFor(buyer);
  const subtotal = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price), 0);
  const shipping = shippingAmount(order);
  const total = subtotal + shipping - Number(order.discount || 0);
  const profile = buyerProfile(buyer);
  const flags = orderFlags(buyer);
  const repeatMatches = repeatBuyerMatches(buyer);
  $("#orderDetail").innerHTML = `<div class="panel-header"><div><h2>${escapeHtml(buyer)}</h2><p>${cards.length} claimed card${cards.length === 1 ? "" : "s"}</p></div><span class="status ${order.status === "paid" ? "paid" : "claimed"}">${escapeHtml(order.status)}</span></div>
    <div class="order-summary">
      <div class="order-items">${cards.map((card) => `<article class="order-item">${card.imagePath ? `<div class="order-thumb"><img src="${fileUrl(card.imagePath)}" alt="" /><small title="${escapeHtml(card.imagePath)}">${escapeHtml(card.imagePath.split(/[\\/]/).pop())}</small></div>` : `<div class="thumb">${escapeHtml(card.ref)}</div>`}<div><strong>${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</strong><div class="card-line">${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(numberLabel(card))} · ${escapeHtml(card.condition)}</div><span class="type-badge ${card.claimType === "offer" ? "offer" : "claim"}">${card.claimType === "offer" ? "Offer" : "Claim"}</span>${card.claimType === "offer" ? `<small class="offer-note">Accepted offer · listed ${money(card.price)}${Number(card.purchasePrice) > 0 && Number(card.claimPrice) < Number(card.purchasePrice) ? ` · <span class="cost-warning">below ${money(card.purchasePrice)} cost</span>` : ""}</small>` : ""}</div><strong>${money(card.claimPrice ?? card.price)}</strong></article>`).join("")}</div>
      <aside class="order-sidebar">
        <div class="totals">
          <div class="total-line"><span>Cards (${cards.length})</span><strong>${money(subtotal)}</strong></div>
          <label>Shipping option<select id="orderShippingMethod"><option value="" ${order.shippingMethod ? "" : "selected"} disabled>Select PWE or PMWT…</option><option value="PMWT" ${order.shippingMethod === "PMWT" ? "selected" : ""}>PMWT — ${money(activeSale().pmwtShipping)}${pweEligible(buyer) ? "" : " (auto-selected by rule)"}</option><option value="PWE" ${order.shippingMethod === "PWE" ? "selected" : ""}>PWE — ${money(activeSale().pweShipping)}${pweEligible(buyer) ? "" : " (manual override)"}</option></select></label>
          <div class="total-line shipping-total"><span>${escapeHtml(order.shippingMethod || "Shipping not selected")}</span><strong>${order.shippingMethod ? money(shipping) : "—"}</strong></div>
          <label>Discount<input id="orderDiscount" type="number" min="0" step="0.01" value="${Number(order.discount || 0)}" /></label>
          <div class="total-line grand"><span>Total</span><span>${money(total)}</span></div>
        </div>
        ${flags.length ? `<div class="order-flags">${flags.map((flag) => `<span>⚑ ${escapeHtml(flag)}</span>`).join("")}</div>` : ""}
        <div class="slip-status"><strong>Packing slip</strong><span>${order.packingSlipPrintCount ? `Printed ${order.packingSlipPrintCount}× · ${new Date(order.packingSlipPrintedAt).toLocaleString()}` : "Not printed"}</span></div>
        ${repeatMatches.length ? `<div class="repeat-alert"><strong>Repeat-buyer alert</strong><span>${repeatMatches.length} available card${repeatMatches.length === 1 ? "" : "s"} match this buyer’s history.</span><button class="row-action" data-open-buyer-profile="${escapeHtml(buyer)}">View profile</button></div>` : ""}
        <label>Payment method<select id="orderPaymentMethod"><option value="">Not recorded</option>${["Cash", "PayPal", "Venmo", "Other"].map((method) => `<option ${order.paymentMethod === method ? "selected" : ""}>${method}</option>`).join("")}</select></label>
        <label>Mailing address<textarea id="buyerAddress" data-original-address="${escapeHtml(profile.address || "")}" rows="3">${escapeHtml(profile.address || "")}</textarea></label>
        <label>Buyer notes<textarea id="buyerNotes" rows="3">${escapeHtml(profile.notes || "")}</textarea></label>
        ${order.trackingNumber ? `<button class="secondary full" data-open-tracking="${escapeHtml(trackingUrl(order.trackingNumber))}">Track package ↗</button>` : ""}
        <div class="status-actions">
          <button class="secondary" data-order-status="shopping">Still shopping</button>
          <button class="secondary" data-order-status="awaiting">Awaiting payment</button>
          <button class="primary" data-order-status="paid">Mark paid</button>
        </div>
        <button class="secondary full copy-summary" id="copySummaryBtn">Copy buyer summary</button>
        <div class="message-grid"><button class="secondary" data-copy-message="payment-due">Payment due</button><button class="secondary" data-copy-message="payment-received">Payment received</button><button class="secondary" data-copy-message="shipped">Shipped</button><button class="secondary" data-copy-message="delayed">Delayed</button></div>
        <button class="row-action message-template-link" id="editMessageTemplatesBtn">Edit message templates</button>
      </aside>
    </div>`;
}

function renderPacking() {
  const names = buyers();
  const select = $("#packingBuyer");
  const current = select.value || names[0] || "";
  select.innerHTML = names.map((buyer) => `<option value="${escapeHtml(buyer)}" ${buyer === current ? "selected" : ""}>${escapeHtml(buyer)}${orderFor(buyer).status === "packed" ? " (Packed)" : ""}</option>`).join("");
  const buyer = select.value || names[0];
  if (!buyer) {
    $("#packingWarnings").innerHTML = "";
    $("#packingContent").innerHTML = `<div class="panel empty-state"><h3>No orders to pack</h3><p>Paid and unpaid orders will appear here.</p></div>`;
    return;
  }
  const cards = cardsForBuyer(buyer);
  const packed = cards.filter((card) => card.packed).length;
  const percent = cards.length ? Math.round((packed / cards.length) * 100) : 0;
  const order = orderFor(buyer);
  const profile = buyerProfile(buyer);
  const subtotal = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const total = subtotal + shippingAmount(order) - Number(order.discount || 0);
  const warnings = [!profile.address && "Missing address", !order.shippingMethod && "Shipping not selected", !["paid", "packed", "shipped"].includes(order.status) && "Unpaid balance", ["paid", "packed", "shipped"].includes(order.status) && !order.paymentMethod && "Payment method missing", cards.some((card) => !card.packed) && "Packing incomplete"].filter(Boolean);
  $("#packingWarnings").innerHTML = warnings.length ? warnings.map((warning) => `<span>${escapeHtml(warning)}</span>`).join("") : `<span class="valid-text">Order ready</span>`;
  const firstImage = cards.find((card) => card.imagePath)?.imagePath;
  const printed = Number(order.packingSlipPrintCount || 0);
  $("#packingContent").innerHTML = `<section class="packing-card"><div class="packing-progress"><div><h2>${escapeHtml(buyer)}</h2><p>${packed} of ${cards.length} cards verified · ${escapeHtml(order.shippingMethod)}${profile.address ? "" : " · Missing address"}${printed ? ` · Slip printed ${printed}×` : ""}</p><div class="progress-track"><div class="progress-bar" style="width:${percent}%"></div></div></div><div class="packing-actions"><button class="secondary" id="previewPackingSlipBtn">Preview PDF</button><button class="secondary" id="printPackingSlipBtn">${printed ? "Reprint" : "Print"} packing slip</button><button class="secondary" id="checkAllCardsBtn">${packed === cards.length ? "Uncheck all" : "Check all cards"}</button><button class="primary" id="completePackingBtn" ${packed !== cards.length ? "disabled" : ""}>Complete package</button></div></div><div class="packing-order-summary">${firstImage ? `<img src="${fileUrl(firstImage)}" alt="First card in order" />` : `<div class="placeholder-thumb">No image</div>`}<div><strong>${escapeHtml(activeSale().name)}</strong><p>${escapeHtml(profile.address || "Address not entered").replace(/\n/g, "<br>")}</p><div class="packing-order-stats"><span><strong>${cards.length}</strong><br>cards</span><span><strong>${money(total)}</strong><br>order total</span><span><strong>${escapeHtml(order.status || "awaiting")}</strong><br>status</span></div></div></div><div class="pack-list">${cards.map((card) => `<label class="pack-item ${card.packed ? "checked" : ""}" data-pack-row="${card.id}"><input type="checkbox" data-pack-card="${card.id}" ${card.packed ? "checked" : ""} /><span><strong>${escapeHtml(card.ref)} · ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</strong><small>${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(numberLabel(card))} · ${escapeHtml(card.condition)} · ${card.claimType === "offer" ? "Offer" : "Claim"}</small></span><strong>${money(card.claimPrice ?? card.price)}</strong></label>`).join("")}</div><div class="packing-notes"><label>Internal packing notes<textarea id="packingInternalNotes" placeholder="Private notes — never printed">${escapeHtml(order.packingNotes || "")}</textarea></label><label>Buyer-facing slip note<textarea id="packingBuyerNote" placeholder="Optional note printed on this buyer’s slip">${escapeHtml(order.packingSlipNote || "")}</textarea></label></div><div class="tracking-panel"><label>Tracking number<input id="trackingNumber" value="${escapeHtml(order.trackingNumber || "")}" placeholder="Enter USPS or carrier tracking number" /></label><div class="tracking-actions"><button class="secondary" id="copyTrackingMessageBtn" ${order.trackingNumber ? "" : "disabled"}>Copy shipping message</button><button class="secondary" id="openTrackingBtn" data-open-tracking="${escapeHtml(trackingUrl(order.trackingNumber))}" ${order.trackingNumber ? "" : "disabled"}>Track package ↗</button></div></div></section>`;
  const legacyProgress = $(".packing-card .progress-track");
  if (legacyProgress) {
    const meter = document.createElement("progress");
    meter.className = "packing-progress-meter";
    meter.max = 100;
    meter.value = percent;
    meter.textContent = `${percent}%`;
    legacyProgress.replaceWith(meter);
  }
}

function renderDashboard() {
  const sale = activeSale();
  const sold = sale.cards.filter(cardInOrder);
  const revenue = sold.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const soldCost = sold.reduce((sum, card) => sum + Number(card.purchasePrice || 0), 0);
  const inventoryCost = sale.cards.reduce((sum, card) => sum + Number(card.purchasePrice || 0), 0);
  const profit = revenue - soldCost;
  const margin = revenue ? (profit / revenue) * 100 : 0;
  $("#profitStats").innerHTML = [["Revenue", money(revenue), `${sold.length} sold`], ["Sold-card cost", money(soldCost), `${money(inventoryCost)} total inventory cost`], ["Gross profit", money(profit), `${margin.toFixed(1)}% margin`], ["Average sale", money(sold.length ? revenue / sold.length : 0), `${sale.cards.length - sold.length} unsold`]].map(([label, value, sub]) => `<article class="stat"><span class="label">${label}</span><strong>${value}</strong><span class="sub">${sub}</span></article>`).join("");
  state.preferences ||= {};
  state.preferences.profitSort ||= { key: "revenue", direction: "desc" };
  const profitSort = state.preferences.profitSort;
  const profitValue = (card, key) => {
    if (key === "card") return `${card.year || ""} ${card.set || ""} ${card.name || ""}`.trim().toLowerCase();
    if (key === "buyer") return String(card.buyer || "").toLowerCase();
    if (key === "cost") return Number(card.purchasePrice || 0);
    if (key === "profit") return Number(card.claimPrice ?? card.price ?? 0) - Number(card.purchasePrice || 0);
    return Number(card.claimPrice ?? card.price ?? 0);
  };
  const rows = sold.slice().sort((a, b) => {
    const left = profitValue(a, profitSort.key); const right = profitValue(b, profitSort.key);
    const result = typeof left === "string" ? left.localeCompare(right, undefined, { numeric: true }) : left - right;
    return (profitSort.direction === "asc" ? result : -result) || Number(a.sourceOrder ?? a.ref) - Number(b.sourceOrder ?? b.ref);
  });
  const profitHeading = (key, label) => {
    const active = profitSort.key === key;
    const arrow = active ? (profitSort.direction === "asc" ? "↑" : "↓") : "↕";
    return `<th aria-sort="${active ? (profitSort.direction === "asc" ? "ascending" : "descending") : "none"}"><button class="table-sort" data-profit-sort="${key}">${label}<span>${arrow}</span></button></th>`;
  };
  $("#profitBreakdown").innerHTML = rows.length ? `<table><thead><tr>${profitHeading("card", "Card")}${profitHeading("buyer", "Buyer")}${profitHeading("revenue", "Revenue")}${profitHeading("cost", "Cost")}${profitHeading("profit", "Profit")}</tr></thead><tbody>${rows.map((card) => `<tr><td>${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(card.name)}</td><td>${escapeHtml(card.buyer)}</td><td>${money(card.claimPrice ?? card.price)}</td><td>${money(card.purchasePrice)}</td><td class="${Number(card.claimPrice ?? card.price) < Number(card.purchasePrice) ? "cost-warning" : ""}">${money(Number(card.claimPrice ?? card.price) - Number(card.purchasePrice || 0))}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state"><h3>No completed claims yet</h3><p>Profit details will appear as cards are claimed.</p></div>`;
  const history = {};
  state.sales.forEach((pastSale) => pastSale.cards.filter(cardInOrder).forEach((card) => {
    const item = history[card.buyer] ||= { cards: 0, players: {}, brands: {}, years: {} };
    item.cards += 1;
    item.players[card.name] = (item.players[card.name] || 0) + 1;
    item.brands[card.set] = (item.brands[card.set] || 0) + 1;
    item.years[card.year] = (item.years[card.year] || 0) + 1;
  }));
  const favorite = (record) => Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  $("#buyerInsights").innerHTML = Object.keys(history).length ? `<div class="insight-list">${Object.entries(history).sort((a, b) => b[1].cards - a[1].cards).map(([buyer, item]) => `<article><strong>${escapeHtml(buyer)}</strong><span>${item.cards} cards</span><small>Player: ${escapeHtml(favorite(item.players))}<br>Brand: ${escapeHtml(favorite(item.brands))}<br>Year: ${escapeHtml(favorite(item.years))}</small></article>`).join("")}</div>` : `<div class="empty-state"><h3>No buyer history yet</h3><p>Patterns will appear across completed sales.</p></div>`;
  const available = sale.cards.filter((card) => card.status === "available");
  const ageBuckets = [["0–30 days", 0, 30], ["31–90 days", 31, 90], ["91–180 days", 91, 180], ["181–365 days", 181, 365], ["Over one year", 366, Infinity]];
  const unknown = available.filter((card) => inventoryAgeDays(card) == null);
  $("#inventoryAging").innerHTML = `<div class="aging-grid">${ageBuckets.map(([label, min, max]) => { const cards = available.filter((card) => { const days = inventoryAgeDays(card); return days != null && days >= min && days <= max; }); const cost = cards.reduce((sum, card) => sum + Number(card.purchasePrice || 0), 0); return `<article><strong>${label}</strong><span>${cards.length} card${cards.length === 1 ? "" : "s"}</span><small>${money(cost)} tied up</small></article>`; }).join("")}${unknown.length ? `<article class="unknown-age"><strong>Purchase date missing</strong><span>${unknown.length} cards</span><small>Add dates to complete aging</small></article>` : ""}</div>`;
}

function renderBuyerProfiles() {
  const names = allBuyerNames();
  const filtered = names.filter((name) => `${name} ${buyerProfile(name).aliases.join(" ")} ${buyerProfile(name).tags.join(" ")}`.toLowerCase().includes(profileQuery.toLowerCase()));
  if (!filtered.includes(state.profileBuyer)) state.profileBuyer = filtered[0] || names[0] || "";
  $("#buyerProfileList").innerHTML = filtered.length ? filtered.map((name) => { const history = buyerHistory(name); const profile = buyerProfile(name); const warnings = addressWarnings(name); return `<button class="buyer-button ${warnings.length ? "has-warning" : ""} ${name === state.profileBuyer ? "active" : ""}" data-profile-buyer="${escapeHtml(name)}"><strong>${escapeHtml(name)}</strong><span class="buyer-total">${money(history.spent)}</span><small>${history.cards.length} purchases${profile.tags.length ? ` · ${escapeHtml(profile.tags.join(", "))}` : ""}</small>${warnings.length ? `<span class="order-state-badge">Address review</span>` : ""}</button>`; }).join("") : `<div class="empty-state"><p>No matching buyers.</p></div>`;
  const buyer = state.profileBuyer;
  if (!buyer) { $("#buyerProfileDetail").innerHTML = `<div class="empty-state"><h3>No buyer history yet</h3><p>Profiles are created when a card is assigned.</p></div>`; return; }
  const history = buyerHistory(buyer); const profile = buyerProfile(buyer); const matches = repeatBuyerMatches(buyer); const warnings = addressWarnings(buyer);
  $("#buyerProfileDetail").innerHTML = `<div class="panel-header"><div><h2>${escapeHtml(buyer)}</h2><p>${history.cards.length} lifetime cards · ${money(history.spent)} spent</p></div><span class="status ${warnings.length ? "offered" : "available"}">${warnings.length ? `${warnings.length} address warning${warnings.length === 1 ? "" : "s"}` : "Address ready"}</span></div><div class="profile-content"><div class="profile-stats"><article><span>Favorite player</span><strong>${escapeHtml(history.player || "—")}</strong></article><article><span>Favorite brand</span><strong>${escapeHtml(history.brand || "—")}</strong></article><article><span>Favorite year</span><strong>${escapeHtml(history.year || "—")}</strong></article></div>${warnings.length ? `<div class="address-warnings">${warnings.map((warning) => `<span>⚑ ${escapeHtml(warning)}</span>`).join("")}</div>` : ""}<label>Facebook names / aliases<input id="profileAliases" value="${escapeHtml(profile.aliases.join(", "))}" placeholder="Alex Smith, Alex S." /><small>Claims under these names will be assigned to this buyer.</small></label><label>Buyer tags<input id="profileTags" value="${escapeHtml(profile.tags.join(", "))}" placeholder="Vintage, Yankees, set builder" /></label><label>Mailing address<textarea id="profileAddress" rows="4">${escapeHtml(profile.address || "")}</textarea></label><label>Notes<textarea id="profileNotes" rows="4">${escapeHtml(profile.notes || "")}</textarea></label><div class="profile-save-actions"><button id="saveBuyerProfileBtn" class="primary">Save and validate profile</button><button id="deleteBuyerProfileBtn" type="button" class="secondary danger-button">Delete buyer profile</button></div>${profile.previousAddresses.length ? `<details class="address-history"><summary>Previous addresses (${profile.previousAddresses.length})</summary>${profile.previousAddresses.slice().reverse().map((item) => `<div><span>${escapeHtml(item.address).replace(/\n/g, "<br>")}</span><small>${new Date(item.changedAt).toLocaleDateString()}</small></div>`).join("")}</details>` : ""}${matches.length ? `<section class="profile-alert"><h3>Available cards this buyer may like</h3>${matches.map((card) => `<button data-profile-card="${card.id}"><strong>${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(card.name)}</strong><span>${money(card.price)}</span></button>`).join("")}</section>` : ""}<section><h3>Purchase history</h3><div class="profile-history">${history.cards.slice().reverse().map((card) => `<article><span>${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(card.name)}</span><strong>${money(card.claimPrice ?? card.price)}</strong></article>`).join("") || "No purchases recorded."}</div></section></div>`;
}

function deleteBuyerProfile(name) {
  const references = [];
  state.sales.forEach((sale) => {
    const cards = sale.cards.filter((card) => card.buyer === name);
    if (cards.length) references.push(`${cards.length} card${cards.length === 1 ? "" : "s"} in ${sale.name}`);
    if (sale.orders?.[name]) references.push(`an order in ${sale.name}`);
  });
  if (references.length) return toast(`Move or remove this buyer’s ${references[0]} before deleting the profile.`);
  if (!window.confirm(`Delete the buyer profile for ${name}? Saved aliases, address, tags and notes will be removed.`)) return;
  delete state.buyerProfiles[name];
  state.profileBuyer = "";
  saveSoon();
  renderBuyerProfiles();
  toast("Buyer profile deleted.");
}

function healthIssues() {
  const sale = activeSale(); const issues = [];
  sale.cards.forEach((card) => {
    const label = `${card.ref} · ${card.name || "Unnamed card"}`;
    if (!card.year || !card.set || !card.name) issues.push({ level: "error", area: "Card data", message: `${label} is missing year, brand or player.`, cardId: card.id });
    if (!Number.isFinite(Number(card.price)) || Number(card.price) <= 0) issues.push({ level: "error", area: "Pricing", message: `${label} has no valid claim price.`, cardId: card.id });
    if (!card.imagePath) issues.push({ level: "warning", area: "Images", message: `${label} has no matched image.`, cardId: card.id });
    if (card.status !== "available" && !card.buyer) issues.push({ level: "error", area: "Claims", message: `${label} is claimed without a buyer.`, cardId: card.id });
    const decisionPrice = card.claimType === "offer" && card.offerPrice != null ? offerDecisionPrice(card) : Number(card.claimPrice ?? card.price);
    if (card.buyer && decisionPrice < Number(card.purchasePrice || 0)) issues.push({ level: "warning", area: "Profit", message: `${label} is selling below purchase price.`, cardId: card.id });
  });
  const paths = new Set(); sale.cards.filter((card) => card.imagePath).forEach((card) => { const key = card.imagePath.toLowerCase(); if (paths.has(key)) issues.push({ level: "error", area: "Images", message: `An image is linked to more than one card: ${card.imagePath.split(/[\\/]/).pop()}.`, cardId: card.id }); paths.add(key); });
  buyers().forEach((buyer) => orderFlags(buyer).forEach((flag) => issues.push({ level: "warning", area: "Order", message: `${buyer}: ${flag}.`, buyer })));
  return issues;
}

function renderHealthCheck() {
  const issues = healthIssues(); const errors = issues.filter((item) => item.level === "error").length; const warnings = issues.length - errors;
  $("#healthSummary").innerHTML = [["Health status", issues.length ? (errors ? "Needs attention" : "Review") : "Ready", issues.length ? `${issues.length} item${issues.length === 1 ? "" : "s"}` : "No issues found"], ["Errors", errors, "Blocking data problems"], ["Warnings", warnings, "Recommended review"], ["Cards checked", activeSale().cards.length, activeSale().name]].map(([label, value, sub]) => `<article class="stat"><span class="label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><span class="sub">${escapeHtml(sub)}</span></article>`).join("");
  $("#healthIssues").innerHTML = issues.length ? issues.map((item) => `<button class="health-item ${item.level}" ${item.cardId ? `data-health-card="${item.cardId}"` : ""} ${item.buyer ? `data-health-buyer="${escapeHtml(item.buyer)}"` : ""}><span>${item.level === "error" ? "!" : "⚑"}</span><div><strong>${escapeHtml(item.area)}</strong><p>${escapeHtml(item.message)}</p></div></button>`).join("") : `<div class="empty-state"><div class="empty-icon">✓</div><h3>This sale is healthy</h3><p>No missing data, image conflicts, order warnings or below-cost claims were found.</p></div>`;
}

function liveCards() {
  return activeSale().cards.filter((card) => card.status === "available" && !card.hiddenAfterCopy);
}

function renderLiveSale() {
  const cards = liveCards();
  if (!cards.length) {
    $("#liveSaleContent").innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><h3>No unposted cards remaining</h3><p>Restore copied cards or import another list to continue.</p></div>`;
    return;
  }
  liveIndex = Math.max(0, Math.min(liveIndex, cards.length - 1));
  const card = cards[liveIndex];
  $("#liveSaleContent").innerHTML = `<div class="live-progress"><strong>Card ${liveIndex + 1} of ${cards.length}</strong><span>${cards.length} available and not copied</span></div><div class="live-layout"><div class="live-image">${card.imagePath ? `<img draggable="true" data-live-image="${escapeHtml(card.imagePath)}" src="${fileUrl(card.imagePath)}" alt="${escapeHtml(card.name)}" /><small>Drag the image to Facebook</small>` : `<div class="empty-icon">▧</div><p>No image matched</p>`}</div><div class="live-copy"><p class="eyebrow">READY TO POST</p><h2>${escapeHtml(card.name)}</h2><pre>${escapeHtml(formatLine(card))}</pre><div class="live-actions"><button class="primary" data-live-copy="${card.id}">Copy listing</button><button class="secondary" data-live-image-card="${card.id}">${card.imagePath ? "Change image" : "Add image"}</button><button class="secondary" data-live-prev>Previous</button><button class="secondary" data-live-next>Skip / next</button></div><p class="live-private">Cost ${card.purchasePrice !== "" ? money(card.purchasePrice) : "—"} · Purchased ${displayPurchaseDate(card.purchaseDate)} · ${escapeHtml(card.notes || "No flaws listed")}</p></div></div>`;
}

function showView(view) {
  const refresh = { command: renderCommandCenter, sale: () => { renderListings(); renderImages(); }, claims: renderClaims, offers: renderOffers, orders: renderOrders, packing: renderPacking, dashboard: renderDashboard, live: renderLiveSale, buyers: renderBuyerProfiles, health: renderHealthCheck, help: () => {} };
  refresh[view]?.();
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".view").forEach((section) => section.classList.toggle("active", section.id === `${view}View`));
  const labels = { command: "COMMAND CENTER", sale: "SALE WORKSPACE", claims: "CLAIMS DESK", offers: "OFFERS", orders: "BUYER ORDERS", packing: "PACKING", dashboard: "PROFIT DASHBOARD", live: "LIVE SALE MODE", buyers: "BUYER PROFILES", health: "HEALTH CHECK", help: "HELP & GUIDE" };
  $("#viewEyebrow").textContent = labels[view];
}

function openQuickEdit(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card) return;
  $("#quickEditCardId").value = card.id; $("#quickEditTitle").textContent = card.name || "Edit card";
  $("#quickYear").value = card.year || ""; $("#quickBrand").value = card.set || ""; $("#quickPlayer").value = card.name || ""; $("#quickNumber").value = card.number || ""; $("#quickGrade").value = card.condition || ""; $("#quickFlaws").value = /^none$/i.test(card.notes || "") ? "" : card.notes || ""; $("#quickPrice").value = card.price ?? ""; $("#quickPurchasePrice").value = card.purchasePrice ?? ""; $("#quickPurchaseDate").value = card.purchaseDate || "";
  updateQuickEditPreview(); $("#quickEditDrawer").classList.add("open"); $("#quickEditDrawer").setAttribute("aria-hidden", "false");
}

function updateQuickEditPreview() {
  const source = activeSale().cards.find((item) => item.id === $("#quickEditCardId").value) || {};
  const card = { ...source, year: $("#quickYear").value, set: $("#quickBrand").value, name: $("#quickPlayer").value, number: $("#quickNumber").value, condition: $("#quickGrade").value, notes: $("#quickFlaws").value, price: $("#quickPrice").value };
  $("#quickEditPreview").textContent = formatLine(card);
}

function closeQuickEdit() { $("#quickEditDrawer").classList.remove("open"); $("#quickEditDrawer").setAttribute("aria-hidden", "true"); }

function saveQuickEdit() {
  const card = activeSale().cards.find((item) => item.id === $("#quickEditCardId").value); if (!card) return;
  snapshotSale(`Before editing ${card.ref} · ${card.name}`);
  Object.assign(card, { year: $("#quickYear").value.trim(), set: $("#quickBrand").value.trim(), name: $("#quickPlayer").value.trim(), number: $("#quickNumber").value.trim(), condition: $("#quickGrade").value.trim(), notes: $("#quickFlaws").value.trim(), price: Number($("#quickPrice").value || 0), purchasePrice: $("#quickPurchasePrice").value === "" ? "" : Number($("#quickPurchasePrice").value), purchaseDate: normalizePurchaseDate($("#quickPurchaseDate").value) });
  recordAudit("edit", `Updated ${card.ref} · ${card.name}`, { cardId: card.id }); closeQuickEdit(); saveSoon(); render(); toast("Card updated.");
}

function manualCardDraft() {
  return {
    year: $("#addCardYear").value.trim(), set: $("#addCardBrand").value.trim(), name: $("#addCardPlayer").value.trim(),
    number: $("#addCardNumber").value.trim(), condition: $("#addCardGrade").value.trim(), notes: $("#addCardFlaws").value.trim(),
    price: Number($("#addCardPrice").value || 0), purchasePrice: $("#addCardPurchasePrice").value === "" ? "" : Number($("#addCardPurchasePrice").value),
    purchaseDate: normalizePurchaseDate($("#addCardPurchaseDate").value)
  };
}

function updateAddCardPreview() {
  $("#addCardPreview").textContent = formatLine(manualCardDraft());
}

function openAddCard() {
  ["#addCardYear", "#addCardBrand", "#addCardPlayer", "#addCardNumber", "#addCardGrade", "#addCardFlaws", "#addCardPrice", "#addCardPurchasePrice", "#addCardPurchaseDate"].forEach((selector) => $(selector).value = "");
  updateAddCardPreview();
  $("#addCardDialog").showModal();
  $("#addCardYear").focus();
}

function addSingleCard() {
  const sale = activeSale();
  const draft = manualCardDraft();
  if (!draft.name) return toast("Enter the player name.");
  const nextRef = Math.max(0, ...sale.cards.map((card) => Number(card.ref) || 0)) + 1;
  const nextOrder = Math.max(0, ...sale.cards.map((card) => Number(card.sourceOrder) || 0)) + 1;
  const card = { id: uid(), ref: String(nextRef), sourceOrder: nextOrder, customOrder: sale.cards.length + 1, ...draft, imagePath: "", status: "available" };
  sale.cards.push(card);
  recordAudit("manual-add", `Added ${card.ref} · ${card.name}`, { cardId: card.id });
  $("#addCardDialog").close();
  resetListingView();
  saveSoon(); render(); toast(`${card.name} added.`);
}

function moveCardToPosition(cardId) {
  const sale = activeSale();
  const card = sale.cards.find((item) => item.id === cardId);
  if (!card) return;
  const ordered = sortedSaleCards(sale);
  const current = ordered.findIndex((item) => item.id === cardId) + 1;
  const requested = window.prompt(`Move ${card.ref} · ${card.name} to position 1–${ordered.length}:`, String(current));
  if (requested == null) return;
  const position = Number(requested);
  if (!Number.isInteger(position) || position < 1 || position > ordered.length) return toast(`Enter a position from 1 to ${ordered.length}.`);
  if (position === current) return;
  snapshotSale(`Before moving ${card.ref} · ${card.name}`);
  ordered.splice(current - 1, 1);
  ordered.splice(position - 1, 0, card);
  ordered.forEach((item, index) => item.customOrder = index + 1);
  sale.sortMode = "custom";
  saveSoon(); renderListings(); toast(`${card.name} moved to position ${position}.`);
}

function openCloseSale() {
  const sale = activeSale(); const unsold = sale.cards.filter((card) => card.status === "available"); const unpaid = buyers().filter((buyer) => !["paid", "packed", "shipped"].includes(orderFor(buyer).status)); const unpacked = buyers().filter((buyer) => cardsForBuyer(buyer).some((card) => !card.packed));
  $("#closeSaleSummary").innerHTML = `<article><strong>${sale.cards.length - unsold.length}</strong><span>sold</span></article><article><strong>${unsold.length}</strong><span>unsold</span></article><article class="${unpaid.length ? "warning" : ""}"><strong>${unpaid.length}</strong><span>unpaid buyers</span></article><article class="${unpacked.length ? "warning" : ""}"><strong>${unpacked.length}</strong><span>orders not fully packed</span></article>`;
  $("#closeSaleName").value = `${sale.name} carryover`; $("#closeSaleUnsoldAction").value = "keep"; $("#closeSaleNameLabel").classList.add("hidden"); $("#closeSaleDialog").showModal();
}

function finishCloseSale() {
  const sale = activeSale(); snapshotSale("Before closing sale");
  if ($("#closeSaleMarkShipped").checked) buyers().forEach((buyer) => { if (cardsForBuyer(buyer).every((card) => card.packed)) orderFor(buyer).status = "shipped"; });
  if ($("#closeSaleUnsoldAction").value === "new") {
    const name = $("#closeSaleName").value.trim(); if (!name) return toast("Enter a name for the carryover sale.");
    const percent = Number($("#closeSalePercent").value || 0); const cards = sale.cards.filter((card) => card.status === "available").map((card, index) => ({ ...clone(card), id: uid(), ref: String(index + 1), sourceOrder: index + 1, customOrder: index + 1, price: Math.max(0, Number(card.price) * (1 + percent / 100)), hiddenAfterCopy: false }));
    const next = { id: uid(), name, pweShipping: sale.pweShipping, pmwtShipping: sale.pmwtShipping, template: sale.template, cards, images: clone(sale.images.filter((image) => cards.some((card) => card.imagePath === image.path))), orders: {}, versions: [], audit: [], sortMode: "spreadsheet" }; state.sales.push(next); recordAudit("close", `Created ${name} with ${cards.length} unsold cards`, {}, sale);
  }
  sale.closedAt = new Date().toISOString(); recordAudit("close", "Sale closed with the closing assistant"); $("#closeSaleDialog").close(); saveSoon(); render(); toast("Sale closing steps completed.");
}

function presets() { state.salePresets ||= []; return state.salePresets; }

function renderPresetDialog(selectedId = "") {
  const list = presets(); $("#presetSelect").innerHTML = `<option value="">Current sale settings</option>${list.map((preset) => `<option value="${preset.id}" ${preset.id === selectedId ? "selected" : ""}>${escapeHtml(preset.name)}</option>`).join("")}`;
  const preset = list.find((item) => item.id === selectedId); const source = preset || activeSale();
  $("#presetName").value = preset?.name || ""; $("#presetTemplate").value = source.template || DEFAULT_TEMPLATE; $("#presetPwe").value = source.pweShipping ?? 1; $("#presetPmwt").value = source.pmwtShipping ?? 5; $("#presetClaimWords").value = (preset?.claimWords || claimWords()).join(", "); $("#deletePresetBtn").disabled = !preset;
}

function presetFormData() { return { name: $("#presetName").value.trim(), template: $("#presetTemplate").value.trim() || DEFAULT_TEMPLATE, pweShipping: Number($("#presetPwe").value || 0), pmwtShipping: Number($("#presetPmwt").value || 0), claimWords: $("#presetClaimWords").value.split(",").map((word) => word.trim().toLowerCase()).filter(Boolean) }; }

function savePreset() { const data = presetFormData(); if (!data.name) return toast("Enter a preset name."); const id = $("#presetSelect").value; const existing = presets().find((item) => item.id === id); if (existing) Object.assign(existing, data); else state.salePresets.push({ id: uid(), ...data }); saveSoon(); renderPresetDialog(existing?.id || state.salePresets.at(-1).id); toast("Sale preset saved."); }
function applyPreset() { const data = presetFormData(); snapshotSale("Before applying sale preset"); Object.assign(activeSale(), { template: data.template, pweShipping: data.pweShipping, pmwtShipping: data.pmwtShipping }); state.preferences.claimWords = data.claimWords.length ? data.claimWords : [...DEFAULT_CLAIM_WORDS]; saveSoon(); render(); toast("Preset applied to this sale."); }

function autoMap(headers) {
  const aliases = {
    year: ["year", "yr"], set: ["brand", "set", "series"], name: ["player", "name", "card", "title", "description"],
    number: ["number", "card number", "card #", "no", "#"], notes: ["flaw(s)", "flaws", "flaw", "notes", "note", "comments"],
    condition: ["grade", "condition", "cond"], price: ["claim price", "price", "amount", "asking price", "sale price"],
    purchasePrice: ["purchase price", "purchase cost", "cost", "paid", "buy price"],
    purchaseDate: ["purchase date", "date purchased", "bought date", "buy date", "purchased"]
  };
  return Object.fromEntries(Object.entries(aliases).map(([field, candidates]) => [field, headers.find((header) => candidates.includes(header.toLowerCase().trim())) || ""]));
}

async function importSpreadsheet() {
  const path = await window.cardSale.chooseSpreadsheet();
  if (!path) return;
  const parsed = window.cardSale.parseSpreadsheet(path);
  if (!parsed.rows.length) return toast("That sheet has no card rows.");
  const headers = Object.keys(parsed.rows[0]);
  pendingSheet = { ...parsed, path, headers, mapping: autoMap(headers) };
  const fields = [["year", "Year"], ["set", "Brand"], ["name", "Player"], ["number", "Number"], ["notes", "Flaw(s)"], ["condition", "Grade"], ["price", "Claim Price"], ["purchasePrice", "Purchase Price"], ["purchaseDate", "Purchase Date"]];
  $("#mappingGrid").innerHTML = fields.map(([field, label]) => `<label>${label}<select data-map="${field}"><option value="">Not included</option>${headers.map((header) => `<option value="${escapeHtml(header)}" ${pendingSheet.mapping[field] === header ? "selected" : ""}>${escapeHtml(header)}</option>`).join("")}</select></label>`).join("");
  renderImportPresetOptions();
  $("#listingTemplate").value = activeSale().template;
  updateImportPreview();
  $("#importDialog").showModal();
}

function updateImportPreview() {
  if (!pendingSheet) return;
  const row = pendingSheet.rows[0];
  const sample = {};
  $$("[data-map]").forEach((select) => sample[select.dataset.map] = row[select.value] || "");
  $("#importPreview").textContent = formatLine(sample, $("#listingTemplate").value);
  updateImportReview();
}

function updateImportReview() {
  const mapping = {};
  $$("[data-map]").forEach((select) => mapping[select.dataset.map] = select.value);
  const keys = new Map();
  const issues = [];
  pendingSheet.rows.forEach((row, index) => {
    const value = (field) => mapping[field] ? String(row[mapping[field]] ?? "").trim() : "";
    const missing = ["year", "set", "name"].filter((field) => !value(field));
    if (missing.length) issues.push(`Row ${index + 2}: missing ${missing.join(", ")}`);
    const price = Number(value("price").replace(/[$,]/g, ""));
    if (!value("price") || !Number.isFinite(price) || price < 0) issues.push(`Row ${index + 2}: invalid claim price`);
    const key = [value("year"), value("set"), value("name"), value("number"), value("purchaseDate")].join("|").toLowerCase();
    if (keys.has(key)) issues.push(`Rows ${keys.get(key) + 2} and ${index + 2}: possible duplicate`); else keys.set(key, index);
  });
  pendingSheet.validation = issues;
  $("#importReview").innerHTML = `<strong>${pendingSheet.rows.length} rows found</strong><span>${issues.length ? `${issues.length} warning${issues.length === 1 ? "" : "s"} to review` : "All required values look ready"}</span>${issues.length ? `<details><summary>Show warnings</summary><ul>${issues.slice(0, 40).map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}${issues.length > 40 ? `<li>…and ${issues.length - 40} more</li>` : ""}</ul></details>` : ""}`;
}

function confirmImport(event) {
  event.preventDefault();
  if (!pendingSheet) return;
  const mapping = {};
  $$("[data-map]").forEach((select) => mapping[select.dataset.map] = select.value);
  const sale = activeSale();
  snapshotSale(`Before importing ${pendingSheet.rows.length} cards`);
  sale.template = $("#listingTemplate").value;
  const start = sale.cards.length;
  const folder = pendingSheet.path.replace(/[\\/][^\\/]+$/, "");
  const imported = pendingSheet.rows.map((row, index) => {
    const value = (field) => mapping[field] ? row[mapping[field]] : "";
    const card = { id: uid(), ref: String(start + index + 1), sourceOrder: start + index + 1, customOrder: start + index + 1, year: value("year"), set: value("set"), number: value("number"), name: value("name"), condition: value("condition"), price: Number(String(value("price")).replace(/[$,]/g, "")) || 0, purchasePrice: value("purchasePrice") === "" ? "" : Number(String(value("purchasePrice")).replace(/[$,]/g, "")) || 0, purchaseDate: normalizePurchaseDate(value("purchaseDate")), notes: value("notes"), imagePath: "", status: "available" };
    const remembered = state.manualMatchMemory?.[normalizedCardKey(card)];
    if (remembered) card.rememberedImagePath = remembered;
    return card;
  });
  sale.cards.push(...imported);
  imported.forEach((card) => {
    const remembered = card.rememberedImagePath;
    delete card.rememberedImagePath;
    if (remembered) attachImage(card, remembered, true);
  });
  recordAudit("import", `Imported ${imported.length} cards`);
  $("#importDialog").close();
  pendingSheet = null;
  resetListingView();
  showView("sale");
  saveSoon(); render(); toast(`Imported ${imported.length} cards.`);
}

async function addImages(mode = "files") {
  const paths = mode === "folder" ? await window.cardSale.chooseImageFolder() : await window.cardSale.chooseImages();
  if (!paths.length) return;
  const sale = activeSale();
  const known = new Set(sale.images.map((image) => image.path.toLowerCase()));
  paths.filter((path) => !known.has(path.toLowerCase())).forEach((path) => sale.images.push({ id: uid(), path, name: path.split(/[\\/]/).pop() }));
  saveSoon(); renderImages(); toast(`Added ${paths.length} image${paths.length === 1 ? "" : "s"}.`);
}

function normalizeMatchText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function cardLastName(name) {
  const ignored = new Set(["jr", "sr", "ii", "iii", "iv"]);
  const tokens = normalizeMatchText(name).split(" ").filter(Boolean);
  while (tokens.length && ignored.has(tokens[tokens.length - 1])) tokens.pop();
  return tokens[tokens.length - 1] || "";
}

function imageDateCodes(image) {
  return (String(image?.stem || "").match(/(?<!\d)\d{7,8}(?!\d)/g) || [])
    .map(normalizePurchaseDate)
    .filter((value) => /^\d{8}$/.test(value));
}

function imageSequenceNumber(image) {
  const stem = String(image?.stem || "").trim();
  const match = stem.match(/(?:^|[^\d])(\d{7,8})(?:[^\d]+(\d+))\s*$/);
  return match?.[2] ? Number(match[2]) : null;
}

function allCardRecords() {
  return state.sales.flatMap((sale) => sale.cards.map((card) => ({ sale, card })));
}

function cardRecord(cardId) {
  return allCardRecords().find((record) => record.card.id === cardId);
}

function scoreImage(card, image, sale = activeSale()) {
  const stem = normalizeMatchText(image.stem);
  const stemTokens = stem.split(" ").filter(Boolean);
  const relative = normalizeMatchText(image.relativePath);
  const pathTokens = relative.split(" ").filter(Boolean);
  const year = normalizeMatchText(card.year);
  const number = normalizeMatchText(card.number).replace(/^0+/, "") || "0";
  const fullName = normalizeMatchText(card.name);
  const nameTokens = fullName.split(" ").filter((token) => token.length > 1);
  const lastName = cardLastName(card.name);
  const purchaseDate = normalizePurchaseDate(card.purchaseDate);
  const dateCodes = imageDateCodes(image);
  const duplicate = duplicateInfo(card, sale);
  const isDuplicate = duplicate.total > 1;
  const imageSequence = imageSequenceNumber(image);
  let score = 0;
  const reasons = [];

  if (year && pathTokens.includes(year)) { score += 34; reasons.push("year folder"); }
  if (number && stem.replace(/^0+/, "") === number) { score += 66; reasons.push("exact card number"); }
  else if (number && stemTokens.some((token) => (token.replace(/^0+/, "") || "0") === number)) { score += 43; reasons.push("card number"); }
  if (fullName && stem === fullName) { score += 66; reasons.push("full player name"); }
  else if (lastName && stem === lastName) { score += 56; reasons.push("exact surname"); }
  else if (lastName && stemTokens.includes(lastName)) { score += 44; reasons.push("surname"); }
  else if (nameTokens.length > 1 && nameTokens.every((token) => stemTokens.includes(token))) { score += 38; reasons.push("player name"); }
  const setTokens = normalizeMatchText(card.set).split(" ").filter((token) => token.length > 2);
  if (setTokens.length && setTokens.some((token) => pathTokens.includes(token))) { score += 6; reasons.push("set folder"); }
  if (/^\d{8}$/.test(purchaseDate) && dateCodes.includes(purchaseDate)) { score += isDuplicate ? 90 : 24; reasons.push("purchase date code"); }
  else if (isDuplicate && /^\d{8}$/.test(purchaseDate) && dateCodes.length) { score -= 80; reasons.push("different date code"); }
  else if (isDuplicate && /^\d{8}$/.test(purchaseDate)) { score -= 18; reasons.push("missing date code"); }
  if (isDuplicate && dateCodes.includes(purchaseDate) && imageSequence != null) {
    if (imageSequence === duplicate.index + 1) { score += 75; reasons.push(`duplicate order ${imageSequence}`); }
    else { score -= 70; reasons.push(`different duplicate order ${imageSequence}`); }
  }
  return { image, score, reasons };
}

function proposedImageMatch(card, images, sale = activeSale()) {
  let candidates = images.map((image) => scoreImage(card, image, sale)).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.image.path).localeCompare(String(b.image.path), undefined, { numeric: true }));
  const sameYearCandidates = candidates.filter((candidate) => candidate.reasons.includes("year folder"));
  if (sameYearCandidates.length) candidates = sameYearCandidates;
  candidates = candidates.slice(0, 6);
  const top = candidates[0];
  const next = candidates[1];
  const hasDefinitiveFilename = top?.reasons.includes("exact card number") || top?.reasons.includes("full player name") || (top?.reasons.includes("card number") && top?.reasons.includes("surname"));
  const samePlayerSameYear = candidates.filter((candidate) => candidate.reasons.includes("year folder") && candidate.reasons.some((reason) => ["full player name", "exact surname", "surname", "player name"].includes(reason)));
  const ambiguous = Boolean(top && next && samePlayerSameYear.length > 1 && top.score === next.score);
  const purchaseDate = normalizePurchaseDate(card.purchaseDate);
  const sameCardDateCount = allCardRecords().filter((record) => normalizedCardKey(record.card) === normalizedCardKey(card) && normalizePurchaseDate(record.card.purchaseDate) === purchaseDate).length;
  const dateMatches = candidates.filter((candidate) => candidate.reasons.includes("purchase date code"));
  const dateIdentifiesCard = Boolean(top && top.reasons.includes("purchase date code") && top.reasons.includes("year folder") && top.reasons.some((reason) => ["exact card number", "card number", "full player name", "exact surname", "surname", "player name"].includes(reason)));
  const uniquePurchaseDateMatch = /^\d{8}$/.test(purchaseDate) && sameCardDateCount === 1 && dateMatches.length === 1 && dateMatches[0] === top && dateIdentifiesCard;
  return {
    card,
    sale,
    candidates,
    automatic: Boolean(top && !ambiguous && ((top.score >= 100 && hasDefinitiveFilename) || uniquePurchaseDateMatch)),
    automaticReason: uniquePurchaseDateMatch ? "unique purchase date code" : "exact filename match",
    conflict: ambiguous,
    conflictReason: ambiguous ? "Multiple equally strong files match this player in the same year folder. Choose the correct file manually." : ""
  };
}

function imageOwner(imagePath, exceptCardId = "") {
  const key = String(imagePath || "").toLowerCase();
  return allCardRecords().find((record) => record.card.id !== exceptCardId && String(record.card.imagePath || "").toLowerCase() === key);
}

function attachImage(card, imagePath, quiet = false, sale = activeSale()) {
  if (!imagePath) return true;
  const owner = imageOwner(imagePath, card.id);
  if (owner) {
    if (!quiet) toast(`That image is already linked to ${owner.sale.name}: ${owner.card.ref} · ${owner.card.name}.`);
    return false;
  }
  card.imagePath = imagePath;
  const existingImage = sale.images.find((image) => image.path.toLowerCase() === imagePath.toLowerCase());
  if (existingImage) {
    delete existingImage.hiddenAfterDrag;
    delete existingImage.hiddenAt;
  } else {
    sale.images.push({ id: uid(), path: imagePath, name: imagePath.split(/[\\/]/).pop() });
  }
  return true;
}

function detachImage(record) {
  const previousPath = record.card.imagePath;
  record.card.imagePath = "";
  if (previousPath && !record.sale.cards.some((card) => card.imagePath && card.imagePath.toLowerCase() === previousPath.toLowerCase())) record.sale.images = record.sale.images.filter((image) => image.path.toLowerCase() !== previousPath.toLowerCase());
}

async function autoMatchImages(options = {}) {
  const sale = activeSale();
  const settings = lookupSettings();
  let folder = settings.primaryFolder;
  if (!folder) folder = await window.cardSale.chooseLookupFolder();
  if (!folder) return;
  settings.primaryFolder = folder;
  saveSoon();
  $("#lookupFolderLabel").textContent = folder;
  const allRecords = allCardRecords();
  let records = options.allSales
    ? allRecords.slice()
    : options.cardIds?.length
      ? allRecords.filter((record) => options.cardIds.includes(record.card.id))
      : sale.cards.filter((card) => !card.imagePath).map((card) => ({ sale, card }));
  if (!records.length) return toast(options.force ? "No cards were selected for image lookup." : "Every card already has a confirmed image.");
  const oldPendingMatches = pendingMatches;
  const confirmedPaths = new Set(allRecords.filter((record) => !records.some((target) => target.card.id === record.card.id) && record.card.imagePath).map((record) => record.card.imagePath.toLowerCase()));
  const button = $("#autoMatchBtn");
  const forceAllButton = $("#forceAllImageLookupBtn");
  const progress = $("#lookupProgress");
  const progressBar = $("#lookupProgressBar");
  const progressText = $("#lookupProgressText");
  button.disabled = true;
  forceAllButton.disabled = true;
  progress.classList.remove("hidden");
  progress.classList.remove("indeterminate");
  progressBar.style.width = "0%";
  progressText.textContent = "Counting image folders…";
  const stopProgress = window.cardSale.onImageScanProgress((details) => {
    const percent = Math.max(0, Math.min(60, Number(details.percent || 0)));
    progressBar.style.width = `${percent}%`;
    if (details.phase === "counting") progressText.textContent = `Counting folders… ${details.directoriesFound || 0} found`;
    else progressText.textContent = `Scanning folder ${details.foldersScanned || 0} of ${details.totalFolders || 0} · ${details.found || 0} images found`;
  });
  let images;
  try {
    images = await window.cardSale.scanImageFolder({ folders: [folder, ...settings.additionalFolders], excludedFolders: settings.excludedFolders, excludedPaths: options.force ? [] : [...confirmedPaths] });
  } catch (error) {
    progress.classList.add("hidden");
    toast(error.message || "Image lookup could not finish.");
    return;
  } finally {
    stopProgress();
    button.disabled = false;
    forceAllButton.disabled = false;
  }
  if (!images.length) { progress.classList.add("hidden"); return toast("No unconfirmed supported images were found."); }
  let proposed = records.map((record) => proposedImageMatch(record.card, images, record.sale));
  proposed.forEach((match) => { match.card.lastSuggestedImagePath = match.candidates[0]?.image.path || ""; });
  if (options.includeRelated) {
    const suggestedPaths = new Set(proposed.map((match) => match.candidates[0]?.image.path?.toLowerCase()).filter(Boolean));
    const relatedRecords = allRecords.filter((record) => [record.card.imagePath, record.card.lastSuggestedImagePath].filter(Boolean).some((imagePath) => suggestedPaths.has(imagePath.toLowerCase())));
    (oldPendingMatches?.review || []).forEach((match) => {
      const topPath = match.candidates[0]?.image.path?.toLowerCase();
      if (topPath && suggestedPaths.has(topPath) && !relatedRecords.some((record) => record.card.id === match.card.id)) relatedRecords.push({ sale: match.sale || activeSale(), card: match.card });
    });
    relatedRecords.forEach((record) => { if (!records.some((target) => target.card.id === record.card.id)) records.push(record); });
    proposed = records.map((record) => proposedImageMatch(record.card, images, record.sale));
    proposed.forEach((match) => { match.card.lastSuggestedImagePath = match.candidates[0]?.image.path || ""; });
  }
  if (options.force) records.forEach(detachImage);
  for (let index = 0; index < records.length; index += 1) {
    const percent = 60 + Math.round(((index + 1) / records.length) * 35);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `Matching card ${index + 1} of ${records.length}`;
    if (index % 8 === 7) await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  const topPathCounts = new Map();
  proposed.forEach((match) => {
    const key = match.candidates[0]?.image.path?.toLowerCase();
    if (key) topPathCounts.set(key, (topPathCounts.get(key) || 0) + 1);
  });
  proposed.forEach((match) => {
    const key = match.candidates[0]?.image.path?.toLowerCase();
    if (key && topPathCounts.get(key) > 1) {
      match.automatic = false;
      match.conflict = true;
      match.conflictReason = "This same image was suggested for more than one listing. Choose the correct file manually.";
      match.selected = "";
    }
  });

  const targetIds = new Set(records.map((record) => record.card.id));
  const used = new Set(allCardRecords().filter((record) => !targetIds.has(record.card.id) && record.card.imagePath).map((record) => record.card.imagePath.toLowerCase()));
  const automatic = [];
  const review = [];
  proposed.sort((a, b) => (b.candidates[0]?.score || 0) - (a.candidates[0]?.score || 0)).forEach((match) => {
    const topPath = match.candidates[0]?.image.path;
    if (match.automatic && topPath && !used.has(topPath.toLowerCase())) {
      if (attachImage(match.card, topPath, true, match.sale)) {
        automatic.push({ card: match.card, candidate: match.candidates[0] });
        state.manualMatchMemory ||= {};
        state.manualMatchMemory[normalizedCardKey(match.card)] = topPath;
        used.add(topPath.toLowerCase());
      } else {
        match.automatic = false;
        match.conflict = true;
        match.selected = "";
        review.push(match);
      }
    } else {
      match.candidates = match.candidates.filter((candidate) => !used.has(candidate.image.path.toLowerCase()));
      if (match.conflict) match.selected = "";
      review.push(match);
    }
  });

  const reviewItems = review.map((match) => ({ ...match, confirmed: false }));
  pendingMatches = { review: reviewItems, scanned: images.length, filter: "all", query: "", scope: options.allSales ? "all sales" : records.length > 1 ? `${records.length} related cards` : sale.name };
  progressBar.style.width = "100%";
  progressText.textContent = `Complete · ${automatic.length} exact match${automatic.length === 1 ? "" : "es"} attached automatically`;
  if (automatic.length) saveSoon();
  progress.classList.add("hidden");
  selectedMatchIds.clear();
  $("#matchSearch").value = "";
  $$('[data-match-filter]').forEach((button) => button.classList.toggle("active", button.dataset.matchFilter === "all"));
  renderMatchReview();
  if (reviewItems.length) $("#matchDialog").showModal();
  else { render(); toast(`${automatic.length} exact image match${automatic.length === 1 ? "" : "es"} attached automatically.`); }
}

async function forceImageLookupForCard(cardId) {
  const record = cardRecord(cardId);
  if (!record) return;
  if ($("#matchDialog").open) $("#matchDialog").close();
  await autoMatchImages({ cardIds: [cardId], force: true, includeRelated: true });
}

async function forceAllImageLookup() {
  const count = allCardRecords().length;
  if (!count || !window.confirm(`Re-run image lookup for all ${count} cards in every sale, including past sales? Existing confirmed links will be rechecked and uncertain matches will return to review.`)) return;
  await autoMatchImages({ allSales: true, force: true });
}

function renderMatchReview() {
  const pending = pendingMatches.review.filter((match) => !match.confirmed).length;
  const suggested = pendingMatches.review.filter((match) => !match.confirmed && (match.candidates[0]?.score || 0) >= 45).length;
  const confirmed = pendingMatches.review.filter((match) => match.confirmed).length;
  $("#matchSummary").innerHTML = `<div><strong>${pending}</strong>awaiting confirmation</div><div><strong>${suggested}</strong>with a likely match</div><div><strong>${confirmed}</strong>confirmed and hidden</div>${pendingMatches.scope ? `<small>Scope: ${escapeHtml(pendingMatches.scope)}</small>` : ""}`;
  const query = String(pendingMatches.query || "").toLowerCase();
  const filtered = pendingMatches.review.filter((match) => {
    const hasSuggestion = (match.candidates[0]?.score || 0) >= 45;
    const filterMatch = (pendingMatches.filter === "all" && !match.confirmed) || (pendingMatches.filter === "suggested" && !match.confirmed && hasSuggestion) || (pendingMatches.filter === "unmatched" && !match.confirmed && !hasSuggestion) || (pendingMatches.filter === "confirmed" && match.confirmed);
    const searchText = `${match.card.year} ${match.card.set} ${match.card.number} ${match.card.name} ${match.card.notes} ${match.candidates.map((candidate) => candidate.image.relativePath).join(" ")}`.toLowerCase();
    return filterMatch && searchText.includes(query);
  });
  const validIds = new Set(pendingMatches.review.map((match) => match.card.id));
  selectedMatchIds = new Set([...selectedMatchIds].filter((id) => validIds.has(id)));
  $("#matchReviewList").innerHTML = filtered.length ? filtered.map((match) => {
    const top = match.candidates[0];
    const selectTop = match.selected !== undefined ? Boolean(match.selected) : Boolean(top && top.score >= 45);
    const selectedPath = match.selected !== undefined ? match.selected : (selectTop ? top.image.path : "");
    return `<article class="match-row ${match.conflict ? "match-conflict" : ""}" data-match-card="${match.card.id}">
      <label class="match-select-box"><input type="checkbox" data-select-match="${match.card.id}" ${selectedMatchIds.has(match.card.id) ? "checked" : ""} /> Select</label>
      <div class="match-card-name"><strong>${escapeHtml(match.sale?.name || activeSale().name)} · ${escapeHtml(match.card.ref)} · ${escapeHtml(match.card.year)} ${escapeHtml(match.card.set)} #${escapeHtml(match.card.number)} ${escapeHtml(match.card.name)} ${escapeHtml(duplicateInfo(match.card, match.sale || activeSale()).label)}</strong><span>Flaws: ${escapeHtml(match.card.notes && !/^none$/i.test(match.card.notes) ? match.card.notes : "None listed")}</span><span>Purchase date: ${displayPurchaseDate(match.card.purchaseDate)}</span>${match.conflict ? `<span class="match-warning">${escapeHtml(match.conflictReason || "Choose the correct image manually.")}</span>` : ""}</div>
      <div class="candidate-picker"><img data-match-preview src="${selectedPath ? fileUrl(selectedPath) : "assets/favicon.svg"}" alt="" /><div><select data-match-select ${match.confirmed ? "disabled" : ""}><option value="">Leave unmatched</option>${match.candidates.map((candidate) => `<option value="${escapeHtml(candidate.image.path)}" ${selectedPath === candidate.image.path ? "selected" : ""}>${escapeHtml(candidate.image.relativePath)} — ${Math.max(0, Math.min(100, candidate.score))}% match</option>`).join("")}</select><div class="confidence-note">${top ? `Best clue: ${escapeHtml(top.reasons.join(", ") || "partial filename")}` : "No likely filename found"}</div></div></div>
      <div class="match-confirm">${match.confirmed ? `<span class="status available">Confirmed</span><button type="button" class="row-action" data-reopen-match="${match.card.id}">Reopen</button>` : `<button type="button" class="primary" data-confirm-match="${match.card.id}">${selectedPath ? "Confirm match" : "Confirm no image"}</button>`}<button type="button" class="row-action" data-rematch-match="${match.card.id}">Re-run related</button></div>
    </article>`;
  }).join("") : `<div class="empty-state"><h3>No matches in this filter</h3><p>Change the filter or search text to see other cards.</p></div>`;
  const visibleIds = filtered.map((match) => match.card.id);
  const selectedVisible = visibleIds.filter((id) => selectedMatchIds.has(id)).length;
  $("#matchSelectionCount").textContent = `${selectedMatchIds.size} selected`;
  $("#confirmSelectedMatchesBtn").disabled = selectedMatchIds.size === 0;
  $("#deleteSelectedMatchesBtn").disabled = selectedMatchIds.size === 0;
  $("#selectAllMatches").checked = visibleIds.length > 0 && selectedVisible === visibleIds.length;
  $("#selectAllMatches").indeterminate = selectedVisible > 0 && selectedVisible < visibleIds.length;
  $("#confirmPerfectMatchesBtn").disabled = !pendingMatches.review.some((match) => !match.confirmed && !match.conflict && (match.candidates[0]?.score || 0) >= 100);
}

function confirmMatch(match, selectedPath = match.selected) {
  if (!match || match.confirmed) return false;
  match.selected = selectedPath || "";
  if (match.selected) {
    const previousPath = match.card.imagePath;
    if (!attachImage(match.card, match.selected, true, match.sale || activeSale())) return false;
    state.manualMatchMemory ||= {};
    state.manualMatchMemory[normalizedCardKey(match.card)] = match.selected;
    const sale = match.sale || activeSale();
    if (previousPath && previousPath !== match.selected && !sale.cards.some((card) => card.id !== match.card.id && card.imagePath === previousPath)) sale.images = sale.images.filter((image) => image.path !== previousPath);
  }
  match.confirmed = true;
  selectedMatchIds.delete(match.card.id);
  return true;
}

function confirmSelectedMatches(ids = selectedMatchIds) {
  let confirmed = 0;
  let conflicts = 0;
  pendingMatches.review.filter((match) => ids.has(match.card.id)).forEach((match) => {
    const row = $(`[data-match-card="${CSS.escape(match.card.id)}"]`);
    const selected = row ? $("[data-match-select]", row)?.value : (match.selected ?? match.candidates[0]?.image.path ?? "");
    if (confirmMatch(match, selected)) confirmed += 1;
    else if (!match.confirmed) conflicts += 1;
  });
  saveSoon(); renderImages(); renderListings(); renderMatchReview();
  toast(conflicts ? `${confirmed} confirmed; ${conflicts} skipped because an image was already in use.` : `${confirmed} match${confirmed === 1 ? "" : "es"} confirmed.`);
}

function confirmPerfectMatches() {
  const perfect = new Set(pendingMatches.review.filter((match) => !match.confirmed && !match.conflict && (match.candidates[0]?.score || 0) >= 100).map((match) => match.card.id));
  perfect.forEach((id) => {
    const match = pendingMatches.review.find((item) => item.card.id === id);
    if (match) match.selected = match.candidates[0]?.image.path || "";
  });
  confirmSelectedMatches(perfect);
}

function deleteSelectedMatches() {
  const count = selectedMatchIds.size;
  if (!count || !window.confirm(`Delete ${count} selected card${count === 1 ? "" : "s"} from this sale?`)) return;
  const ids = new Set(selectedMatchIds);
  state.sales.forEach((sale) => {
    const removed = sale.cards.filter((card) => ids.has(card.id));
    sale.cards = sale.cards.filter((card) => !ids.has(card.id));
    removed.forEach((card) => { if (card.imagePath && !sale.cards.some((item) => item.imagePath === card.imagePath)) sale.images = sale.images.filter((image) => image.path !== card.imagePath); });
  });
  pendingMatches.review = pendingMatches.review.filter((match) => !ids.has(match.card.id));
  selectedMatchIds.clear();
  saveSoon(); render(); renderMatchReview(); toast(`${count} card${count === 1 ? "" : "s"} removed.`);
}

function applyReviewedMatches(event) {
  event.preventDefault();
  if (!pendingMatches) return;
  const total = pendingMatches.review.filter((match) => match.confirmed).length;
  pendingMatches = null;
  $("#matchDialog").close();
  saveSoon(); render(); toast(`${total} card${total === 1 ? "" : "s"} confirmed.`);
}

function renderFolderSettings() {
  const settings = lookupSettings();
  $("#primaryFolderRow").innerHTML = settings.primaryFolder ? `<div class="folder-item"><span>${escapeHtml(settings.primaryFolder)}</span><button type="button" data-remove-primary>Remove</button></div>` : `<p class="folder-empty">No primary folder selected.</p>`;
  $("#additionalFolderList").innerHTML = settings.additionalFolders.length ? settings.additionalFolders.map((folder, index) => `<div class="folder-item"><span>${escapeHtml(folder)}</span><button type="button" data-remove-additional="${index}">Remove</button></div>`).join("") : `<p class="folder-empty">No additional folders.</p>`;
  $("#excludedFolderList").innerHTML = settings.excludedFolders.length ? settings.excludedFolders.map((folder, index) => `<div class="folder-item excluded"><span>${escapeHtml(folder)}</span><button type="button" data-remove-excluded="${index}">Remove</button></div>`).join("") : `<p class="folder-empty">No folders excluded.</p>`;
}

async function chooseManualImage(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card) return;
  const paths = await window.cardSale.chooseImages();
  if (!paths.length) return;
  const previousPath = card.imagePath;
  if (!attachImage(card, paths[0])) return;
  state.manualMatchMemory ||= {};
  state.manualMatchMemory[normalizedCardKey(card)] = paths[0];
  if (previousPath && previousPath !== paths[0] && !activeSale().cards.some((item) => item.id !== card.id && item.imagePath === previousPath)) {
    activeSale().images = activeSale().images.filter((image) => image.path !== previousPath);
  }
  saveSoon(); render(); toast(`Image attached to ${card.name}.`);
}

function deleteCard(cardId) {
  const sale = activeSale();
  const card = sale.cards.find((item) => item.id === cardId);
  if (!card || !window.confirm(`Remove ${card.year} ${card.set} #${card.number} ${card.name} from this sale?`)) return;
  snapshotSale(`Before deleting ${card.ref} · ${card.name}`);
  sale.cards = sale.cards.filter((item) => item.id !== cardId);
  if (card.imagePath && !sale.cards.some((item) => item.imagePath === card.imagePath)) sale.images = sale.images.filter((image) => image.path !== card.imagePath);
  recordAudit("delete", `Deleted ${card.ref} · ${card.name}`, { cardId: card.id });
  saveSoon(); renderStats(); renderListings(); renderImages(); toast("Card removed from the sale.");
}

function deleteSelectedCards() {
  const count = selectedListingIds.size;
  if (!count || !window.confirm(`Remove ${count} selected card${count === 1 ? "" : "s"} from this sale?`)) return;
  const sale = activeSale();
  snapshotSale(`Before deleting ${count} cards`);
  const removed = sale.cards.filter((card) => selectedListingIds.has(card.id));
  sale.cards = sale.cards.filter((card) => !selectedListingIds.has(card.id));
  removed.forEach((card) => { if (card.imagePath && !sale.cards.some((item) => item.imagePath === card.imagePath)) sale.images = sale.images.filter((image) => image.path !== card.imagePath); });
  selectedListingIds.clear();
  recordAudit("delete", `Deleted ${count} selected cards`);
  saveSoon(); renderStats(); renderListings(); renderImages(); toast(`${count} cards removed from the sale.`);
}

function deleteActiveSale() {
  const sale = activeSale();
  if (!sale) return;
  if (!window.confirm(`Delete the sale “${sale.name}” and all ${sale.cards.length} card${sale.cards.length === 1 ? "" : "s"} in it?`)) return;
  const deletedIndex = state.sales.findIndex((item) => item.id === sale.id);
  undoStack.push({ deletedSale: clone(sale), deletedIndex });
  state.sales = state.sales.filter((item) => item.id !== sale.id);
  if (!state.sales.length) {
    const replacement = { id: uid(), name: "New sale", pweShipping: 1, pmwtShipping: 5, template: DEFAULT_TEMPLATE, cards: [], images: [], orders: {} };
    state.sales.push(replacement);
  }
  state.activeSaleId = state.sales[0].id;
  state.selectedBuyer = "";
  resetListingView();
  saveSoon(); render(); toast("Sale deleted.");
}

function assignBuyer(cardId, buyerName, offeredPrice, claimType = "claim", claimNote = "") {
  const card = activeSale().cards.find((item) => item.id === cardId);
  const buyer = canonicalBuyerName(buyerName);
  if (!card || !buyer) return toast("Enter a buyer name first.");
  const hasOffer = claimType === "offer";
  const wasAcceptedOffer = hasOffer && card.offerStatus === "accepted";
  const acceptedPrice = hasOffer ? Number(offeredPrice) : Number(card.price);
  if (hasOffer && String(offeredPrice ?? "").trim() === "") return toast("Enter the accepted offer price.");
  if (!Number.isFinite(acceptedPrice) || acceptedPrice < 0) return toast("Enter a valid price.");
  snapshotSale(`Before assigning ${card.ref} to ${buyer}`);
  const previousBuyer = card.buyer;
  card.buyer = buyer;
  card.claimType = hasOffer ? "offer" : "claim";
  card.claimedAt ||= new Date().toISOString();
  card.claimUpdatedAt = new Date().toISOString();
  card.claimNote = String(claimNote || "").trim();
  if (wasAcceptedOffer) {
    card.status = "claimed";
    card.offerPrice = acceptedPrice;
    card.claimPrice = Number(card.counterPrice ?? acceptedPrice);
    orderFor(buyer);
    state.selectedBuyer = buyer;
  } else if (hasOffer) {
    card.status = "offered";
    card.offerPrice = acceptedPrice;
    card.offerStatus = "pending";
    card.offerReceivedAt = new Date().toISOString();
    delete card.claimPrice;
    delete card.counterPrice;
    delete card.counteredAt;
    delete card.offerAcceptedAt;
  } else {
    card.status = "claimed";
    card.claimPrice = acceptedPrice;
    delete card.offerPrice;
    delete card.offerStatus;
    delete card.counterPrice;
    delete card.offerReceivedAt;
    delete card.offerAcceptedAt;
    orderFor(buyer);
    state.selectedBuyer = buyer;
  }
  recordAudit(claimType, previousBuyer && previousBuyer !== buyer ? `Moved ${card.ref} · ${card.name} from ${previousBuyer} to ${buyer}` : `${claimType === "offer" ? "Offer" : "Claim"} recorded for ${card.ref} · ${card.name}`, { cardId: card.id, buyer });
  saveSoon(); render(); toast(hasOffer && !wasAcceptedOffer ? `${card.ref} offer sent to the Offers tab.` : `${card.ref} assigned to ${buyer}.`);
}

function acceptOffer(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card || card.claimType !== "offer" || !card.buyer || card.offerStatus === "accepted") return;
  const acceptedPrice = offerDecisionPrice(card);
  if (!Number.isFinite(acceptedPrice) || acceptedPrice < 0) return toast("This offer does not have a valid price.");
  snapshotSale(`Before accepting offer on ${card.ref}`);
  card.status = "claimed";
  card.offerStatus = "accepted";
  card.claimPrice = acceptedPrice;
  card.offerAcceptedAt = new Date().toISOString();
  card.claimUpdatedAt = card.offerAcceptedAt;
  orderFor(card.buyer);
  state.selectedBuyer = card.buyer;
  recordAudit("offer-accepted", `Accepted ${money(acceptedPrice)} offer for ${card.ref} · ${card.name}`, { cardId: card.id, buyer: card.buyer });
  saveSoon(); render(); toast(`${card.ref} added to ${card.buyer}’s order at ${money(acceptedPrice)}.`);
}

function rejectOffer(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card || card.claimType !== "offer" || card.offerStatus === "accepted") return;
  const buyer = card.buyer;
  if (!window.confirm(`Reject ${buyer || "this buyer"}’s ${money(card.offerPrice)} offer and return the card to the open pool?`)) return;
  snapshotSale(`Before rejecting offer on ${card.ref}`);
  card.status = "available";
  ["buyer", "claimPrice", "offerPrice", "offerStatus", "counterPrice", "counteredAt", "offerReceivedAt", "offerAcceptedAt", "claimedAt", "claimUpdatedAt", "claimType", "claimNote", "packed"].forEach((key) => delete card[key]);
  recordAudit("offer-rejected", `Rejected ${buyer || "buyer"} offer for ${card.ref} · ${card.name}`, { cardId: card.id, buyer });
  saveSoon(); render(); toast(`${card.ref} returned to the open pool.`);
}

function counterOfferMessage(card, counterPrice) {
  const buyer = String(card.buyer || "").trim();
  const values = {
    firstName: buyer.split(/\s+/)[0] || buyer,
    buyer,
    card: `${card.year || ""} ${card.set || ""} ${numberLabel(card)} ${card.name || ""}`.replace(/\s+/g, " ").trim(),
    listPrice: money(card.price),
    offerPrice: money(card.offerPrice),
    counterPrice: money(counterPrice)
  };
  return (ensureMessageTemplates().counterOffer || DEFAULT_MESSAGE_TEMPLATES.counterOffer).replace(/\{(firstName|buyer|card|listPrice|offerPrice|counterPrice)\}/g, (_match, key) => values[key] ?? "").trim();
}

function openCounterOffer(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card || card.claimType !== "offer" || card.offerStatus === "accepted") return;
  const initial = Number(card.counterPrice ?? card.price);
  $("#counterOfferCardId").value = card.id;
  $("#counterOfferTitle").textContent = `${card.ref} · ${card.name}`;
  $("#counterListPrice").textContent = money(card.price);
  $("#counterOriginalPrice").textContent = money(card.offerPrice);
  $("#counterOfferPrice").value = Number.isFinite(initial) ? initial.toFixed(2) : "";
  $("#counterOfferMessage").value = counterOfferMessage(card, initial);
  $("#counterOfferDialog").showModal();
}

async function copyCounterOffer() {
  const card = activeSale().cards.find((item) => item.id === $("#counterOfferCardId").value);
  const counterPrice = Number($("#counterOfferPrice").value);
  if (!card || !Number.isFinite(counterPrice) || counterPrice < 0) return toast("Enter a valid counter price.");
  const message = $("#counterOfferMessage").value.trim();
  if (!message) return toast("Enter a counter message.");
  const copied = await window.cardSale.copyText(message).catch(() => false);
  if (!copied) return toast("The counter message could not be copied.");
  snapshotSale(`Before countering offer on ${card.ref}`);
  card.counterPrice = counterPrice;
  card.offerStatus = "countered";
  card.counteredAt = new Date().toISOString();
  recordAudit("offer-countered", `Countered ${card.buyer} at ${money(counterPrice)} for ${card.ref} · ${card.name}`, { cardId: card.id, buyer: card.buyer });
  $("#counterOfferDialog").close();
  saveSoon(); render(); toast("Counter message copied and offer updated.");
}

function clearClaim(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card) return;
  snapshotSale(`Before clearing claim on ${card.ref}`);
  const priorBuyer = card.buyer;
  card.status = "available";
  delete card.buyer;
  delete card.claimPrice;
  delete card.offerPrice;
  delete card.offerStatus;
  delete card.counterPrice;
  delete card.counteredAt;
  delete card.offerReceivedAt;
  delete card.offerAcceptedAt;
  delete card.claimedAt;
  delete card.claimUpdatedAt;
  delete card.claimType;
  delete card.packed;
  delete card.claimNote;
  recordAudit("claim-cleared", `Cleared claim on ${card.ref} · ${card.name}`, { cardId: card.id, buyer: priorBuyer });
  saveSoon(); render(); toast(`${card.ref} returned to available.`);
}

async function copyAndHideCard(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card || card.hiddenAfterCopy) return;
  const line = formatLine(card);
  const copied = await window.cardSale.copyText(line).catch(() => false);
  if (!copied) return toast("The listing could not be copied. Please try again.");
  card.hiddenAfterCopy = true;
  card.completedBy = "copied";
  card.completedAt = new Date().toISOString();
  undoStack.push({ saleId: activeSale().id, cardId });
  saveSoon(); renderListings();
  toast("Listing copied and hidden. Ctrl+Z to undo.");
}

function restoreCard(cardId, message = "Card restored to the workspace.") {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card) return;
  delete card.hiddenAfterCopy;
  delete card.completedBy;
  delete card.completedAt;
  saveSoon(); renderListings(); toast(message);
}

function undoLastCompletion() {
  while (undoStack.length) {
    const action = undoStack.pop();
    if (action.deletedSale) {
      state.sales.splice(Math.max(0, action.deletedIndex || 0), 0, action.deletedSale);
      state.activeSaleId = action.deletedSale.id;
      saveSoon(); render(); toast("Deleted sale restored."); return;
    }
    const sale = state.sales.find((item) => item.id === action.saleId);
    if (action.versionId) {
      const version = sale?.versions?.find((item) => item.id === action.versionId);
      if (sale && version) {
        const remaining = sale.versions.filter((item) => item.id !== version.id);
        Object.keys(sale).forEach((key) => delete sale[key]);
        Object.assign(sale, clone(version.data));
        sale.versions = remaining;
        state.activeSaleId = sale.id;
        selectedListingIds.clear();
        saveSoon(); render(); toast(`Undid: ${version.label}`); return;
      }
    }
    if (action.imageId) {
      const image = sale?.images.find((item) => item.id === action.imageId);
      if (image?.hiddenAfterDrag) {
        delete image.hiddenAfterDrag;
        delete image.hiddenAt;
        if (sale.id === activeSale().id) renderImages();
        saveSoon(); toast("Last hidden image restored."); return;
      }
    }
    const card = sale?.cards.find((item) => item.id === action.cardId);
    if (card?.hiddenAfterCopy) {
      delete card.hiddenAfterCopy; delete card.completedBy; delete card.completedAt;
      if (sale.id === activeSale().id) renderListings();
      saveSoon(); toast("Last hidden card restored."); return;
    }
  }
  const sale = activeSale();
  const version = sale.versions?.pop();
  if (version) {
    const remaining = sale.versions;
    Object.keys(sale).forEach((key) => delete sale[key]);
    Object.assign(sale, clone(version.data));
    sale.versions = remaining;
    selectedListingIds.clear();
    saveSoon(); render(); toast(`Undid: ${version.label}`);
  }
}

function renderVersionList() {
  const versions = activeSale().versions || [];
  $("#versionList").innerHTML = versions.length ? versions.slice().reverse().map((version) => `<article class="version-item"><div><strong>${escapeHtml(version.label)}</strong><small>${new Date(version.at).toLocaleString()}</small></div><button type="button" class="secondary" data-restore-version="${version.id}">Restore</button></article>`).join("") : `<div class="empty-state"><h3>No earlier versions yet</h3><p>Imports, bulk edits, claims and deletions create restore points automatically.</p></div>`;
}

function restoreVersion(versionId) {
  const sale = activeSale();
  const versions = sale.versions || [];
  const version = versions.find((item) => item.id === versionId);
  if (!version || !window.confirm(`Restore “${version.label}” from ${new Date(version.at).toLocaleString()}?`)) return;
  snapshotSale("Before restoring an earlier version", sale);
  const preservedVersions = sale.versions;
  Object.keys(sale).forEach((key) => delete sale[key]);
  Object.assign(sale, clone(version.data));
  sale.versions = preservedVersions;
  recordAudit("restore", `Restored version: ${version.label}`);
  selectedListingIds.clear();
  saveSoon(); render(); renderVersionList(); toast("Earlier sale version restored.");
}

async function copyText(text, message = "Copied") {
  const copied = await window.cardSale.copyText(text).catch(() => false);
  toast(copied ? message : "The text could not be copied. Please try again.");
}

function messageTemplateValues(buyer) {
  const cards = cardsForBuyer(buyer); const order = orderFor(buyer);
  const subtotal = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price), 0);
  const shipping = shippingAmount(order);
  const total = subtotal + shipping - Number(order.discount || 0);
  const firstName = String(buyer || "").trim().split(/\s+/)[0] || buyer;
  return {
    buyer, firstName, saleName: activeSale().name, cardCount: String(cards.length),
    cardList: cards.map((card) => `${card.year} ${card.set} ${numberLabel(card)} ${card.name}${duplicateInfo(card).label ? ` ${duplicateInfo(card).label}` : ""} — ${money(card.claimPrice ?? card.price)} (${card.claimType === "offer" ? "accepted offer" : "claim"})`.replace(/\s+/g, " ").trim()).join("\n"),
    subtotal: money(subtotal), discount: money(order.discount || 0), discountLine: order.discount ? `Discount: -${money(order.discount)}\n` : "",
    shippingMethod: order.shippingMethod || "Not selected", shipping: order.shippingMethod ? money(shipping) : "—", total: money(total),
    trackingNumber: order.trackingNumber || "", trackingLine: order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : ""
  };
}

function renderBuyerMessageTemplate(key, buyer) {
  const values = messageTemplateValues(buyer);
  const template = ensureMessageTemplates()[key] || DEFAULT_MESSAGE_TEMPLATES[key] || "";
  return template.replace(/\{(buyer|firstName|saleName|cardCount|cardList|subtotal|discount|discountLine|shippingMethod|shipping|total|trackingNumber|trackingLine)\}/g, (_match, name) => values[name] ?? "")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buyerSummary(buyer) {
  return renderBuyerMessageTemplate("orderSummary", buyer);
}

function trackingMessage(buyer) {
  return renderBuyerMessageTemplate("shipped", buyer);
}

function buyerMessage(type, buyer) {
  const key = { "payment-due": "paymentDue", "payment-received": "paymentReceived", shipped: "shipped", delayed: "delayed" }[type] || "shipped";
  return renderBuyerMessageTemplate(key, buyer);
}

function openMessageTemplates() {
  const templates = ensureMessageTemplates();
  MESSAGE_TEMPLATE_FIELDS.forEach(([key]) => { const field = $(`#messageTemplate-${key}`); if (field) field.value = templates[key]; });
  $("#messageTemplatesDialog").showModal();
}

function saveMessageTemplates() {
  const templates = ensureMessageTemplates();
  MESSAGE_TEMPLATE_FIELDS.forEach(([key]) => { templates[key] = $(`#messageTemplate-${key}`).value.trim() || DEFAULT_MESSAGE_TEMPLATES[key]; });
  saveSoon();
  $("#messageTemplatesDialog").close();
  toast("Buyer message templates saved.");
}

function resetMessageTemplates() {
  MESSAGE_TEMPLATE_FIELDS.forEach(([key]) => { $(`#messageTemplate-${key}`).value = DEFAULT_MESSAGE_TEMPLATES[key]; });
  toast("Default messages restored. Save to keep them.");
}

const PACKING_PRINT_STYLES = `
  body{font:14px "Segoe UI",Arial,sans-serif;color:#172333;background:#fff}
  .slip-page{min-height:100vh;padding:.42in;page-break-after:always;display:flex;flex-direction:column;background:#fff;break-inside:avoid}
  .slip-page:last-child{page-break-after:auto}.slip-brand{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid var(--accent);padding-bottom:14px}.slip-brand-main{display:flex;align-items:center;gap:14px}.slip-logo{max-width:92px;max-height:70px;object-fit:contain}.slip-logo.app-brand-logo{width:210px;max-width:210px;max-height:62px}.slip-brand h1{font:700 27px "Segoe UI",Arial,sans-serif;margin:0}.slip-brand p,.slip-muted{margin:4px 0 0;color:#607080}.slip-header{font-size:18px;font-weight:800;color:var(--accent);margin:20px 0 8px}.slip-order{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0;padding:14px;background:#f3f6f8;border-radius:10px}.slip-order h2{margin:0 0 5px;font:700 21px "Segoe UI",Arial,sans-serif}.slip-order p{margin:3px 0}.slip-message{padding:12px 14px;border-left:4px solid var(--accent);background:#e9fff3;margin:4px 0 16px}.slip-table{width:100%;border-collapse:collapse}.slip-table th{text-align:left;text-transform:uppercase;font-size:10px;letter-spacing:.06em;color:#607080;border-bottom:2px solid #d9e0e6;padding:8px 6px}.slip-table td{padding:9px 6px;border-bottom:1px solid #e2e7eb;vertical-align:middle}.slip-table .price{text-align:right;font-weight:800}.slip-thumb{width:42px;height:42px;object-fit:cover;border-radius:5px}.slip-card-detail{font-size:11px;color:#607080;margin-top:2px}.slip-totals{margin:15px 0 10px auto;width:min(290px,100%)}.slip-total-line{display:flex;justify-content:space-between;padding:4px 0}.slip-total-line.grand{font-size:19px;font-weight:900;border-top:2px solid var(--accent);padding-top:9px;margin-top:5px}.slip-policy{font-size:11px;color:#607080;border-top:1px solid #d9e0e6;padding-top:10px;margin-top:12px}.slip-links{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;margin-top:15px;padding:12px;border-radius:10px;background:#f3f6f8}.slip-links img{width:92px;height:92px}.slip-footer{margin-top:auto;text-align:center;color:#607080;font-size:11px;padding-top:16px}.shipping-label-page{justify-content:center;align-items:center}.shipping-label{width:100%;border:2px solid #172333;border-radius:12px;padding:.35in}.shipping-label h1{font-size:17px;text-transform:uppercase}.shipping-label address{font-size:22px;line-height:1.45;font-style:normal;margin-top:25px}.slip-note{font-style:italic;margin-top:10px;color:#465767}
  .slip-dense{font-size:12px;padding:.3in}.slip-dense .slip-brand h1{font-size:22px}.slip-dense .slip-header{margin:11px 0 5px}.slip-dense .slip-order{margin:8px 0;padding:9px}.slip-dense .slip-message{padding:8px 10px;margin:3px 0 8px}.slip-dense .slip-table td{padding:5px}.slip-dense .slip-thumb{width:34px;height:34px}.slip-dense .slip-totals{margin:8px 0 5px auto}.slip-dense .slip-links{margin-top:7px;padding:7px}.slip-dense .slip-links img{width:68px;height:68px}.slip-ultra-dense{font-size:10px;padding:.22in}.slip-ultra-dense .slip-brand h1{font-size:18px}.slip-ultra-dense .slip-brand{padding-bottom:7px}.slip-ultra-dense .slip-header{font-size:14px;margin:7px 0 3px}.slip-ultra-dense .slip-order{margin:5px 0;padding:6px}.slip-ultra-dense .slip-order h2{font-size:16px}.slip-ultra-dense .slip-message{padding:5px 8px;margin:2px 0 5px}.slip-ultra-dense .slip-table td{padding:3px}.slip-ultra-dense .slip-thumb{width:28px;height:28px}.slip-ultra-dense .slip-totals{margin:5px 0 3px auto}.slip-ultra-dense .slip-links{margin-top:4px;padding:5px}.slip-ultra-dense .slip-links img{width:52px;height:52px}.slip-ultra-dense .slip-policy,.slip-ultra-dense .slip-footer{padding-top:5px;margin-top:5px}
  @media print{.slip-page{break-after:page}.slip-page:last-child{break-after:auto}}
`;

function packingQrValue(design) {
  if (design.qrType === "none") return "";
  return ({ social: design.socialLink, payment: design.paymentLink, feedback: design.feedbackLink, upcoming: design.upcomingLink, custom: design.qrUrl })[design.qrType] || design.qrUrl || "";
}

async function buildPackingSlip(buyer, design = ensurePackingSettings()) {
  const sale = activeSale();
  const cards = cardsForBuyer(buyer);
  const order = orderFor(buyer);
  const profile = buyerProfile(buyer);
  order.orderNumber ||= `${String(sale.name || "SALE").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}-${String(buyers().indexOf(buyer) + 1).padStart(3, "0")}`;
  const subtotal = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const shipping = shippingAmount(order);
  const discount = Number(order.discount || 0);
  const total = subtotal + shipping - discount;
  const logoData = design.logoPath ? await window.cardSale.packingFileDataUrl(design.logoPath) : design.brandName === "Card Sale Manager" ? BUILT_IN_BRAND_LOGO : "";
  const qrValue = packingQrValue(design);
  const qrData = qrValue ? await window.cardSale.packingQrDataUrl(qrValue, design.accent) : "";
  const thumbData = design.showThumbnails ? await Promise.all(cards.map((card) => card.imagePath ? window.cardSale.packingFileDataUrl(card.imagePath) : Promise.resolve(""))) : [];
  const appBrand = !design.logoPath && design.brandName === "Card Sale Manager";
  const brand = `<section class="slip-brand"><div class="slip-brand-main">${logoData ? `<img class="slip-logo${appBrand ? " app-brand-logo" : ""}" src="${logoData}" alt="" />` : ""}${appBrand ? "" : `<div><h1>${escapeHtml(design.brandName || sale.name)}</h1><p>${escapeHtml(design.contact || "")}</p></div>`}</div><div class="slip-muted">${escapeHtml(sale.name)}</div></section>${design.header ? `<div class="slip-header">${escapeHtml(design.header)}</div>` : ""}`;
  const buyerBlock = `<section class="slip-order"><div><h2>${escapeHtml(buyer)}</h2>${design.showAddress ? `<p>${escapeHtml(profile.address || "Address not entered").replace(/\n/g, "<br>")}</p>` : ""}</div><div>${design.showOrderNumber ? `<p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>` : ""}${design.showPayment ? `<p><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || "Not recorded")}</p>` : ""}${design.showShipping ? `<p><strong>Shipping:</strong> ${escapeHtml(order.shippingMethod || "")}</p>` : ""}<p><strong>Cards:</strong> ${cards.length}</p></div></section>`;
  const message = design.thanks || order.packingSlipNote ? `<section class="slip-message">${escapeHtml(design.thanks || "")}${order.packingSlipNote ? `<div class="slip-note">${escapeHtml(order.packingSlipNote)}</div>` : ""}</section>` : "";
  const items = `<table class="slip-table"><thead><tr>${design.showThumbnails ? "<th></th>" : ""}<th>Ref</th><th>Card</th>${design.showPrices ? "<th class=\"price\">Price</th>" : ""}</tr></thead><tbody>${cards.map((card, index) => `<tr>${design.showThumbnails ? `<td>${thumbData[index] ? `<img class="slip-thumb" src="${thumbData[index]}" alt="" />` : ""}</td>` : ""}<td><strong>${escapeHtml(card.ref)}</strong></td><td><strong>${escapeHtml(card.year)} ${escapeHtml(card.set)} ${escapeHtml(numberLabel(card))} ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</strong>${design.showDetails ? `<div class="slip-card-detail">${[card.condition, card.notes && String(card.notes).toLowerCase() !== "none" ? card.notes : ""].filter(Boolean).map(escapeHtml).join(" · ")}</div>` : ""}</td>${design.showPrices ? `<td class="price">${money(card.claimPrice ?? card.price)}</td>` : ""}</tr>`).join("")}</tbody></table>`;
  const totals = design.showPrices ? `<section class="slip-totals"><div class="slip-total-line"><span>Cards</span><strong>${money(subtotal)}</strong></div><div class="slip-total-line"><span>${escapeHtml(order.shippingMethod || "Shipping")}</span><strong>${money(shipping)}</strong></div>${discount ? `<div class="slip-total-line"><span>Discount</span><strong>−${money(discount)}</strong></div>` : ""}<div class="slip-total-line grand"><span>Total</span><span>${money(total)}</span></div></section>` : "";
  const policy = design.returnPolicy ? `<section class="slip-policy"><strong>Questions or concerns?</strong><br>${escapeHtml(design.returnPolicy)}</section>` : "";
  const qr = qrData || design.socialLink ? `<section class="slip-links"><div><strong>Stay connected</strong>${design.socialLink ? `<p>${escapeHtml(design.socialLink)}</p>` : ""}${qrValue ? `<p class="slip-muted">Scan to open ${escapeHtml(design.qrType === "social" ? "our page" : design.qrType)}.</p>` : ""}</div>${qrData ? `<img src="${qrData}" alt="QR code" />` : ""}</section>` : "";
  const footer = design.footer ? `<footer class="slip-footer">${escapeHtml(design.footer)}</footer>` : "";
  const sectionHtml = { header: brand, buyer: buyerBlock, message, items, totals, policy, qr, footer };
  const densityClass = cards.length > 16 ? " slip-ultra-dense" : cards.length > 8 ? " slip-dense" : "";
  let html = `<article class="slip-page${densityClass}">${design.sectionOrder.map((id) => sectionHtml[id] || "").join("")}</article>`;
  if (design.includeLabel && profile.address) html += `<article class="slip-page shipping-label-page"><section class="shipping-label"><h1>Ship to</h1><address><strong>${escapeHtml(buyer)}</strong><br>${escapeHtml(profile.address).replace(/\n/g, "<br>")}</address><p>${escapeHtml(order.shippingMethod || "")} · ${cards.length} card${cards.length === 1 ? "" : "s"} · ${escapeHtml(order.orderNumber)}</p></section></article>`;
  return { html, total, cards: cards.length, orderNumber: order.orderNumber };
}

function recordPackingPrint(buyer, action, details = {}) {
  const order = orderFor(buyer);
  const at = new Date().toISOString();
  order.packingSlipPrintCount = Number(order.packingSlipPrintCount || 0) + 1;
  order.packingSlipPrintedAt = at;
  state.packingPrintHistory.unshift({ id: uid(), at, buyer, saleId: activeSale().id, action, count: order.packingSlipPrintCount, ...details });
  if (state.packingPrintHistory.length > 250) state.packingPrintHistory.length = 250;
  recordAudit("packing-slip", `${action === "pdf" ? "Exported" : "Printed"} packing slip for ${buyer}`, { buyer });
}

async function outputPackingSlips(names, action = "print", design = ensurePackingSettings(), testOnly = false) {
  if (!names.length) return toast("Choose at least one buyer.");
  const slips = await Promise.all(names.map((buyer) => buildPackingSlip(buyer, design)));
  const accent = /^#[0-9a-f]{6}$/i.test(design.accent) ? design.accent : "#19b56b";
  const twoUpStyles = design.pageSize === "two-up" ? `.slip-page{min-height:5.5in;height:5.5in;padding:.24in;page-break-after:auto;overflow:hidden}.slip-page:nth-child(2n){page-break-after:always}.slip-brand h1{font-size:21px}.slip-order{margin:9px 0;padding:9px}.slip-table td{padding:5px}.slip-links{margin-top:7px;padding:7px}.slip-links img{width:68px;height:68px}` : "";
  const payload = { title: names.length === 1 ? `${names[0]} packing slip` : `${activeSale().name} packing slips`, html: slips.map((slip) => slip.html).join(""), styles: `${PACKING_PRINT_STYLES.replaceAll("var(--accent)", accent)}${twoUpStyles}`, pageSize: design.pageSize };
  const result = action === "preview" ? await window.cardSale.previewPackingSlip(payload) : action === "pdf" ? await window.cardSale.exportPackingPdf(payload) : await window.cardSale.printPackingSlip(payload);
  if (!result?.success) return result?.canceled ? null : toast(action === "preview" ? "The PDF preview could not be opened." : "The packing slips were not printed.");
  if (!testOnly && action !== "preview") names.forEach((buyer) => recordPackingPrint(buyer, action, { pageSize: design.pageSize }));
  saveSoon(); renderPacking();
  toast(action === "preview" ? "Packing-slip preview opened in your PDF viewer." : action === "pdf" ? "Combined packing-slip PDF saved." : `${names.length} packing slip${names.length === 1 ? "" : "s"} sent to the printer.`);
  return result;
}

async function printPackingSlip(buyer) { return outputPackingSlips([buyer]); }

function readPackingDesignerForm() {
  const draft = packingDesignerDraft || clone(ensurePackingSettings());
  const field = (id) => $(id).value.trim();
  Object.assign(draft, {
    name: field("#packingTemplateName") || "Packing slip template", pageSize: $("#packingPageSize").value, accent: $("#packingAccent").value,
    brandName: field("#packingBrandName"), contact: field("#packingContact"), socialLink: field("#packingSocialLink"), qrType: $("#packingQrType").value, qrUrl: field("#packingQrUrl"),
    paymentLink: field("#packingPaymentLink"), feedbackLink: field("#packingFeedbackLink"), upcomingLink: field("#packingUpcomingLink"), header: field("#packingHeader"), thanks: field("#packingThanks"), returnPolicy: field("#packingReturnPolicy"), footer: field("#packingFooter"),
    showAddress: $("#packingShowAddress").checked, showOrderNumber: $("#packingShowOrderNumber").checked, showPayment: $("#packingShowPayment").checked, showShipping: $("#packingShowShipping").checked,
    showPrices: $("#packingShowPrices").checked, showDetails: $("#packingShowDetails").checked, showThumbnails: $("#packingShowThumbnails").checked, includeLabel: $("#packingIncludeLabel").checked
  });
  packingDesignerDraft = draft;
  return draft;
}

function populatePackingDesigner(design = ensurePackingSettings(), selectedId = "") {
  packingDesignerDraft = clone(design);
  $("#packingTemplateSelect").innerHTML = `<option value="">Current active design</option>${state.packingTemplates.map((template) => `<option value="${template.id}" ${template.id === selectedId ? "selected" : ""}>${escapeHtml(template.name)}</option>`).join("")}`;
  const values = { packingTemplateName: design.name, packingPageSize: design.pageSize, packingAccent: design.accent, packingBrandName: design.brandName, packingContact: design.contact, packingSocialLink: design.socialLink, packingQrType: design.qrType, packingQrUrl: design.qrUrl, packingPaymentLink: design.paymentLink, packingFeedbackLink: design.feedbackLink, packingUpcomingLink: design.upcomingLink, packingHeader: design.header, packingThanks: design.thanks, packingReturnPolicy: design.returnPolicy, packingFooter: design.footer };
  Object.entries(values).forEach(([id, value]) => { $(`#${id}`).value = value || ""; });
  const checks = { packingShowAddress: design.showAddress, packingShowOrderNumber: design.showOrderNumber, packingShowPayment: design.showPayment, packingShowShipping: design.showShipping, packingShowPrices: design.showPrices, packingShowDetails: design.showDetails, packingShowThumbnails: design.showThumbnails, packingIncludeLabel: design.includeLabel };
  Object.entries(checks).forEach(([id, value]) => { $(`#${id}`).checked = Boolean(value); });
  $("#packingLogoStatus").textContent = design.logoPath || (design.brandName === "Card Sale Manager" ? "Built-in Card Sale Manager logo" : "No logo selected");
  $("#deletePackingTemplateBtn").disabled = !selectedId;
  renderPackingSectionOrder();
  return updatePackingPreview();
}

function renderPackingSectionOrder() {
  const design = packingDesignerDraft || ensurePackingSettings();
  $("#packingSectionOrder").innerHTML = design.sectionOrder.map((id) => `<div class="section-order-item" draggable="true" data-packing-section="${id}"><span>☰ ${escapeHtml(PACKING_SECTIONS.find(([key]) => key === id)?.[1] || id)}</span><small>Drag to reorder</small></div>`).join("");
}

async function updatePackingPreview() {
  const buyer = $("#packingBuyer").value || buyers()[0];
  if (!buyer || !$("#packingSlipPreview")) return;
  const design = readPackingDesignerForm();
  const previewAccent = /^#[0-9a-f]{6}$/i.test(design.accent) ? design.accent : "#19b56b";
  packingPreviewSheet?.replaceSync(`#packingSlipPreview{--accent:${previewAccent}}`);
  $("#packingPreviewBuyer").textContent = buyer;
  const slip = await buildPackingSlip(buyer, design);
  $("#packingSlipPreview").innerHTML = slip.html;
}

async function openPackingDesigner() {
  ensurePackingSettings();
  await populatePackingDesigner(ensurePackingSettings());
  $("#packingDesignerDialog").showModal();
}

function packingFilteredBuyers() {
  const status = $("#packingBulkStatus")?.value || "all";
  const shipping = $("#packingBulkShipping")?.value || "all";
  const printed = $("#packingBulkPrinted")?.value || "all";
  const requireAddress = Boolean($("#packingBulkRequireAddress")?.checked);
  const sort = $("#packingBulkSort")?.value || "buyer";
  const list = buyers().filter((buyer) => {
    const order = orderFor(buyer); const cards = cardsForBuyer(buyer); const fullyPacked = cards.length && cards.every((card) => card.packed);
    if (status === "paid" && order.status !== "paid") return false;
    if (status === "unpaid" && ["paid", "packed", "shipped"].includes(order.status)) return false;
    if (status === "packed" && !fullyPacked) return false;
    if (status === "unpacked" && fullyPacked) return false;
    if (shipping !== "all" && order.shippingMethod !== shipping) return false;
    if (printed === "unprinted" && order.packingSlipPrintCount) return false;
    if (printed === "reprints" && !order.packingSlipPrintCount) return false;
    return !requireAddress || Boolean(buyerProfile(buyer).address);
  });
  return list.sort((a, b) => {
    if (sort === "shipping") return String(orderFor(a).shippingMethod).localeCompare(String(orderFor(b).shippingMethod)) || a.localeCompare(b);
    if (sort === "packing") return cardsForBuyer(b).filter((card) => card.packed).length - cardsForBuyer(a).filter((card) => card.packed).length;
    if (sort === "claim") return String(cardsForBuyer(a).map((card) => card.claimedAt).filter(Boolean).sort()[0] || "").localeCompare(String(cardsForBuyer(b).map((card) => card.claimedAt).filter(Boolean).sort()[0] || ""));
    return a.localeCompare(b);
  });
}

function renderPackingBulk() {
  const names = packingFilteredBuyers();
  packingBulkSelection = new Set([...packingBulkSelection].filter((name) => names.includes(name)));
  $("#packingBulkCount").textContent = `${packingBulkSelection.size} selected · ${names.length} shown`;
  $("#packingBulkSelectAll").checked = names.length > 0 && names.every((name) => packingBulkSelection.has(name));
  $("#packingBulkBuyers").innerHTML = names.length ? names.map((buyer) => { const order = orderFor(buyer); const cards = cardsForBuyer(buyer); const packed = cards.filter((card) => card.packed).length; return `<label class="packing-buyer-row"><input type="checkbox" data-packing-buyer="${escapeHtml(buyer)}" ${packingBulkSelection.has(buyer) ? "checked" : ""} /><span><strong>${escapeHtml(buyer)}</strong><small>${cards.length} cards · ${packed}/${cards.length} packed${buyerProfile(buyer).address ? "" : " · Missing address"}</small></span><span>${escapeHtml(order.shippingMethod)}</span><span>${order.packingSlipPrintCount ? `Printed ${order.packingSlipPrintCount}×` : "New"}</span></label>`; }).join("") : `<div class="empty-state"><p>No orders match these filters.</p></div>`;
}

function renderPackingHistory() {
  const saleId = activeSale().id;
  const history = (state.packingPrintHistory || []).filter((item) => item.saleId === saleId);
  $("#packingPrintHistory").innerHTML = history.length ? history.map((item) => `<article><strong>${escapeHtml(item.buyer)}</strong><span>${item.action === "pdf" ? "PDF" : item.count > 1 ? "Reprint" : "Printed"}</span><small>${new Date(item.at).toLocaleString()} · ${escapeHtml(item.pageSize || "letter")}</small><small>Print #${item.count}</small></article>`).join("") : `<div class="empty-state"><h3>No slips printed yet</h3><p>Successful prints and PDF exports will be recorded here.</p></div>`;
}

function saleIntroduction(template = ensureSaleIntroTemplate()) {
  const sale = activeSale();
  const years = sale.cards.map((card) => Number(card.year)).filter(Number.isFinite).sort((a, b) => a - b);
  const yearRange = !years.length ? "a variety of years" : years[0] === years.at(-1) ? String(years[0]) : `${years[0]}–${years.at(-1)}`;
  const values = { saleName: sale.name, cardCount: String(sale.cards.length), yearRange, pwePrice: money(sale.pweShipping), pmwtPrice: money(sale.pmwtShipping), claimWords: claimWords().slice(0, 4).join(", ") };
  return String(template || DEFAULT_SALE_INTRO).replace(/\{(saleName|cardCount|yearRange|pwePrice|pmwtPrice|claimWords)\}/g, (_match, key) => values[key] ?? "").trim();
}

function openSaleIntroduction() {
  $("#saleIntroTemplate").value = ensureSaleIntroTemplate();
  $("#saleIntroPreview").value = saleIntroduction();
  $("#saleIntroDialog").showModal();
}

function currentImportMapping() { return Object.fromEntries($$("[data-map]").map((select) => [select.dataset.map, select.value])); }

function renderImportPresetOptions(selectedId = "") {
  $("#importPresetSelect").innerHTML = `<option value="">Automatic mapping</option>${importPresets().map((preset) => `<option value="${preset.id}" ${preset.id === selectedId ? "selected" : ""}>${escapeHtml(preset.name)}</option>`).join("")}`;
  $("#deleteImportPresetBtn").disabled = !selectedId;
}

function applyImportPreset(id) {
  const preset = importPresets().find((item) => item.id === id);
  if (!preset || !pendingSheet) return;
  $$('[data-map]').forEach((select) => { select.value = pendingSheet.headers.includes(preset.mapping[select.dataset.map]) ? preset.mapping[select.dataset.map] : ""; });
  if (preset.template) $("#listingTemplate").value = preset.template;
  updateImportPreview();
}

const PWE_LABEL_STYLES = `body{margin:0;background:#fff;color:#172333;font-family:"Segoe UI",Arial,sans-serif}.pwe-print-label{width:4in;height:6in;padding:.23in;display:flex;flex-direction:column;border:0;page-break-after:always;overflow:hidden}.pwe-print-label.landscape{width:6in;height:4in}.pwe-print-label.padding-tight{padding:.15in}.pwe-print-label.padding-roomy{padding:.32in}.pwe-print-label.font-classic{font-family:Georgia,"Times New Roman",serif}.pwe-print-label.font-typewriter{font-family:Consolas,"Courier New",monospace}.pwe-print-label:last-child{page-break-after:auto}.pwe-return{font-size:11px;line-height:1.35;border-bottom:2px solid var(--label-accent);padding-bottom:10px}.pwe-heading{text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:900;color:var(--label-accent);margin:28px 0 10px}.pwe-recipient{font-size:22px;line-height:1.42;font-style:normal;font-weight:600;white-space:pre-line}.align-center .pwe-heading,.align-center .pwe-recipient{text-align:center}.pwe-order{margin-top:18px;padding:9px;border:1px solid #ccd4dc;border-radius:7px;font-size:11px}.pwe-footer{margin-top:auto;border-top:3px solid var(--label-accent);padding-top:10px;text-align:center;font-weight:800;font-size:12px}.pwe-print-label.compact .pwe-recipient{font-size:18px}.pwe-print-label.large .pwe-recipient{font-size:26px}.pwe-print-label.landscape .pwe-heading{margin-top:15px}.pwe-print-label.landscape .pwe-recipient{line-height:1.25}.pwe-print-label.landscape .pwe-order{margin-top:10px}`;

function readPweLabelForm() {
  return { heading: $("#pweLabelHeading").value.trim(), returnName: $("#pweReturnName").value.trim(), returnAddress: $("#pweReturnAddress").value.trim(), footer: $("#pweLabelFooter").value.trim(), accent: $("#pweLabelAccent").value, orientation: $("#pweLabelOrientation").value === "landscape" ? "landscape" : "portrait", size: $("#pweLabelSize").value, font: $("#pweLabelFont").value, alignment: $("#pweLabelAlignment").value, padding: $("#pweLabelPadding").value, showReturn: $("#pweShowReturn").checked, showHeading: $("#pweShowHeading").checked, showOrder: $("#pweShowOrder").checked, showFooter: $("#pweShowFooter").checked };
}

function pweLabelHtml(buyer, settings = ensurePweLabelSettings()) {
  const profile = buyerProfile(buyer); const order = orderFor(buyer); const cards = cardsForBuyer(buyer);
  order.orderNumber ||= `${String(activeSale().name || "SALE").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}-${String(buyers().indexOf(buyer) + 1).padStart(3, "0")}`;
  const orientation = settings.orientation === "landscape" ? "landscape" : "portrait";
  const font = ["classic", "typewriter"].includes(settings.font) ? settings.font : "modern";
  const alignment = settings.alignment === "center" ? "center" : "left";
  const padding = ["tight", "roomy"].includes(settings.padding) ? settings.padding : "standard";
  const returnBlock = settings.showReturn === false ? "" : `<div class="pwe-return"><strong>${escapeHtml(settings.returnName || "Return address")}</strong><br>${escapeHtml(settings.returnAddress || "Add a return address in the label editor").replace(/\n/g, "<br>")}</div>`;
  const headingBlock = settings.showHeading === false ? "" : `<div class="pwe-heading">${escapeHtml(settings.heading || "Please deliver to")}</div>`;
  const orderBlock = settings.showOrder === false ? "" : `<div class="pwe-order">Order ${escapeHtml(order.orderNumber)} · ${cards.length} card${cards.length === 1 ? "" : "s"} · PWE</div>`;
  const footerBlock = settings.showFooter === false ? "" : `<footer class="pwe-footer">${escapeHtml(settings.footer || "")}</footer>`;
  return `<article class="pwe-print-label ${escapeHtml(settings.size || "standard")} ${orientation} font-${font} align-${alignment} padding-${padding}">${returnBlock}${headingBlock}<address class="pwe-recipient"><strong>${escapeHtml(buyer)}</strong>\n${escapeHtml(profile.address || "Address not entered")}</address>${orderBlock}${footerBlock}</article>`;
}

function updatePweLabelPreview() {
  const buyer = $("#packingBuyer").value || buyers()[0] || "Sample Buyer";
  const accent = /^#[0-9a-f]{6}$/i.test($("#pweLabelAccent").value) ? $("#pweLabelAccent").value : "#172333";
  pwePreviewSheet?.replaceSync(`#pweLabelPreview{--label-accent:${accent}}`);
  $("#pweLabelPreview").classList.toggle("landscape", $("#pweLabelOrientation").value === "landscape");
  $("#pwePreviewBuyer").textContent = buyer;
  $("#pweLabelPreview").innerHTML = pweLabelHtml(buyer, readPweLabelForm());
}

function openPweLabelDesigner() {
  const settings = ensurePweLabelSettings();
  $("#pweLabelHeading").value = settings.heading || ""; $("#pweReturnName").value = settings.returnName || ""; $("#pweReturnAddress").value = settings.returnAddress || ""; $("#pweLabelFooter").value = settings.footer || ""; $("#pweLabelAccent").value = settings.accent || "#172333"; $("#pweLabelOrientation").value = settings.orientation === "landscape" ? "landscape" : "portrait"; $("#pweLabelSize").value = settings.size || "standard"; $("#pweLabelFont").value = ["classic", "typewriter"].includes(settings.font) ? settings.font : "modern"; $("#pweLabelAlignment").value = settings.alignment === "center" ? "center" : "left"; $("#pweLabelPadding").value = ["tight", "roomy"].includes(settings.padding) ? settings.padding : "standard"; $("#pweShowReturn").checked = settings.showReturn !== false; $("#pweShowHeading").checked = settings.showHeading !== false; $("#pweShowOrder").checked = settings.showOrder !== false; $("#pweShowFooter").checked = settings.showFooter !== false;
  updatePweLabelPreview(); $("#pweLabelDialog").showModal();
}

async function outputPweLabels(names, action = "print") {
  const valid = names.filter((buyer) => buyerProfile(buyer).address?.trim());
  if (!valid.length) return toast("Add a mailing address before printing a PWE label.");
  const settings = ensurePweLabelSettings();
  const accent = /^#[0-9a-f]{6}$/i.test(settings.accent) ? settings.accent : "#172333";
  const landscape = settings.orientation === "landscape";
  const payload = { title: valid.length === 1 ? `${valid[0]} PWE label` : `${activeSale().name} PWE labels`, html: valid.map((buyer) => pweLabelHtml(buyer, settings)).join(""), styles: PWE_LABEL_STYLES.replaceAll("var(--label-accent)", accent), pageSize: landscape ? "label-landscape" : "label" };
  const result = action === "preview" ? await window.cardSale.previewPackingSlip(payload) : await window.cardSale.printPackingSlip(payload);
  if (!result?.success) return toast(action === "preview" ? "The PWE label preview could not be opened." : "The PWE labels were not printed.");
  toast(action === "preview" ? "PWE label preview opened." : `${valid.length} PWE label${valid.length === 1 ? "" : "s"} sent to the printer.`);
}

const WALKTHROUGH_STEPS = [
  { title: "Welcome to Card Sale Manager", body: "Post. Sell. Track. The Command Center is your daily checklist from first claim to final shipment.", tips: ["Green actions move work forward", "Amber and red are reserved for items needing attention"], image: "assets/brand-logo-dark.svg", view: "command" },
  { title: "Import and prepare listings", body: "Import your spreadsheet, choose a saved column preset, review warnings, and match each card to its image.", tips: ["Purchase data stays private", "Copying text and dragging an image are separate actions"], image: "assets/help/workspace.png", view: "sale" },
  { title: "Record claims and offers", body: "Claims Desk contains every sale card. Assign a buyer, record an offer, or paste comments into the parser.", tips: ["Accepted offers become orders", "Audit timestamps preserve what happened"], image: "assets/help/offers.png", view: "claims" },
  { title: "Confirm buyer orders", body: "Choose shipping, validate the mailing address, record payment, and copy the buyer summary.", tips: ["PWE or PMWT can be overridden", "Costs never appear in customer messages"], image: "assets/help/orders.png", view: "orders" },
  { title: "Pack and print", body: "Check cards as they are packed, preview packing slips, print PWE thermal labels, and add tracking.", tips: ["Packed buyers are marked in the menu", "Print previews use the final PDF layout"], image: "assets/help/packing.png", view: "packing" },
  { title: "Your work is protected", body: "The green indicator confirms a local save. Daily rotating backups and pre-update backups protect your sales.", tips: ["Open the data folder from the sidebar", "Anonymous diagnostics contain no buyer or card details"], image: "assets/brand-logo-dark.svg", view: "help" }
];

function renderWalkthrough() {
  const step = WALKTHROUGH_STEPS[walkthroughStep];
  $("#walkthroughTitle").textContent = step.title; $("#walkthroughBody").textContent = step.body; $("#walkthroughCounter").textContent = `${walkthroughStep + 1} of ${WALKTHROUGH_STEPS.length}`; $("#walkthroughImage").src = step.image; $("#walkthroughTips").innerHTML = step.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join(""); $("#walkthroughBackBtn").disabled = walkthroughStep === 0; $("#walkthroughNextBtn").textContent = walkthroughStep === WALKTHROUGH_STEPS.length - 1 ? "Finish" : "Next";
}

function openWalkthrough() { walkthroughStep = 0; renderWalkthrough(); $("#walkthroughDialog").showModal(); }

function renderSetupStep() {
  $$('[data-setup-step]').forEach((section, index) => section.classList.toggle("hidden", index !== setupStep));
  $("#setupStepLabel").textContent = `Step ${setupStep + 1} of 3`; $("#setupProgress").value = setupStep + 1; $("#setupBackBtn").disabled = setupStep === 0; $("#setupNextBtn").textContent = setupStep === 2 ? "Finish setup" : "Next";
}

function openSetupWizard() {
  setupStep = 0; const sale = activeSale(); $("#setupSellerName").value = state.preferences?.sellerName || ""; $("#setupPwePrice").value = sale.pweShipping ?? 1; $("#setupPmwtPrice").value = sale.pmwtShipping ?? 5; $("#setupImageFolder").value = lookupSettings().primaryFolder || ""; renderSetupStep(); $("#setupWizardDialog").showModal();
}

async function diagnosticReport() {
  const description = scrubDiagnosticText($("#diagnosticDescription")?.value.trim() || "");
  const nativeEvents = await window.cardSale.nativeDiagnosticEvents();
  return { reportVersion: 2, appVersion: installedVersion, description, preferences: { theme: state.preferences?.theme, compact: Boolean(state.preferences?.compact), reducedMotion: Boolean(state.preferences?.reducedMotion) }, totals: { sales: state.sales.length, cards: state.sales.reduce((sum, sale) => sum + sale.cards.length, 0), buyerProfiles: Object.keys(state.buyerProfiles || {}).length, importPresets: importPresets().length }, activeSale: { cards: activeSale().cards.length, images: activeSale().images.length, orders: Object.keys(activeSale().orders || {}).length, pendingOffers: activeSale().cards.filter((card) => card.claimType === "offer" && ["pending", "countered"].includes(card.offerStatus || "pending")).length, healthIssues: healthIssues().length }, recentErrors: runtimeErrors.slice(-10), nativeEvents };
}

function openDiagnosticDialog() {
  $("#diagnosticDescription").value = "";
  $("#diagnosticSummary").innerHTML = `<strong>Privacy check</strong><span>Buyer names: excluded</span><span>Addresses: excluded</span><span>Card details and prices: excluded</span><span>Image and folder paths: excluded</span>`;
  $("#diagnosticDialog").showModal();
}

async function checkForUpdates(manual = false) {
  if (manual) {
    $("#updateTitle").textContent = "Checking for updates…";
    $("#updateMessage").textContent = "Contacting GitHub.";
    $("#updateNotes").classList.add("hidden");
    $("#downloadUpdateBtn").classList.add("hidden");
    $("#updateDialog").showModal();
  }
  const result = await window.cardSale.checkForUpdate();
  if (result.status === "available") {
    availableUpdate = result;
    $("#checkUpdateBtn").textContent = `Update ${result.version} available`;
    $("#checkUpdateBtn").classList.add("update-available");
    $("#updateTitle").textContent = `Version ${result.version} is available`;
    $("#updateMessage").textContent = `You are using version ${result.currentVersion}. Confirm once and the app will download ${result.assetName}, install it, and restart with the update.`;
    $("#updateNotes").textContent = result.notes || "A newer Card Sale Manager release is available.";
    $("#updateNotes").classList.remove("hidden");
    $("#downloadUpdateBtn").classList.remove("hidden");
    if (!$("#updateDialog").open) $("#updateDialog").showModal();
    return;
  }
  if (!manual) return;
  availableUpdate = null;
  $("#updateTitle").textContent = result.status === "current" ? "You’re up to date" : "No update available";
  $("#updateMessage").textContent = result.status === "current"
    ? `Card Sale Manager ${result.currentVersion} is the latest release.`
    : (result.message || (result.status === "unavailable" ? "No installable GitHub update is available yet." : "The update check could not be completed."));
}

function openBulkEdit() {
  if (!selectedListingIds.size) return;
  $("#bulkEditCount").textContent = `${selectedListingIds.size} selected card${selectedListingIds.size === 1 ? "" : "s"}. Blank fields will remain unchanged.`;
  ["#bulkYear", "#bulkBrand", "#bulkGrade", "#bulkFlaws", "#bulkPrice", "#bulkPricePercent"].forEach((selector) => $(selector).value = "");
  $("#bulkEditDialog").showModal();
}

function applyBulkEdit() {
  const cards = activeSale().cards.filter((card) => selectedListingIds.has(card.id));
  if (!cards.length) return;
  snapshotSale(`Before bulk editing ${cards.length} cards`);
  const fields = [["year", "#bulkYear"], ["set", "#bulkBrand"], ["condition", "#bulkGrade"], ["notes", "#bulkFlaws"]];
  fields.forEach(([field, selector]) => { const value = $(selector).value.trim(); if (value !== "") cards.forEach((card) => card[field] = value); });
  const exact = $("#bulkPrice").value;
  const percent = $("#bulkPricePercent").value;
  if (exact !== "") cards.forEach((card) => card.price = Math.max(0, Number(exact) || 0));
  else if (percent !== "") cards.forEach((card) => card.price = Math.max(0, Math.round(Number(card.price) * (1 + Number(percent) / 100) * 100) / 100));
  recordAudit("bulk-edit", `Bulk edited ${cards.length} cards`);
  $("#bulkEditDialog").close();
  saveSoon(); render(); toast(`${cards.length} cards updated.`);
}

function openCarryover() {
  const unsold = activeSale().cards.filter((card) => card.status === "available" && (!selectedListingIds.size || selectedListingIds.has(card.id)));
  $("#carryoverCount").textContent = `${unsold.length} unsold card${unsold.length === 1 ? "" : "s"} will be copied with their images and private purchase information.`;
  $("#carryoverDestination").innerHTML = `<option value="">Choose an existing sale</option>${state.sales.filter((sale) => sale.id !== activeSale().id).map((sale) => `<option value="${sale.id}">${escapeHtml(sale.name)}</option>`).join("")}`;
  $("#carryoverNewSale").value = "";
  $("#carryoverPricePercent").value = "0";
  $("#carryoverDialog").showModal();
}

function applyCarryover() {
  const source = activeSale();
  const cards = source.cards.filter((card) => card.status === "available" && (!selectedListingIds.size || selectedListingIds.has(card.id)));
  if (!cards.length) return toast("No unsold cards are selected.");
  let destination = state.sales.find((sale) => sale.id === $("#carryoverDestination").value);
  const newName = $("#carryoverNewSale").value.trim();
  if (newName) {
    destination = { id: uid(), name: newName, pweShipping: source.pweShipping, pmwtShipping: source.pmwtShipping, template: source.template, cards: [], images: [], orders: {}, versions: [], audit: [] };
    state.sales.push(destination);
  }
  if (!destination) return toast("Choose a destination or enter a new sale name.");
  snapshotSale(`Before receiving ${cards.length} carryover cards`, destination);
  const percent = Number($("#carryoverPricePercent").value || 0);
  const start = destination.cards.length;
  const usedDestinationImages = new Set(destination.cards.filter((card) => card.imagePath).map((card) => card.imagePath.toLowerCase()));
  cards.forEach((card, index) => {
    const copy = clone(card);
    copy.id = uid(); copy.ref = String(start + index + 1); copy.sourceOrder = start + index + 1; copy.customOrder = start + index + 1;
    copy.price = Math.max(0, Math.round(Number(copy.price) * (1 + percent / 100) * 100) / 100);
    copy.status = "available";
    ["buyer", "claimPrice", "offerPrice", "claimedAt", "claimUpdatedAt", "claimType", "claimNote", "packed", "hiddenAfterCopy", "completedBy", "completedAt"].forEach((key) => delete copy[key]);
    if (copy.imagePath) {
      const imageKey = copy.imagePath.toLowerCase();
      if (usedDestinationImages.has(imageKey)) copy.imagePath = "";
      else usedDestinationImages.add(imageKey);
    }
    destination.cards.push(copy);
    if (copy.imagePath && !destination.images.some((image) => image.path.toLowerCase() === copy.imagePath.toLowerCase())) destination.images.push({ id: uid(), path: copy.imagePath, name: copy.imagePath.split(/[\\/]/).pop() });
  });
  recordAudit("carryover", `Received ${cards.length} unsold cards from ${source.name}`, {}, destination);
  $("#carryoverDialog").close(); selectedListingIds.clear(); saveSoon(); render(); toast(`${cards.length} cards carried into ${destination.name}.`);
}

function parseClaimComments() {
  const configuredWords = $("#claimWordsInput").value.split(",").map((word) => word.trim().toLowerCase()).filter(Boolean);
  state.preferences.claimWords = configuredWords.length ? [...new Set(configuredWords)] : [...DEFAULT_CLAIM_WORDS];
  const escapedWords = [...claimWords(), "offer"].map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const claimPattern = new RegExp(`\\b(?:${escapedWords.join("|")})\\b`, "i");
  const refPattern = new RegExp(`(?:${escapedWords.join("|")})\\s*(?:card\\s*)?#?\\s*(\\d+)`, "i");
  const stripPattern = new RegExp(`\\b(?:${escapedWords.join("|")})\\b[\\s:#-]*(?:card\\s*)?#?\\s*\\d+.*$`, "i");
  const lines = $("#claimComments").value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  parsedClaimMatches = lines.map((line, index) => {
    const refMatch = line.match(refPattern) || (claimPattern.test(line) ? line.match(/#(\d+)/) : null);
    const type = /\boffer\b/i.test(line) ? "offer" : "claim";
    const priceMatch = type === "offer" ? line.match(/\$\s*(\d+(?:\.\d{1,2})?)/) : null;
    const card = refMatch ? activeSale().cards.find((item) => String(item.ref) === String(Number(refMatch[1]))) : null;
    let buyer = line.replace(stripPattern, "").replace(/^\s*\d+\s*[-:]\s*/, "").trim().replace(/[:\-]+$/, "").trim();
    if (!buyer && claimPattern.test(line) && line.includes(":")) buyer = line.split(":")[0].trim();
    return { id: `parsed-${index}`, line, card, buyer, type, price: priceMatch ? Number(priceMatch[1]) : "", valid: Boolean(card && buyer && (type !== "offer" || priceMatch)) };
  });
  $("#claimParseResults").innerHTML = parsedClaimMatches.length ? `<table><thead><tr><th>Comment</th><th>Card</th><th>Buyer</th><th>Result</th></tr></thead><tbody>${parsedClaimMatches.map((match) => `<tr><td>${escapeHtml(match.line)}</td><td>${match.card ? `${escapeHtml(match.card.ref)} · ${escapeHtml(match.card.name)}` : "Not found"}</td><td>${escapeHtml(match.buyer || "Missing")}</td><td class="${match.valid ? "valid-text" : "cost-warning"}">${match.valid ? `${match.type}${match.type === "offer" ? ` ${money(match.price)}` : ""}` : "Needs review"}</td></tr>`).join("")}</tbody></table>` : `<p>No comment lines found.</p>`;
  $("#applyParsedClaimsBtn").disabled = !parsedClaimMatches.some((match) => match.valid);
  activeSale().unrecognizedComments = [...new Set([...(activeSale().unrecognizedComments || []), ...parsedClaimMatches.filter((match) => !match.valid).map((match) => match.line)])];
  renderUnrecognizedComments(); saveSoon();
}

function renderUnrecognizedComments() {
  const queue = activeSale().unrecognizedComments || [];
  $("#unrecognizedComments").innerHTML = queue.length ? `<div class="queue-heading"><div><strong>Unrecognized-comment queue</strong><small>${queue.length} comment${queue.length === 1 ? "" : "s"} need manual review.</small></div><button type="button" class="row-action danger-link" data-clear-unrecognized>Clear queue</button></div>${queue.map((line, index) => `<article><span>${escapeHtml(line)}</span><div><button type="button" class="row-action" data-retry-comment="${index}">Move to editor</button><button type="button" class="row-action danger-link" data-remove-comment="${index}">Dismiss</button></div></article>`).join("")}` : `<div class="queue-empty">No unrecognized comments.</div>`;
}

function applyParsedClaims() {
  const valid = parsedClaimMatches.filter((match) => match.valid);
  if (!valid.length) return;
  snapshotSale(`Before applying ${valid.length} parsed claims`);
  valid.forEach((match) => {
    const card = match.card;
    card.status = match.type === "offer" ? "offered" : "claimed"; card.buyer = match.buyer; card.claimType = match.type; card.claimedAt ||= new Date().toISOString(); card.claimUpdatedAt = new Date().toISOString();
    if (match.type === "offer") {
      card.offerPrice = match.price; card.offerStatus = "pending"; card.offerReceivedAt = new Date().toISOString(); delete card.claimPrice; delete card.counterPrice; delete card.counteredAt;
    } else {
      card.claimPrice = Number(card.price); delete card.offerPrice; delete card.offerStatus; delete card.counterPrice; orderFor(match.buyer);
    }
    recordAudit(match.type, `${match.type === "offer" ? "Offer" : "Claim"} parsed for ${card.ref} · ${card.name}`, { cardId: card.id, buyer: match.buyer });
  });
  const applied = new Set(valid.map((match) => match.line)); activeSale().unrecognizedComments = (activeSale().unrecognizedComments || []).filter((line) => !applied.has(line));
  $("#claimParserDialog").close(); saveSoon(); render(); toast(`${valid.length} parsed claims applied. Offers are waiting in the Offers tab.`);
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  $("#commandView").addEventListener("click", (event) => { const view = event.target.closest("[data-command-view]")?.dataset.commandView; if (view) showView(view); });
  $("#refreshCommandBtn").addEventListener("click", renderCommandCenter);
  $("#helpView").addEventListener("click", (event) => { const view = event.target.closest("[data-help-view]")?.dataset.helpView; if (view) showView(view); });
  $("#startWalkthroughBtn").addEventListener("click", openWalkthrough);
  $("#openSetupWizardBtn").addEventListener("click", openSetupWizard);
  $("#saveDiagnosticBtn").addEventListener("click", openDiagnosticDialog);
  $("#saleIntroBtn").addEventListener("click", openSaleIntroduction);
  $("#saleIntroTemplate").addEventListener("input", (event) => { $("#saleIntroPreview").value = saleIntroduction(event.target.value); });
  $("#resetSaleIntroBtn").addEventListener("click", () => { $("#saleIntroTemplate").value = DEFAULT_SALE_INTRO; $("#saleIntroPreview").value = saleIntroduction(DEFAULT_SALE_INTRO); });
  $("#saveSaleIntroBtn").addEventListener("click", () => { state.preferences.saleIntroTemplate = $("#saleIntroTemplate").value.trim() || DEFAULT_SALE_INTRO; saveSoon(); toast("Sale introduction template saved."); });
  $("#copySaleIntroBtn").addEventListener("click", () => { state.preferences.saleIntroTemplate = $("#saleIntroTemplate").value.trim() || DEFAULT_SALE_INTRO; saveSoon(); copyText($("#saleIntroPreview").value, "Sale introduction copied."); });
  $("#offerSearch").addEventListener("input", (event) => { offerDeskSettings().query = event.target.value; saveSoon(); renderOffers(); });
  [["#offerStatusFilter", "status"], ["#offerBuyerFilter", "buyer"], ["#offerMarginFilter", "margin"]].forEach(([selector, key]) => $(selector).addEventListener("change", (event) => { offerDeskSettings()[key] = event.target.value; saveSoon(); renderOffers(); }));
  $("#offersView").addEventListener("click", (event) => {
    const key = event.target.closest("[data-offer-sort]")?.dataset.offerSort;
    if (!key) return;
    const settings = offerDeskSettings();
    settings.sortDirection = settings.sortKey === key ? (settings.sortDirection === "asc" ? "desc" : "asc") : (["card", "buyer", "status"].includes(key) ? "asc" : "desc");
    settings.sortKey = key; saveSoon(); renderOffers();
  });
  $("#offerRows").addEventListener("click", (event) => {
    const acceptId = event.target.dataset.acceptOffer;
    const rejectId = event.target.dataset.rejectOffer;
    const counterId = event.target.dataset.counterOffer;
    if (acceptId) acceptOffer(acceptId);
    if (rejectId) rejectOffer(rejectId);
    if (counterId) openCounterOffer(counterId);
  });
  $("#editCounterTemplateBtn").addEventListener("click", openMessageTemplates);
  $("#counterOfferPrice").addEventListener("input", (event) => {
    const card = activeSale().cards.find((item) => item.id === $("#counterOfferCardId").value);
    if (card) $("#counterOfferMessage").value = counterOfferMessage(card, Number(event.target.value));
  });
  $("#copyCounterOfferBtn").addEventListener("click", copyCounterOffer);
  $("#profitBreakdown").addEventListener("click", (event) => {
    const key = event.target.closest("[data-profit-sort]")?.dataset.profitSort;
    if (!key) return;
    state.preferences ||= {};
    const current = state.preferences.profitSort || { key: "revenue", direction: "desc" };
    state.preferences.profitSort = { key, direction: current.key === key ? (current.direction === "asc" ? "desc" : "asc") : (["card", "buyer"].includes(key) ? "asc" : "desc") };
    saveSoon(); renderDashboard();
  });
  $("#importBtn").addEventListener("click", importSpreadsheet);
  $$('[data-action="import"]').forEach((button) => button.addEventListener("click", importSpreadsheet));
  $("#addSingleCardBtn").addEventListener("click", openAddCard);
  $$('[data-action="add-card"]').forEach((button) => button.addEventListener("click", openAddCard));
  $("#confirmAddCardBtn").addEventListener("click", addSingleCard);
  $("#importPresetSelect").addEventListener("change", (event) => { $("#deleteImportPresetBtn").disabled = !event.target.value; if (event.target.value) applyImportPreset(event.target.value); });
  $("#saveImportPresetBtn").addEventListener("click", () => { if (!pendingSheet) return; const name = window.prompt("Name this column preset:", pendingSheet.name || "My spreadsheet"); if (!name?.trim()) return; const preset = { id: uid(), name: name.trim(), mapping: currentImportMapping(), template: $("#listingTemplate").value }; state.importPresets.push(preset); renderImportPresetOptions(preset.id); saveSoon(); toast("Import-column preset saved."); });
  $("#deleteImportPresetBtn").addEventListener("click", () => { const id = $("#importPresetSelect").value; if (!id || !window.confirm("Delete this import-column preset?")) return; state.importPresets = importPresets().filter((preset) => preset.id !== id); renderImportPresetOptions(); saveSoon(); toast("Import preset deleted."); });
  $("#addCardDialog").addEventListener("input", (event) => { if (event.target.matches("input")) updateAddCardPreview(); });
  $("#addImagesBtn").addEventListener("click", () => addImages("files"));
  $("#addFolderBtn").addEventListener("click", () => addImages("folder"));
  $("#autoMatchBtn").addEventListener("click", autoMatchImages);
  $("#forceAllImageLookupBtn").addEventListener("click", forceAllImageLookup);
  $("#bulkEditBtn").addEventListener("click", openBulkEdit);
  $("#applyBulkEditBtn").addEventListener("click", applyBulkEdit);
  $("#carryoverBtn").addEventListener("click", openCarryover);
  $("#applyCarryoverBtn").addEventListener("click", applyCarryover);
  $("#closeSaleBtn").addEventListener("click", openCloseSale);
  $("#closeSaleUnsoldAction").addEventListener("change", (event) => $("#closeSaleNameLabel").classList.toggle("hidden", event.target.value !== "new"));
  $("#finishCloseSaleBtn").addEventListener("click", finishCloseSale);
  $("#newSaleBtn").addEventListener("click", () => $("#newSaleDialog").showModal());
  $("#deleteSaleBtn").addEventListener("click", deleteActiveSale);
  $("#createSaleBtn").addEventListener("click", (event) => {
    event.preventDefault(); const name = $("#newSaleName").value.trim(); if (!name) return;
    const sale = { id: uid(), name, pweShipping: Number($("#newSalePweShipping").value || 0), pmwtShipping: Number($("#newSalePmwtShipping").value || 0), template: DEFAULT_TEMPLATE, cards: [], images: [], orders: {}, additionalLookupFolders: [], excludedLookupFolders: [] };
    state.sales.push(sale); state.activeSaleId = sale.id; state.selectedBuyer = ""; resetListingView(); $("#newSaleDialog").close(); saveSoon(); render(); toast("New sale created.");
  });
  $("#saleSelect").addEventListener("change", (event) => { state.activeSaleId = event.target.value; state.selectedBuyer = ""; resetListingView(); saveSoon(); render(); });
  $("#listingSort").addEventListener("change", (event) => { activeSale().sortMode = event.target.value; saveSoon(); renderListings(); });
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.filter; $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button)); renderListings(); }));
  $("#cardSearch").addEventListener("input", (event) => { state.query = event.target.value; renderListings(); });
  $("#listingRows").addEventListener("click", (event) => {
    const copyId = event.target.dataset.copyCard;
    const imageId = event.target.dataset.imageCard;
    const rematchId = event.target.dataset.rematchCard;
    const deleteId = event.target.dataset.deleteCard;
    const restoreId = event.target.dataset.restoreCard;
    const editId = event.target.dataset.editCard;
    const moveId = event.target.dataset.moveCard;
    if (copyId) copyAndHideCard(copyId);
    if (imageId) chooseManualImage(imageId);
    if (rematchId) forceImageLookupForCard(rematchId);
    if (deleteId) deleteCard(deleteId);
    if (restoreId) restoreCard(restoreId);
    if (editId) openQuickEdit(editId);
    if (moveId) moveCardToPosition(moveId);
  });
  $("#listingRows").addEventListener("change", (event) => {
    const id = event.target.dataset.selectListing;
    if (!id) return;
    if (event.target.checked) selectedListingIds.add(id); else selectedListingIds.delete(id);
    renderListings();
  });
  let draggedListingId = "";
  $("#listingRows").addEventListener("dragstart", (event) => { const row = event.target.closest("[data-listing-row]"); if (row && activeSale().sortMode === "custom") draggedListingId = row.dataset.listingRow; });
  $("#listingRows").addEventListener("dragover", (event) => { if (draggedListingId && event.target.closest("[data-listing-row]")) event.preventDefault(); });
  $("#listingRows").addEventListener("drop", (event) => {
    const target = event.target.closest("[data-listing-row]");
    if (!target || !draggedListingId || target.dataset.listingRow === draggedListingId) return;
    event.preventDefault(); snapshotSale("Before custom listing reorder");
    const ordered = activeSale().cards.slice().sort((a, b) => Number(a.customOrder ?? a.sourceOrder ?? a.ref) - Number(b.customOrder ?? b.sourceOrder ?? b.ref));
    const from = ordered.findIndex((card) => card.id === draggedListingId); const to = ordered.findIndex((card) => card.id === target.dataset.listingRow);
    const [moved] = ordered.splice(from, 1); ordered.splice(to, 0, moved); ordered.forEach((card, index) => card.customOrder = index + 1);
    draggedListingId = ""; saveSoon(); renderListings();
  });
  $("#selectAllListings").addEventListener("change", (event) => {
    $$('[data-select-listing]').forEach((checkbox) => { if (event.target.checked) selectedListingIds.add(checkbox.dataset.selectListing); else selectedListingIds.delete(checkbox.dataset.selectListing); });
    renderListings();
  });
  $("#deleteSelectedCardsBtn").addEventListener("click", deleteSelectedCards);
  $("#imageQueue").addEventListener("dragstart", async (event) => {
    const image = event.target.closest("[data-image-path]");
    if (!image) return;
    event.preventDefault();
    await window.cardSale.startDrag(image.dataset.imagePath);
    const imageRecord = activeSale().images.find((item) => item.id === image.dataset.imageId);
    if (imageRecord) {
      imageRecord.hiddenAfterDrag = true;
      imageRecord.hiddenAt = new Date().toISOString();
      undoStack.push({ saleId: activeSale().id, imageId: imageRecord.id });
      saveSoon(); renderImages(); toast("Image dragged and hidden. Ctrl+Z to undo.");
    }
  });
  $("#claimSearch").addEventListener("input", (event) => { state.claimQuery = event.target.value; renderClaims(); });
  $("#claimRows").addEventListener("input", (event) => {
    if (!event.target.matches("[data-claim-offer]")) return;
    const row = event.target.closest("[data-claim-row]");
    if (event.target.value !== "") {
      $("[data-claim-type='offer']", row).checked = true;
      $("[data-claim-type='claim']", row).checked = false;
      event.target.disabled = false;
    }
    const card = activeSale().cards.find((item) => item.id === row.dataset.claimRow);
    const effectivePrice = event.target.value === "" ? Number(card.price) : Number(event.target.value);
    const belowCost = Number(card.purchasePrice) > 0 && effectivePrice < Number(card.purchasePrice);
    event.target.classList.toggle("below-cost", belowCost);
    let warning = $(".cost-warning", event.target.parentElement);
    if (belowCost && !warning) { warning = document.createElement("small"); warning.className = "cost-warning"; warning.textContent = "Below cost"; event.target.parentElement.appendChild(warning); }
    if (!belowCost && warning) warning.remove();
  });
  $("#claimRows").addEventListener("change", (event) => {
    const type = event.target.dataset.claimType;
    if (!type) return;
    const row = event.target.closest("[data-claim-row]");
    const other = $(`[data-claim-type='${type === "claim" ? "offer" : "claim"}']`, row);
    if (event.target.checked) other.checked = false;
    else other.checked = true;
    const offerChecked = $("[data-claim-type='offer']", row).checked;
    $("[data-claim-offer]", row).disabled = !offerChecked;
  });
  $("#claimRows").addEventListener("click", (event) => {
    const row = event.target.closest("[data-claim-row]");
    if (!row) return;
    if (event.target.dataset.assignCard) assignBuyer(row.dataset.claimRow, $("[data-claim-buyer]", row).value, $("[data-claim-offer]", row).value, $("[data-claim-type='offer']", row).checked ? "offer" : "claim", $("[data-claim-note]", row).value);
    if (event.target.dataset.clearClaim) clearClaim(row.dataset.claimRow);
  });
  $("#claimTimeline").addEventListener("click", (event) => {
    const item = event.target.closest("[data-timeline-card]");
    if (!item) return;
    if (state.claimQuery) { state.claimQuery = ""; $("#claimSearch").value = ""; renderClaims(); }
    const row = $(`[data-claim-row="${CSS.escape(item.dataset.timelineCard)}"]`);
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.add("focus-flash");
    setTimeout(() => row.classList.remove("focus-flash"), 1600);
  });
  $("#mappingGrid").addEventListener("change", updateImportPreview);
  $("#listingTemplate").addEventListener("input", updateImportPreview);
  $("#confirmImportBtn").addEventListener("click", confirmImport);
  $("#applyMatchesBtn").addEventListener("click", applyReviewedMatches);
  $("#matchSearch").addEventListener("input", (event) => { if (pendingMatches) { pendingMatches.query = event.target.value; renderMatchReview(); } });
  $$('[data-match-filter]').forEach((button) => button.addEventListener("click", () => {
    if (!pendingMatches) return;
    pendingMatches.filter = button.dataset.matchFilter;
    $$('[data-match-filter]').forEach((item) => item.classList.toggle("active", item === button));
    renderMatchReview();
  }));
  $("#matchReviewList").addEventListener("change", (event) => {
    if (event.target.matches("[data-select-match]")) {
      if (event.target.checked) selectedMatchIds.add(event.target.dataset.selectMatch); else selectedMatchIds.delete(event.target.dataset.selectMatch);
      renderMatchReview();
      return;
    }
    if (!event.target.matches("[data-match-select]")) return;
    const row = event.target.closest("[data-match-card]");
    const preview = $("[data-match-preview]", row);
    preview.src = event.target.value ? fileUrl(event.target.value) : "assets/favicon.svg";
    const match = pendingMatches?.review.find((item) => item.card.id === row.dataset.matchCard);
    if (match) match.selected = event.target.value;
  });
  $("#matchReviewList").addEventListener("click", (event) => {
    if (!pendingMatches) return;
    const rematchId = event.target.dataset.rematchMatch;
    if (rematchId) { forceImageLookupForCard(rematchId); return; }
    const confirmId = event.target.dataset.confirmMatch;
    const reopenId = event.target.dataset.reopenMatch;
    const match = pendingMatches.review.find((item) => item.card.id === (confirmId || reopenId));
    if (!match) return;
    if (confirmId) {
      const row = event.target.closest("[data-match-card]");
      match.selected = $("[data-match-select]", row).value;
      if (!confirmMatch(match, match.selected)) return toast("That image is already linked to another card.");
      saveSoon(); renderImages(); renderListings(); renderMatchReview(); toast(`${match.card.ref} confirmed.`);
    }
    if (reopenId) { match.confirmed = false; renderMatchReview(); }
  });
  $("#selectAllMatches").addEventListener("change", (event) => {
    $$('[data-select-match]').forEach((checkbox) => { if (event.target.checked) selectedMatchIds.add(checkbox.dataset.selectMatch); else selectedMatchIds.delete(checkbox.dataset.selectMatch); });
    renderMatchReview();
  });
  $("#confirmSelectedMatchesBtn").addEventListener("click", () => confirmSelectedMatches());
  $("#confirmPerfectMatchesBtn").addEventListener("click", confirmPerfectMatches);
  $("#deleteSelectedMatchesBtn").addEventListener("click", deleteSelectedMatches);
  $("#buyerList").addEventListener("click", (event) => { const button = event.target.closest("[data-buyer]"); if (button) { state.selectedBuyer = button.dataset.buyer; renderOrders(); } });
  $("#orderSearch").addEventListener("input", (event) => { orderDeskSettings().query = event.target.value; saveSoon(); renderOrders(); });
  $("#orderStatusFilter").addEventListener("change", (event) => { orderDeskSettings().status = event.target.value; saveSoon(); renderOrders(); });
  $("#orderDetail").addEventListener("input", (event) => {
    if (!state.selectedBuyer) return; const order = orderFor(state.selectedBuyer);
    const rerender = ["orderShippingMethod", "orderDiscount", "orderPaymentMethod"].includes(event.target.id);
    if (event.target.id === "orderShippingMethod") order.shippingMethod = event.target.value;
    if (event.target.id === "orderDiscount") order.discount = Number(event.target.value || 0);
    if (event.target.id === "orderPaymentMethod") order.paymentMethod = event.target.value;
    if (event.target.id === "buyerAddress") ensureBuyerProfile(state.selectedBuyer).address = event.target.value;
    if (event.target.id === "buyerNotes") ensureBuyerProfile(state.selectedBuyer).notes = event.target.value;
    saveSoon(); if (rerender) renderOrderDetail();
  });
  $("#orderDetail").addEventListener("change", (event) => { if (event.target.id !== "buyerAddress" || !state.selectedBuyer) return; const previous = event.target.dataset.originalAddress || ""; const current = event.target.value.trim(); const profile = ensureBuyerProfile(state.selectedBuyer); if (previous && normalizedAddress(profile.address) !== normalizedAddress(current)) profile.previousAddresses.push({ address: previous, changedAt: new Date().toISOString() }); profile.address = current; profile.manuallySaved = true; saveSoon(); renderOrders(); toast(addressWarnings(state.selectedBuyer).length ? "Address saved with warnings." : "Address saved and checked."); });
  $("#orderDetail").addEventListener("click", (event) => {
    const status = event.target.dataset.orderStatus;
    if (status && state.selectedBuyer) { const order = orderFor(state.selectedBuyer); if (status === "paid" && !order.shippingMethod) return toast("Select PWE or PMWT before marking the order paid."); if (status === "paid" && !order.paymentMethod) return toast("Choose Cash, PayPal, Venmo or Other before marking paid."); snapshotSale(`Before marking ${state.selectedBuyer} ${status}`); order.status = status; if (status === "paid") order.paidAt = new Date().toISOString(); recordAudit("order", `${state.selectedBuyer} marked ${status}${order.paymentMethod ? ` via ${order.paymentMethod}` : ""}`, { buyer: state.selectedBuyer }); saveSoon(); render(); toast(`Order marked ${status}.`); }
    if (event.target.id === "copySummaryBtn") { if (!orderFor(state.selectedBuyer).shippingMethod) return toast("Select PWE or PMWT before copying the summary."); copyText(buyerSummary(state.selectedBuyer), "Buyer summary copied."); }
    if (event.target.dataset.copyMessage) { if (!orderFor(state.selectedBuyer).shippingMethod && ["payment-due", "payment-received"].includes(event.target.dataset.copyMessage)) return toast("Select PWE or PMWT before copying this message."); copyText(buyerMessage(event.target.dataset.copyMessage, state.selectedBuyer), "Buyer message copied."); }
    if (event.target.id === "editMessageTemplatesBtn") openMessageTemplates();
    if (event.target.dataset.openTracking) window.cardSale.openTracking(event.target.dataset.openTracking);
    if (event.target.dataset.openBuyerProfile) { state.profileBuyer = event.target.dataset.openBuyerProfile; showView("buyers"); renderBuyerProfiles(); }
  });
  $("#saveMessageTemplatesBtn").addEventListener("click", saveMessageTemplates);
  $("#resetMessageTemplatesBtn").addEventListener("click", resetMessageTemplates);
  $("#packingBuyer").addEventListener("change", renderPacking);
  $("#packingContent").addEventListener("input", (event) => {
    const buyer = $("#packingBuyer").value;
    if (event.target.id === "trackingNumber") { orderFor(buyer).trackingNumber = event.target.value.trim(); const button = $("#copyTrackingMessageBtn"); const track = $("#openTrackingBtn"); if (button) button.disabled = !orderFor(buyer).trackingNumber; if (track) { track.disabled = !orderFor(buyer).trackingNumber; track.dataset.openTracking = trackingUrl(orderFor(buyer).trackingNumber); } saveSoon(); }
    if (event.target.id === "packingInternalNotes") { orderFor(buyer).packingNotes = event.target.value; saveSoon(); }
    if (event.target.id === "packingBuyerNote") { orderFor(buyer).packingSlipNote = event.target.value; saveSoon(); }
  });
  $("#packingContent").addEventListener("change", (event) => { const id = event.target.dataset.packCard; if (id) { const card = activeSale().cards.find((item) => item.id === id); card.packed = event.target.checked; saveSoon(); renderPacking(); } });
  $("#packingContent").addEventListener("click", (event) => {
    const buyer = $("#packingBuyer").value;
    if (event.target.id === "checkAllCardsBtn") { const cards = cardsForBuyer(buyer); const shouldPack = cards.some((card) => !card.packed); cards.forEach((card) => card.packed = shouldPack); saveSoon(); renderPacking(); toast(shouldPack ? "All cards checked." : "All cards unchecked."); }
    if (event.target.id === "completePackingBtn" && !event.target.disabled) { if (!orderFor(buyer).shippingMethod) return toast("Select PWE or PMWT in Buyer Orders first."); orderFor(buyer).status = "packed"; saveSoon(); render(); toast(`${buyer}'s package is complete.`); }
    if (event.target.id === "copyTrackingMessageBtn") { const order = orderFor(buyer); order.trackingNumber = $("#trackingNumber").value.trim(); if (!order.trackingNumber) return toast("Enter a tracking number first."); copyText(trackingMessage(buyer), "Shipping message copied."); }
    if (event.target.id === "previewPackingSlipBtn") outputPackingSlips([buyer], "preview");
    if (event.target.id === "printPackingSlipBtn") printPackingSlip(buyer);
    if (event.target.dataset.openTracking) window.cardSale.openTracking(event.target.dataset.openTracking);
  });
  $("#packingCustomizeBtn").addEventListener("click", openPackingDesigner);
  $("#pweLabelBtn").addEventListener("click", openPweLabelDesigner);
  $("#pweLabelDialog").addEventListener("input", (event) => { if (event.target.matches("input, textarea, select")) updatePweLabelPreview(); });
  $("#savePweLabelBtn").addEventListener("click", () => { state.preferences.pweLabel = readPweLabelForm(); saveSoon(); toast("PWE label design saved."); });
  $("#previewPweLabelBtn").addEventListener("click", () => { state.preferences.pweLabel = readPweLabelForm(); const buyer = $("#packingBuyer").value || buyers()[0]; if (buyer) outputPweLabels([buyer], "preview"); });
  $("#printPweLabelBtn").addEventListener("click", () => { state.preferences.pweLabel = readPweLabelForm(); const buyer = $("#packingBuyer").value || buyers()[0]; if (buyer) outputPweLabels([buyer]); });
  $("#printAllPweLabelsBtn").addEventListener("click", () => { state.preferences.pweLabel = readPweLabelForm(); outputPweLabels(buyers().filter((buyer) => orderFor(buyer).shippingMethod === "PWE")); });
  $("#packingBulkBtn").addEventListener("click", () => { packingBulkSelection = new Set(buyers()); renderPackingBulk(); $("#packingBulkDialog").showModal(); });
  $("#packingPrintHistoryBtn").addEventListener("click", () => { renderPackingHistory(); $("#packingHistoryDialog").showModal(); });
  $("#packingJumpSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const query = event.target.value.trim().toLowerCase(); if (!query) return;
    const match = buyers().map((buyer) => ({ buyer, card: cardsForBuyer(buyer).find((card) => [card.ref, card.number, card.name, card.year, card.set].some((value) => String(value || "").toLowerCase().includes(query))) })).find((item) => item.card || item.buyer.toLowerCase().includes(query));
    if (!match) return toast("No packing order matches that search.");
    $("#packingBuyer").value = match.buyer; renderPacking();
    if (match.card) { const row = $(`[data-pack-row="${match.card.id}"]`); row?.scrollIntoView({ block: "center", behavior: state.preferences?.reducedMotion ? "auto" : "smooth" }); row?.classList.add("focus-flash"); }
  });

  $("#packingDesignerDialog").addEventListener("input", (event) => { if (event.target.matches("input, textarea, select")) updatePackingPreview(); });
  $("#packingTemplateSelect").addEventListener("change", (event) => { const template = state.packingTemplates.find((item) => item.id === event.target.value); populatePackingDesigner(template || ensurePackingSettings(), event.target.value); });
  $("#choosePackingLogoBtn").addEventListener("click", async () => { const logoPath = await window.cardSale.choosePackingLogo(); if (!logoPath) return; packingDesignerDraft.logoPath = logoPath; $("#packingLogoStatus").textContent = logoPath; updatePackingPreview(); });
  $("#clearPackingLogoBtn").addEventListener("click", () => { packingDesignerDraft.logoPath = ""; $("#packingLogoStatus").textContent = packingDesignerDraft.brandName === "Card Sale Manager" ? "Built-in Card Sale Manager logo" : "No logo selected"; updatePackingPreview(); });
  $("#packingSectionOrder").addEventListener("dragstart", (event) => { const item = event.target.closest("[data-packing-section]"); if (!item) return; item.classList.add("dragging"); event.dataTransfer.setData("text/plain", item.dataset.packingSection); });
  $("#packingSectionOrder").addEventListener("dragend", (event) => event.target.closest("[data-packing-section]")?.classList.remove("dragging"));
  $("#packingSectionOrder").addEventListener("dragover", (event) => event.preventDefault());
  $("#packingSectionOrder").addEventListener("drop", (event) => { event.preventDefault(); const source = event.dataTransfer.getData("text/plain"); const target = event.target.closest("[data-packing-section]")?.dataset.packingSection; if (!source || !target || source === target) return; const order = packingDesignerDraft.sectionOrder; order.splice(order.indexOf(source), 1); order.splice(order.indexOf(target), 0, source); renderPackingSectionOrder(); updatePackingPreview(); });
  $("#savePackingTemplateBtn").addEventListener("click", () => { const design = readPackingDesignerForm(); const selectedId = $("#packingTemplateSelect").value; const existing = state.packingTemplates.find((item) => item.id === selectedId); if (existing) Object.assign(existing, clone(design)); else state.packingTemplates.push({ id: uid(), ...clone(design) }); const id = existing?.id || state.packingTemplates.at(-1).id; saveSoon(); populatePackingDesigner(state.packingTemplates.find((item) => item.id === id), id); toast("Packing-slip template saved."); });
  $("#applyPackingTemplateBtn").addEventListener("click", () => { state.preferences.packingDesign = clone(readPackingDesignerForm()); saveSoon(); $("#packingDesignerDialog").close(); toast("Packing-slip design is active."); });
  $("#deletePackingTemplateBtn").addEventListener("click", () => { const id = $("#packingTemplateSelect").value; const index = state.packingTemplates.findIndex((item) => item.id === id); if (index < 0) return; state.packingTemplates.splice(index, 1); saveSoon(); populatePackingDesigner(ensurePackingSettings()); toast("Packing-slip template deleted."); });
  $("#printPackingTestBtn").addEventListener("click", () => { const buyer = $("#packingBuyer").value || buyers()[0]; if (buyer) outputPackingSlips([buyer], "print", readPackingDesignerForm(), true); });

  ["#packingBulkStatus", "#packingBulkShipping", "#packingBulkSort", "#packingBulkPrinted", "#packingBulkRequireAddress"].forEach((selector) => $(selector).addEventListener("change", renderPackingBulk));
  $("#packingBulkSelectAll").addEventListener("change", (event) => { packingFilteredBuyers().forEach((buyer) => event.target.checked ? packingBulkSelection.add(buyer) : packingBulkSelection.delete(buyer)); renderPackingBulk(); });
  $("#packingBulkBuyers").addEventListener("change", (event) => { const buyer = event.target.dataset.packingBuyer; if (!buyer) return; event.target.checked ? packingBulkSelection.add(buyer) : packingBulkSelection.delete(buyer); renderPackingBulk(); });
  $("#printPackingBulkBtn").addEventListener("click", async () => { const names = packingFilteredBuyers().filter((buyer) => packingBulkSelection.has(buyer)); if (await outputPackingSlips(names)) $("#packingBulkDialog").close(); });
  $("#previewPackingBulkBtn").addEventListener("click", async () => { const names = packingFilteredBuyers().filter((buyer) => packingBulkSelection.has(buyer)); await outputPackingSlips(names, "preview"); });
  $("#exportPackingPdfBtn").addEventListener("click", async () => { const names = packingFilteredBuyers().filter((buyer) => packingBulkSelection.has(buyer)); if (await outputPackingSlips(names, "pdf")) $("#packingBulkDialog").close(); });
  $("#liveSaleContent").addEventListener("click", (event) => {
    if (event.target.dataset.liveCopy) copyAndHideCard(event.target.dataset.liveCopy).then(() => { liveIndex = Math.min(liveIndex, Math.max(0, liveCards().length - 1)); renderLiveSale(); });
    if (event.target.dataset.liveImageCard) chooseManualImage(event.target.dataset.liveImageCard);
    if (event.target.hasAttribute("data-live-next")) { liveIndex = Math.min(liveIndex + 1, Math.max(0, liveCards().length - 1)); renderLiveSale(); }
    if (event.target.hasAttribute("data-live-prev")) { liveIndex = Math.max(0, liveIndex - 1); renderLiveSale(); }
  });
  $("#liveSaleContent").addEventListener("dragstart", async (event) => { const image = event.target.closest("[data-live-image]"); if (!image) return; event.preventDefault(); await window.cardSale.startDrag(image.dataset.liveImage); const record = activeSale().images.find((item) => item.path === image.dataset.liveImage); if (record) { record.hiddenAfterDrag = true; record.hiddenAt = new Date().toISOString(); undoStack.push({ saleId: activeSale().id, imageId: record.id }); saveSoon(); renderImages(); toast("Image dragged and hidden. Ctrl+Z to undo."); } });
  $("#imageFolderSettingsBtn").addEventListener("click", () => { renderFolderSettings(); $("#folderSettingsDialog").showModal(); });
  $("#choosePrimaryFolderBtn").addEventListener("click", async () => { const folder = await window.cardSale.chooseLookupFolder(); if (folder) { lookupSettings().primaryFolder = folder; renderFolderSettings(); renderImages(); saveSoon(); } });
  $("#addLookupFolderBtn").addEventListener("click", async () => { const folders = await window.cardSale.chooseLookupFolders("Choose image lookup folders"); const settings = lookupSettings(); folders.forEach((folder) => { if (folder !== settings.primaryFolder && !settings.additionalFolders.includes(folder)) settings.additionalFolders.push(folder); }); if (folders.length) { renderFolderSettings(); renderImages(); saveSoon(); } });
  $("#addExcludedFolderBtn").addEventListener("click", async () => { const folders = await window.cardSale.chooseLookupFolders("Choose folders to exclude"); const settings = lookupSettings(); folders.forEach((folder) => { if (!settings.excludedFolders.includes(folder)) settings.excludedFolders.push(folder); }); if (folders.length) { renderFolderSettings(); renderImages(); saveSoon(); } });
  $("#folderSettingsDialog").addEventListener("click", (event) => {
    const settings = lookupSettings();
    if (event.target.dataset.removePrimary !== undefined) settings.primaryFolder = "";
    if (event.target.dataset.removeAdditional !== undefined) settings.additionalFolders.splice(Number(event.target.dataset.removeAdditional), 1);
    if (event.target.dataset.removeExcluded !== undefined) settings.excludedFolders.splice(Number(event.target.dataset.removeExcluded), 1);
    if (event.target.matches("[data-remove-primary], [data-remove-additional], [data-remove-excluded]")) { renderFolderSettings(); renderImages(); saveSoon(); }
  });
  $("#checkUpdateBtn").addEventListener("click", () => checkForUpdates(true));
  $("#downloadTemplateBtn").addEventListener("click", async () => { if (await window.cardSale.downloadTemplate()) toast("Import template saved."); });
  $("#openDataFolderBtn").addEventListener("click", () => window.cardSale.openDataFolder());
  $("#openImageFolderBtn").addEventListener("click", () => { const folder = lookupSettings().primaryFolder; if (!folder) return toast("Choose a primary image folder first."); window.cardSale.openFolder(folder); });
  $("#restoreSaleBtn").addEventListener("click", () => { renderVersionList(); $("#restoreDialog").showModal(); });
  $("#versionList").addEventListener("click", (event) => { if (event.target.dataset.restoreVersion) restoreVersion(event.target.dataset.restoreVersion); });
  $("#parseClaimsBtn").addEventListener("click", () => { parsedClaimMatches = []; $("#claimParseResults").innerHTML = ""; $("#applyParsedClaimsBtn").disabled = true; $("#claimWordsInput").value = claimWords().join(", "); renderUnrecognizedComments(); $("#claimParserDialog").showModal(); });
  $("#previewClaimsBtn").addEventListener("click", parseClaimComments);
  $("#applyParsedClaimsBtn").addEventListener("click", applyParsedClaims);
  $("#openFacebookBtn").addEventListener("click", () => window.cardSale.openFacebook($("#facebookPostUrl").value));
  $("#fetchFacebookBtn").addEventListener("click", async () => { const button = $("#fetchFacebookBtn"); button.disabled = true; button.textContent = "Trying…"; const result = await window.cardSale.fetchFacebookPost($("#facebookPostUrl").value); button.disabled = false; button.textContent = "Try link"; if (!result.ok) return toast(result.message); $("#claimComments").value = result.text; parseClaimComments(); toast("Public post text loaded. Review the matches carefully."); });
  $("#unrecognizedComments").addEventListener("click", (event) => { const queue = activeSale().unrecognizedComments ||= []; if (event.target.hasAttribute("data-clear-unrecognized")) queue.length = 0; if (event.target.dataset.removeComment !== undefined) queue.splice(Number(event.target.dataset.removeComment), 1); if (event.target.dataset.retryComment !== undefined) { const line = queue.splice(Number(event.target.dataset.retryComment), 1)[0]; $("#claimComments").value = [$("#claimComments").value.trim(), line].filter(Boolean).join("\n"); $("#claimComments").focus(); } renderUnrecognizedComments(); saveSoon(); });
  $("#salePresetsBtn").addEventListener("click", () => { renderPresetDialog(); $("#salePresetsDialog").showModal(); });
  $("#csmFileBtn").addEventListener("click", () => { renderCsmFileManager(true); $("#csmFileDialog").showModal(); });
  $("#openCsmBtn").addEventListener("click", () => openCsmFile());
  $("#saveCsmBtn").addEventListener("click", savePortableCsm);
  $("#saveCsmAsBtn").addEventListener("click", saveCsmAs);
  $("#revealCsmBtn").addEventListener("click", () => window.cardSale.revealCsm("file"));
  $("#relinkCsmImagesBtn").addEventListener("click", relinkCsmImages);
  $("#packageCsmBtn").addEventListener("click", packageCsmWorkspace);
  $("#detachCsmBtn").addEventListener("click", async () => { if (!window.confirm("Stop autosaving to this CSM file and continue with CSM’s local workspace? The file will remain in place.")) return; try { await saveNow(); } catch {} const result = await window.cardSale.detachCsm(); portableDocument = result.document; recentCsmFiles = result.recent || recentCsmFiles; renderCsmFileManager(false); toast("Continuing with the protected local workspace."); });
  $("#recentCsmFiles").addEventListener("click", async (event) => {
    const action = event.target.closest("[data-csm-recent-action]");
    if (action) { const result = await window.cardSale.csmRecentAction(action.dataset.csmPath, action.dataset.csmRecentAction); recentCsmFiles = result.recent || recentCsmFiles; renderCsmFileManager(false); return; }
    const button = event.target.closest("[data-open-csm]"); if (button && !button.disabled) openCsmFile(button.dataset.openCsm);
  });
  $("#openCsmBackupsBtn").addEventListener("click", () => window.cardSale.revealCsm("backups"));
  $("#csmBackupList").addEventListener("click", async (event) => { const button = event.target.closest("[data-restore-csm-backup]"); if (!button || !window.confirm("Restore this recovery copy? CSM will protect the current version first.")) return; const result = await window.cardSale.restoreCsmBackup(button.dataset.restoreCsmBackup); if (!result?.success) return toast(result?.message || "That recovery copy could not be restored."); window.location.reload(); });
  $("#csmMissingImages").addEventListener("click", async (event) => {
    const choose = event.target.closest("[data-csm-manual-image]");
    if (choose) { state.activeSaleId = choose.dataset.csmSale; await chooseManualImage(choose.dataset.csmManualImage); await saveNow(); renderCsmFileManager(true); return; }
    const clear = event.target.closest("[data-csm-clear-image]");
    if (clear) { clearMissingImagePath(clear.dataset.csmClearImage); await saveNow(); render(); renderCsmFileManager(true); }
  });
  $("#clearMissingCsmImagesBtn").addEventListener("click", async () => { if (!window.confirm("Leave every unresolved image unmatched? Cards will remain in the sale and can be matched later.")) return; (portableDocument.missingImageFiles || []).forEach((item) => clearMissingImagePath(item.originalPath)); await saveNow(); render(); renderCsmFileManager(true); });
  $("#csmConflictReadOnlyBtn").addEventListener("click", async () => { const pending = pendingCsmConflict; $("#csmConflictDialog").close(); if (pending?.mode === "open") { const result = await window.cardSale.openCsm(pending.filePath, { readOnly: true }); if (result?.success) window.location.reload(); } pendingCsmConflict = null; });
  $("#csmConflictSaveCopyBtn").addEventListener("click", async () => { $("#csmConflictDialog").close(); pendingCsmConflict = null; await saveCsmAs(); });
  $("#csmConflictTakeOverBtn").addEventListener("click", async () => { const pending = pendingCsmConflict; if (!pending) return; const result = pending.mode === "open" ? await window.cardSale.openCsm(pending.filePath, { takeOver: true }) : await window.cardSale.saveCsm(state, { force: true }); if (!result?.success) return toast(result?.message || "CSM could not take over this file."); pendingCsmConflict = null; $("#csmConflictDialog").close(); if (pending.mode === "open") window.location.reload(); else { portableDocument = result.document; renderCsmFileManager(true); toast("Editing transferred to this computer."); } });
  $("#presetSelect").addEventListener("change", (event) => renderPresetDialog(event.target.value));
  $("#savePresetBtn").addEventListener("click", savePreset);
  $("#applyPresetBtn").addEventListener("click", applyPreset);
  $("#deletePresetBtn").addEventListener("click", () => { const id = $("#presetSelect").value; const index = presets().findIndex((item) => item.id === id); if (index >= 0) { presets().splice(index, 1); saveSoon(); renderPresetDialog(); toast("Preset deleted."); } });
  $("#shortcutsBtn").addEventListener("click", () => $("#shortcutsDialog").showModal());
  $("#closeQuickEditBtn").addEventListener("click", closeQuickEdit);
  $("#saveQuickEditBtn").addEventListener("click", saveQuickEdit);
  $("#quickEditDrawer").addEventListener("input", (event) => { if (event.target.matches("input, textarea")) updateQuickEditPreview(); });
  $("#buyerProfileSearch").addEventListener("input", (event) => { profileQuery = event.target.value; renderBuyerProfiles(); });
  $("#buyerProfileList").addEventListener("click", (event) => { const button = event.target.closest("[data-profile-buyer]"); if (button) { state.profileBuyer = button.dataset.profileBuyer; renderBuyerProfiles(); } });
  $("#buyerProfileDetail").addEventListener("click", (event) => { if (event.target.id === "saveBuyerProfileBtn") { const profile = ensureBuyerProfile(state.profileBuyer); const nextAddress = $("#profileAddress").value.trim(); if (profile.address && normalizedAddress(profile.address) !== normalizedAddress(nextAddress)) profile.previousAddresses.push({ address: profile.address, changedAt: new Date().toISOString() }); profile.aliases = $("#profileAliases").value.split(",").map((alias) => alias.trim()).filter(Boolean); profile.tags = $("#profileTags").value.split(",").map((tag) => tag.trim()).filter(Boolean); profile.address = nextAddress; profile.notes = $("#profileNotes").value.trim(); profile.manuallySaved = true; saveSoon(); renderBuyerProfiles(); renderOrders(); toast(addressWarnings(state.profileBuyer).length ? "Profile saved with address warnings." : "Buyer profile saved and address checked."); } if (event.target.id === "deleteBuyerProfileBtn") deleteBuyerProfile(state.profileBuyer); if (event.target.dataset.profileCard) { showView("sale"); resetListingView(); state.query = activeSale().cards.find((card) => card.id === event.target.dataset.profileCard)?.name || ""; $("#cardSearch").value = state.query; renderListings(); } });
  $("#setupChooseFolderBtn").addEventListener("click", async () => { const folder = await window.cardSale.chooseLookupFolder(); if (folder) $("#setupImageFolder").value = folder; });
  $("#setupBackBtn").addEventListener("click", () => { setupStep = Math.max(0, setupStep - 1); renderSetupStep(); });
  $("#setupSkipBtn").addEventListener("click", () => { state.preferences.setupCompleted = true; saveSoon(); $("#setupWizardDialog").close(); });
  $("#setupNextBtn").addEventListener("click", () => { if (setupStep < 2) { setupStep += 1; return renderSetupStep(); } const firstSetup = !state.preferences.setupCompleted; state.preferences.sellerName = $("#setupSellerName").value.trim(); activeSale().pweShipping = Number($("#setupPwePrice").value || 0); activeSale().pmwtShipping = Number($("#setupPmwtPrice").value || 0); const folder = $("#setupImageFolder").value.trim(); if (folder) lookupSettings().primaryFolder = folder; if (state.preferences.sellerName) { ensurePackingSettings().brandName = state.preferences.sellerName; ensurePweLabelSettings().returnName ||= state.preferences.sellerName; } if (firstSetup && !$("#setupUseSample").checked) { activeSale().name = "My first sale"; activeSale().cards = []; activeSale().orders = {}; activeSale().images = []; } state.preferences.setupCompleted = true; saveSoon(); $("#setupWizardDialog").close(); render(); showView("command"); toast("Setup complete. Your defaults are saved locally."); if ($("#setupStartGuide").checked) setTimeout(openWalkthrough, 250); });
  $("#walkthroughBackBtn").addEventListener("click", () => { walkthroughStep = Math.max(0, walkthroughStep - 1); renderWalkthrough(); });
  $("#walkthroughNextBtn").addEventListener("click", () => { if (walkthroughStep >= WALKTHROUGH_STEPS.length - 1) return $("#walkthroughDialog").close(); walkthroughStep += 1; renderWalkthrough(); });
  $("#walkthroughOpenBtn").addEventListener("click", () => { const view = WALKTHROUGH_STEPS[walkthroughStep].view; $("#walkthroughDialog").close(); showView(view); });
  $("#copyDiagnosticBtn").addEventListener("click", async () => copyText(JSON.stringify(await diagnosticReport(), null, 2), "Anonymous diagnostic report copied."));
  $("#downloadDiagnosticBtn").addEventListener("click", async () => { const result = await window.cardSale.saveDiagnosticReport(await diagnosticReport()); if (result?.success) { $("#diagnosticDialog").close(); toast("Anonymous diagnostic report saved."); } });
  $("#refreshHealthBtn").addEventListener("click", () => { renderHealthCheck(); toast("Health check refreshed."); });
  $("#healthIssues").addEventListener("click", (event) => { const item = event.target.closest("[data-health-card], [data-health-buyer]"); if (!item) return; if (item.dataset.healthCard) { showView("sale"); openQuickEdit(item.dataset.healthCard); } if (item.dataset.healthBuyer) { state.selectedBuyer = item.dataset.healthBuyer; showView("orders"); renderOrders(); } });
  $("#fontSmallerBtn").addEventListener("click", () => { state.preferences ||= {}; state.preferences.fontScale = Math.max(.85, Number(state.preferences.fontScale || 1) - .05); applyDisplayPreferences(); saveSoon(); });
  $("#fontLargerBtn").addEventListener("click", () => { state.preferences ||= {}; state.preferences.fontScale = Math.min(1.25, Number(state.preferences.fontScale || 1) + .05); applyDisplayPreferences(); saveSoon(); });
  $("#densityBtn").addEventListener("click", () => { state.preferences ||= {}; state.preferences.compact = !state.preferences.compact; applyDisplayPreferences(); saveSoon(); });
  $("#themeBtn").addEventListener("click", () => { const themes = ["system", "light", "dark", "contrast"]; state.preferences.theme = themes[(themes.indexOf(state.preferences.theme || "system") + 1) % themes.length]; applyDisplayPreferences(); saveSoon(); });
  $("#motionBtn").addEventListener("click", () => { state.preferences.reducedMotion = !state.preferences.reducedMotion; applyDisplayPreferences(); saveSoon(); });
  $("#downloadUpdateBtn").addEventListener("click", async () => {
    if (!availableUpdate || !window.confirm(`Install Card Sale Manager ${availableUpdate.version} now? The app will close automatically when the installer starts.`)) return;
    const button = $("#downloadUpdateBtn");
    button.disabled = true;
    button.textContent = "Protecting sales…";
    $("#updateProgress").classList.remove("hidden");
    try {
      await saveNow();
      await window.cardSale.backup(`before-update-${availableUpdate.version}`);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Download & install";
      $("#updateTitle").textContent = "Update stopped to protect your sales";
      $("#updateMessage").textContent = "The app could not verify a current save and recovery backup, so the update was not started.";
      return;
    }
    button.textContent = "Downloading…";
    const result = await window.cardSale.downloadAndInstallUpdate(availableUpdate);
    if (!result.ok) {
      button.disabled = false;
      button.textContent = "Download & install";
      $("#updateTitle").textContent = "Update could not be installed";
      $("#updateMessage").textContent = result.message || "Please try again.";
    }
  });
  document.addEventListener("keydown", (event) => {
    const editing = event.target.matches("input, textarea, select, [contenteditable='true']");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !editing) { event.preventDefault(); undoLastCompletion(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); showView("sale"); $("#cardSearch").focus(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") { event.preventDefault(); importSpreadsheet(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") { event.preventDefault(); openCsmFile(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); portableDocument.active ? savePortableCsm() : saveCsmAs(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") { event.preventDefault(); showView("live"); renderLiveSale(); }
    if (!editing && event.key === "?") { event.preventDefault(); $("#shortcutsDialog").showModal(); }
    if (!editing && $("#liveView").classList.contains("active") && event.key === "ArrowRight") { liveIndex = Math.min(liveIndex + 1, Math.max(0, liveCards().length - 1)); renderLiveSale(); }
    if (!editing && $("#liveView").classList.contains("active") && event.key === "ArrowLeft") { liveIndex = Math.max(0, liveIndex - 1); renderLiveSale(); }
    if (!editing && $("#liveView").classList.contains("active") && (event.ctrlKey || event.metaKey) && event.key === "Enter") { const card = liveCards()[liveIndex]; if (card) copyAndHideCard(card.id).then(renderLiveSale); }
    if (!editing && event.key.toLowerCase() === "e" && !event.ctrlKey && !event.metaKey) { const selected = [...selectedListingIds][0] || ($("#liveView").classList.contains("active") ? liveCards()[liveIndex]?.id : ""); if (selected) { event.preventDefault(); openQuickEdit(selected); } }
  });
}

async function init() {
  const saved = await window.cardSale.load();
  if (saved?.__csmDocument) portableDocument = saved.__csmDocument;
  const openedMissingImages = Number(saved?.__csmMissingImages || 0);
  const automaticallyRelinked = Number(saved?.__csmAutoRelinked || 0);
  const firstLaunch = !saved?.sales?.length;
  let recoveryNotice = "";
  if (saved?.sales?.length) {
    if (saved.__recovery?.source) recoveryNotice = "The main save could not be read, so Card Sale Manager restored the newest recovery backup.";
    delete saved.__recovery;
    delete saved.__csmDocument;
    delete saved.__csmMissingImages;
    delete saved.__csmAutoRelinked;
    state = { ...saved, filter: "all", query: "", claimQuery: "", selectedBuyer: "" };
    const legacyTemplates = new Set([
      "{ref} - {year} {set} #{number} {name} - {condition} - ${price}",
      "{ref} - {year} {brand} #{number} {player} - {grade} - {flaws} - ${claimPrice}",
      "{year} {brand} {player} #{number} ({flaws}) - ${claimPrice}"
    ]);
    if (!state.lookupSettings) {
      const primary = state.sales.find((sale) => sale.lookupFolder)?.lookupFolder || "";
      state.lookupSettings = {
        primaryFolder: primary,
        additionalFolders: [...new Set(state.sales.flatMap((sale) => sale.additionalLookupFolders || []).filter((folder) => folder && folder !== primary))],
        excludedFolders: [...new Set(state.sales.flatMap((sale) => sale.excludedLookupFolders || []).filter(Boolean))]
      };
    }
    lookupSettings();
    state.buyerProfiles ||= {};
    state.manualMatchMemory ||= {};
    state.preferences ||= { fontScale: 1, compact: false, theme: "system", reducedMotion: false };
    state.preferences.theme ||= "system";
    state.preferences.reducedMotion ??= false;
    state.preferences.claimWords ||= [...DEFAULT_CLAIM_WORDS];
    state.salePresets ||= [];
    state.importPresets ||= [];
    state.preferences.setupCompleted ??= true;
    state.sales.forEach((sale) => {
      if (!sale.template || legacyTemplates.has(sale.template)) sale.template = DEFAULT_TEMPLATE;
      sale.pweShipping ??= 1;
      sale.pmwtShipping ??= sale.shipping ?? 5;
      sale.additionalLookupFolders ||= [];
      sale.excludedLookupFolders ||= [];
      sale.orders ||= {};
      sale.images ||= [];
      sale.versions ||= [];
      sale.audit ||= [];
      sale.unrecognizedComments ||= [];
      sale.sortMode ||= "spreadsheet";
      const usedImages = new Set();
      sale.cards.forEach((card, index) => {
        card.sourceOrder ??= index + 1;
        card.customOrder ??= card.sourceOrder;
        card.purchaseDate = normalizePurchaseDate(card.purchaseDate);
        if (card.status !== "available") card.claimType ||= card.offerPrice != null ? "offer" : "claim";
        if (card.claimType === "offer" && card.offerPrice != null) {
          card.offerStatus ||= card.status === "offered" ? "pending" : "accepted";
          if (["pending", "countered"].includes(card.offerStatus)) {
            card.status = "offered";
            delete card.claimPrice;
          } else {
            card.status = "claimed";
            card.claimPrice ??= Number(card.offerPrice);
          }
        }
        if (card.claimedAt && !sale.audit.some((item) => item.cardId === card.id && ["claim", "offer"].includes(item.type))) sale.audit.push({ id: uid(), at: card.claimedAt, type: card.claimType || "claim", message: `${card.claimType === "offer" ? "Offer" : "Claim"} recorded for ${card.ref} · ${card.name}`, cardId: card.id, buyer: card.buyer });
        const imageKey = String(card.imagePath || "").toLowerCase();
        if (imageKey && usedImages.has(imageKey)) card.imagePath = "";
        else if (imageKey) usedImages.add(imageKey);
      });
      Object.values(sale.orders).forEach((order) => { if (order.shippingMethod == null) order.shippingMethod = order.shipping != null ? (Number(order.shipping) === Number(sale.pweShipping) ? "PWE" : "PMWT") : ""; order.packingNotes ||= ""; order.packingSlipNote ||= ""; order.packingSlipPrintCount ||= 0; });
    });
    const orderBuyers = new Set(state.sales.flatMap((sale) => sale.cards.filter(cardInOrder).map((card) => card.buyer).filter(Boolean)));
    Object.entries(state.buyerProfiles).forEach(([name, profile]) => {
      profile.tags ||= []; profile.aliases ||= []; profile.previousAddresses ||= [];
      const hasSavedDetails = Boolean(String(profile.address || "").trim() || String(profile.notes || "").trim() || profile.tags.length || profile.aliases.length || profile.previousAddresses.length);
      if (hasSavedDetails) profile.manuallySaved ??= true;
      if (!orderBuyers.has(name) && !hasSavedDetails && !profile.manuallySaved) delete state.buyerProfiles[name];
    });
    undoStack = state.sales.flatMap((sale) => [
      ...sale.cards.filter((card) => card.hiddenAfterCopy).map((card) => ({ saleId: sale.id, cardId: card.id, at: card.completedAt || "" })),
      ...sale.images.filter((image) => image.hiddenAfterDrag).map((image) => ({ saleId: sale.id, imageId: image.id, at: image.hiddenAt || "" }))
    ]).sort((a, b) => a.at.localeCompare(b.at));
  }
  state.preferences ||= { fontScale: 1, compact: false, theme: "system", reducedMotion: false };
  if (firstLaunch) state.preferences.setupCompleted ??= false;
  state.importPresets ||= [];
  if (![...$("#packingPageSize").options].some((option) => option.value === "two-up")) $("#packingPageSize").add(new Option("Two half-slips per letter page", "two-up"));
  claimWords(); presets(); importPresets(); ensurePackingSettings(); ensurePweLabelSettings(); ensureSaleIntroTemplate(); ensureMessageTemplates(); bindEvents(); resetListingView(); applyDisplayPreferences(); render();
  const csmInfo = await window.cardSale.csmStatus();
  portableDocument = csmInfo.document;
  recentCsmFiles = csmInfo.recent || [];
  csmBackups = csmInfo.backups || [];
  renderCsmFileManager(false);
  window.cardSale.onCsmOpenRequest((filePath) => openCsmFile(filePath));
  window.cardSale.onPrepareClose(async () => {
    try { await saveNow(); await window.cardSale.backup("close"); } catch {}
    await window.cardSale.closeReady();
  });
  window.cardSale.onUpdateProgress((details) => {
    const percent = details.percent == null ? 10 : details.percent;
    $("#updateProgressBar").style.width = `${percent}%`;
    $("#updateProgressText").textContent = details.installing ? "Installing update…" : (details.percent == null ? "Downloading update…" : `Downloading update… ${details.percent}%`);
  });
  installedVersion = await window.cardSale.version();
  $("#appVersion").textContent = `Version ${installedVersion}`;
  if (recoveryNotice) toast(recoveryNotice);
  else if (portableDocument.readOnly) toast("This CSM file appears to be open on another computer, so it was opened read-only.");
  else if (openedMissingImages) toast(`${openedMissingImages} cloud image${openedMissingImages === 1 ? "" : "s"} need relinking. Open Portable CSM file to choose the image folder.`);
  else if (automaticallyRelinked) toast(`${automaticallyRelinked} image path${automaticallyRelinked === 1 ? "" : "s"} relinked automatically.`);
  if (!state.preferences.setupCompleted) setTimeout(openSetupWizard, 300);
  checkForUpdates(false);
}

init().catch((error) => {
  console.error(error);
  toast("Card Sale Manager could not load its saved data.");
});
