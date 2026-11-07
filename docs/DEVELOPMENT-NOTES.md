# บันทึกการพัฒนา — รอบ aim/ESP + mobile bypass

> บันทึกวิธีทำงาน: ใช้เครื่องมืออะไร, หลักการอะไร, เจอปัญหาอะไร และแก้ยังไง
> ช่วง: 2026-11-03 → 2026-11-05 · `esp.js` v1.8 → v1.24 · extension 2.1.0 → 2.6.0

---

## 1. ภาพรวมงานรอบนี้

| ลำดับ | งาน | ผล |
|---|---|---|
| 1 | แก้จุดเล็ง aimbot ให้ตามโครง + Smart Zone | `esp.js` v1.9 |
| 2 | ปลดล็อกค้าง / ไม่ยิงทะลุกำแพง | v2.0 |
| 3 | เปลี่ยนโดเมน + mobile bypass | 2.4.0 |
| 4 | ตามหา "ทำไมยังขึ้น PC" | 2.5.0 → 2.6.0 |
| 5 | เอกสาร | `docs/` |

---

## 2. เครื่องมือที่ใช้

### 2.1 อ่านโค้ดในเครื่อง

| เครื่องมือ | ใช้ทำอะไร | ตัวอย่าง |
|---|---|---|
| `read` | อ่านไฟล์แบบมีเลขบรรทัด | อ่าน `esp.js` ทีละช่วง |
| `grep` / `Select-String` | หา symbol ทั้งโปรเจกต์ | หา `MODE_ZONES`, `isTrusted`, `setLocalDevice` |
| `glob` / `Get-ChildItem` | ดูโครงไฟล์ | `docs/`, `pbrecon/` |
| `shell` | `node --check`, `git diff`, JSON parse | ตรวจ syntax ก่อนส่งทุกครั้ง |

### 2.2 ดึง bundle สดจากเว็บ (สำคัญที่สุดรอบนี้)

`pbrecon/` เป็น snapshot เก่า — ใช้ได้แค่บอกโครง แต่ **ค่าจริงต้องดึงสด**

ใช้ `execute` + `fetch` (ไม่ต้องเปิดเบราว์เซอร์):

```js
// 1) bootstrap บอกชื่อ chunk ทั้งหมด
const idx = await (await fetch("https://shootingpoint.xyz/bundle/index-5Gb5fZlZ.js")).text();
const paths = [...new Set([...idx.matchAll(/bundle\/[\w.-]+\.js/g)].map(x => x[0]))];

// 2) ดึงเฉพาะไฟล์ที่สงสัย แล้ว grep ในหน่วยความจำ
const t = await (await fetch("https://shootingpoint.xyz/bundle/roomInputDevice-CcHtAxSP.js")).text();
const i = t.indexOf("reportPcInput");
t.slice(i - 2600, i + 2600);
```

ข้อดี: ไม่ต้องโหลดทั้งเกม, ไม่ต้องรันเกม, ได้ source จริง 100%
ข้อควรระวัง: ต้องดึง **ชื่อไฟล์จาก bootstrap ปัจจุบัน** ทุกครั้ง เพราะ hash เปลี่ยนทุก deploy

### 2.3 อ้างโปรเจกต์พี่น้อง

`C:\Users\YoruDekD\Desktop\pbmobileapp\pbmobile-ext`

| ไฟล์ | เอามาอะไร |
|---|---|
| `bg.js` | โครง dynamic DNR rule (UA / sec-ch-ua) + การรายงานผลลง `chrome.storage.local` |
| `inject.js` | periph guard (กรอง listener ตาม source), AC map, บทเรียน `?touch=1` |

**หลัก:** โปรเจกต์ที่แก้ปัญหาชนิดเดียวกันมาก่อน = แหล่งอ้างอิงที่ดีกว่าการเดา
แต่ต้อง **ตรวจว่าใช้กับ build นี้ได้จริง** (เช่น `plat` ทาง JSON ไม่มีใน `shootingpoint.xyz`)

### 2.4 Harness (node vm)

ทดสอบ logic ก่อนโหลดลง Chrome โดยไม่ต้องเข้าเกม

**`spoof_harness.js`** — จำลอง `navigator`, `Storage`, `document`, `MutationObserver`
```bash
node C:\Users\YoruDekD\AppData\Local\Temp\opencode\spoof_harness.js
```
ตรวจ: UA/platform/touch, matchMedia, periph guard ทิ้ง listener, `isTrusted`, `__pbMobileState()`

