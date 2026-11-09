import {
  ac as K,
  ag as Ve,
  af as Oe,
  ad as Me,
  a2 as Ge,
  ae as He,
  an as Xe,
  a1 as ye,
  ao as we,
  ap as B,
  R as xe,
  T as je,
  N,
  aq as qe,
  ar as Ye,
  as as $e,
  at as Ke,
  au as Qe,
  av as Je,
  V as g,
  a3 as Q,
  aw as Ze,
  a0 as et,
  a as tt,
  H as at,
  y as L,
  ax as q,
  D as fe,
  ay as rt,
  j as J,
  k as W,
  az as nt,
  aA as it,
} from "./vendor-three-BL04HsGo.js";
import { o as st, g as Pe } from "./settings-JwaLg-ci.js";
import { r as ot, a as lt, l as De, i as ut } from "./ktx2-BurdhfpX.js";
import { a as V } from "./qualityTier-ox0sz1dC.js";
import { q as pt, m as ct, s as ft, u as vt } from "./levelCache-BBQB85vx.js";
import { d as S } from "./assetMap-CgwVrQUz.js";
const mt = { DXT1: 8, DXT3: 16, DXT5: 16 };
function dt(e) {
  if (e.byteLength < 128) return null;
  const t = new DataView(e);
  if (
    t.getUint32(0, !0) !== 542327876 ||
    t.getUint32(4, !0) !== 124 ||
    (t.getUint32(112, !0) & 65024) !== 65024
  )
    return null;
  const a = t.getUint32(12, !0),
    r = t.getUint32(16, !0),
    i = Math.max(1, t.getUint32(28, !0)),
    s =
      mt[
        String.fromCharCode(
          t.getUint8(84),
          t.getUint8(85),
          t.getUint8(86),
          t.getUint8(87),
        )
      ];
  if (!s || !r || !a) return null;
  const n = (r + 3) >> 2,
    l = (a + 3) >> 2;
  let o = 0;
  for (let c = 0; c < i; c++)
    o +=
      Math.max(1, (Math.max(1, r >> c) + 3) >> 2) *
      Math.max(1, (Math.max(1, a >> c) + 3) >> 2) *
      s;
  if (128 + o * 6 > e.byteLength) return null;
  const u = new Float32Array(18),
    p = new Float32Array(12),
    d = (c, v) => {
      ((p[v] = ((c >> 11) & 31) / 31),
        (p[v + 1] = ((c >> 5) & 63) / 63),
        (p[v + 2] = (c & 31) / 31));
    };
  for (let c = 0; c < 6; c++) {
    let v = 0,
      m = 0,
      M = 0,
      h = 0;
    for (let y = 0; y < n * l; y++) {
      const w = 128 + c * o + y * s + (s - 8),
        P = t.getUint16(w, !0),
        pe = t.getUint16(w + 2, !0),
        We = t.getUint32(w + 4, !0);
      (d(P, 0), d(pe, 3));
      const ce = s === 16 || P > pe;
      for (let b = 0; b < 3; b++)
        ((p[6 + b] = ce ? (2 * p[b] + p[3 + b]) / 3 : (p[b] + p[3 + b]) / 2),
          (p[9 + b] = ce ? (p[b] + 2 * p[3 + b]) / 3 : 0));
      for (let b = 0; b < 16; b++) {
        const j = ((We >>> (b * 2)) & 3) * 3;
        ((v += p[j]), (m += p[j + 1]), (M += p[j + 2]));
      }
      h += 16;
    }
    ((u[c * 3] = v / h), (u[c * 3 + 1] = m / h), (u[c * 3 + 2] = M / h));
  }
  return u;
}
const _ = V().texMax;
function ht(e, t = _) {
  const a = e.clone();
  if (
    ((a.userData.pbAnisoFixed = !0),
    (a.userData.pbLowEnvironment = !0),
    (a.anisotropy = 1),
    a.isCompressedTexture)
  ) {
    const r = a,
      i = r.mipmaps ?? [],
      s = i.findIndex((n) => Math.max(n.width, n.height) <= t);
    (pt(e, a, Math.max(0, s)),
      s > 0 &&
        ((r.mipmaps = i.slice(s)),
        (r.source = new K({
          width: r.mipmaps[0].width,
          height: r.mipmaps[0].height,
        }))));
  } else {
    const r = e.image;
    if (
      r?.width &&
      r.height &&
      Math.max(r.width, r.height) > t &&
      typeof document < "u"
    ) {
      const i = document.createElement("canvas"),
        s = t / Math.max(r.width, r.height);
      ((i.width = Math.max(1, Math.round(r.width * s))),
        (i.height = Math.max(1, Math.round(r.height * s))));
      const n = i.getContext("2d");
      n &&
        (n.drawImage(e.image, 0, 0, i.width, i.height),
        (a.source = new K(i)),
        (a.mipmaps = []),
        (a.generateMipmaps = !0));
    }
  }
  return ((a.needsUpdate = !0), a);
}
function gt(e, t = _) {
  const a = new Map(),
    r = new Map(),
    i = (s) => {
      let n = r.get(s);
      if (n) return n;
      ((n = s.clone()), (n.userData.pbLowEnvironment = !0));
      for (const [l, o] of Object.entries(s)) {
        if (
          l === "aoMap" ||
          l === "lightMap" ||
          !o?.isTexture ||
          o.isCubeTexture
        )
          continue;
        let u = a.get(o);
        (u || ((u = ht(o, t)), a.set(o, u)), (n[l] = u));
      }
      return (r.set(s, n), n);
    };
  (e.traverse((s) => {
    const n = s;
    !n.isMesh ||
      !n.material ||
      (n.material = Array.isArray(n.material)
        ? n.material.map(i)
        : i(n.material));
  }),
    Le(e, a));
}
function Le(e, t) {
  if (typeof ImageBitmap > "u") return;
  const a = new Set();
  e.traverse((r) => {
    const i = r.material;
    for (const s of Array.isArray(i) ? i : i ? [i] : [])
      for (const n of Object.values(s)) n?.isTexture && a.add(n.source);
  });
  for (const [r, i] of t) {
    const s = r.source.data;
    r.source !== i.source &&
      !a.has(r.source) &&
      s instanceof ImageBitmap &&
      s.close();
  }
}
const U = V().charMax,
  I = (e) => /\/assets\/(chars|avatar|equip|weapons|cross\/weapons)\//.test(e);
