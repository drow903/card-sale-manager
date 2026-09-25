const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("renderer.js", "utf8");
const start = source.indexOf("function proportionalBundlePrices");
const end = source.indexOf("\nfunction bundleCards", start);
if (start < 0 || end < 0) throw new Error("Could not locate bundle allocation logic.");

const context = vm.createContext({ Math, Number });
vm.runInContext(source.slice(start, end), context);

const proportional = vm.runInContext("proportionalBundlePrices", context);
const standard = proportional([{ price: 50 }, { price: 40 }, { price: 35 }], 100);
if (JSON.stringify(standard) !== JSON.stringify([40, 32, 28])) throw new Error(`Expected an 80% proportional split, received ${JSON.stringify(standard)}`);

const cents = proportional([{ price: 10 }, { price: 10 }, { price: 10 }], 25);
const centsTotal = Math.round(cents.reduce((sum, value) => sum + value, 0) * 100);
if (centsTotal !== 2500 || JSON.stringify(cents) !== JSON.stringify([8.34, 8.33, 8.33])) throw new Error(`Cent balancing failed: ${JSON.stringify(cents)}`);

const zeroWeights = proportional([{ price: 0 }, { price: 0 }], 7.01);
if (Math.round(zeroWeights.reduce((sum, value) => sum + value, 0) * 100) !== 701) throw new Error(`Zero-price bundle did not preserve the offer total: ${JSON.stringify(zeroWeights)}`);

console.log(JSON.stringify({ standard, cents, zeroWeights }, null, 2));
