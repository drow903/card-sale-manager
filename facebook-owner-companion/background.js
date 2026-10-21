const MENU_ID = "csm-send-comment";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({ id: MENU_ID, title: "Send comment to Card Sale Manager", contexts: ["selection", "page"], documentUrlPatterns: ["https://*.facebook.com/*"] }));
});
async function postCapture(payload) {
  const { token = "" } = await chrome.storage.local.get("token");
  if (!token) throw new Error("Connect this extension to CSM first.");
  const response = await fetch("http://127.0.0.1:43817/capture", { method: "POST", headers: { "Content-Type": "application/json", "X-CSM-Token": token }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "CSM did not accept the comment.");
}
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  try {
    const capture = await chrome.tabs.sendMessage(tab.id, { type: "capture-csm-comment", selectionText: info.selectionText || "" });
    await postCapture(capture);
  } catch {
    chrome.action.setBadgeBackgroundColor({ color: "#d33" });
    chrome.action.setBadgeText({ text: "!", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }).catch(() => {}), 5000);
  }
});
