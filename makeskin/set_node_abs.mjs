// Absolutely set node matrices: T(pos) * R(axis,angle) * S(scale)
//   node set_node_abs.mjs in.glb out.glb Node px py pz ax ay az angleDeg scale [...more]
import fs from "node:fs";

const args = process.argv.slice(2);
const inFile = args[0], outFile = args[1];
const specs = [];
for (let i = 2; i + 8 < args.length + 1; i += 9) {
  const name = args[i];
  if (!name) break;
  specs.push({
    name,
    pos: [Number(args[i + 1]), Number(args[i + 2]), Number(args[i + 3])],
    axis: [Number(args[i + 4]), Number(args[i + 5]), Number(args[i + 6])],
    deg: Number(args[i + 7]),
    scale: Number(args[i + 8] ?? 1),
  });
}
if (!inFile || !outFile || !specs.length) {
  console.log("usage: node set_node_abs.mjs in.glb out.glb Node px py pz ax ay az angleDeg scale");
  process.exit(1);
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
  const idx = (json.nodes || []).findIndex((n) => n.name === s.name);
  if (idx < 0) { console.error("missing", s.name); continue; }
  const [ax, ay, az] = s.axis;
  const l = Math.hypot(ax, ay, az) || 1;
  const [x, y, z] = [ax / l, ay / l, az / l];
  const a = (s.deg * Math.PI) / 180;
  const c = Math.cos(a), sn = Math.sin(a), t = 1 - c, k = s.scale;
  const R = [
    (t * x * x + c) * k, (t * x * y + sn * z) * k, (t * x * z - sn * y) * k, 0,
    (t * x * y - sn * z) * k, (t * y * y + c) * k, (t * y * z + sn * x) * k, 0,
    (t * x * z + sn * y) * k, (t * y * z - sn * x) * k, (t * z * z + c) * k, 0,
    s.pos[0], s.pos[1], s.pos[2], 1,
  ];
  json.nodes[idx].matrix = R;
  delete json.nodes[idx].translation;
  delete json.nodes[idx].rotation;
  delete json.nodes[idx].scale;
  console.log(`${s.name}: pos ${s.pos} axis ${s.axis} ${s.deg}° scale ${k}`);
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
