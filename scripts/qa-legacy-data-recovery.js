const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const mainSource = fs.readFileSync("main.js", "utf8");
const helpers = mainSource.slice(mainSource.indexOf("function dataPath()"), mainSource.indexOf("function versionParts"));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "card-sale-manager-legacy-"));
const currentFolder = path.join(root, "current");
const appDataFolder = path.join(root, "appdata");
const legacyFolder = path.join(appDataFolder, "Card Sale Manager");
fs.mkdirSync(legacyFolder, { recursive: true });
const legacy = {
  activeSaleId: "old-sale",
  sales: [{ id: "old-sale", name: "Recovered legacy sale", cards: [{ id: "old-card", name: "Stored card" }] }],
  buyerProfiles: { "Saved Buyer": { notes: "Must survive the update" } }
};
fs.writeFileSync(path.join(legacyFolder, "card-sale-manager.json"), JSON.stringify(legacy), "utf8");

const context = vm.createContext({
  fs,
  path,
  app: {
    getPath: (name) => name === "appData" ? appDataFolder : currentFolder,
    getVersion: () => "1.1.0"
  },
  process: { env: {} },
  activeCsmDocument: null,
  parseEnvelope: JSON.parse,
  console,
  Date,
  JSON,
  Promise,
  String,
  Array,
  Boolean,
  Set,
  Map
});

vm.runInContext(helpers, context);

(async () => {
  const recovered = await vm.runInContext("loadRecoveryData()", context);
  if (recovered?.sales?.[0]?.name !== "Recovered legacy sale") throw new Error("The legacy sale was not discovered.");
  if (!recovered?.buyerProfiles?.["Saved Buyer"]) throw new Error("The legacy buyer profile was not preserved.");
  if (!String(recovered.__recovery?.source || "").includes("Card Sale Manager")) throw new Error("Recovery did not come from the legacy data folder.");
  console.log(JSON.stringify({ legacySaleRecovered: true, legacyBuyerProfileRecovered: true, source: recovered.__recovery.source }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