function ie(e, t = U) {
  return Math.max(e.image.width, e.image.height) <= t
    ? 0
    : (e.mipmaps ?? []).findIndex((a) => Math.max(a.width, a.height) <= t);
}
function _e(e, t = U) {
  const a = e.image;
  if (!a?.width || !a.height || Math.max(a.width, a.height) <= t) return e;
  let r, i;
  if (e.isCompressedTexture) {
    const n = e.mipmaps ?? [],
      l = ie(e, t);
    if (l < 0) return e;
    ((i = n.slice(l)), (r = { width: n[l].width, height: n[l].height }));
  } else {
    if (typeof document > "u") return e;
    const n = document.createElement("canvas"),
      l = t / Math.max(a.width, a.height);
    ((n.width = Math.max(1, Math.floor(a.width * l))),
      (n.height = Math.max(1, Math.floor(a.height * l))));
    const o = n.getContext("2d");
    if (!o) return e;
    (o.drawImage(e.image, 0, 0, n.width, n.height), (r = n), (i = []));
  }
  const s = e.clone();
  return (
    (s.source = new K(r)),
    (s.mipmaps = i),
    (s.generateMipmaps = !e.isCompressedTexture),
    (s.userData.pbCharacterTextureLimit = t),
    (s.userData.pbOriginalSize = [a.width, a.height]),
    (s.needsUpdate = !0),
    s
  );
}
function bt(e, t = U) {
  const a = new Map(),
    r = new Map(),
    i = (s) => {
      let n = r.get(s);
      if (n) return n;
      n = s.clone();
      for (const [l, o] of Object.entries(s)) {
        if (!o?.isTexture || o.isCubeTexture) continue;
        let u = a.get(o);
        (u || ((u = _e(o, t)), a.set(o, u)),
          (u.userData.pbModelTexture = !0),
          (n[l] = u));
      }
      return (r.set(s, n), n);
    };
  (e.traverse((s) => {
    const n = s;
    !n.isMesh ||
      !n.material ||
      (n.material = Array.isArray(n.material)
        ? n.material.map(i)
        : i(n.material));
  }),
    Le(e, a));
}
let A = !1;
function Ot(e) {
  ((A =
    !(
      typeof location < "u" &&
      new URLSearchParams(location.search).get("s3tc") === "0"
    ) &&
    e.extensions.has("WEBGL_compressed_texture_s3tc") &&
    e.extensions.has("WEBGL_compressed_texture_s3tc_srgb")),
    A || ut(e));
}
const Ae = {
  DXT1: { fmt: Me, block: 8 },
  DXT3: { fmt: Oe, block: 16 },
  DXT5: { fmt: Ve, block: 16 },
};
function Te(e, t = {}) {
  if (e.byteLength < 128) return null;
  const a = new DataView(e);
  if (a.getUint32(0, !0) !== 542327876 || a.getUint32(4, !0) !== 124)
    return null;
  const r = a.getUint32(12, !0),
    i = a.getUint32(16, !0),
    s = a.getUint32(28, !0),
    n = String.fromCharCode(
      a.getUint8(84),
      a.getUint8(85),
      a.getUint8(86),
      a.getUint8(87),
    ),
    l = Ae[n];
  if (!l || !i || !r || !s) return null;
  const o = (a.getUint32(80, !0) & 1) !== 0,
    u = t.rgba ? (t.maxSide ?? 1 / 0) : 1 / 0,
    p = [],
    d = [];
  let c = 128;
  for (let M = 0; M < s; M++) {
    const h = Math.max(1, i >> M),
      y = Math.max(1, r >> M),
      w = Math.max(1, (h + 3) >> 2) * Math.max(1, (y + 3) >> 2) * l.block;
    if (c + w > e.byteLength) return null;
    if (Math.max(h, y) <= u) {
      const P = new Uint8Array(e, c, w);
      (p.push({ data: t.rgba ? ct(P, h, y, n, o) : P, width: h, height: y }),
        t.rgba && d.push(ft(P, h, y, n, o)));
    }
    c += w;
  }
  if (!p.length) return null;
  const v = t.rgba ? Ge : l.fmt === Me && o ? He : l.fmt,
    m = new Xe(p, p[0].width, p[0].height, v, ye);
  return (
    (m.generateMipmaps = !1),
    (m.minFilter = p.length > 1 ? we : B),
    (m.magFilter = B),
    (m.wrapS = m.wrapT = xe),
    (m.needsUpdate = !0),
    t.rgba && vt(m, d),
    m
  );
}
class Se {
  name = "PB_dds_texture";
  parser;
  base;
  modelLimit;
  constructor(t, a, r = U) {
    ((this.parser = t), (this.base = a), (this.modelLimit = r));
  }
  byUrl = new Map();
  used = new Set();
  loadTexture(t) {
    const a = this.parser.options.path,
      r = this.base ?? a;
    if (
      r === void 0 ||
      (this.base !== null && a !== void 0 && a !== this.base) ||
      (this.base === null && r.includes("/models_lod/"))
    )
      return null;
    const i = this.parser.json,
      s = i.images?.[i.textures?.[t]?.source ?? -1];
    if (!s?.uri || !/\.png$/i.test(s.uri) || s.uri.startsWith("data:"))
      return null;
    const n = r + s.uri.replace(/\.png$/i, ".dds"),
      l = () =>
        S(r + s.uri)
          ? this.parser.loadTextureImage(
              t,
              i.textures[t].source,
              this.parser.textureLoader,
            )
          : Promise.resolve(null);
    let o = this.byUrl.get(n);
    if (!o) {
      const u =
          this.base !== null &&
          !!i.materials?.some((c) => c.occlusionTexture?.index === t),
        p =
          this.base !== null ? (u ? 1 / 0 : _) : I(r) ? this.modelLimit : 1 / 0;
      ((o = (A ? Promise.resolve(null) : De(n))
        .then((c) =>
          c &&
          (this.base === null ||
            u ||
            Math.max(c.image.width, c.image.height) <= _ ||
            c.mipmaps?.some((v) => Math.max(v.width, v.height) <= _))
            ? ((c.name = s.name ?? ""), c)
            : S(n)
              ? fetch(n)
                  .then((v) => (v.ok ? v.arrayBuffer() : null))
                  .then((v) => {
                    const m = v && Te(v, { rgba: !A, maxSide: p });
                    return !m ||
                      (I(r) && ie(m, this.modelLimit) < 0) ||
                      (this.base !== null &&
                        Math.max(m.image.width, m.image.height) > _ &&
                        !m.mipmaps?.some(
                          (M) => Math.max(M.width, M.height) <= _,
                        ) &&
                        !u)
                      ? null
                      : ((m.name = s.name ?? ""), (m.userData.ddsUrl = n), m);
                  })
              : null,
        )
        .catch(() => null)),
        this.byUrl.set(n, o));
    }
    return o.then((u) => {
      if (!u) return l();
      if (this.base !== null) return u;
      const p = this.used.has(n);
      return (this.used.add(n), p ? u.clone() : u);
    });
  }
}
const F = new Set();
let Z = V().anisotropy;
function Ue(e) {
  const t = Z;
  e.userData.pbAnisoFixed ||
    e.anisotropy === t ||
    ((e.anisotropy = t), e.version > 0 && (e.needsUpdate = !0));
}
function Mt(e) {
  return (
    F.has(e) || (F.add(e), e.addEventListener("dispose", () => F.delete(e))),
    Ue(e),
    e
  );
}
function Gt() {
  const e = V().anisotropy;
  if (e !== Z) {
    Z = e;
    for (const t of F) Ue(t);
  }
}
class Ee {
  name = "PB_aniso";
  parser;
  constructor(t) {
    this.parser = t;
  }
  afterRoot(t) {
    return (
      t.scene.traverse((a) => {
        const r = a.material;
        for (const i of Array.isArray(r) ? r : r ? [r] : [])
          for (const s of Object.values(i)) s?.isTexture && Mt(s);
      }),
      null
    );
  }
}
function Ht(e, t) {
  (e.register(() => ({
    name: "PB_low_environment",
    afterRoot: (a) => (gt(a.scene), null),
  })),
    e.register((a) => new Ee(a)),
    e.register((a) => new Se(a, t)));
}
function Xt(e, t = U) {
  return (
    e.register((a) => new Se(a, null, t)),
    e.register((a) => ({
      name: "PB_character_texture_limit",
      afterRoot: (r) => (I(a.options.path ?? "") && bt(r.scene, t), null),
    })),
    e.register((a) => new Ee(a)),
    e.register((a) => new yt(a)),
    e
  );
}
class yt {
  name = "PB_detail_maps";
  parser;
  constructor(t) {
    this.parser = t;
  }
  afterRoot(t) {
    const a = this.parser.options.path;
    if (a === void 0 || a.includes("/models_lod/")) return null;
    const r = new Set();
    return (
      t.scene.traverse((i) => {
        for (const s of [i.material].flat()) {
          const n = s?.userData;
          !n ||
            r.has(s) ||
            (r.add(s),
            typeof n.pbNormal == "string" && (n.pbNormalUrl = a + n.pbNormal),
            typeof n.pbSpec == "string" && (n.pbSpecUrl = a + n.pbSpec),
            typeof n.pbRef == "string" && (n.pbRefUrl = a + n.pbRef),
            typeof n.pbEmissive == "string" &&
              (n.pbEmissiveUrl = a + n.pbEmissive));
        }
      }),
      null
    );
  }
}
const C = new Map();
function wt(e) {
  let t = C.get(e);
  if (!t) {
    const a = I(e),
      r = e.replace(/\.png$/i, ".dds"),
      i = () =>
        S(r)
          ? fetch(r)
              .then((n) => (n.ok ? n.arrayBuffer() : null))
              .then((n) => {
                const l =
                  (n && Te(n, { rgba: !A, maxSide: a ? U : 1 / 0 })) || null;
                return l && a && ie(l) < 0 ? null : l;
              })
              .catch(() => null)
          : Promise.resolve(null);
    ((t = (A ? Promise.resolve(null) : De(r))
      .then(
        (n) =>
          n ??
          i()
            .then(
              (l) =>
                l ??
                (S(e)
                  ? new je()
                      .loadAsync(e)
                      .then(
                        (o) => (
                          (o.flipY = !1),
                          (o.wrapS = o.wrapT = xe),
                          (o.colorSpace = N),
                          o
                        ),
                      )
                  : null),
            )
            .then((l) => (l && a ? _e(l) : l)),
      )
      .catch(() => (C.delete(e), null))),
      C.set(e, t));
  }
  return t;
}
function xt(e) {
  if (e.byteLength < 128) return null;
  const t = new DataView(e);
  if (
    t.getUint32(0, !0) !== 542327876 ||
    t.getUint32(4, !0) !== 124 ||
    (t.getUint32(112, !0) & 65024) !== 65024
  )
    return null;
  const a = t.getUint32(12, !0),
    r = t.getUint32(16, !0),
    i = Math.max(1, t.getUint32(28, !0)),
    s =
      Ae[
        String.fromCharCode(
          t.getUint8(84),
          t.getUint8(85),
          t.getUint8(86),
          t.getUint8(87),
        )
      ];
  if (!s || !r || !a) return null;
  const n = [];
  let l = 128;
  for (let u = 0; u < 6; u++) {
    const p = [];
    for (let d = 0; d < i; d++) {
      const c = Math.max(1, r >> d),
        v = Math.max(1, a >> d),
        m = Math.max(1, (c + 3) >> 2) * Math.max(1, (v + 3) >> 2) * s.block;
      if (l + m > e.byteLength) return null;
      (p.push({ data: new Uint8Array(e, l, m), width: c, height: v }),
        (l += m));
    }
    n.push({ mipmaps: p, width: r, height: a });
  }
  const o = new qe(n, s.fmt, ye);
  return (
    (o.generateMipmaps = !1),
    (o.minFilter = i > 1 ? we : B),
    (o.magFilter = B),
    (o.colorSpace = N),
    (o.needsUpdate = !0),
    o
  );
}
async function Pt(e) {
  if (!A || !S(e)) return null;
  try {
    const t = await fetch(e);
    if (!t.ok) return null;
    const a = await t.arrayBuffer(),
      r = xt(a),
      i = dt(a);
    return r && i ? { tex: r, avg: i } : null;
  } catch {
    return null;
  }
}
function Dt() {
  return lt(C, (e) => e.dispose());
}
ot("detailMaps", Dt);
function Lt(e, t = e) {
  const a = e.userData.pbWorldRender;
  if (a?.version === 1) {
    if (a.blend) {
      const { src: r, dst: i, op: s } = a.blend;
      if (r !== 5 || (i !== 3 && i !== 6) || s !== 1)
        throw new Error("Unsupported map blend state");
      ((t.transparent = !0),
        (t.blending = Ye),
        (t.blendEquation = $e),
        (t.blendSrc = Ke),
        (t.blendDst = i === 3 ? Qe : Je),
        (t.premultipliedAlpha = !1));
    }
    if (a.alphaTest !== void 0) {
      t.alphaTest = a.alphaTest;
      const r = t.uniforms;
      r?.alphaTest && (r.alphaTest.value = a.alphaTest);
    }
    (a.depthWrite !== void 0 && (t.depthWrite = a.depthWrite),
      a.depthTest !== void 0 && (t.depthTest = a.depthTest));
  }
}
const x =
    typeof location > "u" ||
    new URLSearchParams(location.search).get("pblight") !== "1",
  f = {
    pbAmbient: { value: new g(1, 1, 1) },
    pbLightDir: { value: new g(0, 1, 0) },
    pbLightDiffuse: { value: new Q(0, 0, 0, 1) },
    pbLightSpecular: { value: new Q(0, 0, 0, 1) },
    pbEnvMap: { value: null },
    pbHasEnv: { value: 0 },
    pbEnvAvg: { value: Array.from({ length: 6 }, () => new g()) },
    pbFogMode: { value: 0 },
    pbFogColor: { value: new g(1, 1, 1) },
    pbFogParams: { value: new g(1, 1e3, 1) },
  },
  E = new Set();
