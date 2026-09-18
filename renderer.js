const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const fileUrl = (value) => value ? encodeURI(`file:///${value.replace(/\\/g, "/")}`) : "";
const DEFAULT_TEMPLATE = "{year} {brand} {player} #{number} {grade} ({flaws}) - ${claimPrice}";

const starterSale = {
  id: uid(),
  name: "Sample vintage sale",
  pweShipping: 1,
  pmwtShipping: 5,
  template: DEFAULT_TEMPLATE,
  cards: [
    { id: uid(), ref: "1", year: "1962", set: "Topps", number: "5", name: "Sandy Koufax", condition: "VG-EX", price: 42, purchasePrice: 30, purchaseDate: "", notes: "Clean back", status: "available", imagePath: "" },
    { id: uid(), ref: "2", year: "1962", set: "Topps", number: "18", name: "Managers' Dream", condition: "VG", price: 48, purchasePrice: 34, purchaseDate: "", notes: "Soft corners", status: "available", imagePath: "" },
    { id: uid(), ref: "3", year: "1962", set: "Topps", number: "50", name: "Stan Musial", condition: "EX", price: 59, purchasePrice: 41, purchaseDate: "", notes: "Sharp color", status: "claimed", buyer: "Mike R", claimPrice: 55, offerPrice: 55, claimType: "offer", claimedAt: new Date().toISOString(), imagePath: "" }
  ],
  images: [],
  orders: { "Mike R": { status: "awaiting", shippingMethod: "PMWT", discount: 0 } }
};

let state = { sales: [starterSale], activeSaleId: starterSale.id, selectedBuyer: "Mike R", filter: "all", query: "", claimQuery: "", lookupSettings: { primaryFolder: "", additionalFolders: [], excludedFolders: [] } };
let pendingSheet = null;
let pendingMatches = null;
let saveTimer = null;
let undoStack = [];
let selectedListingIds = new Set();
let selectedMatchIds = new Set();
let availableUpdate = null;

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
  sale.pweShipping ??= 1;
  sale.pmwtShipping ??= sale.shipping ?? 5;
  sale.orders ||= {};
  sale.orders[buyer] ||= { status: "shopping", shippingMethod: "PMWT", discount: 0 };
  const order = sale.orders[buyer];
  order.shippingMethod ||= Number(order.shipping) === Number(sale.pweShipping) ? "PWE" : "PMWT";
  return order;
}

function shippingAmount(order, sale = activeSale()) {
  return Number(order.shippingMethod === "PWE" ? sale.pweShipping : sale.pmwtShipping) || 0;
}

function cardsForBuyer(buyer) {
  return activeSale().cards.filter((card) => card.buyer === buyer && card.status !== "available");
}

function buyers() {
  return [...new Set(activeSale().cards.filter((card) => card.buyer).map((card) => card.buyer))].sort((a, b) => a.localeCompare(b));
}

function saveSoon() {
  $("#saveText").textContent = "Saving…";
  $("#saveDot").style.background = "#f0b44b";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await window.cardSale.save(state);
    $("#saveText").textContent = "Saved locally";
    $("#saveDot").style.background = "#54c78c";
  }, 250);
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
    .replace(/\(\s*\)/g, "").replace(/\s+/g, " ").replace(/ -\s*- /g, " - ").trim();
  const duplicate = duplicateInfo(card).label;
  if (duplicate) line = /\s-\s\$/.test(line) ? line.replace(/\s-\s\$/, ` ${duplicate} - $`) : `${line} ${duplicate}`;
  return line;
}

