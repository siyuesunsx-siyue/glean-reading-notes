const pauseButton = document.querySelector("#pause");
const status = document.querySelector("#status");
const accessButton = document.querySelector("#access");
let activeTabId = null;
const pageOrigins = ["https://*/*", "http://*/*"];

function setPauseState(paused) {
  pauseButton.classList.toggle("paused", paused);
  pauseButton.firstChild.textContent = paused ? "恢复本页札记 " : "暂停本页札记 ";
  status.textContent = paused
    ? "本页已暂停；复制内容时不会触发札记"
    : "本页札记已开启；划线后会自动记录";
}

async function readPauseState() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab?.id ?? null;
    if (activeTabId == null) return;
    const result = await chrome.tabs.sendMessage(activeTabId, { action: "getPauseState" });
    if (result?.ok) setPauseState(Boolean(result.paused));
  } catch {
    status.textContent = "此页面暂未连接；普通网页请刷新后重试";
  }
}

async function updateAccessState() {
  try {
    const granted = await chrome.permissions.contains({ origins: pageOrigins });
    accessButton.hidden = granted;
    if (!granted) status.textContent = "先开启网页读取权限，札记才能响应划线";
    return granted;
  } catch {
    return false;
  }
}

async function injectCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  if (/^https:\/\/([^/]+\.)?dedao\.cn\//i.test(tab.url || "")) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: "MAIN", files: ["dedao-selection.js"] });
  }
  await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["core.js", "store.js", "frame-selection.js", "content.js"],
  });
}

document.querySelector("#library").onclick = () =>
  chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
document.querySelector("#settings").onclick = () =>
  chrome.runtime.openOptionsPage();
async function send(action) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const result = await chrome.tabs.sendMessage(tab.id, { action });
    if (action === "togglePause" && result?.ok) {
      setPauseState(Boolean(result.paused));
      await chrome.action.setBadgeText({
        tabId: tab.id,
        text: result.paused ? "Ⅱ" : "",
      });
      await chrome.action.setTitle({
        tabId: tab.id,
        title: result.paused ? "札记已暂停本页" : "札记 Glean",
      });
    }
    window.close();
  } catch {
    status.textContent =
      "此页面无法直接划线。普通网页请刷新后重试；浏览器内置 PDF、特殊阅读器可先到收获库手动记灵感。";
  }
}
document.querySelector("#page").onclick = () => send("togglePanel");
document.querySelector("#note").onclick = () => send("newNote");

pauseButton.onclick = () => send("togglePause");
accessButton.onclick = async () => {
  accessButton.disabled = true;
  status.textContent = "正在开启网页读取权限…";
  try {
    const granted = await chrome.permissions.request({ origins: pageOrigins });
    if (!granted) throw Error("permission denied");
    await injectCurrentTab();
    accessButton.hidden = true;
    status.textContent = "网页读取已开启；划线后会自动记录";
  } catch {
    status.textContent = "未开启权限；请在扩展详情的“网站访问权限”中选择“所有网站”";
  } finally {
    accessButton.disabled = false;
  }
};
updateAccessState().then((granted) => { if (granted) readPauseState(); });