let ee = !1;
function Fe(e) {
  const t = Pe();
  return e.userData.pbFullLook
    ? { ...t, normalMap: !0, specularMap: !0, reflection: !0 }
    : t;
}
function O(e) {
  const t = {};
  if ((e.userData.pbArray && (t.PB_ARRAY = ""), x))
    ((t.PBM_LIGHT = ""), e.userData.pbFullLook && (t.PBM_VIEW = ""));
  else if (!e.userData.pbLowEnvironment) {
    const i = Fe(e),
      s = e.uniforms,
      n = f.pbHasEnv.value > 0;
    (i.normalMap && s.hasNormal.value && (t.PB_NORMAL = ""),
      s.hasSpec.value &&
        ((t.PB_SPECMAP = ""), i.specularMap && (t.PB_SPEC = "")),
      i.reflection &&
        (s.hasEmissive.value && (t.PB_EMISSIVE = ""),
        s.hasRef.value && n && (t.PB_REFLECT = "")),
      i.ibl && n && (t.PB_IBL = ""),
      i.rimLight && (t.PB_RIM = ""));
  }
  const a = e.defines ?? {},
    r = Object.keys(t);
  (r.length === Object.keys(a).length && r.every((i) => i in a)) ||
    ((e.defines = t), (e.needsUpdate = !0));
}
function se() {
  for (const e of E) O(e);
}
const k = new Set(),
  ve = new WeakMap(),
  te = new WeakMap();
