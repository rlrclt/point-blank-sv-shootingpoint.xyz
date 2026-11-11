# makeskin — weapon skin rig tools

ปืนฐานที่ใช้ทำ skin: **106042 Zombie Slayer** (Shotgun, `res: "Zombie_Slayer"`)

reference rig ที่ export จากเกม: `sea3123_zombieslayer.glb`

## ไฟล์

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `check_weapon_glb.mjs` | ตรวจ .glb เทียบ reference: dummy / grip / สเกล / แกน / skin |
| `preview_hold.html` | ดูปืนขนาดจริงพร้อมจุดแนบมือ + ghost reference (ไม่ normalize สเกล) |
| `preview_*.html` | preview material/shader ของแต่ละ skin (ของเดิม) |
| `zombie_slayer_*.glb` | ไฟล์ skin ที่ export แล้ว |

## 1) ตรวจ rig

```powershell
cd makeskin
node check_weapon_glb.mjs zombie_slayer_onepiece.glb
node check_weapon_glb.mjs zombie_slayer_pirate.glb
```

ผลที่ควรได้: `✔ โครงสร้าง/สเกล/pivot ตรงกับ reference`

สิ่งที่ checker ฟันธง:

- dummy ครบ: `GunDummy`, `WholeAniDummy`, `HandelAnimationDummy`,
  `MagazineDummy`, `FXDummy`, `Acc_*Dummy`
- world transform ของ dummy ตรง ref
- `grip ... ต่างจาก ref: 0.0 ซม.`
- แกนยาว = Z (เกมใช้ Z)
- ไม่มี `skins` / `animations` (อาวุธเกมเป็น rigid mesh)

## 2) ดูภาพจริง

```powershell
python -m http.server 8123
# http://localhost:8123/preview_hold.html?model=zombie_slayer_onepiece.glb
```

- **ไม่ normalize** ขนาด → เห็นว่าปืนใหญ่/เล็กผิดหรือไม่
- กล่องแดง + แกนเขียว = จุดที่เกมแนบมือ (root origin)
- จุดฟ้า = FX · เหลือง = magazine · เขียว = handle
- ปุ่ม `1` first-person · `2` orbit · `R` ghost reference · `H` ซ่อน hand · `G` grid
- ใส่ `&ref=...` เพื่อเปลี่ยน reference (ค่าเริ่มต้น `sea3123_zombieslayer.glb`)

## กติกาการทำ skin (กันเพี้ยน)

1. เริ่มจาก `.blend`/`.glb` ที่มี dummy ของเกมครบ — อย่านำเข้าโมเดลดิบจาก Sketchfab
2. วาง mesh ใหม่ **ใต้ dummy เดิม** อย่าย้าย/หมุน dummy
3. origin ของ mesh ต้องตรง grip (`HandelAnimationDummy`)
4. สเกลเป็นเมตร (1 unit = 1 m), แกนยาวตาม Z
5. export `.glb` ไม่ต้องมี animation/skin
6. ผ่าน `check_weapon_glb.mjs` แล้วค่อยเอาลงเกม

## ทดสอบในเกม

ต้องรู้ URL จริงของโมเดลปืนในเกมก่อน (asset ถูกติด version hash)
วิธีเก็บ: เปิด Brave ด้วย `--remote-debugging-port=9222` → เข้าแมตช์ →
อ่าน `performance.getEntriesByType('resource')` ที่ลงท้าย `.glb`
แล้วทำ redirect (extension/CDP) ไปที่ไฟล์ localhost
