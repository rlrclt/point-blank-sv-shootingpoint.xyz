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

### Weapon Spawner (v1.28)

`ws.db` คือ `WeaponDb` ที่โหลด `/assets/cross/weapons/weapons.json` (ปัจจุบัน ~5.7k defs)

| method | ใช้ทำอะไร |
|---|---|
| `db.loaded` | true เมื่อโหลดครบ |
| `db.all()` | คืน def ดิบทั้งหมด (`id`, `name`, `slot`, `slotName`, `family`, …) |
| `db.def(id)` | สร้าง/แคช def เต็มตัว (params, fireMode, …) |
| `db.find(name)` | หา def จากชื่อ |
| `db.defaultLoadout` | `{ primary, secondary, melee, grenade }` |

การเสกอาวุธใน `esp.js`:

```js
const ok = ws.equip(id);          // ใส่ช่องตาม def.slot + จำ id ใน ws.owned
ws.spawnDraw(slot);               // ทางที่เกมใช้ตอน reset — สั่งวาด viewmodel ใหม่
```

หลัง `equip()` ตัว viewmodel อาจยังไม่ mount (ถืออากาศ) จึงมี retry:
ถ้า `viewmodel.rigWeapon/current` ยังว่าง จะรอโหลด ~1.2 s แล้วเรียก
`viewmodel.setWeapon(def)` ซ้ำ (สูงสุด 2 ครั้ง) โดยไม่ต้องสลับมีด
ถ้า `spawnDraw()` ถูกข้ามและยังไม่มีการเรียก `setWeapon` (token ไม่เปลี่ยน)
จะ retry ทันที

**เกิดใหม่:**

| สวิตช์ sync | สิ่งที่เกิดขึ้น |
|---|---|
| เปิด | เก็บ `spawnSynced` = ชุดปัจจุบัน → เขียน `respawnMenu.sel.equipped/pending` + `ws.owned` + `net.setRespawnWeapons([{itemId,objectId} ×5])` และ wrap `applyRespawnLoadout()` ให้ `equip()` ชุดนั้นซ้ำ → เกิดใหม่ถือกระบอกที่เสก |
| ปิด | เก็บ id เดิมของช่องนั้น (`spawnPrev`) แล้วคืนให้ `ws.owned` ก่อน `ws.refill()` → อาวุธที่เสกอยู่แค่ชีวิตนั้น |

`applyRespawnLoadout()` ของเกมอ่าน `respawnMenu.sel` **ก่อน** `ws.reset()`/`refill()`
ดังนั้นการแก้แค่ `ws.owned` อย่างเดียวไม่พอ — ต้องอัปเดต `sel`/wrap ฟังก์ชันด้วย
(ฝั่ง host/เซิร์ฟเวอร์อาจปฏิเสธไอเทมที่ไม่มีในคลังจริง)

**Online damage proxy (v1.27):**

เซิร์ฟเวอร์จะคิดดาเมจให้เฉพาะปืนที่อยู่ใน loadout ที่มัน Ack ไว้
ถ้าเสกปืนที่ไม่มีในคลังจริง `sendFire` จะถูกเมิน (ยิงเห็นแต่ไม่โดน)

`esp.js` จึงห่อ instance ของ `pb.net`:

| method | สิ่งที่แก้ |
|---|---|
| `sendFire(id, …)` | เปลี่ยน `id` เป็นปืนเดิมของช่องนั้น (`localLoadout`/`owned` ก่อนเสก) |
| `sendState(payload)` | เปลี่ยน `weaponId` + `weapon` ให้ตรงกับ proxy |
| `sendReload(id)` | เปลี่ยน id เป็น proxy |
| `sendHit(payload)` | เปลี่ยนชื่ออาวุธเป็น proxy (เฉพาะ hit ของตัวเอง) |

proxy จะหยุดทำงานเองเมื่อ `net.localLoadout[slot]` เท่ากับ id ที่เสกแล้ว
(เซิร์ฟเวอร์รับ loadout หลัง respawn) — ปิดสวิตช์ใน GUI ได้ถ้าไม่ต้องการ

**Ground pickup mode (v1.28):**

สวิตช์ `เสกแบบเก็บจากพื้น` (default ปิด เพราะ Safe Mode เปิดอยู่) ใช้กับ
primary/secondary เท่านั้น เพราะ `pb.localDrop()` ของเกมปฏิเสธ slot > 1
ถ้าจะใช้ pickup ต้องปิด Safe Mode ก่อน (การติ๊ก pickup จะปิด Safe Mode ให้อัตโนมัติ)

ลำดับที่ `esp.js` ทำ:

```js
const dropped = ws.dropCurrent(true);      // เอาpืนเดิมของช่องออก
pb.localDrop(dropped.def.id, ...);         // ส่ง drop ปืนเดิม
pb.localDrop(def.id, slot, ammo, reserve); // สร้าง drop ของปืนที่เสก
ws.pickUp(def.id, ammo, reserve);          // เก็บเข้าช่องจริง
pb.net.sendPickup({ idx, weaponId, ... }); // แจ้ง pickup ให้ server/คนอื่น
pb.drops.remove(idx);                      // ลบ drop ที่เก็บแล้ว
```

ข้อดี: เป็นเส้นทางเดียวกับตอนเดินเก็บปืนจากพื้น — server มีโอกาสรับรองอาวุธ
และ client คนอื่นจะเห็นปืนที่เสกผ่าน `sendState` ตามปกติ (ไม่ต้อง proxy)
ข้อจำกัด: ถ้า server ตรวจ drop/pickup เข้ม (เจ้าของ/ไอเทมในคลัง) อาจไม่รับ
ในกรณีนั้นให้ปิด pickup แล้วกลับไปใช้ proxy

