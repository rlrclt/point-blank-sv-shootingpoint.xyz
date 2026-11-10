# PB ESP — TH

Extension เสริมสำหรับ `pbmobile-th.online` (ESP overlay, aim assist, no-recoil, no-spread, fast weapon swap, mobile bypass)

- `esp.js` v1.70 · `manifest.json` 2.8.35
- ติดตั้ง: `opera://extensions` (หรือ `chrome://extensions`) → Developer mode → Load unpacked → โฟลเดอร์นี้
- เมนูในเกม: **Insert** ซ่อน/แสดง · **F7** aimbot · **F8** ESP · **F9** no-recoil · **F10** panic (ปิดทุกฟีเจอร์ + ซ่อนแผง)

## เอกสารสำหรับนักพัฒนา

อยู่ใน [`docs/`](docs/README.md):

- [`docs/offsets.md`](docs/offsets.md) — runtime API + field/offset ทั้งหมด (player, mover, weapon, weapon system, stats, movement/camera, collision)
- [`docs/anticheat.md`](docs/anticheat.md) — anti-cheat ของ build นี้ (ตรวจอะไร, threshold, อะไรปลอดภัย)
- [`docs/development.md`](docs/development.md) — โครงไฟล์, hook point, วิธีเพิ่มฟีเจอร์, workflow วิเคราะห์ build ใหม่
- [`scripts/refresh-guard.mjs`](scripts/refresh-guard.mjs) — ตรวจ/patch guard อัตโนมัติ (`--check`, `--sync`)
- [`pbrecon/refresh.mjs`](pbrecon/refresh.mjs) — ดึง bundle สดลง `pbrecon/live/`

## หมวดหมู่ในแผง (GUI)

แท็บถูกแบ่งเป็น:

| แท็บ | มีอะไร |
|---|---|
| CORE | FPS counter, ปลดล็อก FPS, ปลอมเป็น Mobile |
| COMBAT | NoRecoil, NoSpread, Humanize (ทิศขึ้น/ลง + ความแรง) |
| AIM | aimbot, preset, จุดเล็งละเอียด (หัว/คอ/อก/เอว/มือ/แขน/ขา/เท้า), จุดห้ามล็อค, laser ตามกล้องตอนล็อก |
| ESP | overlay + สี/ความหนา/ระยะวาด/ขนาดชื่อ/แสดงเพื่อน |
| WEAPON | fast swap, bonus swap/reload |
| SAFETY | master switch, คีย์ลัด, bridge, Anti-Cheat, panic |

> - ชิป **ESP ON/OFF** ที่หัวแผง = เปิด/ปิด master (F8)
> - ชิป **AC** = สถานะ AC shield — คลิกไป SAFETY
> - แถบสรุปด้านล่างแสดงฟีเจอร์ที่เปิดอยู่
> - แผงจำตำแหน่ง + แท็บล่าสุด และ scroll แยกตามแท็บ
> - PANIC ต้องกด 2 ครั้งภายใน 2 วินาที
> - ตัวเลือกที่ยังไม่เปิดจะถูก disable (slider ไม่ทำงานจนกว่าจะเปิดฟีเจอร์)

## AIM — จุดเล็งละเอียด

- จุดเล็ง: `head`, `neck`, `chest`, `pelvis`, `upperarm`, `forearm`, `hand`,
  `thigh`, `shin`, `foot`, `auto`
- ชื่อกระดูกของเกมเป็นแบบ `R UpperArm`, `L Forearm`, `L Calf` — ตัวจับคู่
  normalize ช่องว่าง/ขีดแล้ว จึงแยกต้นแขน/ปลายแขน/ต้นขา/น่องได้จริง
- ถ้า hitbox มีแค่โซน coarse (arm/leg) จะเติมกระดูกแขน/ขาจาก skeleton ให้
- **auto** = เลือกส่วนที่เห็นจริง + ใกล้ crosshair ที่สุด (ตรวจได้ถึง 16 จุด
  ต่อเป้า จึงล็อคขา/แขนได้แม้ส่วนอื่นถูกกำแพงบัง)
- ไม่ตัดทั้งตัวด้วย `actor.occluded` อีกต่อไป — ตรวจการมองเห็นทีละส่วน
  (ครึ่งตัวโผล่ก็ล็อคส่วนที่โผล่ได้)
- **ห้ามล็อค** = ติ๊กส่วนที่ไม่ต้องการให้ auto เลือก
  (หัว/คอ/ลำตัว/ต้นแขน/ปลายแขน/มือ/ต้นขา/น่อง/เท้า)
- ถ้าเลือกจุดเฉพาะแล้วไม่เห็น จะ fallback ไปส่วนที่เห็นตามลำดับของโซน
  (ปิด Smart Zone เพื่อล็อคเฉพาะส่วนที่เลือกเท่านั้น)
- **เผื่อสิ่งกีดขวาง** (0–0.35 m) = ยิงจุดรอบเป้าเพิ่มเมื่อ ray หลักชนขอบ/ราว
  ทำให้ล็อคผ่านช่องเล็ก ๆ ได้โดยไม่ทะลุกำแพงหนา

