/*
 * PB ESP — Server Check (archived 2026-11-09)
 *
 * Removed in v1.48 because the weapon spawner is gone and these lists are no
 * longer used. The Server Owner bridge (serverAllIds / serverOwnedIds /
 * __pbOpenServerSite) stays in esp.js.
 */

/* ============================================================
 * 1) SAFETY pane markup (place before the "เปิด Server Owner" button)
 * ============================================================ */
        <div class="pbSec">Server Check</div>
        <div class="pbRow">
          <input type="number" id="pbServerId" placeholder="ID (optional)">
          <button id="pbServerCheck" type="button">CHECK</button>
        </div>
        <div class="pbRow">
          <button id="pbServerCopy" type="button">COPY ALLOWED</button>
          <button id="pbServerDb" type="button">COPY DB</button>
        </div>

/* ============================================================
 * 2) JS: server id input, serverCheck, COPY ALLOWED / COPY DB
 * ============================================================ */
  const serverIdInput = panel.querySelector("#pbServerId");
  const serverCheckBtn = panel.querySelector("#pbServerCheck");
  const serverInfoEl = panel.querySelector("#pbServerInfo");

  /* Still used by COPY ALLOWED (SAFETY): the ids the respawn UI accepts. */
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

  function serverCheck() {
    if (!serverInfoEl) return;
    const pb = findPB();
    const ws = weaponSystemOf(pb);
    if (!pb || !ws) { serverInfoEl.textContent = "ยังไม่เข้าแมตช์"; return; }
    const sel = pb.respawnMenu && pb.respawnMenu.sel;
    const ack = pb.net && pb.net.localLoadout;
    const flag = (pb.net && pb.net.weaponsFlag != null) ? pb.net.weaponsFlag : (sel && sel.weaponsFlag);
    const enforce = sel && typeof sel.enforcing === "function" ? !!sel.enforcing() : null;
    const all = sel && Array.isArray(sel.allItems) ? sel.allItems : [];
    const db = ws.db;
    const nameOf = (id) => {
      try {
        const st = db && typeof db.stat === "function" ? db.stat(id) : null;
        if (st && st.name) return st.name;
      } catch (_) { }
      return "#" + id;
    };
    const lines = [];
    lines.push(`weaponsFlag: ${flag != null ? "0x" + Number(flag).toString(16) + " (" + flag + ")" : "?"}` +
      (enforce === true ? " · จำกัดคลาส" : enforce === false ? " · เปิดทุกคลาส" : ""));
    if (ack) {
      lines.push(`ack loadout: P=${ack.primary || 0} S=${ack.secondary || 0} M=${ack.melee || 0} G=${ack.grenade || 0} X=${ack.special || 0}`);
    }
    lines.push(`inventory (respawn): ${all.length} items`);
    if (sel && Array.isArray(sel.lists)) {
      for (let i = 0; i < 5; i++) {
        const list = (sel.lists[i] || []).filter((x) => x);
        const names = list.slice(0, 8).map((x) => `${nameOf(x)}(${x})`);
        lines.push(`${SPAWN_KEYS[i]}: ${list.length}${names.length ? " · " + names.join(", ") : ""}${list.length > 8 ? " …" : ""}`);
      }
    }
    let checkId = Number(serverIdInput && serverIdInput.value) || 0;
    if (checkId) {
      const st = db && typeof db.stat === "function" ? db.stat(checkId) : null;
      const slot = st ? Math.min(5, Math.max(1, Number(st.slot) || 1)) - 1 : -1;
      const key = SPAWN_KEYS[slot] || "";
      const inAll = all.some((x) => Number(x) === Number(checkId));
      let allowed = null;
      try {
        if (sel && key && typeof sel.allowedId === "function") allowed = !!sel.allowedId(key, checkId);
      } catch (_) { }
      lines.push(`check ${nameOf(checkId)} (${checkId}): inventory=${inAll ? "YES" : "NO"} · allowed=${allowed === null ? "?" : allowed ? "YES" : "NO"}`);
    }
    serverInfoEl.textContent = lines.join("\n");
  }
  if (serverCheckBtn) serverCheckBtn.addEventListener("click", serverCheck);

  function fallbackCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0;";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (_) { return false; }
  }

  function copyText(text, label) {
    const done = (ok) => {
      if (serverInfoEl) serverInfoEl.textContent = `${label}: ${ok ? "คัดลอกแล้ว" : "คัดลอกไม่ได้"} · ${text.length} chars`;
    };
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).then(() => done(true)).catch(() => done(fallbackCopy(text)));
        return;
      }
    } catch (_) { }
    done(fallbackCopy(text));
  }

  function csvName(name) {
    return String(name || "").replace(/[,\r\n]+/g, " ").trim();
  }

  function copyAllowed() {
    const pb = findPB();
    const ws = weaponSystemOf(pb);
    const set = serverAllowedSet(pb);
    if (!set) { if (serverInfoEl) serverInfoEl.textContent = "ยังไม่เข้าแมตช์ / ยังไม่มี respawn inventory"; return; }
    const db = ws && ws.db;
    const rows = ["slot,id,name,damage"];
    const list = [...set].sort((a, b) => a - b);
    for (const id of list) {
      const st = db && typeof db.stat === "function" ? db.stat(id) : null;
      if (!st) continue;
      const slot = Math.min(5, Math.max(1, Number(st.slot) || 1)) - 1;
      const dmg = Number(st.damage) || Number(st.pb && st.pb.damage) || 0;
      rows.push(`${SPAWN_KEYS[slot]},${id},${csvName(st.name)},${dmg}`);
    }
    copyText(rows.join("\n"), `allowed ${list.length}`);
  }

  function copyDb() {
    const pb = findPB();
    const ws = weaponSystemOf(pb);
    const db = ws && ws.db;
    const ids = serverAllIds(pb);
    if (!ids.length) { if (serverInfoEl) serverInfoEl.textContent = "ฐานอาวุธยังโหลดไม่เสร็จ"; return; }
    const rows = ["slot,id,name,family,damage"];
    let n = 0;
    for (const id of ids) {
      let st = null;
      try { st = db && typeof db.stat === "function" ? db.stat(id) : null; } catch (_) { }
      if (!st) continue;
      const slot = Math.min(5, Math.max(1, Number(st.slot) || 1)) - 1;
      const dmg = Number(st.damage) || Number(st.pb && st.pb.damage) || 0;
      rows.push(`${SPAWN_KEYS[slot]},${st.id},${csvName(st.name)},${st.family || ""},${dmg}`);
      n++;
    }
    copyText(rows.join("\n"), `DB usable ${n}`);
  }

  const serverCopyBtn = panel.querySelector("#pbServerCopy");
  const serverDbBtn = panel.querySelector("#pbServerDb");
  if (serverCopyBtn) serverCopyBtn.addEventListener("click", copyAllowed);
  if (serverDbBtn) serverDbBtn.addEventListener("click", copyDb);

  function usableStat(st) {
    if (!st) return false;
    if (st.className === "Equipment") return false;
    const fam = st.family || "";
    const dmg = Number(st.damage) || Number(st.pb && st.pb.damage) || 0;
    return fam === "KNIFE" || fam === "GRENADE" || dmg > 0;
  }

  /* Every usable weapon in the game's server-side weapon table
     (`ws.db.all()` = weapons.json), not just the player's inventory. */
  function serverAllIds(pb) {
    const ids = [];
    const seen = new Set();
    try {
      const ws = pb && typeof pb.pbWeapons === "function" ? pb.pbWeapons() : null;
      const db = ws && ws.db;
      if (db && typeof db.all === "function") {
        for (const st of db.all()) {
          const id = Number(st && st.id);
          if (!id || seen.has(id) || !usableStat(st)) continue;
          seen.add(id);
          ids.push(id);
        }
      }
    } catch (_) { }
    return ids;
  }

  /* Only the items in this account's server-provided respawn inventory. */
  function serverOwnedIds(pb) {
    const ids = [];
    const seen = new Set();
    try {
      const ws = pb && typeof pb.pbWeapons === "function" ? pb.pbWeapons() : null;
      const sel = pb && pb.respawnMenu && pb.respawnMenu.sel;
      const db = ws && ws.db;
      const add = (raw) => {
        const id = Number(raw);
        if (!id || seen.has(id)) return;
        let st = null;
        try { st = db && typeof db.stat === "function" ? db.stat(id) : null; } catch (_) { }
        if (!st || !usableStat(st)) return;
        const slot = Math.min(5, Math.max(1, Number(st.slot) || 1)) - 1;
        const key = SPAWN_KEYS[slot];
        try {
          if (sel && key && typeof sel.allowedId === "function" && !sel.allowedId(key, id)) return;
        } catch (_) { }
        seen.add(id);
        ids.push(id);
      };
      if (sel && Array.isArray(sel.allItems)) {
        for (const x of sel.allItems) add(x);
      } else if (pb && pb.net && pb.net.localLoadout) {
        for (const x of Object.values(pb.net.localLoadout)) add(x);
      }
    } catch (_) { }
    return ids;
  }
