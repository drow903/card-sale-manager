const results = { passed: false, oneOff: {}, performance: {}, visualSummaries: {}, notifications: {}, bulkClaims: {}, bulkOrders: {}, postOrder: {}, buyerProfiles: {}, messageLibrary: {}, navigation: {}, livePopout: {}, doubleClick: {} };
const assertQa = (condition, message) => { if (!condition) throw new Error(message); };
const waitQa = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const timedQa = async (work) => { const started = performance.now(); await work(); return Math.round((performance.now() - started) * 10) / 10; };
const testCard = (index, overrides = {}) => ({ id: `qa-card-${index}`, ref: String(index + 1), sourceOrder: index, year: String(1950 + (index % 70)), set: "QA Test", number: String(index + 1), name: `Test Player ${index + 1}`, condition: "EX", price: 1 + (index % 25), purchasePrice: .5 + (index % 10), purchaseDate: "09/13/2026", notes: "None", status: "available", imagePath: "", customFields: {}, ...overrides });

state.preferences ||= {}; state.preferences.setupCompleted = true; state.preferences.experienceMode = "standard";
currentLicense = { configured: false, licensed: true, owner: false, catalogVisible: false }; applyLicenseEntitlements(currentLicense);

// One-off order: add, attach, pay, pack, ship, archive, and reopen.
state.oneOffOrders = []; state.archivedOneOffOrders = []; state.oneOffSequence = 0; createOneOffOrder();
let qaOrder = oneOffOrder(); renderOneOffOrders();
$("#oneOffItemDescription").value = "1961 Topps Robin Roberts #20"; $("#oneOffItemQuantity").value = "1"; $("#oneOffItemPrice").value = "7";
const addButton = $("#addOneOffItemBtn"); addButton.click(); addButton.click();
await waitQa(450); assertQa(qaOrder.items.length === 1, "One-off Add item created a duplicate on double click");
results.doubleClick.oneOffAddProtected = true;
$("#oneOffItemDescription").value = "1974 Topps Hank Aaron #1"; $("#oneOffItemQuantity").value = "2"; $("#oneOffItemPrice").value = "12"; $("#addOneOffItemBtn").click(); await waitQa(450);
assertQa(qaOrder.items.length === 2, "One-off Add item did not add the second line item");
const originalPrompt = window.prompt; const editAnswers = ["1961 Topps Robin Roberts #20 edited", "1", "8"]; window.prompt = () => editAnswers.shift(); $(`[data-one-off-edit="${qaOrder.items[0].id}"]`).click(); window.prompt = originalPrompt;
assertQa(qaOrder.items[0].description.endsWith("edited") && qaOrder.items[0].price === 8, "One-off line item could not be edited");
$("#oneOffItemDescription").value = "Temporary removable item"; $("#oneOffItemQuantity").value = "1"; $("#oneOffItemPrice").value = "1"; $("#addOneOffItemBtn").click(); await waitQa(450);
const removableId = qaOrder.items.at(-1).id; const originalConfirm = window.confirm; window.confirm = () => true; $(`[data-one-off-remove="${removableId}"]`).click(); window.confirm = originalConfirm;
assertQa(qaOrder.items.length === 2 && !qaOrder.items.some((item) => item.id === removableId), "One-off line item could not be removed");
qaOrder.items[0].imagePath = decodeURIComponent(new URL("assets/favicon.svg", location.href).pathname.replace(/^\//, "")); qaOrder.items[0].includeImage = true;
qaOrder.buyer = "QA Buyer"; qaOrder.address = "QA Buyer\n123 Test Street\nChicago, IL 60601"; qaOrder.shippingMethod = "PMWT"; qaOrder.paymentMethod = "PayPal";
const slip = await buildOneOffDocument(qaOrder, "slip"); assertQa(slip.html.includes("Robin Roberts") && slip.html.includes("Hank Aaron") && slip.html.includes("slip-thumb"), "One-off packing slip did not include its items and attached image");
setOneOffStatus(qaOrder, "paid"); assertQa(qaOrder.status === "paid", "One-off order could not be marked paid");
qaOrder.items.forEach((item) => { item.packed = true; }); setOneOffStatus(qaOrder, "packed"); assertQa(qaOrder.status === "packed", "One-off order could not be marked packed");
qaOrder.trackingNumber = "9400000000000000000000"; setOneOffStatus(qaOrder, "shipped"); assertQa(qaOrder.status === "shipped" && qaOrder.locked, "One-off order could not be marked shipped");
const qaOrderId = qaOrder.id; closeOneOffOrder(qaOrder); assertQa(state.archivedOneOffOrders.some((order) => order.id === qaOrderId), "Closed one-off order was not archived");
reopenOneOffOrder(qaOrderId); assertQa(state.oneOffOrders.some((order) => order.id === qaOrderId), "Archived one-off order could not be reopened");
results.oneOff = { itemsAdded: 2, edited: true, removed: true, imageIncludedOnSlip: true, packingSlipGenerated: true, paid: true, packed: true, shipped: true, archived: true, reopened: true };

// Manual multi-card ordering must preserve the selected order and synchronize attached images.
const orderCards = Array.from({ length: 6 }, (_item, index) => testCard(index, { imagePath: `C:\\QA\\image-${index + 1}.jpg` }));
const orderSale = { id: "qa-post-order", name: "QA post order", imageMode: "single", sortMode: "spreadsheet", pweShipping: 1, pmwtShipping: 5, template: DEFAULT_TEMPLATE, cards: orderCards, images: orderCards.map((card, index) => ({ id: `qa-image-${index + 1}`, path: card.imagePath, name: `image-${index + 1}.jpg` })), orders: {}, bundles: [], customFieldDefinitions: [] };
state.sales = [orderSale]; state.activeSaleId = orderSale.id; state.query = ""; state.filter = "all"; selectedListingIds = new Set([orderCards[1].id, orderCards[3].id]);
moveSelectedCards("top");
assertQa(orderSale.sortMode === "custom", "A manual multi-card move did not switch the workspace to Custom order");
assertQa(sortedSaleCards(orderSale).slice(0, 2).map((card) => card.id).join("|") === `${orderCards[1].id}|${orderCards[3].id}`, "Selected cards did not move together while preserving their displayed order");
assertQa(orderedSaleImages(orderSale).slice(0, 2).map((image) => image.path).join("|") === `${orderCards[1].imagePath}|${orderCards[3].imagePath}`, "The image post queue did not follow the manually arranged table order");
results.postOrder = { multiSelect: true, relativeOrderPreserved: true, imageQueueSynchronized: true };

// Buyer rename and merge must reach active/archived sales and standalone orders.
state.buyerProfiles = { "Old Buyer": { ...blankBuyerProfile(), aliases: [] }, "Merge Me": { ...blankBuyerProfile(), aliases: ["M. Buyer"] }, "Keep Buyer": { ...blankBuyerProfile(), tags: ["Repeat"] } };
orderSale.cards[0].buyer = "Old Buyer"; orderSale.cards[0].status = "claimed"; orderSale.orders = { "Old Buyer": { status: "awaiting", shippingMethod: "" } };
state.oneOffOrders = [{ id: "qa-oneoff-rename", buyer: "Old Buyer", items: [], status: "draft" }, { id: "qa-oneoff-merge", buyer: "Merge Me", items: [], status: "draft" }];
state.archivedOneOffOrders = [{ id: "qa-oneoff-archive", buyer: "Merge Me", items: [], status: "closed" }]; state.profileBuyer = "Old Buyer";
$("#renameBuyerOriginal").value = "Old Buyer"; $("#renameBuyerName").value = "Renamed Buyer"; await renameBuyerProfile();
assertQa(orderSale.cards[0].buyer === "Renamed Buyer" && orderSale.orders["Renamed Buyer"] && !orderSale.orders["Old Buyer"], "Buyer rename did not update sale cards and orders");
assertQa(state.oneOffOrders[0].buyer === "Renamed Buyer" && state.buyerProfiles["Renamed Buyer"].aliases.includes("Old Buyer"), "Buyer rename did not update one-off orders and preserve the old name as an alias");
orderSale.cards[1].buyer = "Merge Me"; orderSale.cards[1].status = "claimed"; orderSale.orders["Merge Me"] = { status: "awaiting", shippingMethod: "" };
openBuyerMerge("Merge Me", "Keep Buyer"); await mergeBuyerProfiles();
assertQa(orderSale.cards[1].buyer === "Keep Buyer" && !state.buyerProfiles["Merge Me"], "Buyer merge did not move card history and remove the duplicate profile");
assertQa(state.oneOffOrders[1].buyer === "Keep Buyer" && state.archivedOneOffOrders[0].buyer === "Keep Buyer", "Buyer merge did not update active and archived one-off orders");
results.buyerProfiles = { renamedEverywhere: true, oldNameKeptAsAlias: true, mergedOneOffHistory: true };

// Large-sale rendering test using 300 cards and 30 buyers.
const performanceSale = { id: "qa-performance-sale", name: "QA 300-card performance sale", pweShipping: 1, pmwtShipping: 5, shippingRules: { cardCountEnabled: true, maxPweCards: 3, valueEnabled: true, maxPweValue: 50 }, template: DEFAULT_TEMPLATE, imageMode: "single", images: [], orders: {}, bundles: [], customFieldDefinitions: [], cards: Array.from({ length: 300 }, (_item, index) => testCard(index, index % 3 === 0 ? { status: "claimed", buyer: `Buyer ${index % 30}`, claimType: "claim", claimPrice: 1 + (index % 25), claimedAt: new Date().toISOString() } : {})) };
state.sales = [performanceSale]; state.activeSaleId = performanceSale.id; state.selectedBuyer = "Buyer 0"; state.claimQuery = ""; state.query = ""; state.filter = "all"; selectedClaimIds.clear(); selectedListingIds.clear();
performanceSale.cards.filter(cardInOrder).forEach((card) => { performanceSale.orders[card.buyer] ||= { status: "awaiting", shippingMethod: "" }; });
renderListings(); renderClaims(); renderOrders();
results.performance.listingsMs = await timedQa(() => renderListings());
results.performance.claimsMs = await timedQa(() => renderClaims());
results.performance.ordersMs = await timedQa(() => renderOrders());
results.performance.notificationsMs = await timedQa(() => renderNotifications());
results.performance.activeRenderCycleMs = await timedQa(() => { renderViewContent("sale"); renderViewContent("claims"); renderViewContent("orders"); });
results.performance.totalMeasuredMs = Math.round((results.performance.listingsMs + results.performance.claimsMs + results.performance.ordersMs + results.performance.notificationsMs) * 10) / 10;
assertQa(results.performance.activeRenderCycleMs < 5000, `The 300-card active-view cycle took ${results.performance.activeRenderCycleMs}ms`);

// Claims Desk multi-select assignment.
performanceSale.cards.slice(0, 4).forEach((card) => { card.status = "available"; delete card.buyer; delete card.claimType; delete card.claimPrice; });
selectedClaimIds.clear(); claimBulkBuyerName = ""; renderClaims();
$$('[data-select-claim]', $("#claimRows")).slice(0, 4).forEach((checkbox) => checkbox.click());
$("#claimBulkBuyer").value = "Bulk Test Buyer"; $("#claimBulkBuyer").dispatchEvent(new Event("input", { bubbles: true }));
assertQa(!$("#assignSelectedClaimsBtn").disabled, "Claims Desk bulk assignment button did not enable after selecting cards and entering a buyer"); $("#assignSelectedClaimsBtn").click();
assertQa(performanceSale.cards.slice(0, 4).every((card) => card.buyer === "Bulk Test Buyer" && card.status === "claimed" && card.claimType === "claim"), "Claims Desk bulk buyer assignment failed");
results.bulkClaims = { selected: 4, assignedBuyer: "Bulk Test Buyer", fullPriceClaims: true };

// Deferred snapshots must still support immediate Undo, and unchanged saves must be skipped.
const originalName = performanceSale.cards[0].name; snapshotSale("QA deferred snapshot", performanceSale); performanceSale.cards[0].name = "Changed after snapshot"; undoLastCompletion();
assertQa(activeSale().cards[0].name === originalName, "A deferred safety snapshot was not available to immediate Undo");
saveSoon(); clearTimeout(saveTimer); saveTimer = null; await saveNow({ force: false }); const skippedSave = await saveNow({ force: false });
assertQa(skippedSave?.skipped === true, "An unchanged full-state save was not skipped"); results.performance.deferredSnapshotUndo = true; results.performance.unchangedSaveSkipped = true;

// Image-free buyer summaries at 10, 25, and 50 cards; each must remain one page.
for (const count of [10, 25, 50]) {
  const buyer = `Summary Buyer ${count}`; performanceSale.cards = Array.from({ length: count }, (_item, index) => testCard(index, { status: "claimed", buyer, claimType: "claim", claimPrice: 2 + index, claimedAt: new Date().toISOString() })); performanceSale.orders = { [buyer]: { status: "paid", shippingMethod: "PMWT", paymentMethod: "PayPal", discount: 0 } }; state.selectedBuyer = buyer;
  $("#orderCardFormat").value = "letter"; $("#orderCardLayout").value = "compact"; $("#orderCardShowImages").checked = false; $("#orderCardShowStatus").checked = false; $("#orderCardShowSubtotal").checked = true; $("#orderCardShowShipping").checked = true; $("#orderCardShowTotal").checked = true; $("#orderCardShowPayment").checked = true; $("#orderCardShowPaymentQrs").checked = false;
  const elapsed = await timedQa(() => v2GenerateOrderCards()); assertQa(v2OrderPages.length === 1, `${count}-card image-free summary used ${v2OrderPages.length} pages`); assertQa(v2OrderPages[0].startsWith("data:image/png"), `${count}-card image-free summary did not render`); results.visualSummaries[count] = { pages: 1, renderMs: elapsed };
}

// Preview generation must reject a second click while the first render is active.
const firstPreview = v2GenerateOrderCards(); const busyWhileRendering = $("#previewOrderCardsBtn").dataset.processing === "true" && $("#previewOrderCardsBtn").disabled; const secondPreview = v2GenerateOrderCards(); await Promise.all([firstPreview, secondPreview]);
assertQa(busyWhileRendering, "Visual-summary generation did not lock its button while working"); results.doubleClick.visualSummaryProtected = true;

// Notifications must remain above a modal and queue in order.
if ($("#messageTemplatesDialog").open) $("#messageTemplatesDialog").close(); $("#messageTemplatesDialog").showModal();
toastQueue = []; toastShowing = false; toast("QA notice one"); toast("QA notice two"); toast("QA notice three"); await waitQa(50);
assertQa($("#toast").matches(":popover-open") && $("#messageTemplatesDialog").open, "Notification did not enter the top layer above the modal");
assertQa(toastQueue.length === 2, `Notification queue expected 2 waiting messages and found ${toastQueue.length}`); await waitQa(3000);
assertQa($("#toast").textContent.includes("QA notice two"), "The second queued notification was not displayed in order");
results.notifications = { aboveModal: true, queuedInOrder: true, waitingAfterFirst: 2 };
$("#messageTemplatesDialog").close();

// Built-in quick messages can be hidden without being destroyed, then restored.
state.preferences.hiddenQuickMessageBuiltins = ["delayed"]; renderQuickMessages();
assertQa(!visibleQuickMessages().some((message) => message.builtInKey === "delayed"), "Hidden built-in message still appeared in the message library");
assertQa(quickMessageById("builtin-delayed")?.body, "Hiding a built-in message destroyed its recoverable template");
state.preferences.hiddenQuickMessageBuiltins = []; renderQuickMessages();
assertQa(visibleQuickMessages().some((message) => message.builtInKey === "delayed"), "Hidden built-in message could not be restored");
results.messageLibrary = { defaultHidden: true, recoverable: true, restored: true };

// Bulk order actions use one safety snapshot and update all selected orders.
const bulkOrderBuyers = ["Bulk Order A", "Bulk Order B"];
performanceSale.cards = bulkOrderBuyers.map((buyer, index) => testCard(index, { status: "claimed", buyer, claimType: "claim", claimPrice: 10 + index }));
performanceSale.orders = Object.fromEntries(bulkOrderBuyers.map((buyer) => [buyer, { status: "awaiting", shippingMethod: "PWE" }]));
selectedOrderBuyers = new Set(bulkOrderBuyers); $("#orderBulkAction").value = "paid"; const bulkConfirm = window.confirm; window.confirm = () => true; applyBulkOrderAction(); window.confirm = bulkConfirm;
assertQa(bulkOrderBuyers.every((buyer) => performanceSale.orders[buyer].status === "paid"), "Bulk order action did not update every selected order");
results.bulkOrders = { selected: 2, markedPaid: true, undoSnapshot: Boolean(performanceSale.versions?.length) };

// CSM view history supports Back and Forward without losing the active sale.
$$("dialog[open]").forEach((dialog) => dialog.close()); closeQuickEdit(); viewBackStack = []; viewForwardStack = []; uiState().activeView = "sale"; showView("claims"); navigateViewHistory("back");
assertQa(uiState().activeView === "sale", "Mouse-style Back navigation did not return to the previous CSM screen");
navigateViewHistory("forward"); assertQa(uiState().activeView === "claims", "Mouse-style Forward navigation did not restore the next CSM screen");
results.navigation = { back: true, forward: true, activeSalePreserved: state.activeSaleId === performanceSale.id };

// Pop-out copy must await the clipboard result, hide the posted card, and acknowledge the action.
const liveCard = performanceSale.cards[0]; liveCard.status = "available"; delete liveCard.hiddenAfterCopy; liveIndex = 0;
let popoutCopyFinished = false; const popoutResult = await v2HandlePopoutAction({ type: "copy", cardId: liveCard.id, autoAdvance: true, requestId: "qa-popout-copy" }, async () => { await waitQa(40); liveCard.hiddenAfterCopy = true; liveCard.postedAt = new Date().toISOString(); popoutCopyFinished = true; return true; });
assertQa(liveCard.hiddenAfterCopy && liveCard.postedAt, `Pop-out copy did not finish before the sale state synchronized: ${JSON.stringify({ result: popoutResult, hiddenAfterCopy: liveCard.hiddenAfterCopy, postedAt: liveCard.postedAt, status: liveCard.status, liveCards: liveCards().length, recentErrors: runtimeErrors.slice(-2) })}`);
assertQa(popoutCopyFinished && popoutResult.ok, "Pop-out did not await the copy result before acknowledging success"); results.livePopout = { copied: true, advanced: true, awaitedClipboard: true };

results.passed = true;
return results;
