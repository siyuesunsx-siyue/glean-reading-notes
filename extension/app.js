const { esc: E, types: T } = Glean;
const icons = {
  book: "M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4z M12 6v16",
  note: "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  star: "m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z",
  clock: "M12 7v5l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  settings:
    "M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  link: "m9 15 6-6 M8 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 7l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0",
  edit: "m4 16 12-12 4 4L8 20H4z M14 6l4 4",
  arrow: "M14 5h6v6 M20 5 10 15 M11 5H4v15h15v-7",
  plus: "M12 5v14 M5 12h14",
  download: "M12 3v12 m-4-4 4 4 4-4 M4 16v5h16v-5",
  bulb: "M8 17c0-4-4-4-4-9a8 8 0 0 1 16 0c0 5-4 5-4 9z M9 21h6",
  check: "m5 12 4 4L20 5",
  back: "m14 5-7 7 7 7",
  close: "m5 5 14 14 M19 5 5 19",
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name] || icons.note}"/></svg>`;
const app = document.querySelector("#app");
let records = [],
  settings = {},
  view = location.hash.slice(1) || "library",
  selected = null,
  query = "",
  filters = {},
  showDetail = false;
let toastTimer;
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3200);
}
function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function nav(id, label, ico, count = "") {
  return `<button class="nav-item ${view === id ? "active" : ""}" data-view="${id}">${icon(ico)}${label}${count !== "" ? `<span class="count">${count}</span>` : ""}</button>`;
}
function visible() {
  return Glean.search(records, query, {
    ...filters,
    favorite: view === "favorites",
    status: view === "unprocessed" ? "unprocessed" : "",
  });
}
function recordTitle(r) {
  return (r.quote || r.thought).split("\n")[0].slice(0, 85);
}
function shell() {
  app.innerHTML = `${GleanStore.demo ? '<div class="demo-banner">设计预览 · 当前为示例记录，与插件中的真实阅读记录分开保存</div>' : ""}<header class="topbar"><a class="brand" href="#library"><span class="brand-mark">札</span><span>札记 <small>/ Glean</small></span></a><nav class="topnav"><button data-view="library" class="${["library", "favorites", "unprocessed"].includes(view) ? "active" : ""}">我的收获</button><button data-view="content" class="${view === "content" ? "active" : ""}">内容选题</button><button data-view="product" class="${view === "product" ? "active" : ""}">产品选题</button></nav><div class="top-actions"><span class="local-label"><span class="dot"></span>保存在此浏览器</span><button class="primary with-icon" id="new-note">${icon("plus")}记灵感</button></div></header><div class="workspace"><aside class="sidebar"><div class="label">我的阅读空间</div>${nav("library", "全部收获", "book", records.length)}${nav("favorites", "我的收藏", "star", records.filter((r) => r.favorite).length)}${nav("unprocessed", "未处理", "clock", records.filter((r) => r.status === "unprocessed").length)}${nav("content", "内容选题", "note")}${nav("product", "产品选题", "bulb")}<div class="side-bottom"></div>${nav("settings", "设置", "settings")}</aside><main class="main" id="main"></main></div>`;
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => navigate(b.dataset.view)));
  document.querySelector("#new-note").onclick = () => editDialog();
  renderView();
}
function navigate(v) {
  view = v;
  query = "";
  filters = {};
  showDetail = false;
  location.hash = v;
  shell();
}
window.addEventListener("hashchange", () => {
  const v = location.hash.slice(1) || "library";
  if (v !== view) {
    view = v;
    shell();
  }
});
function renderView() {
  if (view === "settings") return renderSettings();
  if (["content", "product"].includes(view)) return renderSummary();
  renderLibrary();
}
function renderLibrary() {
  const title =
    { library: "收获库", favorites: "我的收藏", unprocessed: "未处理" }[view] ||
    "收获库";
  document.querySelector("#main").innerHTML =
    `<div class="page-head"><div class="head-line"><div><h1>${title}</h1><div class="muted">把读过的，慢慢变成自己的。</div></div><button class="with-icon" id="export">${icon("download")}导出</button></div><div class="search-row"><label class="search">${icon("search")}<input id="search" type="search" aria-label="搜索阅读收获" placeholder="找一句话、一个想法，或试试「文章开头的方法」" value="${E(query)}"></label></div><div class="filters"><select id="type" aria-label="标签筛选"><option value="">所有标签</option>${Object.entries(
      T,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${filters.type === k ? "selected" : ""}>${v}</option>`,
      )
      .join(
        "",
      )}</select><select id="source" aria-label="来源"><option value="">所有来源</option>${[...new Set(records.map((r) => r.title))].map((x) => `<option ${filters.source === x ? "selected" : ""}>${E(x)}</option>`).join("")}</select><select id="days" aria-label="记录日期"><option value="">全部时间</option><option value="7">最近 7 天</option><option value="30">最近 30 天</option><option value="365">最近一年</option></select><button class="plain" id="reset">重置筛选</button></div></div><div class="collection ${showDetail ? "show-detail" : ""}"><section class="record-list" aria-label="阅读记录"></section><section class="detail" aria-label="记录详情"></section></div>`;
  document.querySelector("#search").oninput = (e) => {
    query = e.target.value;
    drawList();
  };
  ["type", "source", "days"].forEach((k) => {
    document.querySelector("#" + k).value = filters[k] || "";
    document.querySelector("#" + k).onchange = (e) => {
      filters[k] = e.target.value;
      drawList();
    };
  });
  document.querySelector("#reset").onclick = () => {
    filters = {};
    query = "";
    renderLibrary();
  };
  document.querySelector("#export").onclick = exportDialog;
  drawList();
}
function drawList() {
  const list = visible();
  if (!list.some((r) => r.id === selected)) selected = list[0]?.id;
  document.querySelector(".record-list").innerHTML =
    `<div class="list-caption"><span>${query ? "找到" : "共"} ${list.length} 条记录</span><span>${query ? "本地关键词匹配" : "按记录时间排序"}</span></div>` +
    (list.length
      ? list
          .map(
            (r) =>
              `<button class="record-row ${r.id === selected ? "selected" : ""}" data-id="${E(r.id)}"><span class="record-icon">${icon(r.type === "product" ? "bulb" : r.type === "writing" ? "book" : "note")}</span><span class="record-body"><span class="record-title">${E(recordTitle(r))}</span><span class="record-excerpt" style="display:block">${E(r.thought || r.context || "这次触动，留待慢慢展开。")}</span><span class="record-meta">${Glean.recordTags(r).map(t => `<span class="pill ${t}">${Glean.tags[t]}</span>`).join("") || `<span class="pill">阅读收获</span>`}<span>${E(r.title.slice(0, 22))}</span><span>${Glean.date(r.createdAt, true)}</span><span class="pill">${{unprocessed:"未处理",converted:"已转化",archived:"已归档"}[r.status] || "未处理"}</span></span></span></button>`,
          )
          .join("")
      : `<div class="empty-state">${icon("book")}<h2>${records.length ? "还没有找到相关收获" : "从一句触动你的话开始"}</h2><p>${records.length ? "换几个关键词，或试着放宽筛选范围。" : "在网页上选中文字，轻轻保存。<br>不必马上想清楚，也不用每次都写点什么。"}</p><button id="try-reading">打开阅读练习页</button></div>`);
  document.querySelectorAll("[data-id]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.id;
        showDetail = true;
        document.querySelector(".collection").classList.add("show-detail");
        drawList();
      }),
  );
  document
    .querySelector("#try-reading")
    ?.addEventListener("click", () => window.open("reader.html", "_blank"));
  drawDetail();
}
function drawDetail() {
  const r = records.find((r) => r.id === selected),
    el = document.querySelector(".detail");
  if (!r) {
    el.innerHTML =
      '<div class="empty-state">' +
      icon("note") +
      "<h2>为未来的自己留一点线索</h2><p>选中一条记录，找回原文与当时的想法。</p></div>";
    return;
  }
  el.innerHTML = `<div class="detail-top">${Glean.recordTags(r).map(t => `<span class="pill ${t}">${Glean.tags[t]}</span>`).join("") || `<span class="pill">阅读收获</span>`}<span class="muted">${Glean.date(r.createdAt)}</span><button id="favorite" class="icon-button" title="${r.favorite ? "取消收藏" : "收藏记录"}" aria-label="${r.favorite ? "取消收藏" : "收藏记录"}" style="color:${r.favorite ? "#c09a48" : "#99a5b8"}">${icon("star")}</button></div><button class="plain mobile-back" id="back">${icon("back")}返回列表</button><div class="detail-heading"><h2>${E(recordTitle(r))}</h2><button class="plain" id="edit-quote" title="编辑摘录">${icon("edit")}编辑摘录</button></div>${r.quote ? `<blockquote class="quote">${E(r.quote)}</blockquote>` : ""}<div class="section-label">${icon("edit")}我当时的想法<button class="plain" id="edit" style="margin-left:auto">${r.thought ? "编辑" : "补充"}</button></div><div class="thought ${!r.thought ? "empty" : ""}">${E(r.thought || "当时还没来得及写。想起什么时，再补一句。")}</div><div class="section-label">${icon("link")}出处</div><div class="source-link">${E(r.title)}</div><div class="source-url">${E(r.url || "独立灵感 · 无关联原文")}</div><div class="actions">${r.url ? `<a class="with-icon" href="${E(Glean.anchorUrl(r))}" target="_blank" rel="noopener noreferrer">${icon("arrow")}返回原文</a>` : ""}<button class="with-icon" id="context">${icon("note")}查看上下文</button></div><div id="context-area"></div><div class="detail-footer"><span class="muted">${r.later ? "已标记：留待回顾" : "时间均为北京时间"}</span>${r.later ? '<button class="plain" id="clear-later">移除标记</button>' : ""}<button class="plain danger" id="delete">删除</button></div>`;
  const statusBox = document.createElement("label");
  statusBox.className = "status-editor";
  statusBox.textContent = "处理状态 ";
  statusBox.innerHTML += `<select aria-label="处理状态"><option value="unprocessed">未处理</option><option value="converted">已转化</option><option value="archived">已归档</option></select>`;
  statusBox.querySelector("select").value = r.status || "unprocessed";
  statusBox.querySelector("select").onchange = async e => { try { await GleanStore.patch(r.id, {status:e.target.value}); await refresh(); } catch (err) { toast(err.message); } };
  document.querySelector(".detail-top")?.after(statusBox);
  document.querySelector("#edit-quote").onclick = () => quoteDialog(r);
  document.querySelector("#favorite").onclick = async () => {
    try {
      await GleanStore.patch(r.id, { favorite: !r.favorite });
      await refresh();
    } catch (e) {
      toast("保存失败：" + e.message);
    }
  };
  document.querySelector("#edit").onclick = () => editDialog(r);
  document.querySelector("#back").onclick = () => {
    showDetail = false;
    document.querySelector(".collection").classList.remove("show-detail");
  };
  document.querySelector("#context").onclick = () => {
    const box = document.querySelector("#context-area");
    box.innerHTML = box.innerHTML
      ? ""
      : `<div class="context-box">${E(r.context || "这条记录没有保存上下文。你仍可以返回来源页面查看。")}</div>`;
  };
  document
    .querySelector("#clear-later")
    ?.addEventListener("click", async () => {
      try {
        await GleanStore.patch(r.id, { later: "" });
        await refresh();
      } catch (e) {
        toast(e.message);
      }
    });
  document.querySelector("#delete").onclick = () => deleteDialog(r);
}
function dialog(html) {
  const wrap = document.createElement("div");
  wrap.className = "dialog-backdrop";
  wrap.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${html}</section>`;
  document.body.append(wrap);
  const prior = document.activeElement;
  const close = (force = false) => {
    const draft = wrap.querySelector("textarea");
    if (!force && draft && draft.value !== draft.defaultValue) {
      toast("想法尚未保存，请先保存；恢复原内容后可取消");
      return;
    }
    wrap.remove();
    prior?.focus();
  };
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap || e.target.closest("[data-close]")) close();
  });
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const f = [
        ...wrap.querySelectorAll("button,input,select,textarea,a[href]"),
      ].filter((e) => !e.disabled);
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });
  wrap.querySelector("textarea,input,button")?.focus();
  return { wrap, close };
}
function quoteDialog(r) {
  const { wrap, close } = dialog(
    `<h2 id="dialog-title">编辑摘录</h2><p class="muted">修正误选文字或标题中的多余字符。</p><label for="quote">原文摘录</label><textarea id="quote" placeholder="这句话触动了你……">${E(r.quote || "")}</textarea><div class="actions"><button data-close>取消</button><button class="primary" id="save-quote">保存摘录</button></div>`,
  );
  wrap.querySelector("#save-quote").onclick = async (e) => {
    const quote = wrap.querySelector("#quote").value.trim();
    if (!quote && !r.thought) return toast("摘录和想法至少保留一项");
    e.target.disabled = true;
    try {
      await GleanStore.patch(r.id, { quote });
      close(true);
      await refresh();
      toast("摘录已更新");
    } catch (err) {
      toast("保存失败：" + err.message);
      e.target.disabled = false;
    }
  };
}
function editDialog(r) {
  const { wrap, close } = dialog(
    `<h2 id="dialog-title">${r ? "留住当时的想法" : "记下一点灵感"}</h2><p class="muted">一句话也好，暂时还不完整也好。</p>${r?.quote ? `<blockquote class="quote">${E(r.quote)}</blockquote>` : ""}<label for="thought">我的想法</label><textarea id="thought" placeholder="这让我想到……">${E(r?.thought || "")}</textarea><div class="section-label">标签（可多选）</div><div class="edit-tags">${Object.entries(Glean.tags).map(([tag,label]) => `<label><input type="checkbox" name="note-tag" value="${tag}" ${Glean.recordTags(r).includes(tag) ? "checked" : ""}> ${label}</label>`).join("")}</div><div class="actions"><button data-close>取消</button><button class="primary" id="save-note">保存想法</button></div>`,
  );
  wrap.querySelector("#save-note").onclick = async (e) => {
    const thought = wrap.querySelector("#thought").value.trim();
    if (!thought && !r?.quote) return toast("独立灵感需要写下一点内容");
    e.target.disabled = true;
    try {
      if (r)
        await GleanStore.patch(r.id, {
          thought,
          tags: [...wrap.querySelectorAll('[name="note-tag"]:checked')].map(el => el.value),
        });
      else
        await GleanStore.save(
          Glean.record({
            thought,
            tags: [...wrap.querySelectorAll('[name="note-tag"]:checked')].map(el => el.value),
            title: "随手灵感",
          }),
        );
      close(true);
      await refresh();
      toast("已保存，留给未来的自己");
    } catch (err) {
      toast("保存失败：" + err.message);
      e.target.disabled = false;
    }
  };
}
function deleteDialog(r) {
  const { wrap, close } = dialog(
    `<h2 id="dialog-title">删除这条记录？</h2><p class="muted">原文摘录和想法将一起删除。本次操作后可以撤销。</p><div class="actions"><button data-close>保留</button><button id="confirm-delete" class="danger">删除记录</button></div>`,
  );
  wrap.querySelector("#confirm-delete").onclick = async () => {
    try {
      await GleanStore.remove(r.id);
      close();
      await refresh();
      const undo = document.createElement("button");
      undo.textContent = "撤销删除";
      undo.className = "primary";
      undo.style.cssText = "position:fixed;bottom:28px;right:28px;z-index:20";
      document.body.append(undo);
      undo.onclick = async () => {
        try {
          await GleanStore.save(r);
          undo.remove();
          await refresh();
        } catch (e) {
          toast(e.message);
        }
      };
      setTimeout(() => undo.remove(), 12000);
    } catch (e) {
      toast("删除失败：" + e.message);
    }
  };
}
function exportDialog() {
  const { wrap, close } = dialog(
    `<h2 id="dialog-title">带走你的阅读收获</h2><p class="muted">导出当前筛选的 ${visible().length} 条记录。JSON 可用于迁移和恢复；Markdown 适合阅读或粘贴到飞书。</p><div class="actions"><button id="export-json">JSON 备份</button><button class="primary" id="export-md">Markdown</button><button data-close>取消</button></div>`,
  );
  wrap.querySelector("#export-json").onclick = () => {
    download(
      "glean-records.json",
      JSON.stringify({ version: 1, records: visible() }, null, 2),
      "application/json",
    );
    close();
  };
  wrap.querySelector("#export-md").onclick = () => {
    download(
      "札记-阅读收获.md",
      Glean.markdown(visible()),
      "text/markdown;charset=utf-8",
    );
    close();
  };
}
function renderSummary() {
  const product = view === "product",
    kind = product ? "product" : "content",
    items = records.filter((r) => Glean.recordTags(r).includes(kind) && r.status === "unprocessed"),
    url = settings[product ? "productUrl" : "contentUrl"];
  document.querySelector("#main").innerHTML =
    `<div class="settings"><div class="head-line"><div><h1>${product ? "产品选题" : "内容选题"}</h1><p class="muted">${product ? "把可能性留在这里，先推进哪一个，由你决定。" : "灵感可以慢慢长大，不必当天读、当天用。"}</p></div><button id="summary-export" class="with-icon">${icon("download")}导出汇总</button></div><div class="notice">${product ? "每周五" : "每日"} · 北京时间 ${E(settings[product ? "productTime" : "contentTime"])}　查看选题文档，明确或安排下一步行动。<br>飞书提醒尚未接入；这里显示的是已保存的提醒偏好。${url ? ` <a href="${E(url)}" target="_blank" rel="noopener noreferrer">打开汇总文档 ↗</a>` : ""}</div><div class="summary-list">${items.length ? items.map((r) => `<article class="summary-card"><span class="muted">${Glean.date(r.createdAt)} · ${E(r.title)}</span><h3>${E(recordTitle(r))}</h3><p>${E(r.thought || r.quote)}</p><button data-record="${r.id}">查看记录与上下文 →</button></article>`).join("") : `<div class="empty-state">${icon(product ? "bulb" : "note")}<h2>给下一个想法留个位置</h2><p>阅读时标记${product ? "产品" : "内容"}灵感，或者点右上角「记灵感」。<br>现有 OB 定时任务尚未接入，不会显示为已经同步。</p></div>`}</div></div>`;
  document.querySelector("#summary-export").onclick = () =>
    download(
      `札记-${product ? "产品选题" : "内容选题"}.md`,
      Glean.markdown(items),
      "text/markdown;charset=utf-8",
    );
  document.querySelectorAll("[data-record]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.record;
        navigate("library");
      }),
  );
}
function renderSettings() {
  document.querySelector("#main").innerHTML =
    `<form class="settings" id="settings-form"><h1>设置</h1><p class="muted">让收获各有归处，让阅读轻松一些。</p><section class="panel"><h2>飞书存放位置</h2><p class="muted">沿用你的知识库。填写文档链接，方便回看与后续接入。</p>${[
      [
        "content",
        "内容选题",
        "小红书 / 内容灵感 · 每日内容选题汇总",
        "note",
        "",
      ],
      [
        "product",
        "产品选题",
        "和AI一起 / 产品选题 · 每周产品选题汇总",
        "bulb",
        "green",
      ],
      [
        "reading",
        "阅读与方法",
        "阅读与方法 / 阅读收获 · 写作与方法",
        "book",
        "purple",
      ],
    ]
      .map(
        ([k, t, d, i, c]) =>
          `<div class="setting-row"><span class="setting-icon ${c}">${icon(i)}</span><div class="setting-copy"><strong>${t}</strong><p>${d}</p></div><input aria-label="${t}文档链接" name="${k}Url" type="url" placeholder="粘贴飞书文档链接（可稍后填写）" value="${E(settings[k + "Url"])}"></div>`,
      )
      .join(
        "",
      )}</section><section class="panel"><h2>连接与同步</h2><div id="feishu-sync-status" class="notice">正在检查同步状态…</div><div class="actions"><button type="button" id="feishu-sync-now">立即同步</button><a href="https://ucno4b5cca2z.feishu.cn/wiki/NqQjwvm0cipPp8kfS9RcpoyFnPg?table=tblguPbOvJXCkZkV&view=vewcdYCGAs" target="_blank" rel="noopener noreferrer">打开飞书阅读库 ↗</a></div><p class="muted">本机记录自动保存到飞书。请在札记中编辑记录；飞书中的修改暂不回传。公司电脑、汇总文档与日程提醒尚未接通。</p></section><section class="panel"><h2>提醒规则</h2><p class="muted">提醒你阅读对应文档，明确或安排下一步行动。</p><div class="setting-row"><span class="setting-icon">${icon("clock")}</span><div class="setting-copy"><strong>每日内容选题</strong><p>每天（含周末）· 北京时间</p></div><input name="contentTime" aria-label="每日提醒时间" type="time" required value="${E(settings.contentTime)}"><input class="switch" type="checkbox" role="switch" aria-label="每日内容提醒" name="contentEnabled" ${settings.contentEnabled ? "checked" : ""}></div><div class="setting-row"><span class="setting-icon purple">${icon("bulb")}</span><div class="setting-copy"><strong>每周产品选题汇总</strong><p>由你选择先推进哪个灵感 · 北京时间</p></div><select name="productDay" aria-label="每周提醒星期">${["日", "一", "二", "三", "四", "五", "六"].map((v, k) => `<option value="${k}" ${String(k) === settings.productDay ? "selected" : ""}>周${v}</option>`).join("")}</select><input name="productTime" aria-label="每周提醒时间" type="time" required value="${E(settings.productTime)}"><input class="switch" type="checkbox" role="switch" aria-label="每周产品提醒" name="productEnabled" ${settings.productEnabled ? "checked" : ""}></div><div class="notice">以上开关仅保存提醒偏好，尚未在飞书创建日程。</div></section><section class="panel"><h2>阅读偏好与数据</h2><div class="setting-row"><div class="setting-copy"><strong>网页上的阅读侧栏入口</strong><p>关闭后，仍可从浏览器插件图标打开本篇记录。</p></div><input class="switch" type="checkbox" role="switch" aria-label="显示阅读侧栏入口" name="floating" ${settings.floating ? "checked" : ""}></div><div class="setting-row"><div class="setting-copy"><strong>备份与迁移</strong><p>导入 JSON 时，同一条记录保留较新的版本。</p></div><button type="button" id="backup">导出备份</button><button type="button" id="import">导入 JSON</button><input id="import-file" type="file" accept=".json,application/json" hidden></div></section><div class="settings-foot"><span class="muted" id="save-state">修改后点击保存，仅在此浏览器生效。</span><button class="primary" type="submit">保存设置</button></div></form>`;
  void renderSyncStatus();
  document.querySelector('#feishu-sync-now').onclick = async e => {
    if(!GleanStore.ext) return;
    e.target.disabled=true;
    await chrome.runtime.sendMessage({action:'feishuSyncNow'});
    await renderSyncStatus();
    e.target.disabled=false;
  };
  const form = document.querySelector("#settings-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(form),
      next = { ...settings };
    for (const k of [
      "contentTime",
      "productTime",
      "productDay",
      "contentUrl",
      "productUrl",
      "readingUrl",
    ])
      next[k] = String(data.get(k) || "").trim();
    for (const k of ["contentEnabled", "productEnabled", "floating"])
      next[k] = data.has(k);
    for (const k of ["contentUrl", "productUrl", "readingUrl"])
      if (next[k] && !/^https:\/\//.test(Glean.safeUrl(next[k])))
        return toast("文档链接请使用有效的 HTTPS 地址");
    try {
      await GleanStore.saveSettings(next);
      settings = next;
      document.querySelector("#save-state").textContent = "已保存到此浏览器";
      toast("设置已保存");
    } catch (err) {
      toast("保存失败：" + err.message);
    }
  };
  document.querySelector("#backup").onclick = () =>
    download(
      "glean-backup.json",
      JSON.stringify({ version: 1, records }, null, 2),
      "application/json",
    );
  document.querySelector("#import").onclick = () =>
    document.querySelector("#import-file").click();
  document.querySelector("#import-file").onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 30e6) throw Error("文件超过 30 MB");
      const data = JSON.parse(await file.text());
      if (data.version !== 1) throw Error("不支持的备份版本");
      const n = await GleanStore.importRecords(data.records);
      records = await GleanStore.list();
      toast(`已导入或更新 ${n} 条记录`);
    } catch (err) {
      toast("导入失败：" + err.message);
    }
    e.target.value = "";
  };
}
async function refresh() {
  records = await GleanStore.list();
  if (view !== "settings") shell();
}
async function init() {
  settings = await GleanStore.settings();
  records = await GleanStore.list();
  if (GleanStore.demo && !records.length) {
    const samples = [
      [
        "好文章的开头，往往从一个具体的场景开始",
        "以前我总是习惯在开头直接说明主题。下次试着从一个具体的生活场景切入，比如清晨跑步时突然想到的问题。",
        "写作练习 · 从场景开始",
        "writing",
      ],
      [
        "收藏只是开始，真正的收获发生在使用的时候。",
        "可以讲一期：为什么我收藏了很多文章，却越来越少打开？从自己的真实经历说起。",
        "阅读与行动",
        "content",
      ],
      [
        "工具应该接住人的念头，而不是要求人先学会整理。",
        "做一个阅读插件：划线就保存，想法晚点写。每周把产品选题整理给我看。",
        "设计日常",
        "product",
      ],
      [
        "保持好奇，也给一个问题留出足够长的时间。",
        "",
        "深度阅读：在信息洪流中找回思考的力量",
        "reading",
      ],
      [
        "记录自己为什么被一句话打动，比收集这句话更重要。",
        "保存的不是一句漂亮的话，而是当时自己的一个变化。",
        "我的阅读笔记",
        "reading",
      ],
    ];
    for (let i = 0; i < samples.length; i++) {
      const [quote, thought, title, type] = samples[i];
      const r = Glean.record({
        quote,
        thought,
        title,
        type,
        url: new URL("reader.html", location.href).href,
        context:
          "我们常常以为，保存就是拥有。\n\n" +
          quote +
          "\n\n阅读中的联想，需要一个可以随时回到的地方。",
        later: i === 4 ? "thought" : "",
        favorite: i === 0,
      });
      r.createdAt = new Date(Date.now() - i * 86400000).toISOString();
      await GleanStore.save(r);
    }
    records = await GleanStore.list();
  }
  shell();
  GleanStore.subscribe(async () => {
    records = await GleanStore.list();
    if (!document.querySelector(".dialog-backdrop") && view !== "settings") {
      if (document.activeElement?.id === "search") drawList();
      else shell();
    }
  });
}
init().catch((e) => {
  app.innerHTML =
    '<div class="empty-state"><h1>暂时无法读取记录</h1><p>' +
    E(e.message) +
    "</p><p>请检查浏览器存储是否可用，然后重新打开。</p></div>";
});

async function renderSyncStatus() {
  const el=document.querySelector('#feishu-sync-status');
  if(!el)return;
  if(!GleanStore.ext){el.textContent='网页预览不连接飞书；请在已安装的札记插件中查看同步状态。';document.querySelector('#feishu-sync-now').disabled=true;return;}
  try {
    const s=await chrome.runtime.sendMessage({action:'feishuSyncStatus'});
    el.textContent = !s.configured ? '尚未配置本机同步助手，记录保存在本地。' :
      (s.error || (s.pending ? '待同步 '+s.pending+' 条记录，正在自动处理。' : s.lastSuccess ? '当前记录已同步到飞书。' : '同步助手已配置，等待首次同步。')) +
      (s.lastSuccess ? ' 上次成功：'+Glean.date(s.lastSuccess)+'（北京时间）' : '');
  } catch {el.textContent='无法读取同步状态，请刷新插件后重试。';}
}
if(GleanStore.ext)chrome.storage.onChanged.addListener(changes=>{if(changes.feishuSyncStatus)void renderSyncStatus();});