**`esp_harness.js`** — จำลอง `pb`, `camera`, actor + hitboxDefs 5 โซน, `world.castRay`
```bash
node C:\Users\YoruDekD\AppData\Local\Temp\opencode\esp_harness.js
```
ตรวจ: เลือกจุดไหน ทำไม, smart zone fallback, lock/release, ESP วาดโดยไม่ throw

> harness ใช้ `vm.runInContext` กับโค้ดจริงจากไฟล์ — ไม่ใช่ copy
> ถ้าแก้ไฟล์แล้ว harness ไม่พัง แปลว่าไฟล์ยังโหลดได้จริง

---

## 3. หลักการที่ใช้ตัดสินใจ

### 3.1 Source of truth = โค้ดที่ ship จริง

ไม่เดาจากชื่อฟังก์ชันหรือจาก snapshot เก่า
ตัวอย่างที่พิสูจน์หลักนี้:

- คิดว่า bullet ออกจากตา → เปิด `aimRay()` เจอ `camera.getWorldPosition()`
  → LOS ต้องยิงจากกล้อง ไม่ใช่ `eyePosition`
- คิดว่า `occluded` อยู่บน actor → เปิด `gateVisual()` เจอ `t.occluded` บน visual record

### 3.2 อ่าน engine ก่อนออกแบบ

```
เกมทำยังไง → เราทำตามแบบเดียวกัน → ผลตรงกันโดยธรรมชาติ
```

hitbox center, raycast flags, occlusion test — ทั้งหมด mirror มาจาก `main-*.js`

### 3.3 Instance state > prototype patch

AC ตรวจ native พวกนี้:

```
WebGL.*, Canvas2D.*, requestAnimationFrame, WebSocket.prototype.send,
Function.prototype.toString, Storage.getItem, WeakMap/Map,
Object.defineProperty, WebGL.getParameter
```

⇒ เลี่ยงการแทนที่ทุกตัวข้างบน
- patch `input.takeUntrusted` (instance) ✅
- patch `Storage.prototype.getItem` ❌ (ถอดออก)

### 3.4 Fail-closed เฉพาะที่ควร

- จุดที่ตรวจไม่ได้ (`null`) → ยอมรับเพื่อไม่ให้ aimbot ตายทั้งกระดาน
- จุดที่รู้ว่าโดนบัง (`false`) → ไม่ยิง
- โหมด Smart Zone ปิด = โซนเดียวเท่านั้น โดนบัง = ไม่ยิง

### 3.5 แยกชั้น ไม่รวมศูนย์

mobile bypass มี 4 ชั้นอิสระ (navigator / periph / input counter / headers)
ชั้นหนึ่งพัง อีกสามชั้นยังทำงาน → debug ได้ทีละชั้น

### 3.6 Test ก่อน ship เสมอ

ทุกครั้งที่แก้: `node --check` → harness → ค่อยบอกให้ reload
ไม่มีการส่งโค้ดที่ยังไม่ผ่าน syntax

---

## 4. เคสปัญหา → วินิจฉัย → แก้

### เคส 1: aimbot ล็อกแต่หัว

**อาการ** ล็อกแล้วไปที่หัวอย่างเดียว ไม่ยิงส่วนอื่นแม้หัวจะอยู่ไกล crosshair

**วินิจฉัย**
```js
// esp.js (เดิม)
const MODE_ZONES = { head: ["head","body","arm","hand","leg","foot"], ... };
rank = zr * 10 + br;                    // โซนคือตัวตัดสิน
arr.sort((A,B) => (A.rank-B.rank) || (A.ang-B.ang));   // มุมเป็นแค่ tie-break
```
โซนหัว rank 0 เสมอ → มุมไม่มีสิทธิ์ชนะ

**แก้** เปลี่ยนเป็นคะแนนเดียว `angle + zonePenalty + ZONE_TIE`
→ `Bone = Auto` = ตามโครงล้วน, `Zone bias` คุมว่าโซนที่เลือกได้เปรียบกี่องศา

**บทเรียน** ลำดับความสำคัญแบบ lexicographic (rank ก่อน ang) ทำให้ตัวแปรที่สองไม่มีความหมาย

---

### เคส 2: ล็อกทะลุกำแพง

**อาการ** ศัตรูอยู่หลังกำแพงแต่ยังล็อก

**วินิจฉัย**
1. `maxToi = dist - 0.4` → กำแพงที่อยู่ชิดจุดเล็งไม่ถูกยิง
2. hitbox ของเป้าเป็น **sensor collider** → ray ชนแล้วรายงานว่าบัง/ไม่บังผิด
3. `pointVisible` คืน `null` แล้วโค้ดเดิมยอมรับทันที

