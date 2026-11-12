# คู่มือออกแบบสกินปืนให้สวยแบบ Valorant (ใช้กับ PB + Blender + Flow)

> เป้าหมาย: ทำให้สกินที่เราทำดู "ตั้งใจออกแบบ" ไม่ใช่แค่เอา texture มาแปะ
> ใช้คู่กับ `docs/WEAPON-SKIN-PLAYBOOK.md` (ขั้นตอนเทคนิค) และ `docs/SPECIAL-FX-SKINS.md` (ข้อจำกัด FX)

---

## 1) Pipeline จริงของ Riot (อ้างอิง)

| ขั้นตอน | เครื่องมือ |
|---|---|
| Concept art | Photoshop / Procreate |
| Hi-poly | ZBrush |
| Low-poly + UV + rig | Maya (บางงาน 3ds Max) |
| Bake normal | Marmoset Toolbag / Substance Baker |
| Texture | Substance 3D Painter |
| Shader / material | Unreal Engine 4 + custom shader ของ Riot |
| VFX | Unreal Niagara + Houdini |
| Animation (inspect/reload/equip) | Maya |
| Render โปรโมท | Marmoset / KeyShot / Unreal |

**ของเรา (PB weapon skin)** — ทุกอย่างจบใน Blender + Flow:

```
reference (GLB+tex จากเกม) → ออกแบบลาย (Flow / วาดเอง)
→ atlas 1024×512 (UV V 1.0–2.0) → ผูก material ใน Blender
→ export GLB → check_weapon_glb.mjs → preview → ทดสอบในเกม
```

ต่างจาก Riot ตรงที่ **เราไม่มี custom shader / VFX / animation** — ทำได้แค่สี+ลาย+bump จาก texture
เพราะฉะนั้น "ความสวย" ต้องมาจาก **การออกแบบลาย** ล้วน ๆ

---

## 2) ทำไมสกิน Valorant สวย — 4 เสาหลัก และแปลงเป็นกฎที่ใช้ได้

### 2.1 Art direction นิ่ง (โทนเดียวทั้งสกิน)
- 1 ธีม = 1 พาเลตต์ ไม่ผสมหลายอารมณ์
- **กฎ:** 1 สีหลัก + 1 สีรอง + 1 accent (สัดส่วน ~60/30/10)
- accent (ทอง/นีออน/แดง) ไม่เกิน ~10% ของพื้นที่ — ใช้เป็นเส้นขอบ รอยต่อ หรือจุดโฟกัส

### 2.2 อ่านง่ายในเกม FPS
- ซิลูเอตต์ต้องไม่เปลี่ยนจนจำปืนไม่ได้ (especially 1st person)
- **กฎ:** รายละเอียดใหญ่ 3–5 ก้อนต่อชิ้น ไม่ใช่ลายละเอียดเต็มพื้นที่
- **กฎ:** จัดค่าแสง 3 ระดับ (สว่าง / กลาง / เข้ม) ให้แต่ละชิ้น — ถ้าทั้งปืนค่าเท่ากันจะแบน
- ทดสอบ: ย่อภาพ texture เหลือ 25% แล้วยังอ่านลายออก = ผ่าน

### 2.3 Material ทำงานจริง (metal/rough/normal)
- Riot มี PBR ครบ + shader เฉพาะ; เราใช้ได้แค่ texture maps ใน GLB
- **กฎ:** อย่าใส่ "เงา/ไฮไลต์" ลงใน diffuse หนัก ๆ (จะเบิร์นติดไปทุกมุมมอง)
  ใส่ได้แค่เงานุ่มระดับ low-frequency
- เราแนบ `_norm/_ref/_spec` ได้ถ้าเกมใช้ — แต่ GLB เราต้องทดสอบว่าเอนจินอ่าน (PB ใช้ material เดียวต่อ mesh)

