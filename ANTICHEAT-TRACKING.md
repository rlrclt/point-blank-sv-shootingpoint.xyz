# Anticheat Tracking — shootingpoint.xyz

> สถานะล่าสุด: 2026-11-14 · extension v1.78 · manifest 2.8.44 · commit `a727847`

## การอัปเดตฝั่งเซิร์ฟเวอร์ (เกม) ที่ตรวจพบ

| # | การอัปเดตฝั่งเกม | Build ที่เริ่มเห็น |
|---|---|---|
| 1 | Re-obfuscate guard ทุก build (เปลี่ยน hash/seed/ชื่อ decoder ทุกครั้ง) | ตลอด |
| 2 | Opcode `CHEAT_CLIENT_REQ = 9007` มีจริง — sentinel รายงานตัวเองขึ้นเซิร์ฟเวอร์ผ่าน **conn ฝั่ง chat** (ไม่ใช่ match conn) | `pb-guard-BNsnmXxt` / `index-DAprqbiY` |
| 3 | `ClientSentinel` ตรวจจับครบชุด: speed / recoil pattern / synthetic input / GL hook natives / patched natives / hp ผิดปกติ / clock drift (worker vs page) | `cB4eQTKw` → `BNsnmXxt` |
| 4 | `debugger;` probe ตรวจ devtools (pause-VM timing) ×2 จุด | `BNsnmXxt` (เพิ่มจาก 1 → 2) |
| 5 | `console.table` timing probe — วัดว่า DevTools/CDP เปิดไหม ("console X ms against 0.00 ms") | `cB4eQTKw` เป็นต้นมา |
| 6 | จับกดคีย์ DevTools (F12/Ctrl+Shift+I) + block context menu | `BNsnmXxt` |
| 7 | Auto reload หน้าเมื่อธง devtools ขึ้น (location.replace) | `BNsnmXxt` |
| 8 | `patchedNatives` check — ตรวจ WebGL2 / WebSocket.prototype.send / RTCPeerConnection / addEventListener แบบ **prototype** ว่าโดนแตะไหม | `BNsnmXxt` |
| 9 | ตรวจ synthetic input — นับ isTrusted=false, รายงานเมื่อเกินค่า | `cB4eQTKw` |
| 10 | ตรวจ recoil — นับ ≥12 นัด, floor 0.8°, share ต่ำผิดปกติ | `cB4eQTKw` |
| 11 | ตรวจ speed — จำกัด ~60% ของ maxSpeed, สุ่มตัวอย่างต่อเฟรม | `cB4eQTKw` |
| 12 | ตรวจ hp mismatch (hp ≠ maxHp นาน ๆ) + regen ผิดปกติ | `cB4eQTKw` |
| 13 | ตรวจ clock drift — worker clock เทียบ page clock, threshold 0.15 | `cB4eQTKw` |

Build ที่ผ่านมา: `pb-guard-VB8JIvzW` → `pb-guard-cB4eQTKw` (2026-11-12) → `pb-guard-BNsnmXxt` (2026-11-14) — เกมอัปเดต ~2 ครั้ง/2 วัน

## สิ่งที่เราอัปเดตตามไปแล้ว

| Commit | อัปเดตอะไร | ครอบข้อไหน |
|---|---|---|
| `0a0f96c` | guard-patched ใหม่ตาม build `fBNGYOrj` | 1 |
| `0402251` (v1.76) | console.table ตัวเร็ว (document_start) + panic ไม่ตอบสนองสัญญาณ devtools | 5, 6 (บางส่วน) |
| `bccb775` | เครื่องมือถอดรหัส guard: `dump-guard-strings.mjs` / `deob-guard.mjs` / `diff-guard-strings.mjs` | 1 (รองรับ build อนาคต) |
| `adc2010` (v1.77) | patch build `DAprqbiY` + shield ครอบ conn ฝั่ง chat (walk `__pb` หา conn-like) + ลบ `debugger;` probe | 2 (ชั้น 2), 4 |
| `a727847` (v1.78) | ฆ่า `sendCheatSelfReport` ที่ต้นทางใน guard ที่เราเสิร์ฟ (`return !1`) | 2 (ชั้น 1), 3, 9–13 ทุกอันที่รายงานผ่าน 9007 |

