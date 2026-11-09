import { a as g } from "./assetMap-CgwVrQUz.js";
import "./frameEnv-BBzonJVb.js";
const y = {
    walkSpeed: 2.6,
    runSpeed: 4.5,
    crouchSpeed: 1.4,
    gravity: 9.8 * 1.8,
    jumpHeight: 1.1,
    eyeHeightStand: 1.7,
    eyeHeightCrouch: 1,
    capsuleRadius: 0.39,
    capsuleHalfHeightStand: 0.325,
    capsuleHalfHeightCrouch: 0.325,
    maxStepHeight: 0.4,
    maxSlopeClimbDeg: 45,
    mouseSensitivity: 0.0022,
  },
  l = ["metro", "nstation", "blowcity", "sewerage"];
let w = {
    metro: "Metro",
    nstation: "M. Station",
    blowcity: "Blow City",
    sewerage: "Sewerage",
  },
  p = new Map(),
  h = new Map(),
  c = null;
function f(e) {
  const n = e.check;
  if (
    !n?.visual ||
    !n.collisionGlb ||
    (e.source === "sea3123" &&
      (n.complete !== !0 ||
        n.props !== !0 ||
        n.physics !== !0 ||
        n.hero !== !0))
  )
    return !1;
  const [s, r] = (n.respawnsInside ?? "0/0").split("/").map(Number);
  return s === r;
}
function $() {
  if (c) return c;
  const e = new URLSearchParams(window.location.search),
    n =
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) &&
      e.get("maps") === "pc3123";
  return (
    (c = fetch(n ? "/assets/pc3123/maps/index.json" : "/assets/maps/index.json")
      .then((s) => (s.ok ? s.json() : []))
      .catch(() => [])
      .then((s) => {
        const r = new Map(),
          u = new Map(),
          i = [],
          m = {};
        for (const t of s)
          (r.set(t.id, t),
            f(t) &&
              (i.push(t.id),
              (m[t.id] = t.name || t.nameEn || t.id),
              t.mapId != null && !u.has(t.mapId) && u.set(t.mapId, t.id)));
        if (((p = r), n && i.length === 0))
          throw new Error("ชุดแผนที่ PC ยังไม่ผ่านการตรวจครบ");
        if (i.length > 0) {
          ((h = u), (l.length = 0), l.push(...i), (w = m));
          const t = new URLSearchParams(window.location.search)
            .get("map")
            ?.toLowerCase();
          t && l.includes(t) && (a = t);
        }
      })),
    c
  );
}
function d(e) {
  return p.get(e);
}
function b() {
  const e = new URLSearchParams(window.location.search)
    .get("map")
    ?.toLowerCase();
  return e && l.includes(e) ? e : "nstation";
}
let a = b();
function P(e) {
  a = e;
}
function C(e) {
  return h.get(e) ?? { 4: "nstation", 36: "metro" }[e] ?? "nstation";
}
const S =
  typeof window < "u" &&
  typeof window.location?.search == "string" &&
  new URLSearchParams(window.location.search).get("slim") === "0";
function v(e) {
  return !S && g(`${e}/visual.slim.glb`) === !0
    ? `${e}/visual.slim.glb`
    : `${e}/visual.glb`;
}
const L = {
  get visualGlb() {
    return v(o());
  },
  get collisionGlb() {
    return `${o()}/collision.glb`;
  },
  get collisionJson() {
    return `${o()}/collision.json`;
  },
  get lightingJson() {
    return `${o()}/lighting.json`;
  },
  get movementGlb() {
    return `${o()}/movement.glb`;
  },
  get movementJson() {
    return `${o()}/movement.json`;
  },
  get characterJson() {
    return d(a)?.source === "sea3123" ? this.movementJson : this.collisionJson;
  },
};
function o(e = a) {
  const n = p.get(e),
    s =
      n?.assetBase ??
      (n?.source === "sea3123"
        ? `/assets/pc3123/maps/${e}`
        : `/assets/maps/${e}`);
  if (!/^\/assets\/(?:pc3123\/)?maps\/[a-z0-9_-]+$/i.test(s))
    throw new Error(`Invalid map asset base: ${e}`);
  return s;
}
function x(e) {
  return d(a)?.source === "sea3123"
    ? `/assets/pc3123/sfx/objects/${e}`
    : `objects/${e}`;
}
export {
  l as AVAILABLE_MAPS,
  L as AssetPaths,
  a as CurrentMap,
  w as MAP_LABELS,
  y as MovementConfig,
  $ as loadMapIndex,
  o as mapAssetBase,
  C as mapFromRoomMapId,
  d as mapIndexEntry,
  x as propSoundPath,
  v as sceneGlbUrl,
  P as setCurrentMap,
};
