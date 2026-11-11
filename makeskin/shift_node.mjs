// Translate nodes by (dx,dy,dz) in parent space, preserving rotation/scale.
//   node shift_node.mjs in.glb out.glb Node dx dy dz [Node2 dx dy dz]
import fs from "node:fs";
const [inFile, outFile, ...rest] = process.argv.slice(2);
const specs = [];
for (let i = 0; i < rest.length; i += 4) {
  if (!rest[i]) break;
  specs.push({ name: rest[i], d: [Number(rest[i + 1]), Number(rest[i + 2]), Number(rest[i + 3])] });
}
const buf = fs.readFileSync(inFile);
let off = 12, json = null, bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
  else if (type === 0x004e4942) bin = Buffer.from(data);
  off += 8 + len + ((4 - (len % 4)) % 4);
}
for (const s of specs) {
  const n = (json.nodes || []).find((x) => x.name === s.name);
  if (!n) { console.error("missing", s.name); continue; }
  if (!n.matrix) { console.error("node has no matrix", s.name); continue; }
  n.matrix[12] += s.d[0];
  n.matrix[13] += s.d[1];
  n.matrix[14] += s.d[2];
  console.log(`${s.name}: shift ${s.d}`);
}
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