**Reapply หลัง respawn (v1.30):**

เซิร์ฟเวอร์มักคืนปืนเริ่มต้นให้ตอน respawn แม้ respawn menu จะโชว์ปืนที่เสก
`spawnReapply` (default on) จะจำ `{slot, id}` ของ pickup ที่สำเร็จ แล้วหลัง `ws.refill()`
(เกิดใหม่) จะ:
1. รอ ~500 ms
2. ถ้าช่องนั้นยังไม่ใช่ปืนที่เสก → ทิ้งปืนเริ่มต้น + `localDrop` + `pickUp` ซ้ำ
3. ทำซ้ำทุก ~1.5 s ภายใน 6 s เผื่อ server ส่ง ack มาทีหลัง

ต้องเสกด้วย pickup อีก 1 ครั้งหลังอัปเดต เพื่อให้จำ id (prefs ไม่มีในเซสชันเก่า)

**SAFETY / Safe Mode (default on):**

- spawn cooldown ขั้นต่ำ 1500 ms (ปรับได้ 0–5000)
- โควต้าเสกสูงสุดต่อนาที (default 8)
- บังคับใช้ proxy และข้าม pickup mode
- `PANIC` / `F10`: ปิด ESP, aim, recoil/spread, fast swap, stat bonus, spawn/proxy/pickup
  และซ่อนแผงทันที (Insert เปิดกลับ)
- `AC Shield` (v1.29): hook `room.game.conn.send` (instance) ทิ้งเฉพาะ opcode `9007`
  ซึ่งเป็นรายงาน anti-cheat; ไม่แตะ packet เกมอื่น
- `Panic on AC`: panic ทันทีเมื่อ console มี `[anti-cheat]`

**Server Check (v1.31):** แท็บ SAFETY → `CHECK` อ่านค่าที่เซิร์ฟเวอร์ส่งมา:

| ค่า | แหล่ง | ใช้ตอบอะไร |
|---|---|---|
| `net.weaponsFlag` | room | bitmask คลาสที่เปิด (511 = เปิดทุกคลาส) |
| `sel.enforcing()` | respawn menu | true = จำกัดเฉพาะไอเทมในคลัง/คลาสที่เปิด |
| `sel.allItems` | respawn inventory | ไอเทมที่เซิร์ฟเวอร์ให้เลือกตอนเกิด |
| `sel.lists[slot]` | respawn menu | รายการที่ผ่าน filter ของ slot นั้น |
| `sel.allowedId(key,id)` | respawn menu | ฟังก์ชันเดียวกับ UI ใช้ตัดสินว่าไอเทมนั้นถูกAllow |
| `net.localLoadout` | respawn ACK | ชุดที่เซิร์ฟเวอร์ Ack ล่าสุด |

ถ้าไอเทมไม่เคยอยู่ใน `allItems` และ `allowedId` ตอบ false → respawn จะคืนปืนเริ่มต้น
(แม้ pickup ระหว่างชีวิตจะได้ผลก็ตาม) ใช้ `spawnReapply` เพื่อ pickup ซ้ำหลังเกิด

**Owned-only filter (v1.32):** ติ๊ก `เฉพาะปืนที่เซิร์ฟเวอร์มี (owned)` ใน Weapon Spawner
รายการจะเหลือเฉพาะ id ที่อยู่ใน `sel.allItems` และผ่าน `allowedId` ของ slot นั้น
ทำให้เลือกกระบอกที่ respawn ได้จริงโดยไม่โดนเซิร์ฟเวอร์สลับให้
(สถานะ spawn จะขึ้น `· owned`)

ดูรายละเอียดมุมมอง anti-cheat ที่ [`docs/anticheat.md`](anticheat.md) §5.1 + §5.2

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
>
> v1.13 เลือกโปรไฟล์ไอเท็มแล้ว **seed ค่าลงสไลเดอร์ "กำหนดเอง"** ให้อัตโนมัติ → สลับไป custom เพื่อจูนต่อได้ทันที
>
> v1.14 เปลี่ยนกลไกโบนัสจาก "เขียน abilities" เป็น **instance hook** บน `ws.changeTimeOf` / `ws.reloadTimeOf`
> คำนวณจาก `def.params.changeTime|reloadTime` ตรง ๆ: `time * (1 - bonus)` (ต่ำสุด 0.1)
> ทำให้สไลเดอร์มีผลจริงแม้ไม่มีไอเทม และไม่ถูก `setPartAbilities()` เขียนทับ
>
> **ค่าจริงในตาราง `PC_EQUIP` (1174 ไอเทม, ตรวจจาก `avatarData-DnSaiZ_m.json`)**
> - `WeaponSwapTime` = **0.5** (15 ไอเทม) พร้อม `QuickChangeWeapon` = **1** → swap 2× (เพดานเกม 2.3×)
> - `WeaponReloadTime` = **0.25** (53 ไอเทม) + `FastReload_<family>` → reload ~1.33× (มีเบเร่ต์ได้ ~1.67×)
> - `FastReload_Assault/MG/Pistol/SG/SMG/Sniper` ครอบ family ละ 42–47 ไอเทม
> - ค่า default ของสไลเดอร์จึงตั้งเป็น swap **0.50** / reload **0.25** ตามของจริง

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