### 2.4 VFX + SFX + Anim ไปด้วยกัน
- เราใส่ FX ใน GLB ไม่ได้ (เกมอ่าน `weaponfx.json` ตาม itemId)
- **กฎ:** ออกแบบลายให้ "สื่อพลัง" แทน FX เช่น เส้นเรืองแสงใน texture, รอยแตกที่มีทิศทาง
- ถ้าอยากได้เอฟเฟกต์ยิงจริง ต้องเลือกปืนที่มี FX อยู่แล้ว (`docs/SPECIAL-FX-SKINS.md`)

---

## 3) Design rules สำหรับงานเรา (สั้น ใช้ได้เลย)

| เรื่อง | กฎ |
|---|---|
| พาเลตต์ | 3 สีสูงสุด (หลัก/รอง/accent) — accent ≤10% |
| ค่าแสง | 3 ระดับต่อชิ้น; อย่าให้ทั้งปืนสว่างเท่ากัน |
| สเกลลาย | ลายหลัก 1 ชุดต่อ 1 ชิ้นส่วน — อย่าให้ลายเล็กจิ๋วเต็มพื้นที่ |
| ความคม | ขอบลายคม (vector-like) > เบลอ/นอยซ์ |
| UV | อย่าให้ seam ตัดกลางดอก/หน้าคน; วางลายให้ไหลตามแนวยาวปืน |
| Texel density | ชิ้นใหญ่ (ตัวปืน) ได้ texel มากกว่าชิ้นเล็ก — อย่าให้ dotsight/wings ลายใหญ่กว่าตัวปืน |
| Emissive | ถ้าใช้ ให้เป็นเส้น/จุดตามร่อง ไม่ใช่แผ่นใหญ่ |
| ตัวอักษร/โลโก้ | ห้าม (AI มักทำเป็นตัวยุ่ง) |
| Symmetry | ลายสมมาตรเฉพาะจุดที่ตั้งใจ; ปีก/ซองต้องคู่กัน |

**เทคนิคจัดลายให้ดูพรีเมียม**
- ใส่ "panel line" บาง ๆ คั่นชิ้นส่วน → อ่านเป็นงานประกอบ ไม่ใช่สติกเกอร์
- ใส่ขอบสีเข้ม (dark edge) รอบลายหลัก → ลายเด้งออกจากพื้น
- ทิ้งพื้นที่ว่าง (negative space) 30–40% — ลายจะดูแพง

---

## 4) Prompt recipes สำหรับ Flow (`gem_pix_2`)

โครง prompt ที่ได้ผล:

```
<ชนิดงาน: seamless weapon skin texture / texture sheet>,
<style: crisp flat graphic, sharp clean edges, minimal shading, no blur>,
<motif>, <palette: base + accent>, <accents: gold linework / panel lines>,
<quality: highly detailed, tileable, game-ready>, no text, no logo
```

**ตัวอย่างที่ใช้จริง (Sakura — AUG A3 Dark Cupid)**
> seamless weapon skin texture, crisp flat graphic sakura cherry blossom pattern in Valorant skin style, ivory white base, vivid pink five-petal blossoms with soft inner gradient, dark ink branches, thin metallic gold linework, sharp clean vector-like edges, minimal shading, high contrast, petals in flowing diagonal clusters, tileable game texture, no text, no logo, no blur

**ตัวอย่าง EVA-01 (M1887)**
> seamless sci-fi weapon skin texture sheet, Evangelion EVA-01 inspired armored mecha plating, deep purple and neon green panels, black carbon fiber, orange warning stripes, thin white panel lines, hexagon vents, glossy metal, anime mecha aesthetic, highly detailed, tileable, no text, no logo

**Do / Don't**
- ✅ `crisp flat graphic`, `sharp clean edges`, `high contrast`, `tileable`
- ✅ ระบุสีเป็นคำตรง ๆ (`ivory white base`, `vivid pink`)
- ❌ `photorealistic grunge`, `dirty`, `weathered` → ได้ลายสกปรก/เบลอ
- ❌ ปล่อยให้ AI ใส่ตัวอักษร/ตรา — เติม `no text, no logo` ทุกครั้ง

---

