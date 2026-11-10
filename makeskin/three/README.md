# Valentine skin — three.js shader set

ชุด shader ที่ทำตามหน้าตาในเรนเดอร์ Blender

## ไฟล์

```
three/valentineSkin.js     <- ตัว shader / material / sparkle field
preview_valentine.html     <- หน้าตัวอย่างที่โหลดกล่อง .glb นี้จริง
tex/sea3123_zombieslayer/
  skin_valentine_diff.png      base color (sRGB)
  zombie_slayer_norm.png       normal map (linear)
  skin_valentine_orm.png       R=AO  G=roughness  B=metalness (linear)
  skin_valentine_emissive.png  emissive (sRGB)
zombie_slayer_valentine.glb
```

## วิธีเปิด

`fetch()` ของ `.glb` ถูกบล็อกถ้าเปิดด้วย `file://` ต้องเสิร์ฟผ่าน http:

```powershell
cd makeskin
python -m http.server 8000
# เปิด http://localhost:8000/preview_valentine.html
```

ลากเพื่อหมุน · scroll เพื่อซูม

## ใช้ในโปรเจกต์อื่น

```js
import { ValentineSkin, setupValentineStudio } from './three/valentineSkin.js';

setupValentineStudio(renderer, scene);          // ไฟชุดเดียวกับที่ใช้เรนเดอร์

const skin = new ValentineSkin({ basePath: './tex/sea3123_zombieslayer' });
await skin.load();
skin.apply(gltf.scene);                          // แทน material ทุก mesh + ใส่ sparkle
scene.add(gltf.scene);

// ใน loop
skin.update(clock.getElapsedTime());
```

## อะไรอยู่ใน material

| ส่วน | ค่า | ที่มา |
|---|---|---|
| base / normal / emissive | texture ตรงจาก Blender | Paint ใหม่ตาม UV island |
| roughness / metalness | ORM map | โลหะ 0.16/1.0, แลคเกอร์ 0.42/0.0, ลายกุหลาบ 0.58/0.0 |
| `iridescence` | 1.0, IOR 1.55, 140–560 nm | thin film ของ Blender |
| `clearcoat` | 0.45 / 0.10 | Coat Weight |
| `sheen` | 0.55 ชมพู | ขอบนุ่มแบบกำมะหยี่ |
| glitter | hash ตาม UV × Fresnel | แทนประกายที่หายไปตอน export |
| sparkles | `Points` additive 4 แฉก | แทน `VALENTINE_FX` ใน Blender |

## หมายเหตุ

- glTF โหลดมาแล้วต้อง `texture.flipY = false` (โมดูลตั้งให้แล้ว)
- sparkle เก็บตำแหน่งจาก vertex จริงของปืน แล้วแปลงเข้า local space ของ root
  จึงหมุนตามโมเดลได้โดยไม่ต้องคำนวณซ้ำ
- ถ้าอยากได้แรงกว่านี้ปรับ `sparkleStrength`, `emissiveIntensity`, `iridescenceMax`
