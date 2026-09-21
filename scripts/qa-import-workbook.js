const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const [workbookPath, outputDirectory] = process.argv.slice(2);
if (!workbookPath || !outputDirectory) {
  throw new Error("Usage: node scripts/qa-import-workbook.js <workbook> <output-directory>");
}

const aliases = {
  year: ["year", "yr"],
  set: ["brand", "set", "series"],
  name: ["player", "name", "card", "title", "description"],
  number: ["number", "card number", "card #", "no", "#"],
  notes: ["flaw(s)", "flaws", "flaw", "notes", "note", "comments"],
  condition: ["grade", "condition", "cond"],
  price: ["claim price", "price", "amount", "asking price", "sale price"],
  purchasePrice: ["purchase price", "purchase cost", "cost", "paid", "buy price"],
  purchaseDate: ["purchase date", "date purchased", "bought date", "buy date", "purchased"]
};

function normalizePurchaseDate(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  let digits = raw.replace(/\D/g, "");
  if (/^\d{7}$/.test(digits)) digits = `0${digits}`;
  if (/^\d{8}$/.test(digits)) return digits;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}${parsed.getFullYear()}`;
}

const workbook = XLSX.readFile(workbookPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
if (!rows.length) throw new Error("Workbook contained no card rows.");

const headers = Object.keys(rows[0]);
const mapping = Object.fromEntries(Object.entries(aliases).map(([field, candidates]) => [
  field,
  headers.find((header) => candidates.includes(header.toLowerCase().trim())) || ""
]));
const missing = Object.entries(mapping).filter(([, header]) => !header).map(([field]) => field);
if (missing.length) throw new Error(`Missing mapped fields: ${missing.join(", ")}`);

const cards = rows.map((row, index) => {
  const value = (field) => row[mapping[field]];
  return {
    id: `qa-${index + 1}`,
    ref: String(index + 1),
    year: value("year"),
    set: value("set"),
    number: value("number"),
    name: value("name"),
    condition: value("condition"),
    price: Number(String(value("price")).replace(/[$,]/g, "")) || 0,
    purchasePrice: value("purchasePrice") === "" ? "" : Number(String(value("purchasePrice")).replace(/[$,]/g, "")) || 0,
    purchaseDate: normalizePurchaseDate(value("purchaseDate")),
    notes: value("notes"),
    imagePath: "",
    status: "available"
  };
});

const sale = {
  id: "qa-sale",
  name: "0918 workbook test",
  pweShipping: 1,
  pmwtShipping: 5,
  template: "{year} {brand} {player} #{number} {grade} ({flaws}) - ${claimPrice}",
  cards,
  images: [],
  orders: {}
};
const state = {
  sales: [sale],
  activeSaleId: sale.id,
  selectedBuyer: "",
  filter: "claimed",
  query: "does-not-match",
  claimQuery: "",
  lookupSettings: { primaryFolder: "", additionalFolders: [], excludedFolders: [] }
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "card-sale-manager.json"), JSON.stringify(state, null, 2));
console.log(JSON.stringify({ rowCount: cards.length, mapping, firstCard: cards[0] }, null, 2));
