import { a8 as p } from "./vendor-three-BL04HsGo.js";
let r = null;
const a = new WeakMap();
let c = !1;
const l = [
  "render",
  "compile",
  "compileAsync",
  "initTexture",
  "initRenderTarget",
  "setRenderTarget",
  "copyFramebufferToTexture",
  "copyTextureToTexture",
  "copyTextureToTexture3D",
  "readRenderTargetPixels",
  "readRenderTargetPixelsAsync",
  "clear",
];
function u() {
  if (c) return;
  c = !0;
  const e = p.prototype,
    t = e.addEventListener;
  e.addEventListener = function (n, i) {
    (t.call(this, n, i),
      r &&
        n === "dispose" &&
        (r.pairs.push([new WeakRef(this), i]),
        r.pairs.length > r.limit && d(r)));
  };
}
function d(e) {
  ((e.pairs = e.pairs.filter(
    ([t, n]) => t.deref()?.hasEventListener("dispose", n) === !0,
  )),
    (e.limit = Math.max(4096, e.pairs.length * 2)));
}
function h(e) {
  if (a.has(e)) return;
  u();
  const t = { pairs: [], limit: 4096 };
  a.set(e, t);
  const n = e;
  for (const i of l) {
    const s = n[i];
    typeof s == "function" &&
      (n[i] = function (...o) {
        const f = r;
        r = t;
        try {
          return s.apply(this, o);
        } finally {
          r = f;
        }
      });
  }
}
function m(e) {
  const t = a.get(e);
  if (!t) return 0;
  let n = 0;
  for (const [i, s] of t.pairs) {
    const o = i.deref();
    !o ||
      !o.hasEventListener("dispose", s) ||
      (o.removeEventListener("dispose", s), n++);
  }
  return ((t.pairs.length = 0), a.delete(e), n);
}
export { m as d, h as t };
