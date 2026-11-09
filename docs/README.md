# PB ESP - TH — docs

เอกสารของ extension `PB ESP - TH` (Chrome MV3) สำหรับ `shootingpoint.xyz`

## TL;DR

- เกมโหลดเป็น ES module → สะพานที่ใช้คือ **`window.__pb`** (เกม) และ **`window.__pbR`** (renderer)
- `esp.js` patch `__pbR.render` เพื่อ tick aim/ESP หลังเกม render
- anti-cheat ตรวจ **native function**, **worker clock**, **ค่าคงที่เกมที่ freeze**, **hp/speed**, **GL depth**, **synthetic input**
- ของที่เราแก้เป็น **instance state** (`switchTimer`, `recoilPitch`, camera rotation ชั่วคราว) ไม่แตะ prototype/ค่าคงที่
- mobile bypass มี 4 ชั้น — ดู [MOBILE-BYPASS.md](./MOBILE-BYPASS.md)

## อ่านอะไรก่อน

| ไฟล์ | เนื้อหา |
|---|---|
| [MOBILE-BYPASS.md](./MOBILE-BYPASS.md) | ทำให้เกมเห็นเป็น mobile — 4 ชั้น, periph guard, DNR headers, วิธีตรวจ, troubleshooting |
| [AIM-AND-ESP.md](./AIM-AND-ESP.md) | จุดเล็งจาก hitbox จริง, zone bias / Smart Zone, LOS จากกล้อง, lock release, `__pbAimProbe()` |
| [DEVELOPMENT-NOTES.md](./DEVELOPMENT-NOTES.md) | บันทึกการพัฒนารอบนี้ — tools, หลักการ, เคสปัญหาและวิธีแก้, harness, checklist |
| [PBNEO-ANALYSIS.md](./PBNEO-ANALYSIS.md) | วิเคราะห์ `pbneo.app` — Unity WebGL, ใช้สองโปรเจกต์เดิมไม่ได้, แผน `pbneo-ext` |
| [PB-OFFLINE-ANALYSIS.md](./PB-OFFLINE-ANALYSIS.md) | decompile server PB-OFFLINE — 518 packet classes, 319 opcodes, `IsMobile`, ใช้กับ pbneo ได้แค่ไหน |
| [PBNEO-BUILD-METADATA.md](./PBNEO-BUILD-METADATA.md) | ตรวจ build จริง — IL2CPP metadata v108 อยู่ใน `.data`, class ไม่ถูก strip, แผน Il2CppDumper |
| [development.md](./development.md) | โครงไฟล์, ลำดับการทำงานของ `esp.js`, วิธีเพิ่มฟีเจอร์ |
| [anticheat.md](./anticheat.md) | anti-cheat ของ build `pbmobile-th.online` (static analysis) |
| [ANTI-CHEAT-UPDATE.md](./ANTI-CHEAT-UPDATE.md) | สรุป build 2026-11: guard ซ่อน `__pb`, DNR 9102 + `guard-patched.js`, วิธีสแกนรอบถัดไป |
| [offsets.md](./offsets.md) | offsets / runtime values จาก `pbrecon/` |
| [WEAPON-SPAWN-LIST.md](./WEAPON-SPAWN-LIST.md) | สรุปฐานอาวุธ, ตัวกรอง owned/damage, วิธี export CSV ของปืนที่ server ยอมรับ |

## โครงสร้างไฟล์

```
manifest.json     MV3 — permissions, host_permissions, background, content_scripts
bg.js             service worker — dynamic DNR rule 9101 (UA / CH headers)
mobile-spoof.js   MAIN world, document_start — navigator/matchMedia spoof + periph guard
injector.js       ดัน esp.js เข้า page world
esp.js            ESP overlay + aim + no-recoil + GUI
docs/             เอกสารชุดนี้
pbrecon/          bundle ของเกม (อ่านอย่างเดียว, ใช้อ้างอิง API)
```

## Version ปัจจุบัน

- extension: **2.8.26**
- `esp.js`: **v1.61**

## Quick checks

```js
__pbMobileState()   // สถานะ bypass: spoof / pcFlag / guardDropped
__pbAimProbe()      // ทุกจุดเล็ง: zone / bone / angle / score / visible
```

service worker console ต้องเห็น `[PB] dnr true rule 9101 active`

## โหลดใหม่หลังแก้

```
chrome://extensions → PB ESP - TH → reload
```

- แก้ `bg.js` / `manifest.json` → ต้อง reload extension ทุกครั้ง
- แก้ `esp.js` / `mobile-spoof.js` → reload extension + เปิดแท็บเกมใหม่
- ตรวจ header ที่ F12 → Network → Request Headers
