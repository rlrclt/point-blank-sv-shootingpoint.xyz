# Anti-cheat update — build 2026-11 (DxpkJc0_)

> เอกสารนี้สรุปว่า anti-cheat ของ `shootingpoint.xyz` อัปเดตอะไรบ้าง
> และ extension รับมืออย่างไร
>
> อัปเดตล่าสุด: **2026-11-09** — `index-DxpkJc0_.js` / `pb-guard-DbU4Ge0q.js`

---

## 1) สรุปสั้น

ประวัติ build ที่เจอ:

```text
index-B9n8Vc50.js
index-S53k3QNg.js   + pb-guard-De53vzm2.js
index-DxpkJc0_.js   + pb-guard-DbU4Ge0q.js   ← ปัจจุบัน
```

`pb-guard-*.js` (~98 KB, obfuscated) เปลี่ยนชื่อและเปลี่ยนวิธี obfuscate
ทุกครั้งที่ deploy — **ตัวแปร/ชื่อฟังก์ชันภายในไม่คงที่** แต่ API ที่ export
(72 ชื่อ) ยังเหมือนเดิม

จุดเปลี่ยนสำคัญที่สุดคือ **เกมหยุด expose `window.__pb` / `window.__pbR`
บนโดเมนจริง** — เหลือเฉพาะตอน hostname เป็น `localhost`

ผลกับ extension:
- เมนูขึ้น `รอเข้าแมตช์`
- ESP / aim / recoil / spawner / server check ไม่ทำงาน
- ทั้งที่ผู้เล่นเข้าแมตช์แล้ว

ไม่ใช่บั๊กของ esp.js และไม่ใช่เพราะ AC “แบน” — เป็นการซ่อน object เกม

> ไฟล์ build เก่ายังตอบ 200 อยู่ (CDN เก็บไว้) แต่หน้าแรกอ้างเฉพาะ build ล่าสุด
> ถ้า browser cache หน้าเก่าไว้ อาจโหลด guard เก่า → `guard-patched.js`
> ต้องมี export ครบ 72 ชื่อเหมือนกัน (ปัจจุบันครบทั้งสองรุ่น)

---

## 2) โค้ดที่เปลี่ยน

ใน `main-*.js`:

```js
es && (window.__pb = E, window.__pbR = i)
```

`es` ถูก import จาก guard:

```js
import { D as es } from "./pb-guard-DbU4Ge0q.js";
```

ใน `pb-guard` (หลัง deobfuscate รุ่น `De53vzm2`):

```js
function _0(h) {
  return h === "localhost" || h === "127.0.0.1" ||
         h === "[::1]" || h === "::1" || h.endsWith(".localhost");
}

const hn = typeof location !== "undefined" && _0(location.hostname);
```

รุ่น `DbU4Ge0q` ชื่อตัวแปรเปลี่ยน (obfuscate คนละแบบ):

```js
const _e = typeof location !== c(1183) + c(663) && v0(location[c(785) + "me"]);
```

`c()` / `x()` เป็น string decoder — `c(1183)+c(663)` = `"undefined"`,
`c(785)+"me"` = `"hostname"`

ตัวแปรนี้ถูก export เป็น `D` → main ใช้เป็น `es`
**ชื่อตัวแปรภายในไม่คงที่ ต้องหาใหม่ทุก build**

ดังนั้น:

| hostname | `es` | `window.__pb` |
|---|---|---|
| `localhost` | true | มี |
| `shootingpoint.xyz` | false | ไม่มี |
| `*.trycloudflare.com` | false | ไม่มี |

---

## 3) AC checks ที่ยังอยู่

guard ยังมี checks ชุดเดิม (ย้ายมา obfuscated):

| kind | เงื่อนไข |
|---|---|
| `input-synthetic` | untrusted input ≥ 5 (`tx = 5`) |
| `time-tamper` | clock เพี้ยน > 15% ติด 2 ครั้งใน 10 วิ |
| `const-tamper` | `JSON.stringify([Y, d0])` เปลี่ยน |
| `hp-tamper` | maxHp เปลี่ยน หรือ hp เกิน max |
| `speed-tamper` | speed > `run.front * 1.6` ติด 4 ครั้ง |
| `gl-depth` | `DEPTH_TEST` + `DEPTH_FUNC === ALWAYS` ติด 8 ครั้ง |
| `gl-hook` | native ถูกแทน ทุก 10 วิ |

รายงานยังออกทาง:

```js
console.warn("[anti-cheat] " + kind + ": " + detail)
connection.send(9007, packet)
```

native list ที่ guard ตรวจ ยังรวม:
WebGL methods, `WebSocket.prototype.send`, `dispatchEvent`, `MouseEvent`,
`PointerEvent`, `requestAnimationFrame`, `performance.now`,
`requestPointerLock`, `addEventListener`, `WebSocket`,
`Function.prototype.toString`, parent frame `ws.send` / `WebSocket`

---

