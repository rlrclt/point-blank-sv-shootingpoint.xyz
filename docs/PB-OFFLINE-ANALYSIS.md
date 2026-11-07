# วิเคราะห์ PB-OFFLINE — ใช้กับ pbneo ได้แค่ไหน

> ที่มา: `C:\Users\YoruDekD\Downloads\PB-OFFLINE`
> ตรวจโดยแตก `Server.rar` + decompile ด้วย ILSpy 8.2 (`ilspycmd`)
> วันที่: 2026-11-05

---

## 1. ในโฟลเดอร์มีอะไร

| ไฟล์ | ขนาด | คืออะไร |
|---|---|---|
| `Server.rar` | 6.7 MB | **emulator .NET Framework** (compiled, ไม่มี source) |
| `Client.rar` | 6.9 GB | PC client (`!!PB-OFFLINE.exe` + DLL + assets) |
| `sql.sql` | 253 KB | schema PostgreSQL (54 ตาราง) |
| `postgresql-18.4-*.exe` | 376 MB | ตัวติดตั้ง DB |
| `xampp-windows-x64-...exe` | 148 MB | Apache/PHP (สำหรับ launcher) |
| `pblauncher/` | — | PHP web launcher (สำหรับ client PC) |
| `ReadMe.txt` | — | เครดิต source: `glad9.9` |

### Server.rar ภายใน

```
Debug\
├── Server.Auth.dll      116 KB    auth/login/channel/shop
├── Server.Game.dll      444 KB    lobby/room/battle logic
├── Server.Match.dll      99 KB    match orchestration
├── Plugin.Core.dll      440 KB    shared: models, network, XML, crypto
├── OSM-Monitor.exe      924 KB    console
├── Npgsql.dll, BouncyCastle.Crypto.dll, System.Text.Json.dll ...
└── Config\Settings.ini            ports/db/rules
    Config\Rcon.ini                RCON 127.0.0.1:30000
```

`Settings.ini` ที่สำคัญ:

```ini
[Database]  Host=127.0.0.1 Port=5432 Name=pb User=postgres Pass=1234
[Server]    Debug=True  Test=False  AutoBan=False  ICafeSystem=True
[Others]    UdpType=3  UdpVersion=1508.7  AntiScript=false
[Runtime]   BackYear=10  LockYear=2020
```

---

## 2. ใช่ตระกูลเดียวกับ pbneo หรือเปล่า

**ใช่ — โครงเดียวกันชัดเจน**

| หลักฐาน | PB-OFFLINE | play.pbneo.app |
|---|---|---|
| ชื่อ service | `Server.Auth` / `Server.Game` / `Server.Match` | config พูดถึง Auth/Game/Battle emulator |
| DB | PostgreSQL + Npgsql | `serverHost`, `wsPortOffset` → emulator หลายตัว |
| packet naming | `PROTOCOL_*` (classic PB) | client Unity พูด protocol เดียวกัน |
| transport | TCP + UDP (`UdpType=3`) | WebSocket (WebGL ทำ UDP ไม่ได้ → gateway แปลง) |

pbneo เพิ่ม **WebSocket gateway** (`wss://ws.pbneo.app/pb/ws/{wsport}`) ครอบ emulator เดิม
แต่ protocol ชั้นในน่าจะยังเป็น `PROTOCOL_*` ชุดนี้

---

## 3. สิ่งที่ decompile ได้ (ประโยชน์ตรง)

จาก `Server.Auth/Game/Match` ทั้งสามตัว:

```
518 packet classes
├── AuthClientPacket   20
├── AuthServerPacket   41
├── GameClientPacket  179
└── GameServerPacket  278

319 ตัวมี opcode ชัดเจน (WriteH(<id>))
```

ตัวอย่าง:

| class | opcode |
|---|---|
| `PROTOCOL_CS_CLIENT_ENTER_ACK` | 770 |
| `PROTOCOL_BASE_CHANNELTYPE_CHANGE_CONDITION_ACK` | 2490 |
| `PROTOCOL_LOBBY_GET_ROOMLIST_REQ` | 0 (dynamic) |

