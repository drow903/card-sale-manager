/* Card Sale Manager 2.0 feature layer. Kept separate so the established workflow remains stable. */
let v2OrderPages = [];
let v2OrderPageIndex = 0;
let v2TrailerMusic = "";
let v2TrailerBackground = "";
let v2TrailerOrder = [];

function v2SaleSettings() {
  const sale = activeSale();
  sale.facebookCaptureSettings ||= { claimWords: ["claim", "sold", "mine"], ignoreWords: ["pass", "nevermind", "never mind"] };
  sale.facebookCaptures ||= [];
  sale.livePopoutPreferences ||= { autoAdvance: true, compact: false, opacity: 1 };
  sale.trailerSettings ||= {};
  sale.trailerSettings.includeIntro ??= true;
  sale.trailerSettings.includeOutro ??= true;
  return sale;
}

function v2ListingWithoutFlaws(card) {
  return [card.year, card.set, card.name, numberLabel(card), card.condition, duplicateInfo(card).label].map((value) => String(value || "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ");
}

function v2CaptureSuggestion(capture) {
  const haystack = `${capture.contextText || ""} ${capture.commentText || ""}`.toLowerCase();
  let best = null; let bestScore = 0;
  activeSale().cards.forEach((card) => {
    let score = 0;
    const terms = [card.name, card.year, card.number, card.set].map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
    if (terms[0] && haystack.includes(terms[0])) score += 55;
    if (terms[1] && haystack.includes(terms[1])) score += 18;
    if (terms[2] && new RegExp(`(?:#|\\b)${terms[2].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(haystack)) score += 18;
    if (terms[3] && haystack.includes(terms[3])) score += 9;
    if (score > bestScore) { best = card; bestScore = score; }
  });
  return bestScore >= 45 ? best?.id || "" : "";
}

function v2ClassifyCapture(capture) {
  const settings = v2SaleSettings().facebookCaptureSettings;
  const text = String(capture.commentText || "").toLowerCase();
  if (settings.ignoreWords.some((word) => word && text.includes(String(word).toLowerCase()))) return "unrecognized";
  if (/\$\s*\d+(?:\.\d{1,2})?|\b(?:offer|would you take|take)\b/i.test(text)) return "offer";
  if (settings.claimWords.some((word) => word && new RegExp(`\\b${String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text))) return "claim";
  if (/\?|how much|available|condition/i.test(text)) return "question";
  if (/backup|next|second/i.test(text)) return "backup";
  return "unrecognized";
}

function v2PendingCaptures() { return v2SaleSettings().facebookCaptures.filter((item) => item.status === "pending"); }
function v2UpdateCaptureBadge() {
  const count = v2PendingCaptures().length; const badge = $("#facebookCaptureCount");
  if (!badge) return; badge.textContent = String(count); badge.classList.toggle("hidden", !count);
}

function v2RenderCaptureDialog() {
  const sale = v2SaleSettings();
  $("#facebookClaimWords").value = sale.facebookCaptureSettings.claimWords.join(", ");
  $("#facebookIgnoreWords").value = sale.facebookCaptureSettings.ignoreWords.join(", ");
  const cards = sale.cards;
  $("#facebookCaptureList").innerHTML = sale.facebookCaptures.length ? sale.facebookCaptures.map((capture) => `<article class="facebook-capture ${capture.status !== "pending" ? "processed" : ""}" data-facebook-capture="${escapeHtml(capture.id)}"><header><strong>${escapeHtml(capture.displayedName || "Buyer name not detected")}</strong><span>${escapeHtml(capture.displayedTime || new Date(capture.capturedAt).toLocaleString())}</span></header><blockquote>${escapeHtml(capture.commentText)}</blockquote>${capture.pageMismatch ? '<p class="cost-warning">This comment came from a different Facebook URL than the one saved for this sale.</p>' : ""}<div class="facebook-capture-fields"><label>Card<select data-capture-card><option value="">Choose card…</option>${cards.map((card) => `<option value="${card.id}" ${capture.cardId === card.id ? "selected" : ""}>${escapeHtml(card.ref)} · ${escapeHtml(v2ListingWithoutFlaws(card))}</option>`).join("")}</select></label><label>Buyer<input data-capture-buyer value="${escapeHtml(capture.displayedName || "")}" /></label><label>Action<select data-capture-type>${["claim", "offer", "backup", "question", "unrecognized"].map((type) => `<option value="${type}" ${capture.type === type ? "selected" : ""}>${type[0].toUpperCase()}${type.slice(1)}</option>`).join("")}</select></label><label>Offer price<input data-capture-price type="number" min="0" step="0.01" value="${escapeHtml(capture.offerPrice || "")}" /></label></div><footer>${capture.status === "pending" ? '<button type="button" class="primary" data-capture-approve>Approve</button><button type="button" class="secondary" data-capture-ignore>Ignore</button>' : `<span class="status paid">${escapeHtml(capture.status)}</span>`}</footer></article>`).join("") : '<div class="empty-state"><h3>No captured comments yet</h3><p>Use the browser right-click action, then review the result here.</p></div>';
  v2UpdateCaptureBadge();
}

async function v2RefreshCompanionStatus() {
  const status = await window.cardSale.facebookCompanionStatus();
  const node = $("#facebookCompanionStatus");
  node.textContent = status.owner ? (status.running ? (status.pairing ? "Waiting for extension pairing" : "Local companion ready") : "Local companion unavailable") : "Owner Tools license required";
  node.className = `status ${status.owner && status.running ? "paid" : "pending"}`;
}

function v2LivePayload() {
  const sale = v2SaleSettings(); const cards = liveCards(); const card = cards[Math.max(0, Math.min(liveIndex, cards.length - 1))];
  const posted = sale.cards.filter((item) => item.postedAt || item.hiddenAfterCopy).length;
  return { saleName: sale.name, theme: state.preferences?.theme || "dark", posted, total: sale.cards.length, percent: sale.cards.length ? Math.round(posted / sale.cards.length * 100) : 0, currentIndex: card ? cards.indexOf(card) : 0, available: cards.length, preferences: sale.livePopoutPreferences, card: card ? { id: card.id, name: card.name, listing: formatLine(card), copyPending: Boolean(card.liveCopyPending), images: requiredImageSlots(sale).map((slot) => { const imagePath = imagePathFor(card, slot); const record = sale.images?.find((item) => String(item.path).toLowerCase() === String(imagePath).toLowerCase()); return { slot, label: saleImageMode(sale) === "front-back" ? imageSlotLabel(slot) : "Card image", path: imagePath, fileName: fileName(imagePath), dragged: Boolean(record?.hiddenAfterDrag) }; }) } : null };
}

function v2SyncPopout() { window.cardSale.syncLivePopout(v2LivePayload()).catch(() => {}); }

async function v2HandlePopoutAction(action) {
  const sale = v2SaleSettings(); const cards = liveCards(); const current = cards[Math.max(0, Math.min(liveIndex, cards.length - 1))];
  if (action.type === "preferences") { Object.assign(sale.livePopoutPreferences, action.values || {}); saveSoon(); }
  if (action.type === "previous") liveIndex = Math.max(0, liveIndex - 1);
  if (action.type === "next") {
    if (current?.liveCopyPending) { current.liveCopyPending = false; current.hiddenAfterCopy = true; current.completedAt = new Date().toISOString(); }
    else liveIndex = Math.min(Math.max(0, cards.length - 1), liveIndex + 1);
    saveSoon(); renderLiveSale();
  }
  if (action.type === "undo") undoLastCompletion();
  if (action.type === "image-dragged") { const record = sale.images?.find((item) => String(item.path).toLowerCase() === String(action.path).toLowerCase()); if (record) { record.hiddenAfterDrag = true; record.hiddenAt = new Date().toISOString(); undoStack.push({ saleId: sale.id, imageId: record.id }); saveSoon(); } renderLiveSale(); }
  if (action.type === "copy" && current) {
    if (action.autoAdvance === false) { await window.cardSale.copyText(formatLine(current)); current.postedAt ||= new Date().toISOString(); current.liveCopyPending = true; saveSoon(); renderLiveSale(); toast("Listing copied. Use Next when you’re ready."); }
    else copyAndHideCard(current.id);
  }
  v2SyncPopout();
}

function v2LoadImage(source) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("The image file could not be decoded.")); image.src = source; }); }
function v2Contain(ctx, image, x, y, width, height) { const ratio = Math.min(width / image.width, height / image.height); const drawWidth = image.width * ratio; const drawHeight = image.height * ratio; ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight); }

