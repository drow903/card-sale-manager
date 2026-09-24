const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { automaticImageResolution, createEnvelope, parseEnvelope, relinkManifest } = require("../csm-files");

(async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "csm-portable-"));
  try {
    const originalCloud = path.join(root, "Computer-A", "OneDrive");
    const originalImages = path.join(originalCloud, "Cards", "1961");
    const originalSales = path.join(originalCloud, "Sales");
    await fs.promises.mkdir(originalImages, { recursive: true });
    await fs.promises.mkdir(originalSales, { recursive: true });
    const originalImage = path.join(originalImages, "Roberts 20.jpg");
    await fs.promises.writeFile(originalImage, "image");
    const csmPath = path.join(originalSales, "September.csm");
    const data = {
      portableDocumentId: "qa-document",
      activeSaleId: "sale-1",
      lookupSettings: { primaryFolder: path.join(originalCloud, "Cards"), additionalFolders: [], excludedFolders: [] },
      sales: [{ id: "sale-1", name: "QA sale", cards: [{ id: "card-1", imagePath: originalImage }], images: [{ id: "image-1", path: originalImage }] }]
    };
    const envelope = await createEnvelope(data, csmPath, "1.1.0", 3);
    assert.equal(parseEnvelope(JSON.stringify(envelope)).revision, 3);

    const movedCloud = path.join(root, "Computer-B", "OneDrive");
    await fs.promises.mkdir(path.dirname(movedCloud), { recursive: true });
    await fs.promises.rename(originalCloud, movedCloud);
    const movedCsm = path.join(movedCloud, "Sales", "September.csm");
    const resolved = await automaticImageResolution(envelope, movedCsm);
    assert.equal(resolved.missing.length, 0);
    assert.equal(resolved.data.sales[0].cards[0].imagePath, path.join(movedCloud, "Cards", "1961", "Roberts 20.jpg"));

    const remapRoot = path.join(root, "RemappedCards");
    await fs.promises.mkdir(path.join(remapRoot, "1961"), { recursive: true });
    await fs.promises.writeFile(path.join(remapRoot, "1961", "Roberts 20.jpg"), "image");
    const relinked = await relinkManifest(envelope.imageManifest, remapRoot);
    assert.equal(Object.keys(relinked.replacements).length, 1);
    assert.equal(relinked.unresolved.length, 0);
    const ambiguousRoot = path.join(root, "AmbiguousCards");
    await fs.promises.mkdir(path.join(ambiguousRoot, "A"), { recursive: true });
    await fs.promises.mkdir(path.join(ambiguousRoot, "B"), { recursive: true });
    await fs.promises.writeFile(path.join(ambiguousRoot, "A", "Roberts 20.jpg"), "one");
    await fs.promises.writeFile(path.join(ambiguousRoot, "B", "Roberts 20.jpg"), "two");
    const ambiguous = await relinkManifest(envelope.imageManifest.map((item) => ({ ...item, rootRelativePath: "" })), ambiguousRoot);
    assert.equal(Object.keys(ambiguous.replacements).length, 0);
    assert.equal(ambiguous.unresolved[0].candidates, 2);
    assert.throws(() => parseEnvelope('{"format":"something-else"}'));
    console.log(JSON.stringify({ envelopeValid: true, relativeRelink: true, folderRemap: true, ambiguousNamesProtected: true }));
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