## 4) เราแก้อะไร

### 4.1 Guard redirect (สำคัญที่สุด)

`bg.js` เพิ่ม DNR rule `9102`:

```js
{
  id: 9102,
  priority: 2,
  action: { type: "redirect", redirect: { extensionPath: "/guard-patched.js" } },
  condition: {
    requestDomains: ["shootingpoint.xyz", "trycloudflare.com"],
    resourceTypes: ["script"],
    urlFilter: "pb-guard-"
  }
}
```

`guard-patched.js` คือสำเนา guard ของ build นั้น
แก้เฉพาะตัวแปร host flag:

```diff
- const hn = typeof location !== "undefined" && _0(location.hostname);
+ const hn = true;
```

รุ่น `DbU4Ge0q` (ปัจจุบัน):

```diff
- const _e=typeof location!==c(1183)+c(663)&&v0(location[c(785)+"me"])
+ const _e=!0
```

> แก้เฉพาะ **declaration** ไม่ต้องแตะ export
> (`_e as D` / `hn as D` ยังอยู่เหมือนเดิม)

ผลคือ:
- `es === true`
- เกม expose `__pb` / `__pbR` ตามปกติ
- checks / opcode 9007 ของ guard ยังทำงานเหมือนเดิม
- เราไม่ได้ปิดทั้ง guard

`guard-patched.js` ต้องอยู่ใน:

```json
"web_accessible_resources": [
  {
    "resources": ["esp.js", "guard-patched.js"],
    "matches": [
      "*://shootingpoint.xyz/*",
      "*://*.shootingpoint.xyz/*",
      "*://*.trycloudflare.com/*"
    ]
  }
]
```

### 4.2 Frame-aware bridge

`esp.js` เพิ่ม `findPB()` / `findRenderer()`:

- หา `__pb` / `__pbR` จาก window ปัจจุบัน
- parent / top
- child frames (`window.frames`)

รองรับกรณี `esp.js` อยู่หน้าแม่ แต่เกมอยู่ใน match iframe

### 4.3 สถานะที่มีความหมาย

เดิม:

```text
รอเข้าแมตช์...
```

ตอนนี้แยกเป็น:

| สถานะ | ความหมาย |
|---|---|
| `รอเข้าแมตช์...` | หา `__pb` ไม่เจอเลย |
| `พบเกมแล้ว — รอผู้เล่นเกิด/โหลดแมตช์` | เจอ `__pb` แต่ยังไม่มี `pb.me` |
| แสดงจำนวนตัว | พร้อมใช้งาน |

และมีบรรทัด **Bridge** ใน SAFETY:

```text
bridge: pb=yes · me=yes · player=yes · renderer=yes · frames=1
```

### 4.4 AC shield

`esp.js` hook instance `room.game.conn.send` และทิ้งเฉพาะ opcode `9007`

- ไม่แตะ `WebSocket.prototype.send`
- ไม่แตะ packet เกมอื่น
- มีตัวนับ `blocked` ใน SAFETY

### 4.5 ลบ synthetic input

เดิมใช้:

```js
document.dispatchEvent(new MouseEvent("mousemove", ...))
```

ตอนนี้ใช้:

```js
pb.player.addLook(dPitch, 0)
```

จึงไม่สะสม `isTrusted === false` ให้ `input-synthetic`

### 4.6 Safe Mode / Panic

- spawn cooldown 1500 ms
- โควต้า 8 ครั้ง/นาที
- บังคับ proxy, ข้าม pickup ใน Safe Mode
- `F10` panic: ปิดทุกฟีเจอร์ + ซ่อนแผง

---

## 5) ข้อจำกัด

- `guard-patched.js` ผูกกับ build/guard version
  - เกมอัปเดต guard ใหม่ → ต้องสร้างไฟล์ใหม่
  - export ยังมี 72 ชื่อ แต่ logic ภายในเปลี่ยน
  - ถ้า build ใหม่เปลี่ยน API export → ต้องแก้ `esp.js`/`bg.js` ตาม
- ถ้าเกมเพิ่ม integrity check กับชื่อ/แฮชของ guard → redirect อาจถูกจับ
- server-side behavior (hit-rate, drop/pickup, killfeed) ยังตรวจได้
- การบล็อก 9007 ทำให้รายงาน client-side ไม่ออก
  แต่ไม่ได้รับประกันว่าไม่โดนแบน
- ห้ามใช้ `performance.now` / `Date.now` / `rAF` patch
- ห้าม patch prototype/native ในรายการของ guard

---

## 6) ขั้นตอนสแกนรอบถัดไป

### 6.1 ตรวจ build ใหม่

```powershell
node pbrecon\refresh.mjs --check
```

สคริปต์อ่านหน้าแรกเอง, หา `index-*.js`, ไล่ chunk graph, แล้วบอกว่า
index / guard / ไฟล์ไหนใหม่ พร้อม exit code 1 เมื่อมีการอัปเดต

