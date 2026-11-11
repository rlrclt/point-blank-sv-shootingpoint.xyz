# Weapon Skin Playbook — ทำสกินปืนต้นอื่น (มาใช้ต่อได้ทันที)

> สรุปจากงานจริงชุด Pirate (Zombie Slayer) — รายละเอียดเฉพาะงานนั้น: `docs/PIRATE-SKIN.md`
> หลักการออกแบบลายให้สวย/อ่านง่ายแบบ Valorant: `docs/SKIN-DESIGN-GUIDE.md`
> ขั้นตอนตรวจ rig/ดู preview/เทสในเกม: `makeskin/README.md` (อ่านก่อน เนื้อหาไม่ซ้ำตรงนี้)

## 0) เลือกปืนและหาข้อมูล

```powershell
# ดึง reference ของปืนที่จะทำ (slug จาก site/data/items.json)
Invoke-WebRequest "https://shootingpoint.xyz/assets/weapons/models/<slug>.glb" -OutFile makeskin\<slug>.glb
```

- index ไอเทม: `site/data/items.json` (มี slug, itemId, family, variant, path, img)
- FX ของปืน: `node pbrecon/lookup-weapon-fx.mjs <slug|itemId|family:variant>`
  (ต้องมี `pbrecon/weaponfx.json` — ยังไม่มีใน repo, โหลดตามคำแนะนำที่ script แจ้ง)
- รายการสกินที่มี FX พิเศษสำเร็จรูป: `docs/SPECIAL-FX-SKINS.md` + `pbrecon/special-fx.json`

## 1) ตั้งซีน Blender

1. import GLB reference ของปืนนั้น — เก็บ dummy hierarchy ตามที่ ref มี
2. mesh ทุกชิ้น parent ใต้ `WholeAniDummy` (ห้ามวางเป็นพี่น้องของ GunDummy — เกม merge เฉพาะ subtree, ดูบทเรียนใน makeskin/README)
3. ทุก mesh object **identity transform** (loc 0, rot 0, scale 1) — ถ้ามี scale ค้าง bake ลง mesh: `me.transform(matrix_basis)` แล้วรีเซ็ต (world ไม่ขยับ)
4. ห้ามลบ/ขยับ `FXDummy` (เกม spawn แฟลชยิงตรงนั้น), ห้ามแก้ rotation ของ dummy ที่มีมาแต่ต้น (มันคือคอนเวนชันแกนของเกม — checker เทียบกับ ref ของปืนตัวนั้น)
5. prop เสริม (ดาบ/เรือ/เครื่องประดับ) อย่าให้กลบมือจับ/grip และระวังปิด scope/เล็ง

## 2) Texture

- atlas **1024×512** เสมอ — เกม tier alto โหลด texture ที่ 1024 (สูงกว่านี้เปลืองโดยไม่คมขึ้น)
- UV ของเกม: **V span 1.0–2.0** (`uv % 1.0`), three r169 ต้อง `flipY=false`
- แยกชุดต่อสกิน: `tex/<slug>/skin_<ชื่อ>_{diff,norm,orm}.png`
- generator แบบ self-contained ดูตัวอย่าง `makeskin/gen/pirate_edit_v4.py`
  (Lanczos + UnsharpMask ให้คมที่ 1024, diff→normal→ORM จาก atlas เดียว)
- อัปเดตลง Blender: `img.unpack(method='USE_ORIGINAL')` → `img.reload()` → `img.pack()`
  (image datablock ชื่อพร้อมนามสกุล เช่น `skin_pirate_diff.png`)

## 3) Export + ตรวจ

```python
# select subtree AxisRotate (MESH+EMPTY) ทั้งหมดแล้ว:
bpy.ops.export_scene.gltf(filepath=fp, export_format='GLB', use_selection=True,
                          export_apply=True, export_image_format='AUTO',
                          export_yup=True, export_cameras=False, export_lights=False)
```

```powershell
node makeskin/check_weapon_glb.mjs <candidate>.glb <ref ของปืนต้น>.glb
```

ผ่าน = dummy ครบตรง ref, world transform ตรง, grip Δ0.0 ซม. — ถ้า bbox ต่างจาก ref
ต้องเป็นไปด้วย prop ที่จงใจใส่ (สูงสุดที่ยอมรับได้เท่าที่ผ่านเกมมา ~1.2x)

## 4) Preview

```powershell
cd makeskin; python -m http.server 8123
# http://localhost:8123/preview_hold.html?model=<candidate>.glb&ref=<ref>.glb
```

- ทำ material module แยกใน `makeskin/three/<skin>Skin.js` ตามแบบ `pirateSkin.js`
  (มี skip-list ชื่อ mesh ที่ต้องการคง material ตัวเอง)
- hero render ใน Blender: dbg_cam, lens 60, 1400×1000 — เก็บภาพ `<skin>_hero.png`

## 5) ข้อจำกัดเกม (สำคัญ — อย่าเสียเวลา)

- **เอฟเฟกต์ตอนยิงอยู่นอกโมเดล**: เกมอ่านจาก `weaponfx.json` ผูกกับ itemId จริงของปืน
  สกิน .glb ทำแฟลชสี/particle ตอนยิงไม่ได้ — อย่าใส่ mesh emissive ปากกระบอก
  (เคยทำแล้วผู้ใช้สั่งลบ เพราะเห็นตลอดเวลา)
- สีตอนยิงที่ทำได้ = คอสเมทิก muzzle color ของผู้เล่น (item 1600187, ติดทุกปืน)
- อาวุธเกมเป็น rigid mesh — ไม่ใส่ animation/skin ลง GLB

## 6) เวิร์กโฟลว์ต่อการแก้ 1 รอบ

save .blend (pack texture) → export → `check_weapon_glb.mjs` → render hero →
`git add makeskin; git -c user.name="YoruDekD" -c user.email="yoru@local" commit`

## 7) เชื่อม Blender จาก agent

- หลัก: MCP addon (Blender เปิด + addon ทำงาน, reconnect ~10 วิ)
- สำรอง: Flue — `python -m flue.cli run blender --stdin` (addon Creative Adapter Bridge
  เปิดใช้แล้ว, token ที่ `%APPDATA%\creative-adapters\blender.json`)
- gotchas รวมอยู่ใน `docs/PIRATE-SKIN.md` (bmesh/ops/pack/ชื่อ datablock) —
  กฎเหล็ก: **ผู้ใช้แก้ซีนมือได้ตลอด อ่านสถานะใหม่ก่อนทุกครั้ง อย่า assume ชื่อ/ตำแหน่ง**