function oe(e) {
  const t = Fe(e);
  let a = ve.get(e);
  a || ve.set(e, (a = new Set()));
  const r = (i, s, n, l) => {
    if (!i || typeof s != "string" || a.has(n)) return;
    a.add(n);
    const o = wt(s).then((p) => {
      if (!p) throw new Error(`Material texture could not load: ${s}`);
      (e.userData.pbKeepCanvas && (p.userData.pbKeepCanvas = !0),
        (e.uniforms[n].value = p),
        (e.uniforms[l].value = 1),
        O(e));
    });
    let u = te.get(e);
    (u || te.set(e, (u = new Map())),
      u.set(n, o),
      o.catch(() => {
        a.delete(n);
      }));
  };
  (r(!x && t.normalMap, e.userData.pbNormalUrl, "normalMap", "hasNormal"),
    r(
      !x && (t.specularMap || t.ibl),
      e.userData.pbSpecUrl,
      "specMap",
      "hasSpec",
    ),
    r(!x && t.reflection, e.userData.pbRefUrl, "refMap", "hasRef"),
    r(
      !x && t.reflection,
      e.userData.pbEmissiveUrl,
      "emissiveMap",
      "hasEmissive",
    ));
}
let ae = null,
  re = null,
  Ce = Promise.resolve();
function G() {
  const e = ae,
    t = Pe();
  !e ||
    e === re ||
    !(t.reflection || t.ibl || ee) ||
    ((re = e),
    (Ce = Pt(e).then((a) => {
      if (e !== ae) return a?.tex.dispose();
      if (
        ((f.pbEnvMap.value = a?.tex ?? null), (f.pbHasEnv.value = a ? 1 : 0), a)
      )
        for (let r = 0; r < 6; r++) f.pbEnvAvg.value[r].fromArray(a.avg, r * 3);
      se();
    })));
}
async function jt(e) {
  const t = new Set();
  (e.traverse((a) => {
    const r = a.material;
    for (const i of Array.isArray(r) ? r : r ? [r] : [])
      if (k.has(i)) {
        oe(i);
        for (const s of te.get(i)?.values() ?? []) t.add(s);
      }
  }),
    G(),
    await Promise.all([...t, Ce]));
}
function me(e) {
  ((ae = e),
    (re = null),
    f.pbEnvMap.value?.dispose(),
    (f.pbEnvMap.value = null),
    (f.pbHasEnv.value = 0),
    se(),
    G());
}
st(() => {
  for (const e of k) oe(e);
  (se(), G());
});
let le = null,
  z = new g(0.588, 0.588, 0.588);
