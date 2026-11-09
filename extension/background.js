importScripts("core.js");
importScripts("feishu-sync.js");
let queue = Promise.resolve();
async function openReadingPanel(tab) {
  if (!tab.id) return;
  if (/\.pdf(?:[?#]|$)/i.test(tab.url || "")) {
    await chrome.tabs.create({url:chrome.runtime.getURL("pdf.html?source=" + encodeURIComponent(tab.url) + "&panel=1")});
    await chrome.action.setBadgeText({tabId:tab.id,text:""});
    await chrome.action.setTitle({tabId:tab.id,title:"札记 Glean"});
    return;
  }
  try {
    if (/^https:\/\/([^/]+\.)?dedao\.cn\//i.test(tab.url || "")) {
      await chrome.scripting.executeScript({target:{tabId:tab.id},world:"MAIN",files:["dedao-selection.js"]});
    }
    try {
      const pauseState = await chrome.tabs.sendMessage(tab.id, { action: "getPauseState" }, {frameId:0});
      await chrome.tabs.sendMessage(
        tab.id,
        pauseState?.paused ? { action: "togglePause" } : { action: "togglePanel" },
        {frameId:0},
      );
    } catch {
      // Tabs opened before installation may not have a content script yet.
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames:true },
        files: ["core.js", "store.js", "frame-selection.js", "content.js"],
      });
      const pauseState = await chrome.tabs.sendMessage(tab.id, { action: "getPauseState" }, {frameId:0});
      await chrome.tabs.sendMessage(
        tab.id,
        pauseState?.paused ? { action: "togglePause" } : { action: "togglePanel" },
        {frameId:0},
      );
    }
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.action.setTitle({ tabId: tab.id, title: "札记 Glean" });
  } catch (error) {
    // Keep the reader in place, including on pages that disallow injection.
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setTitle({ tabId: tab.id,
      title: "札记暂未连接：请刷新网页后重试。浏览器内部页面暂不支持侧栏。" });
  }
}
chrome.action.onClicked.addListener(openReadingPanel);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "frameSelection" && sender.tab && sender.frameId > 0) {
    chrome.tabs.sendMessage(sender.tab.id, {action:"frameSelection",quote:message.quote}, {frameId:0})
      .then(() => sendResponse({ok:true})).catch(() => sendResponse({ok:false}));
    return true;
  }
  if (message.action === "openLibrary") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("app.html" + (message.hash || "")),
    }).then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false, error: "无法打开收获库，请重试" }));
    return true;
  }
  if (message.action === "patch") {
    queue = queue
      .catch(() => {})
      .then(async () => {
        const key = "record:" + message.id;
        const r = (await chrome.storage.local.get(key))[key];
        if (!r) throw Error("记录已不存在");
        const allowed = {};
        for (const field of ["thought", "type", "tags", "status", "favorite"])
          if (field in message.changes) allowed[field] = message.changes[field];
        const updated = Glean.validateRecord({
          ...r,
          ...allowed,
          updatedAt: new Date().toISOString(),
        });
        await chrome.storage.local.set({ [key]: updated });
        sendResponse({ record: updated });
      })
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }
});