function render() {
  const sale = activeSale();
  $("#viewTitle").textContent = sale.name;
  $("#saleSelect").innerHTML = state.sales.map((item) => `<option value="${item.id}" ${item.id === sale.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
  renderStats();
  renderListings();
  renderImages();
  renderClaims();
  renderOrders();
  renderPacking();
}

function renderStats() {
  const sale = activeSale();
  const sold = sale.cards.filter((card) => card.status !== "available");
  const paid = sold.filter((card) => orderFor(card.buyer).status === "paid" || orderFor(card.buyer).status === "packed" || orderFor(card.buyer).status === "shipped");
  const gross = sold.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const collected = paid.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price ?? 0), 0);
  const stats = [
    ["Cards listed", sale.cards.length, `${sale.cards.filter((c) => c.status === "available").length} still available`],
    ["Claimed", sold.length, sale.cards.length ? `${Math.round((sold.length / sale.cards.length) * 100)}% sell-through` : "No cards yet"],
    ["Gross sales", money(gross), `${money(collected)} collected`],
    ["Active buyers", buyers().length, `${buyers().filter((b) => orderFor(b).status === "paid").length} ready to pack`]
  ];
  $("#saleStats").innerHTML = stats.map(([label, value, sub]) => `<article class="stat"><span class="label">${label}</span><strong>${value}</strong><span class="sub">${sub}</span></article>`).join("");
}

function renderListings() {
  const sale = activeSale();
  const query = state.query.toLowerCase();
  const cards = sale.cards.filter((card) => {
    const hidden = Boolean(card.hiddenAfterCopy);
    const filterMatch = state.filter === "copied" ? hidden : !hidden && (state.filter === "all"
      || (state.filter === "available" && card.status === "available")
      || (state.filter === "claimed" && card.status !== "available")
      || (state.filter === "with-image" && Boolean(card.imagePath))
      || (state.filter === "missing-image" && !card.imagePath));
    return filterMatch && Object.values(card).join(" ").toLowerCase().includes(query);
  });
  const validIds = new Set(sale.cards.map((card) => card.id));
  selectedListingIds = new Set([...selectedListingIds].filter((id) => validIds.has(id)));
  $("#listingRows").innerHTML = cards.map((card) => {
    const statusLabel = card.status === "available" ? "Available" : card.buyer || "Claimed";
    return `<tr data-listing-row="${card.id}">
      <td class="select-column"><input type="checkbox" data-select-listing="${card.id}" ${selectedListingIds.has(card.id) ? "checked" : ""} aria-label="Select ${escapeHtml(card.name)}" /></td>
      <td class="ref">${escapeHtml(card.ref)}</td>
      <td><div class="card-title">${escapeHtml(card.year)} ${escapeHtml(card.set)} #${escapeHtml(card.number)} ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</div><div class="card-line">${escapeHtml(formatLine(card))}</div></td>
      <td>${escapeHtml(card.condition || "—")}</td>
      <td><strong class="money">${money(card.price)}</strong><small class="cost-note">Cost ${card.purchasePrice !== "" && card.purchasePrice != null ? money(card.purchasePrice) : "—"}</small><small class="cost-note">Purchased ${displayPurchaseDate(card.purchaseDate)}</small></td>
      <td><span class="status ${card.status === "available" ? "available" : "claimed"}">${escapeHtml(statusLabel)}</span></td>
      <td><div class="row-actions">${card.hiddenAfterCopy ? `<button class="row-action" data-restore-card="${card.id}">Restore</button>` : `<button class="row-action" data-image-card="${card.id}">${card.imagePath ? "Change image" : "Add image"}</button><button class="row-action" data-copy-card="${card.id}">Copy</button>`}<button class="row-action danger-link" data-delete-card="${card.id}">Delete</button></div></td>
    </tr>`;
  }).join("");
  $("#listingEmpty").classList.toggle("hidden", sale.cards.length !== 0);
  updateListingBulkControls(cards);
}

function updateListingBulkControls(visibleCards = []) {
  const visibleIds = visibleCards.map((card) => card.id);
  const checked = visibleIds.filter((id) => selectedListingIds.has(id)).length;
  $("#listingSelectionCount").textContent = `${selectedListingIds.size} selected`;
  $("#deleteSelectedCardsBtn").disabled = selectedListingIds.size === 0;
  $("#selectAllListings").checked = visibleIds.length > 0 && checked === visibleIds.length;
  $("#selectAllListings").indeterminate = checked > 0 && checked < visibleIds.length;
}

function orderedSaleImages(sale = activeSale()) {
  const imageByPath = new Map(sale.images.map((image) => [image.path.toLowerCase(), image]));
  const tiedPaths = new Set();
  const orderedImages = [];
  sale.cards.forEach((card) => {
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
  const claims = sale.cards.filter((card) => card.claimedAt).sort((a, b) => String(b.claimedAt).localeCompare(String(a.claimedAt)));
  $("#buyerNames").innerHTML = buyers().map((buyer) => `<option value="${escapeHtml(buyer)}"></option>`).join("");
  const query = String(state.claimQuery || "").toLowerCase();
  const cards = sale.cards.filter((card) => Object.values(card).join(" ").toLowerCase().includes(query));
  $("#claimRows").innerHTML = cards.map((card) => {
    const effectivePrice = Number(card.offerPrice ?? card.claimPrice ?? card.price);
    const belowCost = Number(card.purchasePrice) > 0 && effectivePrice < Number(card.purchasePrice);
    const claimType = card.claimType || (card.offerPrice != null ? "offer" : "claim");
    return `<tr data-claim-row="${card.id}"><td class="ref">${escapeHtml(card.ref)}</td><td><div class="card-title">${escapeHtml(card.year)} ${escapeHtml(card.set)} #${escapeHtml(card.number)} ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</div><div class="card-line">${escapeHtml(card.condition || "No grade")}${card.notes && !/^none$/i.test(card.notes) ? ` · ${escapeHtml(card.notes)}` : ""}</div></td><td><strong class="money">${money(card.price)}</strong><small class="cost-note">Cost ${card.purchasePrice !== "" && card.purchasePrice != null ? money(card.purchasePrice) : "—"}</small><small class="cost-note">Purchased ${displayPurchaseDate(card.purchaseDate)}</small></td><td><input type="checkbox" data-claim-type="claim" ${claimType === "claim" ? "checked" : ""} aria-label="Claim" /></td><td><input type="checkbox" data-claim-type="offer" ${claimType === "offer" ? "checked" : ""} aria-label="Offer" /></td><td><input class="offer-input ${belowCost ? "below-cost" : ""}" data-claim-offer type="number" min="0" step="0.01" value="${card.offerPrice ?? ""}" placeholder="${Number(card.price || 0).toFixed(2)}" ${claimType === "claim" ? "disabled" : ""} />${belowCost ? `<small class="cost-warning">Below cost</small>` : ""}</td><td><input class="buyer-assignment" data-claim-buyer value="${escapeHtml(card.buyer || "")}" list="buyerNames" placeholder="Buyer name" /></td><td><div class="row-actions"><button class="row-action" data-assign-card="${card.id}">${card.buyer ? "Update" : "Assign"}</button>${card.buyer ? `<button class="row-action danger-link" data-clear-claim="${card.id}">Clear</button>` : ""}</div></td></tr>`;
  }).join("");
  $("#claimTimeline").innerHTML = claims.length ? claims.map((card) => `<button type="button" class="timeline-item timeline-link" data-timeline-card="${card.id}"><strong>${escapeHtml(card.buyer)} · ${card.claimType === "offer" ? "offer" : "claim"} · ${escapeHtml(card.ref)}</strong><p>${escapeHtml(card.name)} · ${card.claimType === "offer" ? `Offer ${money(card.offerPrice ?? card.claimPrice)}` : money(card.claimPrice ?? card.price)} · ${new Date(card.claimedAt).toLocaleString()}</p></button>`).join("") : `<div class="empty-state"><h3>No claims recorded</h3><p>Assign a buyer beside any card to begin.</p></div>`;
}

