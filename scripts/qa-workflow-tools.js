const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("renderer.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function: ${name}`);
  const openParen = source.indexOf("(", start);
  let parenDepth = 0; let closeParen = openParen;
  for (let index = openParen; index < source.length; index += 1) {
    if (source[index] === "(") parenDepth += 1;
    if (source[index] === ")") parenDepth -= 1;
    if (parenDepth === 0) { closeParen = index; break; }
  }
  const brace = source.indexOf("{", closeParen);
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed function: ${name}`);
}

const sale = { id: "sale", sortMode: "spreadsheet", cards: [
  { id: "a", ref: "1", sourceOrder: 1, name: "A", customFields: { box: "B" } },
  { id: "b", ref: "3", sourceOrder: 2, name: "B", customFields: { box: "A" } },
  { id: "c", ref: "7", sourceOrder: 3, name: "C", customFields: { box: "A" } }
], customFieldDefinitions: [] };
const context = vm.createContext({ sale, state: { sales: [sale], activeSaleId: "sale" }, String, Number, Set, Map, Math, Date, uid: (() => { let value = 0; return () => `id-${++value}`; })(), recordAudit: () => {} });
["activeSale", "customFieldKey", "customFields", "ensureCustomField", "customFieldValue", "cardSortValue", "compareCardValues", "sortedSaleCards", "referenceOrderedCards", "renumberCardReferences"].forEach((name) => vm.runInContext(functionSource(name), context));

const result = vm.runInContext(`(() => {
  const field = ensureCustomField("Storage Location", "text", sale);
  const same = ensureCustomField("storage location", "text", sale);
  const changed = renumberCardReferences(sale, { force: true, audit: false });
  return { field, sameId: same.id, changed, refs: sale.cards.map((card) => card.ref) };
})()`, context);

if (result.field.key !== "storage_location" || result.sameId !== result.field.id) throw new Error(`Custom-field identity failed: ${JSON.stringify(result)}`);
if (!result.changed || JSON.stringify(result.refs) !== JSON.stringify(["1", "2", "3"])) throw new Error(`Reference renumbering failed: ${JSON.stringify(result.refs)}`);
["pullingView", "packingView", "notificationsView", "customFieldsDialog", "referenceDialog", "archivedSalesDialog"].forEach((id) => {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing workflow UI: ${id}`);
});

const literalSelectors = [...source.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
const missingSelectors = [...new Set(literalSelectors)].filter((id) => !html.includes(`id="${id}"`) && !source.includes(`id="${id}"`));
if (missingSelectors.length) throw new Error(`Renderer references missing UI IDs: ${missingSelectors.join(", ")}`);
const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate UI IDs: ${[...new Set(duplicateIds)].join(", ")}`);

if (html.includes("Shipping Batches") || html.includes('id="batchesView"')) throw new Error("Shipping Batches remains visible in the application.");
const archivedNav = html.indexOf('id="archivedSalesBtn"');
const helpNav = html.indexOf('data-view="help"');
if (archivedNav < 0 || helpNav < 0 || archivedNav > helpNav) throw new Error("Archived Sale Records is not directly above Help & Guide in the sidebar.");
for (const [view, number] of [["packing", "10"], ["dashboard", "11"], ["buyers", "12"], ["health", "13"]]) {
  if (!html.includes(`data-view="${view}"><span>${number}</span>`)) throw new Error(`${view} was not renumbered to ${number}.`);
}

console.log(JSON.stringify({ customField: result.field.key, references: result.refs, shippingBatchesRemoved: true, workflowScreens: true, selectorsVerified: literalSelectors.length }));