const H = new Set();
function qt() {
  return le;
}
const _t = new Set(["deadtown"]);
async function Yt(e) {
  let t = null;
  const a = /\/maps\/([^/]+)\/lighting\.json$/.exec(e)?.[1];
  if (!S(e) || (a && _t.has(a))) return (de(null), me(null), null);
  try {
    const r = await fetch(e),
      i = r.headers.get("content-type") ?? "";
    r.ok && !i.includes("text/html") && (t = await r.json());
  } catch {
    t = null;
  }
  return (
    de(t),
    me(t?.envRef ? e.replace(/lighting.json$/, t.envRef) : null),
    t
  );
}
function de(e) {
  if (((le = e), (ze = e?.lightVolume ? Ct(e.lightVolume) : null), !e)) return;
  (f.pbAmbient.value.fromArray(e.ambient),
    (z = new g().fromArray(e.defaultDiffuse)),
    e.light
      ? (f.pbLightDir.value.fromArray(e.light.dirToLight).normalize(),
        f.pbLightDiffuse.value.fromArray(e.light.diffuse),
        f.pbLightSpecular.value.fromArray(e.light.specular))
      : f.pbLightDiffuse.value.set(0, 0, 0, 1));
  const t = e.fog.find((a) => a.index === 0);
  ((f.pbFogMode.value = t && t.enable ? t.mode : 0),
    t &&
      (f.pbFogColor.value.set(
        t.color[0] / 255,
        t.color[1] / 255,
        t.color[2] / 255,
      ),
      f.pbFogParams.value.set(t.near, t.far, t.density)));
  for (const a of H) a.reset();
}
function $t(e, t) {
  ((e.toneMapping = et), (e.toneMappingExposure = 1));
  const a = x ? void 0 : le?.fog.find((r) => r.index === 0);
  if (a && a.enable) {
    const r = new L().setRGB(
      a.color[0] / 255,
      a.color[1] / 255,
      a.color[2] / 255,
      J,
    );
    t.fog =
      a.mode === 3
        ? new nt(r, a.near, a.far)
        : a.mode === 2
          ? new it(r, a.density)
          : null;
  } else t.fog = null;
}
function Kt() {
  const e = new tt();
  if (((e.name = "pbFallbackLights"), x)) {
    e.add(
      new at(
        new L().setRGB(1, 1, 1, q),
        new L().setRGB(80 / 255, 80 / 255, 90 / 255, q),
        Math.PI,
      ),
    );
    const s = new fe(new L().setRGB(1, 1, 1, q), 0.6 * Math.PI);
    return (s.position.set(30, 60, 20), e.add(s), e);
  }
  const t = f.pbAmbient.value,
    a = f.pbLightDiffuse.value,
    r = z;
  e.add(new rt(new L().setRGB(t.x, t.y, t.z, J), Math.PI));
  const i = new fe(
    new L().setRGB(
      Math.min(1, a.x * r.x),
      Math.min(1, a.y * r.y),
      Math.min(1, a.z * r.z),
      J,
    ),
    Math.PI,
  );
  return (i.position.copy(f.pbLightDir.value).multiplyScalar(50), e.add(i), e);
}
const ue = `
vec3 pbmLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
vec3 pbmOut(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
uniform int pbFogMode;
uniform vec3 pbFogColor;
uniform vec3 pbFogParams;
varying float vPbFogDepth;
vec3 pbFog(vec3 c) {
  if (pbFogMode == 0) return c;
  float z = vPbFogDepth, f;
  if (pbFogMode == 3) f = (pbFogParams.y - z) / (pbFogParams.y - pbFogParams.x);
  else if (pbFogMode == 1) f = exp(-pbFogParams.z * z);
  else f = exp(-(pbFogParams.z * z) * (pbFogParams.z * z));
  return mix(pbFogColor, c, clamp(f, 0.0, 1.0));
}`,
  At = `
#include <common>
#ifndef USE_UV1
attribute vec2 uv1;
#endif
varying vec2 vPbUv;
varying vec2 vPbUv1;
varying float vPbFogDepth;
void main() {
  vPbUv = uv;
  vPbUv1 = uv1;
  #include <begin_vertex>
  #include <project_vertex>
  vPbFogDepth = -mvPosition.z; // table fog: view-space depth (W-friendly projection)
}`,
  Tt = `
uniform sampler2D map;
uniform sampler2D luxMap;
uniform vec4 pbLightDiffuse;
uniform float alphaTest;
varying vec2 vPbUv;
varying vec2 vPbUv1;
${ue}
void main() {
  vec4 D = texture2D(map, vPbUv);
  vec3 L = texture2D(luxMap, vPbUv1).rgb;
  float a = D.a * pbLightDiffuse.a;
  if (a <= alphaTest) discard;
#ifdef PBM_LIGHT
  gl_FragColor = vec4(pbmOut(pbmLin(D.rgb) * pbmLin(L) * 4.59), a); return; // MeshBasicMaterial + lightMap 4.59
#endif
  vec3 c = 2.0 * D.rgb * (L * ((L + D.rgb) * 0.3 + 1.0)); // Phong_DLX_Dir_
  gl_FragColor = vec4(pbFog(clamp(c, 0.0, 1.0)), a);
}`,
  Re = `
#include <common>
#include <skinning_pars_vertex>
varying vec2 vPbUv;
varying vec3 vPbNormal;
varying vec3 vPbWorldPos;
varying float vPbFogDepth;
#ifdef PB_ARRAY
attribute float pbLayer;
varying float vPbLayer;
#endif
void main() {
  vPbUv = uv;
#ifdef PB_ARRAY
  vPbLayer = pbLayer;
#endif
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vPbNormal = inverseTransformDirection(transformedNormal, viewMatrix); // vs_1_1: normalised per vertex
  vPbWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vPbFogDepth = -mvPosition.z;
}`,
  Be = `
uniform sampler2D map;
uniform float hasMap;
uniform sampler2D normalMap;
uniform sampler2D specMap;
#ifdef PB_ARRAY
uniform sampler2DArray mapArr;
uniform sampler2DArray normalArr;
uniform sampler2DArray specArr;
varying float vPbLayer;
#define PB_MAP(uv) texture(mapArr, vec3(uv, vPbLayer))
#define PB_NORMAL_MAP(uv) texture(normalArr, vec3(uv, vPbLayer))
#define PB_SPEC_MAP(uv) texture(specArr, vec3(uv, vPbLayer))
#else
#define PB_MAP(uv) texture2D(map, uv)
#define PB_NORMAL_MAP(uv) texture2D(normalMap, uv)
#define PB_SPEC_MAP(uv) texture2D(specMap, uv)
#endif
uniform sampler2D refMap;
uniform samplerCube pbEnvMap;
uniform vec3 pbEnvAvg[6];
uniform sampler2D emissiveMap;
uniform vec3 emissiveColor;
uniform vec3 baseColor;
uniform vec3 pbAmbient;
uniform vec3 pbLightDir;
uniform vec4 pbLightDiffuse;
uniform vec4 pbLightSpecular;
uniform vec4 mtlDiffuse;
uniform vec3 mtlSpecular;
uniform float mtlShininess;
uniform float alphaTest;
uniform float useFog;
varying vec2 vPbUv;
varying vec3 vPbNormal;
varying vec3 vPbWorldPos;
${ue}
float d3dPow(float x, float y) { return y <= 0.0 ? 1.0 : pow(x, y); }
void main() {
  vec4 D = hasMap > 0.5 ? PB_MAP(vPbUv) : vec4(1.0);
  D.rgb *= baseColor;
  vec3 N = vPbNormal;                        // interpolated, not renormalised (ps_2_x uses t1 directly)
#ifdef PB_NORMAL
  {
    // Phong_DN*: n = x*T - y*B + sqrt(1-x^2-y^2)*N. The vertex tangent/binormal in the
    // i3 VA30 are not reliable (zero in half the triangles), so the frame comes from screen derivatives (cotangent frame).
    // [INFERIDO] sign: in the vertex data T = +dP/du and B = -dP/dv (measured on Weapon_AK-47_PBIC2013, B only where non-zero), so
    // -y*B = +y*dP/dv: the D3D map is a GL map with G flipped; uv here is the glTF/D3D one (v down), no flip needed.
    vec3 Ng = normalize(vPbNormal);
    vec3 dp1 = dFdx(vPbWorldPos), dp2 = dFdy(vPbWorldPos);
    vec2 duv1 = dFdx(vPbUv), duv2 = dFdy(vPbUv);
    vec3 dp2perp = cross(dp2, Ng), dp1perp = cross(Ng, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
    float inv = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-20));
    vec2 xy = PB_NORMAL_MAP(vPbUv).rg * 2.0 - 1.0;
    N = normalize(xy.x * T * inv + xy.y * B * inv + sqrt(max(1.0 - dot(xy, xy), 0.0)) * Ng); // bytecode: nrm r1.xyz
  }
#endif
  vec3 L = pbLightDir;
  vec4 LD = pbLightDiffuse * mtlDiffuse;     // g_vLightDiffuse0
  float a = D.a * LD.a;
  if (a <= alphaTest) discard;
#ifdef PBM_LIGHT
  {
    // MeshLambertMaterial: D * (hemisphere + directional), linear; the viewmodel's lights are in its camera's frame
#ifdef PBM_VIEW
    vec3 Nl = normalize((viewMatrix * vec4(N, 0.0)).xyz), Ld = vec3(0.0, 1.0, 0.0);
    float Li = 0.5;
#else
    vec3 Nl = normalize(N), Ld = vec3(0.4286, 0.8571, 0.2857);
    float Li = 0.6;
#endif
    vec3 irr = mix(vec3(0.3137, 0.3137, 0.3529), vec3(1.0), 0.5 * Nl.y + 0.5) + Li * max(dot(Nl, Ld), 0.0);
    gl_FragColor = vec4(pbmOut(pbmLin(D.rgb) * irr), a);
    return;
  }
#endif
  float nl = dot(L, N);
  float ndl = clamp(nl, 0.0, 1.0);
  vec3 R = 2.0 * nl * N - L;
  vec3 V = normalize(cameraPosition - vPbWorldPos);
  float rv = clamp(dot(R, V), 0.0, 1.0);
  // d3dPow: ps_2_x pow = exp2(y * log2(x)) with the D3D9 rule 0 * anything = 0, so pow(0, 0) = 1. GLSL pow(0, 0) is NaN:
  // spec maps with alpha 0 (as-50_beyond_spec, coltppython_holder_spec 100 %) painted every R.V = 0 texel black.
#ifdef PB_SPEC
  vec4 S = PB_SPEC_MAP(vPbUv);               // Phong_*S*: specMap.rgb*2 * pow(R.V, specMap.a*255)
  vec3 spec = S.rgb * 2.0 * d3dPow(rv, S.a * 255.0);
#else
  vec3 spec = d3dPow(rv, mtlShininess) * pbLightSpecular.rgb * mtlSpecular; // g_vLightSpecular0
#endif
  vec3 k = (D.rgb + ndl) * 0.3 + 1.0;
  vec3 c = LD.rgb * (ndl * (D.rgb * k + spec)) + D.rgb * pbAmbient;   // Phong_D_Dir_
#ifdef PB_EMISSIVE
  c += texture2D(emissiveMap, vPbUv).rgb * emissiveColor * 4.0; // Phong_*E*: E * g_vMtlEmissive * 4
#endif
#ifdef PB_REFLECT
  {
    // Phong_*RM*: rgb += texCUBE(g_texReflect, g_mInvView * reflect(nrm(viewPos), N)) * reflectMask.rgb (additive, unlit). Done in world space:
    // the world coordinates are the D3D ones (cubemap +Y face = sky, measured), so no axis swap. [INFERIDO] face orientation / no x flip.
    vec3 Rw = reflect(normalize(vPbWorldPos - cameraPosition), normalize(N));
    c += textureCube(pbEnvMap, Rw).rgb * texture2D(refMap, vPbUv).rgb;
  }
#endif
#if defined(PB_RIM) || defined(PB_IBL)
  {
    // DX11 "máximo" (ini [DX11] RimLight / IBL): only booleans exist in the clients, the HLSL is encrypted.
    // Everything below is [RECRIADO]; constants are conservative guesses, not exe values.
    vec3 Nn = normalize(N);
    float mapLight = clamp(dot(pbAmbient + pbLightDiffuse.rgb, vec3(0.3333)), 0.0, 1.0); // dark map = no neon
#ifdef PB_IBL
    {
      // IBL diffuse: the env_ref.dds has no mips, so the CPU averaged each face (pbEnvAvg, cubeFaceAverages); blend the 6 colours by N^2
      // per axis (sign picks +/- face, same GL face order as the reflection sample) x albedo.
      vec3 w2 = Nn * Nn;
      vec3 irr = w2.x * (Nn.x >= 0.0 ? pbEnvAvg[0] : pbEnvAvg[1]) + w2.y * (Nn.y >= 0.0 ? pbEnvAvg[2] : pbEnvAvg[3]) + w2.z * (Nn.z >= 0.0 ? pbEnvAvg[4] : pbEnvAvg[5]);
      c += D.rgb * irr * 0.35;
      // IBL specular: sharp sample along reflect(V) x existing spec map (or its mean without one), fresnel-weighted.
      vec3 Vi = normalize(cameraPosition - vPbWorldPos);
      float fres = 0.04 + 0.96 * pow(1.0 - clamp(dot(Nn, Vi), 0.0, 1.0), 5.0);
#ifdef PB_SPECMAP
      vec3 sc = PB_SPEC_MAP(vPbUv).rgb;
#else
      vec3 sc = vec3(0.5);
#endif
      c += textureCube(pbEnvMap, reflect(-Vi, Nn), 2.0).rgb * sc * (0.25 + fres) * 0.5;
    }
#endif
#ifdef PB_RIM
    // Rim: pow(1-N.V, 3) * color * 0.5, additive, scaled by map light (ambient + directional).
    {
      float rim = pow(1.0 - clamp(dot(Nn, normalize(cameraPosition - vPbWorldPos)), 0.0, 1.0), 3.0);
      c += rim * vec3(0.85, 0.9, 1.0) * 0.5 * mapLight;
    }
#endif
  }
#endif
  c = clamp(c, 0.0, 1.0);
  gl_FragColor = vec4(useFog > 0.5 ? pbFog(c) : c, a);
}`;
function ne(e) {
  return e
    ? (e.colorSpace !== N && ((e.colorSpace = N), (e.needsUpdate = !0)), e)
    : null;
}
function X(e, t) {
  return (
    (t.name = e.name),
    (t.side = e.side),
    (t.transparent = e.transparent),
    (t.opacity = e.opacity),
    (t.depthWrite = e.depthWrite),
    (t.depthTest = e.depthTest),
    (t.blending = e.blending),
    (t.toneMapped = !1),
    (t.userData.pb = !0),
    t
  );
}
function Qt(e) {
  const t = e.aoMap ?? e.lightMap,
    a = new W({
      vertexShader: At,
      fragmentShader: Tt,
      uniforms: {
        map: { value: ne(e.map) },
        luxMap: { value: ne(t) },
        alphaTest: { value: e.alphaTest > 0 ? e.alphaTest : -1 },
        pbLightDiffuse: f.pbLightDiffuse,
        pbFogMode: f.pbFogMode,
        pbFogColor: f.pbFogColor,
        pbFogParams: f.pbFogParams,
      },
    });
  return (x && (a.defines = { PBM_LIGHT: "" }), X(e, a), Lt(e, a), a);
}
const St = `
#include <common>
#ifndef USE_UV1
attribute vec2 uv1;
#endif
attribute vec2 pbLayer;
varying vec2 vPbUv;
varying vec2 vPbUv1;
varying vec2 vPbLayer;
varying float vPbFogDepth;
void main() {
  vPbUv = uv;
  vPbUv1 = uv1;
  vPbLayer = pbLayer;
  #include <begin_vertex>
  #include <project_vertex>
  vPbFogDepth = -mvPosition.z;
}`,
  Ut = `
uniform sampler2DArray mapArr;
uniform sampler2DArray luxArr;
uniform vec4 pbLightDiffuse;
uniform float alphaTest;
varying vec2 vPbUv;
varying vec2 vPbUv1;
varying vec2 vPbLayer;
${ue}
void main() {
  vec4 D = texture(mapArr, vec3(vPbUv, vPbLayer.x));
  vec3 L = texture(luxArr, vec3(vPbUv1, vPbLayer.y)).rgb;
  float a = D.a * pbLightDiffuse.a;
  if (a <= alphaTest) discard;
#ifdef PBM_LIGHT
  gl_FragColor = vec4(pbmOut(pbmLin(D.rgb) * pbmLin(L) * 4.59), a); return; // MeshBasicMaterial + lightMap 4.59
#endif
  vec3 c = 2.0 * D.rgb * (L * ((L + D.rgb) * 0.3 + 1.0)); // Phong_DLX_Dir_
  gl_FragColor = vec4(pbFog(clamp(c, 0.0, 1.0)), a);
}`;
function Jt(e, t, a) {
  const r = new W({
    vertexShader: St,
    fragmentShader: Ut,
    uniforms: {
      mapArr: { value: t },
      luxArr: { value: a },
      alphaTest: { value: e.uniforms.alphaTest.value },
      pbLightDiffuse: f.pbLightDiffuse,
      pbFogMode: f.pbFogMode,
      pbFogColor: f.pbFogColor,
      pbFogParams: f.pbFogParams,
    },
  });
  return (x && (r.defines = { PBM_LIGHT: "" }), X(e, r));
}
const R = new WeakMap();
class Ne {
  diffuse = { value: new Q(0.588, 0.588, 0.588, 1) };
  specular = { value: new g(0, 0, 0) };
  shininess = { value: 12.8 };
  materials = new Map();
  bindMaterial(t, a) {
    const r = (a && this.materials.get(a)) ?? t.transparent;
    (this.materials.set(t, r),
      R.set(t, this),
      this.blendMaterial(t, r),
      t.addEventListener("dispose", () => {
        (this.materials.delete(t), R.delete(t));
      }));
  }
  blendMaterial(t, a) {
    const r = this.diffuse.value.w < 1 || a;
    t.transparent !== r && ((t.transparent = r), (t.needsUpdate = !0));
  }
  setAlpha(t) {
    const a = this.diffuse.value.w < 1;
    if (((this.diffuse.value.w = t), a !== t < 1))
      for (const [r, i] of this.materials) this.blendMaterial(r, i);
  }
  releaseMaterials() {
    for (const t of this.materials.keys()) R.delete(t);
    this.materials.clear();
  }
  t = 1;
  prev = new g();
  target = new g();
  primed = !1;
  reset() {
    ((this.primed = !1), (this.t = 1));
  }
  update(t, a) {
    const r = this.diffuse.value;
    if (!this.primed) {
      (be(t, this.target),
        this.prev.copy(this.target),
        r.set(this.target.x, this.target.y, this.target.z, r.w),
        (this.primed = !0),
        (this.t = 0));
      return;
    }
    if (((this.t += a), this.t >= he)) {
      (this.prev.copy(this.target), be(t, this.target), (this.t = 0));
      return;
    }
    const i = Math.min(1, this.t * (1 / he));
    r.set(
      this.prev.x + (this.target.x - this.prev.x) * i,
      this.prev.y + (this.target.y - this.prev.y) * i,
      this.prev.z + (this.target.z - this.prev.z) * i,
      r.w,
    );
  }
}
const Ie = new Ne();
H.add(Ie);
function Zt() {
  const e = new Ne();
  return (H.add(e), e);
}
function ea(e) {
  e !== Ie && (H.delete(e), e.releaseMaterials());
}
function Et(e, t, a = !1, r = !1) {
  const i = e,
    s = !!i.userData.pbLowEnvironment,
    n = ne(i.map),
    l = i.color ? i.color.clone() : new L(1, 1, 1);
  n || l.convertLinearToSRGB();
  const o = new W({
    vertexShader: Re,
    fragmentShader: Be,
    uniforms: {
      map: { value: n },
      hasMap: { value: n ? 1 : 0 },
      normalMap: { value: null },
      hasNormal: { value: 0 },
      specMap: { value: null },
      hasSpec: { value: 0 },
      refMap: { value: null },
      hasRef: { value: 0 },
      emissiveMap: { value: null },
      hasEmissive: { value: 0 },
      emissiveColor: {
        value: new g().fromArray(i.userData.pbEmissiveColor ?? [1, 1, 1]),
      },
      pbEnvMap: f.pbEnvMap,
      pbHasEnv: f.pbHasEnv,
      baseColor: { value: new g(l.r, l.g, l.b) },
      alphaTest: { value: i.alphaTest > 0 ? i.alphaTest : -1 },
      useFog: { value: a ? 1 : 0 },
      mtlDiffuse: t.diffuse,
      mtlSpecular: t.specular,
      mtlShininess: t.shininess,
      pbEnvAvg: f.pbEnvAvg,
      pbAmbient: f.pbAmbient,
      pbLightDir: f.pbLightDir,
      pbLightDiffuse: f.pbLightDiffuse,
      pbLightSpecular: f.pbLightSpecular,
      pbFogMode: f.pbFogMode,
      pbFogColor: f.pbFogColor,
      pbFogParams: f.pbFogParams,
    },
  });
  return (
    (o.userData.pbLowEnvironment = s),
    r && !s && ((o.userData.pbFullLook = !0), ee || ((ee = !0), G())),
    E.add(o),
    o.addEventListener("dispose", () => {
      (E.delete(o), k.delete(o));
    }),
    !s &&
      (i.userData.pbNormalUrl ||
        i.userData.pbSpecUrl ||
        i.userData.pbRefUrl ||
        i.userData.pbEmissiveUrl) &&
      ((o.userData.pbNormalUrl = i.userData.pbNormalUrl),
      (o.userData.pbSpecUrl = i.userData.pbSpecUrl),
      (o.userData.pbRefUrl = i.userData.pbRefUrl),
      (o.userData.pbEmissiveUrl = i.userData.pbEmissiveUrl),
      k.add(o),
      oe(o)),
    O(o),
    X(e, o),
    t.bindMaterial(o),
    o
  );
}
function ta(e, t, a, r) {
  const i = e.uniforms,
    s = new W({
      vertexShader: Re,
      fragmentShader: Be,
      uniforms: {
        ...Object.fromEntries(Object.entries(i).map(([n, l]) => [n, l])),
        map: { value: null },
        hasMap: { value: 1 },
        normalMap: { value: null },
        hasNormal: { value: a ? 1 : 0 },
        specMap: { value: null },
        hasSpec: { value: r ? 1 : 0 },
        refMap: { value: null },
        hasRef: { value: 0 },
        emissiveMap: { value: null },
        hasEmissive: { value: 0 },
        mapArr: { value: t },
        normalArr: { value: a },
        specArr: { value: r },
        baseColor: { value: i.baseColor.value.clone() },
        alphaTest: { value: i.alphaTest.value },
        useFog: { value: i.useFog.value },
        emissiveColor: { value: i.emissiveColor.value.clone() },
      },
    });
  return (
    (s.userData.pbArray = !0),
    (s.userData.pbLowEnvironment = !!e.userData.pbLowEnvironment),
    E.add(s),
    s.addEventListener("dispose", () => E.delete(s)),
    O(s),
    X(e, s),
    R.get(e)?.bindMaterial(s, e),
    s
  );
}
function aa(e, t) {
  const a = new Map();
  e.traverse((r) => {
    const i = r;
    if (!i.isMesh) return;
    const s = (n) => {
      if (n.userData.pb || !n.colorWrite) return n;
      let l = a.get(n);
      return (l || ((l = Et(n, t)), a.set(n, l)), l);
    };
    i.material = Array.isArray(i.material) ? i.material.map(s) : s(i.material);
  });
}
const he = 0.033,
  Ft = 1,
  T = 0.5,
  D = 4,
  ke = (e, t) => (e + 32768) * 65536 + (t + 32768);
