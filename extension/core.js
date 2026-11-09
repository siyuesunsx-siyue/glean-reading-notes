(function (root) {
  const types = {
    reading: "阅读收获",
    writing: "写作方法",
    content: "内容选题",
    product: "产品选题",
    business: "非生业务",
    tool: "工具方法",
  };
  const tags = Object.fromEntries(Object.entries(types).filter(([key]) => key !== 'reading'));
  function recordTags(r) {
    return Array.isArray(r?.tags) ? [...new Set(r.tags.filter(t => Object.hasOwn(tags,t)))] : (tags[r?.type] ? [r.type] : []);
  }
  const defaults = {
    contentTime: "08:10",
    productTime: "14:05",
    productDay: "5",
    contentEnabled: true,
    productEnabled: true,
    floating: true,
    contentUrl: "",
    productUrl: "",
    readingUrl: "",
  };
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function safeUrl(value) {
    try {
      const u = new URL(value);
      return ["http:", "https:", "file:"].includes(u.protocol) ||
        (u.protocol === "chrome-extension:" &&
          u.hostname === globalThis.chrome?.runtime?.id)
        ? u.href
        : "";
    } catch {
      return "";
    }
  }
  function canonical(value) {
    const u = new URL(value);
    u.hash = "";
    return u.href;
  }
  function record(input) {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      quote: "",
      thought: "",
      context: "",
      prefix: "",
      suffix: "",
      url: "",
      title: "未命名来源",
      type: "reading",
      status: "unprocessed",
      favorite: false,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
  }
  function validateRecord(r) {
    r = { ...r, status: r?.status || "unprocessed" };
    if (
      !r ||
      typeof r.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(r.id) ||
      !types[r.type]
    )
      throw Error("记录格式不正确");
    for (const k of [
      "quote",
      "thought",
      "context",
      "prefix",
      "suffix",
      "url",
      "title",
      "status",
    ])
      if (typeof r[k] !== "string" || r[k].length > 100000)
        throw Error("记录字段不正确");
    if (!r.quote.trim() && !r.thought.trim()) throw Error("记录没有内容");
    if (r.url && !safeUrl(r.url)) throw Error("来源链接不安全");
    if (
      !Number.isFinite(Date.parse(r.createdAt)) ||
      !Number.isFinite(Date.parse(r.updatedAt))
    )
      throw Error("记录时间不正确");
    return {
      id: r.id,
      quote: r.quote,
      thought: r.thought,
      context: r.context,
      prefix: r.prefix,
      suffix: r.suffix,
      url: r.url,
      title: r.title,
      type: r.type,
      tags: recordTags(r),
      status: ["converted", "archived"].includes(r.status) ? r.status : "unprocessed",
      favorite: !!r.favorite,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
  function tokens(query) {
    const cleaned = query
      .toLowerCase()
      .replace(
        /我读过哪些|有没有|帮我找|关于|的方法|的记录|相关|哪些|什么|请|查找|搜索/g,
        " ",
      )
      .trim();
    const words = cleaned.match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) || [];
    return [
      ...new Set(
        words.flatMap((w) =>
          w.length > 2 && /[\u4e00-\u9fff]/.test(w)
            ? [
                w,
                ...Array.from({ length: w.length - 1 }, (_, i) =>
                  w.slice(i, i + 2),
                ),
              ]
            : [w],
        ),
      ),
    ];
  }
  function search(records, query, filters = {}) {
    const terms = tokens(query);
    return records
      .filter(
        (r) =>
          (!filters.type || (filters.type === "reading" ? !recordTags(r).length : recordTags(r).includes(filters.type))) &&
          (!filters.source || r.title === filters.source) &&
          (!filters.days ||
            Date.parse(r.createdAt) >= Date.now() - filters.days * 86400000) &&
          (!filters.favorite || r.favorite) &&
          (!filters.status || r.status === filters.status),
      )
      .map((r) => ({
        r,
        score: terms.reduce(
          (sum, t) =>
            sum +
            ([r.quote, r.thought, r.title, ...recordTags(r).map(t => tags[t])]
              .join(" ")
              .toLowerCase()
              .includes(t)
              ? t.length
              : 0),
          0,
        ),
      }))
      .filter((x) => !terms.length || x.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || b.r.createdAt.localeCompare(a.r.createdAt),
      )
      .map((x) => x.r);
  }
  function date(value, short = false) {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: short ? undefined : "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: short ? undefined : "2-digit",
      minute: short ? undefined : "2-digit",
      hour12: false,
    }).format(new Date(value));
  }
  function markdown(records) {
    return (
      "# 札记 / Glean\n\n" +
      records
        .map(
          (r) =>
            `## ${r.thought?.split("\n")[0].slice(0, 60) || r.quote.slice(0, 60)}\n\n${r.quote
              .split("\n")
              .map((x) => "> " + x)
              .join(
                "\n",
              )}\n\n${r.thought || "（尚未补充想法）"}\n\n- 标签：${recordTags(r).map(t => tags[t]).join("、") || "未标注"}\n- 来源：${r.title}\n- 链接：${r.url}\n- 记录时间：${date(r.createdAt)}（北京时间）\n\n### 上下文\n${r.context}\n`,
        )
        .join("\n---\n\n")
    );
  }
  function anchorUrl(r) {
    const url = safeUrl(r.url);
    if (!url) return "";
    const u = new URL(url);
    if (r.quote)
      u.hash = ":~:text=" + encodeURIComponent(r.quote).replace(/-/g, "%2D");
    return u.href;
  }
  root.Glean = {
    types,
    tags,
    recordTags,
    defaults,
    esc,
    safeUrl,
    canonical,
    record,
    validateRecord,
    search,
    date,
    markdown,
    anchorUrl,
  };
  if (typeof module !== "undefined") module.exports = root.Glean;
})(globalThis);
