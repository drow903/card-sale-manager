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

const card = { id: "card-a", ref: "1", year: "1959", set: "Topps", number: "10", name: "Mickey Mantle", purchaseDate: "09182025", imagePath: "" };
const image = { path: "C:\\Cards\\1959\\Mantle 9182025.jpg", relativePath: "1959/Mantle 9182025.jpg", stem: "Mantle 9182025" };
const state = { activeSaleId: "sale-a", sales: [{ id: "sale-a", name: "Current", cards: [card], images: [] }] };
const context = vm.createContext({ state, Date, Set, String, Number, Boolean, Array, Object, console, uid: () => "image-id", toast: () => {} });
[
  "activeSale", "normalizeMatchText", "normalizedCardKey", "duplicateInfo", "normalizePurchaseDate",
  "cardLastName", "imageDateCodes", "imageSequenceNumber", "allCardRecords", "scoreImage",
  "proposedImageMatch", "imageOwner", "attachImage"
].forEach((name) => vm.runInContext(functionSource(name), context));

context.card = card;
context.image = image;
let result = vm.runInContext("proposedImageMatch(card, [image], state.sales[0])", context);
if (!result.automatic || result.automaticReason !== "unique purchase date code") throw new Error("A unique purchase-date filename was not auto-confirmed.");

state.sales[0].cards.push({ ...card, id: "card-duplicate", ref: "2" });
result = vm.runInContext("proposedImageMatch(card, [image], state.sales[0])", context);
if (result.automatic) throw new Error("Duplicate same-card purchase dates in the current sale were auto-confirmed.");

state.sales.push({ id: "sale-b", name: "Past", cards: [{ ...card, id: "card-b", ref: "3" }], images: [] });
state.sales[0].cards[0].imagePath = image.path;
context.other = state.sales[1].cards[0];
const attachedTwice = vm.runInContext("attachImage(other, image.path, true, state.sales[1])", context);
if (attachedTwice) throw new Error("The same file was attached to two listings across sales.");

console.log(JSON.stringify({ uniquePurchaseDateAutoConfirmed: true, duplicateDateRequiresReview: true, globalFileReuseBlocked: true }));
