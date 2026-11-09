(function () {
  "use strict";
  const DATA = window.PB_SHOP;
  if (!DATA || !Array.isArray(DATA.weapons)) {
    document.getElementById("grid").innerHTML = '<div class="empty">ไม่พบ data.js</div>';
    return;
  }

  const grid = document.getElementById("grid");
  const cats = document.getElementById("cats");
  const q = document.getElementById("q");
  const shown = document.getElementById("shown");
  const empty = document.getElementById("empty");
  const toast = document.getElementById("toast");
  const premiumView = document.getElementById("premiumView");
  const premGrid = document.getElementById("premGrid");
  const viewtabs = document.getElementById("viewtabs");
  const state = { view: "shop", cat: "all", q: "" };

  document.getElementById("total").textContent = `${DATA.total.toLocaleString()} รายการ`;
  document.getElementById("owned").textContent = `${DATA.weapons.filter(w => w.owned).length} มีแล้ว`;
  document.getElementById("stamp").textContent = "อัปเดต " + new Date(DATA.generated).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });

  function toastMsg(t) {
    toast.textContent = t;
    toast.hidden = false;
    clearTimeout(toastMsg.t);
    toastMsg.t = setTimeout(() => { toast.hidden = true; }, 1400);
  }

  async function copyText(t) {
    try {
      await navigator.clipboard.writeText(t);
      return true;
    } catch (_) {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.style.cssText = "position:fixed;left:-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (_) { return false; }
    }
  }

  function spriteEl(w) {
    const art = document.createElement("div");
    art.className = "art";
    if (!w.img || !w.img.u) {
      const f = document.createElement("span");
      f.className = "fallback";
      f.textContent = "?";
      art.append(f);
      return art;
    }
    const iw = Number(w.img.w) || 183;
    const ih = Number(w.img.h) || 80;
    const scale = Math.min(1, 196 / iw, 92 / ih);
    const box = document.createElement("div");
    box.style.cssText = `position:relative;width:${iw * scale}px;height:${ih * scale}px`;
    const sp = document.createElement("div");
    sp.className = "sprite";
    const url = /^https?:\/\//.test(w.img.u) ? w.img.u : DATA.assetBase + w.img.u;
    sp.style.setProperty("--img", `url("${url}")`);
    sp.style.setProperty("--x", (Number(w.img.x) || 0) + "px");
    sp.style.setProperty("--y", (Number(w.img.y) || 0) + "px");
    sp.style.setProperty("--w", iw + "px");
    sp.style.setProperty("--h", ih + "px");
    if (scale < 1) {
      sp.style.transform = `scale(${scale})`;
      sp.style.transformOrigin = "top left";
      sp.style.position = "absolute";
    }
    box.append(sp);
    art.append(box);
    return art;
  }

  function card(w) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.title = `คัดลอก ID ${w.id}`;
    b.append(spriteEl(w));

    if (w.owned) {
      const own = document.createElement("span");
      own.className = "own-badge";
      own.textContent = "มีแล้ว";
      b.append(own);
    }

    const body = document.createElement("div");
    body.className = "body";

    const name = document.createElement("h3");
    name.className = "name";
    name.textContent = w.name;

    const idrow = document.createElement("div");
    idrow.className = "idrow";
    const id = document.createElement("span");
    id.className = "id";
    id.textContent = w.id;
    const cls = document.createElement("span");
    cls.className = "cls";
    cls.textContent = w.cls;
    idrow.append(id, cls);

    const stats = document.createElement("div");
    stats.className = "stats";
    const stat = (label, val) => {
      const s = document.createElement("span");
      s.innerHTML = `${label} <b>${val}</b>`;
      return s;
    };
    stats.append(stat("DMG", w.damage || 0));
    stats.append(stat("RNG", w.range || 0));
    if (w.ammo) stats.append(stat("AMMO", w.ammo));

    const price = document.createElement("div");
    price.className = "price";
    const p = document.createElement("span");
    p.className = "p";
    p.textContent = w.price || "—";
    const buy = document.createElement("span");
    buy.className = "buy";
    buy.textContent = "คัดลอก ID";
    price.append(p, buy);

    body.append(name, idrow, stats, price);
    b.append(body);

    b.addEventListener("click", async () => {
      const ok = await copyText(String(w.id));
      toastMsg(ok ? `คัดลอก ID ${w.id} แล้ว` : `คัดลอกไม่สำเร็จ (${w.id})`);
    });
    return b;
  }

  function premiumFiltered() {
    const t = state.q.trim().toLowerCase();
    const list = DATA.premium || [];
    if (!t) return list;
    return list.filter(p => {
      if (String(p.good).includes(t) || (p.name || "").toLowerCase().includes(t)) return true;
      return (p.slots || []).some(s =>
        String(s.id).includes(t) ||
        (s.name || "").toLowerCase().includes(t) ||
        (s.title || "").toLowerCase().includes(t));
    });
  }

  function premiumCard(p) {
    const el = document.createElement("article");
    el.className = "pack";

    if (p.kind === "weapon" && p.weapon) {
      return card({
        ...p.weapon,
        name: p.name || p.weapon.name,
        price: "พรีเมียม",
        owned: false,
        img: { u: p.weapon.icon },
      });
    }

    if (p.kind === "service") {
      const h = document.createElement("div");
      h.className = "service";
      h.textContent = `${p.name} · good ${p.good} (บริการ ไม่ใช่อาวุธ)`;
      el.append(h);
      return el;
    }

    const head = document.createElement("div");
    head.className = "pack-head";
    const box = document.createElement("div");
    box.className = "pack-box";
    if (p.img && p.img.u) {
      const img = document.createElement("img");
      img.src = p.img.u;
      img.alt = "";
      img.loading = "lazy";
      box.append(img);
    }
    const info = document.createElement("div");
    info.className = "pack-info";
    const name = document.createElement("h3");
    name.className = "pack-name";
    name.textContent = p.name;
    const good = document.createElement("span");
    good.className = "pack-good";
    good.textContent = "good " + p.good;
    const groups = document.createElement("span");
    groups.className = "pack-groups";
    groups.textContent = (p.groups || []).join(" · ");
    info.append(name, good, groups);
    head.append(box, info);

    const slots = document.createElement("div");
    slots.className = "slots";
    for (const s of p.slots || []) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.title = `คัดลอก ID ${s.id}`;
      const art = document.createElement("span");
      art.className = "slot-art";
      if (s.icon) art.style.backgroundImage = `url("${s.icon}")`;
      const mid = document.createElement("span");
      mid.className = "slot-name";
      mid.textContent = s.title || s.name || String(s.id);
      const meta = document.createElement("span");
      meta.className = "slot-meta";
      meta.textContent = [s.cls, s.damage ? `DMG ${s.damage}` : "", s.range ? `RNG ${s.range}` : ""]
        .filter(Boolean).join(" · ");
      const body = document.createElement("span");
      body.className = "slot-body";
      body.append(mid, meta);
      const id = document.createElement("span");
      id.className = "slot-id";
      id.textContent = s.id;
      b.append(art, body, id);
      b.addEventListener("click", async () => {
        const ok = await copyText(String(s.id));
        toastMsg(ok ? `คัดลอก ID ${s.id} แล้ว` : `คัดลอกไม่สำเร็จ (${s.id})`);
      });
      slots.append(b);
    }
    el.append(head, slots);
    return el;
  }

  function renderPremium() {
    cats.hidden = true;
    grid.hidden = true;
    premiumView.hidden = false;
    const list = premiumFiltered();
    shown.textContent = list.length.toLocaleString();
    empty.hidden = list.length > 0;
    const frag = document.createDocumentFragment();
    for (const p of list) frag.append(premiumCard(p));
    premGrid.replaceChildren(frag);
  }

  function filtered() {
    const t = state.q.trim().toLowerCase();
    return DATA.weapons.filter(w => {
      if (state.cat !== "all" && w.cat !== state.cat) return false;
      if (!t) return true;
      return String(w.id).includes(t) ||
        w.name.toLowerCase().includes(t) ||
        (w.cls || "").toLowerCase().includes(t);
    });
  }

  function renderCats() {
    const counts = DATA.counts || {};
    const items = [{ id: "all", label: "ทั้งหมด", n: DATA.total }]
      .concat(DATA.order.filter(c => counts[c]).map(c => ({ id: c, label: c, n: counts[c] })));
    cats.replaceChildren();
    for (const it of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cat" + (state.cat === it.id ? " on" : "");
      b.dataset.cat = it.id;
      b.innerHTML = `${it.label}<span class="n">${it.n}</span>`;
      b.addEventListener("click", () => {
        state.cat = it.id;
        renderCats();
        render();
      });
      cats.append(b);
    }
  }

  function render() {
    document.getElementById("total").textContent = state.view === "premium"
      ? `${(DATA.premium || []).length} รายการ`
      : `${DATA.total.toLocaleString()} รายการ`;
    if (state.view === "premium") { renderPremium(); return; }
    cats.hidden = false;
    grid.hidden = false;
    premiumView.hidden = true;
    const list = filtered();
    shown.textContent = list.length.toLocaleString();
    empty.hidden = list.length > 0;
    const frag = document.createDocumentFragment();
    for (const w of list) frag.append(card(w));
    grid.replaceChildren(frag);
  }

  for (const b of viewtabs.querySelectorAll("button")) {
    b.addEventListener("click", () => {
      state.view = b.dataset.view;
      for (const x of viewtabs.querySelectorAll("button")) x.classList.toggle("on", x === b);
      render();
    });
  }

  q.addEventListener("input", () => {
    state.q = q.value;
    render();
  });

  renderCats();
  render();
})();
