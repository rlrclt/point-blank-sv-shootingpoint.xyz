# Development guide — pb-esp-ext

## โครงไฟล์

```
pb-esp-ext/
├── esp.js              ตัวหลัก (ESP / aim / recoil / fast swap / GUI)
├── injector.js         ฉีด esp.js เข้า MAIN world
├── mobile-spoof.js     ปลอมอุปกรณ์/header
├── manifest.json       MV3
├── pbrecon/            ซอร์สที่แยกจาก build จริง (อ่านอย่างเดียว)
│   ├── main-*.js       engine, player, weapon system, anti-cheat
│   ├── avatarCombat-*.js  stat/upgrade (swapTime, reloadTime)
│   ├── config-*.js     MovementConfig, asset paths
│   ├── pbConfig-*.js   ดาเมจ/การเคลื่อนที่
│   ├── index-*.js      netcode/room
│   └── collisionGroups-*.js (import ใน main)
└── docs/               เอกสารชุดนี้
```

## ลำดับการทำงานของ esp.js

```
injector → esp.js (MAIN world)
  ├─ อ่าน/สร้าง CFG (localStorage pbEspCfg_v2)
  ├─ สร้าง panel (GUI) + ผูก data-c / slider
  ├─ hookRenderer()
  │    patch window.__pbR.render
  │      ├─ aimAssistTick(pb, camera)     // ก่อน render
  │      ├─ fastSwapTick(pb)
  │      ├─ orig.render()
  │      └─ drawOnce(scene, camera)       // ESP หลัง render
  └─ fallbackLoop (ถ้ายัง hook ไม่ได้)
```

## เพิ่มฟีเจอร์ใหม่ (3 ขั้น)

1. **CFG** — เพิ่มค่าใน object `CFG` พร้อม default
2. **GUI** — เพิ่ม `<input data-c="key">` (checkbox) หรือ slider + ผูก event
   - checkbox ใช้ `data-c` อัตโนมัติ (loop ที่ `panel.querySelectorAll`)
   - slider/number ต้องผูกเองในบล็อก "ผูก sliders"
3. **Tick** — เขียนฟังก์ชัน `xxxTick(pb)` แล้วเรียกใน `R.render` (ในบล็อก `frameNo` guard) และใน `fallbackLoop`

ตัวอย่าง (fast swap):

```js
// CFG
fastSwap: false,
swapMs: 250,

// tick
function fastSwapTick(pb) {
  if (!CFG.fastSwap) return;
  const ws = weaponSystemOf(pb);
  if (!ws) return;
  const max = CFG.swapMs / 1000;
  if (ws.switchTimer > max) {
    ws.switchTimer = max;
    ws.switchTotal = Math.min(ws.switchTotal, max);
  }
}
```

## กติกาเขียนโค้ด

- **อย่าแตะ prototype** ของ native (WebGL, Canvas2D, WebSocket, rAF, EventTarget, Function.toString)
- แก้ที่ **instance** เท่านั้น (`pb.player.*`, `ws.*`, `camera.rotation` ชั่วคราว)
- อย่าแก้ค่าคงที่เกม (`q`, `ci`) — ถูก freeze และ hash
- อย่า `dispatchEvent` synthetic
- ฟีเจอร์ที่วาด overlay → เก็บใน canvas/shadow ของเรา
- ฟีเจอร์ที่เกี่ยวกับเวลา → ใช้ `performance.now()` อ่านเท่านั้น

## โหลด/ทดสอบ

1. `opera://extensions` → Developer mode → Load unpacked → โฟลเดอร์นี้
2. แก้ `esp.js` → กด Reload ที่การ์ด extension → refresh เกม
3. เปิด console ดู `[anti-cheat]` / error ของ extension
4. เปิดเมนูในเกม (Ins) เพื่อยืนยันค่า

## Backup / commit

```powershell
Copy-Item esp.js "esp.js.bak-$(Get-Date -Format yyyyMMdd-HHmm)"
git add esp.js manifest.json
git commit -m "vX.Y.Z: <สรุป>"
```

## วิเคราะห์ build ใหม่ (workflow)

1. DevTools → Network → โหลด `/` → เก็บ `main-*.js`, `config-*.js`, `avatarCombat-*.js`
2. วางใน `pbrecon/` (หรือโฟลเดอร์แยก)
3. หาค่าที่ต้องการ:
   - เวลา/สถานะ → `switchTimer`, `reloadTimer`, `nextShot`
   - ค่าคงที่ → `config-*` (MovementConfig), `pbConfig-*`
   - ระบบ → `class` ที่มี field นั้น แล้วดูว่าใครถือ instance (`pb.*`)
4. อัปเดต `docs/offsets.md`
5. ตรวจ anti-cheat ซ้ำ (`docs/anticheat.md` §7)

## ใช้ REA (ถ้ามี)

```powershell
npx -y rea-agents@6.7.0 analyze-javascript-application "C:\path\to\pbrecon" --json
```

หรือผ่าน MCP `analyze_javascript_application` แล้ว `inspect_analysis_view` เพื่อดู semantic graph
ใช้หา "ฟังก์ชันไหนเขียน field นี้" ใน build ที่ minify
