const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("renderer.js", "utf8");

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed function: ${name}`);
}

const closed = {
  id: "closed-sale",
  name: "Closed sale",
  closedAt: "2026-09-01T00:00:00.000Z",
  cards: [{ id: "sold-card", buyer: "Alex", status: "claimed", claimType: "claim", claimPrice: 12, price: 15, name: "Test Player", set: "Topps", year: "1961" }],
  images: [],
  orders: { Alex: { status: "shipped" } }
};
const current = { id: "current-sale", name: "Current sale", cards: [], images: [], orders: {} };
const state = { sales: [closed, current], archivedSales: [], activeSaleId: closed.id, buyerProfiles: { Alex: { notes: "Repeat buyer" } } };
const undoStack = [];
const context = vm.createContext({
  state,
  undoStack,
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Set,
  window: { confirm: () => true },
  uid: () => "replacement",
  saveSoon: () => {},
  render: () => {},
  toast: () => {},
  resetListingView: () => {}
});

["clone", "activeSale", "cardInOrder", "historicalSales", "buyerHistory", "deleteActiveSale", "restoreArchivedSale"].forEach((name) => {
  if (name === "clone") vm.runInContext("const clone = (value) => JSON.parse(JSON.stringify(value));", context);
  else vm.runInContext(functionSource(name), context);
});

vm.runInContext("deleteActiveSale()", context);
if (state.sales.some((sale) => sale.id === closed.id)) throw new Error("Deleted sale remained in the active sale list.");
if (state.archivedSales.length !== 1 || state.archivedSales[0].id !== closed.id) throw new Error("Deleted sale was not preserved in archived history.");
const history = vm.runInContext('buyerHistory("Alex")', context);
if (history.cards.length !== 1 || history.spent !== 12) throw new Error("Archived sale disappeared from buyer history.");
if (undoStack[0]?.archivedSaleId !== closed.id) throw new Error("Archive-aware undo metadata was not recorded.");
vm.runInContext('restoreArchivedSale("closed-sale")', context);
if (!state.sales.some((sale) => sale.id === closed.id) || state.archivedSales.length) throw new Error("Archived sale could not be restored to the active list.");

console.log(JSON.stringify({ activeSaleRemoved: true, archivedRecordPreserved: true, buyerHistoryPreserved: true, archiveRestorable: true }));