function renderOrders() {
  const names = buyers();
  if (!names.includes(state.selectedBuyer)) state.selectedBuyer = names[0] || "";
  $("#buyerCount").textContent = `${names.length} active order${names.length === 1 ? "" : "s"}`;
  $("#buyerList").innerHTML = names.length ? names.map((buyer) => {
    const cards = cardsForBuyer(buyer);
    const total = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price), 0);
    const order = orderFor(buyer);
    return `<button class="buyer-button ${buyer === state.selectedBuyer ? "active" : ""}" data-buyer="${escapeHtml(buyer)}"><strong>${escapeHtml(buyer)}</strong><span class="buyer-total">${money(total + shippingAmount(order) - Number(order.discount))}</span><small>${cards.length} cards · ${escapeHtml(order.shippingMethod)} · ${escapeHtml(order.status)}</small></button>`;
  }).join("") : `<div class="empty-state"><p>Orders appear as soon as you record a claim.</p></div>`;
  renderOrderDetail();
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
  $("#orderDetail").innerHTML = `<div class="panel-header"><div><h2>${escapeHtml(buyer)}</h2><p>${cards.length} claimed card${cards.length === 1 ? "" : "s"}</p></div><span class="status ${order.status === "paid" ? "paid" : "claimed"}">${escapeHtml(order.status)}</span></div>
    <div class="order-summary">
      <div class="order-items">${cards.map((card) => `<article class="order-item">${card.imagePath ? `<div class="order-thumb"><img src="${fileUrl(card.imagePath)}" alt="" /><small title="${escapeHtml(card.imagePath)}">${escapeHtml(card.imagePath.split(/[\\/]/).pop())}</small></div>` : `<div class="thumb">${escapeHtml(card.ref)}</div>`}<div><strong>${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</strong><div class="card-line">${escapeHtml(card.year)} ${escapeHtml(card.set)} #${escapeHtml(card.number)} · ${escapeHtml(card.condition)}</div><span class="type-badge ${card.claimType === "offer" ? "offer" : "claim"}">${card.claimType === "offer" ? "Offer" : "Claim"}</span>${card.claimType === "offer" ? `<small class="offer-note">Accepted offer · listed ${money(card.price)}${Number(card.purchasePrice) > 0 && Number(card.offerPrice) < Number(card.purchasePrice) ? ` · <span class="cost-warning">below ${money(card.purchasePrice)} cost</span>` : ""}</small>` : ""}</div><strong>${money(card.claimPrice ?? card.price)}</strong></article>`).join("")}</div>
      <aside class="order-sidebar">
        <div class="totals">
          <div class="total-line"><span>Cards</span><strong>${money(subtotal)}</strong></div>
          <label>Shipping<select id="orderShippingMethod"><option value="PWE" ${order.shippingMethod === "PWE" ? "selected" : ""}>PWE — ${money(activeSale().pweShipping)}</option><option value="PMWT" ${order.shippingMethod === "PMWT" ? "selected" : ""}>PMWT — ${money(activeSale().pmwtShipping)}</option></select></label>
          <label>Discount<input id="orderDiscount" type="number" min="0" step="0.01" value="${Number(order.discount || 0)}" /></label>
          <div class="total-line grand"><span>Total</span><span>${money(total)}</span></div>
        </div>
        <div class="status-actions">
          <button class="secondary" data-order-status="shopping">Still shopping</button>
          <button class="secondary" data-order-status="awaiting">Awaiting payment</button>
          <button class="primary" data-order-status="paid">Mark paid</button>
        </div>
        <button class="secondary full copy-summary" id="copySummaryBtn">Copy buyer summary</button>
      </aside>
    </div>`;
}

function renderPacking() {
  const names = buyers();
  const select = $("#packingBuyer");
  const current = select.value || names[0] || "";
  select.innerHTML = names.map((buyer) => `<option value="${escapeHtml(buyer)}" ${buyer === current ? "selected" : ""}>${escapeHtml(buyer)}</option>`).join("");
  const buyer = select.value || names[0];
  if (!buyer) {
    $("#packingContent").innerHTML = `<div class="panel empty-state"><h3>No orders to pack</h3><p>Paid and unpaid orders will appear here.</p></div>`;
    return;
  }
  const cards = cardsForBuyer(buyer);
  const packed = cards.filter((card) => card.packed).length;
  const percent = cards.length ? Math.round((packed / cards.length) * 100) : 0;
  const order = orderFor(buyer);
  $("#packingContent").innerHTML = `<section class="packing-card"><div class="packing-progress"><div><h2>${escapeHtml(buyer)}</h2><p>${packed} of ${cards.length} cards verified</p><div class="progress-track"><div class="progress-bar" style="width:${percent}%"></div></div></div><div class="packing-actions"><button class="secondary" id="checkAllCardsBtn">${packed === cards.length ? "Uncheck all" : "Check all cards"}</button><button class="primary" id="completePackingBtn" ${packed !== cards.length ? "disabled" : ""}>Complete package</button></div></div><div class="pack-list">${cards.map((card) => `<label class="pack-item ${card.packed ? "checked" : ""}"><input type="checkbox" data-pack-card="${card.id}" ${card.packed ? "checked" : ""} /><span><strong>${escapeHtml(card.ref)} · ${escapeHtml(card.name)} ${escapeHtml(duplicateInfo(card).label)}</strong><small>${escapeHtml(card.year)} ${escapeHtml(card.set)} #${escapeHtml(card.number)} · ${escapeHtml(card.condition)} · ${card.claimType === "offer" ? "Offer" : "Claim"}</small></span><strong>${money(card.claimPrice ?? card.price)}</strong></label>`).join("")}</div><div class="tracking-panel"><label>Tracking number<input id="trackingNumber" value="${escapeHtml(order.trackingNumber || "")}" placeholder="Enter USPS or carrier tracking number" /></label><button class="secondary" id="copyTrackingMessageBtn" ${order.trackingNumber ? "" : "disabled"}>Copy shipping message</button></div></section>`;
}

function showView(view) {
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".view").forEach((section) => section.classList.toggle("active", section.id === `${view}View`));
  const labels = { sale: "SALE WORKSPACE", claims: "CLAIMS DESK", orders: "BUYER ORDERS", packing: "PACKING" };
  $("#viewEyebrow").textContent = labels[view];
}

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
}

function confirmImport(event) {
  event.preventDefault();
  if (!pendingSheet) return;
  const mapping = {};
  $$("[data-map]").forEach((select) => mapping[select.dataset.map] = select.value);
  const sale = activeSale();
  sale.template = $("#listingTemplate").value;
  const start = sale.cards.length;
  const folder = pendingSheet.path.replace(/[\\/][^\\/]+$/, "");
  const imported = pendingSheet.rows.map((row, index) => {
    const value = (field) => mapping[field] ? row[mapping[field]] : "";
    return { id: uid(), ref: String(start + index + 1), year: value("year"), set: value("set"), number: value("number"), name: value("name"), condition: value("condition"), price: Number(String(value("price")).replace(/[$,]/g, "")) || 0, purchasePrice: value("purchasePrice") === "" ? "" : Number(String(value("purchasePrice")).replace(/[$,]/g, "")) || 0, purchaseDate: normalizePurchaseDate(value("purchaseDate")), notes: value("notes"), imagePath: "", status: "available" };
  });
  sale.cards.push(...imported);
  $("#importDialog").close();
  pendingSheet = null;
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
  return String(image?.stem || "").match(/\d{8}/g) || [];
}

function scoreImage(card, image) {
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
  const isDuplicate = duplicateInfo(card).total > 1;
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
  return { image, score, reasons };
}

function imageOwner(imagePath, exceptCardId = "") {
  const key = String(imagePath || "").toLowerCase();
  return activeSale().cards.find((card) => card.id !== exceptCardId && String(card.imagePath || "").toLowerCase() === key);
}

function attachImage(card, imagePath, quiet = false) {
  if (!imagePath) return true;
  const sale = activeSale();
  const owner = imageOwner(imagePath, card.id);
  if (owner) {
    if (!quiet) toast(`That image is already linked to ${owner.ref} · ${owner.name}.`);
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

async function autoMatchImages() {
  const sale = activeSale();
  const settings = lookupSettings();
  let folder = settings.primaryFolder;
  if (!folder) folder = await window.cardSale.chooseLookupFolder();
  if (!folder) return;
  settings.primaryFolder = folder;
  saveSoon();
  $("#lookupFolderLabel").textContent = folder;
  toast("Scanning image folders…");
  const images = await window.cardSale.scanImageFolder({ folders: [folder, ...settings.additionalFolders], excludedFolders: settings.excludedFolders });
  if (!images.length) return toast("No supported images were found in that folder.");

  const cards = sale.cards.filter((card) => !card.imagePath);
  if (!cards.length) return toast("Every card already has an image.");
  const proposed = cards.map((card) => {
    const candidates = images.map((image) => scoreImage(card, image)).filter((item) => item.score > 0 && !imageOwner(item.image.path, card.id)).sort((a, b) => b.score - a.score).slice(0, 6);
    const top = candidates[0];
    const next = candidates[1];
    const hasDefinitiveFilename = top?.reasons.includes("exact card number") || top?.reasons.includes("full player name") || (top?.reasons.includes("card number") && top?.reasons.includes("surname"));
    const automatic = Boolean(top && top.score >= 100 && hasDefinitiveFilename && (!next || top.score - next.score >= 18));
    return { card, candidates, automatic };
  });

  const used = new Set(sale.cards.filter((card) => card.imagePath).map((card) => card.imagePath.toLowerCase()));
  const automatic = [];
  const review = [];
  proposed.sort((a, b) => (b.candidates[0]?.score || 0) - (a.candidates[0]?.score || 0)).forEach((match) => {
    const topPath = match.candidates[0]?.image.path;
    if (match.automatic && topPath && !used.has(topPath.toLowerCase())) {
      automatic.push({ card: match.card, candidate: match.candidates[0], candidates: match.candidates });
      used.add(topPath.toLowerCase());
    } else {
      match.candidates = match.candidates.filter((candidate) => !used.has(candidate.image.path.toLowerCase()));
      review.push(match);
    }
  });

  const reviewItems = [
    ...automatic.map((match) => ({ card: match.card, candidates: match.candidates || [match.candidate], automatic: true, selected: match.candidate.image.path, confirmed: false })),
    ...review.map((match) => ({ ...match, confirmed: false }))
  ];
  pendingMatches = { review: reviewItems, scanned: images.length, filter: "all", query: "" };
  selectedMatchIds.clear();
  $("#matchSearch").value = "";
  $$('[data-match-filter]').forEach((button) => button.classList.toggle("active", button.dataset.matchFilter === "all"));
  renderMatchReview();
  $("#matchDialog").showModal();
}

function renderMatchReview() {
  const pending = pendingMatches.review.filter((match) => !match.confirmed).length;
  const suggested = pendingMatches.review.filter((match) => !match.confirmed && (match.candidates[0]?.score || 0) >= 45).length;
  const confirmed = pendingMatches.review.filter((match) => match.confirmed).length;
  $("#matchSummary").innerHTML = `<div><strong>${pending}</strong>awaiting confirmation</div><div><strong>${suggested}</strong>with a likely match</div><div><strong>${confirmed}</strong>confirmed and hidden</div>`;
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
    return `<article class="match-row" data-match-card="${match.card.id}">
      <label class="match-select-box"><input type="checkbox" data-select-match="${match.card.id}" ${selectedMatchIds.has(match.card.id) ? "checked" : ""} /> Select</label>
      <div class="match-card-name"><strong>${escapeHtml(match.card.ref)} · ${escapeHtml(match.card.year)} ${escapeHtml(match.card.set)} #${escapeHtml(match.card.number)} ${escapeHtml(match.card.name)} ${escapeHtml(duplicateInfo(match.card).label)}</strong><span>Flaws: ${escapeHtml(match.card.notes && !/^none$/i.test(match.card.notes) ? match.card.notes : "None listed")}</span><span>Purchase date: ${displayPurchaseDate(match.card.purchaseDate)}</span></div>
      <div class="candidate-picker"><img data-match-preview src="${selectedPath ? fileUrl(selectedPath) : "assets/favicon.svg"}" alt="" /><div><select data-match-select ${match.confirmed ? "disabled" : ""}><option value="">Leave unmatched</option>${match.candidates.map((candidate) => `<option value="${escapeHtml(candidate.image.path)}" ${selectedPath === candidate.image.path ? "selected" : ""}>${escapeHtml(candidate.image.relativePath)} — ${Math.max(0, Math.min(100, candidate.score))}% match</option>`).join("")}</select><div class="confidence-note">${top ? `Best clue: ${escapeHtml(top.reasons.join(", ") || "partial filename")}` : "No likely filename found"}</div></div></div>
      <div class="match-confirm">${match.confirmed ? `<span class="status available">Confirmed</span><button type="button" class="row-action" data-reopen-match="${match.card.id}">Reopen</button>` : `<button type="button" class="primary" data-confirm-match="${match.card.id}">${selectedPath ? "Confirm match" : "Confirm no image"}</button>`}</div>
    </article>`;
  }).join("") : `<div class="empty-state"><h3>No matches in this filter</h3><p>Change the filter or search text to see other cards.</p></div>`;
  const visibleIds = filtered.map((match) => match.card.id);
  const selectedVisible = visibleIds.filter((id) => selectedMatchIds.has(id)).length;
  $("#matchSelectionCount").textContent = `${selectedMatchIds.size} selected`;
  $("#confirmSelectedMatchesBtn").disabled = selectedMatchIds.size === 0;
  $("#deleteSelectedMatchesBtn").disabled = selectedMatchIds.size === 0;
  $("#selectAllMatches").checked = visibleIds.length > 0 && selectedVisible === visibleIds.length;
  $("#selectAllMatches").indeterminate = selectedVisible > 0 && selectedVisible < visibleIds.length;
  $("#confirmPerfectMatchesBtn").disabled = !pendingMatches.review.some((match) => !match.confirmed && (match.candidates[0]?.score || 0) >= 100);
}

function confirmMatch(match, selectedPath = match.selected) {
  if (!match || match.confirmed) return false;
  match.selected = selectedPath || "";
  if (match.selected) {
    const previousPath = match.card.imagePath;
    if (!attachImage(match.card, match.selected, true)) return false;
    if (previousPath && previousPath !== match.selected && !activeSale().cards.some((card) => card.id !== match.card.id && card.imagePath === previousPath)) activeSale().images = activeSale().images.filter((image) => image.path !== previousPath);
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
  const perfect = new Set(pendingMatches.review.filter((match) => !match.confirmed && (match.candidates[0]?.score || 0) >= 100).map((match) => match.card.id));
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
  const removed = activeSale().cards.filter((card) => ids.has(card.id));
  activeSale().cards = activeSale().cards.filter((card) => !ids.has(card.id));
  removed.forEach((card) => { if (card.imagePath && !activeSale().cards.some((item) => item.imagePath === card.imagePath)) activeSale().images = activeSale().images.filter((image) => image.path !== card.imagePath); });
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
  if (previousPath && previousPath !== paths[0] && !activeSale().cards.some((item) => item.id !== card.id && item.imagePath === previousPath)) {
    activeSale().images = activeSale().images.filter((image) => image.path !== previousPath);
  }
  saveSoon(); render(); toast(`Image attached to ${card.name}.`);
}

function deleteCard(cardId) {
  const sale = activeSale();
  const card = sale.cards.find((item) => item.id === cardId);
  if (!card || !window.confirm(`Remove ${card.year} ${card.set} #${card.number} ${card.name} from this sale?`)) return;
  sale.cards = sale.cards.filter((item) => item.id !== cardId);
  if (card.imagePath && !sale.cards.some((item) => item.imagePath === card.imagePath)) sale.images = sale.images.filter((image) => image.path !== card.imagePath);
  saveSoon(); render(); toast("Card removed from the sale.");
}