⇒ **ได้ตาราง packet name → opcode → field layout** ซึ่งเป็นของที่ต้องใช้ทำ
WS parser / logger / ESP จาก network data

### โครงสร้าง packet (ตัวอย่างจริง)

```csharp
public class PROTOCOL_BASE_CHANNELTYPE_CHANGE_CONDITION_ACK : AuthServerPacket
{
    public override void Write()
    {
        WriteH(2490);
        WriteB(Method0(SChannelXML.Servers));
    }
    ...
    syncServerPacket.WriteC(item.Type);
    syncServerPacket.WriteH((ushort)item.MaxPlayers);
    syncServerPacket.WriteD(item.LastPlayers);
}
```

อ่านแบบนี้ได้ทุกไฟล์ ⇒ รู้ byte layout เป๊ะ ไม่ต้องเดา

---

## 4. เรื่อง "mobile" — เจอแล้ว แต่น่าสนใจ

### 4.1 มี field

`schema.sql`:

```sql
CREATE TABLE "public"."serverchannels" (
  "id" int4 NOT NULL,
  ...
  "ismobile" bool
);
```

decompile `Plugin.Core`:

```csharp
// Plugin.Core.Models.SChannelModel
public bool IsMobile { get; set; }

// Plugin.Core.XML.SChannelXML
IsMobile = bool.Parse(attributes.GetNamedItem("Mobile").Value),
```

⇒ server โหลดค่าจาก `Config/...xml` (`<Server ... Mobile="true">`)

### 4.2 แต่ **ไม่ถูกใช้เลย** ใน build นี้

ค้นทั้ง `Server.Auth`, `Server.Game`, `Server.Match`:

```
IsMobile → 0 การอ้างอิง
IsMobile ถูก serialize ลง packet → ไม่มี
PROTOCOL_BASE_CHANNELTYPE_CHANGE_CONDITION_ACK (2490)
   → เขียนแค่ State, Host, Port, Type, MaxPlayers, LastPlayers
   → ไม่มี mobile flag
```

**สรุป:** base emulator มี "ช่องให้ทำ mobile channel" แต่ยังไม่ได้ enforce
ถ้า pbneo มี mobile-only จริง แปลว่า **fork ของเขาเติม logic เอง** (ซึ่งเรามองไม่เห็นจากฝั่ง client)

### 4.3 `AntiScript`

```ini
AntiScript = false
```

มีสวิตช์ anti-script ฝั่ง server แต่ใน build นี้ปิดอยู่ ⇒ ยังไม่รู้ว่ามันตรวจอะไร
(นี่คือคำถามที่ต้องตอบก่อนทำ aim/recoil บน pbneo)

---

## 5. ตอบคำถาม: เอามาทำโปรแกรมให้ pbneo ได้ไหม

### ✅ ได้ — ในฐานะ "ห้องแล็บ protocol"

| ใช้ทำอะไร | ได้แค่ไหน |
|---|---|
| รู้ opcode + byte layout ของทุก packet | **ได้ 100%** (decompile แล้ว) |
| เขียน WS parser/logger สำหรับ pbneo | **ได้** ถ้า pbneo ใช้ protocol เดิม |
| รัน server ท้องถิ่นเพื่อ capture ของจริง | **ได้** (Postgres + Debug=True) |
| ทดสอบ tool โดยไม่แตะเซิร์ฟเวอร์จริง | **ได้** |
| ดูว่า server ตัดสิน device จากอะไร | **ได้** (แต่ build นี้ไม่มี logic นั้น) |

### ❌ ไม่ได้ — ในฐานะ client

| ต้องการ | เพราะ |
|---|---|
| เล่น pbneo ด้วย client นี้ | เป็น PC build (i3Engine) ไม่ใช่ Unity WebGL |
| ESP ที่อ้าง camera matrix | camera อยู่ใน Unity wasm ไม่ได้อยู่ใน server |
| `window.__pb`, `__pbR`, `hitboxDefs` | ไม่มีใน Unity client |
| เอา `pb-esp-ext`/`pbmobile-ext` มารันตรง ๆ | คนละ client ทั้งหมด |

