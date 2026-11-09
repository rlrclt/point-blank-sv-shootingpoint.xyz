# Anti-cheat — pbmobile-th.online build

ทั้งหมดนี้อ่านจาก `pbrecon/main-C4LWX42H.js` (static analysis ของ bundle ที่ ship จริง)
เป็นการวิเคราะห์โค้ด ไม่ใช่การยืนยันพฤติกรรมฝั่งเซิร์ฟเวอร์

---

## 1) ภาพรวม

AC ทำงานเป็นคลาส `jb` (probe/clock) และรายงานผ่าน `Wb()`:

- `console.warn("[anti-cheat] <kind>: <detail>")`
- ส่ง packet **`9007`** (`Pb = 9007`) ผ่าน connection พร้อม kind/detail

ตรวจทุก **250 ms** (`ge = 250`) เฉพาะตอนอยู่ในแมตช์และหน้าต่างยัง visible

---

## 2) Native check — `Hb()`

ไล่ตรวจว่า function ยังเป็น native (`/\[native code\]/`) หรือถูกแทน:

**WebGL / WebGL2 prototype**
```
drawArrays, drawElements, drawArraysInstanced, drawElementsInstanced,
uniformMatrix4fv, uniform3fv, depthFunc, depthMask,
enable, disable, useProgram, shaderSource, getParameter,
readPixels, bufferData, texImage2D
```

**อื่น ๆ**
```
WebSocket.prototype.send
EventTarget.prototype.dispatchEvent
MouseEvent, PointerEvent (constructor)
requestAnimationFrame
performance.now
Element.prototype.requestPointerLock
EventTarget.prototype.addEventListener
WebSocket (constructor)
Function.prototype.toString
```

**parent scope** (iframe/parent) — ตรวจ `ws.send` และ `WebSocket` ของ parent ด้วย

รายงานเป็น `gl-hook` ทุก **10 วินาที** (`Db = 10000`) พร้อมรายชื่อที่ถูก patch

> **ผลกับเรา**: `esp.js` patch แค่ **instance** (`pb.player.addRecoil`, `__pbR.render`)
> ไม่แตะ prototype ในรายการ → ไม่ติด `gl-hook`

---

## 3) Clock / time tamper — `Ub` + `Vb`

สร้าง Worker เล็ก ๆ (`onmessage → postMessage(performance.now())`) แล้วเทียบ:

- `page perf.now` vs `worker perf.now`
- `Date.now` vs worker time
- คลาดเคลื่อน > **15%** (`Ob = 0.15`) ติดกัน **2 ครั้ง** (`Tl = 2`) ภายใน 10 วิ (`qe = 10000`)
  → รายงาน `time-tamper`

> อย่า patch `performance.now` / `Date.now` / `requestAnimationFrame` — ทั้ง native check และ clock check จับ

---

## 4) Gameplay checks — `jb.tick()`

| kind | เงื่อนไข | ค่า |
|---|---|---|
| `input-synthetic` | event ที่ `isTrusted === false` สะสม ≥ 5 | `Bb = 5` |
| `const-tamper` | `JSON.stringify([q, ci])` เปลี่ยนจาก baseline (ค่าคงที่ถูก freeze) | `Fr()` |
| `hp-tamper` | `maxHp` เปลี่ยน หรือ `hp > maxHp + 1` ติด 2 ครั้ง | `zb = 1` |
| `speed-tamper` | ความเร็ว > `run.front * 1.6` ติด 4 ครั้ง | `Or = 6.5*1.6 = 10.4 m/s`, `zr = 4` |
| `gl-depth` | `DEPTH_TEST` เปิด + `DEPTH_FUNC === ALWAYS` ติด 8 ครั้ง | `Br = 8` |
| `gl-hook` | พบ native ที่ถูกแทน (ตาม §2) | ทุก 10 วิ |

**`const-tamper` สำคัญมาก**: เกมเรียก `$b()` เพื่อ `Object.freeze` ค่าคงที่ `q` (movement/damage) และ `ci`
ถ้าเขียนทับค่าพวกนี้ → ตรวจเจอทันที
(ของเราแก้แค่ instance state เช่น `switchTimer`, `recoilPitch`, `camera.rotation` ชั่วคราว → ไม่แตะ)