function deleteSelectedCards() {
  const count = selectedListingIds.size;
  if (!count || !window.confirm(`Remove ${count} selected card${count === 1 ? "" : "s"} from this sale?`)) return;
  const sale = activeSale();
  const removed = sale.cards.filter((card) => selectedListingIds.has(card.id));
  sale.cards = sale.cards.filter((card) => !selectedListingIds.has(card.id));
  removed.forEach((card) => { if (card.imagePath && !sale.cards.some((item) => item.imagePath === card.imagePath)) sale.images = sale.images.filter((image) => image.path !== card.imagePath); });
  selectedListingIds.clear();
  saveSoon(); render(); toast(`${count} cards removed from the sale.`);
}

function deleteActiveSale() {
  const sale = activeSale();
  if (!sale) return;
  if (!window.confirm(`Delete the sale “${sale.name}” and all ${sale.cards.length} card${sale.cards.length === 1 ? "" : "s"} in it?`)) return;
  state.sales = state.sales.filter((item) => item.id !== sale.id);
  if (!state.sales.length) {
    const replacement = { id: uid(), name: "New sale", pweShipping: 1, pmwtShipping: 5, template: DEFAULT_TEMPLATE, cards: [], images: [], orders: {} };
    state.sales.push(replacement);
  }
  state.activeSaleId = state.sales[0].id;
  state.selectedBuyer = "";
  selectedListingIds.clear();
  saveSoon(); render(); toast("Sale deleted.");
}

