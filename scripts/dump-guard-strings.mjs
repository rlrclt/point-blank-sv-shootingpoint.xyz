// dump-guard-strings.mjs — extract the decoded string table from a pb-guard build
import fs from "node:fs";
import vm from "node:vm";

const file = process.argv[2] || "pbrecon/live/pb-guard-cB4eQTKw.js";
let src = fs.readFileSync(file, "utf8");
const e = src.indexOf("export{");
if (e > 0) src = src.slice(0, e);

// detect the decoder's name (it moves between builds: g, L, ...)
const dm = src.match(/function (\w+)\(\w+(?:,\w+)?\)\{\w+=\w+-\(/);
const decName = dm ? dm[1] : "g";
console.log("[decoder]", decName);
// append an in-scope dump hook; detect decoder and its array getter dynamically
src += "\n;globalThis.__pbDump={ dec: typeof " + decName + "==='function'?" + decName + ":null, gsrc: typeof " + decName + "==='function'?" + decName + ".toString():null };";

const noop = () => {};
const sandbox = {
  console: new Proxy({ log: noop, warn: noop, error: noop, debug: noop, info: noop, table: noop, trace: noop, dir: noop, assert: noop, count: noop, time: noop, timeEnd: noop }, { get: (t, k) => t[k] || noop }),
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, Object, Array, Promise, String, Number, Boolean, Function, Symbol, Map, Set, WeakMap, WeakSet, Reflect, Proxy, RegExp, Error, TypeError, parseInt, parseFloat, isNaN, Infinity, NaN, undefined,
  globalThis: {},
  TextEncoder, TextDecoder, Uint8Array, Int8Array, ArrayBuffer, DataView, Uint32Array, Float64Array, BigInt64Array,
  crypto: { getRandomValues: (a) => a, randomUUID: () => "x".repeat(36) },
};
sandbox.globalThis = sandbox;

try {
  vm.runInNewContext(src, sandbox, { timeout: 10000 });
} catch (err) {
  console.log("[run err]", String(err.message).slice(0, 160));
}

const dump = sandbox.__pbDump;
if (!dump || !dump.dec) { console.log("no dump:", !!dump, dump && !!dump.dec); process.exit(1); }

const strings = [];
// derive index base + output name from the decoder source
let base = 0;
let out = "pbrecon/live/guard-strings.txt";
try {
  const m = dump.gsrc.match(/\w+=\w+-\(([^)]*)\)/);
  if (m) base = Function("return (" + m[1] + ")")();
  const am = dump.gsrc.match(/const x=(\w+)\(\)/);
  if (am) out = "pbrecon/live/guard-" + am[1] + "-strings.txt";
} catch {}
console.log("[base]", base, "[out]", out);
for (let i = base; i < base + 2500; i++) {
  let s = null;
  try { s = dump.dec(i); } catch { break; }
  if (typeof s === "string") strings.push((i - base) + "\t" + s); else { strings.push((i - base) + "\t<end>"); break; }
}
fs.writeFileSync(out, strings.join("\n"));
console.log("[dumped]", strings.length, "->", out);
