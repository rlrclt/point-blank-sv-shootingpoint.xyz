# วิเคราะห์ pbneo.app — ใช้โปรเจกต์ไหน?

> ตรวจเมื่อ 2026-11-05 · ตรวจจาก HTML/JS ที่เว็บ serve จริง (ไม่ใช่จาก snapshot)
> ยังไม่ได้ทดสอบด้วยเบราว์เซอร์จริง — ข้อสรุปมาจากหลักฐาน STATIC

---

## 1. คำตอบสั้น

**ไม่ใช้ทั้งสองโปรเจกต์**

| โปรเจกต์ | ใช้กับ pbneo ได้ไหม | เพราะ |
|---|---|---|
| `pb-esp-ext` (`shootingpoint.xyz`) | ❌ ไม่ได้ | ต้องมี `window.__pb` / `__pbR` (Three.js + Rapier JS engine) — pbneo เป็น **Unity WebGL/wasm** ไม่มีออบเจกต์เหล่านี้ |
| `pbmobile-ext` (`pbmobile.app`) | ❌ ไม่ได้ | patch `bundle.js`, `window.G`, `Ye`, JSON `"plat"` — pbneo ไม่มี bundle.js และ traffic เป็น C# ผ่าน jslib |

สิ่งที่ **นำกลับมาใช้ได้** คือ **วิธี** ไม่ใช่โค้ดทั้งก้อน (ดู §5)
ถ้าจะทำต่อ ต้องเปิดโปรเจกต์ที่สาม: **`pbneo-ext`** (ดู §6)

---

## 2. สถาปัตยกรรมที่ตรวจพบ

### 2.1 `pbneo.app` = portal (Next.js) ไม่ใช่ตัวเกม

```
<title>PB Neo — Point Blank Online เซิร์ฟเวอร์ใหม่ เล่นฟรี</title>
/_next/static/chunks/*.js
nav: /news /rankings /shop /rewards /topup /support /register /login
```

ในหน้าเว็บมี config ฝังอยู่:

```json
{"name":"PB Neo","playUrl":"https://play.pbneo.app","socials":{...}}
```

→ ตัวเกมอยู่ที่ **`play.pbneo.app`** (คนละ origin)

### 2.2 `play.pbneo.app` = Unity WebGL

```html
<canvas id="unity-canvas">
<script src="TemplateData/pb-loader.js"></script>
<script src="TemplateData/pb-turnstile.js"></script>
```

`PB_TEMPLATE` (ฝังใน index.html):

```json
{
  "desktop": { "loader":"62add…loader.js", "framework":"fd025…framework.js.br",
               "code":"7dba9…wasm.br", "data":"a9296…data.br" },
  "mobile":  { "loader":"62add…loader.js", "framework":"10659…framework.js.br",
               "code":"60e75…wasm.br", "data":"f4a2b…data.br" }
}
```

