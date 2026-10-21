let lastTarget = null;
document.addEventListener("contextmenu", (event) => { lastTarget = event.target; }, true);
function textOf(node) { return String(node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim(); }
function closestComment(node) {
  let current = node;
  for (let depth = 0; current && depth < 12; depth += 1, current = current.parentElement) {
    const text = textOf(current);
    if ((current.getAttribute?.("role") === "article" || current.tagName === "LI") && text.length >= 2 && text.length < 5000) return current;
  }
  return node?.closest?.('[role="article"]') || node;
}
function parentListing(node) {
  let current = node?.parentElement;
  for (let depth = 0; current && depth < 18; depth += 1, current = current.parentElement) {
    if (current.getAttribute?.("role") === "article" && textOf(current).length > textOf(node).length + 10) return current;
  }
  return node;
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "capture-csm-comment") return;
  const commentNode = closestComment(lastTarget || document.activeElement);
  const listingNode = parentListing(commentNode);
  const links = [...(commentNode?.querySelectorAll?.("a") || [])];
  const name = links.map(textOf).find((value) => value && value.length < 80 && !/like|reply|share|ago$/i.test(value)) || "";
  const timeNode = commentNode?.querySelector?.("abbr, time, a[href*='comment_id'], a[href*='reply_comment_id']");
  const href = timeNode?.href || links.map((link) => link.href).find((value) => /comment_id|reply_comment_id/.test(value)) || location.href;
  const id = (href.match(/[?&](?:comment_id|reply_comment_id)=([^&#]+)/) || [])[1] || "";
  sendResponse({ commentText: String(message.selectionText || textOf(commentNode)).slice(0, 4000), contextText: textOf(listingNode).slice(0, 12000), displayedName: name, displayedTime: timeNode?.getAttribute?.("title") || timeNode?.getAttribute?.("datetime") || textOf(timeNode), commentId: id, pageUrl: location.href, capturedAt: new Date().toISOString() });
  return true;
});
