import fs from 'node:fs';

// หา FX ของปืน 1 ตัว: node lookup-weapon-fx.mjs <slug|itemId|family+variant>
// ใช้ข้อมูลจาก weaponfx.json ของเกม + site/data/items.json
const FX = new URL('./weaponfx.json', import.meta.url); // ต้องมีไฟล์นี้ใน pbrecon (โหลดจาก shootingpoint.xyz/assets/weapons/fx/weaponfx.json)
const items = JSON.parse(fs.readFileSync(new URL('../site/data/items.json', import.meta.url), 'utf-8'));
const list = items.items ?? items;
const q = process.argv[2];
if (!q) { console.log('usage: node lookup-weapon-fx.mjs <slug|itemId|family:variant>'); process.exit(1); }

let item = list.find(i => i.k === 'w' && (i.slug === q || String(i.itemId) === q || i.id === q));
if (!item && q.includes(':')) {
  const [fam, ...v] = q.split(':'); const variant = v.join(':').toLowerCase();
  item = list.find(i => i.k === 'w' && i.family?.toLowerCase() === fam.toLowerCase() && (i.variant || '').toLowerCase() === variant);
}
if (!item) { console.log('item not found in items.json:', q); process.exit(1); }

let wf = null;
try { wf = JSON.parse(fs.readFileSync(FX, 'utf-8')); } catch {
  console.log(`weaponfx.json missing — download first:\n  Invoke-WebRequest "https://shootingpoint.xyz/assets/weapons/fx/weaponfx.json" -OutFile pbrecon\\weaponfx.json`);
  process.exit(1);
}
const e = wf.weapons[String(item.itemId)];
console.log(`${item.name}  (${item.slug}, itemId ${item.itemId})`);
console.log('model :', item.path);
if (!e) { console.log('no FX entry for this itemId'); process.exit(0); }
const std = new Set([[194, 209, 255, 80], [255, 255, 255, 100], [255, 211, 211, 255]].map(c => c.join(',')));
const col = e.smoke?.color;
console.log('fire  :', e.fire, e.fire1st ? `\nfire1st: ${e.fire1st}` : '');
if (col) console.log('flash :', col.join(','), std.has(col.join(',')) ? '(standard white)' : '(SPECIAL COLOR)');
for (const k of ['tracerType', 'laser']) if (e[k]) console.log(k + ':', JSON.stringify(e[k]));