function assignBuyer(cardId, buyerName, offeredPrice, claimType = "claim") {
  const card = activeSale().cards.find((item) => item.id === cardId);
  const buyer = String(buyerName || "").trim();
  if (!card || !buyer) return toast("Enter a buyer name first.");
  const hasOffer = claimType === "offer";
  const acceptedPrice = hasOffer ? Number(offeredPrice) : Number(card.price);
  if (hasOffer && String(offeredPrice ?? "").trim() === "") return toast("Enter the accepted offer price.");
  if (!Number.isFinite(acceptedPrice) || acceptedPrice < 0) return toast("Enter a valid price.");
  card.status = "claimed";
  card.buyer = buyer;
  card.claimPrice = acceptedPrice;
  card.claimType = hasOffer ? "offer" : "claim";
  if (hasOffer) card.offerPrice = acceptedPrice;
  else delete card.offerPrice;
  card.claimedAt = new Date().toISOString();
  orderFor(buyer);
  state.selectedBuyer = buyer;
  saveSoon(); render(); toast(`${card.ref} assigned to ${buyer}.`);
}

function clearClaim(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card) return;
  card.status = "available";
  delete card.buyer;
  delete card.claimPrice;
  delete card.offerPrice;
  delete card.claimedAt;
  delete card.claimType;
  delete card.packed;
  saveSoon(); render(); toast(`${card.ref} returned to available.`);
}