let ze = null;
function Ct(e) {
  const t = Float32Array.from(e.positions),
    a = Uint32Array.from(e.tris),
    r = new Float32Array(e.colors.length);
  for (let s = 0; s < r.length; s++) r[s] = (e.colors[s] * 2) / 255;
  const i = new Map();
  for (let s = 0; s < a.length / 3; s++) {
    let n = 1 / 0,
      l = 1 / 0,
      o = -1 / 0,
      u = -1 / 0;
    for (let p = 0; p < 3; p++) {
      const d = a[s * 3 + p] * 3;
      ((n = Math.min(n, t[d])),
        (o = Math.max(o, t[d])),
        (l = Math.min(l, t[d + 2])),
        (u = Math.max(u, t[d + 2])));
    }
    for (let p = Math.floor(n / D); p <= Math.floor(o / D); p++)
      for (let d = Math.floor(l / D); d <= Math.floor(u / D); d++) {
        const c = ke(p, d);
        let v = i.get(c);
        (v || i.set(c, (v = [])), v.push(s));
      }
  }
  return {
    p: t,
    t: a,
    c: r,
    grid: i,
    seen: new Uint32Array(a.length / 3),
    stamp: 0,
  };
}
const Rt = new g(),
  Y = new g(),
  Bt = new g(),
  $ = new g(),
  ge = new Ze();
