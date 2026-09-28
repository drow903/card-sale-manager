const fs = require("fs");
const os = require("os");
const path = require("path");
const { writeCatalog } = require("../catalog-export");

(async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "csm-catalog-"));
  const result = await writeCatalog({ title: "QA Catalog", intro: "Test", settings: { numberDirection: "asc", showPrice: true, showFlaws: true }, cards: [
    { id: "1", year: "1961", brand: "Topps", player: "Test Player", number: "20", teams: ["Test Team"], price: 7, listing: "1961 Topps Test Player #20 - $7.00" }
  ] }, base, { createFromPath: () => ({ isEmpty: () => true }) });
  const required = ["index.html", "catalog.css", "catalog.js", "catalog-data.js"].every((name) => fs.existsSync(path.join(result.folderPath, name)));
  const data = fs.readFileSync(path.join(result.folderPath, "catalog-data.js"), "utf8");
  const page = fs.readFileSync(path.join(result.folderPath, "index.html"), "utf8");
  new Function(fs.readFileSync(path.join(result.folderPath, "catalog.js"), "utf8"));
  const script = fs.readFileSync(path.join(result.folderPath, "catalog.js"), "utf8");
  if (!required || result.cardCount !== 1 || !data.includes("Test Team") || data.includes("purchasePrice") || data.includes("listing") || /copy listing|clipboard/i.test(script) || !/catalog\.js\?v=[a-z0-9]+/i.test(page)) throw new Error("Catalog QA failed.");
  fs.rmSync(base, { recursive: true, force: true });
  console.log(JSON.stringify({ catalogFiles: required, cards: result.cardCount, customerSafe: !data.includes("purchasePrice"), previewOnly: !/copy listing|clipboard/i.test(script), cacheBusted: /catalog\.js\?v=[a-z0-9]+/i.test(page) }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
