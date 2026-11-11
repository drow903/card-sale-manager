const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const electron = require("electron");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "csm-usability-qa-"));
const reportPath = path.join(temp, "report.json");
const child = spawn(electron, [root], { cwd: root, env: { ...process.env, CARD_SALE_DATA_DIR: path.join(temp, "data"), CARD_SALE_QA_REPORT: reportPath }, stdio: ["ignore", "pipe", "pipe"] });
let output = ""; child.stdout.on("data", (chunk) => output += chunk); child.stderr.on("data", (chunk) => output += chunk);
const timeout = setTimeout(() => { child.kill(); console.error(output); throw new Error("Electron usability QA timed out"); }, 45000);
child.on("exit", (code) => {
  clearTimeout(timeout);
  if (!fs.existsSync(reportPath)) { console.error(output); process.exitCode = code || 1; return; }
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  fs.rmSync(temp, { recursive: true, force: true });
  if (!report.passed) process.exitCode = 1;
});
