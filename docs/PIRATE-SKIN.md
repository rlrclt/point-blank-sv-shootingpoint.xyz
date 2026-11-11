# Pirate Skin — zombie_slayer_pirate (มือขึ้นสำหรับ agent ตัวต่อไป)

> **สถานะปัจจุบัน: ตำแหน่งในเกมตรงกับ Blender แล้ว** — ผู้ใช้จัดโพสดาบเองใน Blender
> และตรวจแล้วว่าพร้อมเข้าเกม (commit `8220abc`) อย่าย้าย/หมุน geometry ใด ๆ โดยไม่ได้รับขอ

## ไฟล์หลัก

| ไฟล์ | คืออะไร |
|---|---|
| `makeskin\zombie_slayer_pirate.blend` | ซีนทำงาน (texture แพ็คในไฟล์) — Blender 5.3 |
| `makeskin\zombie_slayer_pirate.glb` | ไฟล์เกม 4.38 MB, 5 meshes, 28 primitives |
| `makeskin\sea3123_zombieslayer.glb` | reference ปืนต้นฉบับ (ใช้เทียบกับ checker) |
| `makeskin\check_weapon_glb.mjs` | ตรวจไฟล์: `node check_weapon_glb.mjs <candidate> [ref]` |
| `makeskin\tex\sea3123_zombieslayer\skin_pirate_{diff,norm,orm}.png` | atlas สกิน — **1024×512 ห้ามขยาย** (เกม tier alto โหลด texture ที่ 1024) |
| `makeskin\three\pirateSkin.js` | preview three.js — มี skip-list mesh ที่คง material ตัวเอง |
| `AppData\Local\Temp\opencode\pirate_edit_v4.py` | generator atlas (Lanczos 1440×720 → 1024×512 + UnsharpMask r1.2/75%) — temp dir เสี่ยงถูกลบ, ควรย้ายเข้า repo ถ้าจะแก้ texture ต่อ |

## โครงสร้างซีน (Blender, Z-up)

```
AxisRotate (EMPTY, มี rotation ตายตัว = คอนเวนชันแกน ห้ามแตะ)
└─ GunDummy
   └─ WholeAniDummy        ← ทุก mesh ผูกใต้ต้นนี้, identity loc/rot/scale
      ├─ Zombie_Slayer      (ลำปืน, material skin_pirate ใช้ 3 atlas)
      ├─ Model_Handle       (under HandelAnimationDummy — grip pivot)
      ├─ Model_Magazine     (under MagazineDummy)
      ├─ ShipRaw            (Thousand Sunny บน receiver — 22 primitives)
      ├─ KatanaTsuba        (ดาบ Zoro ทั้งเล่ม: slot 0-2 โกร่ง+ด้าม, slot 3 ใบดาบ material.002)
      ├─ FXDummy (+FXDummy_Body, Acc_*Dummy, MagazineDummy, HandelAnimationDummy)
      └─ HandelAnimationDummy / Acc_Front/Side/TopDummy
```

- **ดาบ**: `KatanaTsuba` เป็น object เดียว (user จัดโพสเอง — ใบดาบมีระยะห่างโกร่ง ~3.1 ซม. **ตามที่ผู้ใช้ต้องการ** ห้ามปิดช่องว่าง)
  - slot0 `material_3.002` โกร่ง · slot1 `material_4.001` · slot2 `material_5.001` ด้าม · slot3 `material.002` ใบดาบ (tex 1024² Image_0/1/2)
  - mesh เดียว 3588 tris — แยกใบดาบ/โกร่งเป็น object ต่างหากแล้วถูกผู้ใช้ join กลับ
- **dummy ที่มี rotation ติดตั้งแต่ต้น** (AxisRotate/GunDummy/WholeAniDummy/Acc_*/FX*/Magazine/Handel) — ไม่ใช่ความผิดพลาด, checker ผ่าน ห้าม "แก้" เป็น identity
- ทุก mesh object ต้อง **identity transform** (geometry bake ใน local ของ parent) — ถ้าเจอ scale/rot ค้าง ให้ `me.transform(matrix_basis)` แล้วรีเซ็ต (วิธี bake ดู commit `8220abc`)

## สูตร export (ใช้ตัวนี้เท่านั้น)

select ทั้ง subtree `AxisRotate` (MESH+EMPTY) แล้ว:

```python
bpy.ops.export_scene.gltf(filepath=fp, export_format='GLB', use_selection=True,
                          export_apply=True, export_image_format='AUTO',
                          export_yup=True, export_cameras=False, export_lights=False)
```

หลัง export รัน: `node check_weapon_glb.mjs zombie_slayer_pirate.glb sea3123_zombieslayer.glb`
ผ่าน = dummy ครบ, world transform ตรง ref, grip Δ0.0 ซม., bbox vs ref ~0.69x/1.21x/1.00x

## ข้อจำกัดของเกม (ไล่จากโค้ด client แล้ว)

- **FX ตอนยิง spawn เกมข้างเดียว** ที่ `FXDummy` (มีอยู่แล้วตรง ref) — ห้ามลบ/ขยับ
- ชนิด FX มาจาก `/assets/weapons/fx/weaponfx.json` ผูกกับ weapon id — เปลี่ยนผ่าน GLB ไม่ได้
- **สีฟ้าตอนยิง** = คอสเมทิกผู้เล่น `slot.muzzleColor` (item 1600187) ไม่ใช่ของโมเดล
- อย่าใส่ mesh emissive/blend เสริมที่ปากกระบอก — เคยทำ `MuzzleGlow` แล้วผู้ใช้สั่งลบ (เห็นตลอดเวลา)
- atlas 1024×512 เท่านั้น (tier alto); glTF V span 1.0–2.0 (`uv % 1.0`); three r169 ใช้ `flipY=false`

## การแก้ texture ใน Blender

image datablocks ชื่อ `skin_pirate_diff.png` / `skin_pirate_norm.png` (มีนามสกุล):
`img.unpack(method='USE_ORIGINAL')` → `img.reload()` → `img.pack()` → save+export

## การต่อ Blender จาก agent

- ทางหลัก: MCP addon `blender_mcp.py` (Blender ต้องเปิด + addon ทำงาน, reconnect ~10 วิ)
- ทางสำรอง: **Flue** (`python -m flue.cli run blender --stdin`, addon Creative Adapter Bridge เปิดใช้แล้ว, token ที่ `%APPDATA%\creative-adapters\blender.json`) — รัน bpy บน main thread เหมือนกัน
- gotcha: `bpy.ops.object.join` poll พังหลัง open_mainfile (ใช้ bmesh) · `BMFace.verts` ไม่ใช่ `.vertices` · `materials.pop(index=)` ต้อง keyword · ชื่อ object ผู้ใช้แก้มือได้ตลอด — **อ่านซีนใหม่ก่อนทุกครั้ง**

## เวิร์กโฟลว์ commit

ทุกครั้งที่แก้ Blender: save blend + export + `check_weapon_glb.mjs` + render `pirate_hero.png`
(dbg_cam lens 60, target (0,−0.27,0.02), กล้องที่ target+(0.52,0.42,0.34), 1400×1000)
แล้ว `git add makeskin; git -c user.name="YoruDekD" -c user.email="yoru@local" commit`

commit ล่าสุด: `8220abc` (katana repositioned by hand, bake scale, clean FBX leftovers)
