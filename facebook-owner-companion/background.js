const MENU_ID = "csm-send-comment";
function installMenu() {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({ id: MENU_ID, title: "Send comment to Card Sale Manager", contexts: ["selection", "page"], documentUrlPatterns: ["https://*.facebook.com/*"] }));
}
chrome.runtime.onInstalled.addListener(installMenu);
chrome.runtime.onStartup.addListener(installMenu);
installMenu();

async function saveResult(ok, message, pageUrl = "") {
  await chrome.storage.local.set({ lastResult: { ok, message, pageUrl, at: new Date().toISOString() } });
}

async function captureFromTab(info, tab) {
  const request = { type: "capture-csm-comment", selectionText: info.selectionText || "" };
  try { return await chrome.tabs.sendMessage(tab.id, request); }
  catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    return chrome.tabs.sendMessage(tab.id, request);
  }
}
async function postCapture(payload) {
  const { token = "" } = await chrome.storage.local.get("token");
  if (!token) throw new Error("Connect this extension to CSM first.");
  const response = await fetch("http://127.0.0.1:43817/capture", { method: "POST", headers: { "Content-Type": "application/json", "X-CSM-Token": token }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.error || "CSM did not accept the comment.");
}
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  try {
    const capture = await captureFromTab(info, tab);
    if (!capture?.commentText) throw new Error("Facebook did not expose comment text. Select the comment text, then right-click the selection and try again.");
    await postCapture(capture);
    await saveResult(true, "Comment sent to Card Sale Manager.", tab.url || "");
    chrome.action.setBadgeBackgroundColor({ color: "#168a55" });
    chrome.action.setBadgeText({ text: "✓", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }).catch(() => {}), 3500);
  } catch (error) {
    await saveResult(false, error?.message || "The Facebook comment could not be sent.", tab.url || "");
    chrome.action.setBadgeBackgroundColor({ color: "#d33" });
    chrome.action.setBadgeText({ text: "!", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }).catch(() => {}), 8000);
  }
});
