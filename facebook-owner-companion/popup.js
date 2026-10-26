const status = document.querySelector("#status");
const lastResult = document.querySelector("#lastResult");
async function showLastResult() {
  const saved = await chrome.storage.local.get("lastResult");
  if (!saved.lastResult) return;
  const record = saved.lastResult;
  lastResult.hidden = false;
  lastResult.className = `result ${record.ok ? "success" : "error"}`;
  lastResult.textContent = `${record.ok ? "Last capture" : "Last error"}: ${record.message}`;
}
async function check() {
  const { token = "" } = await chrome.storage.local.get("token");
  if (!token) { status.textContent = "Not connected."; return; }
  try { const response = await fetch("http://127.0.0.1:43817/status", { headers: { "X-CSM-Token": token } }); const result = await response.json().catch(() => ({})); status.textContent = response.ok ? "Connected to Card Sale Manager." : (result.message || "Connection expired. Pair again."); }
  catch { status.textContent = "CSM is not running."; }
}
document.querySelector("#connect").addEventListener("click", async () => {
  status.textContent = "Pairing…";
  try { const response = await fetch("http://127.0.0.1:43817/pair", { method: "POST" }); const result = await response.json(); if (!response.ok || !result.token) throw new Error(result.message || result.error || "Pairing was not accepted."); await chrome.storage.local.set({ token: result.token, lastResult: { ok: true, message: "Pairing completed. Right-click a Facebook comment to test it.", at: new Date().toISOString() } }); status.textContent = "Connected. You can close this window."; await showLastResult(); }
  catch (error) { status.textContent = error.message || "Pairing failed."; }
});
check();
showLastResult();