async function copyAndHideCard(cardId) {
  const card = activeSale().cards.find((item) => item.id === cardId);
  if (!card || card.hiddenAfterCopy) return;
  await navigator.clipboard.writeText(formatLine(card));
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
    const sale = state.sales.find((item) => item.id === action.saleId);
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
}

function copyText(text, message = "Copied") {
  navigator.clipboard.writeText(text).then(() => toast(message));
}

function buyerSummary(buyer) {
  const cards = cardsForBuyer(buyer); const order = orderFor(buyer);
  const subtotal = cards.reduce((sum, card) => sum + Number(card.claimPrice ?? card.price), 0);
  const shipping = shippingAmount(order);
  const total = subtotal + shipping - Number(order.discount || 0);
  const firstName = String(buyer || "").trim().split(/\s+/)[0] || buyer;
  return [`Hi ${firstName} — here’s your total from the sale:`, "", ...cards.map((card) => `${card.year} ${card.set} #${card.number} ${card.name}${duplicateInfo(card).label ? ` ${duplicateInfo(card).label}` : ""} — ${money(card.claimPrice ?? card.price)} (${card.claimType === "offer" ? "accepted offer" : "claim"})`), "", `Cards: ${money(subtotal)}`, ...(order.discount ? [`Discount: -${money(order.discount)}`] : []), `Shipping (${order.shippingMethod}): ${money(shipping)}`, `Total: ${money(total)}`, "", "Please confirm your mailing address when you send payment. Thanks!"] .join("\n");
}

