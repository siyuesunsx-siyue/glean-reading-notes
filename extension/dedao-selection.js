// Dedao renders selection with EasyMarker instead of window.getSelection().
// Runs only on Dedao in MAIN world to read the visible Vue reader instance.
(() => {
  if (window.__gleanDedaoBridge) return;
  window.__gleanDedaoBridge = true;
  let timer, last = "", suppressUntil = 0;
  const ebookMarkers = new Set(), hooked = new WeakSet();
  function remember(em) {
    if (em?.menu && typeof em.getSelectText === "function") ebookMarkers.add(em);
    return em;
  }
  function hookReader(vm) {
    if (hooked.has(vm) || typeof vm.initEasymarker !== "function") return;
    hooked.add(vm);
    const init = vm.initEasymarker;
    vm.initEasymarker = function (...args) {
      return remember(Reflect.apply(init, this, args));
    };
    // The reader also passes existing chapter engines here after pagination.
    if (typeof vm.renderEasymarkerNote === "function") {
      const render = vm.renderEasymarkerNote;
      vm.renderEasymarkerNote = function (em, ...args) {
        remember(em);
        return Reflect.apply(render, this, [em, ...args]);
      };
    }
  }
  function markers() {
    const seen = new Set(), found = [];
    function visit(vm) {
      if (!vm || seen.has(vm) || seen.size > 1500) return;
      seen.add(vm);
      hookReader(vm);
      if (vm.em?.menu && typeof vm.em.getSelectText === "function") found.push(vm.em);
      visit(vm.$parent);
      for (const child of vm.$children || []) visit(child);
    }
    const candidates = [...document.querySelectorAll('[data-text-node]')];
    // Different Dedao reader versions do not all expose data-text-node.
    // Fall back to Vue roots so the same EasyMarker instance can be found.
    candidates.push(...Array.from(document.querySelectorAll('*')).filter(el => el.__vue__));
    for (const node of candidates) {
      let el = node;
      while (el) { if (el.__vue__) { visit(el.__vue__); break; } el = el.parentElement; }
      if (found.length > 3) break;
    }
    if (document.body?.__vue__) visit(document.body.__vue__);
    for (const em of ebookMarkers) {
      if (em.container?.isConnected) found.push(em);
      else ebookMarkers.delete(em);
    }
    return [...new Set(found)];
  }
  function read() {
    if (Date.now() < suppressUntil) return;
    try {
      for (const em of markers()) {
        if (!em.container?.isConnected || !em.menu?.isShow) continue;
        const quote = em.getSelectText()?.trim();
        if (!quote || quote.length > 30000) continue;
        const key = location.href + '\n' + quote;
        if (key === last) return;
        last = key;
        window.postMessage({channel:"glean-dedao-selection",quote,url:location.href},location.origin);
      }
    } catch { /* Reader may unmount while navigating between chapters. */ }
  }
  // Attach while asynchronous book data is loading, before chapter engines exist.
  markers();
  setInterval(markers, 500);
  window.addEventListener("message", e => {
    const data = e.data;
    if (
      e.source !== window ||
      e.origin !== location.origin ||
      data?.channel !== "glean-dedao-control" ||
      data.action !== "suppress-selection"
    ) return;
    clearTimeout(timer);
    suppressUntil = Date.now() + 800;
  });
  window.addEventListener("pointerdown", e => {
    if (e.composedPath().some(n => n?.tagName === "GLEAN-READER")) return;
    if (Date.now() < suppressUntil) return;
    last = "";
  }, true);
  for (const event of ["mouseup","pointerup","touchend"]) window.addEventListener(event,e=>{
    if (e.composedPath().some(n => n?.tagName === "GLEAN-READER")) return;
    clearTimeout(timer); timer = setTimeout(() => {
      read();
      // EasyMarker updates its menu state asynchronously after pointerup.
      setTimeout(read, 180);
      setTimeout(read, 420);
    },80);
  },true);
})();
