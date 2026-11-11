#!/usr/bin/env node
/**
 * ตรวจว่า weapon .glb จะ "เพี้ยน" ตอนตัวละครถือหรือไม่ โดยเทียบกับ reference
 * ที่ export จากเกม (sea3123_zombieslayer.glb)
 *
 *   node check_weapon_glb.mjs <candidate.glb> [reference.glb]
 *
 * ตรวจ: dummy node (grip / fx / magazine), world transform, สเกลจริง,
 *       pivot, แกนยาว, material/texture, skin/animation ที่ไม่ควรมี
 */
import fs from "node:fs";
import path from "node:path";

const DUMMY = /dummy|grip|handle|muzzle|eject|laser|acc_|magazine|root|weapon/i;
const EPS = 2e-3;

function readGlb(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("ไม่ใช่ไฟล์ .glb");
  let off = 12, json = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    if (type === 0x4e4f534a) json = JSON.parse(buf.subarray(off + 8, off + 8 + len).toString("utf8"));
    off += 8 + len + ((4 - (len % 4)) % 4);
  }
  return json;
}

/* ---- mat4 (column-major, glTF) ---- */
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) { // a * b
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function trs(n) {
  if (n.matrix) return n.matrix.slice();
  const [tx, ty, tz] = n.translation || [0, 0, 0];
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale || [1, 1, 1];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}
function apply(m, p) {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}

function collect(j) {
  const nodes = j.nodes || [];
  const roots = j.scenes?.[j.scene || 0]?.nodes || [];
  const list = [];
  const world = new Map(); // name -> world matrix
  const walk = (idx, parent, depth) => {
    const n = nodes[idx];
    if (!n || depth > 10) return;
    const m = mul(parent, trs(n));
    if (n.name) world.set(n.name, m);
    let min = null, max = null;
    if (n.mesh !== undefined) {
      for (const p of j.meshes[n.mesh].primitives || []) {
        const a = j.accessors?.[p.attributes?.POSITION];
        if (!a?.min) continue;
        min = min ? min.map((v, i) => Math.min(v, a.min[i])) : a.min.slice();
        max = max ? max.map((v, i) => Math.max(v, a.max[i])) : a.max.slice();
      }
    }
    list.push({ idx, name: n.name || "", depth, mesh: n.mesh, min, max, world: m });
    for (const c of n.children || []) walk(c, m, depth + 1);
  };
  for (const r of roots) walk(r, I4(), 0);
  return { list, world };
}

function worldBBox(j, col) {
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const n of col.list) {
    if (!n.min || !n.max) continue;
    for (const cx of [n.min[0], n.max[0]]) for (const cy of [n.min[1], n.max[1]]) for (const cz of [n.min[2], n.max[2]]) {
      const p = apply(n.world, [cx, cy, cz]);
      for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
    }
  }
  if (!isFinite(min[0])) return null;
  const size = max.map((v, i) => v - min[i]);
  const center = max.map((v, i) => (v + min[i]) / 2);
  return { min, max, size, center };
}

const fmt = (v, d = 3) => Number(v).toFixed(d);
const fmtV = (v) => "[" + v.map((x) => fmt(x)).join(", ") + "]";

function parse(file) {
  const j = readGlb(file);
  const col = collect(j);
  return {
    j, col,
    bb: worldBBox(j, col),
    names: col.list.map((n) => n.name).filter(Boolean),
    dummies: [...new Set(col.list.map((n) => n.name).filter((n) => n && DUMMY.test(n)))],
  };
}

function gripOf(col) {
  for (const name of ["HandelAnimationDummy", "HandleAnimationDummy", "GunDummy"]) {
    const m = col.world.get(name);
    if (m) return [m[12], m[13], m[14]];
  }
  return null;
}

