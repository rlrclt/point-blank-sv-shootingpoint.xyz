# Offsets / runtime values — pbmobile-th.online build

อ้างอิงจาก `pbrecon/` (ชุดไฟล์ที่แยกจาก build จริง) และโค้ดที่ `esp.js` ใช้อยู่
ตัวเลขบางค่าอาจเปลี่ยนหลังเกมอัปเดต — ตรวจซ้ำด้วย `pbrecon` หรือ DevTools

---

## 1) สะพาน runtime

| global | คืออะไร | ใช้ใน esp.js |
|---|---|---|
| `window.__pb` | ออบเจ็กต์เกม (player, scene, world, weapons…) | ทุกฟีเจอร์ |
| `window.__pbR` | renderer (มี `.render(scene, camera)`) | hook เพื่อ tick ต่อเฟรม |
| `pb.scene` | `THREE.Scene` หลัก | ESP / LOS |
| `pb.camera` | กล้องหลัก | projection |
| `pb.player` | ตัวควบคุมผู้เล่น local | aim / recoil / swap |
| `pb.me` | actor ของตัวเอง (state) | team / alive |
| `pb.actors()` | รายชื่อ actor ทั้งหมด | aim / ESP |
| `pb.remotes` | `Map` ของผู้เล่น远端 | fallback actors |
| `pb.bots` | รายชื่อบอท | fallback actors |
| `pb.world` | Rapier world | raycast กำแพง |
| `pb.R` | โมดูล Rapier (`Ray`, `ColliderDesc`…) | raycast |
| `pb.notGlass` | filter group สำหรับ ray (ตัดกระจก) | raycast |
| `pb.weapons` | ระบบอาวุธ (มี `.ws`) | fast swap |
| `pb.room` | room/session | mobile spoof |
| `pb.frameNo` | เลขเฟรม | กัน tick ซ้ำ |

---

## 2) Player / actor

```
actor.obj          Group "chara" (bone อยู่ข้างใน)
actor.meshes       Map<slot, mesh>
actor.mover        mover (ดู §3)
actor.yaw/pitch    มุมมอง (radian)
actor.hp           100 ปกติ
actor.dead/alive   สถานะ
actor.team         0 = TR / 1 = CT (ตาม build)
actor.crouch       กำลังย่อตัว
actor.eye          ความสูงตา (ถ้ามี)
actor.weapon       อาวุธปัจจุบัน (ดู §4)
actor.weaponName   ชื่ออาวุธ
actor.id / name
actor.isBot / remote / netDelay
```

---

## 3) Mover (`actor.mover`)

| field | ความหมาย |
|---|---|
| `pos` | ตำแหน่งเท้า (Vector3-like: `.x/.y/.z`) |
| `vy` | ความเร็วแนวตั้ง |
| `onGround` | แตะพื้น |
| `crouch` | กำลังย่อ |
| `height` | ความสูงตัวปัจจุบัน (~1.515) |
| `vel` | ความเร็วแนวราบ |
| `max` | ความเร็วสูงสุดที่อนุญาต |
| `standT` / `landT` | เวลายืน/ลงพื้น |
| `local` | ข้อมูล local-space |

`feet.y` = `pos.y`; จุดตาประมาณ `pos.y + eyeHeightStand`

---

## 4) Weapon definition (`slots[i].def` / `actor.weapon`)

field สำคัญ:

```
id, item, name, model, slot, cls, anim
mag, reserve, auto, pellets, burst, burstDelay
damage, delay, range, dpd, camSync, zoomFov, fov1, fov2
reloadTime, reloadLen, bolt, pump, shell, magReady
sniper, scopeZoom, subScope, scope, scopeLevels
rec (recoil), mv (movement), ch, tracer, fireEffect, classId
```

- `damage` = ดาเมจต่อนัด (ฐาน)
- `delay` = ระยะห่างการยิง (วินาที)
- `camSync` = ตัวคูณ recoil ที่กล้องเห็น
- `reloadTime` = เวลา reload ของอาวุธนั้น

---

## 5) Weapon system (`pb.weapons` หรือ `pb.weapons.ws`)

| field / method | ความหมาย |
|---|---|
| `slots[]` | อาวุธที่ถือ (สูงสุด 5) |
| `cur` | index อาวุธปัจจุบัน |
| `switchTimer` | **เวลาที่เหลือของการเปลี่ยนปืน (วินาที)** |
| `switchTotal` | เวลาเต็มของ change animation |
| `startChange(def)` | เริ่มเปลี่ยนปืน → เซ็ต `switchTotal/switchTimer` |
| `switchTo(i)` | สลับช่อง |
| `changeTimeOf(def)` | เวลาเปลี่ยนปืนของอาวุธ |
| `reloadTimeOf(def)` | เวลา reload ของอาวุธ |
| `reloading`, `reloadTimer`, `reloadTime`, `reloadDuration` | สถานะ reload |
| `itemFx` | effect/สกิลที่ลดเวลา (`quickChangeWeapon`, `quickChangeReload`) |
| `drawInput`, `triggerLatched` | input lock ระหว่างเปลี่ยน |

