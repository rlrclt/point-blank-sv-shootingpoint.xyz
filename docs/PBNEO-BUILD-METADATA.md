# pbneo — ตรวจ build จริง (metadata ฝั่ง client)

> ตรวจเมื่อ 2026-11-05 จาก build ที่ `play.pbneo.app` serve จริง
> ไฟล์: `desktop/Build/*` (โหลดมาแล้ว 33 MB wasm + 15 MB data)

---

## 1. คำตอบเรื่อง "offset เดียวกันไหม"

**ไม่ใช่ค่าเดียวกัน** — แต่ **ไม่ต้องใช้ offset ของ PB-OFFLINE เลย** เพราะ build web มี offset ของตัวเองที่ดึงออกมาได้

| โลก | หน่วยความจำ | offset |
|---|---|---|
| PB-OFFLINE (PC client) | native x86, i3Engine C++ | offset static |
| **pbneo (web)** | Unity IL2CPP → **wasm linear memory** | offset ตาม IL2CPP metadata ของ build นี้ |
| server | packet | ไม่มี offset |

offset ของ C++ client ย้ายข้ามไป wasm ไม่ได้ (คนละ compiler, คนละ runtime, คนละ layout)
แต่ **IL2CPP เก็บ metadata ที่บอก offset ทุก field ไว้ใน build เอง** → เราไม่ต้องเดา

---

## 2. หลักฐาน: build เก็บ metadata ไว้ครบ

```
https://play.pbneo.app/desktop/Build/
  62add…loader.js
  fd025…framework.js.br     418 KB   (decompressed)
  7dba9…wasm.br          33,332,924 B  ← head: 00 61 73 6d (wasm)
  a9296…data.br          15,218,788 B  ← head: "UnityWeb..."
```

สแกน `data`:

| ตรวจ | ผล |
|---|---|
| IL2CPP magic `AF 1B B1 FA` | **พบ @ offset 4,141,894** |
| metadata version | **108** |
| `Assembly-CSharp` | พบ |
| `global-metadata` | พบ |
| `PB.Client` | พบ |
| จำนวน string | 149,110 |

สแกน `wasm`:

| ตรวจ | ผล |
|---|---|
| `UnityEngine` | พบ |
| `il2cpp` | พบ |
| `PB.Client` | พบ |

⇒ **ไม่ใช่ build ที่ strip metadata** — Il2CppDumper ใช้ได้

---

## 3. ชื่อ class ที่เจอ (สำคัญมาก)

```
PB.Client.Battle.BattleActor          ← ตัวละครใน battle
PB.Battle.Camera                      ← กล้อง (view matrix)
PB.Battle.Sim / PB.Battle.Views       ← simulation / rendering
PB.Hitbox                             ← hitbox
PB.Character
PB.AllyMark                           ← marker เหนือหัว
PB.Hud.NameTags                       ← nametag (จุดอ้างอิงโปรเจกต์)
PB.Hud.Minimap
PB.DroppedHelmet / PB.DroppedHelmets
PB.WeaponLoading / PB.Tracer / PB.LaserBeam
PB.Client.Platform.MobileWeb
PB.Client.Input.TouchDevice / InputRouter
PB.Client.Rendering.* (QualityTier, PBShaderSafety, …)
```

assemblies ที่ ship:

```
PB.Protocol.dll      ← โครง packet (ตรงกับ server)
PB.Gameplay.dll
PB.Client.dll
PB.Client.Battle.dll
PB.Client.App.dll
PB.Client.Session.dll
PB.Client.UI.dll
UnityEngine.* + Unity.InputSystem + URP + Addressables
```

### 3.1 เจอ "mobile" ใน client จริง

```
PB_PORT_SERVER_MOBILE_ONLY
PB_PORT_CHANNEL_CLAN_ONLY
PB.Client.Platform.MobileWeb
PB.Client.Input.TouchDevice
PB.Client.App.Mobile.TouchBattleBridge
PB.Client.UI.UIMobileFrontend
```

⇒ client มีแนวคิด **พอร์ต mobile-only** อยู่จริง (ตรงกับ `serverchannels.ismobile` ใน PB-OFFLINE)
⇒ "mobile bypass" บน pbneo = ทำให้ client ไปพอร์ต mobile ได้ ไม่ใช่เรื่องหัวข้อสมมติ

---

## 4. ผลต่อแผนงาน

### 4.1 ESP — ทำได้จริง และไม่ต้องเดา offset

```
1. carve global-metadata.dat จาก .data (offset 4,141,894)
2. Il2CppDumper(wasm, global-metadata.dat) → dump.cs + script.json
3. ได้: class → field offset, static field, method RVA
4. runtime: ดัก window.createUnityInstance → เก็บ u.Module.HEAPU8
5. อ่าน object: pointer chain จาก static field → instance → field
6. projize 3D→2D ด้วย matrix จาก PB.Battle.Camera
```

สิ่งที่ต้องหาใน dump:

