(() => {
  if (window === window.top || globalThis.__gleanFrameActive) return;
  globalThis.__gleanFrameActive = true;
  let dragging = false, timer, last = "";
  function capture() {
    if (!chrome.runtime?.id) return;
    const selection = getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) { last = ""; return; }
    const node = selection.getRangeAt(0).startContainer;
    if ((node.parentElement || node)?.closest?.('input,textarea,select,[contenteditable]')) return;
    const quote = selection.toString().trim();
    if (!quote || quote.length > 30000 || quote === last) return;
    last = quote;
    try {
      chrome.runtime.sendMessage({action:"frameSelection",quote})
        .catch(() => { last = ""; });
    } catch { last = ""; }
  }
  window.addEventListener("pointerdown", () => { dragging = true; }, true);
  window.addEventListener("pointerup", () => { dragging = false; capture(); }, true);
  window.addEventListener("mouseup", capture, true);
  window.addEventListener("keyup", e => { if (e.key === "Shift") capture(); }, true);
  document.addEventListener("selectionchange", () => {
    clearTimeout(timer); timer = setTimeout(() => { if (!dragging) capture(); }, 180);
  });
})();
