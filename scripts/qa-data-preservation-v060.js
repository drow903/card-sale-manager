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
  app: { getPath: () => qaFolder, getVersion: () => "1.1.0" },
  process: { env: { CARD_SALE_DATA_DIR: qaFolder } },
  activeCsmDocument: null,
  parseEnvelope: (text) => {
    const parsed = JSON.parse(text);
    if (!parsed?.data?.sales?.length) throw new Error("Invalid portable workspace");
    return parsed;
  },
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
  const archive = await vm.runInContext('createUpdateArchive("1.1.1")', context);
  if (!archive?.localWorkspace || !fs.existsSync(archive.localWorkspace)) throw new Error("A permanent update archive was not created.");
  if (!archive.localWorkspace.includes(path.join("update-archives", "v1.1.1"))) throw new Error("The update archive was stored in the wrong location.");
  fs.writeFileSync(primary, "{not valid json", "utf8");
  const recovered = await vm.runInContext("loadRecoveryData()", context);
  if (!recovered || recovered.sales?.[0]?.cards?.length !== 1 || !recovered.__recovery?.source) throw new Error("The saved sale was not recovered from backup.");
  let rejected = false;
  try { vm.runInContext("validateSavedData({ sales: [] })", context); } catch { rejected = true; }
  if (!rejected) throw new Error("An empty save payload was accepted.");
  const rendererSource = fs.readFileSync("renderer.js", "utf8");
  if (rendererSource.includes("!orderBuyers.has(name) && !hasSavedDetails && !profile.manuallySaved")) throw new Error("Startup still removes buyer profiles automatically.");
  console.log(JSON.stringify({ backupCreated: true, permanentUpdateArchiveCreated: true, corruptPrimaryRecovered: true, emptySaveRejected: true, buyerProfilesRetained: true, recoveredSale: recovered.sales[0].name }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
