# PB Index — Point Blank item catalog

A static, dependency-free catalog of the item/asset data found in this repo.
It reads `pbrecon/asset-map.json` (the extracted client asset map) and turns it
into browsable categories: weapons, cosmetics, maps, and attachments.

Item names, localized names, and real artwork come from the asset host
`https://shootingpoint.xyz`.

## Run it

The app is plain HTML/CSS/JS and the dataset is loaded as a normal `<script>`,
so it also works by double-clicking `site/index.html`.

For a local server (recommended, and required by the in-app browser):

```sh
node site/serve.mjs 4173
# open http://localhost:4173/
```

## Rebuild the data

```sh
# 1. cache the remote manifests (weapons index, item names, icon index)
node site/fetch-remote.mjs
# optional custom host:
# node site/fetch-remote.mjs https://shootingpoint.xyz

# 2. build the catalog
node site/build-items.mjs
```

`fetch-remote.mjs` writes `site/data/remote/*.json` (about 8 MB). If the host is
unreachable, the catalog still builds without images; cards fall back to the
category glyph artwork.

`build-items.mjs` writes:

- `site/data/items.json` — dataset for inspection / tooling
- `site/data/items.js` — `window.PB_INDEX = { ... }`, loaded by the app

## What gets extracted

| Category | Count | Source in asset map |
| --- | ---: | --- |
| Weapons / equipment | 3,704 | `assets/weapons/models/*.glb` |
| Cosmetics (avatar parts) | 1,061 | `assets/avatar/parts/<part>/*.glb` |
| Maps | 126 | union of `assets/maps/*` and `assets/pc3123/maps/*` |
| Attachments | 192 | `assets/weapons/accessories/acc_*.glb` |

Total: **5,083** entries.

Numeric-only icon galleries (`assets/ui/.../icons/*.png`) are used as artwork,
but are not listed as separate items.

## Spawn IDs + server-only filter

Weapon cards show the numeric **spawn ID** (from
`/assets/weapons/models/index.json` → `itemId` / `itemIds`). Click the badge to
copy the first ID; the detail sheet lists every ID for that model.

The **Server IDs** box filters the catalog to weapons the match server actually
allows. It is fed by the extension:

1. In-game: `SAFETY → Server Check → COPY ALLOWED`
2. Paste the CSV into the **Server IDs** box on the site

The Catalog sidebar always shows a green **Server Owner** category first. It
contains **every usable weapon in the game's arsenal** (`ws.db.all()` →
`weapons.json`), equipment entries such as trophies are excluded. Nothing else
is required: no per-weapon testing and no room filter.

- Every listed weapon can be spawned and deals damage after the respawn loadout
  is acked (one death; see below).
- **มีแล้ว** marks weapons that are also in this account's server-provided
  respawn inventory (`sel.allItems`).
- **เฉพาะที่ฉันมี (server ยืนยัน)** filters down to that owned subset.

The weapon list is the same table the game/host uses to compute damage, so an
arsenal weapon that is not sold in the shop is still usable.

For any spawned weapon, use the extension's
`ปืนที่มีแล้ว: sync + ไม่ใช้ proxy` option. The server accepts the loadout on the
next respawn (one death); after that the weapon fires with normal damage and no
proxy/pickup is needed. Mid-life equip is not acked and can look equipped
without dealing damage.

## Auto-import from the running game

When the page is opened as the extension's **Options** page
(`chrome-extension://…/site/index.html`), it asks the live game tab for
`pb.respawnMenu.sel.allItems` + `pb.respawnMenu.sel.allowedId` through the
injector bridge. The **Server Owner** list fills automatically — no copy/paste.
Two sets are sent: every usable ID in the arsenal and this account's owned IDs.

- In-game shortcut: `SAFETY → เปิด Server Owner (ดึงจากเกม)`
- Manual re-fetch: **ดึงจากเกม** button next to the ID box
- If the game tab was loaded before installing/reloading the extension, reload
  the game tab once so the bridge exists.
- Opening `site/index.html` via `file://` still works; in that mode paste the
  CSV from `SAFETY → COPY ALLOWED` into the ID box.

The regular **อาวุธ** category still shows the full catalog. The spawn-ID badge
prefers a matching server ID, and the detail sheet marks server-owned IDs.

The site cannot know a player's inventory by itself — that list is sent by the
server at match time. The box only needs the numeric IDs; names/damage in the
CSV are ignored.

## Artwork

The catalog maps entries to the same icons the game client uses:

| Category | With artwork | Source |
| --- | ---: | --- |
| Weapons | 3,694 / 3,704 | `assets/ui/sea3123/icons/weapons/<itemId>.png` and cross icon sheets |
| Cosmetics | 463 / 1,061 | equipment icon ids from `items.en.json` → `assets/ui/sea3123/icons/items/<itemId>.png` |
| Maps | 124 / 126 | `assets/pc3123/maps/<slug>/thumbnail.png` |
| Attachments | 0 / 192 | no icon shipped for accessory models |

Sprite-sheet icons are rendered by cropping the exact cell rectangle (`x/y/w/h`)
from the icon index. Items without artwork keep the generated category glyph.

The host rejects hotlinked images when a `Referer` is sent, so the page sets
`no-referrer` for artwork requests.

## Names and classes

The client ships asset filenames, not localized display names, so English names
in the dataset are derived from slugs (e.g. `sea3123_ak_47_gold` →
`AK-47 Gold`). Where the remote name table has an entry, the detail dialog also
shows the official name (e.g. `AK-47 G.`). Attachment entries use their official
names directly.

Weapon class is assigned from a curated token table plus keyword overrides; a
handful of items remain in `Other` because their type is ambiguous from the name
alone.

Map display names come from a name table; unknown slugs are title-cased.

## Homepage features

- Category tabs with live counts
- Real item thumbnails with glyph fallback
- Full-text search (normalizes `AK-47` so `ak47` matches)
- Class / slot / edition facets, family dropdown, sort, reset
- Lazy batch rendering (120 cards per batch)
- Deep-linkable state in the URL hash (`#c=cosmetics&q=goggles&item=c%3A...`)
- Detail dialog with artwork, class, family, variant, tags, asset path, hash,
  key, official name, same-family siblings, copy-path / copy-link actions

## Remote assets

`site/data/items.js` includes a default `assetBase` of
`https://shootingpoint.xyz`. The "Open asset" button joins that base with the
stored asset path/hash, and item images resolve against the same base. The base
URL can be changed from the **Assets** button (stored in `localStorage`).
