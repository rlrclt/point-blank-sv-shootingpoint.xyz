# Prompt ชุด Spider-Man (Pindad SS3) — 4K

> ใช้กับ `pindad_ss3_diff.png` (1024² → gen ที่ 4096²) และ `combat_sight_mepro_x6_diff.png` (512² → 2048²)
> หัวใจสำคัญ: **ส่งภาพ atlas เดิมเป็น reference / img2img** แล้วสั่ง "restyle only" — ถ้า gen จาก texto ล้วน
> AI จะจัดหน้าใหม่ แล้วลายจะไปผิดชิ้น

---

## 1) Classic Suit (แดง-น้ำเงิน) — แนะนำ

```
restyle this weapon texture atlas into a Spider-Man inspired suit skin.
Keep the exact same UV layout, part placement and scale, do not rearrange or move any panel.
Flat full-bleed UV sheet, no perspective, no 3D shading, no background.
Deep crimson red and navy blue compressive fabric panels, thin raised black webbing grid
across the red areas, subtle hexagon micro-texture on the blue areas, small white eye-lens
shape accents as graphic decals, crisp vector edges, high contrast, clean panel lines,
premium game skin quality, 4K, no text, no logo, no faces, no characters, no hands
```

## 2) Symbiote / Black Suit

```
restyle this weapon texture atlas into a black symbiote suit skin, Venom-like glossy texture.
Keep the exact same UV layout, part placement and scale, do not rearrange any panel.
Flat full-bleed UV sheet, no perspective, no 3D shading.
Pitch black organic texture with wet glossy highlights painted flat, thin silver-white
webbing veins branching across panels, deep purple undertone in the shadows,
spider emblem silhouette accents as abstract shapes only, crisp vector edges,
high contrast, clean panel lines, premium game skin quality, 4K,
no text, no logo, no faces, no characters
```

## 3) Spider-Verse (กราฟิก/ halftone)

```
restyle this weapon texture atlas into a Spider-Verse inspired comic skin.
Keep the exact same UV layout, part placement and scale, do not rearrange any panel.
Flat full-bleed UV sheet, no perspective.
Bold red and blue color blocking, black ink webbing, visible halftone dot shading,
slight CMYK misregistration offset for a printed comic look, thick black outlines on
panel shapes, crisp edges, punchy contrast, 4K, no text, no logo, no faces
```

---

## Negative prompt (ใส่ทุกครั้ง)

```
text, letters, watermark, logo, signature, face, character, hand, gun, 3D render,
perspective, drop shadow, blurry, noisy, low contrast, jpeg artifacts, extra panels,
rearranged layout, cropped parts
```

## ค่าที่ตั้ง

| ค่า | ตัวปืน | ศูนย์เล็ง |
|---|---|---|
| ขนาด | **4096×4096** | **2048×2048** |
| Aspect | 1:1 (ห้ามเปลี่ยน) | 1:1 |
| Reference / img2img | `pindad_ss3_diff.png` | `combat_sight_mepro_x6_diff.png` |
| Strength (ถ้ามี) | 0.55–0.7 (คง layout) | 0.55–0.7 |

## เช็คก่อนใช้

- [ ] layout ตรงกับต้นฉบับ (วางภาพเทียบ 50/50)
- [ ] ไม่มีตัวอักษร/โลโก้หลงเหลือ
- [ ] ขอบ atlas แต่ละชิ้นยังอยู่ตำแหน่งเดิม (ถ้าเหลื่อม ลายจะไปทับกัน)
- [ ] คมพอที่ 1024 (ย่อดู 25% แล้วยังอ่านลายได้)

## หลังได้ภาพ

วางทับใน `remake\` ชื่อเดิม → บอกผม (ผมใส่ Base Color, ทำ normal จาก diff, export GLB + checker)
