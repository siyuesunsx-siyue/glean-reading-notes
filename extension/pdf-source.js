(() => {
  const source = new URLSearchParams(location.search).get("source");
  if (source && /^(https?:|file:)\/\//i.test(source)) globalThis.GleanReadingSource = source;
})();
