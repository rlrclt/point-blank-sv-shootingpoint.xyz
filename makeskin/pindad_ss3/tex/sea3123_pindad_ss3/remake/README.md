# Pindad SS3 — ไฟล์ที่ต้องแก้เมื่อจะทำลายใหม่ด้วย AI

โฟลเดอร์นี้มี **เฉพาะ diffuse atlas** ที่ AI ต้องวาดใหม่ — ไม่ต้องแตะ norm/ref/spec

## ไฟล์ที่ต้องแก้ (2 ใบ)

| ไฟล์ | ใช้กับ | ขนาด | หมายเหตุ |
|---|---|---|---|
| `pindad_ss3_diff.png` | ตัวปืน (`Pindad_SS3`, `Model_Handle`, `Model_Magazine`) | **1024×1024** | UV atlas เต็มผืน — วาดทับได้ทั้งใบ |
| `combat_sight_mepro_x6_diff.png` | ศูนย์เล็ง (`Combat_Sight_Mepro_X6`) | **512×512** | atlas ของศูนย์เล็งโดยเฉพาะ (มีเลนส์/สกรูแยกชิ้น) |

## กฎสำคัญตอนให้ AI วาด

1. **คง layout เดิมไว้** — ห้ามย้าย/หมุน/ย่อ-ขยายชิ้นส่วนในภาพ เพราะ UV ของโมเดล Fix ไว้แล้ว
   (ถ้า AI "จัดหน้าใหม่" ลายจะไปผิดชิ้น)
2. **ขยายขนาดได้** แต่ต้องเป็น **ยกกำลังสองและ aspect เดิม**: 1024 → 2048 (ตัวปืน), 512 → 1024 (ศูนย์เล็ง)
   แล้วค่อยย่อกลับตอนใช้งาน (หรือใช้เลยก็ได้ — เกมย่อให้ที่ 1024)
3. ภาพแนว **flat texture / UV sheet** — ไม่ใส่เงาแสง 3D, ไม่ใส่ perspective, ไม่มีตัวอักษรแปลก ๆ
4. ถ้าอยากได้ normal/ref/spec ใหม่ตามลาย → สั่งทำเพิ่มได้ (ผม generate จาก diff ให้)

## ไฟล์ที่ไม่ต้องแก้ (มีอยู่แล้วในโฟลเดอร์แม่)

- `pindad_ss3_norm.png` / `_ref.png` / `_spec.png`
- `combat_sight_mepro_x6_norm/ref/spec.png`
- `.dds` ทุกตัว (ไฟล์ต้นฉบับจากเกม)

## ขั้นตอนหลังได้ภาพใหม่

1. เอาไฟล์ที่ AI สร้างมาวางทับใน `remake\` (ชื่อเดิม)
2. บอกผม → ผมจะ
   - ตรวจขนาด/aspect
   - ใส่เป็น Base Color ใน `pindad_ss3.blend`
   - (ถ้าต้องการ) สร้าง normal map ใหม่จาก diff
   - export GLB + `check_weapon_glb.mjs`

## Prompt ตัวอย่าง (ภาษาอังกฤษใช้ได้ผลกว่า)

```
weapon skin texture atlas, flat UV sheet, full-bleed, keep the exact same layout and part placement,
[YOUR THEME], crisp vector shapes, high contrast, clean panel lines, no text, no logo,
no perspective, no shadows, seamless edges
```