## SPAWN — ปิดใช้งานแล้ว (v1.66)

แท็บ SPAWN ถูกถอดออกหลังทดสอบกับ server จริง สรุปผล:

| วิธี | ผล |
|---|---|
| ตั้ง respawn loadout เป็นปืนที่ไม่ได้อยู่ในบัญชี | ❌ server ดีดกลับเป็นปืนเดิม |
| ส่ง `sendHit` ด้วย ID ปืนที่เสก | ❌ server ทิ้ง hit (ยิงไม่เข้า) |
| `sendPickup` ปลอม (ช่องว่าง/ไม่ว่าง) | ❌ server ไม่ broadcast กลับ |
| `sendDrop` + `sendPickup` ปลอม | ❌ server ไม่รับทั้งคู่ |
| หยิบปืนจริงจากพื้น (คนอื่นตาย) | ✅ ได้ดาเมจจริง |
| proxy เป็นปืนที่ server ack (ใช้เฉพาะปืนในบัญชี) | ✅ ดาเมจเข้า |

สาเหตุ: server ไม่ยอมให้ client ประกาศเองว่าถือปืนอะไร — มันรู้จาก respawn loadout
ที่ allocate ให้ตามบัญชี และของตกที่เกิดจากผู้เล่นตายเท่านั้น

ปืนที่เสกด้วย client จึงไม่มีทางถูกนับเป็นเจ้าของจากฝั่งเรา ถ้าต้องการปืนนอกบัญชี
ต้องหยิบจากพื้นเท่านั้น

## FPS unlock

เกมเก็บค่า FPS limit ไว้ใน localStorage:

```text
pb.settings               (desktop)
pb.settings.mobile.v1     (mobile spoof)
  └─ fpsCap: 0 | 30 | 60 | 90 | 120 | 144
```

`0` = Unlimited — render loop จะข้าม limiter ของเกม (`te.due()`)

- เปิด **CORE → ปลดล็อก FPS** → เขียน `fpsCap` ตาม **เพดานเฟรม** ที่เลือก
- **เพดานเฟรม = ตามจอ (auto)** → วัด refresh rate จาก rAF แล้วตั้งให้เท่านั้น
- เลือกเลขเองได้ (60/75/90/120/144/165/240) หรือ `0` = ไม่จำกัด
- ต้อง **F5** หนึ่งครั้ง เพราะ settings module อ่านค่าตอน boot
- แผงจะแสดง `จอ ≈ N Hz · cap = ...` ใต้ checkbox

> **อาการภาพฉีก/เส้นหยัก (`tearing`)** เกิดเมื่อเฟรมไม่ sync กับจอ:
> `fpsCap = 0` + เปิด Brave ด้วย `--disable-gpu-vsync` → เฟรมวิ่งเร็วกว่า refresh
> แก้โดยตั้งเพดานเฟรม = refresh rate ของจอ (เช่น 75/144/165) หรือปิด flag vsync

> ถ้าตั้ง Unlimited แล้วยังได้ 75 แปลว่า **จอ 75Hz / rAF vsync lock** —
> หน้าเว็บเดียวไปเกิน refresh rate ไม่ได้ ต้องเปิดเบราว์เซอร์ด้วย
> `--disable-gpu-vsync --disable-frame-rate-limit`

ตัวช่วยเปิด Brave (ปิด Brave ให้หมดก่อน — flag มีผลเฉพาะ process ใหม่):

```powershell
scripts\brave-fps.cmd          # vsync ON  → ภาพเนียน ไม่มี tearing (แนะนำ)
scripts\brave-fps-nosync.cmd   # vsync OFF → FPS เกิน refresh ได้ แต่มี tearing
```

## ฟีเจอร์ย่อ

| ฟีเจอร์ | ที่ตั้งค่า |
|---|---|
| GUI หมวดหมู่ (CORE / COMBAT / AIM / ESP / WEAPON / SAFETY + กด `+` เพิ่มหมวดเอง) | แถบแท็บด้านบนแผง |
| ESP (box/name/hp/bone/orphan) | แท็บ ESP |
| Aimbot (FOV, smooth, bone, lock, wall check) | แท็บ AIM |
| Lock indicator (จุด/เส้น/ชื่อส่วน) | AIM → 3 toggle |
| Fast swap (50–1500 ms, reset 250) | AIM → Fast Swap |
| Panic (F10) | SAFETY |
| NoRecoil / NoSpread / Humanize | COMBAT |
| ระดับลดแรงดีด / ระดับกระสุนตรง (0–100%) | COMBAT → สไลเดอร์ + ช่องกรอกเลข (Enter เพื่อใช้ค่า) |
| สะบัดให้คนดูเห็น (0–1.5°) | COMBAT → ใต้ Humanize (ใส่ offset จริงหลังยิง) |
| Mobile bypass | checkbox ปลอมเป็น Mobile |

> ใช้เพื่อการศึกษา/ทดลองบนเซิร์ฟเวอร์ของคุณเอง — anti-cheat ฝั่งเซิร์ฟเวอร์ยังตรวจพฤติกรรมได้เสมอ
