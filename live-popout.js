let viewState = null;
let activeSide = "front";
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const fileUrl = (value) => value ? encodeURI(`file:///${String(value).replace(/\\/g, "/")}`) : "";

function render() {
  if (!viewState) return;
  document.body.classList.toggle("light", ["light", "system-light"].includes(viewState.theme));
  document.body.classList.toggle("compact", Boolean(viewState.preferences?.compact));
  $("#saleName").textContent = viewState.saleName || "Card Sale Manager";
  $("#autoAdvance").checked = viewState.preferences?.autoAdvance !== false;
  $("#opacity").value = Math.round(Number(viewState.preferences?.opacity || 1) * 100);
  $("#toggleSize").textContent = viewState.preferences?.compact ? "Expanded view" : "Compact view";
  $("#postedText").textContent = `${viewState.posted || 0} of ${viewState.total || 0} cards posted`;
  $("#percentText").textContent = `${viewState.percent || 0}%`;
  $("#progress").max = Math.max(1, viewState.total || 0); $("#progress").value = viewState.posted || 0;
  $("#previousBtn").disabled = !viewState.card || viewState.currentIndex <= 0;
  $("#nextBtn").disabled = !viewState.card;
  if (!viewState.card) { $("#content").innerHTML = `<div class="empty"><strong>No unposted cards remain.</strong><p>Restore a copied listing to continue.</p></div>`; return; }
  const card = viewState.card;
  const images = (card.images || []).map((image) => `<div class="scan ${activeSide === image.slot ? "active" : ""}" data-side="${escapeHtml(image.slot)}"><strong>${escapeHtml(image.label)}</strong>${image.path ? `<img draggable="true" data-drag-path="${escapeHtml(image.path)}" data-drag-slot="${escapeHtml(image.slot)}" src="${fileUrl(image.path)}" alt="" /><small title="${escapeHtml(image.path)}">${escapeHtml(image.fileName)}</small><span class="indicator ${image.dragged ? "done" : ""}">${image.dragged ? "Dragged ✓" : "Drag to Facebook"}</span>` : `<div class="empty">No image</div>`}</div>`).join("");
  $("#content").innerHTML = `<div class="card-title"><h1>${escapeHtml(card.name)}</h1><span>${viewState.currentIndex + 1} of ${viewState.available}</span></div><div class="images">${images}</div><div class="listing">${escapeHtml(card.listing)}</div><div class="actions"><button class="primary" id="copyBtn">${card.copyPending ? "Copied ✓" : "Copy listing"}</button><span class="indicator ${card.copyPending ? "done" : ""}">${card.copyPending ? "Listing copied" : ""}</span></div>`;
  document.querySelectorAll("[data-side]").forEach((node) => node.addEventListener("click", () => { activeSide = node.dataset.side; render(); }));
  document.querySelectorAll("[data-drag-path]").forEach((image) => image.addEventListener("dragstart", async (event) => {
    event.preventDefault();
    const ok = await window.csmLive.startDrag(image.dataset.dragPath);
    if (ok) window.csmLive.action({ type: "image-dragged", cardId: card.id, path: image.dataset.dragPath, slot: image.dataset.dragSlot });
  }));
  $("#copyBtn").addEventListener("click", () => {
    const dragged = card.images.some((image) => image.dragged);
    if (!dragged && !window.confirm("You haven’t dragged this card’s image yet. Copy and continue anyway?")) return;
    window.csmLive.action({ type: "copy", cardId: card.id, autoAdvance: $("#autoAdvance").checked });
  });
}

window.csmLive.onState((state) => { viewState = state; render(); });
$("#settingsBtn").addEventListener("click", () => $("#settings").classList.toggle("hidden"));
$("#closeBtn").addEventListener("click", () => window.csmLive.close());
$("#previousBtn").addEventListener("click", () => window.csmLive.action({ type: "previous" }));
$("#nextBtn").addEventListener("click", () => window.csmLive.action({ type: "next" }));
$("#undoBtn").addEventListener("click", () => window.csmLive.action({ type: "undo" }));
$("#autoAdvance").addEventListener("change", (event) => window.csmLive.action({ type: "preferences", values: { autoAdvance: event.target.checked } }));
$("#opacity").addEventListener("input", (event) => { const opacity = Number(event.target.value) / 100; window.csmLive.opacity(opacity); window.csmLive.action({ type: "preferences", values: { opacity } }); });
$("#toggleSize").addEventListener("click", () => window.csmLive.action({ type: "preferences", values: { compact: !viewState.preferences?.compact } }));
window.addEventListener("keydown", (event) => {
  if (event.target.matches("input,select,textarea")) return;
  if (event.ctrlKey && event.key.toLowerCase() === "z") { event.preventDefault(); return window.csmLive.action({ type: "undo" }); }
  if (event.key === "ArrowLeft") return window.csmLive.action({ type: "previous" });
  if (event.key === "ArrowRight") return window.csmLive.action({ type: "next" });
  if (event.key.toLowerCase() === "c") return $("#copyBtn")?.click();
  if (event.key.toLowerCase() === "f") { activeSide = "front"; render(); }
  if (event.key.toLowerCase() === "b") { activeSide = "back"; render(); }
  if (event.key === " ") { event.preventDefault(); window.csmLive.action({ type: "preferences", values: { compact: !viewState.preferences?.compact } }); }
});