function trackingMessage(buyer) {
  const firstName = String(buyer || "").trim().split(/\s+/)[0] || buyer;
  const order = orderFor(buyer);
  return [`Hi ${firstName} — your cards have shipped!`, "", `Tracking number: ${order.trackingNumber}`, "", "Thanks again for your purchase!"] .join("\n");
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
    $("#updateMessage").textContent = `You are using version ${result.currentVersion}. Download ${result.assetName} from the verified GitHub release.`;
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
    : (result.status === "unavailable" ? "No public GitHub release is available yet." : (result.message || "The update check could not be completed."));
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  $("#importBtn").addEventListener("click", importSpreadsheet);
  $$('[data-action="import"]').forEach((button) => button.addEventListener("click", importSpreadsheet));
  $("#addImagesBtn").addEventListener("click", () => addImages("files"));
  $("#addFolderBtn").addEventListener("click", () => addImages("folder"));
  $("#autoMatchBtn").addEventListener("click", autoMatchImages);
  $("#newSaleBtn").addEventListener("click", () => $("#newSaleDialog").showModal());
  $("#deleteSaleBtn").addEventListener("click", deleteActiveSale);
  $("#createSaleBtn").addEventListener("click", (event) => {
    event.preventDefault(); const name = $("#newSaleName").value.trim(); if (!name) return;
    const sale = { id: uid(), name, pweShipping: Number($("#newSalePweShipping").value || 0), pmwtShipping: Number($("#newSalePmwtShipping").value || 0), template: DEFAULT_TEMPLATE, cards: [], images: [], orders: {}, additionalLookupFolders: [], excludedLookupFolders: [] };
    state.sales.push(sale); state.activeSaleId = sale.id; state.selectedBuyer = ""; $("#newSaleDialog").close(); saveSoon(); render(); toast("New sale created.");
  });
  $("#saleSelect").addEventListener("change", (event) => { state.activeSaleId = event.target.value; state.selectedBuyer = ""; selectedListingIds.clear(); saveSoon(); render(); });
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.filter; $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button)); renderListings(); }));
  $("#cardSearch").addEventListener("input", (event) => { state.query = event.target.value; renderListings(); });
  $("#listingRows").addEventListener("click", (event) => {
    const copyId = event.target.dataset.copyCard;
    const imageId = event.target.dataset.imageCard;
    const deleteId = event.target.dataset.deleteCard;
    const restoreId = event.target.dataset.restoreCard;
    if (copyId) copyAndHideCard(copyId);
    if (imageId) chooseManualImage(imageId);
    if (deleteId) deleteCard(deleteId);
    if (restoreId) restoreCard(restoreId);
  });
  $("#listingRows").addEventListener("change", (event) => {
    const id = event.target.dataset.selectListing;
    if (!id) return;
    if (event.target.checked) selectedListingIds.add(id); else selectedListingIds.delete(id);
    renderListings();
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
    if (event.target.dataset.assignCard) assignBuyer(row.dataset.claimRow, $("[data-claim-buyer]", row).value, $("[data-claim-offer]", row).value, $("[data-claim-type='offer']", row).checked ? "offer" : "claim");
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
  $("#orderDetail").addEventListener("input", (event) => {
    if (!state.selectedBuyer) return; const order = orderFor(state.selectedBuyer);
    if (event.target.id === "orderShippingMethod") order.shippingMethod = event.target.value;
    if (event.target.id === "orderDiscount") order.discount = Number(event.target.value || 0);
    saveSoon(); renderOrderDetail();
  });
  $("#orderDetail").addEventListener("click", (event) => {
    const status = event.target.dataset.orderStatus;
    if (status && state.selectedBuyer) { orderFor(state.selectedBuyer).status = status; saveSoon(); render(); toast(`Order marked ${status}.`); }
    if (event.target.id === "copySummaryBtn") copyText(buyerSummary(state.selectedBuyer), "Buyer summary copied.");
  });
  $("#packingBuyer").addEventListener("change", renderPacking);
  $("#packingContent").addEventListener("input", (event) => { if (event.target.id === "trackingNumber") { const buyer = $("#packingBuyer").value; orderFor(buyer).trackingNumber = event.target.value.trim(); const button = $("#copyTrackingMessageBtn"); if (button) button.disabled = !orderFor(buyer).trackingNumber; saveSoon(); } });
  $("#packingContent").addEventListener("change", (event) => { const id = event.target.dataset.packCard; if (id) { const card = activeSale().cards.find((item) => item.id === id); card.packed = event.target.checked; saveSoon(); renderPacking(); } });
  $("#packingContent").addEventListener("click", (event) => {
    const buyer = $("#packingBuyer").value;
    if (event.target.id === "checkAllCardsBtn") { const cards = cardsForBuyer(buyer); const shouldPack = cards.some((card) => !card.packed); cards.forEach((card) => card.packed = shouldPack); saveSoon(); renderPacking(); toast(shouldPack ? "All cards checked." : "All cards unchecked."); }
    if (event.target.id === "completePackingBtn" && !event.target.disabled) { orderFor(buyer).status = "packed"; saveSoon(); render(); toast(`${buyer}'s package is complete.`); }
    if (event.target.id === "copyTrackingMessageBtn") { const order = orderFor(buyer); order.trackingNumber = $("#trackingNumber").value.trim(); if (!order.trackingNumber) return toast("Enter a tracking number first."); copyText(trackingMessage(buyer), "Shipping message copied."); }
  });
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
  $("#downloadUpdateBtn").addEventListener("click", async () => { if (availableUpdate) await window.cardSale.openUpdate(availableUpdate.downloadUrl); });
  document.addEventListener("keydown", (event) => {
    const editing = event.target.matches("input, textarea, select, [contenteditable='true']");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !editing) { event.preventDefault(); undoLastCompletion(); }
  });
}

