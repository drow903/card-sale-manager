const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const mainSource = fs.readFileSync("main.js", "utf8");
const helpers = mainSource.slice(mainSource.indexOf("function dataPath()"), mainSource.indexOf("function versionParts"));
const qaFolder = fs.mkdtempSync(path.join(os.tmpdir(), "card-sale-manager-preservation-"));
const context = vm.createContext({
  fs,
  path,
  app: { getPath: () => qaFolder },
  process: { env: { CARD_SALE_DATA_DIR: qaFolder } },
  console,
  Date,
  JSON,
  Promise,
  String,
  Array,
  Boolean
});

vm.runInContext(helpers, context);

(async () => {
  const original = {
    activeSaleId: "sale-1",
    sales: [{ id: "sale-1", name: "Protected sale", cards: [{ id: "card-1", name: "Mickey Mantle" }] }]
  };
  const primary = path.join(qaFolder, "card-sale-manager.json");
  fs.writeFileSync(primary, JSON.stringify(original), "utf8");
  const backup = await vm.runInContext('createDataBackup("qa")', context);
  if (!backup || !fs.existsSync(backup)) throw new Error("A recovery backup was not created.");
  fs.writeFileSync(primary, "{not valid json", "utf8");
  const recovered = await vm.runInContext("loadRecoveryData()", context);
  if (!recovered || recovered.sales?.[0]?.cards?.length !== 1 || !recovered.__recovery?.source) throw new Error("The saved sale was not recovered from backup.");
  let rejected = false;
  try { vm.runInContext("validateSavedData({ sales: [] })", context); } catch { rejected = true; }
  if (!rejected) throw new Error("An empty save payload was accepted.");
  console.log(JSON.stringify({ backupCreated: true, corruptPrimaryRecovered: true, emptySaveRejected: true, recoveredSale: recovered.sales[0].name }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