| ต้องการ | class ที่น่าจะใช่ |
|---|---|
| ตำแหน่งผู้เล่น/ศัตรู | `PB.Client.Battle.BattleActor` |
| ทีม / ชื่อ / HP | `BattleActor` fields |
| view/projection matrix | `PB.Battle.Camera` |
| hitbox (head/body) | `PB.Hitbox` |
| กล้องของเรา | `PB.Battle.Camera` instance |

### 4.2 Aim — ทำได้ 2 ทาง

| ทาง | วิธี | ความเสี่ยง |
|---|---|---|
| A | เขียนค่ามุมกลับเข้า managed object (pitch/yaw) ผ่าน HEAP | ต้องรู้ field, อาจ crash |
| B | synthetic mouse ผ่าน `InputRouter` (client ใช้ Input System) | ต้องดูว่า client รับ `PointerEvent` หรือ `UnityEngine.InputSystem` |

### 4.3 Mobile bypass — ทำได้ที่ชั้น client

`PB.Client.Platform.MobileWeb` + `TouchDevice` + `PB_PORT_SERVER_MOBILE_ONLY`
⇒ ต้องดูว่า client ตัดสิน "mobile" จากอะไร (มี `MobileWeb` class ให้ตาม)
ซึ่งเราอ่านโค้ดได้จาก dump.cs (IL2CPP decompile)

---

## 5. PB-OFFLINE ยังมีค่าตรงไหน

| ใช้ | ไม่ใช้ |
|---|---|
| protocol/opcode/field layout (518 classes) | offset หน่วยความจำ |
| ความหมายของค่า (ดาเมจ, hitbox zone, กติกา) | client execution |
| รัน lab ท้องถิ่นเพื่อ capture ของจริง | เล่น pbneo |

เพราะ `PB.Protocol.dll` ฝั่ง client ควรตรงกับ `PROTOCOL_*` ฝั่ง server
⇒ ใช้ server decompile เป็น "ดิกชันนารี" ของ packet แล้วเทียบกับ client

---

## 6. ขั้นตอนถัดไป (ลำดับที่ควรทำ)

**S1 — Dump metadata (½ วัน)**

```bash
# 1) carve global-metadata.dat
node -e "const fs=require('fs');const b=fs.readFileSync('data');const m=Buffer.from([0xAF,0x1B,0xB1,0xFA]);const o=b.indexOf(m);fs.writeFileSync('global-metadata.dat', b.slice(o));console.log(o)"

# 2) Il2CppDumper (release ล่าสุดรองรับ wasm)
Il2CppDumper.exe wasm global-metadata.dat out/
```

ผลลัพธ์: `dump.cs` (ทุก class + field offset), `script.json`, `il2cpp.h`

**S2 — หา entry point ใน runtime**

```js
// ต้องดักก่อน loader เรียก
let real = window.createUnityInstance;
Object.defineProperty(window, "createUnityInstance", {
  configurable: true,
  get: () => (...args) => real(...args).then(u => (window.__pbUnity = u, u)),
  set: v => { real = v; }
});
// u.Module.HEAPU8 / HEAPF32 / wasmMemory
```

**S3 — ตรวจว่า static field เข้าถึงได้**
IL2CPP statics อยู่ใน wasm memory ที่ offset จาก metadata (`Il2CppClass` + static_fields)
ต้องมี class pointer — Il2CppDumper ให้ `script.json` ที่มี RVA; บาง build ต้อง resolve ผ่าน `il2cpp_domain_get_assemblies` (exported function ใน wasm)
ถ้า wasm export พวก `il2cpp_*` → เรียกผ่าน `u.Module.asm` ได้

**S4 — ESP radar ก่อน** (ไม่ต้อง camera)
อ่านตำแหน่งจาก `BattleActor` → วาด minimap 2D
ถ้าผ่าน ต่อ box ESP ด้วย `PB.Battle.Camera`

**S5 — mobile port**
อ่าน `PlatformProfile` / `MobileWeb` จาก dump → รู้ว่าตัดสินจากอะไร → spoof ที่จุดนั้น

---

## 7. ความเสี่ยง / ข้อสังเกต

- `PBShaderSafety` + `GpuMemoryCensus` + `MemoryReload` = build ถูกคุม memory หนัก
  การอ่าน heap เพิ่ม overhead ได้ แต่การอ่านอย่างเดียวไม่อันตราย
- ยังไม่รู้ว่า **server** ตรวจ trivially หรือไม่ (`AntiScript=false` ใน PB-OFFLINE — แต่ pbneo อาจเปิด)
- การเขียนค่าเข้า managed heap (aim) เสี่ยง crash มากกว่าการอ่าน (ESP)

---

## 8. สรุปบรรทัดเดียว

**offset ไม่เหมือน PB-OFFLINE — แต่ pbneo มี offset ของตัวเองที่ดึงได้**
`data` มี IL2CPP metadata v108 ครบ, class ยังไม่ถูก strip (`BattleActor`, `PB.Hitbox`, `PB.Battle.Camera`)
⇒ ทางที่สั้นที่สุดคือ **Il2CppDumper → dump.cs → อ่าน heap ผ่าน HEAPU8**
ไม่ต้องย้อนไป RE C++ client เดิมเลย
