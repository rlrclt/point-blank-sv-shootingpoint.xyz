/*
 * PB ESP — weapon spawner (archived 2026-11-09)
 *
 * Removed from esp.js v1.47 because the spawner is no longer used.
 * Kept verbatim so it can be restored without rewriting the logic.
 * See README.md in this folder for the removal list and restore steps.
 */

/* ============================================================
 * 1) CFG defaults (add back inside the CFG object)
 * ============================================================ */
    spawnSwitch: true,      // สลับไปใช้อาวุธที่เพิ่งเสกทันที
    spawnSync: false,       // ดันคลังที่เสกไปเป็น respawn loadout (host/net)
    spawnProxy: true,       // online: ส่ง id ปืนเดิมที่เซิร์ฟเวอร์รู้จักตอนยิง
    spawnOwnedSync: true,   // ปืนที่ server มีอยู่แล้ว: sync + ไม่ใช้ proxy
    spawnPickup: false,     // primary/secondary: เสกผ่าน drop + pickUp (safeMode off จึงใช้ได้)
    spawnReapply: true,     // ถ้าตายแล้ว server คืนปืนเริ่มต้น ให้ pickup ปืนที่เสกซ้ำ
    spawnPersist: true,     // คงปืนที่เสกไว้หลัง server adopt loadout (ใช้ proxy คิดดาเมจ)
    spawnOwnedOnly: false,  // แสดงเฉพาะอาวุธที่ respawn inventory ของ server มี
    spawnDamageOnly: true,  // ซ่อนไอเทมที่ดาเมจ 0 (ยกเว้นมีด/ระเบิด)
    safeMode: true,         // จำกัดการเสก + บังคับ proxy (ไม่ใช้ pickup) เพื่อลดความเสี่ยง
    spawnCooldownMs: 1500,  // เว้นระยะระหว่างการเสกแต่ละครั้ง
    spawnMaxPerMin: 8,      // โควต้าเสกต่อนาที (บังคับเมื่อ safeMode เปิด)

/* ============================================================
 * 2) WEAPON pane markup (add back before the "Fast Swap" section)
 * ============================================================ */
        <div class="pbSec">Weapon Spawner</div>
        <div class="pbRow">
          <input id="pbSpawnSearch" type="text" placeholder="ค้นหาชื่อ / ID" autocomplete="off" spellcheck="false">
        </div>
        <div class="pbRow">
          <select id="pbSpawnSlot">
            <option value="-1">ทุกช่อง</option>
            <option value="0">Primary</option>
            <option value="1">Secondary</option>
            <option value="2">Melee</option>
            <option value="3">Grenade</option>
            <option value="4">Special</option>
          </select>
          <button id="pbSpawnReload" type="button">REFRESH</button>
        </div>
        <label><input type="checkbox" data-c="spawnSwitch"> สลับไปใช้อาวุธที่เสก</label>
        <label><input type="checkbox" data-c="spawnSync"> คงอาวุธที่เสกตอนเกิดใหม่ (sync)</label>
        <label><input type="checkbox" data-c="spawnProxy"> ใช้ ID ปืนเดิมตอนยิง (ออนไลน์)</label>
        <label><input type="checkbox" data-c="spawnPickup"> เสกแบบเก็บจากพื้น (ปืนจริง/คนอื่นเห็น)</label>
        <label><input type="checkbox" data-c="spawnReapply"> เก็บปืนที่เสกจากพื้นซ้ำหลังเกิดใหม่</label>
        <label><input type="checkbox" data-c="spawnPersist"> คงปืนที่เสกหลังเกิดใหม่ (proxy อัตโนมัติ)</label>
        <label><input type="checkbox" data-c="spawnOwnedOnly"> เฉพาะปืนที่เซิร์ฟเวอร์มี (owned)</label>
        <label><input type="checkbox" data-c="spawnOwnedSync"> ปืนที่มีแล้ว: sync + ไม่ใช้ proxy</label>
        <label><input type="checkbox" data-c="spawnDamageOnly"> เฉพาะปืนที่ดาเมจ > 0</label>
        <div class="pbHelp">เสกจากฐานอาวุธของเกม (ทุกไอเทมใน weapons.json) — คลิกชื่อเพื่อใส่อาวุธ</div>
        <div class="pbHelp">sync เปิด = เกิดใหม่แล้วยังถือกระบอกเดิม · ปิด = อยู่แค่ชีวิตนี้</div>
        <div class="pbHelp">pickup เปิด = primary/secondary จะทิ้งปืนเดิมลงพื้นแล้วเก็บกระบอกใหม่ (ใช้ได้เฉพาะ 2 ช่องนี้)</div>
        <div class="pbHelp">proxy เปิด = เซิร์ฟเวอร์เห็นปืนเดิมที่คุณมี จึงคิดดาเมจให้ · ปิด = ส่ง ID ปืนที่เสกตรง ๆ</div>
        <div id="pbSpawnList"><div class="pbSpawnEmpty">กำลังรอฐานข้อมูลอาวุธ…</div></div>
        <div class="pbHelp" id="pbSpawnInfo">—</div>
        <div class="pbRow">
          <input type="number" id="pbSpawnId" placeholder="ID">
          <button id="pbSpawnIdBtn" type="button">SPAWN ID</button>
        </div>

