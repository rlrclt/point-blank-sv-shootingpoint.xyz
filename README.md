# PB ESP — TH

Extension เสริมสำหรับ `pbmobile-th.online` (ESP overlay, aim assist, no-recoil, no-spread, fast weapon swap, mobile bypass)

- `esp.js` v1.9 · `manifest.json` 2.1.2
- ติดตั้ง: `opera://extensions` (หรือ `chrome://extensions`) → Developer mode → Load unpacked → โฟลเดอร์นี้
- เมนูในเกม: **Insert** ซ่อน/แสดง · **F7** aimbot · **F8** ESP · **F9** no-recoil

## เอกสารสำหรับนักพัฒนา

อยู่ใน [`docs/`](docs/README.md):

- [`docs/offsets.md`](docs/offsets.md) — runtime API + field/offset ทั้งหมด (player, mover, weapon, weapon system, stats, movement/camera, collision)
- [`docs/anticheat.md`](docs/anticheat.md) — anti-cheat ของ build นี้ (ตรวจอะไร, threshold, อะไรปลอดภัย)
- [`docs/development.md`](docs/development.md) — โครงไฟล์, hook point, วิธีเพิ่มฟีเจอร์, workflow วิเคราะห์ build ใหม่

## ฟีเจอร์ย่อ

| ฟีเจอร์ | ที่ตั้งค่า |
|---|---|
| ESP (box/name/hp/bone/orphan) | แท็บ ESP |
| Aimbot (FOV, smooth, bone, lock, wall check) | แท็บ AIM |
| Lock indicator (จุด/เส้น/ชื่อส่วน) | AIM → 3 toggle |
| Fast swap (50–1500 ms, reset 250) | AIM → Fast Swap |
| NoRecoil / NoSpread / Humanize | แท็บหลัก |
| Mobile bypass | checkbox ปลอมเป็น Mobile |

> ใช้เพื่อการศึกษา/ทดลองบนเซิร์ฟเวอร์ของคุณเอง — anti-cheat ฝั่งเซิร์ฟเวอร์ยังตรวจพฤติกรรมได้เสมอ
