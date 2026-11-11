
(() => {
  "use strict";

  const DATA = window.PB_INDEX;
  const grid = document.getElementById("grid");
  const sentinel = document.getElementById("sentinel");
  const loading = document.getElementById("loading");
  const qInput = document.getElementById("q");
  const familySel = document.getElementById("family");
  const sortSel = document.getElementById("sort");
  const serverInput = document.getElementById("server-ids");
  const serverClear = document.getElementById("server-clear");
  const serverMeta = document.getElementById("server-meta");
  const ownedOnlyInput = document.getElementById("owned-only");
  const facetsEl = document.getElementById("facets");
  const fxFacetsEl = document.getElementById("fxfacets");
  const catsEl = document.getElementById("cats");
  const detail = document.getElementById("detail");

  if (!DATA || !Array.isArray(DATA.items)) {
    grid.innerHTML = '<div class="empty"><b>ไม่พบข้อมูล</b>รัน <code>node site/build-items.mjs</code> เพื่อสร้าง <code>site/data/items.js</code></div>';
    return;
  }

  const OWNED_CAT = {
    id: "owned",
    label: "Server Owner",
    desc: "ทุกกระบอกในคลังแสงของเกม (weapons.json) — เสกแล้วยิงได้จริงหลัง respawn 1 ครั้ง · ป้าย “มีแล้ว” = อยู่ในบัญชีคุณ",
  };
  const CATS = [
    { id: "weapons", label: "อาวุธ", desc: "โมเดลอาวุธและอุปกรณ์ในไคลเอนต์ แยกรุ่นตามตระกูล" },
    { id: "cosmetics", label: "เครื่องแต่งตัว", desc: "ชุด หมวก ผม หน้ากาก ถุงมือ และเซ็ตเต็มตัวของตัวละคร" },
    { id: "maps", label: "แผนที่", desc: "แผนที่ที่เล่นได้ รวมฉบับ Classic และ PC3123" },
    { id: "attachments", label: "อุปกรณ์ติดปืน", desc: "โมเดลอุปกรณ์เสริมของอาวุธ แยกตามคีย์ตัวเลข" },
    { id: "textures", label: "เท็กเจอร์", desc: "ชุดเท็กเจอร์ปืนต่อสกิน (diff/norm/ref/spec/emis) — ตั้งชื่อตามปืนต้นฉบับ ใช้อ้างอิงทำ modskin" },
  ];
  const ALL_CATS = [OWNED_CAT, ...CATS];
  const CAT_LABEL = { ...Object.fromEntries(CATS.map((c) => [c.id, c.label])), owned: OWNED_CAT.label };
  const CAT_COLOR = { weapons: "var(--weapons)", cosmetics: "var(--cosmetics)", maps: "var(--maps)", attachments: "var(--attachments)", textures: "var(--textures)", owned: "var(--owned)" };
  const availableCats = () => ALL_CATS;
  const CLASS_TH = {
    Rifle: "ปืนเล็กยาว", SMG: "ปืนกลมือ", Sniper: "ปืนซุ่มยิง", Shotgun: "ปืนลูกซอง",
    Pistol: "ปืนพก", MG: "ปืนกล", Melee: "ระยะประชิด", Throwable: "ระเบิด/ของขวัญ",
    Launcher: "เครื่องยิง", Equipment: "อุปกรณ์", Other: "อื่น ๆ",
  };
  const SLOT_TH = {
    Face: "ใบหน้า", Head: "หัว", Headgear: "หมวก", Hair: "ผม", Gloves: "ถุงมือ",
    Mask: "หน้ากาก", Upper: "เสื้อ", Lower: "กางเกง", Suit: "ชุด", Set: "เซ็ต",
    Back: "หลัง", Accessory: "เครื่องประดับ", Other: "อื่น ๆ",
  };
  const facetText = (v) => {
    if (v === "All") return "ทั้งหมด";
    if (state.cat === "weapons" || state.cat === "owned") return CLASS_TH[v] || v;
    if (state.cat === "cosmetics") return SLOT_TH[v] || v;
    if (state.cat === "maps") return v === "Classic" ? "คลาสสิก" : v === "PC3123" ? "PC3123" : v;
    return v;
  };

  const state = {
    cat: "weapons",
    q: "",
    facet: "All",
    fx: "All",
    family: "All",
    sort: "name",
    open: null,
    serverIds: new Set(),
    ownedIds: new Set(),
    ownedOnly: false,
  };

  const BATCH = 120;
  let filtered = [];
  let rendered = 0;
  let io = null;

  const norm = (s) => String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const esc = (s) => String(s == null ? "" : s);

  /* Paste from PB ESP → SAFETY → COPY ALLOWED (CSV) or just a list of IDs. */
  function parseServerIds(text) {
    const set = new Set();
    for (const m of String(text || "").matchAll(/\b\d{5,8}\b/g)) set.add(Number(m[0]));
    return set;
  }
  function matchesServer(it) {
    return (it.itemIds || []).some((id) => state.serverIds.has(Number(id)));
  }
  function matchesOwned(it) {
    return (it.itemIds || []).some((id) => state.ownedIds.has(Number(id)));
  }
  function serverWeapons() {
    if (!state.serverIds.size) return [];
    return DATA.items.filter((i) =>
      i.cat === "weapons" && matchesServer(i) && i.cls !== "Equipment");
  }
  function ownedWeapons() {
    return serverWeapons().filter(matchesOwned);
  }
  function currentWeaponSet() {
    return state.ownedOnly && state.ownedIds.size
      ? ownedWeapons()
      : serverWeapons();
  }
  function serverWeaponCount() {
    return currentWeaponSet().length;
  }
  function updateServerMeta() {
    if (!serverMeta) return;
    const n = state.serverIds.size;
    const all = serverWeapons().length;
    const own = ownedWeapons().length;
    serverMeta.textContent = n
      ? `คลังแสง: ${n} ID · ${all} รุ่น · คุณมี ${own}`
      : "";
    if (serverClear) serverClear.hidden = !n;
    if (ownedOnlyInput) {
      ownedOnlyInput.disabled = !state.ownedIds.size;
      if (!state.ownedIds.size) {
        ownedOnlyInput.checked = false;
        state.ownedOnly = false;
      } else {
        ownedOnlyInput.checked = state.ownedOnly;
      }
    }
  }

  // Precompute the search haystack once.
  for (const it of DATA.items) {
    it._s = norm([
      it.name, it.official, it.family, it.variant, it.cls, it.slot, it.cat, it.slug, it.id,
      (it.itemIds || []).join(" "),
      (it.tags || []).join(" "), (it.paths || [it.path]).join(" "), it.hash,
    ].join(" "));
    it._sc = it._s.replace(/ /g, "");
  }

  /* ---------------------------------------------------------------- */
  /* artwork                                                          */
  /* ---------------------------------------------------------------- */

  const ART = {
    Rifle: '<path d="M10 36h28l6-8h28l4 8h30v9h-18l-5 7h-13l-4-7h-8l-6 11h-10l-2-11H10z"/><path d="M60 36h12v9H60z"/><rect x="84" y="37" width="5" height="7" rx="1"/><path d="M44 45h7v5h-7z"/>',
    SMG: '<path d="M18 36h26l5-7h20l3 7h34v9H78l-4 7H60l-4-7h-6l-5 10H35l-2-10H18z"/><rect x="50" y="45" width="6" height="6" rx="1"/><path d="M92 37h8v4h-8z"/>',
    Shotgun: '<path d="M8 36h40l5-7h14l3 7h58v9H88l-6 7H69l-4-7H52l-6 10H33l-2-10H8z"/><rect x="76" y="37" width="4" height="6" rx="1"/><path d="M96 36h10v8H96z"/>',
    Sniper: '<path d="M6 37h36l5-7h16l3 7h72v8h-30l-5 7H82l-4-7H62l-6 11H43l-2-11H6z"/><rect x="52" y="24" width="38" height="6" rx="2"/><path d="M70 30v7M86 30v7M58 40h6v5h-6z"/>',
    MG: '<path d="M8 34h34l5-8h20l4 8h34v11H86l-5 7H65l-4-7H52l-7 13H33l-2-13H8z"/><circle cx="96" cy="45" r="9"/><path d="M96 36v18M87 45h18"/><rect x="52" y="45" width="6" height="7" rx="1"/>',
    Pistol: '<path d="M34 32h58l8 8v11h-26l-7 27H49l2-27H34z"/><rect x="52" y="32" width="7" height="8" rx="1"/><path d="M74 40h14v4H74z"/>',
    Melee: '<path d="M20 60 92 12l10 6-58 52z"/><path d="M18 58l14 14"/><path d="M14 66l12 12 10-10-12-12z"/>',
    Throwable: '<path d="M86 30v10M78 40h16l-4 12v22a8 8 0 0 1-8 8H74a8 8 0 0 1-8-8V52l-4-12h16z"/><path d="M72 22h16v8H72z"/><path d="M78 22c0-6 8-8 8-2"/>',
    Launcher: '<path d="M8 38h110v12H96l-5 8H74l-4-8H60l-6 12H42l-2-12H8z"/><circle cx="104" cy="44" r="7"/><rect x="28" y="50" width="9" height="10" rx="2"/>',
    Equipment: '<rect x="34" y="26" width="76" height="44" rx="6"/><path d="M66 34h12v12h12v12H78v12H66V58H54V46h12z"/>',
    Other: '<path d="M22 40h50l12-10h26v14h16v10H96l-10 20H60L48 54H22z"/><circle cx="70" cy="44" r="6"/>',
    Face: '<path d="M28 28h88v30c0 18-14 30-30 34H58c-16-4-30-16-30-34z"/><path d="M48 46h16M88 46h16"/><path d="M64 68h16"/>',
    Head: '<path d="M34 58c0-22 14-36 40-36s40 14 40 36"/><path d="M24 58h100v10H24z"/><path d="M38 68c0 10 6 16 14 16h36c8 0 14-6 14-16"/>',
    Headgear: '<path d="M34 54c0-22 14-38 40-38s40 16 40 38"/><path d="M28 54h96v10H28z"/><path d="M88 64h28v8H88z"/>',
    Hair: '<path d="M32 58c0-26 16-42 38-42s38 16 38 42"/><path d="M32 58c-2 18 4 30 10 36"/><path d="M108 58c2 18-4 30-10 36"/><path d="M46 52c10-10 28-12 40-6"/>',
    Upper: '<path d="M52 24l20 10 20-10 24 14-10 20-12-6v44H50V52l-12 6-10-20z"/>',
    Lower: '<path d="M50 24h52l4 30-6 42H70l-2-34-2 34H44l4-42z"/>',
    Suit: '<path d="M52 22l20 10 20-10 24 14-10 20-12-6v46H50V50l-12 6-10-20z"/><path d="M48 72h56"/>',
    Set: '<path d="M70 18a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M70 38l-28 22 12 12 16-12 16 12 12-12z"/>',
    Gloves: '<path d="M48 42V24a6 6 0 0 1 12 0v16h4V20a6 6 0 0 1 12 0v20h4V26a6 6 0 0 1 12 0v18h4V32a6 6 0 0 1 12 0v24c0 20-12 30-30 30S48 76 48 56z"/>',
    Mask: '<path d="M40 34h60v26c0 18-12 28-30 32-18-4-30-14-30-32z"/><path d="M52 48h12M84 48h12"/><path d="M62 68h16"/>',
    Back: '<path d="M52 26h36a10 10 0 0 1 10 10v46H42V36a10 10 0 0 1 10-10z"/><path d="M58 26v-8h24v8"/><path d="M42 52h56"/>',
    Accessory: '<path d="M70 20l14 14-14 14-14-14z"/><path d="M70 48v44"/><path d="M56 84h28"/>',
    Map: '<path d="M14 28l28-10 28 10 28-10 28 10v58l-28 10-28-10-28 10-28-10z"/><path d="M42 18v58M70 28v58M98 18v58"/><circle cx="70" cy="48" r="9"/><path d="M70 57v16"/>',
    Attachment: '<path d="M20 58h96v14H20z"/><path d="M36 58V46h18v12M72 58V42h20v16"/><circle cx="56" cy="40" r="10"/><path d="M56 30v20M46 40h20"/>',
  };

  function artMarkup(item) {
    const key = item.cat === "maps" ? "Map"
      : item.cat === "attachments" ? "Attachment"
      : item.cat === "cosmetics" ? (item.slot || "Other")
      : (item.cls || "Other");
    const body = ART[key] || ART.Other;
    return `<svg viewBox="0 0 140 96" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${body}</svg>`;
  }

  function escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /**
   * Real client artwork when the dataset has it:
   *  - img.u only          -> standalone PNG, shown with object-fit
   *  - img.u + x/y/w/h     -> one cell cropped out of a sprite sheet
   */
  function imageMarkup(item, boxW, boxH) {
    const im = item && item.img;
    if (!im || !im.u) return null;
    const url = assetUrl(im.u);
    if (!url) return null;
    if (!im.w || !im.h) {
      return `<img class="shot" src="${escAttr(url)}" alt="" referrerpolicy="no-referrer" decoding="async">`;
    }
    const k = Math.min(boxW / im.w, boxH / im.h);
    return `<span class="crop" style="width:${(im.w * k).toFixed(1)}px;height:${(im.h * k).toFixed(1)}px">` +
      `<img src="${escAttr(url)}" alt="" referrerpolicy="no-referrer" decoding="async" style="left:${(-im.x * k).toFixed(1)}px;top:${(-im.y * k).toFixed(1)}px;transform:scale(${k.toFixed(4)})">` +
      `</span>`;
  }

  function visualMarkup(item, boxW, boxH) {
    return imageMarkup(item, boxW, boxH) || artMarkup(item);
  }

  function bindImgFallback(scope, item) {
    if (!scope) return;
    for (const img of scope.querySelectorAll("img")) {
      img.addEventListener(
        "error",
        () => {
          const holder = img.closest(".thumb, .sheet-art");
          if (!holder) return;
          holder.classList.remove("has-img");
          holder.innerHTML = artMarkup(item);
        },
        { once: true },
      );
    }
  }

  /* ---------------------------------------------------------------- */
  /* state + url                                                      */
  /* ---------------------------------------------------------------- */

  function readHash() {
    const h = location.hash.replace(/^#/, "");
    if (!h) return;
    const p = new URLSearchParams(h);
    if (p.get("c") && CAT_LABEL[p.get("c")]) state.cat = p.get("c");
    if (p.get("q")) state.q = p.get("q");
    if (p.get("facet")) state.facet = p.get("facet");
    if (p.get("fx")) state.fx = p.get("fx");
    if (p.get("family")) state.family = p.get("family");
    if (p.get("sort")) state.sort = p.get("sort");
    if (p.get("item")) state.open = p.get("item");
    const srv = p.get("server");
    if (srv) {
      const ids = srv.split(",").map(Number).filter(Boolean);
      if (ids.length) {
        state.serverIds = new Set(ids);
        if (!p.get("c")) state.cat = "owned";
      }
    }
    const owned = p.get("owned");
    if (owned) {
      const ids = owned.split(",").map(Number).filter(Boolean);
      if (ids.length) state.ownedIds = new Set(ids);
    }
    if (p.get("ownedonly") === "1") state.ownedOnly = true;
    if (!state.ownedIds.size) state.ownedOnly = false;
  }
  let writingHash = false;
  function writeHash() {
    const p = new URLSearchParams();
    if (state.cat !== "weapons") p.set("c", state.cat);
    if (state.q) p.set("q", state.q);
    if (state.facet !== "All") p.set("facet", state.facet);
    if (state.fx !== "All") p.set("fx", state.fx);
    if (state.family !== "All") p.set("family", state.family);
    if (state.sort !== "name") p.set("sort", state.sort);
    if (state.open) p.set("item", state.open);
    if (state.serverIds.size) p.set("server", [...state.serverIds].join(","));
    if (state.ownedIds.size) p.set("owned", [...state.ownedIds].join(","));
    if (state.ownedOnly) p.set("ownedonly", "1");
    const next = "#" + p.toString();
    if (location.hash === next) return;
    writingHash = true;
    history.replaceState(null, "", next);
    writingHash = false;
  }

  /* ---------------------------------------------------------------- */
  /* filtering                                                        */
  /* ---------------------------------------------------------------- */

  const isCosmetic = () => state.cat === "cosmetics";

  function baseItems() {
    if (state.cat === "owned") return currentWeaponSet();
    return DATA.items.filter((i) => i.cat === state.cat);
  }

  function facetValues() {
    const set = new Map();
    for (const it of baseItems()) {
      const v = isCosmetic() ? it.slot : (state.cat === "weapons" || state.cat === "owned" || state.cat === "textures") ? it.cls : state.cat === "maps" ? "Edition" : "All";
      if (state.cat === "maps") {
        for (const t of it.tags) set.set(t, (set.get(t) || 0) + 1);
      } else if (v && v !== "All") {
        set.set(v, (set.get(v) || 0) + 1);
      }
    }
    return [...set.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  function familyValues() {
    const set = new Map();
    for (const it of baseItems()) {
      const f = it.family;
      if (!f) continue;
      set.set(f, (set.get(f) || 0) + 1);
    }
    return [...set.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  function getFiltered() {
    const q = norm(state.q);
    const terms = q ? q.split(" ").filter(Boolean) : null;
    let arr = baseItems();

    if (state.cat === "maps") {
      if (state.facet !== "All") arr = arr.filter((i) => i.tags.includes(state.facet));
    } else {
      const key = isCosmetic() ? "slot" : "cls";
      if (state.facet !== "All") arr = arr.filter((i) => i[key] === state.facet);
    }
    if (state.cat !== "maps" && state.family !== "All") {
      arr = arr.filter((i) => i.family === state.family);
    }
    if (state.fx !== "All") {
      arr = arr.filter((i) => (i.fxtags || []).includes(state.fx));
    }
    if (terms) {
      arr = arr.filter((i) => terms.every((t) => i._s.includes(t) || i._sc.includes(t)));
    }

    const dir = state.sort === "name-desc" ? -1 : 1;
    arr.sort((a, b) => {
      if (state.sort === "id") return String(a.id).localeCompare(String(b.id), "en");
      if (state.sort === "family") {
        return String(a.family || "").localeCompare(String(b.family || ""), "en") || a.name.localeCompare(b.name, "en");
      }
      return dir * a.name.localeCompare(b.name, "en");
    });
    return arr;
  }

  /* ---------------------------------------------------------------- */
  /* render                                                           */
  /* ---------------------------------------------------------------- */

  function catIcon(id) {
    return `<span class="dot" style="--cat:${CAT_COLOR[id]}"></span>`;
  }

  function catCount(id) {
    if (id === "owned") return serverWeaponCount();
    return DATA.counts[id] || 0;
  }

  function renderCats() {
    catsEl.innerHTML = "";
    for (const c of availableCats()) {
      const b = document.createElement("button");
      b.className = "cat";
      b.type = "button";
      b.style.setProperty("--cat", CAT_COLOR[c.id]);
      b.setAttribute("aria-current", state.cat === c.id ? "true" : "false");
      b.innerHTML = `${catIcon(c.id)}<span class="label"></span><span class="n"></span>`;
      b.querySelector(".label").textContent = c.label;
      b.querySelector(".n").textContent = catCount(c.id).toLocaleString();
      b.addEventListener("click", () => {
        if (state.cat === c.id) return;
        state.cat = c.id;
        state.facet = "All";
        state.fx = "All";
        state.family = "All";
        state.open = null;
        sync();
      });
      catsEl.append(b);
    }
  }

  const FX_ORDER = [
    "heart-hit", "fire-heart", "custom-fire", "fire1st", "tracer",
    "color-red", "color-orange", "color-gold", "color-green", "color-cyan",
    "color-blue", "color-purple", "color-pink", "color-black", "color-white", "color-grey",
  ];
  const FX_LABEL = {
    "heart-hit": "♥ FX โดนหัวใจ",
    "fire-heart": "♥ ยิงธีมหัวใจ",
    "custom-fire": "ชุดยิงพิเศษ",
    "fire1st": "FX นัดแรก",
    "tracer": "tracer พิเศษ",
    "color-red": "แฟลชแดง", "color-orange": "แฟลชส้ม", "color-gold": "แฟลชทอง",
    "color-green": "แฟลชเขียว", "color-cyan": "แฟลชฟ้าน้ำ", "color-blue": "แฟลชน้ำเงิน",
    "color-purple": "แฟลชม่วง", "color-pink": "แฟลชชมพู", "color-black": "แฟลชดำ",
    "color-white": "แฟลชขาว", "color-grey": "แฟลชเทา",
  };

  function fxValues() {
    const set = new Map();
    for (const it of baseItems()) {
      for (const t of it.fxtags || []) {
        if (FX_LABEL[t]) set.set(t, (set.get(t) || 0) + 1);
      }
    }
    return [...set.entries()].sort((a, b) =>
      FX_ORDER.indexOf(a[0]) - FX_ORDER.indexOf(b[0]) || b[1] - a[1]);
  }

  function renderFxChips() {
    fxFacetsEl.innerHTML = "";
    const values = fxValues();
    if ((state.cat !== "weapons" && state.cat !== "owned") || !values.length) {
      fxFacetsEl.hidden = true;
      state.fx = "All";
      return;
    }
    fxFacetsEl.hidden = false;
    const all = document.createElement("button");
    all.className = "chip";
    all.type = "button";
    all.style.setProperty("--cat", CAT_COLOR[state.cat]);
    all.setAttribute("aria-pressed", state.fx === "All" ? "true" : "false");
    all.textContent = "เอฟเฟกต์: ทั้งหมด";
    all.addEventListener("click", () => { state.fx = "All"; sync(); });
    fxFacetsEl.append(all);

    for (const [value, n] of values) {
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.style.setProperty("--cat", CAT_COLOR[state.cat]);
      b.setAttribute("aria-pressed", state.fx === value ? "true" : "false");
      b.append(document.createTextNode(FX_LABEL[value] || value));
      const s = document.createElement("span");
      s.className = "n";
      s.textContent = n;
      b.append(s);
      b.addEventListener("click", () => { state.fx = value; sync(); });
      fxFacetsEl.append(b);
    }
  }

  function renderFacets() {
    facetsEl.innerHTML = "";
    const values = facetValues();
    if (!values.length) return;
    const all = document.createElement("button");
    all.className = "chip";
    all.type = "button";
    all.style.setProperty("--cat", CAT_COLOR[state.cat]);
    all.setAttribute("aria-pressed", state.facet === "All" ? "true" : "false");
    all.textContent = "ทั้งหมด";
    all.addEventListener("click", () => { state.facet = "All"; sync(); });
    facetsEl.append(all);

    for (const [value, n] of values) {
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.style.setProperty("--cat", CAT_COLOR[state.cat]);
      b.setAttribute("aria-pressed", state.facet === value ? "true" : "false");
      b.append(document.createTextNode(facetText(value)));
      const s = document.createElement("span");
      s.className = "n";
      s.textContent = n;
      b.append(s);
      b.addEventListener("click", () => { state.facet = value; sync(); });
      facetsEl.append(b);
    }
  }

  function renderFamilies() {
    const values = familyValues();
    familySel.innerHTML = "";
    const all = document.createElement("option");
    all.value = "All";
    all.textContent = state.cat === "cosmetics" ? "ทุกซีรีส์" : "ทุกตระกูล";
    familySel.append(all);
    for (const [f, n] of values) {
      const o = document.createElement("option");
      o.value = f;
      o.textContent = `${f} (${n})`;
      familySel.append(o);
    }
    familySel.value = values.some(([f]) => f === state.family) ? state.family : "All";
    state.family = familySel.value;
    familySel.disabled = state.cat === "maps";
  }

  function renderHero() {
    const c = availableCats().find((x) => x.id === state.cat) || CATS[0];
    document.getElementById("cat-title").firstChild.textContent = c.label + " ";
    document.getElementById("cat-count").textContent = `(${catCount(c.id).toLocaleString()} รายการ)`;
    const serverNote = c.id === "owned"
      ? ` · ${serverWeapons().length} รุ่น · คุณมี ${ownedWeapons().length} รุ่น` +
        ` · ทุกกระบอกเสกได้ (sync/respawn 1 ครั้ง ไม่ใช้ proxy)`
      : "";
    document.getElementById("cat-desc").textContent = c.desc + serverNote;
    document.getElementById("stamp").textContent = `สร้างเมื่อ ${new Date(DATA.generated).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}`;
  }

  function cardEl(item) {
    const b = document.createElement("button");
    b.className = "card";
    b.type = "button";
    b.style.setProperty("--cat", CAT_COLOR[state.cat === "owned" ? "owned" : item.cat]);
    b.dataset.id = item.id;
    b.innerHTML = `
      <div class="thumb${item.img ? " has-img" : ""}">${visualMarkup(item, 188, 92)}<span class="ghost"></span></div>
      <span class="kbd-id"></span>
      <span class="spawn-id" role="button" tabindex="0" hidden></span>
      <h3></h3>
      <p class="sub"></p>
      <div class="tags"></div>`;
    bindImgFallback(b, item);
    b.querySelector(".kbd-id").textContent = item.id.split(":")[1] || "";
    const sid = b.querySelector(".spawn-id");
    if (sid && item.cat === "weapons" && item.itemIds && item.itemIds.length) {
      const allIds = item.itemIds;
      const sourceSet = state.ownedOnly && state.ownedIds.size ? state.ownedIds : state.serverIds;
      const srcLabel = state.ownedOnly && state.ownedIds.size ? "ของคุณ" : "ในคลังแสง";
      const matched = sourceSet.size
        ? allIds.filter((id) => sourceSet.has(Number(id)))
        : allIds;
      const pickIds = matched.length ? matched : allIds;
      const first = pickIds[0];
      const label = () => `ID ${first}${pickIds.length > 1 ? ` +${pickIds.length - 1}` : ""}`;
      sid.hidden = false;
      sid.textContent = label();
      sid.title = `คลิกเพื่อคัดลอก Spawn ID ${first}` +
        (pickIds.length > 1 ? ` (${srcLabel}: ${pickIds.join(", ")})` : "");
      const copySid = (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyText(String(first));
        sid.textContent = "คัดลอกแล้ว";
        setTimeout(() => { sid.textContent = label(); }, 1000);
      };
      sid.addEventListener("click", copySid);
      sid.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") copySid(e); });
    }
    b.querySelector(".ghost").textContent = item.cat === "weapons" ? (CLASS_TH[item.cls] || item.cls || "") : item.cat === "cosmetics" ? (SLOT_TH[item.slot] || item.slot || "") : item.cat === "maps" ? facetText(item.tags[0] || "") : item.cat === "textures" ? "เท็กเจอร์" : "แอสเซ็ต";
    b.querySelector("h3").textContent = item.name;
    const sub = item.cat === "weapons"
      ? [item.family, item.variant].filter(Boolean).join(" · ")
      : item.cat === "cosmetics"
        ? [item.slot, item.variant].filter(Boolean).join(" · ")
        : item.cat === "maps"
          ? "Map · " + item.tags.join(" + ")
          : item.cat === "textures"
            ? [item.family, item.variant].filter(Boolean).join(" · ") + ` · ${item.nfiles || (item.paths || []).length} ไฟล์`
            : "Weapon attachment";
    b.querySelector(".sub").textContent = sub;

    const tags = b.querySelector(".tags");
    const add = (t, cls) => {
      const s = document.createElement("span");
      s.className = "tag" + (cls ? " " + cls : "");
      s.textContent = t;
      tags.append(s);
    };
    if (item.cat === "weapons") {
      add(CLASS_TH[item.cls] || item.cls, "cls");
      if (state.cat === "owned" && matchesOwned(item)) add("มีแล้ว", "owned");
      if (item.variant) for (const t of item.variant.split(" ").slice(0, 2)) add(t);
      const fxt = item.fxtags || [];
      if (fxt.includes("heart-hit")) add("♥ โดนหัวใจ", "fx");
      else if (fxt.includes("fire-heart")) add("♥ ยิงหัวใจ", "fx");
      if (item.fx?.color) add("FX สี" + item.fx.colorTh, "fx");
    } else if (item.cat === "cosmetics") {
      add(SLOT_TH[item.slot] || item.slot, "cls");
      if (item.variant) add(item.variant);
    } else if (item.cat === "maps") {
      for (const t of item.tags) add(facetText(t), "cls");
    } else if (item.cat === "textures") {
      for (const t of item.tags) add(t.toUpperCase(), "cls");
    } else {
      add("อุปกรณ์ติดปืน", "cls");
    }

    b.addEventListener("click", () => openDetail(item.id));
    return b;
  }

  function applyFilter() {
    filtered = getFiltered();
    rendered = 0;
    grid.innerHTML = "";
    loading.textContent = "";
    document.getElementById("shown").textContent = filtered.length.toLocaleString();

    if (!filtered.length) {
      if (state.cat === "owned" && !state.serverIds.size) {
        grid.innerHTML = '<div class="empty"><b>ยังไม่มีลิสต์คลังแสง</b>กด “ดึงจากเกม” ด้านบน หรือเปิดผ่าน SAFETY → เปิด Server Owner (ดึงจากเกม)</div>';
      } else {
        grid.innerHTML = '<div class="empty"><b>ไม่พบไอเทมที่ตรงกัน</b>ลองพิมพ์สั้นลง หรือกดรีเซ็ตตัวกรอง</div>';
      }
      return;
    }
    renderMore();
  }

  function renderMore() {
    if (rendered >= filtered.length) return;
    const end = Math.min(rendered + BATCH, filtered.length);
    const frag = document.createDocumentFragment();
    for (let i = rendered; i < end; i++) frag.append(cardEl(filtered[i]));
    grid.append(frag);
    rendered = end;
    loading.textContent = rendered < filtered.length ? `แสดง ${rendered.toLocaleString()} จาก ${filtered.length.toLocaleString()}...` : "";
    if (rendered >= filtered.length) {
      if (io) io.disconnect();
    } else if (io) {
      io.observe(sentinel);
    }
  }

  function sync() {
    state.q = qInput.value;
    sortSel.value = state.sort;
    updateServerMeta();
    renderCats();
    renderFacets();
    renderFxChips();
    renderFamilies();
    renderHero();
    applyFilter();
    writeHash();
  }

  /* ---------------------------------------------------------------- */
  /* detail                                                           */
  /* ---------------------------------------------------------------- */

  function itemById(id) {
    return DATA.items.find((i) => i.id === id);
  }

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function storageSet(key, value) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {}
  }
  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.append(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch { return false; }
    }
  }

  function assetUrl(p) {
    const base = storageGet("pbIndex.base") || DATA.assetBase || "";
    if (!base) return "";
    return base.replace(/\/+$/, "") + p;
  }

  function openDetail(id) {
    const it = itemById(id);
    if (!it) return;
    state.open = id;
    writeHash();

    detail.style.setProperty("--cat", CAT_COLOR[it.cat]);
    document.getElementById("d-mark").textContent = it.cat === "weapons" ? "W" : it.cat === "cosmetics" ? "C" : it.cat === "maps" ? "M" : it.cat === "textures" ? "T" : "A";
    document.getElementById("d-title").textContent = it.name;
    document.getElementById("d-sub").textContent = `${CAT_LABEL[it.cat]} · ${it.id}`;
    const art = document.getElementById("d-art");
    art.classList.toggle("has-img", !!it.img);
    art.innerHTML = visualMarkup(it, 208, 168);
    bindImgFallback(art, it);

    const kv = document.getElementById("d-kv");
    kv.innerHTML = "";
    const put = (k, v) => {
      if (v == null || v === "") return;
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      if (typeof v === "string" && (v.startsWith("/assets/") || /^v[a-f0-9]{8}$/.test(v))) {
        const c = document.createElement("code");
        c.textContent = v;
        dd.append(c);
      } else {
        dd.textContent = String(v);
      }
      kv.append(dt, dd);
    };
    if (it.cat === "weapons" || it.cat === "textures") put("คลาส", CLASS_TH[it.cls] || it.cls);
    if (it.cat === "cosmetics") put("ช่อง", SLOT_TH[it.slot] || it.slot);
    if (it.cat === "weapons" || it.cat === "cosmetics") put("ตระกูล", it.family);
    put("รุ่น", it.variant);
    if (it.cat === "maps") put("ฉบับ", it.tags.map(facetText).join(", "));
    else put("แท็ก", (it.tags || []).map(facetText).join(", "));
    if (it.cat === "textures" && Array.isArray(it.paths)) {
      const ROLE_TH = { diff: "diff (สี/ลาย)", norm: "norm (normal)", ref: "ref (reflect/rough)", spec: "spec (specular)", emis: "emis (emissive)", vol: "vol (volume)", mask: "mask", base: "base (ไฟล์หลัก)", extra: "อื่น ๆ" };
      const dt = document.createElement("dt");
      dt.textContent = "ไฟล์เท็กเจอร์";
      const dd = document.createElement("dd");
      dd.className = "spawn-ids";
      it.paths.forEach((p, i) => {
        const role = (it.roles || [])[i] || "extra";
        const name = p.split("/").pop();
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn sm";
        b.textContent = `${ROLE_TH[role] || role} · ${name}`;
        b.title = p;
        b.addEventListener("click", async () => {
          const copied = await copyText(p);
          b.textContent = copied ? "คัดลอกพาธแล้ว" : "ไม่สำเร็จ";
          setTimeout(() => { b.textContent = `${ROLE_TH[role] || role} · ${name}`; }, 1200);
        });
        dd.append(b);
      });
      kv.append(dt, dd);
      if (it.nfiles) put("ไฟล์ทั้งหมด", `${it.nfiles} ไฟล์ (รวม .dds/.ktx2)`);
    }
    if (it.cat === "weapons" && it.fx) {
      if (it.fx.hitHeart) put("FX ตอนโดน", "หัวใจ (Hit_CoupleBreaker_Heart)");
      if (it.fx.theme) put("ธีม FX ยิง", it.fx.theme);
      if (it.fx.color) put("สีแฟลชตอนยิง", `${it.fx.colorTh} (${(it.fx.flash || []).join(",")})`);
      if (it.fx.fire) put("ชุด FX ยิง", it.fx.fire);
      if (it.fx.fire1st) put("FX นัดแรก", it.fx.fire1st);
      if (it.fx.tracer != null) put("Tracer พิเศษ", it.fx.tracer);
    }
    const paths = it.paths || [it.path];
    put(paths.length > 1 ? "พาธไฟล์" : "พาธไฟล์", paths.join("\n"));
    put("แฮช", it.hash);
    put("คีย์", it.slug);
    if (it.official && it.official !== it.name) put("ชื่อทางการ", it.official);
    if (it.cat === "weapons" && Array.isArray(it.itemIds) && it.itemIds.length) {
      const dt = document.createElement("dt");
      dt.textContent = "Spawn ID";
      const dd = document.createElement("dd");
      dd.className = "spawn-ids";
      const markSet = state.ownedOnly && state.ownedIds.size ? state.ownedIds : state.serverIds;
      const usingOwned = state.ownedOnly && state.ownedIds.size > 0;
      const okLabel = usingOwned ? "คุณมีไอเทมนี้" : "อยู่ในคลังแสง";
      const noLabel = usingOwned ? "ยังไม่มีใน inventory" : "ไม่อยู่ในคลังแสง";
      const ids = markSet.size
        ? [...it.itemIds].sort((a, b) =>
          Number(markSet.has(Number(b))) - Number(markSet.has(Number(a))))
        : it.itemIds;
      for (const id of ids) {
        const ok = markSet.size ? markSet.has(Number(id)) : null;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn sm" + (ok === true ? " ok" : ok === false ? " dim" : "");
        b.textContent = String(id);
        b.title = ok === true
          ? `${okLabel} — คัดลอก ${id}`
          : ok === false
            ? `${noLabel} — คัดลอก ${id}`
            : `คัดลอก ${id}`;
        b.addEventListener("click", async () => {
          const copied = await copyText(String(id));
          const old = b.textContent;
          b.textContent = copied ? "คัดลอกแล้ว" : "ไม่สำเร็จ";
          setTimeout(() => { b.textContent = old; }, 1000);
        });
        dd.append(b);
      }
      kv.append(dt, dd);
    }


    const open = document.getElementById("d-open");
    const url = assetUrl(paths[0]);
    if (url) { open.href = url; open.style.display = ""; }
    else { open.removeAttribute("href"); open.style.display = "none"; }

    const rel = document.getElementById("d-related");
    rel.innerHTML = "";
    const sibs = (it.cat === "weapons" || it.cat === "cosmetics")
      ? DATA.items
        .filter((x) => x.cat === it.cat && x.family === it.family && x.id !== it.id)
        .slice(0, 8)
      : [];
    if (sibs.length) {
      const h = document.createElement("h3");
      h.textContent = "ตระกูลเดียวกัน";
      const row = document.createElement("div");
      row.className = "row";
      for (const s of sibs) {
        const b = document.createElement("button");
        b.className = "rel";
        b.type = "button";
        const span = document.createElement("span");
        span.textContent = s.name;
        b.append(span);
        b.addEventListener("click", () => openDetail(s.id));
        row.append(b);
      }
      rel.append(h, row);
    }

    if (!detail.open) detail.showModal();
  }

  function closeDetail() {
    if (detail.open) detail.close();
    state.open = null;
    writeHash();
  }

  /* ---------------------------------------------------------------- */
  /* wire up                                                          */
  /* ---------------------------------------------------------------- */

  qInput.addEventListener("input", () => {
    state.q = qInput.value;
    // immediate, the dataset is small
    if (io) io.disconnect();
    applyFilter();
    writeHash();
  });

  familySel.addEventListener("change", () => {
    state.family = familySel.value;
    if (io) io.disconnect();
    applyFilter();
    writeHash();
  });

  sortSel.addEventListener("change", () => {
    state.sort = sortSel.value;
    if (io) io.disconnect();
    applyFilter();
    writeHash();
  });

  serverInput.addEventListener("input", () => {
    state.serverIds = parseServerIds(serverInput.value);
    state.ownedIds = new Set();
    state.ownedOnly = false;
    if (state.serverIds.size) {
      state.cat = "owned";
      state.facet = "All";
      state.family = "All";
      state.open = null;
    }
    if (io) io.disconnect();
    sync();
  });
  serverClear.addEventListener("click", () => {
    serverInput.value = "";
    state.serverIds = new Set();
    state.ownedIds = new Set();
    state.ownedOnly = false;
    if (io) io.disconnect();
    sync();
  });
  if (ownedOnlyInput) {
    ownedOnlyInput.addEventListener("change", () => {
      state.ownedOnly = ownedOnlyInput.checked && state.ownedIds.size > 0;
      if (io) io.disconnect();
      sync();
    });
  }

  document.getElementById("reset").addEventListener("click", () => {
    state.q = "";
    state.facet = "All";
    state.family = "All";
    state.sort = "name";
    state.serverIds = new Set();
    state.ownedIds = new Set();
    state.ownedOnly = false;
    if (ownedOnlyInput) ownedOnlyInput.checked = false;
    if (state.cat === "owned") state.cat = "weapons";
    qInput.value = "";
    serverInput.value = "";
    sync();
  });

  document.getElementById("random").addEventListener("click", () => {
    const pool = getFiltered();
    if (!pool.length) return;
    openDetail(pool[Math.floor(Math.random() * pool.length)].id);
  });

  document.getElementById("d-close").addEventListener("click", closeDetail);
  detail.addEventListener("click", (e) => { if (e.target === detail) closeDetail(); });
  detail.addEventListener("close", () => { state.open = null; writeHash(); });

  document.getElementById("d-copy-path").addEventListener("click", async () => {
    const it = itemById(state.open);
    if (!it) return;
    const text = (it.paths || [it.path]).join("\n");
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.append(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    const b = document.getElementById("d-copy-path");
    const old = b.textContent;
    b.textContent = "คัดลอกแล้ว";
    setTimeout(() => { b.textContent = old; }, 1100);
  });

  document.getElementById("d-copy-link").addEventListener("click", async () => {
    const url = location.href;
    try { await navigator.clipboard.writeText(url); } catch {}
    const b = document.getElementById("d-copy-link");
    const old = b.textContent;
    b.textContent = "คัดลอกแล้ว";
    setTimeout(() => { b.textContent = old; }, 1100);
  });

  // settings
  const pop = document.getElementById("pop");
  const baseInput = document.getElementById("base");
  const previewInput = document.getElementById("preview");
  const samplePath = (DATA.items.find((i) => i.hash) || {}).path || "/assets/weapons/models/c4.glb";

  function updatePreview() {
    const base = baseInput.value.trim().replace(/\/+$/, "");
    previewInput.value = base ? base + samplePath : samplePath;
  }
  document.getElementById("settings").addEventListener("click", () => {
    baseInput.value = storageGet("pbIndex.base") || DATA.assetBase || "";
    updatePreview();
    pop.classList.add("open");
  });
  pop.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) pop.classList.remove("open"); });
  baseInput.addEventListener("input", updatePreview);
  document.getElementById("base-save").addEventListener("click", () => {
    const v = baseInput.value.trim().replace(/\/+$/, "");
    if (v) storageSet("pbIndex.base", v);
    else storageRemove("pbIndex.base");
    pop.classList.remove("open");
    // re-resolve every image URL against the new host
    applyFilter();
    if (state.open) openDetail(state.open);
  });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== qInput && !detail.open) {
      e.preventDefault(); qInput.focus(); qInput.select();
    }
    if (e.key === "Escape" && document.activeElement === qInput) {
      qInput.value = ""; state.q = ""; applyFilter(); writeHash();
    }
  });

  window.addEventListener("hashchange", () => {
    if (writingHash) return;
    readHash();
    qInput.value = state.q;
    sortSel.value = state.sort;
    sync();
    if (state.open) openDetail(state.open);
  });

  // init
  readHash();
  qInput.value = state.q;
  sortSel.value = state.sort;
  if (state.ownedIds.size) {
    serverInput.value = "";
    serverInput.placeholder = "auto: รายการจากเกม";
  } else if (state.serverIds.size) {
    serverInput.value = [...state.serverIds].join(",");
  }
  if (ownedOnlyInput) {
    ownedOnlyInput.checked = state.ownedOnly;
    ownedOnlyInput.disabled = !state.ownedIds.size;
  }
  updateServerMeta();
  document.getElementById("side-total").textContent = DATA.total.toLocaleString();
  document.getElementById("side-build").textContent = new Date(DATA.generated).toISOString().slice(0, 10);
  document.getElementById("foot-count").textContent = `${DATA.total.toLocaleString()} รายการ · ${Object.entries(DATA.counts).map(([k, v]) => `${CAT_LABEL[k] || k} ${v}`).join(" · ")}`;

  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) renderMore();
    }, { rootMargin: "900px 0px" });
  }

  renderCats();
  renderFacets();
  renderFxChips();
  renderFamilies();
  renderHero();
  applyFilter();

  if (state.open) openDetail(state.open);

  /* ---------------------------------------------------------------- */
  /* live import (extension options page only)                        */
  /* ---------------------------------------------------------------- */
  async function importServerOwned() {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.runtime || !chrome.runtime.id) return false;
    let tabs = [];
    try {
      tabs = await chrome.tabs.query({ url: ["*://shootingpoint.xyz/*", "*://*.shootingpoint.xyz/*"] });
    } catch { return false; }
    const tab = tabs.find((t) => t.id != null);
    if (!tab) {
      if (serverMeta) serverMeta.textContent = "ไม่พบแท็บเกมที่เปิดอยู่";
      return false;
    }
    const resp = await new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      try {
        chrome.tabs.sendMessage(tab.id, { type: "pb-get-server-owned" }, (r) => {
          if (chrome.runtime.lastError) { finish(null); return; }
          finish(r || null);
        });
      } catch { finish(null); }
      setTimeout(() => finish(null), 2500);
    });
    const ids = resp && Array.isArray(resp.ids) ? resp.ids.map(Number).filter(Boolean) : [];
    const owned = resp && Array.isArray(resp.owned) ? resp.owned.map(Number).filter(Boolean) : [];
    if (!ids.length) {
      if (serverMeta) serverMeta.textContent = "ยังดึงไม่ได้ — เข้าแมตช์ก่อนแล้วกด “ดึงจากเกม” อีกครั้ง";
      return false;
    }
    serverInput.value = "";
    serverInput.placeholder = "auto: รายการจากเกม";
    state.serverIds = new Set(ids);
    state.ownedIds = new Set(owned);
    state.ownedOnly = false;
    state.cat = "owned";
    state.facet = "All";
    state.family = "All";
    state.open = null;
    sync();
    if (serverMeta) serverMeta.textContent += " · ดึงจากเกมแล้ว";
    return true;
  }

  const serverFetch = document.getElementById("server-fetch");
  if (serverFetch && typeof chrome !== "undefined" && chrome.tabs) {
    serverFetch.hidden = false;
    serverFetch.addEventListener("click", () => { importServerOwned(); });
  }
  importServerOwned();
})();