async function v2CreateOrderPage(cards, settings, page, pageCount) {
  const vertical = settings.format === "vertical"; const width = 1080; const height = vertical ? 1920 : settings.format === "letter" ? 1392 : 1080;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d");
  const brand = ensurePackingSettings(); const accent = brand.accent || "#16a34a";
  ctx.fillStyle = "#071521"; ctx.fillRect(0, 0, width, height); ctx.fillStyle = accent; ctx.fillRect(0, 0, width, 18);
  ctx.fillStyle = "#fff"; ctx.font = "800 54px system-ui"; ctx.fillText(settings.heading || "Your card order", 64, 94);
  ctx.fillStyle = "#8fe3b4"; ctx.font = "700 25px system-ui"; ctx.fillText(brand.brandName || state.preferences?.sellerName || "Card Sale Manager", 64, 137);
  const logoSource = brand.logoPath ? await window.cardSale.packingFileDataUrl(brand.logoPath) : (brand.brandName === "Card Sale Manager" ? BUILT_IN_BRAND_LOGO : "");
  if (logoSource) { try { const logo = await v2LoadImage(logoSource); v2Contain(ctx, logo, width - 340, 42, 276, 105); } catch {} }
  if (settings.showStatus && settings.status) { ctx.fillStyle = "#b7c7d7"; ctx.font = "24px system-ui"; ctx.fillText(settings.status, 64, 177); }
  const top = settings.showStatus ? 215 : 180; const gap = 26; const cols = settings.layout === "compact" ? 2 : 1; const rows = Math.ceil(cards.length / cols); const cellWidth = (width - 128 - gap * (cols - 1)) / cols; const cellHeight = Math.min((height - top - 100 - gap * Math.max(0, rows - 1)) / Math.max(1, rows), settings.layout === "compact" ? 360 : 560);
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index]; const col = index % cols; const row = Math.floor(index / cols); const x = 64 + col * (cellWidth + gap); const y = top + row * (cellHeight + gap);
    ctx.fillStyle = "#112433"; ctx.beginPath(); ctx.roundRect(x, y, cellWidth, cellHeight, 22); ctx.fill();
    const imageHeight = cellHeight - 105; ctx.fillStyle = "#e8eef4"; ctx.beginPath(); ctx.roundRect(x + 16, y + 16, cellWidth - 32, imageHeight - 16, 14); ctx.fill();
    if (card.imagePath) { try { const dataUrl = await window.cardSale.packingFileDataUrl(card.imagePath); const image = await v2LoadImage(dataUrl); v2Contain(ctx, image, x + 24, y + 24, cellWidth - 48, imageHeight - 32); } catch {} }
    else { ctx.fillStyle = "#6d7f90"; ctx.font = "700 24px system-ui"; ctx.textAlign = "center"; ctx.fillText("Image not available", x + cellWidth / 2, y + imageHeight / 2); ctx.textAlign = "left"; }
    ctx.fillStyle = "#fff"; ctx.font = `700 ${cols === 2 ? 21 : 27}px system-ui`; const listing = v2ListingWithoutFlaws(card); ctx.fillText(listing.length > (cols === 2 ? 38 : 70) ? `${listing.slice(0, cols === 2 ? 37 : 69)}…` : listing, x + 20, y + cellHeight - 60);
    ctx.fillStyle = accent; ctx.font = `800 ${cols === 2 ? 25 : 31}px system-ui`; ctx.fillText(money(card.claimPrice ?? card.price), x + 20, y + cellHeight - 22);
  }
  ctx.fillStyle = "#8ca1b2"; ctx.font = "20px system-ui"; ctx.textAlign = "right"; ctx.fillText(`Page ${page} of ${pageCount}`, width - 64, height - 34); ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

