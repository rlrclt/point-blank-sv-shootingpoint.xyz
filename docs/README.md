# pb-esp-ext — developer docs

Extension สำหรับ `pbmobile-th.online` (ES-module build)
`esp.js` v1.9 · `manifest.json` 2.1.2

## เอกสาร
| ไฟล์ | เนื้อหา |
|---|---|
| [offsets.md](offsets.md) | runtime API, field/offset ของ player/weapon/weapon-system, ค่าคงที่การเคลื่อนที่/กล้อง/ดาเมจ |
| [anticheat.md](anticheat.md) | ระบบ anti-cheat ของ build นี้ (ตรวจอะไร, รายงานแบบไหน, อะไรปลอดภัย/อันตราย) |
| [development.md](development.md) | โครงไฟล์, hook point, ลำดับการทำงาน, วิธีเพิ่มฟีเจอร์, workflow |

## TL;DR
- เกมโหลดเป็น ES module → ไม่มี `window.G` แบบ pbmobile.app; สะพานที่ใช้คือ **`window.__pb`** (เกม) และ **`window.__pbR`** (renderer)
- `esp.js` patch `__pbR.render` เพื่อ tick aim/ESP หลังเกม render
- anti-cheat ตรวจ **native function**, **worker clock**, **ค่าคงที่เกมที่ freeze**, **hp/speed**, **GL depth**, **synthetic input** — และรายงานผ่าน packet `9007`
- ของที่เราแก้เป็น **instance state** (`switchTimer`, `recoilPitch`, camera rotation ชั่วคราว) ไม่แตะ prototype/ค่าคงที่