**fast swap ที่ esp.js ทำ**
```js
if (ws.switchTimer > swapMs/1000) {
  ws.switchTimer = swapMs/1000;
  ws.switchTotal = Math.min(ws.switchTotal, swapMs/1000);
}
```
ไม่แตะ `changeTimeOf` หรือ stat ใด ๆ — แค่ย่อเวลาที่เหลือตอนกำลังเปลี่ยน

---

## 6) Stat / upgrade (avatarCombat-Cn0Sf-BG.js)

สามชื่อนี้เป็น **ค่าโบนัสจากไอเทม/ตัวละคร** ไม่ใช่ตัวจับเวลาเอง
(ชื่อ `reloadTime` ชนกับ `reloadTime` ของ weapon system ที่เป็น "วินาที" — ระวัง)

field สะสมในออบเจ็กต์โบนัส (`Qn()`):
```
reloadTime     // โบนัสลดเวลา reload (สัดส่วน 0..1)
quickChange    // "ธง" ว่ามีไอเทมที่เปิดโบนัสเปลี่ยนปืนหรือยัง (>0 = เปิด)
swapTime       // โบนัสลดเวลาเปลี่ยนปืน (สัดส่วน 0..1)
fastReload{}   // โบนัส reload แยกตาม family ของปืน
```
event ที่บวกค่า:
```
WeaponReloadTime -> reloadTime += u
WeaponSwapTime   -> swapTime   += u
QuickChangeWeapon-> quickChange += u
```

สูตรจริง:
```js
// reload ต่อ family (On)
reloadMul[family] = max(0.1, 1 - reloadTime)          // เร็วสุด 10x
// swap (Mn)
swapMul = quickChange > 0 ? max(0.1, 1 - swapTime) : 1
// รวมกับ beret
changeMul = max(1/2.3, (beretQuickChange ? 1/1.50002 : 1) * swapMul)
reloadMulF = (beretQuickReload ? 1/1.25 : 1) * (reloadMul[family] ?? 1)
```

ความหมายสั้น ๆ:
- **`swapTime`** = ยิ่งมาก เปลี่ยนปืนยิ่งเร็ว (1.0 = เร็วสุด 10 เท่า, แต่ติดเพดาน `max(0.1, …)`)
- **`quickChange`** = ประตู: ถ้า 0 → `swapTime` ไม่ถูกใช้เลย (ตัวคูณ = 1)
- **`reloadTime`** = ลดเวลา reload (ใช้กับ family ที่อยู่ใน `fastReload`)

ของจริงที่เดินเวลา:
```
weapon system: switchTimer / switchTotal   (เปลี่ยนปืน)
weapon system: reloadTimer / reloadDuration (reload)
```
`esp.js` fast swap ย่อ `switchTimer` ตรง ๆ จึงไม่ต้องยุ่งกับค่าโบนัสพวกนี้

### ถ้าจะทำฟีเจอร์สาย stat (ไม่ต้องใส่ออบเจ็กต์)

ค่าโบนัสถูกประกอบใหม่ทุกครั้งที่เปลี่ยนตัวละคร/ไอเทม (`setPartAbilities` ถูกเรียกซ้ำ)
จึงเขียนทับได้ที่ **instance** — แต่ต้อง re-apply หลังเปลี่ยนอุปกรณ์/เกิดใหม่

ตำแหน่งจริง:
```
pb.weapons.ws.abilities   // ออบเจ็กต์โบนัส (อาจเป็น null)
pb.weapons.ws.itemFx      // effect legacy (quickChangeWeapon, beretQuickChange, ...)
```

```js
function applyBonus(ws, v) {           // v = 0..0.9
  const a = ws.abilities;
  if (a) {
    a.quickChange = 1;                 // ต้อง > 0 ไม่งั้น swapTime ไม่มีผล
    a.swapTime = v;
    a.reloadTime = v;                  // มีผลเฉพาะ family ใน a.fastReload
    if (a.fastReload) for (const k of Object.keys(a.fastReload)) a.fastReload[k] = 1;
  }
  if (ws.itemFx) {                     // ทาง legacy (abilities = null)
    ws.itemFx.quickChangeWeapon = 1;
    ws.itemFx.quickChangeReload = 1;
    ws.itemFx.beretQuickChange = 1;
    ws.itemFx.beretFastReload = 1;
  }
}
```

