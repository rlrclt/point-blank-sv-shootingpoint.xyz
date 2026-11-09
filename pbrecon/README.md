# PB Recon (Point Blank Web / Mobile Client Analysis)

This workspace contains the client-side JavaScript bundles, configuration, and asset definitions extracted from the Point Blank web/mobile client (`pbmobile-th.online`).

---

## 📁 File Catalog & Architecture

| File | Size | Role / Description |
| --- | --- | --- |
| [`pbConfig-BTAdk4SQ.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/pbConfig-BTAdk4SQ.js) | ~2 KB | Game physics, movement constants (speed, jump, crouch jump, gravity), damage multipliers (headshot 35x, body 1.2x), and fall damage. |
| [`combatProtocol-ugHSWx7a.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/combatProtocol-ugHSWx7a.js) | <1 KB | Binary combat protocol framing (`COMBAT_REQ` 9009, `COMBAT_ACK` 9010, version 2). Reads/writes length-prefixed JSON payloads. |
| [`noteClient-Diy66me5.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/noteClient-Diy66me5.js) | ~20 KB | Binary packet buffer serialization (`readC`, `readH`, `readD`, `readT`, `writeH`, `writeB`, etc.). Follows NCSoft/Zepetto packet style. |
| [`session-BNYT2CcN.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/session-BNYT2CcN.js) | ~27 KB | WebRTC P2P signaling (`openP2P`), host migration / handoff, ICE/STUN/TURN fallback, and WebSocket relay fallback. |
| [`config-TO6a17NM.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/config-TO6a17NM.js) | ~3 KB | Map configuration (`metro`, `nstation`, `blowcity`, `sewerage`), movement configuration, asset URL resolvers (`visual.glb`, `collision.glb`). |
| [`avatarCombat-Cn0Sf-BG.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/avatarCombat-Cn0Sf-BG.js) | ~25 KB | Player / actor combat state machine, character model attachments, animations, and hit calculation. |
| [`roomClient-DHZFwrSZ.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/roomClient-DHZFwrSZ.js) | ~55 KB | Room lifecycle, lobby state, team slots, leader assignment, and match readiness. |
| [`index-HK_qZtim.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/index-HK_qZtim.js) | ~287 KB | Central netcode adapter (`NetAdapter`), WebRTC / P2P transport hookup, packet encryption/shuffling, bot states, and death sync. |
| [`main-C4LWX42H.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/main-C4LWX42H.js) | ~450 KB | Client engine orchestration, event loop, scene manager, and input dispatching. |
| [`testBots-WllQD4W5.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/testBots-WllQD4W5.js) | ~2.5 KB | Bot seat allocation, test bot profiles, and AI state sync. |
| [`pbLighting-CAdVN-gf.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/pbLighting-CAdVN-gf.js) | ~31 KB | Three.js environment lighting, shadow configuration, and ambient maps. |
| [`propClip-DIR9JJpz.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/propClip-DIR9JJpz.js) | ~3 KB | Map prop clipping and destructible geometry tracking. |
| [`rendererListeners-BJdZ3WUV.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/rendererListeners-BJdZ3WUV.js) | ~1 KB | Window resize, canvas, and WebGL context listeners. |
| [`matchHandles-DDRISjpa.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/matchHandles-DDRISjpa.js) | <1 KB | Match handle utility references. |
| [`vendor-three-BL04HsGo.js`](file:///C:/Users/YoruDekD/Desktop/pbrecon/vendor-three-BL04HsGo.js) | ~791 KB | Three.js WebGL rendering library runtime. |
| [`asset-map.json`](file:///C:/Users/YoruDekD/Desktop/pbrecon/asset-map.json) | ~7.8 MB | Full hash-to-path index for models, textures, animations, and sound effects. |

---

## 🛠️ Tooling & Scripts

- **Refresh live bundle** (no dependencies, Node 18+):
  ```bash
  npm run refresh:check   # report new index/guard/chunks, writes nothing
  npm run refresh         # download only changed files into pbrecon/live/
  ```
  Writes `live/manifest.json` (index, guards, sha256 per file) and `live/index.txt`.
  Exits 1 on `--check` when a new build is detected.
- **Patch guard** (from repo root):
  ```bash
  node scripts/refresh-guard.mjs --check                    # stale? exit 1
  node scripts/refresh-guard.mjs --sync ../pb-esp-ext-cf    # patch + copy
  ```
  Finds the host flag in the current guard, replaces it with `!0`,
  verifies export count and syntax, and writes `guard-patched.js`.
- **Format Code**:
  ```bash
  npm run format
  ```
- **Check Formatting**:
  ```bash
  npm run format:check
  ```
