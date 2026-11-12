# เอฟเฟกต์พิเศษของสกินปืน (muzzle FX) — ไล่จากเกมจริง

> แหล่งข้อมูล: `https://shootingpoint.xyz/assets/weapons/fx/weaponfx.json` (3.7 MB)
> บันทึกสำเนาไว้ที่ `pbrecon\special-fx.json` (สร้างจาก weaponfx.json + site/data/items.json)
> โค้ดฝั่งเกมที่อ่าน: `pbrecon\live\audio-*.js` (render FX) และ `pbrecon\main-*.js` (muzzle tint)

## ทำไม M1887 Element Water ยิงแล้วแฟลชสีฟ้า

เอฟเฟกต์ปากกระบอก**ไม่ได้อยู่ในไฟล์โมเดล .glb** — เกมอ่านจาก `weaponfx.json` โดยใช้ **weapon itemId**
เป็น key:

```json
"106246": {   // M1887 Element Water
  "fire": "sea3123:Fir_Element_Water",          // ชุดเสียง/FX ตอนยิง (ธาตุน้ำ)
  "smoke": { "color": [0, 176, 240, 255], ... } // สีแฟลชที่เห็น = น้ำเงิน water-blue
}
```

- `smoke.color` = สีแฟลชที่มองเห็นที่ปากกระบอก — สีฟ้า `[0,176,240]` ของ Element Water
- `fire` = id ของชุดเอฟเฟกต์/เสียง ใน `effects` ของไฟล์เดียวกัน (มี 337 ชุด)
- สกินธรรมดาส่วนใหญ่ใช้ FX มาตรฐานของตระกูล เช่น M1887 → `sea3123:Fir_Sg_870MCS`
  สีแฟลชมาตรฐาน = ขาวอมฟ้า `[194,209,255,80]` / `[255,255,255,100]` / `[255,211,211,255]`
- แปลว่า: สกิน .glb ที่เราทำเอง **ทำแฟลชสีไม่ได้** — FX ผูกกับ itemId ของปืนจริงในเซิร์ฟ
  (สีฟ้าตอนยิงของผู้เล่น = คอสเมทิก muzzle color item 1600187 ทำงานกับทุกปืน)

## skin ที่มีเอฟเฟกต์พิเศษ (นับได้จากไฟล์)

**เกณฑ์ "พิเศษ"** = สีแฟลชต่างจากมาตรฐาน 3 สีขาว หรือชุด FX `fire` ต่างจากของมาตรฐานตระกูล

| ประเภท | จำนวน skin | ความหมาย |
|---|---|---|
| แฟลชสีพิเศษ (`smoke.color`) | 422 | เห็นสีชัดตอนยิง: แดง 154 รายการ, เขียว 47, ม่วง 34, ทอง 21, ฟ้าน้ำ 8, ดำ 8, ชมพู ฯลฯ |
| ชุด FX ยิงเฉพาะตัว (`fire` ไม่ตรงมาตรฐานตระกูล) | 956 | เสียง/particle ตอนยิงเป็นชุดของตัวเอง เช่น `Fir_Element_Water`, `Fir_Valentine_Star`, `Fir_Digital`, `Fir_Surfing` |
| FX ยิงนัดแรก (`fire1st`) | 102 | นาทีแรกของเกมมีเสียง/FX เฉพาะ (เช่น SG550) |
| tracer พิเศษ (`tracerType`) | 82 | 1 = TracerHandGrenade / 4 = TracerSmoke / 5 = TracerFlash |

**ตัวอย่างที่โดดเด่น (ตระกูล M1887):**
- Element Fire/Water/Light/Nature — แฟลชธาตุไฟ/น้ำ/แสง/ธรรมชาติ + ชุด FX เฉพาะ
- Demonhunter, X MAS2018, Lycan, Kambing, LATIN9 — แฟลชแดง
- Bull, Gls, PBTC2017, Deadly Hydra, PBIC2024 Neon — ทอง/ม่วง
- Pinkypig — ชมพู `[255,0,221]`, Crow — ดำ `[33,33,33]`

**ตระกูลที่มี skin FX พิเศษเยอะสุด:** AUG (107), Kriss Super V, OA-93, CheyTac M200,
SC-2010, Tactilite T2, T77, P90, M1887 (52), Zombie Slayer (24 จาก 62)

## เอฟเฟกต์ตอนโดนที่ฮาร์ดโค้ดใน client (weapon hit FX)

โค้ดเกมมี Set พิเศษ: `[103178, 104170, 104171, 105099, 118046]` = ชุด **Evilcupid**
(AUG A3 / CheyTac M200 / Kriss Super V Evilcupid) — เมื่อกระสุนโดนตัวละคร
spawn FX หัวใจ `Hit_CoupleBreaker_Heart` เพิ่มจาก FX โดนปกติ — อันนี้ฮาร์ดโค้ดใน JS
ไม่ผ่าน weaponfx.json ด้วย

## สรุปสำหรับงานสกินของเรา

- ทำสกิน .glb เองได้แค่ **รูปหน้าตา + UV** — แฟลชสี/ชุด FX ตอนยิง ตาม itemId จริงของปืน
- ถ้าอยากเห็นสีพิเศษตอนยิง: ใช้คอสเมทิก muzzle color ของบัญชี (ติดทุกปืน) หรือถือปืน
  ที่มี FX ในตัวจากรายการข้างบน
- ข้อมูลดิบทั้งหมด: `pbrecon\special-fx.json` (fields: colored_flash / custom_fire /
  fire1st / tracer — แต่ละรายการมี name, family, cls, itemId)