ข้อควรระวัง:
- `abilities` ถูกแทนที่เมื่อเปลี่ยนอุปกรณ์ → ต้องเรียกซ้ำ (ทุกเฟรม/หลัง event)
- `fastReload` ว่าง = ไม่มี reload bonus แม้ตั้ง `reloadTime` (เพราะ `On()` วนเฉพาะ key ที่มี)
- **อย่า** แก้ `q` / `ci` (ค่าคงที่เกมถูก freeze + hash → `const-tamper`)
- ทางที่เสถียรกว่า stat: clamp `switchTimer` / `reloadTimer` ตรง ๆ

> ฟีเจอร์จริงใน `esp.js` v1.10: **Stat Bonus (ไม่ต้องมีไอเทม)** — เขียน `abilities.quickChange/swapTime/reloadTime` + `itemFx` ทุกเฟรม
> เปิดที่เมนู AIM → `โบนัส Reload/Swap` (สไลเดอร์ / ช่องเลข / RESET 0.50)
>
> v1.11 เพิ่ม **โปรไฟล์ไอเท็ม**: อ่าน `PC_EQUIP` จาก `avatarData-*.json` ที่หน้าโหลดอยู่แล้ว
> (ผ่าน `performance.getEntriesByType("resource")`) แล้วเลือกไอเท็ม → ใช้ค่า `WeaponSwapTime` / `WeaponReloadTime` / `QuickChangeWeapon` / `FastReload_*` ของไอเท็มนั้นตรง ๆ
> พร้อมอ่านค่าตัวคูณที่จะได้ (swap ×… / reload ×…)
>
> v1.12 แยกโปรไฟล์เป็น **สับไว (swap)** และ **รีโหลดไว (reload)** คนละ dropdown
> และเปลี่ยน GUI เป็นแท็บ `CORE / AIM / WEAPON / ESP` สไตล์ minimal-tech (มุมเหลี่ยม, เส้น 1px, accent ทอง)

---

## 7) ดาเมจ (`pbConfig-BTAdk4SQ.js`)

```js
hp: 100
damageRate: { head: 35, body: 1.2, arm: 0.8, hand: 0.6, leg: 0.8, foot: 0.6 }
```
`head: 35` คือตัวคูณของดาเมจฐาน → ใช้คำนวณ TTK ได้

---

## 8) Movement / camera (`config-TO6a17NM.js`)

```js
walkSpeed 2.6 · runSpeed 4.5 · crouchSpeed 1.4
gravity 9.8*1.8 · jumpHeight 1.1
eyeHeightStand 1.7 · eyeHeightCrouch 1.0
capsuleRadius 0.39 · capsuleHalfHeight 0.325
maxStepHeight 0.4 · maxSlopeClimbDeg 45
mouseSensitivity 0.0022
```

กล้อง (`pbConfig`):
```js
fov 70 · fovMin 35 · fovMax 80 · near 0.1 · far 300 · zoomTime 0.15
```

> หมายเหตุ: `pbmobile.app` (อีก build) ใช้ `G.CFG.eye = 1.648`, `eyeCrouch = 1.101`
> อย่าเอาไปใช้กับ build นี้ตรง ๆ — ให้อ่านจาก `MovementConfig` หรือวัดจาก `mover`

---

## 9) Collision / raycast

`main-C4LWX42H.js` import จาก `collisionGroups-DWLcmsjy.js`:

| alias | ใช้ทำอะไร |
|---|---|
| `eh` (A) | collision group ของตัวละคร |
| `Pt` (W) | filter group ของ ray (sight) |
| `sh` (M) | filter group ของ ray อีกชุด |
| `Ua` (H) | group ของ props |
| `Up` | 257 (ใช้เช็ค `collisionGroups >>> 16`) |

ray ที่เกมใช้:
```js
world.castRay(ray, maxToi, solid, filterFlags, filterGroups, filterExcludeCollider)
world.castRayAndGetNormal(...)
```
`esp.js` ใช้ `pb.world.castRay(..., pb.player.collider, undefined, pb.notGlass)`

---

## 10) ฟิลด์ที่ ESP ใช้

| ฟังก์ชัน | field |
|---|---|
| `posOfActor` | `mover.pos` / `obj.position` / `root.position` |
| `actorVisualRoot` | `obj` / `visualRoot` / `mesh` / `root` |
| bone | `skeleton.bones`, ชื่อ `Root/Pelvis/Spine1-3/Neck/Head/...` |
| team | `a.team` |
| hp | `a.hp` |
| dead | `a.dead` / `!a.alive` |
| hitbox | `actor.hb` (ถ้ามี) / bone lookup |
