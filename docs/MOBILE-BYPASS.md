# Mobile Bypass — PB ESP - TH

> สถานะ: **ใช้งานได้** (v2.6.0)
> ขอบเขต: `shootingpoint.xyz` (Point Blank Web TH) — คลienต์ Vite ES-module build
> เอกสารนี้อธิบายว่าอะไรทำให้เกมขึ้นว่า "PC", แต่ละชั้นแก้อะไร, และวิธีตรวจ

---

## 1. สรุปสั้น

เกมตัดสินว่าเราเป็น PC จาก **สี่ชั้น** ที่แยกกันสมบูรณ์:

| # | ชั้น | ใครเป็นคนตัดสิน | แก้ที่ |
|---|---|---|---|
| 1 | `navigator` / `matchMedia` / `userAgentData` | `deviceProfile-*.js` → `isMobile` | `mobile-spoof.js` |
| 2 | ตัวจับ mouse/keyboard (periph detector) | `roomInputDevice-*.js` | `mobile-spoof.js` (periph guard) |
| 3 | ตัวนับ synthetic input | `input.takeUntrusted()` | `mobile-spoof.js` |
| 4 | HTTP request headers | เซิร์ฟเวอร์ (อ่าน `User-Agent`) | `bg.js` (declarativeNetRequest) |

ปิดครบทั้งสี่ชั้น = `localDevice = 2` (mobile) ทั้งในเครื่องและฝั่งเซิร์ฟเวอร์

---

## 2. เกมตัดสินยังไง (จาก bundle จริง)

### 2.1 `deviceProfile-<hash>.js`

```js
function i(e){
  return e.userAgentData?.mobile === true
      || /Android|iPhone|iPad|iPod/i.test(e.userAgent ?? "")
      || ((e.platform === "MacIntel" || /Macintosh/.test(e.userAgent ?? ""))
          && (e.maxTouchPoints ?? 0) > 1);
}
const u = typeof navigator !== "undefined" && (i(navigator) || <GPU check>);
export { u as M };   // M = isMobile
```

`mobile-spoof.js` ปลอม `navigator.userAgent`, `platform`, `maxTouchPoints`, `userAgentData.mobile` → `M === true`

### 2.2 `testBots-<hash>.js` — device enum

```js
const A = { unknown: 0, pc: 1, mobile: 2 };   // DEVICE
const O = 9030;                                // DEVICE_REQ
let C = A.unknown;
function b(e){ if (e !== C) { C = e; for (const n of D) n(e); } }  // setLocalDevice
const y = () => C;                                                 // localDevice
```

### 2.3 `roomInputDevice-<hash>.js` — ตัวต้นเหตุ

```js
const F = "pb.room.pcInput.v1";                  // sessionStorage

function B(){
  try { sessionStorage.setItem(F, "1"); } catch {}
  J(y.pc);                                       // setLocalDevice(pc)
  Y("reportPcInput")?.();                        // แจ้ง host (ถ้ามี)
}

function jt(){
  let n = sessionStorage.getItem(F) === "1";
  const t = Y("seeds")?.().localDevice;
  const f = (t === y.pc || t === y.mobile) ? t : (bt ? y.mobile : y.pc);  // bt = isMobile
  J(n ? y.pc : f);

  const o = e => { if (j() !== y.pc && lt(e)) B(); };
  document.addEventListener("pointerdown", o, { capture: true, passive: true });
  document.addEventListener("pointermove", o, { capture: true, passive: true });
  window.addEventListener("keydown", e => { if (j() !== y.pc && ct(e)) B(); }, { capture: true });
}
```

ตัวตรวจ event (`ownHooks-<hash>.js`):

```js
function st(e){ return e.isTrusted && !e.isComposing && e.keyCode !== 229
                    && e.key !== "Unidentified" && mn.test(e.code) && !gn(e.target); }
function rt(e){ return e.isTrusted && e.pointerType === "mouse"
                    && (e.type === "pointerdown" || !!(e.movementX || e.movementY)); }
```

> **ขยับเมาส์ครั้งเดียว หรือกด WASD ตัวเดียว → PC ทันที**
> และจำใน `sessionStorage` → reload ถัดไปเริ่มเป็น PC เลย

### 2.4 event → device → packet

```js
// roomClient-<hash>.js
reportDevice(){
  this.deviceReady && this.conn.isOpen && H()
    && this.conn.send(ge, new _(1).writeC(H()));   // ge = 9030, H() = localDevice
}
deviceOf(t){ return this.devices[t] || (t === this.mySlot ? H() : 0); }
```

`H()` เป็น 0 → **ไม่ส่ง packet เลย** → ไอคอนในห้อง fallback เป็น PC

---