function be(e, t = new g()) {
  const a = ze;
  if (!a) return t.copy(z);
  const r = e.x,
    i = e.y + Ft,
    s = e.z,
    n = T * T;
  $.set(r, i, s);
  const l = a.seen,
    o = ++a.stamp;
  let u = 0,
    p = 0,
    d = 0,
    c = 0;
  for (let v = Math.floor((r - T) / D); v <= Math.floor((r + T) / D); v++)
    for (let m = Math.floor((s - T) / D); m <= Math.floor((s + T) / D); m++) {
      const M = a.grid.get(ke(v, m));
      if (M)
        for (const h of M) {
          if (l[h] === o) continue;
          l[h] = o;
          const y = a.t[h * 3] * 3,
            w = a.t[h * 3 + 1] * 3,
            P = a.t[h * 3 + 2] * 3;
          (ge.set(
            Rt.fromArray(a.p, y),
            Y.fromArray(a.p, w),
            Bt.fromArray(a.p, P),
          ),
            ge.closestPointToPoint($, Y),
            !(Y.distanceToSquared($) > n) &&
              ((p += a.c[h * 3]),
              (d += a.c[h * 3 + 1]),
              (c += a.c[h * 3 + 2]),
              u++));
        }
    }
  return u ? t.set(p / u, d / u, c / u) : t.copy(z);
}
export {
  Ie as P,
  aa as a,
  qt as b,
  Zt as c,
  ea as d,
  Qt as e,
  Jt as f,
  ta as g,
  Et as h,
  Ht as i,
  Kt as j,
  Lt as k,
  Yt as l,
  gt as m,
  Gt as n,
  $t as o,
  jt as p,
  be as q,
  Xt as r,
  Ot as s,
  Mt as t,
  x as u,
};
