(() => {
  if (window !== window.top) return;
  if (!document.body || location.pathname.endsWith("/app.html")) return;
  const previous = document.querySelector("glean-reader");
  const recovered = [...(previous?.shadowRoot?.querySelectorAll("textarea[data-draft]") || [])]
    .filter(el => el.value.trim()).map(el => ({id:el.dataset.draft, thought:el.value,
      quote:el.closest(".card")?.querySelector(".card-title strong")?.textContent || ""}));
  previous?.dispatchEvent(new Event("glean-dispose"));
  previous?.remove();
  globalThis.__gleanReaderActive = true;
  const host = document.createElement("glean-reader");
  host.style.cssText =
    "all:initial;position:fixed;z-index:2147483646;top:0;left:0;width:0;height:0;";
  document.body.append(host);
  const shadow = host.attachShadow({ mode: "open" }),
    E = Glean.esc;
  shadow.innerHTML = `<style>
  :host{all:initial;color-scheme:light}*{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer;color:inherit}button:focus-visible,a:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #668ddd;outline-offset:3px}.ui{font:13px/1.7 "Segoe UI","Microsoft YaHei",sans-serif;color:#34435d}button{border:1px solid #e3e9f2;border-radius:7px;background:#fff;padding:8px 11px}button:hover{background:#f1f5fc}button:disabled{opacity:.5;cursor:not-allowed}.primary{background:#315baf;color:#fff;border-color:#315baf}.primary:hover{background:#264d96}.plain{border:0;background:transparent;padding:5px 7px;color:#78869a}.muted{font-size:12px;color:#8b97a8}.bar{position:fixed;display:flex;padding:5px;background:#fff;border:1px solid #e4e8ef;box-shadow:0 6px 24px #203a5f20;border-radius:10px;gap:2px;max-width:calc(100vw - 16px);flex-wrap:wrap}.bar button{border:0;border-radius:6px;white-space:nowrap;padding:7px 11px}.bar .divider{width:1px;background:#edf0f4;margin:5px}.float{position:fixed;right:0;top:45%;border-radius:10px 0 0 10px;padding:12px 9px;box-shadow:0 5px 17px #21487926;background:#315baf;color:#fff;border:0;z-index:3;min-width:38px;height:46px}.float:hover{background:#264d96}.float span{border-left:1px solid #ffffff50;padding-left:11px}.panel{position:fixed;right:0;top:0;height:100vh;width:min(390px,100vw);background:#fff;border-left:1px solid #e3e8f0;box-shadow:-8px 0 35px #233b5910;display:flex;flex-direction:column}.panel-head{padding:22px 22px 17px;border-bottom:1px solid #edf0f5;flex-shrink:0}.row{display:flex;align-items:center;justify-content:space-between;gap:8px}h2{font-size:20px;margin:0 0 3px;color:#202b3c}h3{font-size:14px;margin:0;font-weight:600}.panel-tools{display:flex;gap:8px;margin-top:14px}.panel-tools button{flex:1}.cards{padding:15px;overflow:auto;flex:1}.card{border:1px solid #e4eaf3;border-radius:8px;margin-bottom:10px;overflow:hidden}.card.open{border-color:#91b3f0;background:#fbfdff}.card-title{width:100%;border:0;border-radius:0;text-align:left;padding:13px;background:transparent}.card-title strong{display:block;font-weight:550;font-size:13px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.card-title .meta{display:flex;gap:8px;margin-top:6px;align-items:center}.pill{font-size:10px;background:#edf4ff;color:#6687bd;padding:1px 5px;border-radius:4px}.pill.later{color:#a68040;background:#fff5e4}.card-body{padding:0 14px 15px}.quote{font-family:Georgia,SimSun,serif;font-size:14px;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 13px;border-left:3px solid #dbe6f8;margin:6px 0 16px;background:#f6f9fe}label{display:block;font-size:12px;color:#7c8aa0;margin:12px 0 7px}textarea{display:block;width:100%;min-height:110px;resize:vertical;border:1px solid #dfe6f1;border-radius:7px;padding:10px 12px;color:#34435d;background:#fff;line-height:1.8}a{color:#3d65a9;text-decoration:none;overflow-wrap:anywhere}.actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.actions button{font-size:11px;flex:1;padding:7px}.context{margin-top:10px;background:#f3f6fa;padding:11px;border-radius:6px;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}.panel-foot{padding:12px 20px;border-top:1px solid #edf0f5;display:flex;justify-content:space-between}.empty{text-align:center;color:#92a0b2;padding:50px 20px;font-size:13px;line-height:2}.composer{position:fixed;width:min(365px,calc(100vw - 24px));background:#fff;border:1px solid #e1e7ef;border-radius:12px;box-shadow:0 12px 50px #20375924;padding:18px}.composer textarea{min-height:130px}.composer .quote{max-height:110px;overflow:auto;font-size:12px;margin-bottom:10px}.composer select{max-width:140px;border:1px solid #e1e7ef;padding:8px;border-radius:6px;background:white;color:#64748b}.toast{position:fixed;bottom:28px;left:25px;background:#29394b;color:#fff;border-radius:8px;box-shadow:0 5px 20px #29394b22;padding:12px 18px;max-width:calc(100vw - 50px)}[hidden]{display:none!important}
  </style><div class="ui"><div class="bar" hidden role="toolbar" aria-label="保存阅读收获"><button data-action="save">♧ 存入札记</button><span class="divider"></span><button data-action="write">✎ 写想法</button><span class="divider"></span><button data-action="content">内容灵感</button><button data-action="product">产品灵感</button></div><div class="float-tools"><button class="float" title="打开或收起札记" aria-label="打开或收起札记">札</button><button class="float-pause" title="暂停本页札记" aria-label="暂停本页札记">⏸</button></div><section class="panel" hidden aria-label="本篇记录"></section><section class="composer" hidden role="dialog" aria-label="记录想法"></section><div class="toast" hidden role="status"></div></div>`;
  const $ = (s) => shadow.querySelector(s),
    bar = $(".bar"),
    panel = $(".panel"),
    composer = $(".composer");
  let capture = null,
    expanded = null,
    pageRecords = [],
    timer,
    lastUrl = location.href,
    bodyMargin = null,
    composeDraft = null;
  const drafts = new Map();
  const pageUrl = () => Glean.canonical(globalThis.GleanReadingSource || location.href);
  // Version the pause marker so a stale marker from an older build cannot
  // silently disable capture forever after an extension update.
  const pauseKey = () => `glean-paused:v2:${pageUrl()}`;
  let paused = (() => { try { return sessionStorage.getItem(pauseKey()) === "1"; } catch { return false; } })();
  function setPaused(value) {
    paused = value;
    try { if (value) sessionStorage.setItem(pauseKey(), "1"); else sessionStorage.removeItem(pauseKey()); } catch {}
    const pauseButton = $(".float-pause");
    if (pauseButton) {
      pauseButton.textContent = value ? "▶" : "⏸";
      pauseButton.title = value ? "恢复本页札记" : "暂停本页札记";
      pauseButton.setAttribute("aria-label", value ? "恢复本页札记" : "暂停本页札记");
      pauseButton.classList.toggle("paused", value);
    }
  }
  setPaused(paused);
  function toast(text) {
    $(".toast").textContent = text;
    $(".toast").hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => ($(".toast").hidden = true), 3000);
  }
  globalThis.GleanSetReadingSource = async url => {
    if (!(await flushAll())) return false;
    globalThis.GleanReadingSource = url;
    expanded = null; draftRecord = null; lastSelectionKey = "";
    await refresh(); return true;
  };
  function textNodes() {
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (n) =>
          n.parentElement?.closest(
            'script,style,noscript,textarea,input,select,[contenteditable="true"],glean-reader',
          )
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      },
    );
    const arr = [];
    let n;
    while ((n = walk.nextNode())) arr.push(n);
    return arr;
  }
  function findRange(r) {
    if (!r.quote) return null;
    const nodes = textNodes(),
      text = nodes.map((n) => n.textContent).join("");
    let at = -1,
      from = 0;
    while ((from = text.indexOf(r.quote, from)) !== -1) {
      if (
        (!r.prefix ||
          text.slice(Math.max(0, from - r.prefix.length), from) === r.prefix) &&
        (!r.suffix ||
          text.slice(
            from + r.quote.length,
            from + r.quote.length + r.suffix.length,
          ) === r.suffix)
      ) {
        at = from;
        break;
      }
      from++;
    }
    if (at < 0) {
      at = text.indexOf(r.quote);
      if (at < 0 || text.indexOf(r.quote, at + 1) >= 0) return null;
    }
    let pos = 0,
      start,
      end;
    for (const n of nodes) {
      const len = n.textContent.length;
      if (!start && pos + len > at) start = [n, at - pos];
      if (pos + len >= at + r.quote.length) {
        end = [n, at + r.quote.length - pos];
        break;
      }
      pos += len;
    }
    if (!start || !end) return null;
    const range = new Range();
    range.setStart(...start);
    range.setEnd(...end);
    return range;
  }
  const markStyle = document.createElement("style");
  markStyle.textContent =
    "::highlight(glean-saved){background:#e7effc;color:inherit}::highlight(glean-focus){background:#f8df96;color:inherit}";
  document.documentElement.append(markStyle);
  function highlight() {
    if (!globalThis.CSS?.highlights) return;
    const ranges = pageRecords
      .filter((r) => r.quote)
      .slice(0, 250)
      .map(findRange)
      .filter(Boolean);
    CSS.highlights.set("glean-saved", new Highlight(...ranges));
  }
  function jump(r) {
    const range = findRange(r);
    if (!range) {
      toast("暂时找不到原文位置，可以查看保存的上下文");
      return;
    }
    range.startContainer.parentElement.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
    if (globalThis.CSS?.highlights) {
      CSS.highlights.set("glean-focus", new Highlight(range));
      setTimeout(() => CSS.highlights.delete("glean-focus"), 2500);
    }
  }
  async function refresh() {
    try {
      pageRecords = (await GleanStore.list()).filter(
        (r) => r.url === pageUrl(),
      );
      if (
        !panel.hidden &&
        !drafts.size &&
        !saveJobs.size &&
        !shadow.activeElement?.matches("textarea,select") &&
        !draftRecord
      )
        renderPanel();
      highlight();
    } catch (e) {
      toast("读取记录失败：" + e.message);
    }
  }
  function position(el, rect) {
    const w = el.offsetWidth,
      h = el.offsetHeight;
    el.style.left = Math.max(8, Math.min(rect.left, innerWidth - w - 8)) + "px";
    el.style.top =
      Math.max(8, Math.min(rect.top - h - 9, innerHeight - h - 8)) + "px";
  }
  // Capture before a site's annotation toolbar stops propagation or clears
  // the selection. Saving remains queued, so the site's own handler still runs.
  window.addEventListener("mouseup", (e) => {
    if (e.composedPath().includes(host)) return;
    if (e.button !== 0 || e.target?.closest?.('input,textarea,select,[contenteditable]')) return;
    readSelection();
  }, true);
  window.addEventListener("keyup", (e) => {
    if (e.composedPath().includes(host)) return;
    if (e.key === "Shift" || (e.shiftKey && e.key.startsWith("Arrow"))) readSelection();
  }, true);
  let selectionQueue = Promise.resolve();
  let lastSelectionKey = "";
  let selecting = false, selectionTimer, selectionGestureUntil = 0;
  let ignoreDedaoSelectionUntil = 0;
  window.addEventListener("pointerdown", () => { selecting = true; }, true);
  window.addEventListener("pointerup", e => {
    selecting = false;
    if (!e.composedPath().includes(host)) { readSelection(); if (getSelection()?.toString().trim()) selectionGestureUntil = Date.now() + 250; }
  }, true);
  document.addEventListener("selectionchange", () => {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => { if (!selecting) readSelection(); }, 180);
  });
  function readSelection() {
    if (paused) { bar.hidden = true; return; }
    if (!host.isConnected) return;
    if (!composer.hidden) return;
    const selection = getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      bar.hidden = true;
      lastSelectionKey = "";
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.commonAncestorContainer.getRootNode() === shadow) return;
    const parent = range.startContainer.parentElement;
    if (parent?.closest('input,textarea,select,[contenteditable="true"]'))
      return;
    const quote = selection.toString().trim();
    if (!quote || quote.length > 30000) {
      bar.hidden = true;
      if (quote.length > 30000) toast("这次选择超过 3 万字，请分段划线保存。");
      return;
    }
    const nodes = textNodes(),
      joined = nodes.map((n) => n.textContent).join("");
    let offset = 0;
    for (const n of nodes) {
      if (n === range.startContainer) {
        offset += range.startOffset;
        break;
      }
      offset += n.textContent.length;
    }
    const at = joined.indexOf(quote, Math.max(0, offset - 2));
    const index = at >= 0 ? at : joined.indexOf(quote);
    capture = {
      quote,
      title: document.title || "未命名网页",
      url: pageUrl(),
      context:
        index >= 0
          ? joined.slice(Math.max(0, index - 220), index + quote.length + 220)
          : quote,
      prefix: index >= 0 ? joined.slice(Math.max(0, index - 40), index) : "",
      suffix:
        index >= 0
          ? joined.slice(index + quote.length, index + quote.length + 40)
          : "",
    };
    bar.hidden = true;
    const snapshot = { ...capture };
    acceptSelection(snapshot);
  }
  function acceptSelection(snapshot) {
    if (paused) return;
    const selectionKey = JSON.stringify([snapshot.url, snapshot.quote, snapshot.prefix, snapshot.suffix]);
    if (selectionKey === lastSelectionKey) return;
    lastSelectionKey = selectionKey;
    selectionQueue = selectionQueue.then(async () => {
      if (!(await flushAll())) { lastSelectionKey = ""; return; }
      try {
        const records = await GleanStore.list();
        const existing = records.find(r => r.url === snapshot.url &&
          r.quote === snapshot.quote && r.prefix === snapshot.prefix &&
          r.suffix === snapshot.suffix);
        const saved = existing || await GleanStore.save(Glean.record(snapshot));
        if (pageUrl() !== snapshot.url) return;
        draftRecord = null;
        expanded = saved.id;
        await refresh();
        await setPanel(true);
        // Reveal the editor without moving focus away from the article.
        const card = shadow.querySelector(`[data-expand="${saved.id}"]`)?.closest(".card");
        const list = $(".cards");
        if (card && list) list.scrollTop += card.getBoundingClientRect().top - list.getBoundingClientRect().top;
      } catch (error) {
        lastSelectionKey = "";
        toast(/context invalidated|receiving end|establish connection/i.test(error?.message || "")
          ? "扩展刚更新，请先复制尚未保存的想法，再刷新当前阅读网页；刷新后重新选择即可保存。"
          : "划线未保存，请重新选择这段文字重试");
      }
    }).catch(() => toast("划线未保存，请重新选择这段文字重试"));
  }
  window.addEventListener("message", e => {
    if (!host.isConnected || !/(^|\.)dedao\.cn$/.test(location.hostname)) return;
    const data = e.data;
    if (e.source !== window || e.origin !== location.origin || data?.channel !== "glean-dedao-selection") return;
    if (paused || Date.now() < ignoreDedaoSelectionUntil) return;
    if (typeof data.quote !== "string" || !data.quote.trim() || data.quote.length > 30000) return;
    const quote = data.quote.trim();
    // EasyMarker has already confirmed the selection in the reading surface;
    // do not reject it again because chapter navigation or line wrapping changed
    // the URL/text snapshot in the DOM.
    acceptSelection({quote,context:quote,title:document.title,url:pageUrl(),prefix:"",suffix:""});
  });
  bar.addEventListener("mousedown", (e) => e.preventDefault());
  bar.addEventListener("click", async (e) => {
    const action = e.target.closest("button")?.dataset.action;
    if (!action || !capture) return;
    const snapshot = { ...capture };
    bar.hidden = true;
    if (action === "write") openComposer(snapshot);
    else
      await saveCapture(snapshot, {
        type: ["content", "product"].includes(action) ? action : "reading",
        later: action === "review" ? "review" : "",
      });
  });
  async function saveCapture(data, extra = {}) {
    try {
      const saved = await GleanStore.save(Glean.record({ ...data, ...extra }));
      // Saving a highlight never expands a record or interrupts the current editor.
      getSelection()?.removeAllRanges();
      await refresh();
      toast("✓ 已保存到札记，继续阅读吧");
      return true;
    } catch (e) {
      toast("保存失败，请重试：" + e.message);
      return false;
    }
  }
  let panelWidth = 300,
    preferredWidth = 300,
    originalWidth = null,
    originalMargin = null;
  let draftRecord = null,
    isComposing = false;
  const saveTimers = new Map(),
    saveJobs = new Map();
  function status(id, text) {
    const el = shadow.querySelector(`[data-status="${id}"]`);
    if (el) el.textContent = text;
  }
  function queueThought(id, value) {
    drafts.set(id, value);
    status(id, "保存中…");
    clearTimeout(saveTimers.get(id));
    if (!isComposing)
      saveTimers.set(
        id,
        setTimeout(() => flushThought(id), 450),
      );
  }
  async function flushThought(id) {
    clearTimeout(saveTimers.get(id));
    if (saveJobs.has(id)) return saveJobs.get(id);
    const job = (async () => {
      try {
        while (drafts.has(id)) {
          const thought = drafts.get(id);
          if (draftRecord?.id === id && !draftRecord.persisted) {
            if (!thought.trim()) {
              drafts.delete(id);
              status(id, "");
              break;
            }
            await GleanStore.save({ ...draftRecord.record, thought });
            draftRecord.persisted = true;
          } else {
            await GleanStore.patch(id, { thought });
          }
          if (drafts.get(id) === thought) drafts.delete(id);
        }
        status(id, "已保存");
        await refresh();
        return true;
      } catch (error) {
        status(id, "未保存 · 点击重试");
        return false;
      }
    })();
    saveJobs.set(id, job);
    try {
      return await job;
    } finally {
      saveJobs.delete(id);
    }
  }
  async function flushAll() {
    const ids = [...new Set([...drafts.keys(), ...saveJobs.keys()])];
    const ok = (await Promise.all(ids.map(flushThought))).every(Boolean);
    if (!ok) toast("尚有内容未保存，请在记录下方重试");
    return ok;
  }
  function wireEditor(el) {
    el.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
        // Let the textarea move its own caret without triggering the reader's
        // page-navigation shortcuts behind the shadow root.
        event.stopPropagation();
      }
    });
    el.addEventListener("compositionstart", () => {
      isComposing = true;
      clearTimeout(saveTimers.get(el.dataset.draft));
    });
    el.addEventListener("compositionend", () => {
      isComposing = false;
      queueThought(el.dataset.draft, el.value);
    });
    el.addEventListener("input", () =>
      queueThought(el.dataset.draft, el.value),
    );
    el.addEventListener("blur", () => {
      if (!isComposing) flushThought(el.dataset.draft);
    });
  }
  async function openComposer(data = null) {
    if (!(await flushAll())) return;
    bar.hidden = true;
    composer.hidden = true;
    if (data) {
      try {
        const saved = await GleanStore.save(Glean.record(data));
        expanded = saved.id;
        await refresh();
      } catch (e) {
        toast("保存失败：" + e.message);
        return;
      }
      draftRecord = null;
    } else {
      if (!draftRecord || draftRecord.persisted) {
        const record = Glean.record({
          url: pageUrl(),
          title: document.title || "随手想法",
        });
        draftRecord = { id: record.id, record, persisted: false };
      }
      expanded = draftRecord.id;
    }
    await setPanel(true);
    shadow.querySelector("[data-draft]")?.focus();
  }
  const readingStyles = new Map();
  let readingObserver = null, readingLayoutTimer;
  function fitStyle(el, property, value) {
    let originals = readingStyles.get(el);
    if (!originals) readingStyles.set(el, originals = new Map());
    if (!originals.has(property)) originals.set(property, {
      value: el.style.getPropertyValue(property), priority: el.style.getPropertyPriority(property)
    });
    el.style.setProperty(property, value, 'important');
  }
  function restoreReadingLayout() {
    readingObserver?.disconnect();
    readingObserver = null;
    clearTimeout(readingLayoutTimer);
    for (const [el, properties] of readingStyles) {
      for (const [property, original] of properties) {
        if (original.value) el.style.setProperty(property, original.value, original.priority);
        else el.style.removeProperty(property);
      }
    }
    readingStyles.clear();
  }
  function fitReadingPage() {
    if (panel.hidden || innerWidth < 560) return;
    const available = document.documentElement.clientWidth - panelWidth;
    fitStyle(document.body, 'width', available + 'px');
    fitStyle(document.body, 'max-width', available + 'px');
    fitStyle(document.body, 'min-width', '0');
    fitStyle(document.body, 'box-sizing', 'border-box');
    fitStyle(document.body, 'margin-right', panelWidth + 'px');
    // Viewport-sized app roots and fixed shells do not inherit the body's width.
    for (const el of document.body.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement) || el === host || el.closest('glean-reader')) continue;
      const css = getComputedStyle(el);
      if (css.display === 'none') continue;
      const rect = el.getBoundingClientRect();
      const root = el.parentElement === document.body;
      const fixed = css.position === 'fixed' && rect.width > available * .65;
      const overflowing = rect.right > available + 1 && rect.width > available * .65 && !el.closest('pre,table,code');
      if (!root && !fixed && !overflowing) continue;
      const limit = Math.max(0, available - Math.max(0, rect.left));
      fitStyle(el, 'max-width', limit + 'px');
      fitStyle(el, 'min-width', '0');
      fitStyle(el, 'box-sizing', 'border-box');
      if (fixed) {
        fitStyle(el, 'left', Math.max(0, rect.left) + 'px');
        fitStyle(el, 'right', 'auto');
        fitStyle(el, 'width', limit + 'px');
      }
    }
  }
  function isDedaoReader() {
    return /(^|\.)dedao\.cn$/i.test(location.hostname) && /\/ebook\/reader/i.test(location.pathname);
  }
  function layoutPanel() {
    panelWidth = Math.min(preferredWidth, Math.max(240, innerWidth - 280));
    panel.style.width = Math.min(panelWidth, innerWidth) + 'px';
    restoreReadingLayout();
    // 得到电子书保留自己的内部排版，只在 body 外侧预留侧栏空间，避免札记遮住正文。
    if (!panel.hidden && innerWidth >= 560 && isDedaoReader()) {
      fitStyle(document.documentElement, 'padding-right', panelWidth + 'px');
      fitStyle(document.documentElement, 'box-sizing', 'border-box');
      const available = innerWidth - panelWidth;
      const root = [...document.body.children].find((el) => {
        if (!(el instanceof HTMLElement) || el === host || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > available * 0.8 && rect.height > 200;
      });
      if (root) {
        fitStyle(root, 'width', available + 'px');
        fitStyle(root, 'max-width', available + 'px');
        fitStyle(root, 'box-sizing', 'border-box');
      }
    }
  }
  async function persistWidth() {
    try {
      const s = await GleanStore.settings();
      await GleanStore.saveSettings({ ...s, panelWidth: preferredWidth });
    } catch (e) {
      toast("宽度暂未保存，下次打开将使用默认宽度");
    }
  }
  function dismissPageSelection() {
    bar.hidden = true;
    clearTimeout(selectionTimer);
    ignoreDedaoSelectionUntil = Date.now() + 800;
    try { getSelection()?.removeAllRanges(); } catch { /* Some readers own the selection. */ }
    window.postMessage(
      { channel: "glean-dedao-control", action: "suppress-selection" },
      location.origin,
    );
  }
  async function setPanel(open) {
    if (!open) dismissPageSelection();
    if (!(await flushAll())) return;
    bar.hidden = true;
    if (!open) draftRecord = null;
    panel.hidden = !open;
    if (open) {
      layoutPanel();
      renderPanel();
    } else {
      restoreReadingLayout();
    }
    try {
      $(".float-tools").hidden = open || !(await GleanStore.settings()).floating;
    } catch {
      toast("札记连接已失效，请先复制尚未保存的想法，再刷新当前阅读网页。");
    }
  }
  $(".float").innerHTML = "札";
  $(".float").setAttribute("aria-label", "打开或收起札记");
  $(".float").title = "打开或收起札记";
  $(".float").onclick = () => setPanel(panel.hidden);
  $(".float-pause").onclick = (event) => {
    event.stopPropagation();
    setPaused(!paused);
    bar.hidden = true;
    if (paused) {
      setPanel(false);
      toast("本页已暂停札记；复制内容不会触发记录");
    } else {
      toast("本页已恢复札记；划线后会自动记录");
    }
  };
  document.addEventListener("click", (event) => {
    if (panel.hidden || event.composedPath().includes(host)) return;
    // Ignore the click event that immediately follows a completed selection.
    if (Date.now() < selectionGestureUntil) return;
    setPanel(false);
  }, true);
  async function openLibrary(hash = "") {
    if (!GleanStore.ext) { window.open("app.html" + hash, "_blank"); return; }
    try {
      if (!globalThis.chrome?.runtime?.id) throw Error("Extension context invalidated");
      const response = await chrome.runtime.sendMessage({ action: "openLibrary", hash });
      if (!response?.ok) throw Error("Background unavailable");
    } catch {
      toast("无法连接札记后台。请先复制尚未保存的想法，再刷新当前阅读网页后重试。");
    }
  }
  function readingOrder(items) {
    // Keep the panel in the same order as the user created records: oldest first, newest last.
    return [...items].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt) || String(a.id).localeCompare(String(b.id)),
    );
  }
  function offerUndo(record) {
    const notice = document.createElement('div');
    notice.className = 'toast';
    notice.setAttribute('role', 'status');
    notice.style.bottom = (65 + shadow.querySelectorAll('[data-undo]').length * 48) + 'px';
    notice.append(document.createTextNode('已删除 '));
    const button = document.createElement('button');
    button.className = 'plain';
    button.dataset.undo = record.id;
    button.textContent = '撤销';
    notice.append(button);
    $('.ui').append(notice);
    let timeout = setTimeout(() => notice.remove(), 12000);
    button.onclick = async () => {
      button.disabled = true;
      clearTimeout(timeout);
      try {
        await GleanStore.save({...record, updatedAt:new Date().toISOString()});
        if (record.url === pageUrl()) {
          expanded = record.id;
          await refresh();
          if (!drafts.size && !shadow.activeElement?.matches('textarea')) renderPanel();
        }
        notice.remove();
      } catch { button.disabled = false; button.textContent = '恢复失败，重试'; }
    };
  }
  let tagQueue = Promise.resolve();
  function renderPanel() {
    const scroll = $(".cards")?.scrollTop || 0;
    const items = readingOrder(pageRecords);
    if (draftRecord && !draftRecord.persisted) items.push(draftRecord.record);
    panel.innerHTML = `<div class="resize-handle" role="separator" tabindex="0" aria-label="调整侧栏宽度" aria-orientation="vertical" aria-valuemin="240" aria-valuemax="480" aria-valuenow="${Math.round(panelWidth)}"></div><header class="panel-head"><div class="row"><h2>本篇记录 <span class="count">${pageRecords.length || ""}</span></h2><div><button class="plain" id="panel-menu-toggle" aria-label="更多" aria-expanded="false">···</button><button class="plain" id="panel-close" aria-label="关闭侧栏">×</button></div></div><div class="panel-menu" hidden><button id="library">收获库 ↗</button><button id="panel-settings">设置</button><button id="panel-pause">${paused ? "恢复本页札记" : "暂停本页札记"}</button></div></header><div class="cards">${
      items.length
        ? items
            .map(
              (r) =>
                `<article class="card ${expanded === r.id ? "open" : ""}"><button class="card-title" data-expand="${r.id}" aria-expanded="${expanded === r.id}"><strong>${E(r.quote || r.thought || "随手想法")}</strong>${expanded !== r.id && r.thought && r.quote ? `<span class="thought-preview">${E(r.thought)}</span>` : ""}</button>${
                  expanded === r.id
                    ? `<div class="card-body"><button class="plain quote-edit-toggle" data-quote-edit="${r.id}" aria-expanded="false">编辑摘录</button><div class="quote-editor" data-quote-editor="${r.id}" hidden><textarea data-quote-draft="${r.id}" aria-label="原文摘录">${E(r.quote || "")}</textarea><button class="save-status plain" data-quote-save="${r.id}" aria-live="polite">保存摘录</button></div><textarea data-draft="${r.id}" aria-label="我的想法" placeholder="这让我想到……">${E(drafts.get(r.id) ?? r.thought)}</textarea><button class="save-status plain" data-status="${r.id}" aria-live="polite" title="保存失败时点击重试">${drafts.has(r.id) ? "保存中…" : r.thought || r.quote ? "已保存" : ""}</button><div class="tag-actions" role="group" aria-label="标签，可多选">${Object.entries(Glean.tags).map(([tag,label]) => `<button class="tag-chip" data-tag="${tag}" data-record="${r.id}" aria-pressed="${Glean.recordTags(r).includes(tag)}">${label}</button>`).join("")}</div><div class="later-actions"><label class="status-label">处理状态<select data-processing-status="${r.id}"><option value="unprocessed" ${r.status === "unprocessed" ? "selected" : ""}>未处理</option><option value="converted" ${r.status === "converted" ? "selected" : ""}>已转化</option><option value="archived" ${r.status === "archived" ? "selected" : ""}>已归档</option></select></label><button class="plain" data-delete="${r.id}" style="margin-left:auto">删除</button></div><details><summary>详情</summary><div class="muted source">${E(r.title)}<br>${Glean.date(r.createdAt)} · 北京时间</div>${r.quote ? `<button class="plain" data-jump="${r.id}">返回原文位置 ↗</button>` : ""}<details class="context-details"><summary>上下文</summary><div class="context">${E(r.context || "独立记录，没有关联上下文")}</div></details></details></div>`
                    : ""
                }</article>`,
            )
            .join("")
        : '<div class="empty">选中一句触动你的话。<br>想法，可以慢慢写。</div>'
    }</div><footer class="panel-foot"><button class="plain" id="panel-note">＋ 记想法</button></footer>`;
    $(".cards").scrollTop = scroll;
    $("#panel-close").onclick = () => setPanel(false);
    $("#panel-note").onclick = () => openComposer();
    $("#panel-menu-toggle").onclick = () => {
      const m = $(".panel-menu");
      m.hidden = !m.hidden;
      $("#panel-menu-toggle").setAttribute("aria-expanded", String(!m.hidden));
    };
    $("#library").onclick = async () => {
      if (await flushAll()) await openLibrary();
    };
    $("#panel-settings").onclick = async () => {
      if (await flushAll()) await openLibrary("#settings");
    };
    $("#panel-pause").onclick = () => {
      setPaused(!paused);
      bar.hidden = true;
      if (paused) { setPanel(false); toast("本页已暂停札记；需要时点击右侧“札”恢复"); }
      else { renderPanel(); toast("本页已恢复札记"); }
    };
    shadow.querySelectorAll("[data-expand]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (!(await flushAll())) return;
          expanded = expanded === b.dataset.expand ? null : b.dataset.expand;
          if (draftRecord && expanded !== draftRecord.id) draftRecord = null;
          renderPanel();
        }),
    );
    shadow.querySelectorAll("[data-draft]").forEach(wireEditor);
    shadow.querySelectorAll("[data-quote-edit]").forEach((button) => {
      button.onclick = () => {
        const editor = shadow.querySelector(`[data-quote-editor="${button.dataset.quoteEdit}"]`);
        if (!editor) return;
        editor.hidden = !editor.hidden;
        button.setAttribute("aria-expanded", String(!editor.hidden));
        if (!editor.hidden) editor.querySelector("textarea")?.focus();
      };
    });
    shadow.querySelectorAll("[data-quote-draft]").forEach((el) => el.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) event.stopPropagation();
    }));
    shadow.querySelectorAll("[data-quote-save]").forEach((button) => {
      button.onclick = async () => {
        const id = button.dataset.quoteSave;
        const textarea = shadow.querySelector(`[data-quote-draft="${id}"]`);
        const quote = textarea?.value.trim() || "";
        const record = pageRecords.find((r) => r.id === id) || (draftRecord?.id === id ? draftRecord.record : null);
        if (!record || (!quote && !record.thought)) return toast("摘录和想法至少保留一项");
        button.disabled = true;
        try {
          if (draftRecord?.id === id && !draftRecord.persisted) draftRecord.record.quote = quote;
          else await GleanStore.patch(id, {quote});
          await refresh();
          renderPanel();
          toast("摘录已更新");
        } catch { toast("摘录未保存，请重试"); button.disabled = false; }
      };
    });
    shadow
      .querySelectorAll("[data-status]")
      .forEach((b) => (b.onclick = () => flushThought(b.dataset.status)));
    shadow
      .querySelectorAll("[data-jump]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            jump(pageRecords.find((r) => r.id === b.dataset.jump))),
      );
    shadow.querySelectorAll('[data-processing-status]').forEach(select => {
      select.onchange = async () => {
        if (!(await flushAll())) return;
        try { await GleanStore.patch(select.dataset.processingStatus, {status:select.value}); await refresh(); renderPanel(); }
        catch { toast('处理状态未保存，请重试'); }
      };
    });
    shadow.querySelectorAll('[data-delete]').forEach(button => {
      button.onclick = async () => {
        const id = button.dataset.delete;
        if (!(await flushAll())) return;
        try {
          const saved = (await GleanStore.list()).find(r => r.id === id);
          if (saved) await GleanStore.remove(id);
          drafts.delete(id);
          clearTimeout(saveTimers.get(id));
          if (draftRecord?.id === id) draftRecord = null;
          expanded = null;
          getSelection()?.removeAllRanges();
          lastSelectionKey = '';
          await refresh();
          renderPanel();
          if (saved) offerUndo(saved);
        } catch (error) { toast('删除失败，请重试'); }
      };
    });
    shadow.querySelectorAll('[data-tag]').forEach(button => {
      button.onclick = () => {
        const id = button.dataset.record, tag = button.dataset.tag;
        tagQueue = tagQueue.then(async () => {
          if (!(await flushAll())) return;
          try {
            const isDraft = draftRecord?.id === id && !draftRecord.persisted;
            const record = isDraft ? draftRecord.record : (await GleanStore.list()).find(r => r.id === id);
            if (!record) return;
            const current = Glean.recordTags(record);
            const tags = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
            if (isDraft) draftRecord.record.tags = tags;
            else await GleanStore.patch(id, {tags});
            shadow.querySelectorAll('[data-tag]').forEach(el => {
              if (el.dataset.record === id) el.setAttribute('aria-pressed', String(tags.includes(el.dataset.tag)));
            });
          } catch { toast('标签未保存，请重试'); }
        });
      };
    });
    const handle = $(".resize-handle");
    handle.onpointerdown = (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
    };
    handle.onpointermove = (e) => {
      if (handle.hasPointerCapture(e.pointerId)) {
        preferredWidth = Math.max(240, Math.min(480, innerWidth - e.clientX));
        layoutPanel();
        handle.setAttribute("aria-valuenow", Math.round(panelWidth));
      }
    };
    handle.onpointerup = (e) => {
      if (handle.hasPointerCapture(e.pointerId)) {
        handle.releasePointerCapture(e.pointerId);
        persistWidth();
      }
    };
    handle.onkeydown = (e) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        preferredWidth = Math.max(
          240,
          Math.min(480, preferredWidth + (e.key === "ArrowLeft" ? 10 : -10)),
        );
        layoutPanel();
        handle.setAttribute("aria-valuenow", Math.round(panelWidth));
        persistWidth();
      }
    };
  }
  const quietStyle = document.createElement("style");
  quietStyle.textContent = `.tag-actions{display:flex;flex-wrap:wrap;gap:6px;margin:3px 0 10px}.tag-chip{font-size:11px;padding:3px 7px;border:1px solid #e5e8e0;border-radius:5px;color:#737b6c;background:transparent}.tag-chip[aria-pressed="true"]{background:#edf2e7;border-color:#b6c5a5;color:#46593c}.later-actions{display:flex;gap:8px;margin:0 0 6px}.later-actions button{font-size:11px;padding:3px 0;color:#7b8572}.panel{width:300px;background:#fcfcfb;box-shadow:none;border-color:#e9e9e6}.panel-head{position:relative;padding:17px 17px 13px;border-bottom:1px solid #ededea}h2{font-size:14px;font-weight:500;color:#616660}.count{font-size:11px;color:#a4a69e;margin-left:6px}.cards{padding:8px 17px}.card,.card.open{border:0;border-bottom:1px solid #eaece7;border-radius:0;background:transparent;margin:0}.card-title{padding:18px 0 13px}.card-title:hover{background:transparent}.card-title strong{white-space:normal;font-weight:400;font-size:13px;line-height:1.95;color:#51574f;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.card.open .card-title strong{display:block}.thought-preview{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;color:#93988f;line-height:1.9;margin-top:7px}.card-body{padding:0 0 15px}textarea{min-height:105px;font-size:13px;background:#fff;border:1px solid #e7e9e3;border-radius:5px;color:#566050}textarea::placeholder{color:#a9aea3}.save-status{font-size:10px;color:#969e8e;min-height:24px;padding:2px 0}.card-body>details{font-size:11px;color:#a0a497}summary{cursor:pointer;list-style:none;width:fit-content;padding:4px 0}summary:hover{color:#5f6956}.source{font-size:11px;padding:9px 0;overflow-wrap:anywhere}.card-body select{max-width:100%;padding:4px;border:1px solid #e5e8df;color:#7b8572;background:transparent;border-radius:4px;font-size:11px}.context{background:#f4f5f0;font-size:12px}.context-details{margin-top:5px}.panel-foot{border:0;padding:12px 17px 18px}.panel-foot button{font-size:12px;color:#8a9382;padding:5px 0}.panel-menu{position:absolute;right:17px;top:48px;z-index:2;background:#fff;border:1px solid #e4e6df;border-radius:6px;padding:4px;box-shadow:0 6px 15px #27301a09}.panel-menu button{display:block;width:100%;text-align:left;border:0;font-size:12px;color:#78816f}.resize-handle{position:absolute;top:0;bottom:0;left:-4px;width:8px;cursor:col-resize;touch-action:none}.float-tools{position:fixed;right:14px;top:45%;display:flex;flex-direction:row-reverse;align-items:center;gap:6px;z-index:3}.float-tools .float{position:static;right:auto;top:auto;z-index:auto;min-width:40px;width:40px;height:40px;padding:8px;border:1px solid #dfe5ef;border-radius:11px;background:#315baf;color:#fff;box-shadow:0 5px 16px #263d5a22;font-family:serif;font-size:17px}.float-tools .float:hover{background:#264d96}.float-pause{width:40px;height:40px;min-width:40px;padding:8px;border:1px solid #dfe5e0;border-radius:11px;background:#fff;color:#737e70;box-shadow:0 5px 16px #263d5a18;font-size:17px;line-height:1}.float-pause:hover{background:#f4f7f1}.float-pause.paused{background:#fff8ec;border-color:#e6c98f;color:#9a6a25}.bar{box-shadow:0 3px 12px #28302212;border-color:#e4e7df;font-size:12px}.bar button{padding:5px 9px;color:#707a66}.bar-more{display:flex}.toast{background:#f4f6f0;color:#68735e;border:1px solid #e4e7df;box-shadow:none;font-size:12px;padding:7px 12px}.empty{font-size:12px;color:#a2a79a;padding:40px 0}.plain:hover{background:#f2f4ed}`;
  shadow.append(quietStyle);
  bar.innerHTML =
    '<button data-action="save">存入札记</button><button data-action="write">写想法</button><button id="selection-more" aria-label="更多划线操作" aria-expanded="false">···</button><span class="bar-more" hidden><button data-action="content">内容灵感</button><button data-action="product">产品灵感</button></span>';
  $("#selection-more").onclick = () => {
    const more = $(".bar-more");
    more.hidden = !more.hidden;
    $("#selection-more").setAttribute("aria-expanded", String(!more.hidden));
    const rect = bar.getBoundingClientRect();
    position(bar, { left: rect.left, top: rect.bottom + 9 });
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      bar.hidden = true;
      if (!panel.hidden && !composer.hidden) return;
      if (!panel.hidden) setPanel(false);
    }
  });
  document.addEventListener("scroll", () => (bar.hidden = true), {
    passive: true,
  });
  window.addEventListener("resize", () => {
    bar.hidden = true;
    layoutPanel();
  });
  async function preferences() {
    try {
    const s = await GleanStore.settings();
    preferredWidth = Math.max(240, Math.min(480, Number(s.panelWidth) || 300));
    $(".float-tools").hidden = !s.floating || !panel.hidden;
    layoutPanel();
    } catch {
      toast("札记连接已失效，请先复制尚未保存的想法，再刷新当前阅读网页。");
    }
  }
  GleanStore.subscribe(async () => {
    await refresh();
    await preferences();
  });
  if (GleanStore.ext)
    chrome.runtime.onMessage.addListener((m, _s, reply) => {
      if (m.action === "frameSelection") {
        if (typeof m.quote === "string" && m.quote.trim() && m.quote.length <= 30000)
          acceptSelection({quote:m.quote,context:m.quote,title:document.title,url:pageUrl(),prefix:"",suffix:""});
        reply({ok:true});
      }
      if (m.action === "togglePanel") {
        setPanel(panel.hidden);
        reply({ ok: true });
      }
      if (m.action === "togglePause") {
        setPaused(!paused);
        bar.hidden = true;
        if (paused) setPanel(false);
        else renderPanel();
        toast(paused ? "本页已暂停札记；再次点击扩展图标可恢复" : "本页已恢复札记");
        reply({ ok: true, paused });
      }
      if (m.action === "getPauseState") {
        reply({ ok: true, paused });
      }
      if (m.action === "newNote") {
        openComposer();
        reply({ ok: true });
      }
    });
  panel.addEventListener("pointerdown", () => { bar.hidden = true; });
  setInterval(async () => {
    if (location.href !== lastUrl) {
      if (!(await flushAll())) return;
      lastUrl = location.href;
      bar.hidden = true;
      expanded = null;
      draftRecord = null;
      refresh();
    }
  }, 1000);
  host.addEventListener("glean-dispose", () => { restoreReadingLayout(); globalThis.__gleanReaderActive = false; });
  async function recoverDrafts() {
    if (!recovered.length) return;
    const existing = await GleanStore.list();
    for (const item of recovered) {
      if (existing.some(r => r.id === item.id)) await GleanStore.patch(item.id, {thought:item.thought});
      else await GleanStore.save(Glean.record({...item,url:pageUrl(),title:document.title}));
    }
  }
  Promise.resolve(globalThis.GleanPreviewReady).then(recoverDrafts).then(preferences)
    .then(refresh)
    .then(() => {
      if (new URLSearchParams(location.search).get("panel") === "1")
        setPanel(true);
    }).catch(() => toast("札记连接异常，请保留尚未保存的文字并刷新当前网页。"));
  window.addEventListener("beforeunload", (e) => {
    if (drafts.size) {
      flushAll();
      e.preventDefault();
      e.returnValue = "";
    }
  });
})();
