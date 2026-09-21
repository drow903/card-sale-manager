const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("renderer.js", "utf8").split("async function autoMatchImages")[0];
const context = vm.createContext({ console, Date, Math, JSON, Set, Map, Intl });
vm.runInContext(source, context);
vm.runInContext(`
  state = {
    sales: [{ id: "qa", images: [], cards: [
      { id: "one", year: "1961", set: "Topps", number: "20", name: "Robin Roberts", purchaseDate: "9182026" },
      { id: "two", year: "1961", set: "Topps", number: "20", name: "Robin Roberts", purchaseDate: "9182026" }
    ] }],
    activeSaleId: "qa"
  };
`, context);

const results = vm.runInContext(`(() => {
  const first = scoreImage(activeSale().cards[0], { stem: "Roberts 9182026 1", relativePath: "1961/Roberts 9182026 1.png", path: "one.png" });
  const wrong = scoreImage(activeSale().cards[0], { stem: "Roberts 9182026 2", relativePath: "1961/Roberts 9182026 2.png", path: "two.png" });
  const second = scoreImage(activeSale().cards[1], { stem: "Roberts 9182026 2", relativePath: "1961/Roberts 9182026 2.png", path: "two.png" });
  const crossYear = scoreImage({ id: "mantle", year: "1961", set: "Topps", number: "300", name: "Mickey Mantle", purchaseDate: "" }, { stem: "Mantle", relativePath: "1959/Mantle.jpg", path: "1959-mantle.jpg" });
  const correctYear = scoreImage({ id: "mantle", year: "1961", set: "Topps", number: "300", name: "Mickey Mantle", purchaseDate: "" }, { stem: "Mantle", relativePath: "1961/Mantle.jpg", path: "1961-mantle.jpg" });
  const firstAttach = attachImage(activeSale().cards[0], "shared.jpg", true);
  const duplicateAttach = attachImage(activeSale().cards[1], "shared.jpg", true);
  const exact100 = proposedImageMatch({ id: "exact", year: "1961", set: "Topps", number: "20", name: "Test Player", purchaseDate: "" }, [
    { stem: "20", relativePath: "1961/20.jpg", path: "1961-20.jpg" },
    { stem: "20", relativePath: "1959/20.jpg", path: "1959-20.jpg" }
  ]);
  const ambiguous = proposedImageMatch({ id: "ambiguous", year: "1961", set: "Topps", number: "", name: "Mickey Mantle", purchaseDate: "" }, [
    { stem: "Mantle", relativePath: "1961/Mantle front.jpg", path: "mantle-front.jpg" },
    { stem: "Mantle", relativePath: "1961/Mantle alternate.jpg", path: "mantle-alternate.jpg" }
  ]);
  return { dateCodes: imageDateCodes({ stem: "Roberts 9182026 1" }), first, wrong, second, crossYear, correctYear, firstAttach, duplicateAttach, exact100, ambiguous };
})()`, context);

if (results.dateCodes[0] !== "09182026") throw new Error(`Seven-digit date failed: ${JSON.stringify(results.dateCodes)}`);
if (results.first.score <= results.wrong.score) throw new Error("First duplicate did not prefer sequence 1.");
if (!results.first.reasons.includes("purchase date code") || !results.first.reasons.includes("duplicate order 1")) throw new Error("First duplicate reasons were incomplete.");
if (!results.second.reasons.includes("duplicate order 2")) throw new Error("Second duplicate did not prefer sequence 2.");
if (results.correctYear.score <= results.crossYear.score || !results.correctYear.reasons.includes("year folder")) throw new Error("The correct year folder was not preferred.");
if (!results.firstAttach || results.duplicateAttach) throw new Error("The same image was attached to multiple listings.");
if (!results.exact100.automatic || results.exact100.candidates.length !== 1 || results.exact100.candidates[0].image.path !== "1961-20.jpg") throw new Error("A unique 100% same-year match was not accepted automatically.");
if (!results.ambiguous.conflict || results.ambiguous.automatic) throw new Error("Same-player files in the same year folder were not flagged for review.");
console.log(JSON.stringify(results, null, 2));