function inspect(file, refFile) {
  const me = parse(file);
  const ref = refFile && fs.existsSync(refFile) ? parse(refFile) : null;
  const L = [], warns = [];

  L.push(`\n=== ${path.basename(file)} ===`);
  L.push(`generator : ${me.j.asset?.generator || "?"}`);
  L.push(`meshes ${me.j.meshes?.length || 0} · materials ${me.j.materials?.length || 0} · images ${me.j.images?.length || 0} · skins ${me.j.skins?.length || 0} · anims ${me.j.animations?.length || 0}`);
  L.push(`dummies   : ${me.dummies.length ? me.dummies.join(", ") : "— ไม่มีเลย —"}`);
  if (me.bb) {
    L.push(`world size: ${me.bb.size.map((v) => fmt(v)).join(" x ")} (ยาวสุด ${fmt(Math.max(...me.bb.size))} m)`);
    L.push(`world center: ${fmtV(me.bb.center)}   (pivot/hand origin = [0, 0, 0])`);
    const longest = me.bb.size.indexOf(Math.max(...me.bb.size));
    L.push(`แกนยาว    : ${"XYZ"[longest]}${longest === 1 ? " (Y-up)" : longest === 2 ? " (Z-up)" : ""}`);
  }
  if (me.j.skins?.length) warns.push(`มี skin ${me.j.skins.length} ตัว — อาวุธเกมเป็น rigid mesh`);
  if (me.j.animations?.length) warns.push(`มี animation ${me.j.animations.length} คลิป`);
  if (!me.dummies.length) warns.push("ไม่มี dummy ของเกม → เกมจะจับที่ origin ดิบ (มักลอย/ทะลุมือ/ผิดแกน)");

  if (ref) {
    L.push(`\n--- เทียบ reference: ${path.basename(refFile)} ---`);
    const missing = ref.dummies.filter((n) => !me.names.includes(n));
    const extra = me.dummies.filter((n) => !ref.names.includes(n));
    L.push(`dummy ที่ขาด : ${missing.length ? missing.join(", ") : "ไม่มี (ครบ)"}`);
    if (extra.length) L.push(`dummy ที่เกิน : ${extra.join(", ")}`);
    if (missing.length) warns.push(`ขาด dummy: ${missing.join(", ")} → fx/grip บางส่วนจะไม่ทำงาน`);

    // world matrix ต่อ node ชื่อเดียวกัน
    let diff = 0;
    const bad = [];
    for (const [name, m] of ref.col.world) {
      const c = me.col.world.get(name);
      if (!c) continue;
      const d = Math.max(...m.map((v, i) => Math.abs(v - c[i])));
      if (d > EPS) { diff++; bad.push(`${name}(Δ${fmt(d)})`); }
    }
    L.push(`world transform ต่าง: ${diff ? bad.slice(0, 8).join(", ") + (bad.length > 8 ? ` …+${bad.length - 8}` : "") : "ตรงกัน"}`);
    if (diff) warns.push("transform ของ dummy ไม่ตรง ref → grip/fx/มือจะเยื้อง");

    if (me.bb && ref.bb) {
      const ratio = me.bb.size.map((v, i) => v / (ref.bb.size[i] || 1));
      const longestRatio = Math.max(...ratio);
      L.push(`สเกล bbox เทียบ ref: ${ratio.map((r) => fmt(r, 2) + "x").join(" / ")}`);
      if (longestRatio > 2 || longestRatio < 0.5) {
        warns.push(`ขนาดต่างจาก ref มาก (${ratio.map((r) => fmt(r, 2) + "x").join("/")}) → ในเกมจะใหญ่/เล็กผิด`);
      } else if (longestRatio > 1.25 || longestRatio < 0.8) {
        L.push("  (ต่างเพราะชิ้นส่วน/พร็อพของ skin — ไม่ใช่ปัญหา rig ถ้า grip ตรง)");
      }
      const dc = me.bb.center.map((v, i) => v - ref.bb.center[i]);
      L.push(`center ต่างจาก ref: ${fmtV(dc)}`);

      const g1 = gripOf(me.col), g2 = gripOf(ref.col);
      if (g1 && g2) {
        const d = Math.hypot(g1[0] - g2[0], g1[1] - g2[1], g1[2] - g2[2]);
        L.push(`grip (HandelAnimationDummy) ต่างจาก ref: ${fmt(d * 100, 1)} ซม.`);
        if (d > 0.02) warns.push(`grip เยื้องจาก ref ${fmt(d * 100, 1)} ซม. → ปืนจะลอย/จมมือ`);
      }
    }
  }

  L.push("");
  if (warns.length) {
    L.push("⚠ ปัญหาที่เจอ:");
    for (const w of warns) L.push("  • " + w);
  } else {
    L.push("✔ โครงสร้าง/สเกล/pivot ตรงกับ reference — น่าจะถือได้ปกติ");
  }
  return L.join("\n");
}

const args = process.argv.slice(2);
if (!args.length) {
  console.log("usage: node check_weapon_glb.mjs <candidate.glb> [reference.glb]");
  process.exit(1);
}
const refDefault = path.join(process.cwd(), "sea3123_zombieslayer.glb");
const ref = args[1] || (fs.existsSync(refDefault) ? refDefault : null);
try { console.log(inspect(args[0], ref)); } catch (e) { console.error(path.basename(args[0]) + ": " + e.message); process.exit(1); }
