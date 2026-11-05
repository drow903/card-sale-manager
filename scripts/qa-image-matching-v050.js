const fs = require("fs");
const vm = require("vm");
const CSMImageMatcher = require("../image-matcher.js");

const source = fs.readFileSync("renderer.js", "utf8").split("async function autoMatchImages")[0];
const context = vm.createContext({ console, Date, Math, JSON, Set, Map, Intl, window: { addEventListener: () => {}, CSMImageMatcher } });
vm.runInContext(source, context);
vm.runInContext(`
  state = {
    sales: [{ id: "qa", images: [], cards: [
      { id: "one", year: "1961", set: "Topps", number: "20", name: "Robin Roberts", purchaseDate: "9182026" },
      { id: "two", year: "1961", set: "Topps", number: "20", name: "Robin Roberts", purchaseDate: "9182026" },
      { id: "short-date", year: "1961", set: "Topps", number: "35", name: "Hank Aaron", purchaseDate: "09/13/2026" }
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
  const exactCard = { id: "exact", year: "1961", set: "Topps", number: "20", name: "Test Player", purchaseDate: "" };
  const exact100 = proposedImageMatch(exactCard, [
    { stem: "20", relativePath: "1961/20.jpg", path: "1961-20.jpg" },
    { stem: "20", relativePath: "1959/20.jpg", path: "1959-20.jpg" }
  ], { id: "exact-sale", cards: [exactCard] });
  const ambiguous = proposedImageMatch({ id: "ambiguous", year: "1961", set: "Topps", number: "", name: "Mickey Mantle", purchaseDate: "" }, [
    { stem: "Mantle", relativePath: "1961/Mantle front.jpg", path: "mantle-front.jpg" },
    { stem: "Mantle", relativePath: "1961/Mantle alternate.jpg", path: "mantle-alternate.jpg" }
  ]);
  const shortDateCodes = imageDateCodes({ stem: "Roberts 091326" });
  const shortDateMatch = scoreImage({ id: "short-date", year: "1961", set: "Topps", number: "20", name: "Robin Roberts", purchaseDate: "09/13/2026" }, { stem: "Roberts 091326", relativePath: "1961/Roberts 091326.jpg", path: "short-date.jpg" });
  const shortDateAutomatic = proposedImageMatch(activeSale().cards[2], [
    { stem: "Aaron 091326", relativePath: "1961/Aaron 091326.jpg", path: "1961-aaron-091326.jpg" }
  ]);
  const wrongDate = scoreImage(activeSale().cards[2], { stem: "Aaron 091426", relativePath: "1961/Aaron 091426.jpg", path: "wrong-date.jpg" });
  const datedMemoryA = imageMemoryKey(activeSale().cards[2], "single");
  const datedMemoryB = imageMemoryKey({ ...activeSale().cards[2], purchaseDate: "09/14/2026" }, "single");
  return { dateCodes: imageDateCodes({ stem: "Roberts 9182026 1" }), shortDateCodes, shortDateMatch, shortDateAutomatic, wrongDate, datedMemoryA, datedMemoryB, first, wrong, second, crossYear, correctYear, firstAttach, duplicateAttach, exact100, ambiguous };
})()`, context);

if (results.dateCodes[0] !== "09182026") throw new Error(`Seven-digit date failed: ${JSON.stringify(results.dateCodes)}`);
if (results.shortDateCodes[0] !== "09132026" || !results.shortDateMatch.reasons.some((reason) => /purchase date/i.test(reason))) throw new Error(`Six-digit date failed: ${JSON.stringify(results.shortDateCodes)}`);
if (!results.shortDateAutomatic.automatic || !/date/i.test(results.shortDateAutomatic.automaticReason)) throw new Error("A unique MMDDYY purchase-date match was not auto-confirmed.");
if (!results.wrongDate.rejected) throw new Error("A conflicting filename purchase date was not hard-rejected.");
if (results.datedMemoryA === results.datedMemoryB) throw new Error("Remembered image matches are not separated by purchase date.");
if (!results.first.reasons.some((reason) => /purchase date/i.test(reason)) || results.first.sequence !== 1) throw new Error("First duplicate reasons were incomplete.");
if (results.second.sequence !== 2) throw new Error("Second duplicate did not prefer sequence 2.");
if (results.correctYear.rank <= results.crossYear.rank || !results.correctYear.reasons.some((reason) => /year folder/i.test(reason))) throw new Error("The correct year folder was not preferred.");
if (!results.firstAttach || results.duplicateAttach) throw new Error("The same image was attached to multiple listings.");
if (!results.exact100.automatic || results.exact100.candidates.length !== 1 || results.exact100.candidates[0].image.path !== "1961-20.jpg") throw new Error("A unique 100% same-year match was not accepted automatically.");
if (!results.ambiguous.conflict || results.ambiguous.automatic) throw new Error("Same-player files in the same year folder were not flagged for review.");
console.log(JSON.stringify(results, null, 2));