async function init() {
  const saved = await window.cardSale.load();
  if (saved?.sales?.length) {
    state = { filter: "all", query: "", claimQuery: "", selectedBuyer: "", ...saved };
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
    state.sales.forEach((sale) => {
      if (!sale.template || legacyTemplates.has(sale.template)) sale.template = DEFAULT_TEMPLATE;
      sale.pweShipping ??= 1;
      sale.pmwtShipping ??= sale.shipping ?? 5;
      sale.additionalLookupFolders ||= [];
      sale.excludedLookupFolders ||= [];
      sale.orders ||= {};
      const usedImages = new Set();
      sale.cards.forEach((card) => {
        card.purchaseDate = normalizePurchaseDate(card.purchaseDate);
        if (card.status !== "available") card.claimType ||= card.offerPrice != null ? "offer" : "claim";
        const imageKey = String(card.imagePath || "").toLowerCase();
        if (imageKey && usedImages.has(imageKey)) card.imagePath = "";
        else if (imageKey) usedImages.add(imageKey);
      });
      Object.values(sale.orders).forEach((order) => { order.shippingMethod ||= Number(order.shipping) === Number(sale.pweShipping) ? "PWE" : "PMWT"; });
    });
    undoStack = state.sales.flatMap((sale) => [
      ...sale.cards.filter((card) => card.hiddenAfterCopy).map((card) => ({ saleId: sale.id, cardId: card.id, at: card.completedAt || "" })),
      ...sale.images.filter((image) => image.hiddenAfterDrag).map((image) => ({ saleId: sale.id, imageId: image.id, at: image.hiddenAt || "" }))
    ]).sort((a, b) => a.at.localeCompare(b.at));
  }
  bindEvents(); render();
  $("#appVersion").textContent = `Version ${await window.cardSale.version()}`;
  checkForUpdates(false);
}

init().catch((error) => {
  console.error(error);
  toast("Card Sale Manager could not load its saved data.");
});
