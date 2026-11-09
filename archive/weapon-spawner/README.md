# Weapon Spawner — archived

เก็บโค้ดระบบเสกปืนที่ถูกถอดออกจาก `esp.js` เมื่อ **v1.47 (2026-11-09)**
และ Server Check ที่ถูกถอดใน **v1.48**

ไฟล์ในโฟลเดอร์นี้:

- `spawner.js` — UI + CFG + ฟังก์ชัน/handler ของระบบเสกปืน
- `server-check.js` — SAFETY → Server Check (CHECK / COPY ALLOWED / COPY DB)

## ทำไมถึงถอด

- ระบบเสกปืนไม่ถูกใช้งานแล้ว
- host รับเฉพาะไอเท็มใน respawn inventory ของ server (`adoptServerLoadout`)
  ทำให้กระบอกที่เสกนอก inventory ถูกทับ/ไม่คิดดาเมจ
- หน้า Server Owner บนเว็บใช้รายการจากเกมแทน

## สิ่งที่ถูกถอดออก

| ส่วน | รายละเอียด |
|---|---|
| WEAPON pane | ช่องค้นหา, ตัวกรอง slot, รายการปืน, ช่อง Spawn ID, checkbox `spawn*` ทั้งหมด |
| SAFETY pane | `Anti-detection` (Safe Mode, cooldown, max/min) |
| CFG | `spawnSwitch`, `spawnSync`, `spawnProxy`, `spawnOwnedSync`, `spawnPickup`, `spawnReapply`, `spawnPersist`, `spawnOwnedOnly`, `spawnDamageOnly`, `safeMode`, `spawnCooldownMs`, `spawnMaxPerMin` |
| JS | state (`spawn*`), `spawnWeapon()`, `spawnAsPickup()`, proxy hooks, `reapplySpawns()`, `renderSpawnList()`, ปุ่ม/handler ทั้งหมด |
| Panic / interval | การ reset state และ `ensure*Hook()` ที่เกี่ยวกับ spawn |

## สิ่งที่ **เก็บไว้** ใน `esp.js`

- `serverAllIds()` / `serverOwnedIds()` — ใช้ส่งรายการให้หน้าเว็บ Server Owner
- `serverAllowedSet()` — ใช้ปุ่ม `COPY ALLOWED`
- `serverCheck()` / `COPY DB` — ใช้ตรวจ inventory/ack loadout
- bridge ไปหน้า options (`__pbGetServerOwned`, `__pbOpenServerSite`)
- Custom categories — เปลี่ยนปุ่มเป็นการ **คัดลอก ID** แทนการเสก

## วิธีเอากลับ

1. เปิด `spawner.js` ในโฟลเดอร์นี้
2. คัดลอกแต่ละส่วนกลับเข้า `esp.js` ตามหัวข้อ:
   - CFG defaults → ใน object `CFG`
   - WEAPON markup → ก่อน `<div class="pbSec">Fast Swap</div>`
   - SAFETY markup → ก่อน `<div class="pbSec">Bridge</div>`
   - JS block → หลัง `bonusTick()` ก่อน `server inventory`
   - panic/interval lines → ใน `panicNow()` และ `setInterval(...)`
3. ถ้าจะให้ custom categories เสกปืนได้อีกครั้ง ให้เปลี่ยน `b.addEventListener` ใน `customButtonRow()`
   จาก `copyText(...)` กลับเป็น `spawnWeapon(item.id)`
4. `node --check esp.js` แล้ว reload extension

## หมายเหตุ

- `spawner.js` เป็นโค้ด ณ ตอนถอด (v1.46) ไม่มีการแก้ไข
- `const SPAWN_KEYS = [...]` ยังอยู่ใน `esp.js` (ใช้โดย Server Check / COPY)
  ตอนกู้คืนอย่าเพิ่มซ้ำ
- ระบบนี้พึ่ง `pb.pbWeapons().db`, `ws.equip()`, `ws.refill()` และ proxy ของ `pb.net`
  ซึ่งเป็น API ภายในของ build `index-DxpkJc0_` — build ใหม่ต้องตรวจซ้ำก่อนใช้
