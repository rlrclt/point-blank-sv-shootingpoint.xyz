// deob-guard.mjs — inline the decoded string table into the guard source
import fs from "node:fs";
import vm from "node:vm";

const file = process.argv[2] || "pbrecon/live/pb-guard-cB4eQTKw.js";
let src = fs.readFileSync(file, "utf8");
const e = src.indexOf("export{");
if (e > 0) src = src.slice(0, e);
src += "\n;globalThis.__pbDump={ dec: typeof g==='function'?g:null, gsrc: typeof g==='function'?g.toString():null };";

const noop = () => {};
const sandbox = {
  console: new Proxy({ log: noop, warn: noop, error: noop, debug: noop, info: noop, table: noop, trace: noop, dir: noop, assert: noop, count: noop, time: noop, timeEnd: noop }, { get: (t, k) => t[k] || noop }),
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, Object, Array, Promise, String, Number, Boolean, Function, Symbol, Map, Set, WeakMap, WeakSet, Reflect, Proxy, RegExp, Error, TypeError, parseInt, parseFloat, isNaN, Infinity, NaN, undefined,
  globalThis: {}, TextEncoder, TextDecoder, Uint8Array, Int8Array, ArrayBuffer, DataView, Uint32Array, Float64Array,
  crypto: { getRandomValues: (a) => a, randomUUID: () => "x".repeat(36) },
};
sandbox.globalThis = sandbox;
try { vm.runInNewContext(src, sandbox, { timeout: 10000 }); } catch (err) { console.log("[run err]", String(err.message).slice(0, 160)); }

const dump = sandbox.__pbDump;
let base = 0;
try { base = Function("return (" + dump.gsrc.match(/r=r-\(([^)]*)\)/)[1] + ")")(); } catch {}

const dec = (n) => { try { return dump.dec(n + base); } catch { return null; } };

// replace every <alias>(N) call with the decoded string literal
// (the obfuscator clones the decoder into one-letter aliases per scope: c, g, x, n, s, r, d, ...)
const out = src.replace(/\b([a-z]{1,2})\((\d{1,4})\)/g, (m, f, n) => {
  const s = dec(+n);
  if (s == null) return m;
  return JSON.stringify(s);
});
fs.writeFileSync("pbrecon/live/guard-deob.js", out);
console.log("[deob] wrote pbrecon/live/guard-deob.js, bytes", out.length);
