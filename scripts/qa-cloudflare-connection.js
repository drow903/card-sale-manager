const fs = require("fs");
const { testConnection } = require("../cloudflare-pages");

const [configPath, accountId, projectName] = process.argv.slice(2);
if (!configPath || !accountId || !projectName) throw new Error("Usage: node scripts/qa-cloudflare-connection.js <wrangler-config> <account-id> <project-name>");
const line = fs.readFileSync(configPath, "utf8").split(/\r?\n/).find((item) => item.trim().startsWith("oauth_token"));
const token = line?.slice(line.indexOf("=") + 1).trim().replace(/^['\"]|['\"]$/g, "");
if (!token) throw new Error("An existing Wrangler login token was not found.");
testConnection({ accountId, projectName }, token).then((result) => console.log(JSON.stringify({ connected: result.ok, project: result.projectName, branch: result.productionBranch, domains: result.domains }))).catch((error) => { console.error(error.message); process.exitCode = 1; });
