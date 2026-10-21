const status = document.querySelector("#status");
async function check() {
  const { token = "" } = await chrome.storage.local.get("token");
  if (!token) { status.textContent = "Not connected."; return; }
  try { const response = await fetch("http://127.0.0.1:43817/status", { headers: { "X-CSM-Token": token } }); status.textContent = response.ok ? "Connected to Card Sale Manager." : "Connection expired. Pair again."; }
  catch { status.textContent = "CSM is not running."; }
}
document.querySelector("#connect").addEventListener("click", async () => {
  status.textContent = "Pairing…";
  try { const response = await fetch("http://127.0.0.1:43817/pair", { method: "POST" }); const result = await response.json(); if (!response.ok || !result.token) throw new Error(result.error || "Pairing was not accepted."); await chrome.storage.local.set({ token: result.token }); status.textContent = "Connected. You can close this window."; }
  catch (error) { status.textContent = error.message || "Pairing failed."; }
});
check();
