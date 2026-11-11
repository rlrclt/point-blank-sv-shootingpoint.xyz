// Scale a single node's local axes in a .glb without touching its mesh data.
//   node fix_node_scale.mjs in.glb out.glb NodeName fx fy fz
// Works for nodes that already have a matrix (patch_parent output).
import fs from "node:fs";

const [inFile, outFile, nodeName, fx, fy, fz] = process.argv.slice(2);
if (!inFile || !outFile || !nodeName) {
  console.log("usage: node fix_node_scale.mjs in.glb out.glb NodeName [fx fy fz]");
  process.exit(1);
}
const factors = [Number(fx ?? 1), Number(fy ?? 1), Number(fz ?? 1)];

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
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
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

const target = (json.nodes || []).findIndex((n) => n.name === nodeName);
if (target < 0) { console.error("node not found:", nodeName); process.exit(1); }
const node = json.nodes[target];
const m = trs(node);
// scale columns 0..2 in place
for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 4 + r] *= factors[c];
node.matrix = m;
delete node.translation; delete node.rotation; delete node.scale;
console.log(`scaled ${nodeName} axes by ${factors.join(" x ")}`);

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