**แก้**
```js
const flags = QueryFilterFlags.EXCLUDE_SENSORS;   // 1
const maxToi = dist - 0.05;                       // 2
const near   = dist - 0.35;                       // 2
return hit ? (toi < near) : false;
```
```js
// 3: null = ตรวจไม่ได้ → ยอมเฉพาะเมื่อเกมไม่ยืนยันว่าโดนบัง
function aimPointOk(a, vis){
  if (vis === false) return false;
  if (actorOccluded(a) === true) return false;
  return true;
}
```

**บทเรียน** `toi > 0.5` ตัดสินผิดทิศ — กำแพงใกล้กล้องกลับถือว่าโล่ง

---

### เคส 3: หันหนีแล้วกล้องถูกดึงกลับ

**อาการ** หมุนไปทางอื่น กล้องหันกลับไปหาเป่าเดิม

**วินิจฉัย**
```js
const lockFov = fovRad * 1.25;   // bot mode FOV 180 → 225°
```
เป้าไม่มีวันหลุดกรอบ lock และ `findBestTarget` สแกน 180° ทั้งหน้า

**แก้** 3 กลไก
1. `acqFov = min(aimFov, aimHoldCone)` — hold cone default 30°
2. flick release: จำ `yaw/pitch` ที่ควรเป็นหลัง `addLook` แล้วเทียบเฟรมถัดไป
   ถ้าคลาด > `aimReleaseDeg` (3°/เฟรม) = ผู้เล่นขยับเอง → ปล่อย 300ms
3. ระหว่าง cooldown ยังวัดการขยับต่อ → ขยับเรื่อย ๆ = ต่อเวลาเรื่อย ๆ

**บทเรียน** hysteresis ต้องมี **ขอบเขต** ไม่ใช่ตัวคูณของค่าที่ผู้ใช้ตั้งเป็น 180

---

### เคส 4: ESP กระตุก / กล่องไม่ตรงตัว

**วินิจฉัย**
- `drawSkeleton()` อ่าน `bone.matrixWorld` โดยไม่ update → ตามหลัง 1 เฟรม
- `drawOnce()` อ่าน `a.crouch` (property) แต่เกมมี `isCrouching()` → หมอบแล้วกล่องสูงเท่ายืน

**แก้** `root.updateWorldMatrix(true, true)` ก่อนอ่าน + helper `isCrouching()` กลาง

---

### เคส 5: ยังขึ้นว่าเป็น PC (4 ชั้น)

ไล่ทีละชั้นด้วยการอ่าน bundle ไม่ใช่เดา

| ชั้น | เจออะไร | แก้ |
|---|---|---|
| 1 | `deviceProfile.i(navigator)` | spoof UA/platform/touch/UA-CH |
| 2 | `roomInputDevice`: `B()` → `setLocalDevice(pc)` เมื่อเจอ mouse/key จริง | periph guard + isTrusted |
| 3 | `input.takeUntrusted()` รายงาน `input-synthetic` | override ให้คืน `{}` |
| 4 | HTTP header ยังเป็น Windows | `bg.js` DNR |

**จุดพลิก:** อ่าน `roomInputDevice-*.js` เจอ
```js
const o = e => { if (j() !== y.pc && lt(e)) B(); };
document.addEventListener("pointermove", o, { capture: true });
```
และ `lt(e)` = `e.isTrusted && e.pointerType === "mouse" && (movementX||movementY)`

**บทเรียน** "client spoof ครบแล้วแต่ยังไม่ผ่าน" = มีชั้นที่ JS มองไม่เห็น (header / wire / detector)

---

### เคส 6: bug ที่เจอเพราะ harness (ไม่ใช่เพราะอ่านโค้ด)

ตอนแก้ `pointVisible` ให้ยิงจากกล้องอย่างเดียว เขียนเป็น:

```js
return rayBlocked(...);   // rayBlocked: true = บัง
```

harness ฟ้องทันที: ทุกจุด `visible=false` ทั้งที่ raycast คืน "โล่ง"

**แก้**
```js
const blocked = rayBlocked(...);
if (blocked === null) return null;
return blocked === false;    // กลับด้าน
```

**บทเรียน** ฟังก์ชันที่คืน boolean เชิงลบ (`blocked`) อย่าใช้แทน (`visible`) ตรง ๆ
คอมเมนต์หัวฟังก์ชันช่วยได้: `// true = ถูกกำแพงบัง | false = โล่ง | null = ตรวจไม่ได้`

---

### เคส 7: static DNR → dynamic DNR

**อาการ** ใส่ `rules.json` แล้วไม่รู้ว่า rule ทำงานหรือเปล่า