---

## 5) สิ่งที่ esp.js ทำ และความเสี่ยง

| ฟีเจอร์ | แตะอะไร | ความเสี่ยง |
|---|---|---|
| ESP overlay | canvas ใน closed shadow root | ต่ำ (ไม่อยู่ใน DOM ที่ AC สแกน) |
| Aimbot | `pb.player.addLook`, `updateCamera`, `yaw/pitch` | ไม่ติด native check; เสี่ยงเชิงพฤติกรรม (hit-rate) |
| NoRecoil | hook instance `pb.player.addRecoil`, zero `recoilPitch`; ESM compensation ใช้ `player.addLook()` (ไม่ dispatch event) | ไม่ติด native check / ไม่ติด `input-synthetic` |
| Recoil compensation | `pb.player.addLook()` + ตัวคูณจากสไลเดอร์ CORE (`nrComp`) | เป็น API เดียวกับ mouse input; ไม่มี synthetic event |
| NoSpread | zero `ws.xhCur` (instance) | ไม่ติด native check |
| Fast swap | `ws.switchTimer/switchTotal` (instance) | ไม่ติด native check |
| Mobile spoof | header/localStorage/URL | ขึ้นกับ server-side |
| Humanize | `camera.rotation` ชั่วคราวใน `render` | ไม่ติด native check |

**ข้อห้าม**
- อย่า patch prototype ที่อยู่ใน `Fb` หรือรายการ `Hb`
- อย่า `dispatchEvent` event ปลอม (นับเป็น synthetic input)
- อย่าแก้ `q`, `ci`, `maxHp`, ความเร็วเดิน
- อย่าตั้ง `DEPTH_FUNC = ALWAYS` หรือ `depthTest = false` บน mesh
- อย่า patch `performance.now` / `Date.now` / `rAF`

---

## 5.1) Anti-detection สำหรับ Weapon Spawner / SAFETY (v1.28)

สิ่งที่ `esp.js` ทำเพื่อลดร่องรอย (ไม่ใช่การการันตี):

| มาตรการ | รายละเอียด |
|---|---|
| Safe Mode (default on) | บังคับ spawn cooldown ขั้นต่ำ 1500 ms + โควต้า `spawnMaxPerMin` (default 8) + ข้าม pickup mode แล้วใช้ proxy |
| Spawn cooldown | กันการยิง `equip`/`drop`/`pickup` ถี่เป็นชุด ซึ่งผิดจากพฤติกรรมคนเล่น |
| Proxy consistency | `sendFire` / `sendState` / `sendReload` / `sendHit` ใช้ id เดียวกัน (ปืนเดิมของช่อง) ไม่ปล่อย state ขัดกัน |
| Proxy auto-off | เมื่อ `net.localLoadout[slot]` ตรงกับปืนที่เสกแล้ว จะหยุด proxy เอง (ไม่ส่ง id แปลกซ้ำ) |
| Pickup mode | ใช้เส้นทาง drop→pickUp จริงของเกม; เสี่ยงกว่าถ้าเซิร์ฟเวอร์ตรวจเจ้าของ drop — Safe Mode therefore ปิดให้ |
| Panic (F10) | ปิด ESP/aim/recoil/spread/fast-swap/stat-bonus/spawn/proxy/pickup + ซ่อนแผงทันที (Insert เปิดกลับ) |
| Instance-only hooks | hook `pb.net.*`, `ws.*`, `pb.applyRespawnLoadout` บน instance — ไม่แตะ prototype/native |
| No synthetic input | v1.28 ลบ `document.dispatchEvent(new MouseEvent(...))` ที่เคยใช้ชดเชย recoil; ใช้ `player.addLook()` แทน จึงไม่สะสม `isTrusted === false` |
| No time/hp/speed tamper | ไม่แตะ `performance.now`, `Date.now`, `requestAnimationFrame`, `maxHp`, movement constants |