## 3. ชั้นที่แก้ (โค้ดจริงในโปรเจกต์นี้)

### ชั้น 1 — `mobile-spoof.js` §1–3

```js
const FAKE_UA = "Mozilla/5.0 (Linux; Android 14; SM-S918B) ... Mobile Safari/537.36";

Object.defineProperty(navigator, "userAgent",      { get: () => FAKE_UA, configurable: true });
Object.defineProperty(navigator, "platform",       { get: () => "Linux armv8l", configurable: true });
Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5, configurable: true });
Object.defineProperty(navigator.userAgentData, "mobile", { get: () => true, configurable: true });

matchMedia("(pointer: coarse)")  → matches: true
matchMedia("(pointer: fine)")    → matches: false
devicePixelRatio                 → 2.625
```

### ชั้น 2 — periph guard (หัวใจของงานนี้)

ตัว detector ผูก listener แบบ capture ที่ `document`/`window` โดยฟังก์ชันสั้นและมี `.pc` อยู่ในซอร์ส
→ กรองทิ้งตั้งแต่ตอนลงทะเบียน **ไม่ต้องแตะ event เลย**

```js
const PERIPH_RE = /pbInput|pcInput|pbweb_periph|localDevice|setLocalDevice|\.pc\b/i;

const guardEvents = (target) => {
  const add = target.addEventListener;
  const wrapped = function (type, fn, opts) {
    const cap = opts === true || (opts && typeof opts === "object" && opts.capture);
    if (cap && /^(pointerdown|pointermove|mousedown|mousemove|keydown)$/.test(type)) {
      const src = String(fn);
      if (src.length < 4000 && PERIPH_RE.test(src)) return;   // ไม่ผูก
    }
    return add.call(this, type, fn, opts);
  };
  Object.defineProperty(wrapped, "name", { value: "addEventListener" });
  target.addEventListener = wrapped;
};

guardEvents(window);
guardEvents(document);
```

**ทำไมไม่ patch `EventTarget.prototype`** — AC ตรวจ native พวกนี้ (`EventTarget.prototype.addEventListener`,
`WebSocket.prototype.send`, `Function.prototype.toString`, `Storage.getItem`, `WeakMap/Map`, `Object.defineProperty`)
การแทนที่ instance method ของ `window`/`document` ไม่แตะ prototype จึงไม่ถูกจับ

### ชั้น 3 — ปิดร่องที่เหลือ

```js
// isTrusted ชั้นสอง: เผื่อ listener หลุด guard
const hideTrust = (e) => {
  if (e.isTrusted !== true) return;
  if (e.type !== "keydown" && e.pointerType !== "mouse") return;
  Object.defineProperty(e, "isTrusted", { configurable: true, get: () => false });
};

// ตัวนับ synthetic input ต้องไม่รายงาน ไม่งั้นขึ้น "input-synthetic"
input.takeUntrusted = () => ({});
```

### ชั้น 4 — `bg.js` (service worker, dynamic DNR)

```js
chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [9101],
  addRules: [{
    id: 9101, priority: 1,
    action: { type: "modifyHeaders", requestHeaders: [
      { header: "user-agent",               "operation": "set", value: UA },
      { header: "sec-ch-ua-mobile",         "operation": "set", value: "?1" },
      { header: "sec-ch-ua-platform",       "operation": "set", value: "\"Android\"" },
      { header: "sec-ch-ua-platform-version","operation": "set", value: "\"14.0.0\"" }
    ]},
    condition: {
      requestDomains: ["shootingpoint.xyz"],
      resourceTypes: ["main_frame","sub_frame","stylesheet","script","image",
                      "font","object","xmlhttprequest","ping","media","websocket","other"]
    }
  }]
});
```

ใช้ **dynamic** ไม่ใช่ static `rules.json` เพราะเขียนผลลง `chrome.storage.local` (`pbEspDnr`) ได้
→ เปิด service worker console แล้วเห็นทันทีว่า rule ติดหรือไม่

---

## 4. สิ่งที่ **ไม่** ทำ (และเหตุผล)

| วิธี | ทำไมไม่ใช้ |
|---|---|
| patch `Storage.prototype.setItem/getItem` | AC ตรวจ `Storage.getItem` — เก็บ `pb.room.pcInput.v1` ด้วยการล้างตอนบูต + ตัด detector พอแล้ว |
| patch `WebSocket.prototype.send` | AC fingerprint ตัวนี้ |
| patch `JSON.stringify` | ไม่มี `plat` ในคลienต์นี้ (คนละ build กับ `pbmobile.app`) |
| บังคับ `?touch=1` | ทำให้เกมเข้าโหมด touch UI ซึ่งเมาส์เดินไม่ได้ (ยืนยันจาก `pbmobile-ext`) |
| แตะ `EventTarget.prototype` | AC ตรวจ |

