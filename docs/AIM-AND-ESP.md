# Aim / ESP — จุดเล็ง, Smart Zone, การมองเห็น

> ครอบคลุมเฉพาะส่วน aim + visibility ใน `esp.js` ( sejak v1.9, ปัจจุบัน v1.24 )
> ESP overlay / GUI / recoil ไม่อยู่ในเอกสารนี้

---

## 1. หลักการ

จุดเล็ง **ต้องเป็นจุดเดียวกับที่ ESP วาด** และ **ต้องเป็นจุดที่กระสุนไปโดนจริง**

ทั้งสองข้อมาจากแหล่งเดียว: `userData.hitboxDefs` ของโมเดล ซึ่งเกมใช้สร้าง
sensor collider สำหรับคิด damage (`main:Xm()` / `zn()`)

```
game:   hitboxes[] = { bone, min, max, zone }
        center = (min + max) / 2
        world  = center.applyMatrix4(bone.matrixWorld)
        → cuboid sensor collider ต่อ bone → raycast หา zone
```

`esp.js` ใช้สูตรเดียวกัน `candWorld()` จึงได้จุดเดียวกับ hitbox ของเกม

---

## 2. Candidate = hitbox center ทุกกล่อง

```js
getHitboxDefs(a)      // อ่าน boneHitboxes (หรือ hitboxDefs) จาก visualRoot
getAimCandidates(a)   // [{ bone, zone, local, name }]
candWorld(cand, out)  // local → world ด้วย bone.matrixWorld
```

โซนที่เกมใช้: `head | body | arm | hand | leg | foot`

---

## 3. การเลือกจุด (v1.9+)

เดิมเลือกตาม "ลำดับโซน" ตายตัว → หัวชนะทุกกรณี = ล็อกหัวอย่างเดียว
ตอนนี้ใช้ **คะแนน**:

```
score = มุมจาก crosshair (องศา) + zonePenalty(mode) + ZONE_TIE[zone]
```

| mode | โซนที่ได้เปรียบ | น้ำหนัก |
|---|---|---|
| `auto` | ไม่มี — ใกล้ crosshair สุด | 0 |
| `head` | `head` | 1.0 × bias |
| `neck` | `head/body` ที่ชื่อมี `neck` | 0.5 × bias |
| `chest` | `body` ที่ชื่อมี `spine3/spine2/chest/spine1` | 1.0 × bias |
| `pelvis` | `body` ที่ชื่อมี `pelv/hip/root` | 1.0 × bias |

`Zone bias` (GUI, default 8°) = ระยะองศาที่โซนที่เลือกได้เปรียบ
- `0` → ตามโครงล้วน (จุดใกล้ crosshair)
- `8` → หัวชนะได้ถ้าหัวอยู่ห่างไม่เกิน 8° จากจุดที่ดีที่สุด

`ZONE_TIE` กันแขน/ขาแย่งจุดจากลำตัวเมื่อมุมพอ ๆ กัน:

```js
{ head: 0, body: 0, arm: 1.5, hand: 2.5, leg: 2.0, foot: 3.0 }
```

### Smart Zone

| สถานะ | พฤติกรรม |
|---|---|
| เปิด | ไล่ตามคะแนน จุดแรกที่ **เห็นจริง** ชนะ (หัวโดนบัง → อก → แขน → ขา) |
| ปิด | ใช้เฉพาะโซนของ mode นั้น — หัวโดนบัง = ไม่ยิง (fail-closed) |

เพดาน raycast ต่อ actor ต่อการเลือก 1 ครั้ง: `AIM_MAX_RAYS = 8`
กันการสลับจุดหัว↔อกทุกเฟรม: `AIM_STICKY_MS = 90`

---

## 4. การมองเห็น (LOS)

กระสุนในเกมนี้มาจาก **กล้อง** ไม่ใช่ตาตัวละคร:

```js
// main: aimRay()
const e = camera.getWorldPosition(new Vector3());
const s = camera.getWorldDirection(new Vector3());
return { origin: e, dir: s };
```

→ `pointVisible()` ยิง ray จาก `camera.matrixWorld` เท่านั้น (ไม่ใช้ `eyePosition`)

### rayBlocked()

```js
maxToi = dist - 0.05          // ยิงเกือบถึงจุด
near   = dist - 0.35          // ใกล้กว่านี้ถือว่าเป็นตัวเป้าเอง
flags  = QueryFilterFlags.EXCLUDE_SENSORS   // hitbox sensor ไม่นับเป็นกำแพง

hit = world.castRay(ray, maxToi, true, flags, undefined,
                    pb.player.collider, undefined, pb.notGlass);
return hit ? (toi < near) : false;
```