/* ============================================================
 * 3) SAFETY pane markup (add back before "Bridge")
 * ============================================================ */
        <div class="pbSec">Anti-detection</div>
        <label><input type="checkbox" data-c="safeMode"> โหมดปลอดภัย (Safe Mode)</label>
        <div class="pbHelp">จำกัดการเสก ถี่เกินไป + บังคับใช้ proxy แทน pickup (pickup จะถูกข้าม)</div>
        <label>Cooldown การเสก <span id="pbSpawnCdVal">1500</span> ms
          <input type="range" id="pbSpawnCd" min="0" max="5000" step="100" value="1500">
        </label>
        <div class="pbRow">
          <input type="number" id="pbSpawnCdNum" min="0" max="5000" step="100" value="1500">
          <button id="pbSpawnCdReset" type="button">RESET</button>
          <span class="pbHelp" style="margin:0">default 1500</span>
        </div>
        <label>เสกสูงสุด / นาที <span id="pbSpawnMaxVal">8</span>
          <input type="range" id="pbSpawnMax" min="1" max="30" step="1" value="8">
        </label>
        <div class="pbRow">
          <input type="number" id="pbSpawnMaxNum" min="1" max="30" step="1" value="8">
        </div>

/* ============================================================
 * 4) JS: state + functions + handlers
 * ============================================================ */
  /* ───── weapon spawner ─────
     The game's WeaponDb ships every ShootingPoint weapon
     (all 5.7k entries from /assets/cross/weapons/weapons.json). Spawning is
     just: resolve the numeric id to a def, put it in the local weapon
     system with equip(), and keep the id in `owned` so the game's own
     refill() restores it after a round/respawn. */
  const spawnSearch = panel.querySelector("#pbSpawnSearch");
  const spawnSlotSel = panel.querySelector("#pbSpawnSlot");
  const spawnList = panel.querySelector("#pbSpawnList");
  const spawnInfo = panel.querySelector("#pbSpawnInfo");
  const spawnIdInput = panel.querySelector("#pbSpawnId");
  const spawnReloadBtn = panel.querySelector("#pbSpawnReload");
  const spawnIdBtn = panel.querySelector("#pbSpawnIdBtn");
  const SPAWN_TAG = ["PRI", "SEC", "MEL", "GRN", "SPC"];
  const SPAWN_SHOW_MAX = 200;

  let spawnDbRef = null;
  let spawnDefs = null;
  const spawnPrev = new Map(); // slot -> { id, prev } for non-synced (one-life) spawns
  let spawnSynced = null;      // [id ×5] loadout to force back after the next respawn
  let spawnPbRef = null;       // clear spawn state when a new match starts
  const spawnProxy = new Map(); // slot -> { spawnedId, proxyId } legal id for online
  const spawnPickupPrefs = new Map(); // slot -> weapon id picked up from a synthetic drop
  let spawnReapplyUntil = 0;
  let lastReapplyAt = 0;
  let lastSpawnAt = -1e9;
  let spawnLog = [];
  function markSpawn() {
    lastSpawnAt = performance.now();
    spawnLog.push(lastSpawnAt);
    if (spawnLog.length > 60) spawnLog.shift();
  }

  function weaponDbOf() {
    const ws = weaponSystemOf(findPB());
    return ws && ws.db ? ws.db : null;
  }

  function spawnCatalog() {
    const db = weaponDbOf();
    if (!db || !db.loaded || typeof db.all !== "function") return null;
    if (db !== spawnDbRef || !spawnDefs) {
      let all = [];
      try { all = db.all() || []; } catch (_) { all = []; }
      all.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "en") ||
        (Number(a.id) || 0) - (Number(b.id) || 0));
      spawnDbRef = db;
      spawnDefs = all;
    }
    return spawnDefs;
  }

  function spawnSlotOf(def) {
    return Math.min(5, Math.max(1, Number(def && def.slot) || 1)) - 1;
  }

  function usableWeapon(def) {
    if (!def) return false;
    if (def.family === "KNIFE" || def.family === "GRENADE") return true;
    const dmg = Number(def.damage) || Number(def.pb && def.pb.damage) || 0;
    return dmg > 0;
  }

  function spawnRow(def, slot) {
    const row = document.createElement("div");
    row.className = "pbSpawnRow";
    const tag = document.createElement("span");
    tag.className = "cl";
    tag.textContent = SPAWN_TAG[slot] || "?";
    const name = document.createElement("span");
    name.className = "nm";
    name.textContent = def.name || ("#" + def.id);
    const id = document.createElement("span");
    id.className = "id";
    id.textContent = String(def.id);
    row.append(tag, name, id);
    row.title = `${def.name || def.id} · ${def.family || def.slotName || ""} · ${def.id}`;
    row.addEventListener("click", () => spawnWeapon(def.id));
    return row;
  }

  function renderSpawnList() {
    if (!spawnList) return;
    const all = spawnCatalog();
    if (!all) {
      spawnList.innerHTML = '<div class="pbSpawnEmpty">กำลังรอฐานข้อมูลอาวุธ… เข้าแมตช์ก่อน</div>';
      if (spawnInfo) spawnInfo.textContent = "—";
      return;
    }
    const q = (spawnSearch && spawnSearch.value || "").trim().toLowerCase();
    const want = spawnSlotSel ? Number(spawnSlotSel.value) : -1;
    const allowedSet = CFG.spawnOwnedOnly ? serverAllowedSet(findPB()) : null;
    const frag = document.createDocumentFragment();
    let total = 0, shown = 0;
    for (const def of all) {
      const slot = spawnSlotOf(def);
      if (want >= 0 && slot !== want) continue;
      if (allowedSet && !allowedSet.has(Number(def.id))) continue;
      if (CFG.spawnDamageOnly && !usableWeapon(def)) continue;
      if (q) {
        const name = String(def.name || "").toLowerCase();
        if (!name.includes(q) && !String(def.id).includes(q)) continue;
      }
      total++;
      if (shown >= SPAWN_SHOW_MAX) continue;
      shown++;
      frag.appendChild(spawnRow(def, slot));
    }
    if (!shown) {
      const empty = document.createElement("div");
      empty.className = "pbSpawnEmpty";
      empty.textContent = all.length ? "ไม่พบอาวุธที่ตรงกับคำค้น" : "ฐานข้อมูลว่าง";
      frag.appendChild(empty);
    }
    spawnList.replaceChildren(frag);
    if (spawnInfo) {
      spawnInfo.textContent = `แสดง ${shown}/${total} · ทั้งหมด ${all.length} กระบอก` +
        (allowedSet ? ` · server-owned ${allowedSet.size}` : "") +
        (total > shown ? " (พิมพ์เพื่อกรอง)" : "");
    }
  }

  const SPAWN_KEYS = ["primary", "secondary", "melee", "grenade", "special"];

  function serverOwns(pb, id) {
    const sel = pb && pb.respawnMenu && pb.respawnMenu.sel;
    const all = sel && Array.isArray(sel.allItems) ? sel.allItems : null;
    if (!all) return null;
    return all.some((x) => Number(x) === Number(id));
  }

  function serverOwnedAllowed(pb, id) {
    const sel = pb && pb.respawnMenu && pb.respawnMenu.sel;
    const all = sel && Array.isArray(sel.allItems) ? sel.allItems : null;
    if (!all || !all.some((x) => Number(x) === Number(id))) return false;
    const ws = weaponSystemOf(pb);
    const db = ws && ws.db;
    let st = null;
    try { st = db && typeof db.stat === "function" ? db.stat(id) : null; } catch (_) { }
    if (!st) return false;
    const slot = Math.min(5, Math.max(1, Number(st.slot) || 1)) - 1;
    const key = SPAWN_KEYS[slot];
    try {
      if (sel && key && typeof sel.allowedId === "function") return !!sel.allowedId(key, id);
    } catch (_) { }
    return true;
  }

  /* Build the set the server itself will let you respawn with: item must be
     in the server-provided respawn inventory AND pass the class/room filter.
     Returns null until respawnMenu exists, so the list stays usable early. */
  function serverAllowedSet(pb) {
    const sel = pb && pb.respawnMenu && pb.respawnMenu.sel;
    if (!sel || !Array.isArray(sel.allItems)) return null;
    const ws = weaponSystemOf(pb);
    const db = ws && ws.db;
    const set = new Set();
    for (const raw of sel.allItems) {
      const id = Number(raw);
      if (!id) continue;
      let st = null;
      try { st = db && typeof db.stat === "function" ? db.stat(id) : null; } catch (_) { }
      let ok = true;
      if (st) {
        const slot = Math.min(5, Math.max(1, Number(st.slot) || 1)) - 1;
        const key = SPAWN_KEYS[slot];
        try { if (key && typeof sel.allowedId === "function") ok = !!sel.allowedId(key, id); } catch (_) { }
      }
      if (ok) set.add(id);
    }
    return set;
  }

  function serverSafeIds(pb, ids) {
    const sel = pb && pb.respawnMenu && pb.respawnMenu.sel;
    const all = sel && Array.isArray(sel.allItems) ? sel.allItems : null;
    if (!all) return ids;
    const set = new Set(all.map((x) => Number(x)));
    return ids.map((id) => (id && set.has(Number(id)) ? id : 0));
  }

  function loadoutIds(ws) {
    const ids = [0, 0, 0, 0, 0];
    try {
      const held = typeof ws.getHudState === "function" ? ws.getHudState().slots : null;
      if (Array.isArray(held)) {
        for (const h of held) {
          if (h && h.slot >= 0 && h.slot < 5 && h.id) ids[h.slot] = h.id;
        }
      }
    } catch (_) { }
    if (!ids.some(Boolean) && Array.isArray(ws.owned)) {
      for (let i = 0; i < 5; i++) ids[i] = Number(ws.owned[i]) || 0;
    }
    return ids;
  }

  /* The game's respawn path calls applyRespawnLoadout() BEFORE ws.reset().
     That function reads respawnMenu.sel, so updating only ws.owned is not
     enough — the old respawn pick overwrites the spawned weapon.
     We both write the menu selection and wrap applyRespawnLoadout so the
     synced set is restored even if the menu was rebuilt in between. */
  function ensureRespawnApplyHook(pb) {
    if (!pb) return;
    if (!spawnPbRef) spawnPbRef = pb;
    else if (pb !== spawnPbRef) {
      spawnPbRef = pb;
      spawnSynced = null;
      spawnPrev.clear();
      spawnProxy.clear();
      spawnPickupPrefs.clear();
      spawnReapplyUntil = 0;
    }
    if (pb.__pbSpawnApply) return;
    const orig = pb.applyRespawnLoadout;
    if (typeof orig !== "function") return;
    try { Object.defineProperty(pb, "__pbSpawnApply", { value: 1, enumerable: false }); }
    catch (_) { try { pb.__pbSpawnApply = 1; } catch (_) { } }
    pb.applyRespawnLoadout = function (...args) {
      const res = orig.apply(this, args);
      try {
        if (!spawnSynced) return res;
        const ws = typeof this.pbWeapons === "function" ? this.pbWeapons() : weaponSystemOf(this);
        if (!ws || typeof ws.equip !== "function") return res;
        for (let i = 0; i < 5; i++) {
          const id = spawnSynced[i];
          if (id && (!Array.isArray(ws.owned) || ws.owned[i] !== id)) ws.equip(id);
        }
      } catch (_) { }
      return res;
    };
  }

  /* Which weapon we want to keep in each slot (local spawns + pickup path). */
  function spawnWanted() {
    const map = new Map();
    for (const [slot, rec] of spawnPrev) {
      if (rec && rec.id) map.set(slot, Number(rec.id));
    }
    for (const [slot, id] of spawnPickupPrefs) {
      if (id && !map.has(slot)) map.set(slot, Number(id));
    }
    return map;
  }

  /* The match host only accepts items from the server's respawn inventory.
     `adoptServerLoadout()` therefore equips the server's default gun right
     after a respawn (and logs `[loadout] ...`). Put our spawned weapon back
     locally and point outgoing shots at the id the server acked (proxy), so
     the spawn survives without pretending the host accepted it. */
  function reapplySpawnLocally(pb) {
    if (!pb || pb.__pbReapplying) return 0;
    if (!pb.me || !pb.me.alive) return 0;
    const ws = weaponSystemOf(pb);
    if (!ws || !Array.isArray(ws.slots)) return 0;
    const wanted = spawnWanted();
    if (!wanted.size) return 0;
    const ack = pb.net && pb.net.localLoadout;
    let changed = 0;
    pb.__pbReapplying = true;
    try {
      for (const [slot, id] of wanted) {
        if (slot < 0 || slot > 4) continue;
        const def = ws.db && typeof ws.db.def === "function" ? ws.db.def(id) : null;
        if (!def) continue;
        const cur = ws.slots[slot] && ws.slots[slot].def && Number(ws.slots[slot].def.id);
        if (Number(cur) !== Number(id)) {
          try { if (typeof ws.equip === "function" && ws.equip(id)) changed++; } catch (_) { }
        }
        if (CFG.spawnProxy && ack) {
          const key = SPAWN_KEYS[slot];
          const acked = key ? Number(ack[key]) || 0 : 0;
          if (acked && acked !== Number(id)) {
            spawnProxy.set(slot, { spawnedId: Number(id), proxyId: acked });
          } else if (acked === Number(id)) {
            spawnProxy.delete(slot);
          }
        }
      }
    } finally {
      pb.__pbReapplying = false;
    }
    return changed;
  }

  function ensureAdoptHook(pb) {
    if (!pb || typeof pb.adoptServerLoadout !== "function") return;
    if (pb.__pbAdoptHook) return;
    try { Object.defineProperty(pb, "__pbAdoptHook", { value: 1, enumerable: false }); }
    catch (_) { try { pb.__pbAdoptHook = 1; } catch (_) { } }
    const orig = pb.adoptServerLoadout;
    pb.adoptServerLoadout = function (...args) {
      const res = orig.apply(this, args);
      try {
        if (CFG.spawnPersist !== false) {
          const n = reapplySpawnLocally(this);
          if (n) statusHold("server ใช้ loadout ของมัน — คืนปืนที่เสก + proxy", 1800);
        }
      } catch (_) { }
      return res;
    };
  }

  function pushSpawnLoadout(pb, ws, force) {
    if (!CFG.spawnSync && !force) return;
    ensureRespawnApplyHook(pb);
    const ids = spawnSynced || serverSafeIds(pb, loadoutIds(ws));
    const sel = pb && pb.respawnMenu && pb.respawnMenu.sel;
    if (sel) {
      for (const eq of [sel.equipped, sel.pending]) {
        if (!eq) continue;
        for (let i = 0; i < 5; i++) eq[SPAWN_KEYS[i]] = ids[i] || 0;
      }
      try { if (typeof sel.restore === "function") sel.restore(sel.pending ?? sel.equipped); } catch (_) { }
    }
    const net = pb && pb.net;
    if (!net || typeof net.setRespawnWeapons !== "function") return;
    try {
      net.setRespawnWeapons(ids.map((itemId) => ({ itemId: itemId || 0, objectId: 0 })));
    } catch (_) { }
  }

  /* With sync OFF the spawn is one-life: remember what the slot held and put
     it back right before the game's own refill() rebuilds the slots on death.
     With sync ON this map is cleared so the spawned weapon stays. */
  function ensureSpawnRefillHook(ws) {
    if (!ws || ws.__pbSpawnRefill) return;
    const orig = ws.refill;
    if (typeof orig !== "function") return;
    try { Object.defineProperty(ws, "__pbSpawnRefill", { value: 1, enumerable: false }); }
    catch (_) { try { ws.__pbSpawnRefill = 1; } catch (_) { } }
    ws.refill = function (...args) {
      try {
        if (CFG.spawnSync || spawnSynced) spawnPrev.clear();
        else if (!CFG.spawnPersist && spawnPrev.size && Array.isArray(this.owned)) {
          for (const [slot, rec] of spawnPrev) {
            if (this.owned[slot] === rec.id) this.owned[slot] = rec.prev;
          }
          spawnPrev.clear();
        }
      } catch (_) { }
      const res = orig.apply(this, args);
      try {
        if (CFG.spawnPersist !== false && spawnPrev.size) {
          setTimeout(() => { try { reapplySpawnLocally(findPB()); } catch (_) { } }, 250);
        }
        if (CFG.spawnReapply && CFG.spawnPickup && spawnPickupPrefs.size) {
          spawnReapplyUntil = performance.now() + 6000;
          setTimeout(() => { try { reapplySpawns(findPB()); } catch (_) { } }, 500);
        }
      } catch (_) { }
      return res;
    };
  }

  /* The server validates the respawn loadout and often gives the starting
     weapon back. Reapply the synthetic pickup after respawn: drop the default,
     create the drop for the saved weapon, pick it up, and notify the network
     again. This keeps the ground-pickup path for the whole match. */
  function reapplySpawns(pb) {
    if (!CFG.spawnReapply || !CFG.spawnPickup || !spawnPickupPrefs.size) return;
    if (!pb || !pb.me || !pb.me.alive) return;
    const ws = weaponSystemOf(pb);
    if (!ws || !Array.isArray(ws.slots)) return;
    const now = performance.now();
    if (now - lastReapplyAt < 800) return;
    lastReapplyAt = now;
    let all = true;
    for (const [slot, id] of spawnPickupPrefs) {
      if (slot < 0 || slot > 1) continue;
      const cur = ws.slots[slot] && ws.slots[slot].def && Number(ws.slots[slot].def.id);
      if (cur === Number(id)) continue;
      all = false;
      const def = ws.db && ws.db.def ? ws.db.def(id) : null;
      if (!def) continue;
      if (spawnAsPickup(pb, ws, def, slot)) {
        const curSlot = Number(ws.cur);
        if (CFG.spawnSwitch) forceWeaponDraw(ws, def, slot);
        else if (curSlot !== slot && ws.slots[curSlot]) {
          try { ws.switchTo(curSlot); } catch (_) { }
        }
        try { statusHold(`pickup: ${def.name || ("#" + id)} → ช่อง ${slot + 1} (respawn)`); } catch (_) { }
      }
    }
    if (all) spawnReapplyUntil = 0;
  }

  /* A spawn skips the normal draw pipeline: the viewmodel may keep the old
     object hidden (or none at all) because setWeapon() was called for the
     slot but its async model/rig mount did not complete. The game's own
     spawnDraw() is the intended path; if the model still is not mounted
     after it settles, retry setWeapon() instead of asking for a knife swap. */
  function viewmodelMounted(vm, def) {
    if (!vm) return false;
    if (vm.weapon && def && vm.weapon.id !== def.id) return true; // switched away
    if (vm.rigWeapon) return vm.rigWeapon.visible !== false;
    return !!vm.current;
  }

  function forceWeaponDraw(ws, def, slot) {
    const vm = ws && ws.viewmodel;
    if (!vm || vm.observing) return;
    const tokBefore = vm.token;
    try {
      if (slot >= 0 && typeof ws.spawnDraw === "function") ws.spawnDraw(slot);
      else if (slot >= 0 && typeof ws.switchTo === "function") ws.switchTo(slot);
    } catch (_) { }
    /* If spawnDraw() skipped because the viewmodel already claims this def,
       and no setWeapon() was started either, the model was never mounted.
       Safe to retry immediately (no in-flight load to cancel). */
    if (vm.token === tokBefore) {
      setTimeout(() => {
        try {
          if (vm.observing) return;
          if (vm.weapon && def && vm.weapon.id !== def.id) return;
          if (!viewmodelMounted(vm, def)) vm.setWeapon(def);
        } catch (_) { }
      }, 0);
    }
    /* Wait for the async model/rig mount before retrying, otherwise an
       early retry cancels the in-flight setWeapon() (token bump). */
    const started = performance.now();
    let retries = 0;
    const check = () => {
      try {
        if (!vm || vm.observing) return;
        if (vm.weapon && def && vm.weapon.id !== def.id) return; // switched away
        if (viewmodelMounted(vm, def)) return;
      } catch (_) { return; }
      if (performance.now() - started < 1200) { setTimeout(check, 250); return; }
      if (retries >= 2) return;
      retries++;
      try { vm.setWeapon(def); } catch (_) { }
      setTimeout(check, 800);
    };
    setTimeout(check, 250);
  }

  /* ───── online fire proxy ─────
     The match server only credits damage for the loadout it acknowledged.
     A locally spawned id is not in that loadout, so the server ignores the
     shot. Keep the spawned weapon visually/stat-wise, but tell the network
     what the slot used to hold (a weapon the server already knows). After a
     real respawn the server may accept the spawned loadout; localLoadout then
     matches the spawned id and the proxy turns itself off. */
  function legalProxyId(pb, ws, slot, prevOwned) {
    const key = SPAWN_KEYS[slot];
    if (!key) return 0;
    const ack = pb && pb.net && pb.net.localLoadout;
    let id = prevOwned ? Number(prevOwned[slot]) || 0 : 0;
    if (!id && ack) id = Number(ack[key]) || 0;
    if (!id && ws && ws.db && ws.db.defaultLoadout) id = Number(ws.db.defaultLoadout[key]) || 0;
    return id;
  }

  function proxyWeaponId(id) {
    if (!CFG.spawnProxy || !id) return id;
    const pb = findPB();
    const ws = weaponSystemOf(pb);
    if (!ws || !Array.isArray(ws.slots)) return id;
    let slot = -1;
    for (let i = 0; i < ws.slots.length && i < 5; i++) {
      const d = ws.slots[i] && ws.slots[i].def;
      if (d && Number(d.id) === Number(id)) { slot = i; break; }
    }
    if (slot < 0) return id;
    const rec = spawnProxy.get(slot);
    if (!rec || rec.spawnedId !== id) return id;
    if (rec.pickup) return id; // registered through the real drop/pickup path
    const ack = pb.net && pb.net.localLoadout;
    const key = SPAWN_KEYS[slot];
    if (ack && key && Number(ack[key]) === Number(id)) {
      spawnProxy.delete(slot); // server accepted this loadout — no masking needed
      return id;
    }
    return rec.proxyId || id;
  }

  function ensureSpawnProxyHooks(pb) {
    if (!pb) return;
    const net = pb.net;
    if (!net || net.__pbSpawnProxy) return;
    try { Object.defineProperty(net, "__pbSpawnProxy", { value: 1, enumerable: false }); }
    catch (_) { try { net.__pbSpawnProxy = 1; } catch (_) { } }

    const fire = net.sendFire;
    if (typeof fire === "function") {
      net.sendFire = function (id, ...rest) {
        let v = id;
        try { v = proxyWeaponId(id); } catch (_) { }
        return fire.call(this, v, ...rest);
      };
    }
    const state = net.sendState;
    if (typeof state === "function") {
      net.sendState = function (payload) {
        try {
          if (CFG.spawnProxy && payload && payload.weaponId) {
            const pid = proxyWeaponId(payload.weaponId);
            if (pid !== payload.weaponId) {
              payload.weaponId = pid;
              const db = weaponDbOf();
              const def = db && db.def ? db.def(pid) : null;
              if (def && def.name) payload.weapon = def.name;
            }
          }
        } catch (_) { }
        return state.call(this, payload);
      };
    }
    const reload = net.sendReload;
    if (typeof reload === "function") {
      net.sendReload = function (id, ...rest) {
        let v = id;
        try { v = proxyWeaponId(id); } catch (_) { }
        return reload.call(this, v, ...rest);
      };
    }
    const hit = net.sendHit;
    if (typeof hit === "function") {
      net.sendHit = function (payload) {
        try {
          if (CFG.spawnProxy && payload && payload.weapon &&
            payload.attackerId === (pb.me && pb.me.id)) {
            const ws = weaponSystemOf(pb);
            const cur = ws && typeof ws.current === "function" ? ws.current() : null;
            if (cur && cur.id && cur.name === payload.weapon) {
              const pid = proxyWeaponId(cur.id);
              if (pid !== cur.id) {
                const def = ws.db && ws.db.def ? ws.db.def(pid) : null;
                if (def && def.name) payload.weapon = def.name;
              }
            }
          }
        } catch (_) { }
        return hit.call(this, payload);
      };
    }
  }

  /* Ground-pickup path: create a real drop for the spawned weapon, send the
     drop + pickup events, and let ws.pickUp() put it in the slot. This is the
     same path the game uses when you walk over a gun — so the server has a
     chance to register the weapon as a legitimate acquisition (and other
     clients render it) instead of only seeing a mocked fire id.
     Only primary/secondary: the game's drop system refuses slot > 1. */
  function spawnAsPickup(pb, ws, def, slot) {
    if (!pb || !ws || !pb.me || !pb.me.alive || slot < 0 || slot > 1) return false;
    if (CFG.spawnPickup === false) return false;
    if (typeof pb.localDrop !== "function" || !pb.drops || !pb.drops.field ||
      !pb.drops.field.drops || typeof ws.pickUp !== "function" ||
      typeof ws.dropCurrent !== "function") return false;

    const prevCur = Number(ws.cur);
    let dropped = null;
    try {
      if (ws.slots[slot]) {
        if (typeof ws.switchTo === "function" && prevCur !== slot) ws.switchTo(slot);
        dropped = ws.dropCurrent(true);
        if (!dropped) {
          if (prevCur !== slot && ws.slots[prevCur]) ws.switchTo(prevCur);
          return false;
        }
        pb.localDrop(dropped.def.id, dropped.slot, dropped.ammo, dropped.reserve, false, dropped.alt);
      }
      if (ws.slots[slot]) throw new Error("slot not empty");

      const inst = typeof ws.fresh === "function" ? ws.fresh(def, slot) : null;
      const ammo = inst ? inst.ammo : Math.max(0, Number(def.loadedBullet) || 0);
      const reserve = inst ? inst.reserve : Math.max(0, Number(def.totalBullet) || 0);

      pb.localDrop(def.id, slot, ammo, reserve, false);
      let target = null;
      for (const d of pb.drops.field.drops.values()) {
        if (d && d.weaponId === def.id && d.slot === slot && d.owner === pb.me.id) {
          if (!target || d.idx > target.idx) target = d;
        }
      }
      if (!target || !ws.pickUp(def.id, ammo, reserve)) throw new Error("pickUp failed");
      if (pb.net && typeof pb.net.sendPickup === "function") {
        pb.net.sendPickup({
          actorId: pb.me.id,
          weaponId: def.id,
          slot: target.slot,
          ammo,
          extra: 0,
          reserve,
          death: false,
          idx: target.idx,
        });
      }
      pb.drops.remove(target.idx);
      return true;
    } catch (_) {
      /* put the original back if the pickup chain failed halfway */
      try {
        if (dropped && !ws.slots[slot]) ws.equip(dropped.def.id);
        if (prevCur !== slot && ws.slots[prevCur]) ws.switchTo(prevCur);
      } catch (_) { }
      return false;
    }
  }

  function spawnWeapon(rawId) {
    const id = Math.trunc(Number(rawId));
    if (!id) { statusHold("spawn: ใส่ ID ก่อน"); return false; }
    const pb = findPB();
    const ws = weaponSystemOf(pb);
    if (!ws) { statusHold("spawn: ยังไม่เข้าเกม"); return false; }
    ensureRespawnApplyHook(pb);
    ensureAdoptHook(pb);
    const db = ws.db;
    if (!db || !db.loaded) { statusHold("spawn: ฐานอาวุธยังโหลดไม่เสร็จ"); return false; }
    const def = typeof db.def === "function" ? db.def(id) : null;
    if (!def) { statusHold("spawn: ไม่พบอาวุธ ID " + id); return false; }
    const ownedOk = serverOwnedAllowed(pb, id);

    /* anti-detection: rate-limit spawns so rapid drop/pickup or equip bursts
       do not look like a script. Safe Mode also enforces proxy (no pickup). */
    const now = performance.now();
    const cooldown = CFG.safeMode
      ? Math.max(1500, Number(CFG.spawnCooldownMs) || 0)
      : Math.max(0, Number(CFG.spawnCooldownMs) || 0);
    if (now - lastSpawnAt < cooldown) {
      statusHold(`ปลอดภัย: รออีก ${Math.ceil((cooldown - (now - lastSpawnAt)) / 100) / 10}s`);
      return false;
    }
    if (CFG.safeMode) {
      spawnLog = spawnLog.filter((t) => now - t < 60000);
      const max = Math.max(1, Number(CFG.spawnMaxPerMin) || 8);
      if (spawnLog.length >= max) {
        statusHold(`ปลอดภัย: เสกครบ ${max} ครั้ง/นาทีแล้ว`);
        return false;
      }
    }

    /* primary/secondary: use the real drop → pickUp path (see spawnAsPickup) */
    const targetSlot = Math.min(5, Math.max(1, Number(def.slot) || 1)) - 1;
    if (CFG.spawnPickup !== false && !CFG.safeMode && !(CFG.spawnOwnedSync && ownedOk) &&
      (targetSlot === 0 || targetSlot === 1)) {
      try {
        const prevCur = Number(ws.cur);
        const beforeOwned = Array.isArray(ws.owned) ? ws.owned.slice() : null;
        if (spawnAsPickup(pb, ws, def, targetSlot)) {
          if (CFG.spawnSync) {
            if (Array.isArray(ws.owned)) ws.owned[targetSlot] = id;
            spawnSynced = serverSafeIds(pb, loadoutIds(ws));
            pushSpawnLoadout(pb, ws);
          } else {
            spawnSynced = null;
            spawnPrev.delete(targetSlot);
          }
          spawnPickupPrefs.set(targetSlot, id);
          const legal = legalProxyId(pb, ws, targetSlot, beforeOwned);
          if (legal && legal !== id) {
            spawnProxy.set(targetSlot, { spawnedId: id, proxyId: legal, pickup: true });
          } else {
            spawnProxy.delete(targetSlot);
          }
          if (CFG.spawnSwitch) {
            forceWeaponDraw(ws, def, targetSlot);
          } else if (prevCur !== targetSlot && ws.slots[prevCur]) {
            try { ws.switchTo(prevCur); } catch (_) { }
          } else {
            forceWeaponDraw(ws, def, targetSlot);
          }
          const sync = CFG.spawnSync ? " · sync" : "";
          const owned = serverOwns(pb, id);
          markSpawn();
          statusHold(`pickup: ${def.name || ("#" + id)} → ช่อง ${targetSlot + 1}${sync}` +
            (owned === true ? " · owned" : owned === false ? " · not-owned" : ""));
          return true;
        }
      } catch (_) { /* fall through to the local spawn below */ }
    }

    try {
      const prevOwned = Array.isArray(ws.owned) ? ws.owned.slice() : null;
      const syncOn = CFG.spawnSync || (CFG.spawnOwnedSync && ownedOk);
      ensureSpawnRefillHook(ws);
      let ok = typeof ws.equip === "function" ? !!ws.equip(id) : false;
      if (!ok && Array.isArray(ws.slots) && typeof ws.fresh === "function") {
        /* older weapon systems: same shape equip() uses internally */
        const slot = Math.min(5, Math.max(1, Number(def.slot) || 1)) - 1;
        ws.slots[slot] = ws.fresh(def, slot);
        if (Array.isArray(ws.owned)) ws.owned[slot] = id;
        if (typeof ws.startChange === "function") { try { ws.startChange(def); } catch (_) { } }
        if (ws.viewmodel && typeof ws.viewmodel.setWeapon === "function") {
          try { ws.viewmodel.setWeapon(def); } catch (_) { }
        }
        ok = true;
      }
      if (!ok) { statusHold("spawn: ใส่อาวุธไม่สำเร็จ"); return false; }
      let slot = -1;
      if (Array.isArray(ws.owned)) slot = ws.owned.lastIndexOf(id);
      if (slot < 0 && Array.isArray(ws.slots)) {
        for (let i = 0; i < ws.slots.length; i++) {
          if (ws.slots[i] && ws.slots[i].def && ws.slots[i].def.id === id) { slot = i; break; }
        }
      }
      if (slot >= 0) spawnPickupPrefs.delete(slot);
      if (slot >= 0 && prevOwned) {
        const old = prevOwned[slot];
        spawnPrev.set(slot, { id, prev: old == null ? null : old });
      }
      if (slot >= 0) {
        ensureSpawnProxyHooks(pb);
        if (CFG.spawnOwnedSync && ownedOk) {
          spawnProxy.delete(slot);
        } else {
          const old = prevOwned ? Number(prevOwned[slot]) || 0 : 0;
          const existing = spawnProxy.get(slot);
          let proxyId = existing && existing.spawnedId === old ? existing.proxyId : 0;
          if (!proxyId) proxyId = legalProxyId(pb, ws, slot, prevOwned);
          const ack = pb.net && pb.net.localLoadout;
          const known = !!ack && Object.keys(ack).some((k) => Number(ack[k]) === id);
          if (proxyId && proxyId !== id && !known) {
            spawnProxy.set(slot, { spawnedId: id, proxyId });
          } else {
            spawnProxy.delete(slot);
          }
        }
      }
      spawnSynced = syncOn ? serverSafeIds(pb, loadoutIds(ws)) : null;
      const cur = Number(ws.cur);
      if (slot >= 0 && (CFG.spawnSwitch || slot === cur)) {
        forceWeaponDraw(ws, def, slot);
      }
      pushSpawnLoadout(pb, ws, syncOn);
      const proxied = slot >= 0 && spawnProxy.has(slot);
      const owned = serverOwns(pb, id);
      const mode = (syncOn ? " · sync respawn" : " · ชีวิตนี้") +
        (proxied ? " · proxy" : "") + (CFG.safeMode ? " · safe" : "") +
        (ownedOk ? " · owned/no-proxy" : owned === true ? " · owned" : owned === false ? " · not-owned" : "") +
        (ownedOk && CFG.spawnOwnedSync ? " · respawn 1x" : "");
      const dmg = Number(def.params && def.params.damage);
      const noDmg = def.family !== "KNIFE" && def.family !== "GRENADE" && !(dmg > 0);
      markSpawn();
      statusHold(`spawn: ${def.name || ("#" + id)}${slot >= 0 ? " → ช่อง " + (slot + 1) : ""}${mode}${noDmg ? " · DMG 0!" : ""}`);
      return true;
    } catch (e) {
      statusHold("spawn: " + (e && e.message || e));
      return false;
    }
  }

  let spawnSearchTimer = 0;
  if (spawnSearch) {
    spawnSearch.addEventListener("input", () => {
      clearTimeout(spawnSearchTimer);
      spawnSearchTimer = setTimeout(renderSpawnList, 120);
    });
  }
  if (spawnSlotSel) spawnSlotSel.addEventListener("change", renderSpawnList);
  if (spawnReloadBtn) {
    spawnReloadBtn.addEventListener("click", () => {
      spawnDbRef = null;
      spawnDefs = null;
      renderSpawnList();
    });
  }
  if (spawnIdBtn) {
    spawnIdBtn.addEventListener("click", () => {
      if (spawnWeapon(spawnIdInput && spawnIdInput.value)) {
        if (spawnIdInput) spawnIdInput.value = "";
      }
    });
  }
  if (spawnIdInput) {
    spawnIdInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (spawnWeapon(spawnIdInput.value)) spawnIdInput.value = "";
      spawnIdInput.blur();
    });
  }
  const spawnSyncBox = panel.querySelector('input[data-c="spawnSync"]');
  if (spawnSyncBox) {
    spawnSyncBox.addEventListener("change", () => {
      const pb = findPB();
      const ws = weaponSystemOf(pb);
      if (spawnSyncBox.checked) {
        if (ws && (spawnPrev.size || spawnSynced)) {
          spawnSynced = serverSafeIds(pb, loadoutIds(ws));
          spawnPrev.clear();          // promote current spawns to permanent
          pushSpawnLoadout(pb, ws);
        }
        ensureRespawnApplyHook(pb);
      } else {
        spawnSynced = null;           // next refill restores pre-spawn slots
      }
    });
  }
  const ownedOnlyBox = panel.querySelector('input[data-c="spawnOwnedOnly"]');
  if (ownedOnlyBox) ownedOnlyBox.addEventListener("change", renderSpawnList);
  const damageOnlyBox = panel.querySelector('input[data-c="spawnDamageOnly"]');
  if (damageOnlyBox) damageOnlyBox.addEventListener("change", renderSpawnList);

  /* ───── safe mode / anti-detection controls ───── */
  const safeModeBox = panel.querySelector('input[data-c="safeMode"]');
  const spawnPickupBox = panel.querySelector('input[data-c="spawnPickup"]');
  if (safeModeBox) {
    safeModeBox.addEventListener("change", () => {
      if (safeModeBox.checked && CFG.spawnPickup) {
        CFG.spawnPickup = false;
        if (spawnPickupBox) spawnPickupBox.checked = false;
        saveCfg();
      }
    });
  }
  if (spawnPickupBox) {
    spawnPickupBox.addEventListener("change", () => {
      if (spawnPickupBox.checked && CFG.safeMode) {
        CFG.safeMode = false;
        if (safeModeBox) safeModeBox.checked = false;
        saveCfg();
      }
    });
  }

  const spawnCd = panel.querySelector("#pbSpawnCd");
  const spawnCdNum = panel.querySelector("#pbSpawnCdNum");
  const spawnCdVal = panel.querySelector("#pbSpawnCdVal");
  const spawnCdReset = panel.querySelector("#pbSpawnCdReset");
  const setSpawnCd = (v, save) => {
    let n = Math.round(Number(v));
    if (!isFinite(n)) n = 1500;
    n = Math.max(0, Math.min(5000, n));
    CFG.spawnCooldownMs = n;
    if (spawnCd) spawnCd.value = n;
    if (spawnCdNum) spawnCdNum.value = n;
    if (spawnCdVal) spawnCdVal.textContent = n;
    if (save) saveCfg();
  };
  if (spawnCd) spawnCd.addEventListener("input", () => setSpawnCd(spawnCd.value, true));
  if (spawnCdNum) {
    spawnCdNum.addEventListener("input", () => { if (spawnCdNum.value !== "") setSpawnCd(spawnCdNum.value, false); });
    spawnCdNum.addEventListener("change", () => setSpawnCd(spawnCdNum.value, true));
    spawnCdNum.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); setSpawnCd(spawnCdNum.value, true); spawnCdNum.blur(); }
    });
  }
  if (spawnCdReset) spawnCdReset.addEventListener("click", () => setSpawnCd(1500, true));
  setSpawnCd(CFG.spawnCooldownMs == null ? 1500 : CFG.spawnCooldownMs, false);

  const spawnMax = panel.querySelector("#pbSpawnMax");
  const spawnMaxNum = panel.querySelector("#pbSpawnMaxNum");
  const spawnMaxVal = panel.querySelector("#pbSpawnMaxVal");
  const setSpawnMax = (v, save) => {
    let n = Math.round(Number(v));
    if (!isFinite(n)) n = 8;
    n = Math.max(1, Math.min(30, n));
    CFG.spawnMaxPerMin = n;
    if (spawnMax) spawnMax.value = n;
    if (spawnMaxNum) spawnMaxNum.value = n;
    if (spawnMaxVal) spawnMaxVal.textContent = n;
    if (save) saveCfg();
  };
  if (spawnMax) spawnMax.addEventListener("input", () => setSpawnMax(spawnMax.value, true));
  if (spawnMaxNum) {
    spawnMaxNum.addEventListener("input", () => { if (spawnMaxNum.value !== "") setSpawnMax(spawnMaxNum.value, false); });
    spawnMaxNum.addEventListener("change", () => setSpawnMax(spawnMaxNum.value, true));
    spawnMaxNum.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); setSpawnMax(spawnMaxNum.value, true); spawnMaxNum.blur(); }
    });
  }
  setSpawnMax(CFG.spawnMaxPerMin == null ? 8 : CFG.spawnMaxPerMin, false);

/* ============================================================
 * 5) Panic + interval wiring (removed from panicNow / 1.5s loop)
 * ============================================================ */
    CFG.spawnProxy = false;
    CFG.spawnPickup = false;
    CFG.safeMode = true;
    spawnSynced = null;
    spawnPrev.clear();
    spawnProxy.clear();
    spawnPickupPrefs.clear();
    spawnReapplyUntil = 0;
    spawnLog = [];
    ensureRespawnApplyHook(pbNow);
    ensureAdoptHook(pbNow);
    ensureSpawnProxyHooks(pbNow);
    if (spawnReapplyUntil) { /* reapplySpawns(pbNow) */ }
    renderSpawnList();