ข้อควรรู้:
- เซิร์ฟเวอร์ยังตรวจ **พฤติกรรม** ได้ (hit-rate, การยิงทะลุกำแพง, drop/pickup ที่ไม่มีเจ้าของจริง, killfeed ผิดปกติ)
- Pickup mode ส่ง `sendDrop` + `sendPickup` สำหรับไอเทมที่ไม่เคยมีในคลัง — ถ้า server ตรวจ ownership จะเห็นชัดกว่า proxy
- Safe Mode ไม่ได้ปิด aimbot/norecoil ให้; ถ้าจะลดความเสี่ยงสุดให้กด Panic หรือปิดฟีเจอร์ที่มองเห็นได้เอง
- ไม่มีฟีเจอร์ client ไหนกันแบนได้ 100% — ใช้บนเซิร์ฟเวอร์ที่คุณควบคุม/ทดสอบเท่านั้น

---

## 5.2) Live scan — build `index-B9n8Vc50.js` (2026)

สแกน bundle ปัจจุบันของ `shootingpoint.xyz` (crawl จาก `index-B9n8Vc50.js`)

**ตัว AC** = class `Av` + `Tv` (clock worker) ใน `main-*.js`
รายงานผ่าน:

```js
function Sv(kind, detail, flag) {
  console.warn(`[anti-cheat] ${kind}: ${detail}`);
  const conn = chat.connection;      // = room.game.conn
  conn.send(9007, packet);           // pv = 9007
}
```

**Native check (`vv`)** — ตรวจว่า function ยัง `[native code]`:
WebGL methods, `WebSocket.prototype.send`, `EventTarget.prototype.dispatchEvent`,
`MouseEvent`, `PointerEvent`, `requestAnimationFrame`, `performance.now`,
`Element.prototype.requestPointerLock`, `EventTarget.prototype.addEventListener`,
`WebSocket`, `Function.prototype.toString`, parent frame `ws.send` / `WebSocket`

**Gameplay checks (`Av.tick`, ทุก 250 ms):**

| kind | เงื่อนไข |
|---|---|
| `input-synthetic` | `untrusted` events ≥ 5 |
| `time-tamper` | page clock เพี้ยนจาก worker > 15% ติด 2 ครั้งใน 10 วิ |
| `const-tamper` | `JSON.stringify([it, Ai])` เปลี่ยนจาก baseline |
| `hp-tamper` | `maxHp` เปลี่ยน หรือ `hp > maxHp + 1` ติด 2 ครั้ง |
| `speed-tamper` | speed > `run.front * 1.6` (~10.4 m/s) ติด 4 ครั้ง |
| `gl-depth` | `DEPTH_TEST` เปิด + `DEPTH_FUNC === ALWAYS` ติด 8 ครั้ง |
| `gl-hook` | พบ native ที่ถูกแทน (รายการข้างบน) ทุก 10 วิ |

**สิ่งที่ `esp.js` v1.29 ทำเพื่อไม่ให้ทริกเกอร์:**
- ไม่ patch native/prototype ใด ๆ ในรายการข้างบน (hook เฉพาะ instance)
- ลบ synthetic `MouseEvent` แล้ว (ใช้ `player.addLook`)
- ไม่แก้ `performance.now` / `Date.now` / `rAF`
- ไม่แก้ `maxHp` / hp / speed / ค่าคงที่ `it`, `Ai`
- ไม่แตะ `DEPTH_FUNC` / `DEPTH_TEST`
- **AC Shield**: hook `room.game.conn.send` (instance) และทิ้งเฉพาะ opcode `9007`
  → รายงานของ AC ไม่ออกจากเครื่อง (ยังเห็น `console.warn [anti-cheat]` ใน console)
- **Panic on AC**: ถ้าเปิด จะ panic ทันทีที่เห็น warning `[anti-cheat]`
  (เผื่อ AC เวอร์ชันใหม่ส่งรายงานผ่าน path อื่นที่ shield ไม่ได้ดัก)

