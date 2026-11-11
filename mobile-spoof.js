/* mobile-spoof.js — รันใน MAIN world ก่อน page scripts ทุกตัว
   จุดประสงค์: ปลอม device fingerprint เป็น mobile ให้เกม PB เห็นตั้งแต่ต้น
   (แยกออกจาก esp.js เพราะ esp.js โหลดแบบ async src="..." ซึ่งช้าเกินไป) */
(() => {
  "use strict";

  /* ───── 0. gate ─────────────────────────────────────────────────────
     The spoof runs at document_start, before any UI exists, so the checkbox in
     esp.js can only reach it through storage. Without this gate the spoof was
     unconditional: unticking "ปลอมเป็น Mobile" did nothing at all, because the
     UA/DPR/matchMedia overrides were already applied and nothing could undo
     them. Turning it off therefore also has to undo the two things that keep
     the client in phone mode on its own: the ?touch=1 parameter and the
     remembered peripheral. */
  let spoofOn = false;
  try { if (localStorage.getItem("pbFakeMobile") === "1") spoofOn = true; } catch (_) {}

  if (!spoofOn) {
    try {
      const u = new URL(location.href);
      if (u.searchParams.get("touch") === "1" &&
          sessionStorage.getItem("pbMobileOff") !== "1") {
        sessionStorage.setItem("pbMobileOff", "1");
        u.searchParams.delete("touch");
        location.replace(u.toString());
      }
    } catch (_) {}
    try { localStorage.setItem("pbweb_periph", "pc"); } catch (_) {}
    try { window.__pbMobileSpoofActive = false; } catch (_) {}
    return;                          /* no spoof: leave the client as a PC */
  }

  /* ───── 1. Navigator spoofs (ต้องทำก่อนเกมอ่าน UA) ───── */
  const FAKE_UA = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

  const _nav = navigator;
  const navProps = {
    userAgent:      { get: () => FAKE_UA },
    appVersion:     { get: () => FAKE_UA.replace("Mozilla/", "") },
    platform:       { get: () => "Linux armv8l" },
    maxTouchPoints: { get: () => 5 },
  };
  for (const [k, desc] of Object.entries(navProps)) {
    try {
      Object.defineProperty(_nav, k, { ...desc, configurable: true, enumerable: true });
    } catch (_) {}
  }

  /* ───── 2. Touch / pointer spoofs ───── */
  if (!("ontouchstart" in window)) window.ontouchstart = null;
  try { Object.defineProperty(window, "ontouchstart", { value: null, configurable: true }); } catch (_) {}

  /* ───── 2b. PC-INPUT LOCK ────────────────────────────────────────────
     roomInputDevice.js (shootingpoint.xyz) ทำแบบนี้:
       const F = "pb.room.pcInput.v1";                 // sessionStorage
       const B = () => { sessionStorage.setItem(F,"1"); setLocalDevice(pc); reportPcInput() };
       const isPcEvent = e => e.isTrusted && e.pointerType==="mouse"
                             && (e.type==="pointerdown" || e.movementX || e.movementY);
       document.addEventListener("pointerdown", e => { if (localDevice!==pc && isPcEvent(e)) B() }, true);
       document.addEventListener("pointermove", e => { ...same... }, true);
       window.addEventListener("keydown", e => { if (localDevice!==pc && isGameKey(e)) B() }, true);
     ⇒ ขยับเมาส์หรือกดคีย์บอร์ดครั้งเดียว = เกมเปลี่ยนเป็น PC ทันที

     วิธีที่ใช้ (ตาม pbmobile-ext ซึ่งพิสูจน์แล้วว่าได้ผล):
       1) ทิ้ง listener ของตัว detector ตั้งแต่ตอนมันลงทะเบียน (periph guard)
       2) ปิด isTrusted เป็นชั้นสอง เผื่อ listener หลุด guard ไป
       3) ไม่แตะ prototype ของ Storage / EventTarget / WebSocket เลย
          (AC ของตระกูลนี้ตรวจ native พวกนั้น) */
  const PC_KEY = "pb.room.pcInput.v1";
  try { sessionStorage.removeItem(PC_KEY); } catch (_) {}
  try { localStorage.removeItem("pbweb_periph"); } catch (_) {}

  /* 1) PERIPH GUARD — drop listener ที่เป็นตัวจับ mouse/key ของเกม
     ลงทะเบียนบน window/document แบบ capture, ฟังก์ชันสั้น, และ source
     มีคำที่ detector ใช้ (pbInput / localDevice / .pc / pbweb_periph)
     ไม่แตะ event, ไม่แตะ prototype — แค่ไม่ให้ callback นั้นถูกผูก */
  const PERIPH_RE = /pbInput|pcInput|pbweb_periph|localDevice|setLocalDevice|\.pc\b/i;
  const GUARD = { dropped: 0 };
  const guardEvents = (target) => {
    try {
      const add = target.addEventListener;
      if (typeof add !== "function") return;
      const wrapped = function (type, fn, opts) {
        try {
          const cap = opts === true || (opts && typeof opts === "object" && opts.capture);
          if (cap && (type === "pointerdown" || type === "pointermove" ||
            type === "mousedown" || type === "mousemove" || type === "keydown")) {
            const src = String(fn);
            if (src.length < 4000 && PERIPH_RE.test(src)) {
              GUARD.dropped++;
              return;                       // ไม่ผูก listener ตัวนี้
            }
          }
        } catch (_) { }
        return add.call(this, type, fn, opts);
      };
      try { Object.defineProperty(wrapped, "name", { value: "addEventListener" }); } catch (_) { }
      target.addEventListener = wrapped;
    } catch (_) { }
  };

  /* 2) isTrusted ชั้นสอง — ปิดเฉพาะ pointer(mouse) + keydown
     ไม่แตะ touch (เกมใช้ isTrusted จับ touch จริง) */
  const hideTrust = (e) => {
    if (e.isTrusted !== true) return;
    if (e.type !== "keydown" && e.pointerType !== "mouse") return;
    try { Object.defineProperty(e, "isTrusted", { configurable: true, get: () => false }); } catch (_) { }
  };
  for (const t of ["pointerdown", "pointermove", "keydown"]) {
    try { window.addEventListener(t, hideTrust, true); } catch (_) { }
  }

  /* ติด guard หลัง listener ของเราเองแล้ว เพื่อไม่ให้มันกรองของเรา */
  guardEvents(window);
  guardEvents(document);

  /* เกมนับ "synthetic input" จากอีเวนต์ที่ isTrusted=false แล้วรายงานขึ้นเซิร์ฟเวอร์
     (input.takeUntrusted → "input-synthetic") — ปิดตัวนับที่ต้นทาง */
  const _inputPatched = new WeakSet();
  setInterval(() => {
    try {
      const input = window.__pb?.input;
      if (!input) return;
      if (!_inputPatched.has(input)) {
        _inputPatched.add(input);
        input.takeUntrusted = () => ({});
      }
      for (const k in input.untrusted) delete input.untrusted[k];
    } catch (_) { }
  }, 500);

  /* UA-CH ก็ต้องบอกว่า mobile ด้วย (บาง chunk อ่าน userAgentData.mobile เดี่ยว ๆ) */
  try {
    const uad = navigator.userAgentData;
    if (uad) Object.defineProperty(uad, "mobile", { configurable: true, get: () => true });
  } catch (_) { }

  /* ───── 3. matchMedia spoof ───── */
  const _origMM = window.matchMedia.bind(window);
  window.matchMedia = function matchMedia(query) {
    if (typeof query === "string") {
      const q = query.replace(/\s+/g, "");
      if (q.includes("(pointer:coarse)") || q.includes("(hover:none)") || q.includes("(any-pointer:coarse)")) {
        return makeMQL(query, true);
      }
      if (q.includes("(pointer:fine)") || q.includes("(hover:hover)") || q.includes("(any-hover:hover)")) {
        return makeMQL(query, false);
      }
    }
    return _origMM(query);
  };
  function makeMQL(media, matches) {
    return { matches, media, onchange: null, addListener: ()=>{}, removeListener: ()=>{}, addEventListener: ()=>{}, removeEventListener: ()=>{}, dispatchEvent: ()=>false };
  }

  /* ───── 4. devicePixelRatio spoof ───── */
  // mobile มักเป็น 2.625 (SM-S918B = Galaxy S23 Ultra)
  try {
    Object.defineProperty(window, "devicePixelRatio", {
      get: () => 2.625,
      configurable: true,
    });
  } catch (_) {}

  /* ───── 5. Vite module scan — หา setLocalDevice และ canEnterPlatform ───── */
  // PB ใช้ Vite production build — ไม่มี __webpack_require__ / __pb global
  // แต่ Vite แปะ module chunk ไว้ใน window.__vite_preload_queue หรือสามารถ
  // hook ผ่าน script.onload ของแต่ละ chunk ได้
  // วิธีที่ได้ผลดีที่สุดโดยไม่ต้องรู้ internals คือ:
  //   hook Function.prototype.bind เพื่อดัก setLocalDevice ตอนถูกเรียก
  //   — แต่วิธีนี้ตรวจได้โดย AC watchdog เช่นกัน
  //
  // วิธีที่ปลอดภัย: scan ทุก function บน window ด้วย regex หลังจาก scripts โหลด
  // แล้วเรียก setLocalDevice(2) ตรง ๆ ก่อนที่ device packet จะถูกส่ง
  //
  // เราจะทำ lazy scan ผ่าน MutationObserver ที่ดักตอน <script> แต่ละตัวโหลดเสร็จ

  let _setLocalDeviceFound = false;

  function tryFindAndPatchDevice() {
    if (_setLocalDeviceFound) return;

    // ลองหาผ่าน window keys ที่อาจจะ expose
    const tryPaths = [
      () => window.__pbDev?.setLocalDevice,
      () => window.__pbNet?.setLocalDevice,
      () => window.__pb?.net?.setLocalDevice,
      () => window.__pb?.device?.setLocalDevice,
      () => window._pbapp?.setLocalDevice,
    ];
    for (const fn of tryPaths) {
      try {
        const f = fn();
        if (typeof f === "function") {
          f(2); // DEVICE_MOBILE = 2
          _setLocalDeviceFound = true;
          window.__pbSetLocalDevice = f;
          return true;
        }
      } catch (_) {}
    }
    return false;
  }

  /* ───── 6. MutationObserver — ดัก script load + patch canEnterPlatform ───── */
  // ทุกครั้งที่ script tag โหลดเสร็จ ลอง scan หา module
  const _scriptObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.tagName === "SCRIPT") {
          node.addEventListener("load", () => {
            tryFindAndPatchDevice();
            tryPatchCanEnterPlatform();
          }, { once: true });
        }
      }
    }
  });
  _scriptObserver.observe(document.documentElement, { childList: true, subtree: true });

  /* ───── 7. canEnterPlatform — deep scan วิธีที่ได้ผล ───── */
  // แทนที่จะหา function ตรง ๆ, เราสแกน HTMLElement ใน lobby DOM
  // เกมเช็ค canEnterPlatform ผ่าน Ns() ซึ่งเช็ค localDevice()
  // เนื่องจากเรา spoof navigator.userAgent แล้ว isMobile จาก deviceProfile
  // ควรจะ return true ทันทีถ้า UA ถูกอ่านก่อน deviceProfile module load

  function tryPatchCanEnterPlatform() {
    // วิธี scan: หา object ที่มี method ชื่อ canEnterPlatform
    const scanRoots = [window.__pb, window.__pbLobby, window._app, window.app];
    for (const root of scanRoots) {
      if (!root) continue;
      patchRecursive(root, 0);
    }
  }

  function patchRecursive(obj, depth) {
    if (!obj || depth > 4 || typeof obj !== "object") return;
    try {
      if (typeof obj.canEnterPlatform === "function" && !obj.__bypassCanEnter) {
        obj.__bypassCanEnter = true;
        const orig = obj.canEnterPlatform;
        obj.canEnterPlatform = function(...args) { return true; };
      }
    } catch (_) {}
    // ไม่ recurse ลึกเพราะอาจ loop
  }

  /* ───── 8. Periodic retry (fallback สำหรับกรณี timing miss) ───── */
  let _retryCount = 0;
  const _retryTimer = setInterval(() => {
    _retryCount++;
    tryFindAndPatchDevice();
    if (_retryCount >= 20 || _setLocalDeviceFound) {
      clearInterval(_retryTimer);
    }
  }, 500); // ลองทุก 500ms เป็นเวลา 10 วินาที

  /* ───── 9. แปะ global helper สำหรับ esp.js ใช้งานต่อ ───── */
  window.__pbMobileSpoofActive = true;
  window.__pbRetryDevicePatch  = tryFindAndPatchDevice;

  /* ตรวจสถานะในเกม: console → __pbMobileState() */
  window.__pbMobileState = () => ({
    spoof: window.__pbMobileSpoofActive === true,
    ua: navigator.userAgent,
    uaMobile: (() => { try { return navigator.userAgentData?.mobile ?? null; } catch (_) { return null; } })(),
    platform: navigator.platform,
    maxTouch: navigator.maxTouchPoints,
    coarse: window.matchMedia("(pointer: coarse)").matches,
    pcFlag: (() => { try { return sessionStorage.getItem(PC_KEY); } catch (_) { return null; } })(),
    guardDropped: GUARD.dropped,
    localDevice: (() => { try { return window.__pbMatchHost?.service?.("seeds")?.localDevice ?? null; } catch (_) { return null; } })(),
  });

})();