## 5) ข้อจำกัด/กับดักที่เจอมาแล้ว

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| Flow ตอบ empty (0 image) | โมเดล `narwhal` ใช้ไม่ได้กับบัญชีนี้ → ใช้ `-model gem_pix_2` |
| `main.py image` ส่ง prompt เพี้ยน | bug quote ฝั่ง Windows → เรียก `bin\flow-windows.exe image -prompt "..."` ตรง |
| Flow bridge ต่อไม่ได้ | bridge ต้อง bind `ws://127.0.0.1:9222` — Brave ต้องไม่เปิด `--remote-debugging-port=9222` |
| texture PNG 404 | บางสกินมีแต่ `.dds/.ktx2` → โหลด dds แล้วแปลงด้วย Pillow |
| export GLB ล้ม `active_object` | ต้องห่อ `bpy.ops.export_scene.gltf` ด้วย `bpy.context.temp_override(...)` (bridge context) |
| ภาพใน Blender ยังเก่า | เปลี่ยน `image.filepath` → `unpack(REMOVE)` → `reload()` → `pack()` |
| ลายไม่เท่ากันระหว่างชิ้น | UV scale ของ dotsight/wings ต่างจากตัวปืน — ยอมรับ หรือแก้ UV |

---

## 6) QA ก่อนส่ง

1. `node makeskin/check_weapon_glb.mjs <skin>.glb <ref>.glb` → dummy ครบ, bbox 1.00x, **grip Δ 0.0 ซม.**
2. ภาพรวม: ย่อ texture 25% ยังอ่านลายได้
3. ภาพ 2 มุม (ข้าง/บน) — ลายไม่ถูก seam ตัดกลาง motif
4. ระยะ FPS (ใกล้): ไม่มีนอยซ์/ตัวอักษรยุ่ง
5. เปิดในเกมจริง: จำปืนได้, ไม่บังศูนย์/ไม่กลบ scope

---

## 7) แหล่งอ่าน/ดูเพิ่ม (ลิงก์ตรง)

**Riot / VALORANT dev**
- VALORANT Shaders and Gameplay Clarity — https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- The Craft and Fantasy of VALORANT Weapon Skins — https://playvalorant.com/en-us/news/dev/the-craft-and-fantasy-of-valorant-weapon-skins/
- Artists, Engineers, and the tech behind Spline — https://playvalorant.com/en-us/news/dev/artists-engineers-and-the-tech-behind-spline/
- Breathing life into Elderflame — https://playvalorant.com/en-us/news/dev/breathing-life-into-elderflame/
- How the VALORANT Arsenal was built — https://playvalorant.com/en-us/news/dev/how-the-valorant-arsenal-was-built/
- FUTURE VISION: THE GLITCHPOP STORY — https://playvalorant.com/en-us/news/dev/future-vision-the-glitchpop-story/
- Riot Tech Blog — https://technology.riotgames.com

**วิดีโอ/เบื้องหลัง**
- Animating Weapon Skins for VALORANT (Autodesk) — https://www.youtube.com/watch?v=TP1JiG0eftU
- บทความประกอบ — https://blogs.autodesk.com/media-and-entertainment/2026/10/20/riot-games-animates-valorant-with-autodesk-maya/
- Riot Artist Designs a Greek Gods' VALORANT Skin (process ของ concept artist) — https://www.youtube.com/watch?v=KMFHILAsXzo

**Tech art / breakdown**
- Lillian Li — Valorant Tech Art Shader Work (Shimmer 3-layer glitter) — https://jialin-li.artstation.com/projects/X1R5Jn
- 80.lv — Weapon Art: Design Production of Singularity Set — https://80.lv/articles/weapon-art-the-design-production-of-singularity-set-for-valorant
- 80.lv interview hub — https://80.lv/articles/interview

**ดูสไตล์/แรงบันดาลใจ**
- ArtStation: ค้น `Valorant skin concept`, `Valorant fan art`
- Valorant Wiki — Sakura Collection (ตัวอย่างธีมซากุระขาว-ชมพู) — https://valorant.fandom.com/wiki/Sakura_Collection