function v2OrderSignature(cards) { return cards.map((card) => `${card.id}:${card.claimPrice ?? card.price}:${card.imagePath || ""}`).join("|"); }
async function v2GenerateOrderCards() {
  const cards = cardsForBuyer(state.selectedBuyer); if (!cards.length) return toast("Choose a buyer order first.");
  const settings = { format: $("#orderCardFormat").value, layout: $("#orderCardLayout").value, heading: $("#orderCardHeading").value.trim(), showStatus: $("#orderCardShowStatus").checked, status: $("#orderCardStatus").value.trim() };
  const perPage = settings.format === "vertical" ? (settings.layout === "compact" ? 8 : 4) : settings.format === "letter" ? (settings.layout === "compact" ? 10 : 5) : (settings.layout === "compact" ? 6 : 3);
  const groups = []; for (let index = 0; index < cards.length; index += perPage) groups.push(cards.slice(index, index + perPage));
  v2OrderPages = []; for (let index = 0; index < groups.length; index += 1) v2OrderPages.push(await v2CreateOrderPage(groups[index], settings, index + 1, groups.length));
  v2OrderPageIndex = 0; const order = orderFor(state.selectedBuyer); order.visualOrderCard = { signature: v2OrderSignature(cards), settings, generatedAt: new Date().toISOString() }; saveSoon(); v2RenderOrderPreview();
}
function v2RenderOrderPreview() {
  $("#orderCardPreview").innerHTML = v2OrderPages.length ? `<button type="button" data-order-page-prev>‹</button><img src="${v2OrderPages[v2OrderPageIndex]}" alt="Order card page ${v2OrderPageIndex + 1}" /><button type="button" data-order-page-next>›</button>` : '<div class="empty-state"><p>Generate a preview before saving or copying.</p></div>';
  $("#orderCardPageCount").textContent = v2OrderPages.length ? `Page ${v2OrderPageIndex + 1} of ${v2OrderPages.length}` : ""; $("#copyOrderCardBtn").disabled = !v2OrderPages.length; $("#saveOrderCardsBtn").disabled = !v2OrderPages.length;
}
function v2OpenOrderCards() {
  const cards = cardsForBuyer(state.selectedBuyer); const order = orderFor(state.selectedBuyer); const stale = order.visualOrderCard && order.visualOrderCard.signature !== v2OrderSignature(cards);
  $("#orderCardStaleMessage").classList.toggle("hidden", !stale); $("#orderCardStaleMessage").textContent = stale ? "This order changed since the last visual card was generated. Create a fresh preview before sharing it." : "";
  v2OrderPages = []; v2RenderOrderPreview(); $("#visualOrderCardDialog").showModal();
}