ข้อจำกัด: การบล็อก 9007 ไม่ได้ทำให้พฤติกรรมดูปกติในสายตาเซิร์ฟเวอร์
ถ้า server ตรวจ hit-rate / drop-pickup / killfeed เอง ก็ยังแบนได้
และถ้า build ใหม่เปลี่ยน opcode/path หรือเพิ่ม check ใหม่ ต้องสแกนซ้ำ

---

> สรุปขั้นตอนรับมือ build นี้แบบละเอียดอยู่ใน
> [`ANTI-CHEAT-UPDATE.md`](./ANTI-CHEAT-UPDATE.md)

## 5.3) Build 2026-11 — guard file hides `window.__pb`

สแกน build ใหม่ (`index-S53k3QNg.js` → `index-DxpkJc0_.js`, 2026-11) พบว่าเกมย้าย logic จำนวนมากไปที่
`pb-guard-De53vzm2.js` → `pb-guard-DbU4Ge0q.js` (obfuscated) และเพิ่มเงื่อนไขใน `main-*.js`:

```js
es && (window.__pb = E, window.__pbR = i)
```

โดย `es` มาจาก guard export `D` (ชื่อภายในเปลี่ยนทุก build):

```js
// De53vzm2
const _0 = h => h === "localhost" || h === "127.0.0.1" || h === "[::1]" ||
                 h === "::1" || h.endsWith(".localhost");
const hn = typeof location !== "undefined" && _0(location.hostname);

// DbU4Ge0q (ปัจจุบัน) — ชื่อตัวแปร/decoder เปลี่ยน แต่เงื่อนไขเดิม
const _e = typeof location !== c(1183) + c(663) && v0(location[c(785) + "me"]);
```

แปลว่า **บนโดเมนจริง (shootingpoint.xyz / trycloudflare) เกมไม่ expose
`window.__pb` / `window.__pbR` อีกต่อไป** — มีเฉพาะตอน hostname เป็น localhost
นี่คือสาเหตุที่เมนูขึ้น `รอเข้าแมตช์` และทุกฟีเจอร์ที่พึ่ง `__pb` ไม่ทำงาน

**วิธีแก้:** DNR rule `9102` redirect `*/bundle/pb-guard-*.js`
ไปที่ `guard-patched.js` (สำเนา guard ที่แก้ host flag เป็น `!0`)
ทำให้ `es === true` และเกม expose `__pb` / `__pbR` ตามปกติ
ตัว guard/AC ยังทำงานเหมือนเดิม (checks + opcode 9007) — เราไม่ได้ปิดทั้ง guard

ข้อควรระวัง:
- `guard-patched.js` ผูกกับ build ปัจจุบัน; ถ้าเกมอัปเดต guard ใหม่ ต้องสร้างไฟล์ใหม่
- export ยังครบ 72 ชื่อเหมือนเดิม แต่ชื่อภายใน/วิธี obfuscate เปลี่ยน
- ถ้าเกมเพิ่ม integrity check กับชื่อ/แฮชของ guard ต้องสแกนและปรับอีกครั้ง
- DNR redirect ต้องมี `guard-patched.js` ใน `web_accessible_resources` และ match ทั้งโดเมนจริง/ tunnel

---

## 6) สิ่งที่ client หลบไม่ได้

- hit-rate / การยิงถูกหลังกำแพง / สถิติผิดปกติ → เซิร์ฟเวอร์ตัดสิน
- รายงานผู้เล่น / ภาพหน้าจอ / replay
- ถ้า AC ฝั่งเซิร์ฟเวอร์อัปเดต การวิเคราะห์นี้ต้องรันใหม่ (ดู `development.md`)

---

## 7) ตรวจซ้ำหลังเกมอัปเดต

1. ดึง bundle ใหม่ (DevTools → Network → `main-*.js`)
2. หา `anti-cheat` / `9007` / `[native code]` / `time-tamper`
3. เทียบรายการ `Fb`, `Hb`, `jb.tick()` กับเอกสารนี้
4. ถ้ามี kind ใหม่ → เพิ่มในตาราง §4 และปรับคำแนะนำ