**แก้** ย้ายไป `bg.js`
```js
chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds:[9101], addRules:[RULE] }, cb)
chrome.declarativeNetRequest.getDynamicRules(rules => report(rules.some(r => r.id === 9101)))
```
รายงานผลลง `chrome.storage.local` → เห็นใน service worker console

**บทเรียน** กฎที่ "น่าจะทำงาน" ต้องมีทางยืนยัน ไม่งั้น debug ไม่ได้

---

### เคส 8: patch ที่เสี่ยงเกิน

**สิ่งที่ทำไปแล้วถอดออก** — patch `Storage.prototype.setItem/getItem`

เหตุผล: AC ตรวจ `Storage.getItem` และการล็อค `pb.room.pcInput.v1` ไม่จำเป็น
เมื่อ periph guard ตัด detector ตั้งแต่ต้นทาง (ไม่มีใครเขียนค่านั้นอีก)

**บทเรียน** แก้ที่ "คนเขียน" ดีกว่าแก้ที่ "ที่เก็บ" — และเลี่ยง native ที่ AC fingerprint

---

## 5. โครง harness (ถ้าจะเขียนใหม่)

```js
const vm = require("vm"), fs = require("fs");
const code = fs.readFileSync(".../esp.js", "utf8");

// 1) fake DOM/window ให้ครบเท่าที่โค้ดแตะ
// 2) fake เกม: pb, player, camera, world.castRay, actors
// 3) runInContext(code, sandbox)
// 4) เรียก hook ที่โค้ดติดตั้ง (R.render) แล้ววัดผล
```

จุดที่ต้องมีสำหรับ `esp.js`:
- `document.createElement("canvas").getContext("2d")` → Proxy คืน no-op
- `window.__pbR.render` → hook ถูก patch
- `pb.frameNo` ต้องเพิ่มทุกเฟรม ไม่งั้น aim tick ถูก guard บล็อก
- `world.castRay(ray, maxToi)` คืน `{timeOfImpact}` หรือ `null`
- `performance.now` แทนได้ → ใช้ทดสอบ cooldown

จุดที่ต้องมีสำหรับ `mobile-spoof.js`:
- `Storage` class (มี prototype จริง)
- `navigator` เป็น object ธรรมดา
- `document.addEventListener` เก็บ listener ไว้ตรวจว่า guard กรองถูก
- `MutationObserver`, `matchMedia`, `URL`

---

## 6. Checklist ก่อนส่งงาน

```
[ ] node --check ไฟล์ที่แก้ทุกไฟล์
[ ] JSON.parse manifest / rules
[ ] harness ผ่าน (ถ้าแตะ logic)
[ ] อัปเดต VERSION + manifest.version
[ ] git diff --stat ดูว่าแตะไฟล์อะไรบ้าง
[ ] เขียนใน docs ว่าอะไรเปลี่ยน ทำไม
```

คำสั่งที่ใช้จริง:

```powershell
node --check esp.js
node --check mobile-spoof.js
node --check bg.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
git diff --stat
```

---

## 7. ข้อห้าม / บทเรียน

1. **อย่าเดา bundle** — hash เปลี่ยนทุก deploy ดึงสดทุกครั้ง
2. **อย่า patch prototype ของ native ที่ AC ตรวจ** — ใช้ instance ถ้าจำเป็น
3. **อย่าใช้ `?touch=1`** กับคลienต์นี้ — เข้าโหมด touch UI แล้วเมาส์เดินไม่ได้
4. **อย่าตรวจ LOS จากตา** — เกมยิงจากกล้อง
5. **อย่าให้ `null` กลายเป็น `false` เงียบ ๆ** — ระบุ semantics ให้ชัดในคอมเมนต์
6. **อย่าแก้ที่ที่เก็บ ก่อนแก้ที่คนเขียน** (Storage vs periph guard)
7. **อย่าส่งงานที่ยังไม่ผ่าน harness** — บั๊ก inverted boolean เจอด้วย harness ไม่ใช่ด้วยตา

---

## 8. ไฟล์อ้างอิง

| ไฟล์ | บทบาท |
|---|---|
| `esp.js` | aim / ESP / visibility |
| `mobile-spoof.js` | navigator spoof + periph guard |
| `bg.js` | DNR headers |
| `docs/MOBILE-BYPASS.md` | รายละเอียด bypass |
| `docs/AIM-AND-ESP.md` | รายละเอียดจุดเล็ง |
| `pbrecon/` | bundle เก่า (โครงอ้างอิง) |
| `pbmobileapp/pbmobile-ext/` | โปรเจกต์พี่น้อง (วิธีที่พิสูจน์แล้ว) |
