// Preview-only fixtures; never add examples to installed extension storage.
globalThis.GleanPreviewReady = (async () => {
  if (!GleanStore.demo) return;
  const url = Glean.canonical(location.href);
  if ((await GleanStore.list()).some((r) => r.url === url)) return;
  const samples = [
    [
      "深度阅读的价值，正在于它让我们有机会从喧嚣中抽离，进入一个更慢、更专注的空间。",
      "先把注意力留在这篇文章里，不急着整理。",
    ],
    [
      "收藏只是开始，真正的收获发生在使用的时候。",
      "这让我想到：收藏之后，还需要一次重新遇见。",
    ],
    ["记录自己为什么被一句话打动，比收集这句话更重要。", ""],
  ];
  for (const [quote, thought] of samples) {
    await GleanStore.save(
      Glean.record({
        quote,
        thought,
        url,
        title: document.title,
        context: quote,
      }),
    );
  }
})();