### 6.2 crawl bundle

```powershell
node pbrecon\refresh.mjs          # ลง pbrecon\live\ เฉพาะไฟล์ที่เปลี่ยน
```

จากนั้นค้นหา:

```powershell
Select-String -Path "pbrecon\live\*.js" -Pattern "pb-guard|anti-cheat|9007|input-synthetic"
```

ถ้าไม่มี Node หรืออยากได้ไฟล์ดิบ:

```sh
curl -s -A "Mozilla/5.0" "https://shootingpoint.xyz/?matchsplit=0" -o root.html
grep -o 'index-[A-Za-z0-9_-]*\.js' root.html
```

### 6.3 patch guard อัตโนมัติ

```powershell
node scripts\refresh-guard.mjs --check       # exit 1 = ต้อง patch
node scripts\refresh-guard.mjs --sync ..\pb-esp-ext-cf
```

สคริปต์ทำให้ครบ:
1. อ่านหน้าแรก → `index-*.js`
2. หา `pb-guard-*.js` ที่ index import
3. หา declaration ของ host flag (`typeof location ... location.hostname`)
4. แทนเฉพาะ initialiser ด้วย `!0`
5. ตรวจ `node --check` + จำนวน export ต้องเท่าเดิม (72)
6. เขียน `guard-patched.js` (มี header `guard=... build=...`)
7. `--sync <dir>` คัดลอกไปอีกโฟลเดอร์

ชื่อ flag เปลี่ยนทุก build (เช่น `hn` → `_e`) แต่สคริปต์หาให้เอง
ถ้าหาไม่เจอจะพิมพ์ snippet รอบ `hostname` ออกมาและหยุด

ถ้าจะ patch มือ:

```powershell
node -e "const fs=require('fs');const s=fs.readFileSync('pbrecon/live/pb-guard-XXXX.js','utf8');const i=s.indexOf('const _e=');const e=s.indexOf(',ft=',i);fs.writeFileSync('guard-patched.js',s.slice(0,i)+'const _e=!0'+s.slice(e))"
```

### 6.4 ตรวจผล

```powershell
node --check guard-patched.js
Select-String -Path guard-patched.js -Pattern "^/\* pb-guard-patched|^export\{" | Select-Object -First 2
```

ยืนยันว่า export ยังครบ 72 ชื่อ และ header ระบุ guard ตรงกับ build ปัจจุบัน

### 6.5 ตรวจ DNR

ใน `bg.js` ต้องมี rule `9102` และ `urlFilter: "pb-guard-"`

### 6.6 reload

```text
brave://extensions → PB ESP - CF → Reload
เกม → F5
```

หัวแผงต้องเป็น version ใหม่ และ SAFETY → Bridge ต้องขึ้น `pb=yes`

---

## 7) ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|---|---|
| `esp.js` | GUI/ESP/aim/spawner/findPB/AC shield |
| `guard-patched.js` | guard build ปัจจุบัน (`DbU4Ge0q`) ที่แก้ host flag เป็น `true` (มี header ระบุ build) |
| `scripts/refresh-guard.mjs` | ตรวจ + patch guard อัตโนมัติ (`--check` / `--sync`) |
| `pbrecon/refresh.mjs` | ดึง bundle สดลง `pbrecon/live/` |
| `bg.js` | DNR 9101 (mobile headers) + 9102 (guard redirect) |
| `injector.js` | bridge ระหว่างหน้า options กับ page-world |
| `site/app.js` | Server Owner / auto-import / owned filter |
| `manifest.json` | matches ทั้ง shootingpoint + trycloudflare, web accessible guard |
| `docs/anticheat.md` | รายละเอียด AC checks และประวัติ |
| `docs/offsets.md` | runtime API/offset ที่ esp.js ใช้ |

---

## 8) Troubleshooting

### เมนูขึ้น `รอเข้าแมตช์`

1. ดู version ที่หัวแผง
2. ถ้าไม่ใช่ version ล่าสุด → reload extension + F5
3. ดู SAFETY → Bridge
   - `pb=no` → guard redirect ไม่ทำงาน หรือ extension คนละโฟลเดอร์
   - `me=no` → ยังไม่เกิด/เข้าแมตช์
4. ตรวจ `brave://extensions` ว่าโฟลเดอร์ที่โหลดอยู่คือโฟลเดอร์ที่แก้จริง

### Server Owner ว่าง

- ต้องเปิดผ่านปุ่มในเกม หรือ Options ของ extension
- ถ้าเปิด `site/index.html` แบบ `file://` → ต้อง paste CSV เอง
- ถ้าเกมไม่เข้าแมตช์ → `respawnInventory`/`db` ยังไม่พร้อม

### เกมโหลด guard จาก URL อื่น

- เพิ่ม `requestDomains` ใน rule `9102`
- ตรวจ URL จริงใน DevTools → Network
- ถ้าเป็น CDN คนละโดเมน ต้องเพิ่ม domain นั้น
