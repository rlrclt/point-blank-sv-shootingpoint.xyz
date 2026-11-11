/**
 * รวมข้อมูลเอฟเฟกต์พิเศษของสกินอาวุธเข้าไปใน site/data/items.json + items.js
 *   node site/merge-fx-tags.mjs
 * แหล่งข้อมูล: pbrecon/weaponfx.json (FX ต่อ itemId จากเกม) + ชุดฮาร์ดโค้ดใน client
 * สร้างฟิลด์ `fx` ต่อไอเทมอาวุธ + แท็กค้นหา/facet:
 *   fx.color   ชื่อกลุ่มสีแฟลช (red/green/blue/purple/gold/orange/pink/black/cyan/white)
 *   fx.fire    id ชุด FX ยิง,  fx.theme ธีมที่แปลงเป็นข้อความ
 *   fx.fire1st / fx.tracer / fx.hitHeart (FX ตอนโดนแบบฮาร์ดโค้ดใน client)
 *   it.fxtags = [...สำหรับ facet: color-red, heart-hit, fire-heart, custom-fire, ...]
 * แท็กพวกนี้เข้า haystack ค้นหาอัตโนมัติ (app.js รวม tags ใน _s แล้ว)
 */
import fs from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf-8");
const dataPath = new URL("./data/items.json", import.meta.url);
const itemsData = JSON.parse(read("./data/items.json"));
const wf = JSON.parse(read("../pbrecon/weaponfx.json"));
const list = itemsData.items ?? itemsData;

// ชุดฮาร์ดโค้ดใน client (pbrecon/live/audio-*.js): FX ตอนโดนหัวใจ
const HEART_HIT = new Set([103178, 104170, 104171, 105099, 118046]);

// สีแฟลชมาตรฐานขาว 3 แบบ (ที่เหลือถือว่าพิเศษ)
const STD_COLORS = new Set([
  [194, 209, 255, 80].join(","),
  [255, 255, 255, 100].join(","),
  [255, 211, 211, 255].join(","),
]);

const THEMES = {
  PBIWC2017_Heart: "หัวใจ PBIWC2017",
  Heart_Valentine: "หัวใจวาเลนไทน์",
  Valentine_Star: "ดาววาเลนไทน์",
  Dark_Cupid: "ดาร์คคิวปิด",
  V_Curse: "สาปวาเลนไทน์",
  Element_Water: "ธาตุน้ำ",
  Element_Fire: "ธาตุไฟ",
  Element_Light: "ธาตุแสง",
  Element_Nature: "ธาตุธรรมชาติ",
};

function rgbToGroup(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const v = mx / 255, sat = mx ? (mx - mn) / mx : 0;
  if (v < 0.2) return { key: "black", th: "ดำ" };
  if (sat < 0.18) return { key: v > 0.75 ? "white" : "grey", th: v > 0.75 ? "ขาว" : "เทา" };
  let h = 60 * (((g - b) / (mx - mn || 1e-9) + (mx === g ? 2 : 0) + (mx === b ? 4 : 0)) % 6);
  if (mx === g) h = 60 * ((b - r) / (mx - mn || 1e-9) + 2);
  if (mx === b) h = 60 * ((r - g) / (mx - mn || 1e-9) + 4);
  h = (h + 360) % 360;
  if (h < 14 || h >= 335) return { key: "red", th: "แดง" };
  if (h < 42) return { key: "orange", th: "ส้ม" };
  if (h < 68) return { key: "gold", th: "ทอง/เหลือง" };
  if (h < 165) return { key: "green", th: "เขียว" };
  if (h < 205) return { key: "cyan", th: "ฟ้าน้ำ" };
  if (h < 265) return { key: "blue", th: "น้ำเงิน" };
  if (h < 310) return { key: "purple", th: "ม่วง" };
  return { key: "pink", th: "ชมพู" };
}

const wfx = wf.weapons ?? {};
// default FX ต่อตระกูล = ที่ใช้บ่อยสุด (นับจากไอเทมที่มี itemId ใน index)
const famCount = new Map();
for (const it of list) {
  if (it.cat !== "weapons" || !it.itemId) continue;
  const e = wfx[String(it.itemId)];
  if (e?.fire) {
    const m = famCount.get(it.family) ?? new Map();
    m.set(e.fire, (m.get(e.fire) ?? 0) + 1);
    famCount.set(it.family, m);
  }
}
const defaultFire = new Map();
for (const [fam, m] of famCount) {
  if (m.size < 2) continue;
  defaultFire.set(fam, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}

const stats = { flash: 0, heartHit: 0, themeFire: 0, customFire: 0, fire1st: 0, tracer: 0 };
for (const it of list) {
  if (it.cat !== "weapons" || !it.itemId) continue;
  const e = wfx[String(it.itemId)];
  if (!e) continue;
  const col = e.smoke?.color;
  const g = col && !STD_COLORS.has(col.join(",")) ? rgbToGroup(col[0], col[1], col[2]) : null;
  const fx = {};
  const fxtags = [];
  if (g) {
    fx.flash = col;
    fx.color = g.key;
    fx.colorTh = g.th;
    fxtags.push(`color-${g.key}`, `fx-สี${g.th}`.replace("สีดำ", "สีดำ"));
    stats.flash++;
  }
  const fire = e.fire;
  if (fire) {
    fx.fire = fire;
    const suffix = fire.replace(/^.*:Fir_/, "");
    if (THEMES[suffix]) {
      fx.theme = THEMES[suffix];
      fx.themeKey = suffix.toLowerCase();
      fxtags.push("fire-heart", "fx-ธีมหัวใจ");
      stats.themeFire++;
    }
    if (defaultFire.get(it.family) && defaultFire.get(it.family) !== fire) {
      fxtags.push("custom-fire", "fx-ชุดยิงพิเศษ");
      stats.customFire++;
    }
    if (/Silence/.test(fire)) fxtags.push("fx-เสียงแทร็ก");
  }
  if (e.fire1st) { fx.fire1st = e.fire1st; fxtags.push("fire1st", "fx-เสียงนัดแรกพิเศษ"); stats.fire1st++; }
  if (e.tracerType != null) { fx.tracer = e.tracerType; fxtags.push("tracer", "fx-tracerพิเศษ"); stats.tracer++; }
  const hitHeart = (it.itemIds ?? [it.itemId]).some((id) => HEART_HIT.has(Number(id)));
  if (hitHeart) { fx.hitHeart = true; fxtags.push("heart-hit", "fx-โดนหัวใจ"); stats.heartHit++; }
  if (fxtags.length) {
    it.fx = fx;
    it.fxtags = [...new Set(fxtags)];
    it.tags = [...new Set([...(it.tags ?? []), ...it.fxtags.filter((t) => !t.startsWith("color-") && t !== "tracer" && t !== "fire1st" && t !== "custom-fire" && t !== "fire-heart" && t !== "heart-hit")])];
  }
}

fs.writeFileSync(dataPath, JSON.stringify(itemsData), "utf-8");
const jsPath = new URL("./data/items.js", import.meta.url);
fs.writeFileSync(jsPath,
  `/* generated by site/build-items.mjs + merge-fx-tags.mjs - ${new Date().toISOString()} */\nwindow.PB_INDEX = ${JSON.stringify(itemsData)};\n`,
  "utf-8");
console.log("fx stats:", stats);
console.log("written:", "site/data/items.json", "site/data/items.js");