## ชั้นป้องกันปัจจุบัน (4 ชั้น)

| ชั้น | กลไก | ไฟล์ |
|---|---|---|
| 1 | ฆ่าตัวรายงานต้นทาง — sentinel ตรวจเจออะไรก็ส่งไม่ออก (ทั้ง 2 เส้นทางใช้ `sendCheatSelfReport` ตัวเดียว) | ผ่าน `refresh-guard.mjs` |
| 2 | AC shield ครอบ conn ทุกตัว (match + chat) — ทิ้ง opcode 9007 ระดับ wrapper | `esp.js` |
| 3 | ลบ `debugger;` probe ใน guard ที่เสิร์ฟ | ผ่าน `refresh-guard.mjs` |
| 4 | console.table ตัวเร็ว (probe วัดได้ ~0ms แม้ CDP เปิด) | `mobile-spoof.js` |

## สิ่งที่ยังไม่ได้ทำ / ทำไม่ได้

| ข้อ | สถานะ | เหตุผล |
|---|---|---|
| ข้อ 3, 9–13 ฝั่ง **server-authority ของหัวห้อง (P2P host)** | ❌ ปิดไม่ได้ | host คือเครื่องผู้เล่นอื่นที่รันเกมจริง เห็นพฤติกรรมผ่านข้อมูลเกมโดยตรง ไม่เกี่ยว packet 9007 — ต้องเล่นในกรอบ: humanize เปิด, ไม่เกิน ~60% speed, ไม่ยิงเป๊ะต่อเนื่อง |
| `mobile-spoof.js` patch `window.addEventListener` แบบ instance | ⚠ จับตา | prototype ยัง native (ปลอดภัยตอนนี้) — ถ้า build หน้าเปลี่ยนไปตรวจ instance จะโดนธง (แต่รายงานก็โดนฆ่าอยู่ดี) |
| `panicOnAc` ยังเปิด | ⚠ ตัดสินใจเอง | ปิดได้ถ้าไม่อยากให้ฟีเจอร์หายเอง แลกกับไม่มีตัวเบรกฉุกเฉิน |
| Auto-detect build ใหม่ตอนเปิดหน้าเกม | ❌ ยังไม่ทำ | ต้องรัน `node scripts\refresh-guard.mjs` มือทุกครั้งเกมอัปเดต — ตัวถัดไปที่ควรทำ (bg.js เช็ค index hash + patch เอง) |
| ตรวจ live หลัง reload v1.78 | ⏳ รอ | ต้องเปิด debug port + เข้าแมตช์ ยืนยันผล: console ไม่ควรมี `[anti-cheat]`/`[cheat]` และ `window.__pbAcBlocked` = 0 |

## สรุป

```text
รายงานตัวเอง (9007)   = ตายทั้ง 2 ชั้น ✓
probe devtools        = ตายหมด ✓
ฝั่ง host authority   = ปิดไม่ได้ → ควบคุมด้วยวิธีเล่น
เกมอัปเดตบ่อย          = รัน node scripts\refresh-guard.mjs ทุกครั้ง
```

## คำสั่งที่ใช้บ่อย

```text
node scripts\refresh-guard.mjs                 # ดึง build ใหม่ + patch + sync
node scripts\refresh-guard.mjs --check         # เช็คว่า guard-patched เก่าไหม
node scripts\diff-guard-strings.mjs <old> <new> # เทียบ detection ระหว่าง build
node scripts\dump-guard-strings.mjs <guard.js>  # แตะ string table ของ build ใดก็ได้
node scripts\deob-guard.mjs <guard.js>          # deobfuscate อ่าน logic จริง
```