---

## 6. แผนที่แนะนำ (ปรับจาก PBNEO-ANALYSIS §10)

### P0 — page layer (เหมือนเดิม) · ~1 วัน
ไม่เกี่ยวกับ PB-OFFLINE — ทำต่อได้เลย

### P1 — protocol recon (เร็วขึ้นมากเพราะมี lab) · ~1 วัน (เดิม 2-3)

1. รัน PB-OFFLINE server ท้องถิ่น (Postgres + `Debug=True`, `AntiScript=false`)
2. ต่อด้วย client PC (`!!PB-OFFLINE.exe`) แล้ว **จับ traffic** (Wireshark / proxy)
3. เทียบกับ opcode table ที่ decompile ได้ → map packet
4. เอา map นั้นไปใช้กับ `play.pbneo.app`:
   - ถ้า opcode ตรง → parser ใช้ได้ทันที
   - ถ้าไม่ตรง → pbneo แก้ protocol ⇒ ต้องจับของจริงจาก WS

### P2 — ESP (เส้นทางใหม่ที่น่าสนใจ)

**2A. Packet-based radar ( feas มาก )**
- อ่าน packet ที่ server ส่ง (spawn / move / death / round)
- ได้ world position + team + hp ของทุกคน
- วาด **radar 2D** บน canvas — ไม่ต้องใช้ camera matrix, ไม่ต้องแตะ wasm
- ข้อจำกัด: ไม่ได้ box ลอยบนจอ

**2B. Box ESP (ต้อง client)**
- ต้องได้ view/projection matrix จาก Unity wasm
- ต้อง RE wasm (offset) — งานหนัก
- หรือ hook `createUnityInstance` + หา matrix ใน memory

### P3 — aim/recoil
ต้องรู้ก่อนว่า `AntiScript` ตรวจอะไร (เปิดใน build จริงของ pbneo หรือเปล่า — ไม่รู้)

---

## 7. วิธีรัน lab ท้องถิ่น (สรุป)

```
1) ติดตั้ง PostgreSQL 18 (จากโฟลเดอร์)  user=postgres pass=1234
2) สร้าง db ชื่อ pb แล้ว restore จาก sql.sql
3) แตก Server.rar → Debug\
4) แก้ Config\Settings.ini ให้ PublicIp4Address=127.0.0.1 (ค่าเริ่มต้นก็ใช่)
5) รัน OSM-Monitor.exe
6) แตก Client.rar → รัน !!PB-OFFLINE.exe
7) RCON: 127.0.0.1:30000 (RconEnabled=true)
```

> ใช้เพื่อ capture protocol เท่านั้น — ไม่ต้องเอาไปออนไลน์

---

## 8. คำสั่งที่ใช้ decompile (ทำซ้ำได้)

```powershell
# แตกเฉพาะที่ต้องใช้
7z x Server.rar -o"$env:TEMP\pbneo-srv" "Debug\Server.Auth.dll" "Debug\Server.Game.dll" `
   "Debug\Server.Match.dll" "Debug\Plugin.Core.dll" "Debug\Config\Settings.ini"

# ILSpy (ต้องมี .NET 8; ตัว tool 8.2 target net6 → roll forward)
dotnet tool install ilspycmd --tool-path "$env:TEMP\ilspy" --version 8.2.0.7535
$env:DOTNET_ROLL_FORWARD="Major"
& "$env:TEMP\ilspy\ilspycmd.exe" -p -o "$env:TEMP\pbneo-src\game" "...\Server.Game.dll"
```

ผลลัพธ์: 258 (Core) + 90 (Auth) + 516 (Game) ไฟล์ `.cs` อ่านได้ทั้งหมด

---

## 9. สรุปบรรทัดเดียว

**PB-OFFLINE คือ "คู่มือ protocol" ของ pbneo** — เอามาทำ parser/radar/logger ได้
แต่ **ไม่ใช่ client** และไม่ช่วยเรื่อง wasm/camera
⇒ เปิดโปรเจกต์ `pbneo-ext` แล้วใช้ lab นี้เป็นแหล่งความจริงของ packet
