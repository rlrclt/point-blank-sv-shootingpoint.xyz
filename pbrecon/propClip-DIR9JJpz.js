import {
  V as d,
  x as k,
  g as y,
  Q as x,
  aa as q,
  a9 as P,
  aj as I,
  ak as S,
} from "./vendor-three-BL04HsGo.js";
let N = 0;
function _(t) {
  Number.isFinite(t) && (N = t);
}
function E(t = Date.now()) {
  return (t + N) / 1e3;
}
function M(t) {
  const o = new Map();
  if (
    !t ||
    (!t.boxes?.some((e) => e.node !== void 0) &&
      !t.meshes?.some((e) => e.node !== void 0))
  )
    return { still: t, parts: o };
  const n = (e) => {
      let p = o.get(e);
      return (
        p ||
          o.set(
            e,
            (p = { ...t, boxes: [], ...(t.meshes ? { meshes: [] } : {}) }),
          ),
        p
      );
    },
    r = {
      ...t,
      boxes: (t.boxes ?? []).filter((e) => e.node === void 0),
      ...(t.meshes
        ? { meshes: t.meshes.filter((e) => e.node === void 0) }
        : {}),
    };
  for (const e of t.boxes ?? []) e.node !== void 0 && n(e.node).boxes.push(e);
  for (const e of t.meshes ?? []) e.node !== void 0 && n(e.node).meshes.push(e);
  return { still: !r.boxes.length && !r.meshes?.length ? null : r, parts: o };
}
const h = new d(),
  g = new x(),
  w = new d(),
  T = new y();
class b {
  duration;
  chain;
  constructor(o, n) {
    ((this.chain = o), (this.duration = n));
  }
  time(o) {
    const n = this.duration;
    return n > 0 && Number.isFinite(o) ? ((o % n) + n) % n : 0;
  }
  at(o, n = new y()) {
    n.identity();
    for (const r of this.chain) {
      if ((h.copy(r.pos), g.copy(r.quat), w.copy(r.scale), o !== null))
        for (const i of r.tracks) {
          const e = i.at.evaluate(o);
          i.path === "quaternion"
            ? g.set(e[0], e[1], e[2], e[3])
            : (i.path === "position" ? h : w).set(e[0], e[1], e[2]);
        }
      n.premultiply(T.compose(h, g, w));
    }
    return n;
  }
}
function A(t, o, n) {
  const r = new Map();
  for (const e of n.tracks) {
    const { nodeName: p, propertyName: l } = k.parseTrackName(e.name),
      f = k.findNode(t, p);
    !f ||
      (l !== "position" && l !== "quaternion" && l !== "scale") ||
      (r.get(f) ?? r.set(f, []).get(f)).push({
        path: l,
        at: e.createInterpolant(),
      });
  }
  const i = [];
  for (let e = o; e && e !== t; e = e.parent)
    i.push({
      pos: e.position.clone(),
      quat: e.quaternion.clone(),
      scale: e.scale.clone(),
      tracks: r.get(e) ?? [],
    });
  return new b(i, n.duration);
}
const B = { translation: "position", rotation: "quaternion", scale: "scale" };
function F(t, o, n, r) {
  const i = t.animations?.find((a) => a.name === r) ?? t.animations?.[0];
  if (!i) throw new Error("GLB has no clip");
  const e = t.nodes.map(() => -1);
  t.nodes.forEach((a, s) => (a.children ?? []).forEach((c) => (e[c] = s)));
  let p = 0;
  const l = new Map();
  for (const a of i.channels) {
    const s = i.samplers[a.sampler],
      c = B[a.target.path];
    if (a.target.node === void 0 || !c) continue;
    if (s.interpolation === "CUBICSPLINE")
      throw new Error("CUBICSPLINE clips are not sampled here");
    const u = o(s.input),
      m = o(s.output);
    p = Math.max(p, u[u.length - 1] ?? 0);
    const v = c === "quaternion" ? q : P,
      C = new v(
        `n${a.target.node}.${c}`,
        u,
        m,
        s.interpolation === "STEP" ? I : S,
      );
    (l.get(a.target.node) ?? l.set(a.target.node, []).get(a.target.node)).push({
      path: c,
      at: C.createInterpolant(),
    });
  }
  const f = [];
  for (let a = n; a >= 0; a = e[a]) {
    const s = t.nodes[a],
      c = new d(),
      u = new x(),
      m = new d(1, 1, 1);
    (s.matrix
      ? new y().fromArray(s.matrix).decompose(c, u, m)
      : (s.translation && c.fromArray(s.translation),
        s.rotation && u.fromArray(s.rotation),
        s.scale && m.fromArray(s.scale)),
      f.push({ pos: c, quat: u, scale: m, tracks: l.get(a) ?? [] }));
  }
  return new b(f, p);
}
const O = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      PropNodeClip: b,
      propClockSeconds: E,
      propNodeClipFromGlb: F,
      propNodeClipFromScene: A,
      ridingParts: M,
      setPropClockOffset: _,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
export { O as a, A as b, E as p, M as r, _ as s };
