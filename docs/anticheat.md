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
| NoRecoil | hook instance `pb.player.addRecoil`, zero `recoilPitch` | ไม่ติด native check |
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
