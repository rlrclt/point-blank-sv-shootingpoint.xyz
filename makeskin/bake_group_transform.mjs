// Bake a rotation+uniform scale about a pivot into selected nodes (keeps hierarchy).
//   node bake_group_transform.mjs in.glb out.glb NodeA,NodeB angleDeg axisX axisY axisZ scale
import fs from "node:fs";

const [inFile, outFile, list, angleArg, axArg, ayArg, azArg, scaleArg] = process.argv.slice(2);
const names = String(list || "").split(",").filter(Boolean);
const angle = (Number(angleArg ?? 0) * Math.PI) / 180;
const axis = [Number(axArg ?? 0), Number(ayArg ?? 1), Number(azArg ?? 0)];
const k = Number(scaleArg ?? 1);

const buf = fs.readFileSync(inFile);
let off = 12, json = null, bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
  else if (type === 0x004e4942) bin = Buffer.from(data);
  off += 8 + len + ((4 - (len % 4)) % 4);
}

const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let kk = 0; kk < 4; kk++) s += a[kk * 4 + r] * b[c * 4 + kk]; o[c * 4 + r] = s; } return o; };
const trs = (n) => {
  if (n.matrix) return n.matrix.slice();
  const [tx, ty, tz] = n.translation || [0, 0, 0];
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale || [1, 1, 1];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1];
};
const T = (v) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v[0], v[1], v[2], 1];
const rotAxis = (ax, ang) => {
  const l = Math.hypot(ax[0], ax[1], ax[2]) || 1;
  const [x, y, z] = [ax[0] / l, ax[1] / l, ax[2] / l];
  const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  return [
    t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
    t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
    t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
    0, 0, 0, 1];
};
const S = (k) => [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1];

const nodes = json.nodes || [];
const idx = [];
for (const name of names) {
  const i = nodes.findIndex((n) => n.name === name);
  if (i < 0) { console.error("missing node:", name); continue; }
  idx.push(i);
}
if (idx.length < 1) { console.error("no target nodes"); process.exit(1); }

// pivot = average translation (parent space)
const ts = idx.map((i) => { const m = trs(nodes[i]); return [m[12], m[13], m[14]]; });
const O = ts.reduce((a, t) => [a[0] + t[0], a[1] + t[1], a[2] + t[2]], [0, 0, 0]).map((v) => v / ts.length);
const Xf = mul(mul(mul(T(O), rotAxis(axis, angle)), S(k)), T([-O[0], -O[1], -O[2]]));

for (const i of idx) {
  const m = trs(nodes[i]);
  nodes[i].matrix = mul(Xf, m);
  delete nodes[i].translation; delete nodes[i].rotation; delete nodes[i].scale;
}
console.log("pivot", O.map((v) => +v.toFixed(3)), "angle", angleArg, "axis", axis, "scale", k);

// report blade (local X) direction of first node in parent space
const m0 = trs(nodes[idx[0]]);
const ax = [m0[0], m0[1], m0[2]];
const alen = Math.hypot(...ax) || 1;
console.log("blade X axis (parent space) ->", ax.map((v) => +(v / alen).toFixed(3)));
console.log("translation ->", [m0[12], m0[13], m0[14]].map((v) => +v.toFixed(3)));

const jsonBuf = Buffer.from(JSON.stringify(json), "utf8");
const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)]);
const binChunk = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4, 0)]);
const header = Buffer.alloc(12);
const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(total, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonChunk.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(binChunk.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(outFile, Buffer.concat([header, jh, jsonChunk, bh, binChunk]));
console.log("wrote", outFile);