function v2TrailerCandidates() { return activeSale().cards.filter((card) => card.imagePath); }
function v2AutomaticTrailerOrder(candidates) {
  const count = Math.min(candidates.length, Math.max(1, Number($("#trailerCardCount").value || 16)));
  if ($("#trailerSelection").value === "random") return [...candidates].sort(() => Math.random() - .5).slice(0, count).map((card) => card.id);
  if ($("#trailerSelection").value === "manual") return [];
  const priceWeight = Number($("#trailerPriceWeight").value || 0) / 100; const yearWeight = Number($("#trailerYearWeight").value || 0) / 100; const playerWeight = Number($("#trailerPlayerWeight").value || 0) / 100;
  const remaining = [...candidates]; const selected = []; const years = new Set(); const players = new Set(); const maxPrice = Math.max(1, ...remaining.map((card) => Number(card.price || 0)));
  while (selected.length < count && remaining.length) {
    remaining.sort((a, b) => {
      const score = (card) => (Number(card.price || 0) / maxPrice) * priceWeight + (!years.has(String(card.year)) ? yearWeight : 0) + (!players.has(String(card.name).toLowerCase()) ? playerWeight : 0);
      return score(b) - score(a) || Number(a.sourceOrder || a.ref) - Number(b.sourceOrder || b.ref);
    });
    const card = remaining.shift(); selected.push(card.id); years.add(String(card.year)); players.add(String(card.name).toLowerCase());
  }
  return selected;
}
function v2RenderTrailerPicker() {
  const candidates = v2TrailerCandidates(); const mode = $("#trailerSelection").value;
  if (!v2TrailerOrder.length) v2TrailerOrder = v2AutomaticTrailerOrder(candidates);
  const ordered = [...v2TrailerOrder.map((id) => candidates.find((card) => card.id === id)).filter(Boolean), ...candidates.filter((card) => !v2TrailerOrder.includes(card.id))];
  $("#trailerCardPicker").innerHTML = `<div class="trailer-picker-heading"><strong>${candidates.length} cards have front images</strong><span>${mode === "manual" ? "Choose cards, then use arrows to set the scene order" : "CSM built a mix; edit or reorder it before rendering"}</span></div>${ordered.map((card) => `<label class="trailer-card-choice"><input type="checkbox" data-trailer-card="${card.id}" ${v2TrailerOrder.includes(card.id) ? "checked" : ""}/><img src="${fileUrl(card.imagePath)}" alt=""/><span>${escapeHtml(card.ref)} · ${escapeHtml(card.name)}</span><span class="trailer-order-actions"><button type="button" data-trailer-up="${card.id}">↑</button><button type="button" data-trailer-down="${card.id}">↓</button></span></label>`).join("")}`;
}
function v2TrailerFileName(filePath) { return String(filePath || "").split(/[\\/]/).pop() || "No filename"; }
function v2ShowTrailerImageWarnings(items = []) {
  let panel = $("#trailerImageWarnings");
  if (!panel) { panel = document.createElement("div"); panel.id = "trailerImageWarnings"; panel.className = "trailer-image-warnings hidden"; $("#trailerCardPicker")?.before(panel); }
  if (!panel) return;
  if (!items.length) { panel.classList.add("hidden"); panel.innerHTML = ""; return; }
  panel.innerHTML = `<strong>${items.length} selected ${items.length === 1 ? "image was" : "images were"} skipped</strong><span>The remaining valid images will still be used. Rematch these cards before including them in a trailer.</span><ul>${items.map(({ card, reason }) => `<li><strong>${escapeHtml(card.ref || "—")} · ${escapeHtml(card.name || "Unnamed card")}</strong><span>${escapeHtml(v2TrailerFileName(card.imagePath))} — ${escapeHtml(reason)}</span></li>`).join("")}</ul>`;
  panel.classList.remove("hidden");
}
async function v2PrepareTrailerCards(cards) {
  const valid = []; const invalid = [];
  v2ShowTrailerImageWarnings();
  for (let index = 0; index < cards.length; index += 1) {
    $("#trailerProgressBar").style.width = `${Math.max(2, Math.round(((index + 1) / Math.max(1, cards.length)) * 18))}%`;
    $("#trailerProgressText").textContent = `Checking image ${index + 1} of ${cards.length}…`;
    let source = "";
    try {
      source = await window.cardSale.packingFileDataUrl(cards[index].imagePath);
      if (!source) throw new Error("File not found at its saved location");
      await v2LoadImage(source);
      valid.push({ card: cards[index] });
    } catch (error) {
      invalid.push({ card: cards[index], reason: source ? "File could not be read as an image" : (error.message || "File not found") });
    }
  }
  v2ShowTrailerImageWarnings(invalid);
  return { valid, invalid };
}
async function v2TrailerFrame(card, format, settings) {
  const sizes = { vertical: [1080, 1920], square: [1080, 1080], widescreen: [1920, 1080] }; const [width, height] = sizes[format];
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); const source = await window.cardSale.packingFileDataUrl(card.imagePath); if (!source) throw new Error(`${card.ref || "Card"} · ${card.name || "Unnamed card"}: image file not found (${v2TrailerFileName(card.imagePath)}).`); const image = await v2LoadImage(source).catch(() => { throw new Error(`${card.ref || "Card"} · ${card.name || "Unnamed card"}: image file could not be read (${v2TrailerFileName(card.imagePath)}).`); });
  if (settings.backgroundMode === "blur") { ctx.save(); ctx.filter = "blur(38px) brightness(.42)"; const scale = Math.max(width / image.width, height / image.height); ctx.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale); ctx.restore(); }
  else { ctx.fillStyle = settings.backgroundColor; ctx.fillRect(0, 0, width, height); if (settings.backgroundMode === "custom" && v2TrailerBackground) { try { const bg = await v2LoadImage(await window.cardSale.packingFileDataUrl(v2TrailerBackground)); ctx.globalAlpha = .35; v2Contain(ctx, bg, 0, 0, width, height); ctx.globalAlpha = 1; } catch {} } }
  const pad = Math.round(Math.min(width, height) * .085); ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 36; ctx.beginPath(); ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 28); ctx.fill(); ctx.shadowBlur = 0; v2Contain(ctx, image, pad + 24, pad + 24, width - pad * 2 - 48, height - pad * 2 - 48);
  const logoSize = Math.round(Math.min(width, height) * .09); const margin = 26; const left = settings.watermark.includes("left"); const top = settings.watermark.includes("top"); const logoX = left ? margin : width - logoSize * 2.4 - margin; const logoY = top ? margin : height - logoSize - margin; ctx.fillStyle = "rgba(7,21,33,.78)"; ctx.beginPath(); ctx.roundRect(logoX, logoY, logoSize * 2.4, logoSize, 14); ctx.fill(); try { const logo = await v2LoadImage(BUILT_IN_BRAND_LOGO); v2Contain(ctx, logo, logoX + 8, logoY + 8, logoSize * 2.4 - 16, logoSize - 16); } catch {}
  return canvas.toDataURL("image/png");
}
async function v2TrailerTitleFrame(format, text, settings, subtitle) {
  const sizes = { vertical: [1080, 1920], square: [1080, 1080], widescreen: [1920, 1080] }; const [width, height] = sizes[format]; const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); ctx.fillStyle = settings.backgroundColor; ctx.fillRect(0, 0, width, height); ctx.fillStyle = "#18bc70"; ctx.fillRect(0, height * .47, width, 12); ctx.fillStyle = "#fff"; ctx.font = `900 ${Math.round(Math.min(width, height) * .08)}px system-ui`; ctx.textAlign = "center"; ctx.fillText(text, width / 2, height * .43); ctx.font = `700 ${Math.round(Math.min(width, height) * .032)}px system-ui`; ctx.fillText(subtitle || activeSale().name, width / 2, height * .55); return canvas.toDataURL("image/png");
}
function v2EnsureTrailerSlideControls() {
  if (!$("#trailerIncludeIntro")) { const label = document.createElement("label"); label.className = "check-label trailer-slide-toggle"; label.innerHTML = '<input id="trailerIncludeIntro" type="checkbox" checked /> Include intro slide'; $("#trailerIntroHeading")?.closest("label")?.after(label); }
  if (!$("#trailerIncludeOutro")) { const label = document.createElement("label"); label.className = "check-label trailer-slide-toggle"; label.innerHTML = '<input id="trailerIncludeOutro" type="checkbox" checked /> Include outro slide'; $("#trailerOutroHeading")?.closest("label")?.after(label); }
}
function v2ApplyTrailerSlideControls() {
  const includeIntro = $("#trailerIncludeIntro")?.checked !== false; const includeOutro = $("#trailerIncludeOutro")?.checked !== false;
  if ($("#trailerIntroHeading")) $("#trailerIntroHeading").disabled = !includeIntro;
  if ($("#trailerOutroHeading")) $("#trailerOutroHeading").disabled = !includeOutro;
  $$('[data-trailer-meta]').forEach((input) => input.disabled = !includeIntro && !includeOutro);
}
async function v2RenderTrailer(preview) {
  const formats = $$('[data-trailer-format]:checked').map((input) => input.dataset.trailerFormat); if (!formats.length) return toast("Choose at least one output format.");
  const checked = new Set($$('[data-trailer-card]:checked').map((input) => input.dataset.trailerCard)); const cards = v2TrailerOrder.filter((id) => checked.has(id)).map((id) => activeSale().cards.find((card) => card.id === id)).filter(Boolean); $$('[data-trailer-card]:checked').forEach((input) => { if (!cards.some((card) => card.id === input.dataset.trailerCard)) { const card = activeSale().cards.find((item) => item.id === input.dataset.trailerCard); if (card) cards.push(card); } }); if (!cards.length) return toast("Choose at least one card with an image.");
  $("#trailerProgress").classList.remove("hidden"); $("#cancelTrailerBtn").classList.remove("hidden");
  try {
    const prepared = await v2PrepareTrailerCards(cards);
    if (!prepared.valid.length) throw new Error(`None of the ${cards.length} selected card images could be used. Review the skipped-image list and rematch those cards.`);
    const validCards = prepared.valid.map((item) => item.card);
    const settings = { style: $("#trailerStyle").value, duration: Number($("#trailerDuration").value), backgroundMode: $("#trailerBackgroundMode").value, backgroundColor: $("#trailerBackgroundColor").value, watermark: $("#trailerWatermark").value };
    const includeIntro = $("#trailerIncludeIntro")?.checked !== false; const includeOutro = $("#trailerIncludeOutro")?.checked !== false;
    const years = validCards.map((card) => Number(card.year)).filter(Number.isFinite); const meta = new Set($$('[data-trailer-meta]:checked').map((input) => input.dataset.trailerMeta)); const subtitle = [meta.has("sale") ? activeSale().name : "", meta.has("count") ? `${validCards.length} cards` : "", meta.has("years") && years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ""].filter(Boolean).join(" · ");
    Object.assign(activeSale().trailerSettings, settings, { musicPath: v2TrailerMusic, backgroundPath: v2TrailerBackground, introHeading: $("#trailerIntroHeading").value, outroHeading: $("#trailerOutroHeading").value, includeIntro, includeOutro, order: cards.map((card) => card.id) }); saveSoon();
    for (const format of formats) { const frames = []; if (includeIntro) frames.push(await v2TrailerTitleFrame(format, $("#trailerIntroHeading").value, settings, subtitle)); for (const item of prepared.valid) frames.push(await v2TrailerFrame(item.card, format, settings)); if (includeOutro) frames.push(await v2TrailerTitleFrame(format, $("#trailerOutroHeading").value, settings, subtitle)); const sizes = { vertical: [1080, 1920], square: [1080, 1080], widescreen: [1920, 1080] }; const result = await window.cardSale.renderTrailer({ frames, width: sizes[format][0], height: sizes[format][1], duration: settings.duration, style: settings.style, preview, musicPath: v2TrailerMusic, musicStart: Number($("#trailerMusicStart").value || 0), musicVolume: Number($("#trailerMusicVolume").value) / 100, saleName: activeSale().name, formatName: format }); if (!result.success) throw new Error(result.message || "The trailer encoder did not return a completed video."); if (preview) break; } if (!preview) toast(prepared.invalid.length ? `Sale trailer saved using ${prepared.valid.length} valid images; ${prepared.invalid.length} skipped.` : "Sale trailer saved to Downloads.");
  }
  catch (error) { const message = String(error?.message || error || "The trailer could not be created.").replace(/^Error invoking remote method ['\"]trailer:render['\"]:\s*Error:\s*/i, ""); $("#trailerProgressText").textContent = message; toast(message); }
  finally { $("#cancelTrailerBtn").classList.add("hidden"); }
}

function v2Init() {
  v2EnsureTrailerSlideControls();
  $$('[data-owner-facebook]').forEach((element) => element.classList.toggle("hidden", !currentLicense.owner));
  $("#facebookCaptureBtn")?.addEventListener("click", async () => { v2RenderCaptureDialog(); await v2RefreshCompanionStatus(); $("#facebookCaptureDialog").showModal(); });
  $("#facebookPairBtn")?.addEventListener("click", async () => { try { await window.cardSale.startFacebookPairing(); await v2RefreshCompanionStatus(); toast("Pairing is open for five minutes. Click Connect in the extension."); } catch (error) { toast(error.message); } });
  $("#facebookExtensionFolderBtn")?.addEventListener("click", () => window.cardSale.openFacebookExtensionFolder());
  ["#facebookClaimWords", "#facebookIgnoreWords"].forEach((selector) => $(selector)?.addEventListener("change", () => { const sale = v2SaleSettings(); sale.facebookCaptureSettings[selector.includes("Ignore") ? "ignoreWords" : "claimWords"] = $(selector).value.split(",").map((value) => value.trim()).filter(Boolean); saveSoon(); }));
  $("#facebookCaptureList")?.addEventListener("click", (event) => { const row = event.target.closest("[data-facebook-capture]"); if (!row) return; const capture = v2SaleSettings().facebookCaptures.find((item) => item.id === row.dataset.facebookCapture); if (!capture) return; if (event.target.matches("[data-capture-ignore]")) { capture.status = "ignored"; saveSoon(); v2RenderCaptureDialog(); return; } if (!event.target.matches("[data-capture-approve]")) return; const cardId = $("[data-capture-card]", row).value; const buyer = $("[data-capture-buyer]", row).value.trim(); const type = $("[data-capture-type]", row).value; const price = $("[data-capture-price]", row).value; if (["claim", "offer"].includes(type)) { if (!cardId || !buyer) return toast("Choose a card and enter the buyer name."); assignBuyer(cardId, buyer, price, type, `Captured from Facebook: ${capture.commentText}`); } capture.status = type === "question" ? "question noted" : type === "backup" ? "backup noted" : "approved"; capture.cardId = cardId; capture.type = type; saveSoon(); v2RenderCaptureDialog(); });
  window.cardSale.onFacebookCapture((capture) => { const sale = v2SaleSettings(); const duplicate = capture.commentId && sale.facebookCaptures.some((item) => item.commentId === capture.commentId); if (duplicate) return toast("That Facebook comment was already captured."); const record = { ...capture, id: crypto.randomUUID(), status: "pending", type: v2ClassifyCapture(capture), cardId: v2CaptureSuggestion(capture), pageMismatch: Boolean(sale.facebookPostUrl && capture.pageUrl && !capture.pageUrl.includes(sale.facebookPostUrl) && !sale.facebookPostUrl.includes(capture.pageUrl)) }; const offer = String(capture.commentText || "").match(/\$\s*(\d+(?:\.\d{1,2})?)/); if (offer) record.offerPrice = offer[1]; sale.facebookCaptures.unshift(record); saveSoon(); v2UpdateCaptureBadge(); if ($("#facebookCaptureDialog").open) v2RenderCaptureDialog(); toast("Facebook comment captured for review."); });

  $("#popoutLiveSaleBtn")?.addEventListener("click", () => window.cardSale.openLivePopout(v2LivePayload()));
  window.cardSale.onLivePopoutAction(v2HandlePopoutAction);
  $("#previewOrderCardsBtn")?.addEventListener("click", v2GenerateOrderCards);
  $("#orderCardPreview")?.addEventListener("click", (event) => { if (event.target.matches("[data-order-page-prev]")) v2OrderPageIndex = Math.max(0, v2OrderPageIndex - 1); if (event.target.matches("[data-order-page-next]")) v2OrderPageIndex = Math.min(v2OrderPages.length - 1, v2OrderPageIndex + 1); v2RenderOrderPreview(); });
  $("#copyOrderCardBtn")?.addEventListener("click", async () => { if (v2OrderPages[v2OrderPageIndex] && await window.cardSale.copyImage(v2OrderPages[v2OrderPageIndex])) toast("Order card image copied."); });
  $("#saveOrderCardsBtn")?.addEventListener("click", async () => { if (!v2OrderPages.length) return; if ($("#orderCardFormat").value === "letter") { const html = v2OrderPages.map((page) => `<img src="${page}"/>`).join(""); await window.cardSale.exportPackingPdf({ title: `${activeSale().name} visual order`, html, styles: "img{display:block;width:100%;height:100%;object-fit:contain;page-break-after:always}", pageSize: "letter" }); } else { const result = await window.cardSale.saveOrderCardImages({ baseName: `${activeSale().name} Visual Order`, pages: v2OrderPages }); if (result.success) toast(`${result.paths.length} image${result.paths.length === 1 ? "" : "s"} saved to Downloads.`); } });
  document.addEventListener("click", (event) => { if (event.target.matches("[data-visual-order-card]")) v2OpenOrderCards(); });

  $("#saleTrailerBtn")?.addEventListener("click", () => { const saved = v2SaleSettings().trailerSettings; v2TrailerMusic = saved.musicPath || ""; v2TrailerBackground = saved.backgroundPath || ""; v2TrailerOrder = [...(saved.order || [])]; $("#trailerIncludeIntro").checked = saved.includeIntro !== false; $("#trailerIncludeOutro").checked = saved.includeOutro !== false; v2ApplyTrailerSlideControls(); v2ShowTrailerImageWarnings(); v2RenderTrailerPicker(); $("#saleTrailerDialog").showModal(); });
  $("#trailerIncludeIntro")?.addEventListener("change", v2ApplyTrailerSlideControls); $("#trailerIncludeOutro")?.addEventListener("change", v2ApplyTrailerSlideControls);
  ["#trailerSelection", "#trailerCardCount", "#trailerPriceWeight", "#trailerYearWeight", "#trailerPlayerWeight"].forEach((selector) => $(selector)?.addEventListener("change", () => { v2TrailerOrder = []; v2RenderTrailerPicker(); }));
  $("#trailerCardPicker")?.addEventListener("change", (event) => { if (!event.target.matches("[data-trailer-card]")) return; const id = event.target.dataset.trailerCard; if (event.target.checked && !v2TrailerOrder.includes(id)) v2TrailerOrder.push(id); if (!event.target.checked) v2TrailerOrder = v2TrailerOrder.filter((item) => item !== id); v2RenderTrailerPicker(); });
  $("#trailerCardPicker")?.addEventListener("click", (event) => { const id = event.target.dataset.trailerUp || event.target.dataset.trailerDown; if (!id) return; event.preventDefault(); const index = v2TrailerOrder.indexOf(id); if (index < 0) return; const next = Math.max(0, Math.min(v2TrailerOrder.length - 1, index + (event.target.dataset.trailerDown ? 1 : -1))); [v2TrailerOrder[index], v2TrailerOrder[next]] = [v2TrailerOrder[next], v2TrailerOrder[index]]; v2RenderTrailerPicker(); });
  $("#trailerChooseMusicBtn")?.addEventListener("click", async () => { v2TrailerMusic = await window.cardSale.chooseTrailerMusic(); $("#trailerMusicName").textContent = fileName(v2TrailerMusic); });
  $("#trailerChooseBackgroundBtn")?.addEventListener("click", async () => { v2TrailerBackground = await window.cardSale.chooseTrailerBackground(); $("#trailerBackgroundName").textContent = fileName(v2TrailerBackground); });
  $("#previewTrailerBtn")?.addEventListener("click", () => v2RenderTrailer(true)); $("#exportTrailerBtn")?.addEventListener("click", () => v2RenderTrailer(false)); $("#cancelTrailerBtn")?.addEventListener("click", () => window.cardSale.cancelTrailer());
  window.cardSale.onTrailerProgress((details) => { $("#trailerProgressBar").style.width = `${details.percent || 0}%`; $("#trailerProgressText").textContent = details.message || "Rendering video…"; });
  v2UpdateCaptureBadge();
}

window.CSMV2 = { syncPopout: v2SyncPopout, updateCaptureBadge: v2UpdateCaptureBadge, openOrderCards: v2OpenOrderCards };
window.addEventListener("DOMContentLoaded", v2Init);