> อ้างอิง: `C:\Users\YoruDekD\Desktop\pbmobileapp\pbmobile-ext` (`bg.js`, `inject.js`)
> ใช้วิธีเดียวกันนี้กับคลienต์ `pbmobile.app` ที่ใช้ `plat` ทาง JSON — คลienต์นี้ใช้ binary packet 9030 แทน

---

## 5. ตรวจว่าได้ผล

### 5.1 เปิด extension

```
chrome://extensions → PB ESP - TH → reload
```

ถ้า manifest ผิด extension จะไม่โหลด (แดง) — ต้องแก้ก่อน

### 5.2 service worker

```
chrome://extensions → PB ESP - TH → "service worker"
```

ต้องเห็น:

```
[PB] dnr true rule 9101 active
```

### 5.3 request headers

```
F12 → Network → คลิก request ใดก็ได้ที่เป็น shootingpoint.xyz → Headers → Request Headers
```

ต้องเห็น:

```
user-agent: Mozilla/5.0 (Linux; Android 14; SM-S918B) ... Mobile Safari/537.36
sec-ch-ua-mobile: ?1
sec-ch-ua-platform: "Android"
```

### 5.4 ในหน้าเกม

```js
__pbMobileState()
```

ผลที่ถูกต้อง:

```js
{
  spoof: true,
  ua: "...Android 14; SM-S918B...",
  uaMobile: true,
  platform: "Linux armv8l",
  maxTouch: 5,
  coarse: true,
  pcFlag: null,          // sessionStorage ไม่มีค่า PC
  guardDropped: 1,       // ตัวจับถูกทิ้ง (เพิ่มหลังขยับเมาส์)
  localDevice: null      // ไม่ได้อยู่ใน iframe ที่มี host (เคสปกติ)
}
```

---

## 6. Troubleshooting

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `guardDropped: 0` หลังขยับเมาส์ | regex ไม่ match ซอร์สที่ minify | ขยาย `PERIPH_RE` หรือพึ่ง isTrusted (ยังทำงาน) |
| `pcFlag: "1"` | ตั้งไว้ก่อน reload | ปิดแท็บ เปิดใหม่ (script ล้างตอน document_start) |
| Network ยังเป็น Windows | DNR ไม่ทำงาน | ดู service worker console, เช็ค `pbEspDnr` |
| `localDevice` เป็นเลข (ไม่ null) | อยู่ใน iframe ที่มี `__pbMatchHost` | ค่าต้องเป็น 2 |
| ไอคอนในห้องยังเป็นจอคอม | `devices[]` มาจากเซิร์ฟเวอร์ตอนเข้า room | ออกจากห้อง → เข้าใหม่หลัง reload |
| ขึ้น "โปรดใช้ห้อง PC" | `localDevice !== 2` ตอนกด join | ตรวจ 5.4 |

---

## 7. ลำดับการทำงาน (flow)

```
document_start
  └─ mobile-spoof.js (MAIN world)
       1. ปลอม navigator / matchMedia / DPR / UA-CH
       2. ล้าง pb.room.pcInput.v1 + pbweb_periph
       3. ติด periph guard ที่ window + document
       4. isTrusted fallback + takeUntrusted neutralizer

page load
  ├─ deviceProfile-*.js อ่าน navigator  → isMobile = true
  ├─ roomInputDevice-*.js
  │     jt() → setLocalDevice(2)          ← ได้ mobile
  │     ผูก detector → ถูก guard ทิ้ง
  └─ roomClient-*.js
        reportDevice() → packet 9030 (device=2)

background (bg.js)
  └─ DNR 9101 → ทุก request มี UA Android
```

---

## 8. ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|---|---|
| `mobile-spoof.js` | ปลอม navigator/matchMedia + periph guard (MAIN world, document_start) |
| `bg.js` | service worker ติดตั้ง dynamic DNR rule 9101 |
| `injector.js` | ดัน `esp.js` เข้า page world |
| `esp.js` | ESP overlay / aim / norecoil (ไม่เกี่ยวกับ bypass) |
| `manifest.json` | permissions, host_permissions, background, content_scripts |

## 9. Version

| เวอร์ชัน | เปลี่ยนอะไร |
|---|---|
| 2.3.3 | ก่อนแก้ bypass |
| 2.4.0 | URL → `shootingpoint.xyz`, sessionStorage lock |
| 2.5.0 | `rules.json` (static DNR) |
| 2.6.0 | `bg.js` (dynamic DNR) + periph guard + ถอด Storage patch + ล้าง `pbweb_periph` |
