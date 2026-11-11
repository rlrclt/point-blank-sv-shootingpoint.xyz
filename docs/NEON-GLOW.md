# ทำส่วน Neon ให้ "Glow" บนสกินปืน PB (emissive)

> สรุปจากการอ่านโค้ดไคลเอนต์จริง: `pbrecon/live/pbLighting-BH2QZoah.js` + `compressedTex-BJOARzH8.js`
> ตัวอย่างที่ทำเสร็จ: `makeskin/pindad_ss3/pindad_ss3_neon_glow.glb`

## 1) เกมทำ glow ยังไง

shader ของ PB (Phong ที่เขียนเอง) บวก emissive เข้าไปตรง ๆ:

```glsl
#ifdef PB_EMISSIVE
  c += texture2D(emissiveMap, vPbUv).rgb * emissiveColor * 4.0;   // ×4
#endif
```

- `emissiveColor` มาจาก `userData.pbEmissiveColor` (default `[1,1,1]`)
- ไฟล์ emissive มาจาก `userData.pbEmissive` (path สัมพัทธ์) → ไคลเอนต์ต่อ base + path แล้วโหลด
- define `PB_EMISSIVE` จะเปิดเมื่อ **มี emissive โหลดสำเร็จ** และโหมด `pblight` ทำงาน (`?pblight=1`)
- ไม่มี bloom pass: ความ glow มาจากค่าสีที่เกิน 1.0 (×4) — เพราะฉะนั้นต้องทำ "halo" ใน texture เอง

## 2) ต้องเตรียมอะไร

| ไฟล์ | เนื้อหา |
|---|---|
| `<skin>_emissive.png` | **ดำทั้งใบ** ยกเว้นส่วนที่อยากให้ glow (เส้นนีออน/จอ/แถบ) — ใช้ UV atlas เดียวกับ diff |
| GLB extras | `pbEmissive`: `"tex/<slug>/<skin>_emissive.png"`, `pbEmissiveColor`: `[1,1,1]` (หรือ tint) |

**สำคัญ:** emissive map ต้องมี **halo นุ่มรอบเส้น** (blur 2–4 px) เพราะ engine ไม่ได้ทำ bloom ให้
ไม่งั้นจะได้แค่เส้นแข็งสว่าง ไม่ดูเป็น glow

## 3) ขั้นตอนใน Blender (ทำอัตโนมัติได้)

```python
# 1. สร้าง emissive map จาก diff (แต่งใน PIL หรือ Photoshop)
#    เลือกพิกเซลที่สว่าง+อิ่มตัวสูง -> เก็บสีไว้ ที่เหลือดำ -> blur เบา ๆ -> ลด brightness ~0.55
#    (เพราะ shader คูณ 4 อีกที)

# 2. ต่อเข้า material
bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
tex = mat.node_tree.nodes.new("ShaderNodeTexImage"); tex.image = emissive_img
mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
bsdf.inputs["Emission Strength"].default_value = 1.0   # glTF emissiveStrength

# 3. ใส่ custom property ให้ mesh (กลายเป็น glTF extras)
obj["pbEmissive"] = "tex/sea3123_pindad_ss3/pindad_ss3_emissive.png"
obj["pbEmissiveColor"] = [1.0, 1.0, 1.0]

# 4. export (ต้องมี export_extras=True)
bpy.ops.export_scene.gltf(..., export_extras=True)
```

**ต้องมี 2 ทางพร้อมกัน:**
- standard glTF: `emissiveTexture` + `emissiveFactor` (ติดไปใน GLB อัตโนมัติจาก Principled) → ทำงานใน three.js/fallback
- PB extras: `pbEmissive` / `pbEmissiveColor` → ทำงานใน shader PB

## 4) ตรวจว่า GLB มีครบ

```powershell
node -e "const fs=require('fs');const b=fs.readFileSync('skin.glb');const j=JSON.parse(b.slice(20,20+b.readUInt32LE(12)).toString());console.log(g.materials.map(m=>[m.name,!!m.emissiveTexture]));g.nodes.filter(n=>n.extras).forEach(n=>console.log(n.name,n.extras))"
```

ที่ต้องเห็น:
```
mat pindad_ss3_diff emissiveFactor [1,1,1] emissiveTexture true
node extras Pindad_SS3 {"pbEmissive":"tex/..._emissive.png","pbEmissiveColor":[1,1,1]}
```

## 5) ข้อจำกัด/กับดัก

| เรื่อง | รายละเอียด |
|---|---|
| ต้องมีไฟล์ emissive แยกบนเซิร์ฟเวอร์ | `pbEmissive` เป็น **path**, ไม่ใช่ texture ที่ฝังใน GLB — ต้องอัปโหลด `<skin>_emissive.png` ไว้ที่ base เดียวกับโมเดล |
| ชื่อ path ต้องตรงเป๊ะ | ตัวพิมพ์เล็ก/ใหญ่ และโฟลเดอร์ ต้องตรงกับที่โฮสต์ ไม่งั้น `hasEmissive` ไม่เปิด |
| โหมด pblight | ถ้าไคลเอนต์รันแบบ `PBM_LIGHT` (legacy) emissive จะไม่ถูกใช้ — เหลือแค่ standard glTF emissive |
| อย่าให้สว่างเกิน | shader ×4 → พื้นที่สว่างจะ clip เป็นขาว; ตั้ง brightness รวม ≤ ~0.6 |
| ไม่มี bloom | ทำ halo ใน texture เอง (blur) |
| ไฟล์ใหญ่ | 2048² × 4 maps = ~18 MB; ย่อเป็น 1024² ได้ ~5 MB ถ้าไม่ต้องการความละเอียด |

## 6) ตัวอย่างจริงในโปรเจกต์

- `makeskin/pindad_ss3/make_emissive.py` — สร้าง emissive จาก diff (mask สีสด + blur + ลด brightness)
- `makeskin/pindad_ss3/apply_glow.py` — ต่อ node + ใส่ extras + export
- `pindad_ss3_neon_glow.glb` — ผลลัพธ์ (18.5 MB, 4 × 2048² texture)
- preview: `scene_glow2.png`

## 7) ทางเลือกเมื่อใช้ emissive ไม่ได้

ถ้าโฮสต์ไฟล์ emissive แยกไม่ได้ ให้ **เบิร์น glow ลง diffuse** (สว่างกว่าปกติ + halo)
ข้อเสีย: สว่างตลอดเวลา ไม่ตอบสนองแสง และไม่ดูเป็น neon จริง
