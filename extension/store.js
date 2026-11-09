(() => {
  const ext = !!globalThis.chrome?.runtime?.id;
  const demo = !ext && new URLSearchParams(location.search).has("demo");
  const prefix = demo ? "glean-demo:" : "glean:";
  async function all() {
    return ext
      ? chrome.storage.local.get(null)
      : JSON.parse(localStorage.getItem(prefix) || "{}");
  }
  async function set(items) {
    if (ext) await chrome.storage.local.set(items);
    else {
      const data = await all();
      Object.assign(data, items);
      localStorage.setItem(prefix, JSON.stringify(data));
      window.dispatchEvent(new Event("glean-change"));
    }
  }
  const key = (id) => "record:" + id;
  async function list() {
    return Object.entries(await all())
      .filter(([k]) => k.startsWith("record:"))
      .map(([, v]) => v)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async function save(r) {
    const clean = Glean.validateRecord(r);
    await set({ [key(clean.id)]: clean });
    return clean;
  }
  async function patch(id, changes) {
    if (ext)
      return chrome.runtime
        .sendMessage({ action: "patch", id, changes })
        .then((r) => {
          if (r.error) throw Error(r.error);
          return r.record;
        });
    return localPatch(id, changes);
  }
  async function localPatch(id, changes) {
    const r = (await all())[key(id)];
    if (!r) throw Error("这条记录已不存在");
    return save({
      ...r,
      ...changes,
      id,
      createdAt: r.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }
  async function remove(id) {
    if (ext) {
      const record=(await all())[key(id)];
      if(record) await chrome.storage.local.set({['deleted:'+id]:{...record,updatedAt:new Date().toISOString()}});
      await chrome.storage.local.remove(key(id));
    }
    else {
      const data = await all();
      delete data[key(id)];
      localStorage.setItem(prefix, JSON.stringify(data));
      window.dispatchEvent(new Event("glean-change"));
    }
  }
  async function settings() {
    return { ...Glean.defaults, ...(await all()).settings };
  }
  function subscribe(fn) {
    if (ext) {
      const f = (changes, a) => {
        if (a === "local" && Object.keys(changes).some(k=>k.startsWith('record:')||k==='settings')) fn();
      };
      chrome.storage.onChanged.addListener(f);
      return () => chrome.storage.onChanged.removeListener(f);
    }
    window.addEventListener("glean-change", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("glean-change", fn);
      window.removeEventListener("storage", fn);
    };
  }
  async function importRecords(records) {
    if (!Array.isArray(records) || records.length > 20000)
      throw Error("最多导入 20,000 条记录");
    const valid = records.map(Glean.validateRecord);
    const current = await all();
    let count = 0;
    const changes = {};
    for (const r of valid) {
      const old = current[key(r.id)];
      if (!old || r.updatedAt > old.updatedAt) {
        changes[key(r.id)] = r;
        count++;
      }
    }
    await set(changes);
    return count;
  }
  globalThis.GleanStore = {
    ext,
    demo,
    list,
    save,
    patch,
    localPatch,
    remove,
    settings,
    saveSettings: (s) => set({ settings: s }),
    subscribe,
    importRecords,
  };
})();