- `EXCLUDE_SENSORS` — กัน ray ชน hitbox ของเป้าเองแล้วรายงานว่า "โดนบัง"
- `toi < near` — กำแพงที่อยู่ชิดจุดเล็ง (เคสหลังพิงกำแพง) ถูกจับ
- `notGlass` — predicate ของเกมเอง (ตัดกระจก/พร็อพ)

### ค่าที่คืน

| ค่า | ความหมาย |
|---|---|
| `true` | เห็น |
| `false` | โดนบัง |
| `null` | ตรวจไม่ได้ (ไม่มี `world`/`R` หรือ raycast throw) |

`aimPointOk()` ยอมรับ `null` **เฉพาะเมื่อเกมไม่ได้บอกว่าโดนบัง**
(`actorOccluded() !== true`) — `occluded` เกมเซ็ตบน visual record ไม่ใช่ actor:

```js
function actorOccluded(a) {
  return typeof a?.occluded === "boolean" ? a.occluded
       : typeof a?.visual?.occluded === "boolean" ? a.visual.occluded
       : typeof a.visualRoot?.occluded === "boolean" ? a.visualRoot.occluded
       : undefined;
}
```

---

## 5. Target lock / การปล่อยเป้า

ปัญหาเดิม: `lockFov = fovRad * 1.25` และ bot mode ตั้ง FOV 180 → เป้าไม่เคยหลุดกรอบ
→ หันหนีไปทางไหน กล้องก็ถูกดึงกลับ

| ค่า | ค่าเริ่มต้น | หน้าที่ |
|---|---|---|
| `aimHoldCone` | 30° | กรอบทำงานจริง `acqFov = min(aimFov, holdCone)` |
| `aimRelease` | true | ปล่อยเป้าเมื่อผู้เล่นขยับกล้องเอง |
| `aimReleaseDeg` | 3°/เฟรม | ขยับเกินนี้ = ปล่อย |
| `aimReleaseMs` | 300ms | หยุดแย่งกล้องหลังปล่อย (ต่อเวลาถ้ายังขยับ) |

การตรวจจับ: จำ `yaw/pitch` ที่ควรเป็นหลัง `addLook()` แล้วเทียบเฟรมถัดไป
ถ้าคลาดเกิน `aimReleaseDeg` = มี input จากผู้เล่น

การสลับเป้า: `AIM_SWITCH_MARGIN = 0.05 rad` (~2.9°) แบบ **บวก** ไม่ใช่คูณ

---

## 6. ESP ที่ตรงกับจุดเล็ง

- `drawSkeleton()` เรียก `root.updateWorldMatrix(true, true)` ก่อนอ่านกระดูก → ไม่ตามหลัง 1 เฟรม
- `drawAimNodes()` วาดจุดกลาง hitbox ทุกจุดเป็น node บนโครง → ตาเห็นจุดไหน = ล็อกจุดนั้น
- ตัวชี้ LOCK ใช้ `realAim` (จุดบนโครงก่อน predict) + แสดงชื่อโซน
- `isCrouching()` รองรับทั้ง `actor.crouch` และ `actor.isCrouching()` → กล่องสูงตรงตอนหมอบ

---

## 7. Debug

```js
__pbAimProbe()      // ตารางทุกจุด: zone / bone / angle / score / visible + จุดที่เลือก
```

ตัวอย่างผล:

```
actor 2 dist=8 occluded=false -> aim=body:Pelvis
   head  Head       ang= 11.7 score= 11.7 visible=false
   body  Pelvis     ang=  6.8 score= 14.8 visible=true
   arm   UpperArmL  ang= 10.1 score= 19.6 visible=true
```

- `score` ต่ำกว่า = ถูกเลือกก่อน
- `visible=false` ทั้งแถวทั้งที่ตาเห็น → raycast ไม่ทำงาน (`world`/`R` ไม่มี)
- `visible=true` ทั้งที่อยู่หลังกำแพง → กำแพงไม่มี collider หรือถูก `notGlass` ตัด

---

## 8. ค่าที่ปรับบ่อย

| อยากได้ | ตั้ง |
|---|---|
| ยิงเฉพาะที่เล็ง | `FOV 6–15°` หรือ `Hold cone 12–20°` |
| บอทกวาดทั้งจอ | `FOV 180` + `Hold cone 45–90` |
| ปล่อยเป้าไว | `aimReleaseDeg 1.5–2` |
| ยึดเป้านาน | `aimReleaseMs 500–800` |
| เอนหัวตลอด | `Bone = Head`, `Zone bias 20–30` |
| ตามโครงล้วน | `Bone = Auto`, `Zone bias 0` |
