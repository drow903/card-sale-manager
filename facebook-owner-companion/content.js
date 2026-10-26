if (!globalThis.__csmOwnerCompanionInstalled) {
globalThis.__csmOwnerCompanionInstalled = true;
let lastTarget = null;
let lastPath = [];

document.addEventListener("contextmenu", (event) => {
  lastTarget = event.target;
  lastPath = typeof event.composedPath === "function" ? event.composedPath().filter((node) => node?.nodeType === Node.ELEMENT_NODE) : [];
}, true);

function textOf(node) { return String(node?.innerText || node?.textContent || "").replace(/\s+/g, " ").trim(); }
function isCommentContainer(node) {
  if (!node?.getAttribute) return false;
  const role = node.getAttribute("role");
  const label = node.getAttribute("aria-label") || "";
  return role === "article" || node.tagName === "LI" || /comment/i.test(label) || node.hasAttribute("data-ad-rendering-role");
}
function closestComment(node) {
  const pathMatch = lastPath.find((candidate) => isCommentContainer(candidate) && textOf(candidate).length >= 2 && textOf(candidate).length < 5000);
  if (pathMatch) return pathMatch;
  let current = node;
  for (let depth = 0; current && depth < 14; depth += 1, current = current.parentElement) {
    const text = textOf(current);
    if (isCommentContainer(current) && text.length >= 2 && text.length < 5000) return current;
  }
  return node?.closest?.('[role="article"], li') || node;
}
function commentLink(node) {
  return [...(node?.querySelectorAll?.("a[href]") || [])].find((link) => /[?&](?:comment_id|reply_comment_id)=/i.test(link.href || "")) || null;
}
function commentIds(href) {
  try {
    const url = new URL(href || location.href, location.href);
    const reply = url.searchParams.get("reply_comment_id") || "";
    const comment = url.searchParams.get("comment_id") || "";
    return { commentId: reply || comment, parentCommentId: reply ? comment : "" };
  } catch { return { commentId: "", parentCommentId: "" }; }
}
function containerForLink(link) {
  let current = link;
  for (let depth = 0; current && depth < 12; depth += 1, current = current.parentElement) {
    if (isCommentContainer(current) && textOf(current).length < 5000) return current;
  }
  return link?.closest?.('[role="article"], li') || null;
}
function findParentById(parentCommentId, childNode) {
  if (!parentCommentId) return null;
  const match = [...document.querySelectorAll('a[href*="comment_id"]')].find((link) => {
    const ids = commentIds(link.href);
    return ids.commentId === parentCommentId && !ids.parentCommentId;
  });
  const container = containerForLink(match);
  return container && container !== childNode ? container : null;
}
function findNestedParent(childNode) {
  let current = childNode?.parentElement;
  const childText = textOf(childNode);
  for (let depth = 0; current && depth < 18; depth += 1, current = current.parentElement) {
    const text = textOf(current);
    if (isCommentContainer(current) && text.length > childText.length + 8 && text.length < 5000) return current;
  }
  return null;
}
function nearbyCommentCandidates(childNode) {
  const candidates = [];
  let current = childNode;
  for (let depth = 0; current && depth < 8; depth += 1, current = current.parentElement) {
    let sibling = current.previousElementSibling;
    for (let index = 0; sibling && index < 4; index += 1, sibling = sibling.previousElementSibling) {
      if (isCommentContainer(sibling)) candidates.push(sibling);
      const nested = [...(sibling.querySelectorAll?.('[role="article"], li') || [])].at(-1);
      if (nested) candidates.push(nested);
    }
  }
  return candidates;
}
function usefulContext(node, commentText) {
  const text = textOf(node);
  if (!text || text === commentText || text.length > 5000) return "";
  return text;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "capture-csm-comment") return;
  const commentNode = closestComment(lastTarget || document.activeElement);
  const links = [...(commentNode?.querySelectorAll?.("a") || [])];
  const name = links.map(textOf).find((value) => value && value.length < 80 && !/like|reply|share|ago$/i.test(value)) || "";
  const timeNode = commentNode?.querySelector?.("abbr, time, a[href*='comment_id'], a[href*='reply_comment_id']");
  const ids = commentIds(commentLink(commentNode)?.href || timeNode?.href || location.href);
  const commentText = String(message.selectionText || textOf(commentNode)).slice(0, 4000);
  const exactParent = findParentById(ids.parentCommentId, commentNode);
  const nestedParent = findNestedParent(commentNode);
  const contexts = [...new Set([exactParent, nestedParent, ...nearbyCommentCandidates(commentNode)].filter(Boolean).map((node) => usefulContext(node, commentText)).filter(Boolean))].slice(0, 8);
  sendResponse({
    commentText,
    contextText: usefulContext(exactParent || nestedParent, commentText) || contexts[0] || "",
    contextCandidates: contexts,
    contextSource: exactParent ? "facebook-parent-id" : nestedParent ? "nested-parent" : contexts.length ? "nearby-comment" : "none",
    displayedName: name,
    displayedTime: timeNode?.getAttribute?.("title") || timeNode?.getAttribute?.("datetime") || textOf(timeNode),
    commentId: ids.commentId,
    parentCommentId: ids.parentCommentId,
    pageUrl: location.href,
    capturedAt: new Date().toISOString()
  });
  return true;
});
}