- สอง variant: **desktop** (DXT/BC7) และ **mobile** (ASTC) — เลือกจาก GPU extension ไม่ใช่จาก platform ban
- `framework.js.br` = Emscripten runtime
- `*.wasm.br` + `*.data.br` = เกมจริง (Unity C# compiled)

jslib ที่โหลด:

```
PBLanguage.jslib
PBClientWebSocket.jslib     ← network อยู่ใน Unity ไม่ใช่ JS
PBMobile.jslib
PBPlatform.jslib
PBRenderSafety.jslib
```

### 2.3 การเชื่อมต่อเซิร์ฟเวอร์

`pb-config.json` (แก้ได้โดยไม่ต้อง rebuild):

```json
{
  "connectMode": "direct",
  "serverHost": "play.pbneo.app",
  "serverScheme": "wss",
  "serverUrl": "wss://ws.pbneo.app/pb/ws/{wsport}",
  "wsPortOffset": 100,
  "authPort": 39190,
  "gatewayUrl": "/gw"
}
```

- `direct` = WebSocket ตรงไปแต่ละ emulator (Auth / Game / Battle) port = native + 100
- `gateway` = ผ่าน `PB.WebGateway`
- เป็น **private server emulator** (Auth/Game/Battle) ไม่ใช่ NCSoft ตัวจริง

### 2.4 Page API ที่มีให้ใช้ (ถูกกติกา)

```js
window.PBHost = {
  config, requestFullscreen, exitFullscreen,
  setGameplay(on), noteRun(...), fatal(kind, detail), setLanguage(...)
};
window.PB_CONFIG;     // deploy-time config
window.PB_RUNTIME;    // { variant, base, appliedDpr, dprLockedByApp, started, rotateHold }
window.PB_PLATFORM;   // { deviceClass, gpuRenderer, astc, s3tc, ... }
```

`deviceClass = 'phone' | 'tablet' | 'desktop'` คำนวณจาก UA/screen/touch ใน `pb-loader.js`
ใช้เลือก variant + DPR + ปุ่ม rotate — **ไม่ใช่ตัวตัดสิน platform ฝั่งเซิร์ฟเวอร์**

---

## 3. ตารางเทียบ: ของที่ `esp.js` ต้องใช้ vs ที่ pbneo มี

| `esp.js` ต้องใช้ | มีใน shootingpoint | มีใน pbneo |
|---|---|---|
| `window.__pb` (game controller) | ✅ | ❌ |
| `window.__pbR` (Three.js renderer) | ✅ | ❌ (Unity WebGL) |
| `pb.player.addLook / yaw / pitch` | ✅ | ❌ |
| `pb.world.castRay` (Rapier) | ✅ | ❌ (physics ใน wasm) |
| `userData.hitboxDefs` (hitbox center) | ✅ | ❌ |
| `pb.actors()` + `visualRoot` | ✅ | ❌ |
| `pb.nameTags` (projection) | ✅ | ❌ |
| WebSocket JSON payload (`plat`) | ❌ (ใช้ binary 9030) | ❌ (C# binary) |

| `pbmobile-ext` ต้องใช้ | มีใน pbmobile.app | มีใน pbneo |
|---|---|---|
| `bundle.js` (classic bundle) | ✅ | ❌ |
| `window.G` gate (`Ka&&`) | ✅ | ❌ |
| `Ye` / `P` (top-level const) | ✅ | ❌ |
| `WebSocket.prototype.send` + JSON | ✅ | ⚠️ ยังไม่ยืนยัน (jslib อาจใช้ real WebSocket แต่ payload เป็น binary) |
| `pbweb_periph` | ✅ | ❌ |

---

## 4. ทำไมแต่ละโปรเจกต์ใช้ไม่ได้

### `pb-esp-ext`
ทั้ง ESP และ aim พึ่ง dependency ของ JS game engine ล้วน ๆ:

```js
// esp.js
const pb = window.__pb;
pb.player.addLook(movePitch, moveYaw);
pb.world.castRay(ray, maxToi, true, flags, ...);
const cands = getAimCandidates(a);   // userData.boneHitboxes
drawSkeleton(a, cam);                // THREE.Bone.matrixWorld
```

Unity build ไม่มี `THREE`, ไม่มี `Rapier` ใน JS, ไม่มี `window.__pb`
→ โหลดไฟล์ไปก็รอ `__pb` ตลอดกาล ไม่มีอะไรเกิดขึ้น

### `pbmobile-ext`
กลไกหลักคือ **แก้ข้อความ bundle ก่อน execute** และ **rewrite JSON payload**:

```js
out = out.replace(GATE, GATE_FIX);
out = out.replace(/let v=[^;]*?"pc":"mobile";/, 'let v="mobile";');
ws.send = (data) => data.replace(/"plat":"pc"/g, '"plat":"mobile"');
```

pbneo ไม่มี `bundle.js` ให้แก้ และไม่มี `"plat":"pc"` ให้ replace
→ ตัว patcher หาไฟล์ไม่เจอ, ตัว wire guard ไม่มีอะไรให้ rewrite (payload เป็น binary ของ C#)

---

## 5. สิ่งที่นำกลับมาใช้ได้

| ของ | จาก | ใช้ยังไงกับ pbneo |
|---|---|---|
| `bg.js` (dynamic DNR: `user-agent`, `sec-ch-ua-*`) | `pb-esp-ext` | **ใช้ได้ทันที** เปลี่ยน `requestDomains` เป็น `pbneo.app` + `play.pbneo.app` + `ws.pbneo.app` |
| วินัย "ไม่ patch native ที่ AC ตรวจ" | `pbmobile-ext` | ใช้เป็นกฎตลอดโปรเจกต์ใหม่ |
| UA/navigator/matchMedia spoof | ทั้งสอง | ใช้ได้ แต่คุณค่าต่ำ — pbneo ไม่ได้ตัดสิน platform จาก JS |
| harness แบบ `node vm` | `pb-esp-ext` | ใช้ทดสอบ `PB_PLATFORM` spoof / loader wrapper ได้ |
| เอกสาร `docs/` | ทั้งสอง | โครงเดียวกัน |

`PBRenderSafety.jslib` + `webglHideExtensions` + memory-reload logic
⇒ build นี้ถูก-hardening ไว้ระดับหนึ่ง (ซ่อน extension, คุม heap, reload ตาม memory)
ต้องทดสอบก่อนสรุปว่า anti-cheat ฝั่ง wasm ตรวจอะไร

---

## 6. ถ้าจะทำ `pbneo-ext` (โปรเจกต์ที่สาม)

### ชั้น 0 — หน้าเว็บ (ง่าย, ความเสี่ยงต่ำ)

| งาน | ทำได้ด้วย |
|---|---|
| เปลี่ยน UA/CH header | `bg.js` DNR (copy จาก `pb-esp-ext`) |
| ปลอม `deviceClass` เป็น phone/tablet | ดัก `window.PB_PLATFORM` ก่อน loader เขียนทับ (`Object.defineProperty` setter) หรือ spoof navigator/screen |
| บังคับ variant | `var l = localStorage.getItem("PBLocalSettings")` → ดู `pb-loader.js` ฟังก์ชัน `pickVariant` (`forced` จาก query/localStorage) |
| ปรับ memory/perf | `?pbmem=legacy`, `?cfg.<key>=<value>` (whitelist ใน `MEM_KEYS` ของ loader) |
| fullscreen / pointer lock / rotate | `PBHost.*` + CSS ที่ template ทำอยู่ |

### ชั้น 1 — Unity bridge (กลาง)

`window.PBHost` คือ API ที่ template เปิดให้ host ใช้ (overlay, loading, setGameplay)
→ ใช้ทำ UI/overlay ได้ **โดยไม่ต้องแตะ memory**
แต่ `PBHost` ไม่มีข้อมูลผู้เล่น/ตำแหน่ง ⇒ ทำ ESP ไม่ได้จากชั้นนี้

### ชั้น 2 — ข้อมูลเกม (ยาก — ต้อง RE)

ทางเดียวที่จะได้ ESP บน Unity wasm:

**A. อ่าน WASM heap**
```js
// loader ไม่ expose unityInstance — ต้องดักเอง
const orig = window.createUnityInstance;
Object.defineProperty(window, "createUnityInstance", {
  configurable: true,
  get: () => (a, b, c) => orig(a, b, c).then((u) => { window.__pbUnity = u; return u; }),
  set: (v) => { /* เก็บตัวจริง */ }
});
// u.Module.HEAPU8 / HEAPF32 → อ่าน memory
```
แล้วต้องหา offset ของผู้เล่น/กล้อง — ต้อง reverse `*.wasm` (Ghidra wasm loader / wasm2c)
หรือใช้ symbol จาก `*.data.br` / IL2CPP metadata ถ้ามี

**B. แกะ WebSocket**
`PBClientWebSocket.jslib` สร้าง socket ใน JS — ถ้าเป็น `new WebSocket(...)` ตัวจริง
ก็ wrap constructor ได้ แต่ payload เป็น binary ของ C# (ไม่ใช่ JSON)
ต้อง reverse `combatProtocol` / packet layout ก่อน

**C. แก้ build**
รายได้สูงสุด แต่ต้องโฮสต์ build เอง (ไม่อยู่ในขอบเขต extension)

> ทั้ง A และ B ต้องใช้เวลา RE ระดับสัปดาห์ ไม่ใช่วัน — และยังไม่รู้ว่า anti-cheat
> ฝั่ง emulator ตรวจอะไร (private server อาจเข้มหรือหลวมกว่าตัวจริง)

---

## 7. สิ่งที่ยังไม่รู้ (ต้องทดสอบจริง)

1. `app-CoiLvacO` style room/`plat` ไม่มีใน pbneo — **เซิร์ฟเวอร์ตัดสิน mobile จากอะไร** (อาจไม่มีแนวคิดนี้เลย)
2. `PBClientWebSocket.jslib` ใช้ `WebSocket` ของ browser จริงหรือใช้ fetch/stream
3. `remember my choice` ของ variant เก็บที่ key ไหน (ใน loader มี `pickVariant(forced)`)
4. anti-cheat ฝั่ง wasm/emulator ตรวจ memory hook หรือไม่
5. `unityInstance` เข้าถึงได้ทางอื่นหรือไม่ (เช่น `PBHost` trzym reference ไว้)

---

## 8. คำสั่งตรวจซ้ำ

```js
// 1) portal
await (await fetch("https://pbneo.app/")).text()
// หา playUrl

// 2) ตัวเกม
const h = await (await fetch("https://play.pbneo.app/")).text();
h.includes("unity-canvas");           // true = Unity
h.includes("PB_TEMPLATE");            // variants

// 3) config
await (await fetch("https://play.pbneo.app/pb-config.json")).json()

// 4) loader
await (await fetch("https://play.pbneo.app/TemplateData/pb-loader.js")).text()
// grep: deviceClass, pickVariant, PBHost, createUnityInstance, jslib
```

---

## 9. สรุปเป็นตารางเดียว

| คำถาม | คำตอบ |
|---|---|
| ใช้ `pb-esp-ext` ได้ไหม | ไม่ได้ — ไม่มี `__pb`/`__pbR`/Three/Rapier |
| ใช้ `pbmobile-ext` ได้ไหม | ไม่ได้ — ไม่มี `bundle.js`/`G`/`plat` |
| ใช้ `bg.js` (DNR headers) ได้ไหม | **ได้** (เปลี่ยนโดเมน) |
| ต้องเปิดโปรเจกต์ใหม่ไหม | **ใช่ — `pbneo-ext`** |
| งานที่ทำได้ทันที | header spoof, `PB_PLATFORM` spoof, `?cfg.*`, overlay ผ่าน `PBHost` |
| งานที่ต้อง RE ก่อน | WASM heap offsets หรือ WS packet format |
| ระดับความยาก ESP | สูง (wasm) — ต่างจาก shootingpoint ที่เป็น JS ล้วน |

---

## 10. แผนงาน: ไม่ต้องเริ่มจากศูนย์

### 10.1 สัดส่วนงาน

| ส่วน | สถานะ | งาน |
|---|---|---|
| `bg.js` (DNR headers) | ♻️ ยกมา | เปลี่ยน `requestDomains` → 3 โดเมน |
| `manifest.json` | ♻️ ยกมา | เปลี่ยน matches / host_permissions |
| `injector.js` | ♻️ ใช้เลย | ไม่ต้องแก้ |
| harness (`node vm`) | ♻️ โครงเดิม | เขียน target ใหม่ |
| `docs/` | ♻️ โครงเดิม | เพิ่มเอกสาร pbneo |
| spoof layer (navigator/PB_PLATFORM) | 🆕 เขียนใหม่ | คนละ API |
| Unity bridge (`createUnityInstance`) | 🆕 เขียนใหม่ | ไม่มีในสองโปรเจกต์ |
| ESP / overlay | 🆕 เขียนใหม่ | ไม่มี Three.js ให้ hook |
| RE wasm (offsets) | 🆕 งานใหม่ | ต้องใช้ Ghidra/wasm2c |

สรุป: **ยกมาได้ ~30% เป็นโครง, 70% เขียนใหม่** — แต่ 70% นั้นแบ่งได้เป็นเฟสที่ส่งงานได้ทีละก้อน

### 10.2 เฟส

**P0 — Page layer (ไม่แตะ Unity, ไม่แตะ wasm) · ~1 วัน**

- [ ] `pbneo-ext/` ใหม่ + `manifest.json` + `bg.js` (DNR: pbneo.app, play.pbneo.app, ws.pbneo.app)
- [ ] `bg.js` ตรวจผลผ่าน `chrome.storage.local` (โครงเดียวกับ pb-esp-ext)
- [ ] `page-spoof.js` (MAIN world, document_start):
      UA / platform / maxTouchPoints / `devicePixelRatio`
- [ ] `PB_PLATFORM` guard — define getter ก่อน loader เขียนทับ:
      ```js
      let _p = null;
      Object.defineProperty(window, "PB_PLATFORM", {
        configurable: true,
        get: () => _p,
        set: (v) => { _p = v ? { ...v, deviceClass: "phone" } : v; }
      });
      ```
- [ ] `__pbNeoState()` — probe: variant ที่ถูกเลือก, deviceClass, headers, UA
- [ ] ตรวจ: Network → `user-agent` เป็น Android, variant = `mobile`

**P1 — Recon (อ่าน ไม่แก้) · ~2-3 วัน**

- [ ] `ws-capture.js` — wrap `WebSocket` constructor (Proxy) แบบ **อ่านอย่างเดียว**:
      log size/opcode/hexdump 300 ไบต์แรก, ไม่แก้ payload
- [ ] `heap-probe.js` — ดัก `window.createUnityInstance`:
      ```js
      const orig = window.createUnityInstance;
      Object.defineProperty(window, "createUnityInstance", {
        configurable: true,
        get: () => (...a) => orig(...a).then(u => (window.__pbUnity = u, u)),
        set: (v) => { orig = v; }
      });
      ```
      ตรวจว่า `u.Module.HEAPU8` เข้าถึงได้
- [ ] export: `__pbNeoDump()` → เก็บ packet แรก 50 ลูก + heap size
- [ ] สรุปว่า: WS ใช้ `WebSocket` จริงไหม / heap เข้าถึงได้ไหม / มี anti-cheat ping ไหม

**P2 — ESP (ถ้า P1 ผ่าน) · ~1-2 สัปดาห์**

- [ ] RE `*.wasm` (Ghidra wasm loader) หา struct ผู้เล่น/กล้อง
- [ ] อ่านตำแหน่งจาก `HEAPF32` + project ด้วย view matrix ที่หาได้
- [ ] overlay = canvas 2D ธรรมดา (ไม่ต้องพึ่ง engine)
- [ ] fallback: ถ้า heap ไม่ไหว → parse battle packet จาก WS แทน (ตำแหน่งมักอยู่ใน movement sync)

**P3 — Aim / Recoil · ยากสุด**

- [ ] aim ต้องเขียนค่า rotation กลับเข้า heap (เสี่ยง crash + AC) หรือ synthetic mouse
- [ ] recoil ต้องหา accumulator ใน wasm
- [ ] ควรทำหลัง P2 นิ่งแล้วเท่านั้น

### 10.3 โครงไฟล์ที่แนะนำ

```
pbneo-ext/
├── manifest.json          MV3 (pbneo.app + play.pbneo.app + ws.pbneo.app)
├── bg.js                  DNR headers + storage report
├── page-spoof.js          MAIN world: navigator + PB_PLATFORM + createUnityInstance hook
├── probe.js               __pbNeoState() / __pbNeoDump() (diagnostics)
├── overlay.js             canvas 2D overlay (ระยะ P2)
└── docs/
    ├── README.md
    └── PROTOCOL.md        packet notes จาก P1
```

### 10.4 สิ่งที่ต้องรู้ก่อนเริ่ม P2

- ถ้า `unityInstance.Module.HEAPU8` เข้าถึงไม่ได้ → P2 จบ (เหลือแค่ WS parsing)
- ถ้า wasm ถูก strip symbol → ต้องหา offset ด้วย pattern scanning (ช้ากว่ามาก)
- ถ้า emulator มี sanity check ฝั่งเซิร์ฟเวอร์ → การเขียนค่าแปลก ๆ จะถูกเตะ

> **คำแนะนำ:** ทำ P0 ให้จบและวัดผลก่อน (1 วัน) แล้วค่อยตัดสินใจว่า P1 คุ้มหรือไม่
> อย่าเริ่ม P2 ก่อนรู้ว่า heap/WS เข้าถึงได้จริง
