/* PB ESP - TH (page-world)
   - วาด ESP ผ่าน canvas ทับจอ
   - มี GUI ลากได้ + เปิด/ปิดทีละฟีเจอร์ได้
   - อ่าน state จาก window.__pb (หน้าเกมจริง) — ไม่ส่งอะไรกลับเซิร์ฟ */
(() => {
  "use strict";

  /* ---------- MOBILE BYPASS INIT (navigator/matchMedia ถูกจัดการโดย mobile-spoof.js แล้ว) ---------- */
  // mobile-spoof.js ถูก inject ก่อนผ่าน manifest world:"MAIN" ที่ document_start
  // esp.js โหลดทีหลัง ดังนั้นส่วน navigator spoof ย้ายไปอยู่ที่ mobile-spoof.js แล้ว
  // esp.js จัดการเฉพาะส่วน runtime hooks (hookMobileBypass, hookNoRecoil, ESP draw)

  const CFG = {
    enabled: true, box: false, hpBar: false, name: false, distance: true,
    snapline: false, headDot: true, showMe: false, showAlly: false,
    noRecoil: false, noSpread: false, nrComp: 0,   // ตัวคูณชดเชยแนวตั้ง 0=1x, 24=3x (ES-module client)
    recoilLevel: 100,   // % การลดแรงดีด (100 = ตัดเต็ม, 0 = ปล่อยเต็ม)
    spreadLevel: 100,   // % การลด spread (100 = ตรงเป๊ะ, 0 = ปล่อยเต็ม)
    // --- เพิ่มฟีเจอร์ใหม่ ---
    skeleton: false,     // วาดโครงข้อต่อตัวละติ (ปิด default เพื่อลด lag — เปิดได้ใน GUI)
    perfMode: false,    // Performance mode: ปิดฟีเจอร์หนัก (skeleton/box/hp/name/humanize) พร้อมกัน
    // สี/สไลล์โครง (ส่งผลเฉพาะ skeleton เท่านั้น)
    skeletonColor: "~", // "~" = ใช้ enemyColor (แดง) หรือ allyColor (เขียว) ตาม default
    //                 ใส่รหัสสี Hex เช่น "#ffaa00" เพื่อกำหนดเอง
    //                 ใส่ "random" เพื่อให้สีเปลี่ยนทุกเฟรม (สำหรับ debug)
    /* the checkbox has to show what was actually stored, otherwise it lies after
       a reload (it would tick itself back on while the spoof stays off) */
    fakeMobile: (function () {
      try { return localStorage.getItem("pbFakeMobile") !== "0"; } catch (_) { return true; }
    })(), // Bypass ตรวจจับ PC / ปลดล็อคห้องเฉพาะ Mobile
    // Humanization
    humanize: false,
    humanPitchAmp: 0.55,
    humanPitchSign: -1, // -1 = เด้งขึ้น (ค่าเริ่มต้น), 1 = เด้งลง
    humanYawAmp: 0.18,
    humanReturnMs: 140,
    humanSpreadDeg: 0.06,
    humanNet: 0.35,   // องศา: สะบัดที่ "เน็ตเวิร์กเห็น" (คนดู/สเปกเห็น) 0 = ปิด
    // Aimbot
    aimAssist: true,   // เปิด/ปิด (F7)
    aimMode: "bot",  // "bot" = aimbot เต็มตัว (ล็อคอัตโนมัติ) | "assist" = assist เดิม (ต้องลากใกล้เอง)
    aimFov: 180.0,  // FOV วงกลม (degree) ที่ scan หาศัตรู — bot mode = 180 = ทั้งจอ
    aimSmooth: 6.0,    // smoothness: ยิ่งสูง = กล้องเข้าหาเป้าเร็วขึ้น (1=นุ่มสุด, 20=เกือบ snap)
    aimBone: "head", // head | neck | chest | pelvis | hand | upperarm | forearm | thigh | shin | foot | auto
    aimBlock: [], // parts that must never be locked (head, body, hand, thigh, ...)
    aimVisibleOnly: true,   // ไม่ล็อคทะลุกำแพง (raycast จริง)
    fastSwap: false,        // เปลี่ยนปืนเร็ว
    swapMs: 250,            // เวลาเปลี่ยนปืนที่ต้องการ (ms) — default 250
    statBonus: false,       // เปิดโบนัส reload/swap โดยไม่ต้องใส่ไอเทม
    swapProfile: "custom",  // "custom" | "item:<id>" | "off"
    reloadProfile: "custom",// "custom" | "item:<id>" | "off"
    bonusReload: 0.25,      // 0..0.9 — ค่าจริงของไอเท็มรีโหลดไว = 0.25
    bonusSwap: 0.5,         // 0..0.9
    acShield: true,         // ทิ้ง packet รายงาน anti-cheat (opcode 9007)
    panicOnAc: false,       // panic ทันทีถ้า AC ยังแจ้งเตือน (ผ่าน path อื่น)
    aimDrawFov: true,   // วาดวงกลม FOV
    aimDrawLock: true,  // วาดจุดล็อค (วงกลม/กากบาทที่ joint)
    aimDrawLink: true,  // เส้นจากกลางจอไปจุดล็อค
    aimDrawPart: false, // แสดงชื่อส่วนที่ล็อค (head/body/arm/...)
    aimOnHold: false,  // true = ต้องกดปุ่มค้างเพื่อ aim / false = auto ตลอด
    aimPriority: "angle",// "angle" = ใกล้ crosshair มากที่สุด | "dist" = ระยะใกล้ตัวที่สุด
    aimHoldButton: "rmb", // ปุ่มที่ต้องกดค้าง: rmb | mmb | lmb | shift | caps
    aimLock: true,     // ล็อคเป้าเดิมไว้ ลดอาการสลับเป้า
    aimSmartZone: true,// ถ้าจุดที่เลือกโดนบัง → ยิงจุดที่เห็นจริงแทน (หัว/อก/แขน)
    aimPredictMs: 30,  // lead time (ms) ชดเชยความหน่วงของ netcode (moving target: 30-50 แนะนำ)
    aimTrack: 1.0,     // feedforward ชดเชยเป้าที่เดิน/วิ่ง (0=ปิด, 1=เต็ม, >1=นำเป้า)
    aimVisTolerance: 0.12, // เมตร: เผื่อ ray ชนขอบสิ่งกีดขวางเล็ก ๆ (0 = เข้มสุด)
    allyColor: "#3fff3f", enemyColor: "#ff3030",
    deadAlpha: 0.35, eyeStand: 1.85, eyeCrouch: 1.05,
    espThickness: 2, espMaxDist: 200, espNameSize: 13,
    showFps: false, fpsStyle: "box", fpsLabel: true, unlockFps: false, fpsCapMode: "auto",
  };
  const VERSION = "v1.69";
  const DEG = Math.PI / 180;

  /* ---------- config persistence ---------- */
  const CFG_KEY = "pbEspCfg_v2";
  function loadCfg() {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const k of Object.keys(CFG)) {
        if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
        if (typeof data[k] !== "object" || Array.isArray(data[k])) CFG[k] = data[k];
      }
    } catch (_) { }
  }
  function saveCfg() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(CFG)); } catch (_) { }
  }
  loadCfg();

  /* ---------- UI state (panel position / active tab) ---------- */
  const UI_KEY = "pbEspUi_v1";
  function loadUi() {
    try { return JSON.parse(localStorage.getItem(UI_KEY) || "{}") || {}; } catch (_) { return {}; }
  }
  function saveUi(patch) {
    try {
      const next = { ...loadUi(), ...patch };
      localStorage.setItem(UI_KEY, JSON.stringify(next));
    } catch (_) { }
  }
  const savedUi = loadUi();

  /* ---------- overlay canvas ---------- */
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000;";
  (document.body || document.documentElement).appendChild(cv);
  const ctx = cv.getContext("2d");
  const fit = () => {
    cv.width = Math.max(1, innerWidth * devicePixelRatio);
    cv.height = Math.max(1, innerHeight * devicePixelRatio);
    cv.style.width = innerWidth + "px";
    cv.style.height = innerHeight + "px";
  };
  fit();
  addEventListener("resize", fit);

  /* The game may be hosted in the top window or in a same-origin match
     iframe (the site uses ?matchframe / ?matchsplit variants). esp.js can be
     injected into the shell frame while __pb lives in a child frame, which
     used to leave the panel stuck on “รอเข้าแมตช์”. Find the actual game
     object instead of assuming window.__pb. */
  function findPB() {
    try { if (window.__pb) return window.__pb; } catch (_) { }
    try { if (window.parent && window.parent !== window && window.parent.__pb) return window.parent.__pb; } catch (_) { }
    try { if (window.top && window.top !== window && window.top.__pb) return window.top.__pb; } catch (_) { }
    try {
      for (let i = 0; i < window.frames.length; i++) {
        try { if (window.frames[i].__pb) return window.frames[i].__pb; } catch (_) { }
      }
    } catch (_) { }
    return null;
  }
  function findRenderer() {
    try { if (window.__pbR) return window.__pbR; } catch (_) { }
    try { if (window.parent && window.parent !== window && window.parent.__pbR) return window.parent.__pbR; } catch (_) { }
    try { if (window.top && window.top !== window && window.top.__pbR) return window.top.__pbR; } catch (_) { }
    try {
      for (let i = 0; i < window.frames.length; i++) {
        try { if (window.frames[i].__pbR) return window.frames[i].__pbR; } catch (_) { }
      }
    } catch (_) { }
    return null;
  }

  /* ---------- คณิต project 3D -> 2D (คูณ matrix เอง) ---------- */
  const clip = new Float64Array(16);
  const out = new Float64Array(4), inp = new Float64Array(4);
  function projectManual(x, y, z, cam) {
    const mv = cam.matrixWorldInverse.elements, pj = cam.projectionMatrix.elements;
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      clip[c * 4 + r] = pj[r] * mv[c * 4] + pj[4 + r] * mv[c * 4 + 1] + pj[8 + r] * mv[c * 4 + 2] + pj[12 + r] * mv[c * 4 + 3];
    }
    inp[0] = x; inp[1] = y; inp[2] = z; inp[3] = 1;
    for (let k = 0; k < 4; k++) {
      out[k] = clip[k * 4] * inp[0] + clip[k * 4 + 1] * inp[1] + clip[k * 4 + 2] * inp[2] + clip[k * 4 + 3] * inp[3];
    }
    if (out[3] <= 0) return false;
    return {
      x: (out[0] / out[3] * 0.5 + 0.5) * cv.width,
      y: (-out[1] / out[3] * 0.5 + 0.5) * cv.height,
    };
  }

  /* ฉายผ่าน "vector class ของเกมเอง" (ตัวเดียวกับที่เกมใช้แปะ nametag) — ทางเลือกแรก
     เพราะต่อให้สูตรเราถูก เกมยังอาจโยน offset/viewport พิเศษที่สูตรพึ่งพา internal state
     ไม่มีเวกเตอร์เกม (ยังไม่เข้า match) ค่อย fallback เป็น manual */
  let engVec = null, engVecPB = null;
  function project(x, y, z, cam) {
    const pbNow = findPB();
    if (engVecPB !== pbNow) { engVec = null; engVecPB = pbNow; }  // match ใหม่ → เก็บ vector ใหม่
    if (!engVec) {
      const c = pbNow?.nameTags?.v ?? pbNow?._v;
      if (c && typeof c.project === "function") engVec = c;
      else window.__pbEvecFail = 1;
    }
    if (engVec) {
      engVec.x = x; engVec.y = y; engVec.z = z;
      engVec.project(cam);
      if (engVec.z > 1) return false;                 // เงื่อนไขเดียวกับที่เกมใช้
      return {
        x: (engVec.x * .5 + .5) * cv.width,
        y: (-engVec.y * .5 + .5) * cv.height,
      };
    }
    return projectManual(x, y, z, cam);
  }
  /* อ่านตำแหน่ง "เท้า" ของ actor แบบเดียวกับที่เกม (นามแท็ก) ใช้เอง:
     ให้น้ำหนัก visualRoot.position (โมเดลที่ render จริง, netcode ขยับทุกเฟรม) ก่อนเสมอ
     แล้วค่อย fallback เป็น pos/curFeet — ของเดิมเราอ่าน .pos (ค่า network ล่าช้า) ก่อน = กล่องตามช้ากว่าโมเดล */
  function actorsOf(pb) {
    if (!pb) return [];
    const now = performance.now();
    if (pb.__espActorsCache && now - pb.__espActorsT < 16) return pb.__espActorsCache;
    let actors = [];
    try { actors = pb.actors?.() ?? []; } catch (_) {
      actors = [...(pb.remotes?.values() ?? []), ...(pb.bots ?? [])];
    }
    pb.__espActorsCache = actors;
    pb.__espActorsT = now;
    return actors;
  }
  function posOfActor(a, outP) {
    const r = a.visualRoot ?? a.visual?.root;
    if (r) {
      try {
        r.updateWorldMatrix(true, false);
        const e = r.matrixWorld.elements;
        outP[0] = e[12]; outP[1] = e[13]; outP[2] = e[14];
        if (isFinite(outP[0]) && isFinite(outP[1]) && isFinite(outP[2])) return true;
      } catch (_) { }
    }
    const p = a.pos ?? a.target ?? a.curFeet ?? a.visualFeet;
    if (!p) return false;
    if (Array.isArray(p)) { outP[0] = p[0]; outP[1] = p[1]; outP[2] = p[2]; }
    else { outP[0] = p.x; outP[1] = p.y; outP[2] = p.z; }
    return isFinite(outP[0]) && isFinite(outP[1]) && isFinite(outP[2]);
  }

  /* ---- ground truth แท้: ดัก ff.place ของเกม (ตัวแปะ nametag) เพื่อจับคู่
         (actor, จุดฉายที่เกมคำนวณสด ๆ เอง) — จับคู่ด้วย identity ของ actor
         ไม่ใช่แบบ match name จาก div เดิม (แม่นกว่ามาก) ---- */
  const gtMap = new Map();
  function wrapPlace() {
    const nt = findPB()?.nameTags;
    if (!nt || nt.__espWrap) return;
    nt.__espWrap = 1;
    const orig = nt.place;
    nt.place = function (t, e, s, i, o, a) {
      const res = orig.call(this, t, e, s, i, o, a);
      try {
        if (s) {
          if (gtMap.size > 40) gtMap.clear();
          gtMap.set(s, { x: this.v.x, y: this.v.y, cam: e });
        }
      } catch (err) { }
      return res;
    };
  }

  /* ---------- GUI: แผงควบคุมลากได้ ---------- */
  const panel = document.createElement("div");
  panel.innerHTML = `
    <div id="pbh">
      <span id="pbTitle">PB ESP v1.69</span>
      <span id="pbMasterChip" title="เปิด/ปิด ESP (F8)">ESP ON</span>
      <span id="pbAcChip" title="สถานะ AC shield — คลิกเพื่อไปแท็บ SAFETY">AC</span>
      <span id="pbX">×</span>
    </div>
    <div id="pbTabs">
      <button data-tab="core">CORE</button>
      <button data-tab="combat">COMBAT</button>
      <button data-tab="aim">AIM</button>
      <button data-tab="esp">ESP</button>
      <button data-tab="weapon">WEAPON</button>
      <button data-tab="safety">SAFETY</button>
    </div>
    <div id="pbBody">

      <div class="pbPane" data-pane="core">
        <div class="pbSec">ตัวนับ FPS</div>
        <label><input type="checkbox" data-c="unlockFps"> ปลดล็อก FPS (ถ้าเกม/เบราว์เซอร์รองรับ)</label>
        <label>เพดานเฟรม
          <select id="pbFpsCapSel">
            <option value="auto">ตามจอ (auto)</option>
            <option value="60">60</option>
            <option value="75">75</option>
            <option value="90">90</option>
            <option value="120">120</option>
            <option value="144">144</option>
            <option value="165">165</option>
            <option value="240">240</option>
            <option value="0">ไม่จำกัด (0)</option>
          </select>
        </label>
        <div class="pbHelp">เพดานเฟรมเขียนลง settings ของเกม · ตั้งเท่า refresh rate จอเพื่อลดอาการภาพฉีก (tearing)</div>
        <label><input type="checkbox" data-c="showFps"> แสดง FPS</label>
        <label>สไตล์ FPS <select id="pbFpsStyle"><option value="plain">เรียบ</option><option value="box">กล่อง</option><option value="neon">นีออน</option></select></label>
        <label><input type="checkbox" data-c="fpsLabel"> แสดงคำว่า FPS</label>
        <div class="pbHelp" id="pbFpsInfo">FPS setting: —</div>
        <div class="pbSec">มือถือ / Spoof</div>
        <label><input type="checkbox" data-c="fakeMobile"> ปลอมเป็น Mobile</label>
      </div>

      <div class="pbPane" data-pane="combat" style="display:none">
        <div class="pbSec">Recoil</div>
        <label><input type="checkbox" data-c="noRecoil"> ไร้แรงดีด (F9)</label>
        <label style="display:block;font-size:10px;color:#9ab">ระดับลดแรงดีด: <b id="pbRecLvlVal">100</b>%
          <input type="range" id="pbRecLvl" min="0" max="100" step="1" value="100" style="width:100%">
          <input type="number" id="pbRecLvlNum" min="0" max="100" step="1" value="100"
            style="width:70px;background:#160d10;color:#f4e7e9;border:1px solid #45262c;border-radius:0;font:600 10px 'Segoe UI';padding:2px 5px;text-align:right">
        </label>
        <div class="pbHelp">ตัดแรงดีด/กล้องสะบัดตอนยิง — ไม่เกี่ยวกับความแม่น · default 100%</div>
        <label><input type="checkbox" data-c="humanize"> Humanize (สะบัดปลอม)</label>
        <label>ทิศสะบัด
          <select id="pbHumanDir">
            <option value="-1">ขึ้น</option>
            <option value="1">ลง</option>
          </select>
        </label>
        <label>ความแรงสะบัด <span id="pbHumanAmpVal">0.55</span>°
          <input type="range" id="pbHumanAmp" min="0" max="1.5" step="0.05" value="0.55">
        </label>
        <div class="pbHelp">kick หลอกที่กล้องตอน render เท่านั้น</div>
        <label style="display:block;font-size:10px;color:#9ab">สะบัดให้คนดูเห็น: <b id="pbHumanNetVal">0.35</b>°
          <input type="range" id="pbHumanNet" min="0" max="1.5" step="0.05" value="0.35" style="width:100%">
        </label>
        <div class="pbHelp">ใส่ offset เล็ก ๆ ลง pitch/yaw จริงหลังยิง → คนที่สเปกดูเห็นปืนสะบัด ไม่นิ่งผิดปกติ (0 = ปิด)</div>
        <div class="pbSec">Spread</div>
        <label><input type="checkbox" data-c="noSpread"> กระสุนตรง (NoSpread)</label>
        <label style="display:block;font-size:10px;color:#9ab">ระดับกระสุนตรง: <b id="pbSprLvlVal">100</b>%
          <input type="range" id="pbSprLvl" min="0" max="100" step="1" value="100" style="width:100%">
          <input type="number" id="pbSprLvlNum" min="0" max="100" step="1" value="100"
            style="width:70px;background:#160d10;color:#f4e7e9;border:1px solid #45262c;border-radius:0;font:600 10px 'Segoe UI';padding:2px 5px;text-align:right">
        </label>
        <div class="pbHelp">ตัดการกระจายกระสุน (xhPrev = 0) · default 100%</div>
      </div>

      <div class="pbPane" data-pane="aim" style="display:none">
        <div class="pbSec">Aimbot</div>
        <label><input type="checkbox" data-c="aimAssist"> เปิด Aimbot (F7)</label>
        <div class="pbSeg">
          <label><input type="radio" name="aimMode" value="bot" ${CFG.aimMode === "bot" ? "checked" : ""}> Full Bot</label>
          <label><input type="radio" name="aimMode" value="assist" ${CFG.aimMode === "assist" ? "checked" : ""}> Assist</label>
        </div>
        <div class="pbRow" id="pbAimPresets">
          <button type="button" data-preset="rifle">RIFLE</button>
          <button type="button" data-preset="sniper">SNIPER</button>
          <button type="button" data-preset="shotgun">SHOTGUN</button>
          <button type="button" data-preset="default">ค่าเริ่มต้น</button>
        </div>
        <label><input type="checkbox" data-c="aimVisibleOnly"> ไม่ทะลุกำแพง</label>
        <label><input type="checkbox" data-c="aimOnHold"> กดปุ่มค้างเพื่อ aim</label>
        <label><input type="checkbox" data-c="aimLock"> ล็อกเป้า (Target Lock)</label>
        <div class="pbHelp">รักษาเป้าเดิมเมื่อยังอยู่ใน FOV</div>
        <label><input type="checkbox" data-c="aimSmartZone"> Smart Zone</label>
        <div class="pbHelp">ถ้าจุดที่เลือกโดนบัง → เลือกจุดที่เห็นแทน</div>
        <label>ปุ่มกดค้าง
          <button id="pbHoldBind" type="button">RMB</button>
        </label>
        <div class="pbHelp">คลิกแล้วกดปุ่ม/เมาส์ที่ต้องการ (Esc ยกเลิก)</div>
        <div class="pbSec">ตัวช่วยแสดง</div>
        <label><input type="checkbox" data-c="aimDrawFov"> วงกลม FOV</label>
        <label><input type="checkbox" data-c="aimDrawLock"> จุดล็อค (bone)</label>
        <label><input type="checkbox" data-c="aimDrawLink"> เส้น crosshair → จุดล็อค</label>
        <label><input type="checkbox" data-c="aimDrawPart"> ชื่อส่วนที่ล็อค</label>
        <div class="pbSec">ปรับละเอียด</div>
        <label>FOV <span id="pbFovVal">${CFG.aimFov}</span>°
          <input type="range" id="pbFovSlider" min="1" max="180" step="1" value="${CFG.aimFov}">
        </label>
        <div class="pbHelp">FOV เป็นขนาดบนจอ — ซูม/สโคปแล้ววงไม่ขยาย (อิง fov ปกติของกล้อง)</div>
        <label>Smooth <span id="pbSmVal">${CFG.aimSmooth}</span>
          <input type="range" id="pbSmSlider" min="1" max="20" step="0.5" value="${CFG.aimSmooth}">
        </label>
        <label>Prediction <span id="pbPredVal">${CFG.aimPredictMs}</span> ms
          <input type="range" id="pbPredSlider" min="0" max="250" step="5" value="${CFG.aimPredictMs}">
        </label>
        <label>Tracking <span id="pbTrackVal">${CFG.aimTrack}</span>
          <input type="range" id="pbTrackSlider" min="0" max="1.5" step="0.1" value="${CFG.aimTrack}">
        </label>
        <label>เผื่อสิ่งกีดขวาง <span id="pbVisTolVal">${CFG.aimVisTolerance}</span> m
          <input type="range" id="pbVisTol" min="0" max="0.35" step="0.01" value="${CFG.aimVisTolerance}">
        </label>
        <div class="pbHelp">ยิงลอดขอบ/ราว/สิ่งกีดขวางเล็ก ๆ — 0 = เข้มที่สุด, 0.12 = ค่าเริ่มต้น</div>
        <label>ลำดับเป้า
          <select id="pbPrioSelect">
            <option value="angle" ${CFG.aimPriority === "angle" ? "selected" : ""}>ใกล้ crosshair</option>
            <option value="dist" ${CFG.aimPriority === "dist" ? "selected" : ""}>ระยะใกล้ตัว</option>
            <option value="hp" ${CFG.aimPriority === "hp" ? "selected" : ""}>HP น้อยสุด</option>
          </select>
        </label>
        <label>จุดเล็ง
          <select id="pbBoneSelect">
            <option value="head">Head</option>
            <option value="neck">Neck</option>
            <option value="chest">Chest</option>
            <option value="pelvis">Pelvis</option>
            <option value="upperarm">ต้นแขน</option>
            <option value="forearm">ปลายแขน</option>
            <option value="hand">มือ</option>
            <option value="thigh">ต้นขา</option>
            <option value="shin">น่อง</option>
            <option value="foot">เท้า</option>
            <option value="auto">Auto (อัจฉริยะ)</option>
          </select>
        </label>
        <div class="pbSec">ห้ามล็อค</div>
        <div class="pbBlockGrid">
          <label><input type="checkbox" data-block="head"> หัว</label>
          <label><input type="checkbox" data-block="neck"> คอ</label>
          <label><input type="checkbox" data-block="body"> ลำตัว</label>
          <label><input type="checkbox" data-block="upperarm"> ต้นแขน</label>
          <label><input type="checkbox" data-block="forearm"> ปลายแขน</label>
          <label><input type="checkbox" data-block="hand"> มือ</label>
          <label><input type="checkbox" data-block="thigh"> ต้นขา</label>
          <label><input type="checkbox" data-block="shin"> น่อง</label>
          <label><input type="checkbox" data-block="foot"> เท้า</label>
        </div>
        <div class="pbHelp">Auto จะเลี่ยงส่วนที่ติ๊กไว้ และเลือกส่วนที่เห็นจริงใกล้ crosshair</div>
        <div class="pbHelp">ค่าเริ่มต้น: FOV 180 · Smooth 6 · Prediction 30 · Tracking 1.0</div>
      </div>

      <div class="pbPane" data-pane="weapon" style="display:none">
        <div class="pbSec">สลับปืนเร็ว</div>
        <label><input type="checkbox" data-c="fastSwap"> เปลี่ยนปืนเร็ว</label>
        <div class="pbHelp">ย่อเวลาเปลี่ยนปืนเหลือค่าที่ตั้ง (เฉพาะตอนกำลังเปลี่ยน)</div>
        <label>เวลาสลับ <span id="pbSwapVal">250</span> ms
          <input type="range" id="pbSwapSlider" min="50" max="1500" step="10" value="250">
        </label>
        <div class="pbRow">
          <input type="number" id="pbSwapNum" min="50" max="1500" step="10" value="250">
          <button id="pbSwapReset" type="button">รีเซ็ต</button>
          <span class="pbHelp" style="margin:0">default 250</span>
        </div>

        <div class="pbSec">โบนัส — สลับปืน</div>
        <label><input type="checkbox" data-c="statBonus"> เปิดโบนัส (ไม่ต้องมีไอเทม)</label>
        <label>โปรไฟล์สับไว
          <select id="pbSwapProfile"><option value="custom">กำหนดเอง</option></select>
        </label>
        <div class="pbHelp" id="pbSwapCalc">—</div>
        <label>Swap bonus <span id="pbBonusSVal">0.50</span>
          <input type="range" id="pbBonusSSlider" min="0" max="0.9" step="0.01" value="0.5">
        </label>
        <div class="pbRow">
          <input type="number" id="pbBonusSNum" min="0" max="0.9" step="0.01" value="0.5">
        </div>

        <div class="pbSec">โบนัส — รีโหลด</div>
        <label>โปรไฟล์รีโหลดไว
          <select id="pbReloadProfile"><option value="custom">กำหนดเอง</option></select>
        </label>
        <div class="pbHelp" id="pbReloadCalc">—</div>
        <label>Reload bonus <span id="pbBonusRVal">0.50</span>
          <input type="range" id="pbBonusRSlider" min="0" max="0.9" step="0.01" value="0.5">
        </label>
        <div class="pbRow">
          <input type="number" id="pbBonusRNum" min="0" max="0.9" step="0.01" value="0.5">
          <button id="pbBonusReset" type="button">รีเซ็ต</button>
          <span class="pbHelp" style="margin:0">default 0.50 / 0.25</span>
        </div>
      </div>

      <div class="pbPane" data-pane="esp" style="display:none">
        <div class="pbSec">ออฟเลย์</div>
        <label><input type="checkbox" data-c="box"> กรอบตัว</label>
        <label><input type="checkbox" data-c="hpBar"> แถบ HP</label>
        <label><input type="checkbox" data-c="name"> ชื่อ + ระยะ</label>
        <label><input type="checkbox" data-c="headDot"> จุดหัว</label>
        <label><input type="checkbox" data-c="skeleton"> โครงข้อต่อ</label>
        <label><input type="checkbox" data-c="snapline"> เส้นชี้เป้า</label>
        <label><input type="checkbox" data-c="showAlly"> แสดงเพื่อนร่วมทีม</label>
        <label><input type="checkbox" data-c="perfMode"> โหมดประหยัด</label>
        <div class="pbHelp">โหมดประหยัด = ไม่วาด box/hp/name/skeleton ชั่วคราว (checkbox ไม่ถูกปิด)</div>
        <div class="pbSec">สไตล์</div>
        <label>สีศัตรู <input type="color" id="pbEnemyColor" value="${CFG.enemyColor}"></label>
        <label>สีเพื่อน <input type="color" id="pbAllyColor" value="${CFG.allyColor}"></label>
        <label>ความหนา <span id="pbThickVal">${CFG.espThickness}</span> px
          <input type="range" id="pbThick" min="1" max="5" step="1" value="${CFG.espThickness}">
        </label>
        <label>ระยะวาด <span id="pbDistVal">${CFG.espMaxDist}</span> m
          <input type="range" id="pbDist" min="50" max="300" step="10" value="${CFG.espMaxDist}">
        </label>
        <label>ขนาดชื่อ <span id="pbNameVal">${CFG.espNameSize}</span> px
          <input type="range" id="pbNameSize" min="10" max="20" step="1" value="${CFG.espNameSize}">
        </label>
        <div class="pbHelp">ระยะวาด = ตัด actor ที่ไกลเกินค่าที่ตั้ง (default 200 m)</div>
      </div>

      <div class="pbPane" data-pane="safety" style="display:none">
        <div class="pbSec">หลัก</div>
        <label><input type="checkbox" data-c="enabled"> เปิด ESP (F8)</label>
        <div class="pbSec">คีย์ลัด</div>
        <div class="pbHelp">F7 = Aimbot · F8 = ESP · F9 = NoRecoil · F10 = Panic (กด 2 ครั้ง) · Insert = ซ่อน/แสดงแผง</div>
        <div class="pbSec">บริดจ์</div>
        <div class="pbHelp" id="pbBridgeInfo">bridge: —</div>
        <div class="pbSec">แอนตี้ชีต</div>
        <label><input type="checkbox" data-c="acShield"> ปิดการรายงาน anti-cheat (9007)</label>
        <label><input type="checkbox" data-c="panicOnAc"> Panic ทันทีเมื่อ AC แจ้งเตือน</label>
        <div class="pbHelp">AC ส่ง opcode 9007 เมื่อตรวจพบ — shield จะทิ้ง packet นั้น (warning ใน console ยังเห็น)</div>
        <div class="pbHelp" id="pbAcStatus">AC shield: —</div>
        <button id="pbOpenSite" type="button" style="width:100%;margin:4px 0;border-color:#5a2a2a;color:#ff4d5a">เปิด Server Owner (ดึงจากเกม)</button>
        <div class="pbSec">Panic</div>
        <button id="pbPanic" type="button" style="width:100%;color:#ff6b6b;border-color:#5a2a2a">PANIC — ปิดทุกฟีเจอร์ + ซ่อนแผง (F10)</button>
        <div class="pbHelp">ใช้เมื่อมีคนดู/กล้อง/ผู้เล่น suspicious — ฟีเจอร์ทั้งหมดหยุดทำงานทันที กด Insert เพื่อเปิดแผงกลับ</div>
        <div class="pbSec">ข้อจำกัด</div>
        <div class="pbHelp">esp.js ไม่แตะ prototype/native, ไม่ปลอม DOM event, ไม่แก้ performance.now/Date.now, ไม่แก้ hp/speed/const</div>
        <div class="pbHelp">ไม่มีอะไรการันตี 100% — เซิร์ฟเวอร์ยังตัดสินจากพฤติกรรม (hit-rate, drop/pickup ผิดปกติ) ได้เสมอ</div>
      </div>

      <div id="pbFeatureLine">—</div>
      <div id="pbStatus">—</div>
    </div>`;

  const css = document.createElement("style");
  css.textContent = `
    #pbEspPanel{position:fixed;top:56px;right:10px;z-index:2147483001;width:264px;
      max-width:calc(100vw - 16px);
      background:#120b0e;border:1px solid #4a262b;border-radius:0;
      font:12px/1.4 'Segoe UI',Tahoma,sans-serif;color:#f4e7e9;user-select:none;
      box-shadow:0 14px 34px #000b;overflow:hidden;}
    #pbEspPanel #pbh{background:#170d11;}
    #pbEspPanel #pbTabs{display:flex;background:#120b0e;border-bottom:1px solid #3a2227;}
    #pbEspPanel #pbTabs button{flex:1 1 0;min-width:0;padding:8px 0;background:transparent;border:0;
      border-bottom:2px solid transparent;color:#ab8b91;font:700 8.5px 'Segoe UI';
      letter-spacing:.3px;cursor:pointer;border-radius:0;white-space:nowrap;overflow:hidden;}
    #pbEspPanel #pbTabs button.on{color:#ff4d5a;border-bottom-color:#ff4d5a;background:#1b1013;}
    #pbEspPanel #pbBody{padding:0;display:block;max-height:calc(100vh - 120px);overflow-y:auto;overflow-x:hidden;}
    #pbEspPanel #pbBody::-webkit-scrollbar{width:7px;}
    #pbEspPanel #pbBody::-webkit-scrollbar-thumb{background:#45262c;}
    #pbEspPanel .pbSec{color:#78838f;font:700 9px 'Segoe UI';letter-spacing:1.6px;
      text-transform:uppercase;padding:7px 10px 4px;border-left:2px solid #ff4d5a;
      background:#120b0e;border-bottom:1px solid #20262c;}
    #pbEspPanel label{display:flex;align-items:center;gap:6px;padding:4px 10px;min-height:24px;
      border-bottom:1px solid rgba(255,255,255,.035);cursor:pointer;font-size:11.5px;color:#e7ced2;}
    #pbEspPanel label input[type=checkbox]{width:13px;height:13px;accent-color:#ff4d5a;margin:0;cursor:pointer;}
    #pbEspPanel input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:14px;
      background:transparent;margin:3px 0 4px;padding:0 10px;cursor:pointer;}
    #pbEspPanel input[type=range]::-webkit-slider-runnable-track{height:2px;background:#45262c;}
    #pbEspPanel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:9px;height:13px;
      margin-top:-6px;background:#ff4d5a;border:0;}
    #pbEspPanel select,#pbEspPanel input[type=number],#pbEspPanel button{background:#160d10;
      color:#f4e7e9;border:1px solid #45262c;border-radius:0;font:600 10.5px 'Segoe UI';padding:3px 6px;}
    #pbEspPanel input[type=color]{width:34px;height:20px;padding:0;border:1px solid #45262c;
      background:#160d10;cursor:pointer;}
    #pbEspPanel select{max-width:150px;}
    #pbEspPanel input[type=number]{width:64px;text-align:right;}
    #pbEspPanel button{cursor:pointer;text-transform:uppercase;letter-spacing:.8px;}
    #pbEspPanel button:hover{border-color:#ff4d5a;color:#ff4d5a;}
    #pbEspPanel .pbRow{display:flex;gap:4px;align-items:center;padding:4px 10px;
      border-bottom:1px solid rgba(255,255,255,.035);}
    #pbEspPanel .pbSeg{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.035);}
    #pbEspPanel .pbSeg label{flex:1;justify-content:center;border-bottom:0;}
    #pbEspPanel #pbStatus{margin:0;padding:6px 10px;border-top:1px solid #3a2227;
      background:#120b0e;color:#ffb3b8;font:10px Consolas,monospace;}
    #pbEspPanel .pbHelp{font-size:9.5px;color:#a37f86;line-height:1.4;margin:0;padding:0 10px 5px;}
    #pbEspPanel #pbFeatureLine{margin:0;padding:3px 10px;border-top:1px solid #3a2227;
      background:#140c0f;color:#ffd27a;font:600 9.5px 'Segoe UI';letter-spacing:.4px;}
    #pbEspPanel #pbMasterChip{margin-left:auto;margin-right:4px;padding:1px 5px;border:1px solid #5a2a2a;
      color:#ff4d5a;font:700 8px 'Segoe UI';letter-spacing:.5px;cursor:pointer;}
    #pbEspPanel #pbMasterChip.off{border-color:#45262c;color:#a37f86;}
    #pbEspPanel #pbAcChip{margin-right:6px;padding:1px 5px;border:1px solid #5a2a2a;
      color:#ffd27a;font:700 8px 'Segoe UI';letter-spacing:.5px;cursor:pointer;}
    #pbEspPanel #pbAcChip.off{border-color:#45262c;color:#a37f86;}
    #pbEspPanel input[type=text]{flex:1;min-width:0;background:#160d10;color:#f4e7e9;
      border:1px solid #45262c;border-radius:0;font:600 10px 'Segoe UI';padding:3px 6px;}
    #pbEspPanel input[type=text]:focus{outline:0;border-color:#ff4d5a;}
    #pbBtnChip{position:fixed;right:10px;top:56px;z-index:2147483001;padding:4px 10px;
      background:#120b0e;color:#ff4d5a;font:700 11px 'Segoe UI';border:1px solid #3a2227;
      border-radius:0;letter-spacing:1px;}
    #pbEspPanel button:hover{border-color:#ff4d5a;color:#ff4d5a}
    #pbEspPanel label:hover{background:rgba(255,77,90,.06)}
    #pbEspPanel button:disabled,#pbEspPanel input:disabled,#pbEspPanel select:disabled{opacity:.35;cursor:not-allowed;}
    #pbEspPanel #pbAimPresets button{padding:3px 4px;font-size:8.5px;letter-spacing:.2px;}
    #pbEspPanel .pbBlockGrid{display:grid;grid-template-columns:1fr 1fr 1fr;}
    #pbEspPanel .pbBlockGrid label{font-size:10px;padding:3px 8px;min-height:20px;}
  `;
  document.head.appendChild(css);
  panel.id = "pbEspPanel";
  (document.body || document.documentElement).appendChild(panel);


  const tabBar = panel.querySelector("#pbTabs");
  const bodyEl = panel.querySelector("#pbBody");
  const scrollByTab = new Map();
  let currentTab = "";
  const showTab = (name) => {
    if (currentTab) scrollByTab.set(currentTab, bodyEl.scrollTop);
    for (const b of tabBar.querySelectorAll("button[data-tab]")) {
      b.classList.toggle("on", b.dataset.tab === name);
    }
    for (const p of panel.querySelectorAll("#pbBody .pbPane")) {
      p.style.display = p.dataset.pane === name ? "block" : "none";
    }
    currentTab = name;
    bodyEl.scrollTop = scrollByTab.get(name) || 0;
    saveUi({ tab: name });
  };
  tabBar.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (b) showTab(b.dataset.tab);
  });

  if (Number.isFinite(savedUi.left) && Number.isFinite(savedUi.top)) {
    const l = Math.max(0, Math.min(savedUi.left, Math.max(0, innerWidth - 80)));
    const t = Math.max(0, Math.min(savedUi.top, Math.max(0, innerHeight - 40)));
    panel.style.left = l + "px";
    panel.style.top = t + "px";
    panel.style.right = "auto";
  }
  const startTab = savedUi.tab && panel.querySelector(`.pbPane[data-pane="${savedUi.tab}"]`)
    ? savedUi.tab : "core";
  showTab(startTab);

  const masterChip = panel.querySelector("#pbMasterChip");
  const updateMasterChip = () => {
    if (!masterChip) return;
    masterChip.textContent = CFG.enabled ? "ESP ON" : "ESP OFF";
    masterChip.classList.toggle("off", !CFG.enabled);
    masterChip.title = CFG.enabled ? "ESP เปิดอยู่ — คลิกเพื่อปิด (F8)" : "ESP ปิด — คลิกเพื่อเปิด (F8)";
  };
  if (masterChip) {
    masterChip.addEventListener("click", () => {
      CFG.enabled = !CFG.enabled;
      const c = panel.querySelector('input[data-c="enabled"]');
      if (c) c.checked = CFG.enabled;
      saveCfg();
      updateMasterChip();
      updateFeatureLine();
    });
  }
  updateMasterChip();

  const featureLine = panel.querySelector("#pbFeatureLine");
  const updateFeatureLine = () => {
    if (!featureLine) return;
    const bits = [];
    if (CFG.aimAssist) bits.push("AIM");
    if (CFG.enabled) bits.push("ESP");
    if (CFG.noRecoil) bits.push("RECOIL");
    if (CFG.noSpread) bits.push("SPREAD");
    if (CFG.humanize) bits.push("HUMAN");
    if (CFG.fakeMobile) bits.push("MOBILE");
    featureLine.textContent = bits.length ? bits.join(" · ") : "ไม่มีฟีเจอร์เปิด";
  };
  updateFeatureLine();

  /* ESP style controls */
  const enemyColorInput = panel.querySelector("#pbEnemyColor");
  const allyColorInput = panel.querySelector("#pbAllyColor");
  if (enemyColorInput) {
    enemyColorInput.addEventListener("input", () => {
      CFG.enemyColor = enemyColorInput.value;
      saveCfg();
    });
  }
  if (allyColorInput) {
    allyColorInput.addEventListener("input", () => {
      CFG.allyColor = allyColorInput.value;
      saveCfg();
    });
  }
  const thickSlider = panel.querySelector("#pbThick");
  const thickVal = panel.querySelector("#pbThickVal");
  if (thickSlider) {
    thickSlider.value = CFG.espThickness;
    thickSlider.addEventListener("input", () => {
      CFG.espThickness = parseInt(thickSlider.value, 10) || 2;
      if (thickVal) thickVal.textContent = CFG.espThickness;
      saveCfg();
    });
  }
  const distSlider = panel.querySelector("#pbDist");
  const distVal = panel.querySelector("#pbDistVal");
  if (distSlider) {
    distSlider.value = CFG.espMaxDist;
    distSlider.addEventListener("input", () => {
      CFG.espMaxDist = parseInt(distSlider.value, 10) || 200;
      if (distVal) distVal.textContent = CFG.espMaxDist;
      saveCfg();
    });
  }
  const nameSizeSlider = panel.querySelector("#pbNameSize");
  const nameSizeVal = panel.querySelector("#pbNameVal");
  if (nameSizeSlider) {
    nameSizeSlider.value = CFG.espNameSize;
    nameSizeSlider.addEventListener("input", () => {
      CFG.espNameSize = parseInt(nameSizeSlider.value, 10) || 13;
      if (nameSizeVal) nameSizeVal.textContent = CFG.espNameSize;
      saveCfg();
    });
  }

  const acChip = panel.querySelector("#pbAcChip");
  const updateAcChip = () => {
    if (!acChip) return;
    acChip.textContent = CFG.acShield ? "AC SHIELD ON" : "AC SHIELD OFF";
    acChip.classList.toggle("off", !CFG.acShield);
    acChip.title = CFG.acShield
      ? "กำลังบล็อกรายงาน anti-cheat (9007) — คลิกไป SAFETY"
      : "ยังไม่บล็อกรายงาน anti-cheat — คลิกไป SAFETY";
  };
  if (acChip) acChip.addEventListener("click", () => showTab("safety"));
  updateAcChip();

  const fpsStyleSelect = panel.querySelector("#pbFpsStyle");
  fpsStyleSelect.value = ["plain", "box", "neon"].includes(CFG.fpsStyle) ? CFG.fpsStyle : "box";
  fpsStyleSelect.addEventListener("change", () => { CFG.fpsStyle = fpsStyleSelect.value; saveCfg(); });
  let fpsFrames = 0, fpsValue = 0, fpsUpdatedAt = performance.now();
  function countGameFrame() {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsUpdatedAt >= 500) {
      fpsValue = Math.round(fpsFrames * 1000 / (now - fpsUpdatedAt));
      fpsFrames = 0;
      fpsUpdatedAt = now;
    }
  }
  function hookGameFpsCounter() {
    const hud = findPB()?.hud;
    if (!hud || typeof hud.tickFps !== "function" || hud.tickFps.__pbFpsHook) return false;
    const original = hud.tickFps;
    const wrapped = function (...args) {
      countGameFrame();
      return original.apply(this, args);
    };
    wrapped.__pbFpsHook = true;
    hud.tickFps = wrapped;
    return true;
  }

  // ผูก checkbox -> CFG
  for (const c of panel.querySelectorAll("input[type=checkbox]")) {
    const key = c.dataset.c;
    c.checked = CFG[key];
    c.addEventListener("change", () => {
      CFG[key] = c.checked;
      saveCfg();
      syncDependentControls();
      updateFeatureLine();
      /* The mobile spoof is applied by mobile-spoof.js before this UI exists, so
         the choice has to be written to storage and the page reloaded for it to
         take effect — that is the only way to make the client re-initialise as a
         PC (or as a phone) from scratch. */
      if (key === "fakeMobile") {
        try { localStorage.setItem("pbFakeMobile", c.checked ? "1" : "0"); } catch (_) {}
        try { sessionStorage.removeItem("pbMobileOff"); } catch (_) {}
        try { setStatus(c.checked ? "เปิด mobile — กำลังรีโหลด..." : "ปิด mobile — กำลังรีโหลด..."); } catch (_) {}
        setTimeout(() => { try { location.reload(); } catch (_) {} }, 400);
      }
      /* turning the recoil switch on is the natural moment to look for the chunk
         that owns the recoil model */
      if (key === "noRecoil" && c.checked) {
        try { setTimeout(() => { scanEngine(); }, 600); } catch (_) {}
      }
      if (key === "unlockFps") {
        applyFpsUnlock();
        try {
          setStatus(c.checked
            ? `unlock FPS: ตั้ง cap = ${capForMode() || 0} แล้ว — กด F5`
            : "unlock FPS: ปิด (ไม่แก้ค่าที่เกมบันทึกไว้)");
        } catch (_) { }
      }
    });
  }
  // ผูก sliders
  /* compensation slider: only meaningful on a client whose recoil state is not
     reachable (ES-module build). It is revealed automatically below. */
  const recLvl = panel.querySelector("#pbRecLvl");
  const recLvlVal = panel.querySelector("#pbRecLvlVal");
  const recLvlNum = panel.querySelector("#pbRecLvlNum");
  const setRecLvl = (v, save) => {
    let n = Math.round(Number(v));
    if (!isFinite(n)) n = 100;
    n = Math.max(0, Math.min(100, n));
    CFG.recoilLevel = n;
    if (recLvl) recLvl.value = n;
    if (recLvlNum) recLvlNum.value = n;
    if (recLvlVal) recLvlVal.textContent = n;
    if (save) saveCfg();
  };
  if (recLvl) recLvl.addEventListener("input", () => setRecLvl(recLvl.value, true));
  if (recLvlNum) {
    recLvlNum.addEventListener("input", () => { if (recLvlNum.value !== "") setRecLvl(recLvlNum.value, false); });
    recLvlNum.addEventListener("change", () => setRecLvl(recLvlNum.value, true));
    recLvlNum.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); setRecLvl(recLvlNum.value, true); recLvlNum.blur(); }
    });
  }
  setRecLvl(CFG.recoilLevel == null ? 100 : CFG.recoilLevel, false);

  const sprLvl = panel.querySelector("#pbSprLvl");
  const sprLvlVal = panel.querySelector("#pbSprLvlVal");
  const sprLvlNum = panel.querySelector("#pbSprLvlNum");
  const setSprLvl = (v, save) => {
    let n = Math.round(Number(v));
    if (!isFinite(n)) n = 100;
    n = Math.max(0, Math.min(100, n));
    CFG.spreadLevel = n;
    if (sprLvl) sprLvl.value = n;
    if (sprLvlNum) sprLvlNum.value = n;
    if (sprLvlVal) sprLvlVal.textContent = n;
    if (save) saveCfg();
  };
  if (sprLvl) sprLvl.addEventListener("input", () => setSprLvl(sprLvl.value, true));
  if (sprLvlNum) {
    sprLvlNum.addEventListener("input", () => { if (sprLvlNum.value !== "") setSprLvl(sprLvlNum.value, false); });
    sprLvlNum.addEventListener("change", () => setSprLvl(sprLvlNum.value, true));
    sprLvlNum.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); setSprLvl(sprLvlNum.value, true); sprLvlNum.blur(); }
    });
  }
  setSprLvl(CFG.spreadLevel == null ? 100 : CFG.spreadLevel, false);

  const hn = panel.querySelector("#pbHumanNet");
  const hnVal = panel.querySelector("#pbHumanNetVal");
  if (hn) {
    hn.value = CFG.humanNet == null ? 0.35 : CFG.humanNet;
    if (hnVal) hnVal.textContent = hn.value;
    hn.addEventListener("input", () => {
      CFG.humanNet = +hn.value;
      if (hnVal) hnVal.textContent = hn.value;
      saveCfg();
    });
  }
  const humanDir = panel.querySelector("#pbHumanDir");
  if (humanDir) {
    humanDir.value = String(Number(CFG.humanPitchSign) || 1);
    humanDir.addEventListener("change", () => {
      CFG.humanPitchSign = Number(humanDir.value) || 1;
      saveCfg();
    });
  }
  const humanAmp = panel.querySelector("#pbHumanAmp");
  const humanAmpVal = panel.querySelector("#pbHumanAmpVal");
  if (humanAmp) {
    humanAmp.value = CFG.humanPitchAmp == null ? 0.55 : CFG.humanPitchAmp;
    if (humanAmpVal) humanAmpVal.textContent = humanAmp.value;
    humanAmp.addEventListener("input", () => {
      CFG.humanPitchAmp = Math.max(0, Math.min(1.5, parseFloat(humanAmp.value) || 0));
      if (humanAmpVal) humanAmpVal.textContent = CFG.humanPitchAmp.toFixed(2);
      saveCfg();
    });
  }

  const fovSlider = panel.querySelector("#pbFovSlider");
  const fovVal = panel.querySelector("#pbFovVal");
  if (fovSlider) {
    fovSlider.value = CFG.aimFov;
    if (fovVal) fovVal.textContent = CFG.aimFov;
    fovSlider.addEventListener("input", () => {
      CFG.aimFov = parseFloat(fovSlider.value);
      if (fovVal) fovVal.textContent = CFG.aimFov;
      saveCfg();
    });
  }
  const smSlider = panel.querySelector("#pbSmSlider");
  const smVal = panel.querySelector("#pbSmVal");
  if (smSlider) {
    smSlider.value = CFG.aimSmooth;
    if (smVal) smVal.textContent = CFG.aimSmooth;
    smSlider.addEventListener("input", () => {
      CFG.aimSmooth = parseFloat(smSlider.value);
      if (smVal) smVal.textContent = CFG.aimSmooth;
      saveCfg();
    });
  }
  const predSlider = panel.querySelector("#pbPredSlider");
  const predVal = panel.querySelector("#pbPredVal");
  if (predSlider) {
    predSlider.value = CFG.aimPredictMs;
    if (predVal) predVal.textContent = CFG.aimPredictMs;
    predSlider.addEventListener("input", () => {
      CFG.aimPredictMs = parseInt(predSlider.value, 10);
      if (predVal) predVal.textContent = CFG.aimPredictMs;
      saveCfg();
    });
  }
  const trackSlider = panel.querySelector("#pbTrackSlider");
  const trackVal = panel.querySelector("#pbTrackVal");
  if (trackSlider) {
    trackSlider.value = CFG.aimTrack;
    if (trackVal) trackVal.textContent = CFG.aimTrack;
    trackSlider.addEventListener("input", () => {
      CFG.aimTrack = parseFloat(trackSlider.value);
      if (trackVal) trackVal.textContent = CFG.aimTrack;
      saveCfg();
    });
  }
  const visTol = panel.querySelector("#pbVisTol");
  const visTolVal = panel.querySelector("#pbVisTolVal");
  if (visTol) {
    visTol.value = CFG.aimVisTolerance == null ? 0.12 : CFG.aimVisTolerance;
    if (visTolVal) visTolVal.textContent = Number(visTol.value).toFixed(2);
    visTol.addEventListener("input", () => {
      CFG.aimVisTolerance = Math.max(0, Math.min(0.35, parseFloat(visTol.value) || 0));
      if (visTolVal) visTolVal.textContent = CFG.aimVisTolerance.toFixed(2);
      saveCfg();
    });
  }
  /* Aim presets */
  const AIM_PRESETS = {
    rifle: { fov: 45, smooth: 5, predict: 35, track: 0.6 },
    sniper: { fov: 22, smooth: 7, predict: 20, track: 0.4 },
    shotgun: { fov: 60, smooth: 4, predict: 10, track: 0.8 },
    default: { fov: 180, smooth: 6, predict: 30, track: 1.0 },
  };
  for (const b of panel.querySelectorAll("#pbAimPresets button")) {
    b.addEventListener("click", () => {
      const p = AIM_PRESETS[b.dataset.preset];
      if (!p) return;
      CFG.aimFov = p.fov;
      CFG.aimSmooth = p.smooth;
      CFG.aimPredictMs = p.predict;
      CFG.aimTrack = p.track;
      if (fovSlider) fovSlider.value = p.fov;
      if (fovVal) fovVal.textContent = p.fov;
      if (smSlider) smSlider.value = p.smooth;
      if (smVal) smVal.textContent = p.smooth;
      if (predSlider) predSlider.value = p.predict;
      if (predVal) predVal.textContent = p.predict;
      if (trackSlider) trackSlider.value = p.track;
      if (trackVal) trackVal.textContent = p.track;
      saveCfg();
      setStatus(`AIM preset: ${b.dataset.preset}`);
    });
  }
  /* fast weapon swap — slider, typed number, reset */
  const swapSlider = panel.querySelector("#pbSwapSlider");
  const swapNum = panel.querySelector("#pbSwapNum");
  const swapVal = panel.querySelector("#pbSwapVal");
  const swapReset = panel.querySelector("#pbSwapReset");
  const SWAP_DEF = 250;
  const setSwapMs = (v, save) => {
    let n = Math.round(Number(v));
    if (!isFinite(n)) n = SWAP_DEF;
    n = Math.max(50, Math.min(1500, n));
    CFG.swapMs = n;
    if (swapSlider) swapSlider.value = n;
    if (swapNum) swapNum.value = n;
    if (swapVal) swapVal.textContent = n;
    if (save) saveCfg();
  };
  if (swapSlider) swapSlider.addEventListener("input", () => setSwapMs(swapSlider.value, true));
  if (swapNum) {
    swapNum.addEventListener("input", () => { if (swapNum.value !== "") setSwapMs(swapNum.value, false); });
    swapNum.addEventListener("change", () => setSwapMs(swapNum.value, true));
    swapNum.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); setSwapMs(swapNum.value, true); swapNum.blur(); }
    });
  }
  if (swapReset) swapReset.addEventListener("click", () => setSwapMs(SWAP_DEF, true));
  setSwapMs(CFG.swapMs, false);

  /* stat bonus (reload / swap) — writes the bonus object the weapon system
     already reads, so it works with no items equipped. Instance only: no
     prototype, no frozen gameplay constants. */
  const bRSlider = panel.querySelector("#pbBonusRSlider");
  const bSSlider = panel.querySelector("#pbBonusSSlider");
  const bRNum = panel.querySelector("#pbBonusRNum");
  const bSNum = panel.querySelector("#pbBonusSNum");
  const bRVal = panel.querySelector("#pbBonusRVal");
  const bSVal = panel.querySelector("#pbBonusSVal");
  const bReset = panel.querySelector("#pbBonusReset");
  const BONUS_DEF = 0.5;
  const BONUS_DEF_R = 0.25;
  const setBonus = (key, v, save) => {
    const def = key === "bonusReload" ? BONUS_DEF_R : BONUS_DEF;
    let n = Number(v);
    if (!isFinite(n)) n = def;
    n = Math.round(Math.max(0, Math.min(0.9, n)) * 100) / 100;
    CFG[key] = n;
    const isR = key === "bonusReload";
    if (isR) {
      if (bRSlider) bRSlider.value = n;
      if (bRNum) bRNum.value = n;
      if (bRVal) bRVal.textContent = n.toFixed(2);
    } else {
      if (bSSlider) bSSlider.value = n;
      if (bSNum) bSNum.value = n;
      if (bSVal) bSVal.textContent = n.toFixed(2);
    }
    if (save) saveCfg();
  };
  if (bRSlider) bRSlider.addEventListener("input", () => setBonus("bonusReload", bRSlider.value, true));
  if (bSSlider) bSSlider.addEventListener("input", () => setBonus("bonusSwap", bSSlider.value, true));
  if (bRNum) {
    bRNum.addEventListener("input", () => { if (bRNum.value !== "") setBonus("bonusReload", bRNum.value, false); });
    bRNum.addEventListener("change", () => setBonus("bonusReload", bRNum.value, true));
  }
  if (bSNum) {
    bSNum.addEventListener("input", () => { if (bSNum.value !== "") setBonus("bonusSwap", bSNum.value, false); });
    bSNum.addEventListener("change", () => setBonus("bonusSwap", bSNum.value, true));
  }
  if (bReset) bReset.addEventListener("click", () => {
    setBonus("bonusReload", BONUS_DEF_R, false);
    setBonus("bonusSwap", BONUS_DEF, true);
  });
  setBonus("bonusReload", CFG.bonusReload, false);
  setBonus("bonusSwap", CFG.bonusSwap, false);

  function syncDependentControls() {
    const dis = (sel, off) => {
      for (const el of panel.querySelectorAll(sel)) el.disabled = !!off;
    };
    dis("#pbRecLvl, #pbRecLvlNum", !CFG.noRecoil);
    dis("#pbSprLvl, #pbSprLvlNum", !CFG.noSpread);
    dis("#pbHumanNet, #pbHumanDir, #pbHumanAmp", !CFG.humanize);
    dis("#pbFpsStyle, input[data-c='fpsLabel']", !CFG.showFps);
    dis("#pbSwapSlider, #pbSwapNum, #pbSwapReset", !CFG.fastSwap);
    dis("#pbBonusSSlider, #pbBonusSNum, #pbBonusRSlider, #pbBonusRNum, #pbBonusReset, #pbSwapProfile, #pbReloadProfile", !CFG.statBonus);
    dis("#pbFovSlider, #pbSmSlider, #pbPredSlider, #pbTrackSlider, #pbVisTol, #pbPrioSelect, #pbBoneSelect, #pbHoldBind, #pbAimPresets button", !CFG.aimAssist);
  }
  syncDependentControls();

  const boneSelect = panel.querySelector("#pbBoneSelect");  if (boneSelect) {
    boneSelect.value = CFG.aimBone;
    boneSelect.addEventListener("change", () => { CFG.aimBone = boneSelect.value; saveCfg(); });
  }
  if (!Array.isArray(CFG.aimBlock)) CFG.aimBlock = [];
  for (const cb of panel.querySelectorAll("input[data-block]")) {
    cb.checked = CFG.aimBlock.includes(cb.dataset.block);
    cb.addEventListener("change", () => {
      const set = new Set(Array.isArray(CFG.aimBlock) ? CFG.aimBlock : []);
      if (cb.checked) set.add(cb.dataset.block);
      else set.delete(cb.dataset.block);
      CFG.aimBlock = [...set];
      saveCfg();
    });
  }
  const holdBind = panel.querySelector("#pbHoldBind");
  if (holdBind) {
    holdBind.textContent = _holdBindLabel();
  }
  // ผูก aimMode radio buttons
  panel.querySelectorAll("input[name='aimMode']").forEach(r => {
    r.addEventListener("change", () => {
      if (r.checked) {
        CFG.aimMode = r.value;
        // reset FOV เมื่อสลับ mode
        if (r.value === "bot") {
          CFG.aimFov = 180;
          if (fovSlider) { fovSlider.value = 180; if (fovVal) fovVal.textContent = 180; }
        } else {
          CFG.aimFov = 6.5;
          if (fovSlider) { fovSlider.value = 6.5; if (fovVal) fovVal.textContent = 6.5; }
        }
        saveCfg();
      }
    });
  });
  // ผูก priority select
  const prioSelect = panel.querySelector("#pbPrioSelect");
  if (prioSelect) {
    prioSelect.value = CFG.aimPriority;
    prioSelect.addEventListener("change", () => { CFG.aimPriority = prioSelect.value; saveCfg(); });
  }
  // ปุ่ม ปิด panel (เหลือ chip กดกลับให้เปิดได้)
  const chip = document.createElement("div");
  chip.id = "pbBtnChip"; chip.textContent = "PB";
  chip.style.display = "none";
  /* one place that shows/hides the panel, so the mouse, the × and the Insert
     key can never disagree about the current state. The corner chip is hidden
     as well: when the user hides the menu they want NOTHING on screen, so
     Insert is the only way back (that is the point of the hotkey). */
  const setMenu = (show) => {
    panel.style.display = show ? "" : "none";
    chip.style.display = "none";
    try { localStorage.setItem("pbEspMenu", show ? "1" : "0"); } catch (_) {}
  };
  /* remember whether the menu was left hidden, so a reload does not pop it back */
  try { if (localStorage.getItem("pbEspMenu") === "0") setMenu(false); } catch (_) {}
  chip.onclick = () => setMenu(true);
  (document.body || document.documentElement).appendChild(chip);
  panel.querySelector("#pbX").onclick = () => setMenu(false);

  /* Insert = hide / show the menu. Works even while the game has keyboard
     focus, and does not fire when the user is typing in one of our inputs. */
  addEventListener("keydown", (e) => {
    if (e.code !== "Insert" && e.key !== "Insert") return;
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing) return;
    setMenu(panel.style.display === "none");
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // ลากย้ายแผงจาก header
  const head = panel.querySelector("#pbh");
  let drag = null;
  head.addEventListener("pointerdown", (e) => {
    if (e.target.id === "pbX") return;
    const r = panel.getBoundingClientRect();
    drag = { ox: e.clientX - r.left, oy: e.clientY - r.top };
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener("pointermove", (e) => {
    if (!drag) return;
    panel.style.left = (e.clientX - drag.ox) + "px";
    panel.style.top = (e.clientY - drag.oy) + "px";
    panel.style.right = "auto";
  });
  head.addEventListener("pointerup", () => {
    if (drag) {
      drag = null;
      const r = panel.getBoundingClientRect();
      saveUi({ left: Math.round(r.left), top: Math.round(r.top) });
    }
  });

  // F7 / F8 / F9
  addEventListener("keydown", (e) => {
    if (e.code === "F7") {
      CFG.aimAssist = !CFG.aimAssist;
      const c = panel.querySelector('input[data-c="aimAssist"]');
      if (c) c.checked = CFG.aimAssist;
      saveCfg();
      e.preventDefault();
    } else if (e.code === "F8") {
      CFG.enabled = !CFG.enabled;
      const c = panel.querySelector('input[data-c="enabled"]');
      if (c) c.checked = CFG.enabled;
      saveCfg();
      e.preventDefault();
    } else if (e.code === "F9") {
      CFG.noRecoil = !CFG.noRecoil;
      const c = panel.querySelector('input[data-c="noRecoil"]');
      if (c) c.checked = CFG.noRecoil;
      saveCfg();
      e.preventDefault();
    }
  });

  /* ---------- AIM ASSIST ENGINE ---------- */
  /*
   * สถาปัตยกรรม:
   * - หาศัตรูที่ยังมีชีวิต, อยู่ใน FOV วงกลม (degree) รอบจุดกึ่งกลางจอ
   * - คำนวณมุมเบี่ยงเบน (Δpitch, Δyaw) ระหว่าง crosshair กับ bone ของเป้า
   * - ส่งเข้า player.addLook() แบบ lerp (smoothing) — เฟรมละเล็กน้อย
   * - วาดวงกลม FOV บน canvas ESP (ถ้า aimDrawFov เปิด)
   *
   * ทำไม addLook() ไม่ใช่ setRotation()?
   * player.addLook(dPitch, dYaw) คือ API เดียวกับที่เกมใช้รับ input เมาส์
   * ทำให้ Raycast, camera sync, และ netcode ทำงานสอดคล้องกัน
   * ไม่เกิด desync ระหว่าง visual กับ bullet direction
   */

  // คำนวณ delta yaw / delta pitch ตรงจุด 100% ตามแกน Three.js YXZ Euler ของ PB
  // dy > 0 (เป้าหมายสูงกว่าตา) -> targetPitch เป็นบวก (หมุนกล้องเงยขึ้น)
  // dy < 0 (เป้าหมายต่ำกว่าตา) -> targetPitch เป็นลบ (หมุนกล้องก้มลง)
  function calcAnglesToTarget(cam, targetPos, boneY, player) {
    const e = cam.matrixWorld.elements;
    const camX = e[12], camY = e[13], camZ = e[14];
    const dx = targetPos[0] - camX;
    const dy = boneY - camY;
    const dz = targetPos[2] - camZ;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.1) return null;

    const horizDist = Math.hypot(dx, dz);
    // Three.js: yaw = 0 ชี้ -Z, เลี้ยวขวา = yaw ลดลง (ลบ), เลี้ยวซ้าย = yaw เพิ่มขึ้น (บวก)
    const targetYaw = Math.atan2(-dx, -dz);
    // pitch: เงยหน้า = pitch บวก, ก้มหน้า = pitch ลบ (แก้เครื่องหมายลบที่ผิดออกแล้ว)
    const targetPitch = Math.atan2(dy, horizDist);

    const curYaw = player?.yaw ?? 0;
    const curPitch = player?.pitch ?? 0;

    let deltaYaw = targetYaw - curYaw;
    while (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
    while (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

    const deltaPitch = targetPitch - curPitch;
    const angTotal = Math.hypot(deltaYaw, deltaPitch);

    return { deltaYaw, deltaPitch, angTotal, dist };
  }

  /* ---------- BONE HELPERS (ยึดกระดูกจริงของโมเดล) ---------- */
  const BONE_NAMES = {
    head:   ["Head", "Skull"],
    neck:   ["Neck"],
    chest:  ["Spine3", "Spine2", "Chest", "Spine1", "Torso"],
    pelvis: ["Pelvis", "Hips", "Root"],
    hand:   ["Hand", "Wrist", "Palm"],
    upperarm: ["UpperArm", "Upper_Arm", "Shoulder", "Arm1"],
    forearm: ["Forearm", "LowerArm", "Lower_Arm", "Arm2"],
    thigh:  ["Thigh", "UpperLeg", "Upper_Leg", "Leg1"],
    shin:   ["Calf", "Shin", "LowerLeg", "Lower_Leg", "Leg2"],
    foot:   ["Foot", "Toe", "Ankle"],
  };

  const PART_KEYS = ["head", "neck", "body", "upperarm", "forearm", "hand", "thigh", "shin", "foot"];

  function partOfName(name) {
    // game bones are like "R UpperArm", "L Forearm", "L Calf" — strip spaces,
    // dots and underscores before matching so all rig naming styles work
    const n = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (/head|skull/.test(n)) return "head";
    if (/neck/.test(n)) return "neck";
    if (/hand|wrist|palm/.test(n)) return "hand";
    if (/forearm|lowerarm|arm2/.test(n)) return "forearm";
    if (/upperarm|shoulder|arm1/.test(n)) return "upperarm";
    if (/thigh|upperleg|leg1/.test(n)) return "thigh";
    if (/calf|shin|lowerleg|leg2|knee/.test(n)) return "shin";
    if (/foot|toe|ankle/.test(n)) return "foot";
    if (/pelvis|hips|root/.test(n)) return "body";
    if (/spine|chest|torso|body/.test(n)) return "body";
    return "body";
  }

  function actorVisualRoot(a) {
    return a?.visualRoot ?? a?.visual?.root ?? null;
  }

  function boneWorld(bone, out) {
    if (!bone) return false;
    try {
      bone.updateWorldMatrix(true, false);
      const e = bone.matrixWorld.elements;
      out[0] = e[12]; out[1] = e[13]; out[2] = e[14];
      return isFinite(out[0]) && isFinite(out[1]) && isFinite(out[2]);
    } catch (_) { return false; }
  }

  function isDescendantOf(root, node) {
    let p = node;
    while (p) {
      if (p === root) return true;
      p = p.parent;
    }
    return false;
  }

  const _boneMapCache = new WeakMap();
  function getBoneMap(root) {
    if (!root) return null;
    const cached = _boneMapCache.get(root);
    if (cached) {
      if (!cached.size) return cached;
      const first = cached.values().next().value;
      if (isDescendantOf(root, first)) return cached;
    }
    const map = new Map();
    try {
      root.traverse((o) => {
        if (o?.isBone) map.set((o.name || "").toLowerCase(), o);
      });
    } catch (_) { }
    _boneMapCache.set(root, map);
    return map;
  }

  function findBone(root, names) {
    if (!root) return null;
    const map = getBoneMap(root);
    if (!map) return null;

    // 1) ชื่อตรง (ไม่สนตัวพิมพ์) — ใช้ map ที่ cache ไว้ ไม่ traverse ซ้ำทุกเฟรม
    for (const n of names) {
      const b = map.get(String(n).toLowerCase());
      if (b) return b;
    }

    // 2) ค้นหาแบบหลวม (รองรับ prefix/suffix เช่น mixamorig:Head, Bip01_Head)
    for (const n of names) {
      const key = String(n).toLowerCase();
      for (const [k, b] of map) {
        if (k.endsWith(":" + key) || k.endsWith("_" + key) || k.includes(key)) return b;
      }
    }
    return null;
  }

  /* ---------- HITBOX จริงของเกม (จุดกลางกล่อง = ที่เกมเอาไว้คิด damage) ---------- */
  // เกม precompute ไว้ที่ userData.boneHitboxes:
  //   [{ bone, boneName, shape, zone, min, max, center, halfSize }]
  // จุดกลาง world = center.applyMatrix4(bone.matrixWorld)  (ยืนยันจาก main:zn())
  // ⇒ เรายิง "กลางกล่อง" ไม่ใช่ origin ของกระดูก (origin อยู่ผิดที่บ่อย)
  const ZONE_PRIO = { head: 0, body: 1, arm: 2, hand: 3, leg: 4, foot: 5 };

  // ลำดับโซนที่ยอม fallback ไป — ถ้าส่วนที่เลือกโดนบัง จะไล่หาส่วนที่ "เห็นจริง" ต่อ
  const MODE_ZONES = {
    head:   ["head", "body", "arm", "hand", "leg", "foot"],
    neck:   ["head", "body", "arm", "hand", "leg", "foot"],
    chest:  ["body", "head", "arm", "hand", "leg", "foot"],
    pelvis: ["body", "leg", "head", "arm", "foot", "hand"],
    hand:   ["hand", "arm", "body", "leg", "foot"],
    upperarm: ["arm", "body", "hand", "leg", "foot"],
    forearm:  ["arm", "hand", "body", "leg", "foot"],
    thigh:  ["leg", "body", "foot", "arm", "hand"],
    shin:   ["leg", "foot", "body", "arm", "hand"],
    foot:   ["foot", "leg", "body", "arm", "hand"],
    auto:   ["head", "body", "arm", "hand", "leg", "foot"],
  };

  function zoneOfName(name) {
    const n = String(name || "").toLowerCase();
    if (/head|skull/.test(n)) return "head";
    if (/hand|wrist|palm/.test(n)) return "hand";
    if (/foot|toe|ankle/.test(n)) return "foot";
    if (/leg|calf|thigh|shin|knee/.test(n)) return "leg";
    if (/arm|forearm|upperarm|shoulder|elbow/.test(n)) return "arm";
    return "body";
  }

  // hitboxDefs ใช้เป็น fallback + ทำ skeleton ได้ — เกมเก็บไว้บน visualRoot (main:Xm)
  const _hbCache = new WeakMap();
  function getHitboxDefs(a) {
    const root = actorVisualRoot(a);
    if (!root) return null;
    const cached = _hbCache.get(root);
    if (cached !== undefined) {
      // null ไม่ cache ถาวร — โมเดลอาจยังโหลดไม่เสร็จในเฟรมแรก
      if (cached !== null && cached.holder && isDescendantOf(root, cached.holder) &&
        performance.now() - cached.t < 3000) return cached.defs;
      if (cached !== null) _hbCache.delete(root);
    }

    let holder = null;
    try {
      root.traverse((o) => {
        if (!holder && Array.isArray(o?.userData?.hitboxDefs)) holder = o;
      });
    } catch (_) { }

    let defs = null;
    if (holder) {
      const pre = holder.userData.boneHitboxes;
      if (Array.isArray(pre) && pre.length) {
        defs = pre.filter((d) => d?.bone);
      } else {
        defs = [];
        for (const d of holder.userData.hitboxDefs) {
          const b = findBone(holder, [d.bone, String(d.bone || "").replace(/[^A-Za-z0-9_]/g, "")]);
          if (b) defs.push({ bone: b, zone: d.zone || "body" });
        }
      }
    }
    const entry = (holder && defs && defs.length) ? { holder, defs, t: performance.now() } : null;
    if (entry) _hbCache.set(root, entry);
    return entry ? entry.defs : null;
  }

  /* ---------- AIM CANDIDATES (ทุกส่วนของร่างกาย + จุดกลาง hitbox จริง) ---------- */
  const _candCache = new WeakMap();
  function getAimCandidates(a) {
    const root = actorVisualRoot(a);
    if (!root) return null;
    const cached = _candCache.get(root);
    // list ว่าง = โมเดลยังโหลดไม่เสร็จ → ไม่ cache ถาวร (retry เฟรมถัดไป)
    // cache มีอายุ 3 วิ — โมเดลอาจโหลดกระดูกเพิ่มทีหลัง (แขน/ขา) และ list เก่า
    // จะทำให้ส่วนใหม่เลือกไม่ได้ตลอดทั้งแมตช์
    if (cached && cached.list && cached.list.length &&
      isDescendantOf(root, cached.list[0].bone) &&
      performance.now() - cached.t < 3000) return cached.list;
    if (cached && cached.list && !cached.list.length) _candCache.delete(root);

    const list = [];
    const defs = getHitboxDefs(a);
    if (defs) {
      for (const d of defs) {
        if (!d?.bone) continue;
        const local = [0, 0, 0];
        const c = d.center;
        if (c) {
          if (Array.isArray(c)) { local[0] = c[0]; local[1] = c[1]; local[2] = c[2]; }
          else { local[0] = c.x; local[1] = c.y; local[2] = c.z; }
        } else if (d.min && d.max) {
          // เผื่อ build ที่ไม่มี center: ใช้จุดกึ่งกลาง min/max (local space)
          const mn = d.min, mx = d.max;
          const gx = (o) => Array.isArray(o) ? o[0] : o.x;
          const gy = (o) => Array.isArray(o) ? o[1] : o.y;
          const gz = (o) => Array.isArray(o) ? o[2] : o.z;
          local[0] = (gx(mn) + gx(mx)) * 0.5;
          local[1] = (gy(mn) + gy(mx)) * 0.5;
          local[2] = (gz(mn) + gz(mx)) * 0.5;
        }
        if (!isFinite(local[0]) || !isFinite(local[1]) || !isFinite(local[2])) continue;
        list.push({
          bone: d.bone,
          zone: d.zone || zoneOfName(d.boneName || d.bone?.name),
          part: partOfName(d.boneName || d.bone?.name),
          local,
          name: d.boneName || d.bone?.name || "",
        });
      }
    }

    // hitboxDefs ของเกมมีแค่ zone coarse (head/body/arm/hand/leg/foot) และบาง
    // build ไม่มีกระดูกแขน/ขาครบ — เติมจาก skeleton จริง (ชื่อ "R UpperArm",
    // "L Calf", ...) เพื่อให้โหมด ต้นแขน/ปลายแขน/มือ/ต้นขา/น่อง/เท้า ใช้ได้
    const skel = getSkeletonData(a);
    if (skel && skel.bones) {
      const used = new Set(list.map((c) => c.bone));
      if (!list.length) {
        for (const b of skel.bones) {
          list.push({
            bone: b,
            zone: zoneOfName(b.name),
            part: partOfName(b.name),
            local: [0, 0, 0],
            name: b.name || "",
          });
        }
      } else {
        const have = new Set(list.map((c) => c.part || c.zone));
        for (const b of skel.bones) {
          if (used.has(b)) continue;
          const part = partOfName(b.name);
          if (part === "body" || have.has(part)) continue;
          have.add(part);
          list.push({
            bone: b,
            zone: zoneOfName(b.name),
            part,
            local: [0, 0, 0],
            name: b.name || "",
          });
        }
      }
    }

    // ไม่มีทั้ง hitbox และ skeleton → ใช้ความสูงมาตรฐานเดิม
    if (!list.length) {
      for (const mode of ["head", "neck", "chest", "pelvis"]) {
        const b = findBone(root, BONE_NAMES[mode]);
        if (!b) continue;
        list.push({
          bone: b,
          zone: mode === "head" ? "head" : "body",
          part: mode,
          local: [0, 0, 0],
          name: b.name || "",
        });
      }
    }

    _candCache.set(root, { t: performance.now(), list });
    return list;
  }

  // แปลง center (local ของ bone) → world  (ตรงกับ zn() ของเกม)
  function candWorld(cand, out) {
    const bone = cand?.bone;
    if (!bone) return false;
    try {
      const e = bone.matrixWorld.elements;
      const l = cand.local;
      const x = e[0] * l[0] + e[4] * l[1] + e[8] * l[2] + e[12];
      const y = e[1] * l[0] + e[5] * l[1] + e[9] * l[2] + e[13];
      const z = e[2] * l[0] + e[6] * l[1] + e[10] * l[2] + e[14];
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return false;
      out[0] = x; out[1] = y; out[2] = z;
      return true;
    } catch (_) { return false; }
  }

  // true = โล่ง | false = โดนบัง | null = ตรวจไม่ได้
  function pointVisible(pb, cam, x, y, z, sample = true) {
    if (!CFG.aimVisibleOnly) return true;
    const e = cam?.matrixWorld?.elements;
    if (!e) return null;
    const ox = e[12], oy = e[13], oz = e[14];
    // ใกล้กล้องมาก (ตัวเราเอง/ประชิด) = ถือว่าเห็น
    if (Math.hypot(x - ox, y - oy, z - oz) < 1.2) return true;
    const blocked = rayBlocked(pb, ox, oy, oz, x, y, z);
    if (blocked === false) return true;
    if (blocked === null) return null;

    /* ray เส้นเดียวชนขอบ/ราว/สิ่งกีดขวางเล็ก ๆ ทั้งที่ยิงลอดได้ —
       ลองยิงจุดรอบ ๆ เป้าเล็กน้อย (tolerance) แล้วยอมรับถ้ามีเส้นใดโล่ง */
    const tol = Math.max(0, Math.min(0.35, Number(CFG.aimVisTolerance) || 0));
    if (tol <= 0 || !sample) return false;
    const rx = e[0], ry = e[1], rz = e[2];
    const ux = e[4], uy = e[5], uz = e[6];
    const offs = [
      [tol, 0], [-tol, 0], [0, tol], [0, -tol],
    ];
    for (const [a, b] of offs) {
      const px = x + rx * a + ux * b;
      const py = y + ry * a + uy * b;
      const pz = z + rz * a + uz * b;
      const b2 = rayBlocked(pb, ox, oy, oz, px, py, pz);
      if (b2 === false) return true;
    }
    return false;
  }

  /* ---------- เลือกจุดเล็ง: เอาจุดที่ "เห็นจริง" ตามลำดับความสำคัญ ---------- */
  // cache ตัวที่เลือกไว้ ~50ms (จุด world อัปเดตทุกเฟรม แต่ raycast ไม่ต้องยิงทุกเฟรม)
  const _choiceCache = new WeakMap();
  /* which body part the last successful resolve picked (for the optional label) */
  let _lastAimPart = "";
  const AIM_VIS_REFRESH_MS = 60;

  function resolveAimCandidate(pb, cam, a, mode, out) {
    // เกมอาจตั้ง a.occluded = true เมื่อ "จุดกลางตัว" ถูกบัง
    // แต่ครึ่งตัว/แขน/ขายังโผล่ — ห้ามใช้ค่านี้ตัดทั้งตัว
    const actorOccluded = !!(a && a.occluded === true);

    const root = actorVisualRoot(a);
    if (root) { try { root.updateWorldMatrix(true, true); } catch (_) { } }

    const cands = getAimCandidates(a);
    if (!cands) return false;
    if (!cands.length) return false;

    const block = Array.isArray(CFG.aimBlock) ? CFG.aimBlock : [];
    const blockSig = block.join(",");
    const now = performance.now();
    const ce = _choiceCache.get(a);
    if (ce && ce.mode === mode && ce.block === blockSig && ce.cands === cands && now - ce.t < AIM_VIS_REFRESH_MS) {
      if (candWorld(ce.cand, out)) {
        // re-check visibility (cache อาจ stale ถ้าเป้าหลบหลังกำแพง)
        const vis = pointVisible(pb, cam, out[0], out[1], out[2]);
        if (vis === true || (vis === null && a && a.occluded !== true)) {
          _lastAimPart = ce.cand.part || ce.cand.zone || mode;
          return true;
        }
        _choiceCache.delete(a);
      } else {
        _choiceCache.delete(a);
      }
    }

    const smart = CFG.aimSmartZone !== false;
    const zones = MODE_ZONES[mode] || MODE_ZONES.head;
    const bonePref = BONE_NAMES[mode] || null;
    const camE = cam?.matrixWorld?.elements;

    const arr = [];
    const tmp = [0, 0, 0];
    for (const c of cands) {
      const part = c.part || c.zone;
      if (block.includes(part) || block.includes(c.zone)) continue;
      let zr = zones.indexOf(c.zone);
      if (zr < 0) zr = zones.length;
      // ปิด smart zone = ล็อกเฉพาะส่วนที่เลือกไว้เท่านั้น
      if (!smart && zr > 0) continue;
      if (!candWorld(c, tmp)) continue;

      let br = 1;
      if (bonePref) {
        const n = (c.name || c.bone.name || "").toLowerCase();
        const want = (partOfName(n) === mode) ||
          bonePref.some((p) => n.includes(String(p).toLowerCase()));
        br = want ? 0 : 1;
      }

      let rank;
      if (mode === "auto") rank = 0;
      else rank = zr * 10 + br;
      let ang = 0;
      if (camE) {
        const dx = tmp[0] - camE[12], dy = tmp[1] - camE[13], dz = tmp[2] - camE[14];
        const d = Math.hypot(dx, dy, dz) || 1;
        const fx = -camE[8], fy = -camE[9], fz = -camE[10];
        const dot = Math.max(-1, Math.min(1, (dx * fx + dy * fy + dz * fz) / d));
        ang = Math.acos(dot);
      }
      arr.push({ c, rank, ang });
    }

    arr.sort((A, B) => (A.rank - B.rank) || (A.ang - B.ang));

    let _visChecked = 0;
    let unknown = null;
    for (const it of arr) {
      if (_visChecked >= 16) break; // cap raycast — เผื่อกรณีเห็นแค่ครึ่งตัว/ขา
      if (!candWorld(it.c, out)) continue;
      _visChecked++;
      const vis = pointVisible(pb, cam, out[0], out[1], out[2], _visChecked <= 8);
      if (vis === true) {
        _choiceCache.set(a, { t: now, mode, block: blockSig, cands, cand: it.c });
        _lastAimPart = it.c.part || it.c.zone || mode;
        return true;
      }
      if (vis === null && !actorOccluded && !unknown) {
        unknown = { cand: it.c, x: out[0], y: out[1], z: out[2] };
      }
    }
    // ไม่มีจุดที่ raycast ยืนยันว่าโล่ง → ใช้จุดที่ตรวจไม่ได้เฉพาะเมื่อเกม
    // ไม่ได้บอกว่าทั้งตัวถูกบัง (กันยิงทะลุกำแพง)
    if (unknown) {
      out[0] = unknown.x; out[1] = unknown.y; out[2] = unknown.z;
      _choiceCache.set(a, { t: now, mode, block: blockSig, cands, cand: unknown.cand });
      _lastAimPart = unknown.cand.part || unknown.cand.zone || mode;
      return true;
    }
    return false;
  }

  // เขียนจุดเล็ง (world) ลง out  — คืน false = "ไม่ควรยิง" (ทุกจุดที่เห็นโดนบัง)
  function getAimPoint(pb, cam, a, actorPos, mode, out) {
    const root = actorVisualRoot(a);

    if (root) {
      if (resolveAimCandidate(pb, cam, a, mode, out)) return true;
      // มีกระดูก/hitbox อยู่แต่ไม่เห็นจุดไหนเลย → ไม่ยิง (ห้ามยิงทะลุกำแพง/ยิงอากาศ)
      const cands = getAimCandidates(a);
      if (cands && cands.length) return false;
    }

    // ไม่มีกระดูกเลย → ใช้ความสูงมาตรฐานเดียวกับเกม (main: kf/os)
    const crouch = !!(a?.crouch ?? a?.isCrouching?.());
    const standH = {
      head: 1.63, neck: 1.48, chest: 1.25, pelvis: 0.98,
      upperarm: 1.35, forearm: 1.12, hand: 0.98,
      thigh: 0.78, shin: 0.45, foot: 0.12,
    };
    const base = standH[mode] != null ? standH[mode] : standH.chest;
    const h = crouch ? Math.max(0.1, base - 0.32) : base;
    out[0] = actorPos[0]; out[1] = actorPos[1] + h; out[2] = actorPos[2];
    _lastAimPart = mode;

    if (CFG.aimVisibleOnly && !isTargetVisible(pb, cam, out[0], out[1], out[2], a)) return false;
    return true;
  }

  /* ---------- SKELETON (วาดจากกระดูกจริง) ---------- */
  const _skelCache = new WeakMap();
  function getSkeletonData(a) {
    const root = actorVisualRoot(a);
    if (!root) return null;
    const cached = _skelCache.get(root);
    if (cached !== undefined) {
      // null ไม่ cache ถาวร — โมเดลอาจยังโหลดไม่เสร็จในเฟรมแรก
      if (cached !== null && cached.bones?.[0] && isDescendantOf(root, cached.bones[0])) return cached;
      if (cached !== null) _skelCache.delete(root);
    }

    const bones = [], index = new Map();
    try {
      root.traverse((o) => {
        if (!o?.isBone) return;
        const n = (o.name || "").toLowerCase();
        if (!n) return;
        if (/finger|thumb|index|middle|ring|pinky|toe|weapon|dummy|fx|ik|twist|helper|attach|prop|mouth|eye|jaw|hair|accessor/.test(n)) return;
        index.set(o, bones.length);
        bones.push(o);
      });
    } catch (_) { }

    let data = null;
    if (bones.length >= 3) {
      const pairs = [];
      for (const b of bones) {
        let p = b.parent;
        while (p && !index.has(p)) p = p.parent;
        if (p) pairs.push([index.get(p), index.get(b)]);
      }
      data = { root, bones, pairs };
    }
    if (data) _skelCache.set(root, data);
    return data;
  }

  function drawSkeleton(a, cam, lineWidth) {
    const data = getSkeletonData(a);
    if (!data) {
      if (!window.__skelWarned) { window.__skelWarned = true; try { console.warn("[ESP] no skeleton data for", a?.name); } catch (_) { } }
      return false;
    }
    try {
      const pts = new Array(data.bones.length);
      for (let i = 0; i < data.bones.length; i++) {
        const e = data.bones[i].matrixWorld?.elements;
        pts[i] = e ? project(e[12], e[13], e[14], cam) : null;
      }

      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (const [i, j] of data.pairs) {
        const p1 = pts[i], p2 = pts[j];
        if (!p1 || !p2) continue;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      const dot = Math.max(1, 1.2 * devicePixelRatio);
      for (const p of pts) {
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dot, 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    } catch (err) {
      try { console.warn("[ESP] drawSkeleton fail:", err); } catch (_) { }
      return false;
    }
  }

  /* ---------- VISIBILITY (RapiER Ray ตัวจริง + 4 จุดแบบเกม) ---------- */
  const OCC_HEIGHTS = [0.3, 0.8, 1.25, 1.65];
  const _visCache = new WeakMap();
  let _visErrLogged = false;

  function rapierRayCtor(pb) {
    return pb?.R?.Ray ?? pb?.player?.RAPIER?.Ray ?? null;
  }

  let _rayFilteredOk = null; // null = untested
  // true = ถูกกำแพงบัง | false = โล่ง | null = ตรวจไม่ได้
  function rayBlocked(pb, ox, oy, oz, tx, ty, tz) {
    const R = rapierRayCtor(pb);
    const world = pb?.world ?? pb?.player?.world;
    if (!R || !world || typeof world.castRay !== "function") return null;

    const dx = tx - ox, dy = ty - oy, dz = tz - oz;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.05) return false;

    const ndx = dx / dist, ndy = dy / dist, ndz = dz / dist;
    const maxToi = Math.max(0.05, dist - 0.4);

    // probe ครั้งเดียว: รูปแบบ filtered ใช้ได้หรือไม่
    if (_rayFilteredOk === null) {
      try {
        const ray = new R({ x: ox, y: oy, z: oz }, { x: ndx, y: ndy, z: ndz });
        world.castRay(ray, maxToi, true, undefined, undefined, pb?.player?.collider, undefined, pb?.notGlass);
        _rayFilteredOk = true;
      } catch (_) {
        _rayFilteredOk = false;
      }
    }

    if (_rayFilteredOk) {
      try {
        const ray = new R({ x: ox, y: oy, z: oz }, { x: ndx, y: ndy, z: ndz });
        const hit = world.castRay(ray, maxToi, true, undefined, undefined, pb?.player?.collider, undefined, pb?.notGlass);
        if (!hit) return false;
        const toi = hit.timeOfImpact ?? hit.toi ?? 0;
        return toi > 0.5;
      } catch (_) {
        _rayFilteredOk = false; // fallback ถาวร
      }
    }

    // simple path (no filter)
    try {
      const back = 0.6;
      const nx = ox + ndx * back, ny = oy + ndy * back, nz = oz + ndz * back;
      const ray = new R({ x: nx, y: ny, z: nz }, { x: ndx, y: ndy, z: ndz });
      const hit = world.castRay(ray, Math.max(0.05, dist - back - 0.4), true);
      if (!hit) return false;
      const toi = hit.timeOfImpact ?? hit.toi ?? 0;
      return toi > 0.2;
    } catch (_) {
      if (!_visErrLogged) { _visErrLogged = true; console.warn("[ESP] raycast failed"); }
      return null;
    }
  }

  function isTargetVisible(pb, cam, tx, ty, tz, actor) {
    if (!CFG.aimVisibleOnly) return true;

    const now = performance.now();
    const cached = _visCache.get(actor);
    if (cached && now - cached.t < 60) return cached.v;

    // เกมคำนวณ actor.occluded เองทุก ~4 เฟรม (gateVisual) ด้วย ray + collision group
    // ที่ถูกต้อง — ถ้าเกมบอกว่าโดนบัง เชื่อเกมทันที (fail-closed)
    if (actor && actor.occluded === true) {
      _visCache.set(actor, { t: now, v: false });
      return false;
    }

    let visible = false;
    const e = cam?.matrixWorld?.elements;
    const pos = [0, 0, 0];

    if (e && posOfActor(actor, pos)) {
      const ox = e[12], oy = e[13], oz = e[14];

      if (Math.hypot(tx - ox, ty - oy, tz - oz) < 1.5) {
        visible = true;
      } else {
        // จุดเล็งที่เลือก + 4 ระดับความสูงแบบเกม — โล่งอย่างน้อย 1 เส้น = เห็น
        const heights = [ty];
        for (const h of OCC_HEIGHTS) heights.push(pos[1] + h);

        let checked = 0, clear = 0;
        for (const hy of heights) {
          const blocked = rayBlocked(pb, ox, oy, oz, pos[0], hy, pos[2]);
          if (blocked === null) continue;
          checked++;
          if (!blocked) { clear++; break; }
        }
        // ตรวจไม่ได้เลย = fail-closed (กันล็อกทะลุกำแพง)
        visible = checked > 0 && clear > 0;
      }
    }

    _visCache.set(actor, { t: now, v: visible });
    return visible;
  }

  /* ---------- Hold-to-aim (ปุ่มตั้งได้ + rebind ได้ + รองรับ pointer lock) ---------- */
  const _heldKeys = new Set();
  const _heldMouse = new Set();
  let _capsOn = false;
  let _bindingHold = false;
  let _bindingIgnoreUntil = 0;

  function parseHold(b) {
    if (b === "shift") return { kind: "shift" };
    if (b === "caps") return { kind: "caps" };
    if (typeof b === "string" && b.startsWith("key:")) return { kind: "key", value: b.slice(4) };
    if (typeof b === "string" && b.startsWith("mouse:")) return { kind: "mouse", value: parseInt(b.slice(6), 10) };
    // legacy
    if (b === "lmb") return { kind: "mouse", value: 0 };
    if (b === "mmb") return { kind: "mouse", value: 1 };
    if (b === "rmb") return { kind: "mouse", value: 2 };
    return { kind: "mouse", value: 2 };
  }

  function holdPressed() {
    const hb = parseHold(CFG.aimHoldButton);
    if (hb.kind === "shift") return _heldKeys.has("ShiftLeft") || _heldKeys.has("ShiftRight");
    if (hb.kind === "caps") return _capsOn;
    if (hb.kind === "key") return _heldKeys.has(hb.value);
    if (hb.kind === "mouse") return _heldMouse.has(hb.value);
    return false;
  }

  function _holdBindLabel() {
    const hb = parseHold(CFG.aimHoldButton);
    if (hb.kind === "shift") return "Shift";
    if (hb.kind === "caps") return "CapsLock";
    if (hb.kind === "key") return hb.value.replace(/^Key/, "").replace(/^Digit/, "");
    if (hb.kind === "mouse") return "Mouse" + hb.value;
    return String(CFG.aimHoldButton);
  }

  function updateHoldLabel() {
    const btn = document.getElementById("pbHoldBind");
    if (!btn) return;
    btn.textContent = _bindingHold ? "Press key/button…" : _holdBindLabel();
  }

  function _onHoldDown(e) {
    const bindBtn = document.getElementById("pbHoldBind");
    // เข้าโหมด rebind เมื่อคลิกปุ่ม bind
    if (bindBtn && e.target === bindBtn) {
      _bindingHold = true;
      _bindingIgnoreUntil = performance.now() + 80;
      updateHoldLabel();
      try { e.preventDefault(); e.stopPropagation(); } catch (_) { }
      return;
    }
    // capture mouse button
    if (_bindingHold && performance.now() > _bindingIgnoreUntil) {
      CFG.aimHoldButton = "mouse:" + e.button;
      _bindingHold = false;
      saveCfg();
      updateHoldLabel();
      try { e.preventDefault(); e.stopPropagation(); } catch (_) { }
      return;
    }
    // tracking ปกติ
    _heldMouse.add(e.button);
  }
  function _onHoldUp(e) {
    _heldMouse.delete(e.button);
    if (_bindingHold) return;
  }
  function _onHoldKey(e, down) {
    // capture key
    if (_bindingHold && performance.now() > _bindingIgnoreUntil) {
      if (e.code === "Escape") {
        _bindingHold = false;
        updateHoldLabel();
        return;
      }
      CFG.aimHoldButton = "key:" + e.code;
      _bindingHold = false;
      saveCfg();
      updateHoldLabel();
      try { e.preventDefault(); e.stopPropagation(); } catch (_) { }
      return;
    }
    if (down) _heldKeys.add(e.code);
    else _heldKeys.delete(e.code);
    // sync CapsLock toggle state
    if (e.code === "CapsLock" && typeof e.getModifierState === "function") {
      _capsOn = !!e.getModifierState("CapsLock");
    }
  }

  addEventListener("pointerdown", _onHoldDown, true);
  addEventListener("pointerup", _onHoldUp, true);
  addEventListener("mousedown", _onHoldDown, true);
  addEventListener("mouseup", _onHoldUp, true);
  addEventListener("keydown", (e) => _onHoldKey(e, true), true);
  addEventListener("keyup", (e) => _onHoldKey(e, false), true);
  addEventListener("blur", () => { _heldKeys.clear(); _heldMouse.clear(); _capsOn = false; });
  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement) _heldMouse.clear();
  });
  document.addEventListener("contextmenu", (e) => {
    const hb = parseHold(CFG.aimHoldButton);
    if (CFG.aimOnHold && hb.kind === "mouse" && hb.value === 2) e.preventDefault();
  }, true);

  /* ---------- PREDICTION: คาดการณ์ตำแหน่งจากความเร็ว (root, ไม่ใช่ aim point) ---------- */
  const _velState = new WeakMap();
  const PRED_MAX_SPEED = 20;   // m/s — กัน velocity กระโดดจาก packet jitter
  const PRED_HIST_MS = 150;    // หน้าต่าง regression (กว้าง = นิ่ง, แคบ = ตอบสนองไว)
  const PRED_HIST_MAX = 14;
  const PRED_EMA = 0.45;       // ผสม velocity ใหม่กับค่าเก่า

  // least-squares slope ของตำแหน่งเทียบเวลา (3 แกน) → velocity ที่นิ่งกว่า delta ต่อเฟรม
  function _velFromHistory(hist, now) {
    const n = hist.length;
    if (n < 3) return null;
    const t0 = hist[0][0];
    const span = (now - t0) / 1000;
    if (span < 0.03) return null; // ตัวอย่างชิดกันเกินไป → slope ไม่น่าเชื่อถือ
    let st = 0, stt = 0;
    for (let i = 0; i < n; i++) {
      const t = (hist[i][0] - t0) / 1000;
      st += t; stt += t * t;
    }
    const den = n * stt - st * st;
    if (Math.abs(den) < 1e-6) return null;
    const v = [0, 0, 0];
    for (let ax = 0; ax < 3; ax++) {
      let sp = 0, stp = 0;
      for (let i = 0; i < n; i++) {
        const t = (hist[i][0] - t0) / 1000;
        sp += hist[i][1 + ax];
        stp += t * hist[i][1 + ax];
      }
      v[ax] = (n * stp - st * sp) / den;
    }
    return v;
  }

  function predictPoint(a, actorPos, base, out) {
    const ms = Math.max(0, Math.min(250, CFG.aimPredictMs || 0));
    if (!ms) {
      out[0] = base[0]; out[1] = base[1]; out[2] = base[2];
      return;
    }
    const now = performance.now();
    let st = _velState.get(a);
    if (!st) {
      st = {
        t: now,
        p: [actorPos[0], actorPos[1], actorPos[2]],
        v: [0, 0, 0],
        hist: [[now, actorPos[0], actorPos[1], actorPos[2]]],
      };
      _velState.set(a, st);
    }
    const dt = (now - st.t) / 1000;
    if (dt > 0.30) {
      // ห่างนาน → reset velocity + history
      st.v[0] = st.v[1] = st.v[2] = 0;
      st.p[0] = actorPos[0]; st.p[1] = actorPos[1]; st.p[2] = actorPos[2];
      st.hist.length = 0;
    }
    if (dt > 0.004) {
      st.hist.push([now, actorPos[0], actorPos[1], actorPos[2]]);
      if (st.hist.length > PRED_HIST_MAX) st.hist.shift();
      while (st.hist.length > 2 && now - st.hist[0][0] > PRED_HIST_MS) st.hist.shift();

      // regression ก่อน (นิ่งกว่า) — ถ้าตัวอย่างยังน้อยใช้ delta ต่อเฟรมแทน
      const reg = _velFromHistory(st.hist, now);
      let nx, ny, nz;
      if (reg) {
        nx = reg[0]; ny = reg[1]; nz = reg[2];
      } else {
        nx = (actorPos[0] - st.p[0]) / dt;
        ny = (actorPos[1] - st.p[1]) / dt;
        nz = (actorPos[2] - st.p[2]) / dt;
      }
      st.v[0] += (nx - st.v[0]) * PRED_EMA;
      st.v[1] += (ny - st.v[1]) * PRED_EMA;
      st.v[2] += (nz - st.v[2]) * PRED_EMA;
      const sp = Math.hypot(st.v[0], st.v[1], st.v[2]);
      if (sp > PRED_MAX_SPEED) {
        const k = PRED_MAX_SPEED / sp;
        st.v[0] *= k; st.v[1] *= k; st.v[2] *= k;
      }
      st.p[0] = actorPos[0]; st.p[1] = actorPos[1]; st.p[2] = actorPos[2];
      st.t = now;
    }
    const s = ms / 1000;
    let px = base[0] + st.v[0] * s;
    let py = base[1] + st.v[1] * s;
    let pz = base[2] + st.v[2] * s;
    // clamp การเลื่อนไม่ให้เกิน 2m — กัน snap ผิดพลาด
    const dx = px - base[0], dy = py - base[1], dz = pz - base[2];
    const mag = Math.hypot(dx, dy, dz);
    if (mag > 2.0) { const k = 2.0 / mag; px = base[0] + dx * k; py = base[1] + dy * k; pz = base[2] + dz * k; }
    out[0] = px; out[1] = py; out[2] = pz;
  }

  // normalize มุมให้อยู่ใน [-π, π]
  function _wrapPi(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  /* ---------- EVALUATE + TARGET SELECTION ---------- */
  /* FOV อิง "ขนาดบนจอ" ไม่ใช่องศาโลก: ตอนซูมเข้าสโคป camera.fov จะเล็กลง
     ถ้าใช้ FOV คงที่แบบองศา วงจะขยายกินพื้นที่จอมากขึ้นเรื่อย ๆ
     → แปลง FOV ที่ตั้งไว้เป็นองศาที่สัมพันธ์กับ fov ปกติของกล้องตัวนั้น
     เพื่อให้วง/รัศมีบนจอคงที่ทุกสถานะซูม ( unscoped = ค่าเดิม ) */
  const aimBaseFovMap = new WeakMap();
  function aimBaseFov(cam) {
    const cf = Number(cam && cam.fov) || 0;
    if (!cf) return 60;
    const prev = aimBaseFovMap.get(cam) || 0;
    const base = cf > prev ? cf : (prev || cf);
    aimBaseFovMap.set(cam, base);
    return base;
  }
  function aimEffFovRad(cam) {
    if (CFG.aimFov >= 175) return Math.PI;
    const deg = Math.min(179, CFG.aimFov);
    const cf = Number(cam && cam.fov) || 0;
    if (!cf) return deg * DEG;
    const base = aimBaseFov(cam);
    const ratio = Math.tan(deg * DEG / 2) / Math.tan(base * DEG / 2);
    return Math.min(Math.PI, 2 * Math.atan(ratio * Math.tan(cf * DEG / 2)));
  }

  function scoreOf(angles, a) {
    if (CFG.aimPriority === "dist") return angles.dist;
    if (CFG.aimPriority === "hp") return (a.hp ?? 100) * 1000 + angles.angTotal;
    return angles.angTotal;
  }

  function evaluateActor(pb, cam, a, fovRad) {
    const pos = [0, 0, 0];
    if (!posOfActor(a, pos)) return null;
    const aim = [0, 0, 0];
    if (!getAimPoint(pb, cam, a, pos, CFG.aimBone, aim)) return null;
    const aimed = [0, 0, 0];
    predictPoint(a, pos, aim, aimed);
    const angles = calcAnglesToTarget(cam, aimed, aimed[1], pb.player);
    if (!angles) return null;
    if (angles.angTotal > fovRad) return null;
    return { actor: a, angles, aim: aimed, realAim: aim, pos, score: scoreOf(angles, a) };
  }

  function findBestTarget(pb, cam, fovRad) {
    fovRad = fovRad || (CFG.aimFov * Math.PI / 180);
    if (!pb?.me || !cam) return null;
    const myTeam = pb.me.team;

    let best = null;
    let actors = actorsOf(pb);
    const pos = [0, 0, 0];
    for (const a of actors) {
      if (!a || a === pb.me) continue;
      if (a.team === myTeam) continue;
      if (!a.alive) continue;
      if (!posOfActor(a, pos)) continue;

      const ev = evaluateActor(pb, cam, a, fovRad);
      if (!ev) continue;
      if (!best || ev.score < best.score) best = ev;
    }
    return best;
  }

  // ─── State aimbot ───
  const aimState = {
    lockedId: null,
    lockedActor: null,
    lockAim: null,
    part: "",
    lockSince: 0,
    // feedforward (เป้าเดิน) — เก็บ absolute target angle ต่อเฟรม
    track: null,     // { actor, pitch, yaw, t }
    wP: 0, wY: 0,    // angular velocity ของเป้า (rad/s, EMA)
  };
  const AIM_SWITCH_MS = 340;
  const AIM_SWITCH_MARGIN = 0.7;

  // ─── aimbot tick หลัก ───
  let _dbgFrame = 0;
  let lastAimMs = performance.now();
  function aimAssistTick(pb, cam) {
    _dbgFrame++;
    const doLog = (_dbgFrame % 120 === 0);

    const nowAim = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (nowAim - lastAimMs) / 1000));
    lastAimMs = nowAim;
    aimState.lockAim = null;

    if (!CFG.aimAssist) { if (doLog) console.log("[AIM] aimAssist=false, skip"); return; }
    if (!pb?.player?.addLook) {
      if (doLog) console.log("[AIM] no pb.player.addLook — pb.player=", pb?.player);
      return;
    }
    if (!pb?.me?.alive) return;
    if (CFG.aimOnHold && !holdPressed()) return;

    const fovRad = aimEffFovRad(cam);
    const lockFov = fovRad * 1.25;
    let target = null;

    // ─── Target Lock: รักษาเป้าเดิมเมื่อยังอยู่ใน FOV (hysteresis 1.25x) ───
    if (CFG.aimLock && aimState.lockedActor) {
      const la = aimState.lockedActor;
      if (!la.alive) {
        aimState.lockedActor = null; aimState.lockedId = null;
      } else {
        const ev = evaluateActor(pb, cam, la, lockFov);
        if (ev) target = ev;
        else { aimState.lockedActor = null; aimState.lockedId = null; }
      }
    }

    // ถ้าไม่มี lock หรือ lock ตกไป → หาใหม่
    if (!target) {
      target = findBestTarget(pb, cam, fovRad);
      if (target) {
        aimState.lockedId = target.actor.id ?? target.actor.name;
        aimState.lockedActor = target.actor;
        aimState.lockSince = nowAim;
      } else {
        aimState.lockedId = null;
        aimState.lockedActor = null;
        return;
      }
    } else if (CFG.aimLock && nowAim - aimState.lockSince > AIM_SWITCH_MS) {
      // สลับเป้าเฉพาะเมื่อมีเป้าที่ดีกว่าชัดเจน (30%+)
      const best = findBestTarget(pb, cam, fovRad);
      if (best && best.actor !== target.actor && best.score < target.score * AIM_SWITCH_MARGIN) {
        target = best;
        aimState.lockedId = best.actor.id ?? best.actor.name;
        aimState.lockedActor = best.actor;
        aimState.lockSince = nowAim;
      }
    }

    // sync lockedActor for HUD when lock disabled
    if (!CFG.aimLock) {
      aimState.lockedActor = target.actor;
      aimState.lockedId = target.actor.id ?? target.actor.name;
    }

    const { angles } = target;

    // ─── Smoothing: ยิ่ง smooth สูง = กล้องเข้าหาเป้าเร็วขึ้น ───
    const smooth = Math.max(1, CFG.aimSmooth);
    const rate = Math.min(1, 1 - Math.exp(-dt * smooth * 5));

    const movePitch = angles.deltaPitch * rate;
    const moveYaw = angles.deltaYaw * rate;

    // หมุน player
    pb.player.addLook(movePitch, moveYaw);

    // บังคับเกมให้อัปเดต rotation กล้อง Three.js ทันทีในเฟรมนี้
    if (typeof pb.player.updateCamera === "function") {
      pb.player.updateCamera();
    }
    if (typeof pb.player.camera?.updateMatrixWorld === "function") {
      pb.player.camera.updateMatrixWorld(true);
    }

    // เก็บจุดเล็งไว้ให้ drawOnce วาด indicator (canvas ถูก clear หลัง render)
    aimState.lockAim = [...target.aim];
    aimState.part = _lastAimPart;
  }

  // ─── helper: วาด FOV circle ───
  function drawFovCircle(cam) {
    const cx = cv.width / 2, cy = cv.height / 2;
    // คำนวณ fovPx: ถ้า fov = 180 = ทั้งครึ่งหน้า ให้ไม่วาด (ไม่มีประโยชน์)
    if (CFG.aimFov >= 175) return;
    const baseFov = aimBaseFov(cam);
    const fovPx = Math.tan(Math.min(179, CFG.aimFov) * DEG / 2) /
      Math.tan(baseFov * DEG / 2) *
      (cv.height / 2);
    ctx.save();
    ctx.globalAlpha = CFG.aimMode === "bot" ? 0.5 : 0.35;
    ctx.strokeStyle = CFG.aimMode === "bot" ? "#ff2020" : "#ffffff";
    ctx.lineWidth = 1 * devicePixelRatio;
    ctx.setLineDash([4 * devicePixelRatio, 4 * devicePixelRatio]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(10, fovPx), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ---------- MOBILE BYPASS ENGINE (RUNTIME SPOOFING — no WS hook) ---------- */
  // ค่า Device Enum ของเกม: 0=unknown, 1=pc, 2=mobile (จาก testBots-WllQD4W5.js)
  const DEVICE_MOBILE = 2;
  const OPCODE_DEVICE_REQ = 9030;

  // ─── Vite Global Scope Scanner ───
  // PB ใช้ Vite ESM bundle ไม่มี __webpack_require__ / __pb global
  // แต่ Vite ใน dev/preview mode จะมี window.__vite_plugin_* หรือ import.meta
  // ใน prod mode: scan window object สำหรับ object ที่มี method ที่เราต้องการ
  //
  // กลยุทธ์: scan window keys ที่เป็น object แล้วหา canEnterPlatform / setLocalDevice
  function pbViteScan(targetMethods, maxDepth = 2) {
    const found = {};
    const visited = new WeakSet();
    function scan(obj, depth) {
      if (!obj || depth > maxDepth || visited.has(obj)) return;
      try { visited.add(obj); } catch (_) { return; }
      for (const key of Object.getOwnPropertyNames(obj)) {
        try {
          const val = obj[key];
          if (targetMethods.includes(key) && typeof val === "function") {
            found[key] = { fn: val, host: obj };
          }
          if (depth < maxDepth && val && typeof val === "object" && !Array.isArray(val)) {
            scan(val, depth + 1);
          }
        } catch (_) { }
      }
    }
    // scan window keys ที่ดูเหมือน game object (ไม่ใช่ DOM API มาตรฐาน)
    const skipKeys = new Set(["window", "document", "location", "history", "navigator", "screen", "performance",
      "console", "Math", "JSON", "Array", "Object", "String", "Number", "Boolean", "Symbol", "Promise",
      "Map", "Set", "WeakMap", "WeakSet", "Error", "Proxy", "Reflect", "Intl", "crypto"]);
    for (const k of Object.getOwnPropertyNames(window)) {
      if (skipKeys.has(k) || k.startsWith("on") || k.startsWith("webkit")) continue;
      try {
        const v = window[k];
        if (v && typeof v === "object") scan(v, 0);
      } catch (_) { }
    }
    return found;
  }

  function hookMobileBypass(pb) {
    if (!CFG.fakeMobile) return;

    try {
      // ─── [A] setLocalDevice(2) — ผ่าน mobile-spoof.js cache ก่อน ───
      if (typeof window.__pbRetryDevicePatch === "function") {
        try { window.__pbRetryDevicePatch(); } catch (_) { }
      }

      // ─── [B] Vite global scope scan สำหรับ setLocalDevice + canEnterPlatform ───
      // รัน scan ครั้งเดียว (ตอน hookMobileBypass ถูกเรียกครั้งแรก)
      if (!window.__pbViteScanDone) {
        window.__pbViteScanDone = true;
        try {
          const hits = pbViteScan(["setLocalDevice", "canEnterPlatform", "localDevice"]);

          // patch setLocalDevice(2) ถ้าเจอ
          if (hits.setLocalDevice && !window.__pbSetLocalDevice) {
            window.__pbSetLocalDevice = hits.setLocalDevice.fn;
            try { hits.setLocalDevice.fn.call(hits.setLocalDevice.host, DEVICE_MOBILE); } catch (_) { }
          }

          // patch canEnterPlatform ให้ return true เสมอ
          if (hits.canEnterPlatform && !hits.canEnterPlatform.host.__bypassCanEnter) {
            hits.canEnterPlatform.host.__bypassCanEnter = true;
            hits.canEnterPlatform.host.canEnterPlatform = function () { return true; };
          }
        } catch (_) { }
      }

      if (!pb) return;

      // ─── [C] session.lobby.canEnterPlatform (ถ้า pb expose session) ───
      const session = pb.session ?? pb._session ?? window.__pbSession;
      const room = pb.room ?? pb._room ?? session?.room;

      if (session?.lobby && !session.lobby.__bypassMobile) {
        session.lobby.__bypassMobile = true;
        const origCanEnter = session.lobby.canEnterPlatform;
        if (typeof origCanEnter === "function") {
          session.lobby.canEnterPlatform = function () {
            return CFG.fakeMobile ? true : origCanEnter.apply(this, arguments);
          };
        }
      }

      // ─── [D] room.devices[mySlot] + deviceOf() ───
      if (room) {
        if (Array.isArray(room.devices) && room.mySlot !== undefined) {
          room.devices[room.mySlot] = DEVICE_MOBILE;
        }
        if (typeof room.deviceOf === "function" && !room.__bypassDeviceOf) {
          room.__bypassDeviceOf = true;
          const origDeviceOf = room.deviceOf;
          room.deviceOf = function (slot) {
            return (CFG.fakeMobile && slot === this.mySlot) ? DEVICE_MOBILE : origDeviceOf.call(this, slot);
          };
        }
      }
    } catch (_) { }
  }

  // ─── localDevice() SPOOF (ปลอดภัยกว่า WS prototype hook — ไม่โดน gl-hook จับ) ───
  // แทนที่จะ hook WebSocket.prototype.send (ซึ่ง AC watchdog ตรวจ [native code] ได้),
  // เราหา setLocalDevice / localDevice getter จาก module scope ของเกมโดยตรง
  // แล้วเรียก setLocalDevice(2) เพื่อบอกเกมว่าเราเป็น mobile ก่อน device packet ออก
  try {
    // เกม export setLocalDevice ผ่าน window.__pbDev หรือ window.__pbNet หรือ __pb.net
    // ลองหาทุก path ที่เป็นไปได้
    const candidates = [
      () => window.__pbDev?.setLocalDevice,
      () => window.__pbNet?.setLocalDevice,
      () => window.__pb?.net?.setLocalDevice,
      () => window.__pb?.device?.setLocalDevice,
    ];
    for (const fn of candidates) {
      try {
        const setter = fn();
        if (typeof setter === "function") {
          window.__pbSetLocalDevice = setter; // cache ไว้ใช้ซ้ำ
          break;
        }
      } catch (_) { }
    }
  } catch (_) { }

  /* ---------- NO RECOIL & NO SPREAD + HUMANIZATION (ดักระบบอาวุธ PB Recon) ---------- */

  /*
   * HUMANIZATION (โหมด visual-only)
   * ——————————————————————
   * kick ถูกเก็บเป็น offset ภายใน แล้วใส่ให้ "กล้องตอน render" เท่านั้น
   * - ไม่แตะ player.pitch/yaw → การเล็ง/เน็ตเวิร์กไม่เปลี่ยน
   * - ไม่แตะ ws.xhCur → spread จริงไม่เปลี่ยน (ของเดิมเขียน spread จริง = กระสุนเบี้ยว)
   * - ไม่แตะ aimRay → กระสุนยังออกจากจุดเล็งจริง
   * ผล: จอเราสะบัดตอนยิงแบบธรรมชาติ แต่คนอื่นจะเห็นการเล็งที่นุ่มอยู่แล้ว (โหมด A)
   */

  // Gaussian Box-Muller (สุ่มแบบ normal distribution สำหรับ humanization)
  function randGauss(sigma = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // State สำหรับ visual recoil simulation (องศา)
  const humanState = {
    pitch: 0,        // offset แนวตั้ง (ขึ้น = บวก)
    yaw: 0,          // offset แนวนอน (ขวา = บวก)
    lastShot: 0,     // timestamp ล่าสุดที่ยิง (ms)
    shotSeq: 0,      // ลำดับกระสุนในชุด
  };
  /* Network-visible jitter: spectators read the target's s.pitch/s.yaw, so a
     perfectly still no-recoil gun looks impossible. This adds a small,
     decaying offset to the real state after the shot — the local view-model
     kick above is invisible to anyone else. */
  const netState = { p: 0, y: 0, ap: 0, ay: 0 };

  // เรียกเมื่อยิงกระสุน 1 ลูก — สร้าง visual kick (ไม่แตะ state จริง)
  function humanOnShot() {
    if (!CFG.humanize || !CFG.noRecoil) return;
    const now = performance.now();
    // addRecoil() กับ kick() ถูกเรียกในกระสุนเดียวกัน — กันคิด kick ซ้ำ
    if (now - humanState.lastShot < 18) return;
    if (now - humanState.lastShot > 400) humanState.shotSeq = 0;
    humanState.lastShot = now;
    humanState.shotSeq++;

    // Progressive pitch: กระสุนแรกดีดน้อย แล้วค่อยๆ มากขึ้น
    const seqFactor = Math.min(1, 0.4 + humanState.shotSeq * 0.12);
    humanState.pitch += CFG.humanPitchAmp * seqFactor + randGauss(CFG.humanPitchAmp * 0.15);
    // สลับซ้าย/ขวาแทน noise ล้วน — ดูเป็นลายปืนจริงและไม่สั่นเท่าเดิม
    const sway = (humanState.shotSeq % 2 ? 1 : -1) * CFG.humanYawAmp * seqFactor * 0.7;
    humanState.yaw += sway + randGauss(CFG.humanYawAmp * 0.3);
    humanState.pitch = Math.max(-2.5, Math.min(2.5, humanState.pitch));
    humanState.yaw = Math.max(-1.2, Math.min(1.2, humanState.yaw));

    const amp = Math.max(0, Math.min(1.5, Number(CFG.humanNet) || 0));
    if (amp > 0) {
      netState.p += amp * (0.45 + 0.15 * seqFactor) + randGauss(amp * 0.18);
      netState.y += randGauss(amp * 0.35);
    }
  }

  // เรียกทุกเฟรม — ลด offset กลับแบบ exponential (ไม่แตะกล้อง/player)
  function humanTick(pb, dt) {
    /* network-visible jitter first: it must work even with the local visual
       humanization off, because it is what a spectator sees. */
    const amp = Math.max(0, Math.min(1.5, Number(CFG.humanNet) || 0));
    if (CFG.noRecoil && amp > 0) {
      const sign = Number(CFG.humanPitchSign) || 1;
      const st = (pb && pb.me && typeof pb.me.pitch === "number") ? pb.me
        : (pb.player && (pb.player.s || pb.player)) || null;
      if (st && typeof st.pitch === "number") {
        const dp = netState.p - netState.ap;
        const dy = netState.y - netState.ay;
        if (dp || dy) {
          st.pitch = Math.max(-1.4, Math.min(1.4, st.pitch + dp * DEG * sign));
          st.yaw = (Number(st.yaw) || 0) + dy * DEG;
          netState.ap = netState.p;
          netState.ay = netState.y;
        }
      }
      const k = Math.exp(-dt / 0.14);
      netState.p *= k;
      netState.y *= k;
    } else if (netState.p || netState.y) {
      netState.p = 0; netState.y = 0; netState.ap = 0; netState.ay = 0;
    }

    if (!CFG.humanize || !CFG.noRecoil) {
      humanState.pitch = 0;
      humanState.yaw = 0;
      return;
    }

    const ms = Math.max(16, CFG.humanReturnMs || 110);
    const returnRate = 1 - Math.pow(1 - 0.60, dt * 1000 / ms);

    humanState.pitch -= humanState.pitch * returnRate;
    humanState.yaw -= humanState.yaw * returnRate;

    if (Math.abs(humanState.pitch) < 0.001) humanState.pitch = 0;
    if (Math.abs(humanState.yaw) < 0.001) humanState.yaw = 0;
  }

  let activeWS = null;
  let lastFrameTime = performance.now();

  /* ระดับการลด (0..100%) — 100 = ตัดเต็ม, 0 = ปล่อยเต็ม */
  const recoilKeep = () => 1 - Math.max(0, Math.min(100, Number(CFG.recoilLevel == null ? 100 : CFG.recoilLevel))) / 100;
  const spreadKeep = () => 1 - Math.max(0, Math.min(100, Number(CFG.spreadLevel == null ? 100 : CFG.spreadLevel))) / 100;

  function hookNoRecoil(pb) {
    if (!pb) return;

    // Tick humanization (ทุกเฟรม)
    const now = performance.now();
    const dt = Math.min((now - lastFrameTime) / 1000, 0.1); // cap 100ms
    lastFrameTime = now;
    humanTick(pb, dt);

    // 1. Hook player.addRecoil — ตัดแรงดีดกล้อง ส่ง visual kick แทน
    if (pb.player && !pb.player.__nrHooked) {
      pb.player.__nrHooked = true;
      const origAddRecoil = pb.player.addRecoil;
      pb.player.addRecoil = function (pitch, yaw) {
        if (CFG.noRecoil) {
          const k = recoilKeep();
          this.recoilPitch *= k;
          // trigger visual humanization ตอนเกมเรียก addRecoil (= ยิงจริง)
          humanOnShot();
          return origAddRecoil.call(this, pitch * k, yaw * k);
        }
        return origAddRecoil.call(this, pitch, yaw);
      };
    }
    if (CFG.noRecoil && pb.player) {
      pb.player.recoilPitch = 0;
    }

    // 2. Weapon system (ws)
    const ws = pb.pbWeapons ? pb.pbWeapons() : (pb.weapons?.ws ?? pb.weapons);
    if (!ws) return;

    // เคลียร์ค่าแรงดีดสะสมแบบ Real-time ทุกเฟรม
    if (CFG.noRecoil) {
      const k = recoilKeep();
      ws.recV *= k;
      ws.recV0 *= k;
      ws.recVT *= k;
      ws.recVt *= k;
      ws.recH *= k;
      ws.recHt *= k;
      ws.yawOff *= k;
      ws.recoilPitch *= k;
      ws.recoilYaw *= k;
      // ห้าม zero appliedPitch/appliedYaw — syncCamera ใช้ค่านี้คำนวณ delta เพื่อ
      // "ดึงกล้องกลับ" ให้ตรงกับ recoilPitch ที่ถูกย่อ
      ws.shakeP *= k;
      ws.shakeR *= k;
      if (k === 0) ws.pbShake = null;
    }
    if (CFG.noSpread) {
      const k = spreadKeep();
      ws.xhCur *= k;
      ws.xhPrev *= k;
      ws.xhStart *= k;
      ws.xhTarget *= k;
      ws.spreadNow *= k;
    }

    // Backup & Patch Weapon Parameters
    function patchSlots() {
      if (!ws.slots) return;
      for (const slot of ws.slots) {
        if (!slot?.def?.params) continue;
        const p = slot.def.params;
        if (p.recoil) {
          p.recoil.__orig ??= {
            camSyncRate: p.recoil.camSyncRate,
            vertAngle: p.recoil.vertAngle,
            vertMax: p.recoil.vertMax,
            horzAngle: p.recoil.horzAngle,
            horzMax: p.recoil.horzMax,
          };
          if (CFG.noRecoil) {
            const k = recoilKeep();
            const o = p.recoil.__orig;
            p.recoil.camSyncRate = o.camSyncRate * k;
            p.recoil.vertAngle = o.vertAngle * k;
            p.recoil.vertMax = o.vertMax * k;
            p.recoil.horzAngle = o.horzAngle * k;
            p.recoil.horzMax = o.horzMax * k;
          } else {
            Object.assign(p.recoil, p.recoil.__orig);
          }
        }
        if (p.spread) {
          p.spread.__orig ??= {
            deviation: p.spread.deviation,
            cross: p.spread.cross ? { ...p.spread.cross } : null,
          };
          if (CFG.noSpread) {
            const k = spreadKeep();
            const o = p.spread.__orig;
            p.spread.deviation = o.deviation * k;
            if (p.spread.cross) {
              const oc = o.cross || {};
              p.spread.cross.min = (oc.min || 0) * k;
              p.spread.cross.max = (oc.max || 0) * k;
              p.spread.cross.stand = (oc.stand || 0) * k;
              p.spread.cross.move = (oc.move || 0) * k;
              p.spread.cross.jump = (oc.jump || 0) * k;
            }
          } else {
            p.spread.deviation = p.spread.__orig.deviation;
            if (p.spread.__orig.cross && p.spread.cross) {
              Object.assign(p.spread.cross, p.spread.__orig.cross);
            }
          }
        }
      }
    }
    patchSlots();

    if (ws === activeWS) return;
    activeWS = ws;

    if (!ws.__nrHooked) {
      ws.__nrHooked = true;

      // ดัก kick(): ล้าง recoil แต่ยังปล่อยให้ spread โตตามปกติ (ถ้าไม่ได้เปิด NoSpread)
      const origKick = ws.kick;
      if (typeof origKick === "function") {
        ws.kick = function (def) {
          if (!CFG.noRecoil) return origKick.apply(this, arguments);
          const rk = recoilKeep();
          const sk = spreadKeep();
          /* run the real kick so spread grows naturally, then scale both
             results — level 100 reproduces the old "all zero" behaviour. */
          const res = origKick.apply(this, arguments);
          this.recV *= rk;
          this.recV0 *= rk;
          this.recVT *= rk;
          this.recVt *= rk;
          this.recH *= rk;
          this.recHt *= rk;
          this.yawOff *= rk;
          this.recoilPitch *= rk;
          this.recoilYaw *= rk;
          if (CFG.noSpread) {
            this.xhPrev *= sk;
            this.xhCur *= sk;
            this.xhStart *= sk;
            this.xhTarget *= sk;
          }
          humanOnShot();
          return res;
        };
      }

      // ดัก updateRecoil(): ฟิสิกส์คืนลำกล้องและส่ายแนวนอน
      const origUpdateRecoil = ws.updateRecoil;
      if (typeof origUpdateRecoil === "function") {
        ws.updateRecoil = function (dt) {
          if (CFG.noRecoil) {
            const res = origUpdateRecoil.call(this, dt);
            const k = recoilKeep();
            this.recV *= k;
            this.recH *= k;
            this.yawOff *= k;
            this.recoilPitch *= k;
            this.recoilYaw *= k;
            return res;
          }
          return origUpdateRecoil.call(this, dt);
        };
      }

      // ดัก aimRay(): กระสุน Raycast ตรงกลางจอ 100% — แยกจาก visual
      const origAimRay = ws.aimRay;
      if (typeof origAimRay === "function") {
        ws.aimRay = function () {
          if (CFG.noRecoil) {
            const k = recoilKeep();
            this.recV *= k;
            this.recoilPitch *= k;
          }
          return origAimRay.apply(this, arguments);
        };
      }

      // ดัก updateCrosshair(): NoSpread = spread จริงต้องเป็น 0 (ไม่ขึ้นกับ humanize)
      const origUpdateCrosshair = ws.updateCrosshair;
      if (typeof origUpdateCrosshair === "function") {
        ws.updateCrosshair = function (...args) {
          if (CFG.noSpread) {
            const res = origUpdateCrosshair.apply(this, args);
            const k = spreadKeep();
            this.xhCur *= k;
            this.xhStart *= k;
            this.xhTarget *= k;
            this.xhPrev *= k;
            this.spreadNow *= k;
            return res;
          }
          return origUpdateCrosshair.apply(this, args);
        };
      }

      // ดัก setLoadout(): เมื่อเปลี่ยนปืน ให้ patch ทันที
      const origSetLoadout = ws.setLoadout;
      if (typeof origSetLoadout === "function") {
        ws.setLoadout = function (...args) {
          const res = origSetLoadout.apply(this, args);
          try { patchSlots(); } catch (_) { }
          // reset humanState เมื่อเปลี่ยนปืน
          humanState.pitch = 0;
          humanState.yaw = 0;
          humanState.shotSeq = 0;
          return res;
        };
      }
    }
  }

  /* ---------- เฟรมวาด (sync กับ render ของเกมเป๊ะ ๆ) ---------- */
  const statusEl = panel.querySelector("#pbStatus");
  const titleEl = panel.querySelector("#pbTitle");
  let statusHoldUntil = 0;
  const setStatus = (t) => { if (statusEl.textContent !== t) statusEl.textContent = t; };
  /* Keep important spawn/pickup/error messages readable for a few seconds;
     the per-frame ESP status would otherwise overwrite them instantly. */
  const statusHold = (t, ms = 2500) => {
    statusHoldUntil = performance.now() + ms;
    setStatus(t);
  };

  /* Which client are we on? Recoil can only be cancelled when its state is
     reachable: an old-style classic bundle publishes window.__pb, a classic
     bundle with top-level consts exposes the player as Ye / P. The current
     shootingpoint.xyz client is a Vite ES-module build — its chunks import each
     other and publish nothing on window, so no script running beside it can
     read or zero the recoil accumulator. Saying so is better than a checkbox
     that silently does nothing. */
  const clientKind = () => {
    try { if (findPB()) return "legacy"; } catch (_) {}
    try { if (typeof Ye !== "undefined" && Ye && Ye.s) return "live"; } catch (_) {}
    try { if (typeof P !== "undefined" && P && P.s && P.rec) return "live"; } catch (_) {}
    try { if (window.Ye && window.Ye.s) return "live"; } catch (_) {}
    try { if (window.P && window.P.s && window.P.rec) return "live"; } catch (_) {}
    /* ES-module build: nothing reachable. Detected by the module scripts the
       page actually loaded, so the message is specific instead of a guess. */
    let esm = false;
    try {
      esm = !!document.querySelector('script[type="module"]') ||
        !!document.querySelector('link[rel="modulepreload"]');
    } catch (_) {}
    return esm ? "esm" : "none";
  };

  /* ───── find the recoil chunk ─────
     On an ES-module client the recoil model lives in a lazily imported chunk
     whose hashed name only exists after a match starts. Nothing static can be
     fetched from outside to find it, but the page itself knows: every script it
     loaded is in the resource timing buffer. Fetch those same-origin files back,
     score them by the recoil model's fingerprints, and report the winner — that
     name is what a real patch has to target. */
  const RECOIL_SIGS = [
    [/hPend/g, 3], [/recPitch/g, 4], [/vRt/g, 2], [/autoN/g, 2],
    [/hRate/g, 1], [/hRestT/g, 1], [/recoil/gi, 1]
  ];
  const scanEngine = async () => {
    const urls = [];
    try {
      for (const e of performance.getEntriesByType("resource")) {
        if (/\.js(\?|$)/.test(e.name) && urls.indexOf(e.name) < 0) urls.push(e.name);
      }
    } catch (_) {}
    const hits = [];
    for (const u of urls) {
      let txt = "";
      try {
        const r = await fetch(u, { credentials: "same-origin", cache: "force-cache" });
        if (!r.ok) continue;
        txt = await r.text();
      } catch (_) { continue; }
      let score = 0;
      for (const [re, w] of RECOIL_SIGS) {
        const m = txt.match(re);
        if (m) score += m.length * w;
      }
      if (score > 0) hits.push({ url: u, score, len: txt.length });
    }
    hits.sort((a, b) => b.score - a.score);
    window.__pbRecoilChunks = hits;
    try {
      if (hits.length) {
        const f = hits[0].url.split("/").pop();
        setStatus("recoil chunk: " + f + " (score " + hits[0].score + ") — ส่งชื่อนี้ให้ผู้ดูแล");
      } else {
        setStatus("recoil chunk: ไม่พบ — ยังไม่เข้าแมตช์?");
      }
    } catch (_) {}
    try { console.log("[PB] recoil chunk scan", hits); } catch (_) {}
    return hits;
  };
  window.__pbScanRecoil = scanEngine;

  /* ───── what is actually readable in a live match ─────
     The HUD line shows rec 0.00 while the gun still climbs, so *something* is
     readable but it is not the value the camera uses. Walk the globals that
     could hold game state and report every object carrying recoil-ish numeric
     fields, plus the camera objects, so the next step is based on measurement
     instead of a guess. Runs on demand: __pbProbe() in the console. */
  const probeState = () => {
    const out = { globals: [], recoilish: [], cameras: [], keys: 0 };
    const seen = new Set();
    const interesting = (obj) => {
      const r = [];
      for (const k in obj) {
        if (!/recoil|kick|pitch|yaw|spread|dev|hPend|vRt/i.test(k)) continue;
        const v = obj[k];
        if (typeof v === "number") r.push([k, +v.toFixed(4)]);
      }
      return r;
    };
    const walk = (obj, path, depth) => {
      if (!obj || typeof obj !== "object" || depth > 3 || seen.has(obj)) return;
      seen.add(obj);
      const hits = interesting(obj);
      if (hits.length) out.recoilish.push({ path, hits });
      if (obj.isCamera && obj.isCamera === true) out.cameras.push(path);
      if (depth < 3) {
        let n = 0;
        for (const k in obj) {
          if (n++ > 40) break;
          let v;
          try { v = obj[k]; } catch (_) { continue; }
          if (v && typeof v === "object") walk(v, path + "." + k, depth + 1);
        }
      }
    };
    try {
      for (const k in window) {
        out.keys++;
        if (!/pb|game|player|weapon|char|battle|engine|scene|world|match/i.test(k)) continue;
        let v;
        try { v = window[k]; } catch (_) { continue; }
        if (!v || typeof v !== "object") continue;
        out.globals.push(k);
        walk(v, k, 0);
      }
    } catch (_) {}
    try { console.log("[PB] probe", out); } catch (_) {}
    try {
      const first = out.recoilish.slice(0, 3).map(x => x.path).join(", ");
      setStatus("probe: globals " + (out.globals.join("/") || "–") +
        " | recoil-ish " + out.recoilish.length + (first ? " (" + first + ")" : ""));
    } catch (_) {}
    return out;
  };
  window.__pbProbe = probeState;

  let CAM_PITCH = 0, CAM_AT = 0;
  let synced = false;          // เอาหลัก = วาดใน render hook ของเกม | ไม่ใช่ = โหมดรอแล้วใช้ rAF เอง
  let _lastHookFrame = -1;
  let lastDrawAt = performance.now();

  function clearOverlay() {
    try { ctx.clearRect(0, 0, cv.width, cv.height); } catch (_) { }
  }

  function setMode(on) {
    if (synced === on) return;
    synced = on;
    titleEl.textContent = `PB ESP ${VERSION}${on ? " · sync" : ""}`;
  }

  function drawOnce(scene, camera) {
    /* the camera is the one piece of game state we always get, because the
       render hook hands it to us. Its pitch is exactly what recoil moves, so it
       is the measurement that makes a closed loop possible. */
    if (camera) {
      try {
        CAM_PITCH = camera.rotation ? camera.rotation.x : (CAM_PITCH || 0);
        CAM_AT = performance.now();
      } catch (_) {}
    }
    const pb = findPB();
    if (!pb) {
      clearOverlay();
      if (synced) setMode(false);
      setStatus("รอเข้าแมตช์...");
      return;
    }
    if (pb) {
      // เกมเรียก render หลาย pass ต่อเฟรม — hook พวกนี้ต้องรันครั้งเดียว
      const fn = pb.frameNo;
      if (typeof fn !== "number" || fn !== _lastHookFrame) {
        _lastHookFrame = fn;
        hookNoRecoil(pb);
        if (CFG.fakeMobile) hookMobileBypass(pb);
      }
    }
    // กรอง pass อื่น (fp-scene / fx / mirror) — วาดเฉพาะ scene หลักของเกมเท่านั้น
    if (scene && pb?.scene && scene !== pb.scene) return;
    lastDrawAt = performance.now();
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (CFG.showFps) {
      const dpr = devicePixelRatio || 1, text = `${fpsValue}${CFG.fpsLabel ? " FPS" : ""}`;
      ctx.save();
      ctx.font = `700 ${14 * dpr}px 'Segoe UI', sans-serif`;
      ctx.textBaseline = "top";
      if (CFG.fpsStyle === "box") {
        const w = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(10,15,20,.78)"; ctx.fillRect(12 * dpr, 12 * dpr, w + 16 * dpr, 28 * dpr);
        ctx.strokeStyle = "#ff4d5a"; ctx.strokeRect(12 * dpr, 12 * dpr, w + 16 * dpr, 28 * dpr);
        ctx.fillStyle = "#fff"; ctx.fillText(text, 20 * dpr, 18 * dpr);
      } else {
        ctx.fillStyle = CFG.fpsStyle === "neon" ? "#42ffb0" : "#fff";
        if (CFG.fpsStyle === "neon") { ctx.shadowColor = "#42ffb0"; ctx.shadowBlur = 10 * dpr; }
        ctx.fillText(text, 14 * dpr, 14 * dpr);
      }
      ctx.restore();
    }
    if (!pb) { setStatus("รอเข้าแมตช์..."); return; }
    if (!pb.me) { setStatus("พบเกมแล้ว — รอผู้เล่นเกิด/โหลดแมตช์"); return; }
    wrapPlace();

    // กล้อง = ตัวที่เกม "ส่งเข้า render จริงในเฟรมนี้" (โอเคสุดในการจับ pixel ถูกตำแหน่ง)
    // ถ้าไม่มีให้จาก hook ค่อย fallback เป็น pb.player.camera
    const cam = (camera?.matrixWorldInverse) ? camera
      : (pb.player?.camera?.matrixWorldInverse ? pb.player.camera : null);
    if (!cam) { setStatus("ไม่พบกล้อง"); return; }

    let actors = actorsOf(pb);

    // กล้องจาก hook ≠ กล้องหลักของเกม → แจ้งเตือนในสถานะ
    const gameCam = pb.camera ?? pb.player?.camera;
    let camNote = (gameCam && cam !== gameCam) ? " ⚠cam-ต่างตัว" : "";

    let statusMsg = `แสดง ${Math.max(0, actors.length - 1)} ตัว | ทีมเรา ${pb.me.team}${synced ? " | sync" : " | โหมดรอ"}${camNote} | AIM: ${CFG.aimAssist ? "ON" : "OFF"}`;
    if (CFG.aimOnHold) statusMsg += ` | HOLD ${CFG.aimHoldButton.toUpperCase()}:${holdPressed() ? "ON" : "off"}`;
    if (activeWS) {
      statusMsg += ` | rec ${Math.abs(activeWS.recV ?? 0).toFixed(2)} spr ${Math.abs(activeWS.xhCur ?? 0).toFixed(2)}`;
    }

    const W = cv.width, H = cv.height, dpr = devicePixelRatio;

    // (HUD status ด้านบนซ้ายถูกถอดออกตามคำขอ)

    // FOV circle + lock indicator (วาดหลัง clearRect เท่านั้น)
    if (CFG.aimAssist && CFG.aimDrawFov) drawFovCircle(cam);
    if (CFG.aimAssist && aimState.lockAim) {
      const sp = project(aimState.lockAim[0], aimState.lockAim[1], aimState.lockAim[2], cam);
      if (sp) {
        ctx.save();
        const col = CFG.aimMode === "bot" ? "#ff2020" : "#ff4fff";
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = (CFG.aimMode === "bot" ? 1.5 : 1) * dpr;

        /* each element has its own switch: the marker is useful while tuning
           and pure noise while actually playing */
        if (CFG.aimDrawLink !== false) {
          ctx.globalAlpha = CFG.aimMode === "bot" ? 0.8 : 0.4;
          ctx.beginPath();
          ctx.moveTo(cv.width / 2, cv.height / 2);
          ctx.lineTo(sp.x, sp.y);
          ctx.stroke();
        }

        if (CFG.aimDrawLock !== false) {
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, (CFG.aimMode === "bot" ? 5 : 3) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }

        if (CFG.aimMode === "bot" && CFG.aimDrawLock !== false) {
          ctx.globalAlpha = 1;
          ctx.font = `bold ${10 * dpr}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText("LOCK", sp.x, sp.y - 8 * dpr);
          ctx.textAlign = "start";
        }

        if (CFG.aimDrawPart) {
          ctx.globalAlpha = 0.95;
          ctx.font = `bold ${10 * dpr}px monospace`;
          ctx.textAlign = "left";
          ctx.fillText(String(aimState.part || "?"), sp.x + 8 * dpr, sp.y - 6 * dpr);
          ctx.textAlign = "start";
        }
        ctx.restore();
      }
    }

    // ปิด ESP แต่ยังใช้ aim ต่อได้ (FOV/lock indicator ถูกวาดไปแล้วด้านบน)
    if (!CFG.enabled) {
      if (performance.now() >= statusHoldUntil) {
        setStatus(`ESP: ปิด (F8 เปิด) | AIM: ${CFG.aimAssist ? "ON" : "OFF"}`);
      }
      return;
    }

    const myTeam = pb.me.team;
    const e0 = cam.matrixWorld.elements;
    const camPos = [e0[12], e0[13], e0[14]];

    ctx.lineWidth = Math.max(1, Number(CFG.espThickness) || 2) * dpr;
    const maxDist = Math.max(50, Number(CFG.espMaxDist) || 200);
     let skelDrawn = 0;
     const SKEL_MAX = 3;
    ctx.font = `bold ${Math.max(10, Number(CFG.espNameSize) || 13) * dpr}px Tahoma, sans-serif`;
    ctx.textBaseline = "top";
    const pos = [0, 0, 0];
    for (const a of actors) {
      if (!a || a === pb.me) continue;
      const ally = a.team === myTeam;
      if (ally && !CFG.showAlly) continue;
      if (!posOfActor(a, pos)) continue;
      const tall = a.crouch ? CFG.eyeCrouch : CFG.eyeStand;
      const fF = project(pos[0], pos[1], pos[2], cam);
      if (!fF) continue;
      const fH = project(pos[0], pos[1] + tall, pos[2], cam);
      if (!fH) continue;
      const col = ally ? CFG.allyColor : CFG.enemyColor;
      const dist = Math.hypot(pos[0] - camPos[0], pos[1] - camPos[1], pos[2] - camPos[2]);
      if (dist > maxDist) continue;
      const bh = Math.max(1, fF.y - fH.y), bw = bh * 0.45, x = (fF.x + fH.x) / 2;
       const far = dist > maxDist * 0.75;
      ctx.globalAlpha = a.alive ? 1 : CFG.deadAlpha;

      if (CFG.box && !CFG.perfMode && !far && bh > 6) {
        ctx.strokeStyle = col;
        ctx.strokeRect(x - bw / 2, fH.y, bw, bh);
      }
      if (CFG.hpBar && !CFG.perfMode && !far && bh > 10) {
        const pct = Math.max(0, Math.min(1, (a.hp ?? 0) / (a.maxHp || 100)));
        const bx = x - bw / 2 - 7 * dpr;
        ctx.fillStyle = "#000c"; ctx.fillRect(bx, fH.y, 4 * dpr, bh);
        ctx.fillStyle = pct > .5 ? "#3fff3f" : pct > .25 ? "#ffdf30" : "#ff3030";
        ctx.fillRect(bx, fH.y + bh * (1 - pct), 4 * dpr, bh * pct);
      }
      if (CFG.name && !CFG.perfMode && !far && bh > 12) {
        ctx.fillStyle = col;
        ctx.fillText((a.name ?? a.id ?? "?") + `  ${dist.toFixed(0)}m`, x - bw / 2, fH.y - 17 * dpr);
      }
      if (CFG.headDot) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(fH.x, fH.y + bh * 0.04, 3 * dpr, 0, 7); ctx.fill();
      }
      if (CFG.snapline && !ally && a.alive) {
        ctx.strokeStyle = col + "77";
        ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(fF.x, fF.y); ctx.stroke();
      }
      if (CFG.skeleton && !CFG.perfMode && skelDrawn < SKEL_MAX) {
        // สีโครง: "~" = ตามทีม | "random" = ไล่สีทุกเฟรม | Hex = กำหนดเอง
        let skelCol;
        if (CFG.skeletonColor === "~") {
          skelCol = col;
        } else if (CFG.skeletonColor === "random") {
          if (!window.__espSkelColor) window.__espSkelColor = Math.random();
          window.__espSkelColor = (window.__espSkelColor + 0.01) % 1;
          skelCol = `hsl(${window.__espSkelColor * 360}, 80%, 55%)`;
        } else {
          skelCol = CFG.skeletonColor;
        }
        ctx.strokeStyle = skelCol;
        ctx.fillStyle = skelCol;
        ctx.globalAlpha = a.alive ? 0.9 : CFG.deadAlpha * 0.8;
        // ไกลเกิน 80m วาดไปก็อ่านไม่ออก + เปลือง CPU (project ทุกกระดูก)
        if (dist < maxDist && skelDrawn < SKEL_MAX) { try { drawSkeleton(a, cam, 1.25 * dpr); skelDrawn++; } catch (err) { console.warn("[ESP] skeleton draw fail:", err); } }
        ctx.globalAlpha = a.alive ? 1 : CFG.deadAlpha;
      }
      ctx.globalAlpha = 1;
    }

    // ---- คาลิเบรต: เทียบจุดฉายของเรากับจุดที่เกมคำนวณผ่าน place() ของตัวเอง ----
    // ใช้ anchor ที่เกมใช้แปะ tag จริง = เท้า + hf(1.9) / จุดชมพู = ตำแหน่งที่เกมคิดเอง
    try {
      for (const g of gtMap.values()) {
        if (!g.a || !g.a.alive || !actors.includes(g.a)) continue;
        if (!posOfActor(g.a, pos)) continue;
        const fT = project(pos[0], pos[1] + 1.9, pos[2], cam);
        if (!fT) continue;
        const exX = (g.x * .5 + .5) * cv.width;
        const exY = (-g.y * .5 + .5) * cv.height;
        const nm = String(g.a.name ?? "?").slice(0, 8);
        statusMsg += ` | Δ${nm} ${((exX - fT.x) / dpr).toFixed(0)},${((exY - fT.y) / dpr).toFixed(0)}px`;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ff4fff";
        ctx.beginPath(); ctx.arc(exX, exY, 4 * dpr, 0, 7); ctx.fill();
        break;
      }
    } catch (e) { }
    if (performance.now() >= statusHoldUntil) setStatus(statusMsg);

    // debug: กล่อง "ตัวเอง" — ถ้ากล่องตัวเองเกาะแน่นแต่กล่องคนอื่นขยับตามช้า = เพี้ยนที่ pos ของ actor
    // แต่ถ้ากล่องตัวเองก็ลอยไม่เกาะ = เพี้ยนที่ sync กล้อง
    if (CFG.showMe) {
      const m = pb.player?.curFeet ?? pb._rideAt ?? pb._shadowFeet ?? pb._v;
      if (m && isFinite(m.x) && isFinite(m.y) && isFinite(m.z)) {
        const fF = project(m.x, m.y, m.z, cam);
        const fH = project(m.x, m.y + CFG.eyeStand, m.z, cam);
        if (fF && fH) {
          const bh = Math.max(1, fF.y - fH.y), bw = bh * 0.45, x = (fF.x + fH.x) / 2;
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#31d7ff";
          if (bh > 6) ctx.strokeRect(x - bw / 2, fH.y, bw, bh);
          ctx.fillStyle = "#31d7ff";
          ctx.fillText("ME", x - bw / 2, fH.y - 17 * dpr);
        }
      }
    }
  }

  /* FPS cap lives in the game's settings (`fpsCap`), read once at boot from
     localStorage. 0 = Unlimited; the render loop then skips its limiter
     (`b()` returns 0 → `if (F && ...)` is skipped). Changing the stored value
     while the settings module is already loaded needs one reload.

     Note: rAF still follows the display refresh rate. If the monitor is 75 Hz
     the page cannot pass 75 without launching the browser with
     `--disable-gpu-vsync --disable-frame-rate-limit` (see scripts/brave-fps.cmd). */
  const FPS_SETTING_KEYS = ["pb.settings.mobile.v1", "pb.settings"];
  function readStoredFpsCap() {
    for (const k of FPS_SETTING_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const o = JSON.parse(raw);
        if (o && typeof o === "object" && o.fpsCap !== undefined) {
          return { key: k, cap: Number(o.fpsCap) || 0 };
        }
      } catch (_) { }
    }
    return null;
  }
  function writeStoredFpsCap(cap) {
    let hit = false;
    let changed = false;
    for (const k of FPS_SETTING_KEYS) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const o = JSON.parse(raw);
        if (!o || typeof o !== "object") continue;
        if (Number(o.fpsCap) !== Number(cap)) {
          o.fpsCap = cap;
          localStorage.setItem(k, JSON.stringify(o));
          changed = true;
        }
        hit = true;
      } catch (_) { }
    }
    return { hit, changed };
  }
  let detectedHz = 0;
  let fpsNeedsReload = false;
  function capForMode() {
    const m = String(CFG.fpsCapMode || "auto");
    if (m === "auto") return detectedHz ? Math.max(30, Math.round(detectedHz)) : 0;
    const n = Number(m);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }
  function updateFpsInfo() {
    const el = panel.querySelector("#pbFpsInfo");
    if (!el) return;
    const info = readStoredFpsCap();
    const cap = info ? info.cap : 0;
    const hz = detectedHz ? `จอ ≈ ${detectedHz} Hz` : "จอ: กำลังวัด…";
    const capTxt = cap === 0 ? "Unlimited (0)" : String(cap);
    const tear = cap === 0 ? " · 0 = เสี่ยง tearing ถ้าปิด vsync" : "";
    if (!CFG.unlockFps) {
      el.textContent = `${hz} · cap = ${capTxt}${tear}`;
      return;
    }
    const target = capForMode();
    el.textContent = `${hz} · cap = ${capTxt}${tear}` +
      (fpsNeedsReload ? ` → ตั้ง ${target} แล้ว กด F5` : "");
  }
  function applyFpsUnlock() {
    if (CFG.unlockFps) {
      if (String(CFG.fpsCapMode || "auto") === "auto" && !detectedHz) { updateFpsInfo(); return; }
      const res = writeStoredFpsCap(capForMode());
      if (res.changed) fpsNeedsReload = true;
    }
    updateFpsInfo();
  }
  function detectRefreshRate() {
    let last = 0;
    let start = 0;
    const samples = [];
    const finish = () => {
      if (!samples.length) return;
      samples.sort((a, b) => a - b);
      const med = samples[samples.length >> 1] || 16.7;
      const hz = Math.round(1000 / med);
      if (hz >= 24 && hz <= 500) detectedHz = hz;
      updateFpsInfo();
      try { applyFpsUnlock(); } catch (_) { }
    };
    const tick = (t) => {
      if (!start) start = t;
      if (last > 0) {
        const d = t - last;
        if (d > 2 && d < 100) samples.push(d);
      }
      last = t;
      const elapsed = t - start;
      if (samples.length >= 90 || (elapsed > 1500 && samples.length >= 8)) { finish(); return; }
      if (elapsed > 6000) { finish(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  detectRefreshRate();
  applyFpsUnlock();
  const fpsCapSel = panel.querySelector("#pbFpsCapSel");
  if (fpsCapSel) {
    fpsCapSel.value = String(CFG.fpsCapMode || "auto");
    fpsCapSel.addEventListener("change", () => {
      CFG.fpsCapMode = fpsCapSel.value;
      saveCfg();
      applyFpsUnlock();
      try {
        setStatus(`FPS cap: ${fpsCapSel.value === "auto" ? "ตามจอ" : fpsCapSel.value} — กด F5 หลังเปลี่ยนค่า`);
      } catch (_) { }
    });
  }

  /* วาด "หลัง" renderer.render ของเกมพอดีทุกเฟรม — กล่องจะขยับพร้อมกล้องไม่มี lag
     (ไซต์ .th ไม่มีระบบตรวจ hook แบบ AC ของ .app จึงแนบปลอดภัย) */
  let activeR = null;
  let _lastAimFrame = -1;
  /* ───── fast weapon swap ─────
     The weapon system keeps `switchTimer` (seconds remaining) and `switchTotal`
     (the duration the HUD animates over). Clamping the timer the moment a swap
     starts shortens the remaining draw time without touching any weapon stat,
     so it works even when the class name is minified. */
  function weaponSystemOf(pb) {
    const list = [
      pb?.weapons?.ws, pb?.weapons,
      pb?.player?.weapons, pb?.player?.weaponSystem, pb?.player?.ws, pb?.ws
    ];
    for (const w of list) {
      if (w && typeof w === "object" && typeof w.switchTimer === "number") return w;
    }
    return null;
  }
  function fastSwapTick(pb) {
    if (!CFG.fastSwap) return;
    const ws = weaponSystemOf(pb);
    if (!ws) return;
    const max = Math.max(0.05, (Number(CFG.swapMs) || 250) / 1000);
    const t = Number(ws.switchTimer);
    if (isFinite(t) && t > max) {
      ws.switchTimer = max;
      const tot = Number(ws.switchTotal);
      if (isFinite(tot) && tot > max) ws.switchTotal = max;
    }
  }

  /* ───── stat bonus without items ─────
     The weapon system reads its bonuses from `abilities` (built from equipped
     items) and falls back to `itemFx`. Writing those instance fields is enough
     for the existing formulas to use them — no equipment, no prototype patch,
     no gameplay constant (q/ci) touched. Re-applied every frame because
     setPartAbilities() replaces the object on equip / respawn. */
  /* ───── item profiles ─────
     The page already fetched its avatar table (PC_EQUIP). It is visible in
     resource timing, so a profile can apply exactly the ability values an item
     carries instead of a guessed number. */
  let EQUIP = null;
  const FAM = { Assault: "AR", MG: "MG", Pistol: "HG", SG: "SG", SMG: "SMG", Sniper: "SR" };
  const itemBonus = (it) => {
    const ab = it && it.ability;
    if (!ab) return null;
    const r = Number(ab.WeaponReloadTime) || 0;
    const s = Number(ab.WeaponSwapTime) || 0;
    const qc = (Number(ab.QuickChangeWeapon) || 0) > 0;
    const fr = {};
    for (const [k, v] of Object.entries(ab)) {
      const m = /^FastReload_([A-Za-z]+)$/.exec(k);
      if (m && FAM[m[1]] && v) fr[FAM[m[1]]] = Number(v) || 1;
    }
    return { r, s, qc, fr, key: it.key || String(it.id || "") };
  };

  const swapSel = panel.querySelector("#pbSwapProfile");
  const reloadSel = panel.querySelector("#pbReloadProfile");
  const swapCalc = panel.querySelector("#pbSwapCalc");
  const reloadCalc = panel.querySelector("#pbReloadCalc");

  const swapBonusOf = () => {
    const prof = CFG.swapProfile || "custom";
    if (prof === "custom") return { s: Number(CFG.bonusSwap) || 0, qc: true };
    if (prof.startsWith("item:")) {
      const b = itemBonus(EQUIP && EQUIP[prof.slice(5)]);
      return b ? { s: b.s, qc: b.qc || b.s > 0 } : null;
    }
    return null;
  };
  const reloadBonusOf = () => {
    const prof = CFG.reloadProfile || "custom";
    if (prof === "custom") return { r: Number(CFG.bonusReload) || 0, fr: null };
    if (prof.startsWith("item:")) {
      const b = itemBonus(EQUIP && EQUIP[prof.slice(5)]);
      return b ? { r: b.r, fr: b.fr } : null;
    }
    return null;
  };
  const updateBonusCalc = () => {
    if (swapCalc) {
      const b = swapBonusOf();
      if (!b) swapCalc.textContent = (CFG.swapProfile || "custom") === "off" ? "ปิด" : "—";
      else {
        const mul = b.qc ? Math.max(0.1, 1 - b.s) : 1;
        swapCalc.textContent = "swap ×" + (1 / mul).toFixed(2);
      }
    }
    if (reloadCalc) {
      const b = reloadBonusOf();
      if (!b) reloadCalc.textContent = (CFG.reloadProfile || "custom") === "off" ? "ปิด" : "—";
      else {
        const mul = Math.max(0.1, 1 - b.r);
        const fam = b.fr ? Object.keys(b.fr) : [];
        reloadCalc.textContent = "reload ×" + (1 / mul).toFixed(2) + (fam.length ? " · " + fam.join("/") : " · fast -");
      }
    }
  };
  const fillProfiles = () => {
    if (!EQUIP) return;
    const rows = [];
    for (const [id, it] of Object.entries(EQUIP)) {
      const b = itemBonus(it);
      if (!b) continue;
      if (b.s || b.qc || b.r || Object.keys(b.fr).length) rows.push([id, b]);
    }
    rows.sort((a, b) => a[1].key.localeCompare(b[1].key));
    const fill = (sel, cur, kind) => {
      if (!sel) return;
      sel.innerHTML = "";
      const add = (v, t) => { const o = document.createElement("option"); o.value = v; o.textContent = t; sel.appendChild(o); };
      add("custom", "กำหนดเอง (สไลเดอร์)");
      add("off", "ปิด");
      for (const [id, b] of rows.slice(0, 400)) {
        if (kind === "swap" && !(b.s || b.qc)) continue;
        if (kind === "reload" && !(b.r || Object.keys(b.fr).length)) continue;
        const bits = [];
        if (kind === "swap" && b.s) bits.push("swap " + b.s);
        if (kind === "reload" && b.r) bits.push("reload " + b.r);
        if (kind === "reload" && Object.keys(b.fr).length) bits.push("fast " + Object.keys(b.fr).join("/"));
        add("item:" + id, b.key + (bits.length ? " · " + bits.join(" · ") : ""));
      }
      sel.value = cur;
      if (cur.startsWith("item:")) {
        const b = itemBonus(EQUIP && EQUIP[cur.slice(5)]);
        if (b) setBonus(kind === "swap" ? "bonusSwap" : "bonusReload", (kind === "swap" ? b.s : b.r) || 0, false);
      }
    };
    fill(swapSel, CFG.swapProfile || "custom", "swap");
    fill(reloadSel, CFG.reloadProfile || "custom", "reload");
    updateBonusCalc();
  };
  const loadEquip = () => {
    if (EQUIP) return;
    try {
      const names = performance.getEntriesByType("resource").map((e) => e.name);
      const url = names.find((n) => /avatarData-[^/]+\.json/i.test(n));
      if (!url) return;
      fetch(url).then((r) => r.json()).then((j) => {
        EQUIP = j.PC_EQUIP || null;
        fillProfiles();
      }).catch(() => {});
    } catch (e) {}
  };
  if (swapSel) {
    swapSel.value = CFG.swapProfile || "custom";
    swapSel.addEventListener("change", () => {
      CFG.swapProfile = swapSel.value;
      /* seed the custom slider with the item's real value so fine-tuning can
         continue from there (switch to "กำหนดเอง" and it is already set) */
      if (swapSel.value.startsWith("item:")) {
        const b = itemBonus(EQUIP && EQUIP[swapSel.value.slice(5)]);
        if (b) setBonus("bonusSwap", b.s || 0, false);
      }
      saveCfg(); updateBonusCalc();
    });
  }
  if (reloadSel) {
    reloadSel.value = CFG.reloadProfile || "custom";
    reloadSel.addEventListener("change", () => {
      CFG.reloadProfile = reloadSel.value;
      if (reloadSel.value.startsWith("item:")) {
        const b = itemBonus(EQUIP && EQUIP[reloadSel.value.slice(5)]);
        if (b) setBonus("bonusReload", b.r || 0, false);
      }
      saveCfg(); updateBonusCalc();
    });
  }
  loadEquip();
  setInterval(loadEquip, 3000);
  setInterval(updateBonusCalc, 500);

  /* ───── stat bonus (instance hooks) ─────
     The `abilities` route depends on the game's own item tables and is replaced
     on every equip change. Instead we shadow the two methods the weapon system
     itself calls when a swap/reload starts — on the INSTANCE only, never a
     prototype and never a native function. Base time comes from the weapon
     definition's raw params, so the result is deterministic:
         change = def.params.changeTime * (1 - swapBonus)
         reload = def.params.reloadTime * (1 - reloadBonus)
     That is why the slider now bites even with no items equipped. */
  function ensureBonusHooks(ws) {
    if (!ws || ws.__pbtkBonusHooks) return;
    try { Object.defineProperty(ws, "__pbtkBonusHooks", { value: 1, enumerable: false }); }
    catch (e) { try { ws.__pbtkBonusHooks = 1; } catch (e2) {} }
    const origC = typeof ws.changeTimeOf === "function" ? ws.changeTimeOf : null;
    const origR = typeof ws.reloadTimeOf === "function" ? ws.reloadTimeOf : null;
    if (origC) {
      ws.changeTimeOf = function (def) {
        if (!CFG.statBonus) return origC.call(this, def);
        const base = Number(def && def.params && def.params.changeTime);
        const sb = swapBonusOf();
        if (sb && isFinite(base) && base > 0) {
          const s = Math.max(0, Math.min(0.9, sb.s));
          return base * (sb.qc ? Math.max(0.1, 1 - s) : 1);
        }
        return origC.call(this, def);
      };
    }
    if (origR) {
      ws.reloadTimeOf = function (def) {
        if (!CFG.statBonus) return origR.call(this, def);
        const base = Number(def && def.params && def.params.reloadTime);
        const rb = reloadBonusOf();
        if (rb && isFinite(base) && base > 0) {
          const r = Math.max(0, Math.min(0.9, rb.r));
          return base * Math.max(0.1, 1 - r);
        }
        return origR.call(this, def);
      };
    }
  }

  function bonusTick(pb) {
    if (!CFG.statBonus) return;
    const ws = weaponSystemOf(pb);
    if (!ws) return;
    ensureBonusHooks(ws);
  }

  /* ───── anti-cheat report shield ─────
     The AC's Sv() logs "[anti-cheat] ..." and sends opcode 9007 on the game
     connection (room.game.conn). The opcode is a normal JS connection method,
     not WebSocket.prototype.send, so wrapping this instance does not trip the
     native-code check. Drop only 9007 and leave all gameplay traffic alone. */
  function connListOf(pb) {
    const list = [pb && pb.room && pb.room.game && pb.room.game.conn,
      pb && pb.net && pb.net.room && pb.net.room.game && pb.net.room.game.conn];
    return list.filter((c, i) => c && list.indexOf(c) === i);
  }

  function ensureAcShield(pb) {
    if (!pb) return;
    if (!window.__pbAcWarnHook) {
      window.__pbAcWarnHook = true;
      const ow = console.warn;
      console.warn = function (...args) {
        try {
          const s = args.map(String).join(" ");
          if (CFG.panicOnAc && !window.__pbAcPanicBusy && /\[anti-cheat\]/i.test(s)) {
            window.__pbAcPanicBusy = true;
            setTimeout(() => {
              try { panicNow(); } catch (_) { }
              window.__pbAcPanicBusy = false;
            }, 0);
          }
        } catch (_) { }
        return ow.apply(this, args);
      };
    }
    if (!CFG.acShield) return;
    for (const conn of connListOf(pb)) {
      if (conn.__pbAcShield || typeof conn.send !== "function") continue;
      try { Object.defineProperty(conn, "__pbAcShield", { value: 1, enumerable: false }); }
      catch (_) { try { conn.__pbAcShield = 1; } catch (_) { } }
      const orig = conn.send;
      conn.send = function (opcode, ...rest) {
        if (CFG.acShield && opcode === 9007) {
          try { window.__pbAcBlocked = (window.__pbAcBlocked || 0) + 1; } catch (_) { }
          return undefined;
        }
        return orig.call(this, opcode, ...rest);
      };
    }
  }

  const SPAWN_KEYS = ["primary", "secondary", "melee", "grenade", "special"];

  function usableStat(st) {
    if (!st) return false;
    if (st.className === "Equipment") return false;
    const fam = st.family || "";
    const dmg = Number(st.damage) || Number(st.pb && st.pb.damage) || 0;
    return fam === "KNIFE" || fam === "GRENADE" || dmg > 0;
  }

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

  /* ───── server inventory / allowed weapons ─────
     The server does not publish a simple whitelist. What it does send is the
     match respawn inventory (sel.allItems), the class bitmask
     (net.weaponsFlag) and the acknowledged loadout (net.localLoadout).
     allowedId(slotKey, id) is the client-side check the respawn UI itself
     uses, so it is the closest answer to "will the server accept this?" */
  const openSiteBtn = panel.querySelector("#pbOpenSite");
  if (openSiteBtn) {
    openSiteBtn.addEventListener("click", () => {
      const pbNow = findPB();
      const ids = serverAllIds(pbNow);
      const owned = serverOwnedIds(pbNow);
      try { window.postMessage({ __pbOpenServerSite: 1, ids, owned }, "*"); } catch (_) { }
    });
  }

  /* page-world side of the options-page bridge: return all usable server
     weapon IDs plus the subset owned by this account. */
  addEventListener("message", (e) => {
    if (e.source !== window || !e.data || !e.data.__pbGetServerOwned) return;
    const req = e.data.__pbGetServerOwned;
    const pbNow = findPB();
    const ids = serverAllIds(pbNow);
    const owned = serverOwnedIds(pbNow);
    try { window.postMessage({ __pbServerOwned: req, ids, owned }, "*"); } catch (_) { }
  }, false);

  function panicNow() {
    panicArmedAt = 0;
    CFG.enabled = false;
    CFG.aimAssist = false;
    CFG.noRecoil = false;
    CFG.noSpread = false;
    CFG.fastSwap = false;
    CFG.statBonus = false;
    CFG.acShield = true;
    CFG.showFps = false;
    CFG.humanize = false;
    for (const c of panel.querySelectorAll("input[data-c]")) {
      if (Object.prototype.hasOwnProperty.call(CFG, c.dataset.c)) c.checked = !!CFG[c.dataset.c];
    }
    saveCfg();
    syncDependentControls();
    try { setMenu(false); } catch (_) { }
    statusHold("PANIC: ปิดฟีเจอร์ทั้งหมดแล้ว (Insert เพื่อเปิดแผง)");
  }
  let panicArmedAt = 0;
  function requestPanic() {
    const now = performance.now();
    if (panicArmedAt && now - panicArmedAt < 2000) {
      panicNow();
      return;
    }
    panicArmedAt = now;
    statusHold("ยืนยัน PANIC: กด F10 / ปุ่ม PANIC อีกครั้งภายใน 2 วินาที", 2000);
  }
  const panicBtn = panel.querySelector("#pbPanic");
  if (panicBtn) panicBtn.addEventListener("click", requestPanic);
  addEventListener("keydown", (e) => {
    if (e.code !== "F10" && e.key !== "F10") return;
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing) return;
    e.preventDefault();
    e.stopPropagation();
    requestPanic();
  }, true);


  setInterval(() => {
    const pbNow = findPB();
    ensureAcShield(pbNow);
    const acEl = panel.querySelector("#pbAcStatus");
    if (acEl) {
      acEl.textContent = `AC shield: ${CFG.acShield ? "ON" : "OFF"} · blocked ${window.__pbAcBlocked || 0}`;
    }
    updateAcChip();
    updateMasterChip();
    updateFeatureLine();
    const bridgeEl = panel.querySelector("#pbBridgeInfo");
    if (bridgeEl) {
      const r = findRenderer();
      let frames = -1;
      try { frames = window.frames.length; } catch (_) { }
      bridgeEl.textContent = `bridge: pb=${pbNow ? "yes" : "no"} · me=${pbNow && pbNow.me ? "yes" : "no"} · player=${pbNow && pbNow.player ? "yes" : "no"} · renderer=${r ? "yes" : "no"} · frames=${frames}`;
    }
  }, 1500);

  function hookRenderer() {
    const R = findRenderer();
    if (!R || typeof R.render !== "function") return false;
    if (R === activeR) { setMode(true); return true; }
    if (R.__espRender) { activeR = R; setMode(true); return true; }
    activeR = R;
    const orig = R.render;
    R.render = function (...args) {
      const scene = args[0], camera = args[1];
      hookGameFpsCounter();

      // aim ต้อง tick ก่อนใส่ visual kick เพื่อไม่ให้ addLook/updateCamera ทับ offset
      // เกมอาจเรียก render หลาย pass ต่อเฟรม → tick ครั้งเดียวต่อ frameNo + เฉพาะ scene หลัก
      const pbNow = findPB();
      if (pbNow && camera && (!pbNow.scene || scene === pbNow.scene)) {
        const fn = pbNow.frameNo;
        if (typeof fn !== "number" || fn !== _lastAimFrame) {
          _lastAimFrame = fn;
          aimAssistTick(pbNow, camera);
          fastSwapTick(pbNow);
          bonusTick(pbNow);
        }
      }

      let baseX = 0, baseY = 0, kicked = false;

      // Humanize (visual-only): บิดกล้องเฉพาะตอน render แล้วคืนค่าทันที
      // ไม่แตะ player.pitch/yaw / aimRay / ws.xhCur
      if (camera?.rotation && CFG.humanize && CFG.noRecoil && !CFG.perfMode &&
        (Math.abs(humanState.pitch) > 0.0001 || Math.abs(humanState.yaw) > 0.0001)) {
        baseX = camera.rotation.x;
        baseY = camera.rotation.y;
        camera.rotation.x = baseX + humanState.pitch * DEG * (Number(CFG.humanPitchSign) || 1);
        camera.rotation.y = baseY + humanState.yaw * DEG;
        if (typeof camera.updateMatrixWorld === "function") camera.updateMatrixWorld(true);
        kicked = true;
      }

      try {
        const res = orig.apply(this, args);  // เกม render ก่อน (matrix สด ๆ ที่ใช้วาดจริง)
        drawOnce(scene, camera);             // ESP วาดหลัง render (ตรงกับภาพที่โชว์)
        return res;
      } finally {
        if (kicked) {
          camera.rotation.x = baseX;
          camera.rotation.y = baseY;
          if (typeof camera.updateMatrixWorld === "function") camera.updateMatrixWorld(true);
        }
      }
    };
    R.__espRender = R.render;
    setMode(true);
    return true;
  }
  // รอเกมคลอด renderer แล้ว patch ทันที + ตรวจซ้ำเผื่อเกมสร้าง renderer ใหม่ (เข้าแมตช์ใหม่)
  (function boot() {
    if (!hookRenderer()) requestAnimationFrame(boot);
    else setInterval(() => { const R = findRenderer(); if (R && R !== activeR) hookRenderer(); }, 2000);
  })();

  // โหมดสำรอง: ก่อน hook ติด ยังวาดจาก rAF ของตัวเอง (สถานะจะบอก "โหมดรอ")
  (function fallbackLoop() {
    requestAnimationFrame(fallbackLoop);
    if (synced) return;
    const pb = findPB();
    const cam = pb?.player?.camera;
    if (pb && cam) aimAssistTick(pb, cam);
    if (pb) { fastSwapTick(pb); bonusTick(pb); }
      drawOnce(pb?.scene, cam);
  })();

  /* Watchdog: when the match ends (or the game tears the renderer down) the
     render hook stops firing, so nothing clears the overlay and the last ESP
     frame stays on screen. If no draw happened for 1.5 s, wipe the canvas and
     switch back to the rAF loop. */
  setInterval(() => {
    if (performance.now() - lastDrawAt <= 1500) return;
    clearOverlay();
    if (synced) setMode(false);
    if (CFG.enabled) setStatus("ออกจากแมตช์ — ซ่อน ESP");
  }, 700);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearOverlay();
  }, false);

  /* ───── live recoil path ─────
     Classic bundles (pbmobile.app, pbblaze) keep the player in a top-level
     const — `Ye` there, `P` on pbblaze — and its recoil accumulator is
     rec = { v, A, t, T, hPend, hRate, hState }. Zeroing it every frame is what
     actually cancels the kick; the old `pb.player.addRecoil` hook only ever
     ran on an old-style `window.__pb` client and is dead elsewhere. On an
     ES-module client (shootingpoint.xyz today) none of these exist, so this
     loop does nothing and the status line says so. */
  (function liveRecoilLoop() {
    requestAnimationFrame(liveRecoilLoop);
    if (!CFG.noRecoil) return;
    let g = null;
    try { if (typeof Ye !== "undefined" && Ye && Ye.rec) g = Ye; } catch (_) {}
    if (!g) { try { if (typeof P !== "undefined" && P && P.rec) g = P; } catch (_) {} }
    if (!g) return;
    try {
      const r = g.rec;
      r.v = 0; r.A = 0; r.t = 0; r.T = 0;
      r.hPend = 0; r.hRate = 0; r.hState = 0;
      if (typeof g.kick === "number" && g.kick > 0) g.kick = 0;
    } catch (_) {}
  })();

  /* tell the truth about the checkbox on a client we cannot reach */
  setInterval(() => {
    if (!CFG.noRecoil) return;
    if (performance.now() < statusHoldUntil) return;
    const k = clientKind();
    if (k === "esm") setStatus("norecoil: ES module — ใช้แรงชดเชยแทน");
    else if (k === "none") setStatus("norecoil: ยังไม่พบออบเจ็กต์ผู้เล่น");
  }, 2000);

  /* ───── compensation for clients whose recoil state is unreachable ─────
     On the ES-module client the recoil accumulator lives inside a chunk, so
     nothing outside can zero it. Use player.addLook() — the same API the game
     itself calls for mouse input — instead of dispatching synthetic MouseEvents.
     The anti-cheat counts untrusted events (input-synthetic); a synthetic
     mousemove here would be both detectable and unnecessary because addLook()
     is reachable on this client.

     The closed loop holds the camera pitch at the value it had when the trigger
     went down and nudges it back with addLook() each frame. */
  let compAcc = 0, mouseDown1 = false;
  addEventListener("mousedown", (e) => { if (e.button === 0) mouseDown1 = true; }, true);
  addEventListener("mouseup", (e) => { if (e.button === 0) mouseDown1 = false; }, true);
  addEventListener("blur", () => { mouseDown1 = false; }, true);

  const pushPitch = (dPitch) => {
    const pb = findPB();
    if (pb && pb.player && typeof pb.player.addLook === "function") {
      try { pb.player.addLook(dPitch, 0); } catch (_) { }
      return true;
    }
    return false;
  };
  let AIM_PITCH = 0, engaged = false;
  let compWarned = false;
  const compTick = () => {
    requestAnimationFrame(compTick);
    const esm = clientKind() === "esm";
    if (!CFG.noRecoil || !esm) { engaged = false; return; }
    if (!mouseDown1) { engaged = false; return; }

    const pitch = CAM_PITCH;
    if (typeof pitch !== "number") return;
    if (!engaged) { engaged = true; AIM_PITCH = pitch; return; }

    const err = pitch - AIM_PITCH;          /* positive = climbed (needs down) */
    if (Math.abs(err) < 0.0004) return;     /* within a tenth of a degree */
    if (err <= 0) return;

    const now = performance.now();
    if (now - compAcc < 16) return;
    compAcc = now;
    const mult = 1 + Math.max(0, Math.min(24, Number(CFG.nrComp) || 0)) / 12;
    const step = Math.min(0.08, Math.max(0.0002, err) * mult);
    if (!pushPitch(-step) && !compWarned) {
      compWarned = true;
      statusHold("norecoil: ไม่พบ addLook — ใช้แรงชดเชยแทนไม่ได้ (ไม่ปลอม event)", 4000);
    }
  };
  /* vertical compensation control was removed (v1.56) — do not start the loop */
})();

