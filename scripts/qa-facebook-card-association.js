const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("features-v200.js", "utf8");
const start = source.indexOf("function v2ListingWithoutFlaws");
const end = source.indexOf("function v2ClassifyCapture");
if (start < 0 || end < 0) throw new Error("Could not locate Facebook card matching functions.");

const cards = [
  { id: "a", ref: 5, year: "1961", set: "Topps", name: "Robin Roberts", number: "20", condition: "", price: 7, duplicate: "" },
  { id: "b", ref: 6, year: "1962", set: "Topps", name: "Robin Roberts", number: "20", condition: "", price: 8, duplicate: "" }
];
const context = vm.createContext({
  activeSale: () => ({ cards }),
  numberLabel: (card) => card.number ? `#${card.number}` : "",
  duplicateInfo: (card) => ({ label: card.duplicate || "" }),
  formatLine: (card) => `${card.year} ${card.set} ${card.name} #${card.number} - $${Number(card.price).toFixed(2)}`
});
vm.runInContext(`${source.slice(start, end)}; globalThis.matchCapture = v2CaptureMatch;`, context);

let match = context.matchCapture({ commentText: "Claim", contextText: "1961 Topps Robin Roberts #20 - $7.00" });
assert.equal(match.cardId, "a", "A reply was not tied to the matching parent listing.");

match = context.matchCapture({ commentText: "Claim card 6", contextText: "" });
assert.equal(match.cardId, "b", "An explicit sale reference was not honored.");

match = context.matchCapture({ commentText: "Claim", contextText: "" });
assert.equal(match.cardId, "", "A context-free comment should require manual card review.");

cards[1] = { ...cards[0], id: "b", ref: 6 };
match = context.matchCapture({ commentText: "Claim", contextText: "1961 Topps Robin Roberts #20 - $7.00" });
assert.equal(match.cardId, "", "Identical duplicate cards should not be assigned without a distinguishing signal.");

console.log(JSON.stringify({ parentListingMatch: true, referenceMatch: true, contextFreeReview: true, duplicateSafety: true }));
