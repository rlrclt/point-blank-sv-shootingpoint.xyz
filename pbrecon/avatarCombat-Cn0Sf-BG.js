import { a as h } from "./frameEnv-BBzonJVb.js";
import { b as ge, n as be, P as N, y as gt } from "./noteClient-Diy66me5.js";
import { b as L } from "./language-CGImk_RO.js";
const _e = 20,
  bt = 300,
  P = [];
let Se = !1;
function Z(e) {
  return e
    .replace(/(https?:\/\/[^\s"'<>?#)]+)[?#][^\s"'<>)]*/gi, "$1")
    .replace(
      /\b(token|auth|authorization|cookie|session|password|pass|secret|key)\s*[=:]\s*\S+/gi,
      "$1=[x]",
    )
    .replace(/\b[A-Za-z0-9+/_-]{32,}={0,2}/g, "[x]")
    .slice(0, bt);
}
function _t(e) {
  (P.push(Z(e)), P.length > _e && P.splice(0, P.length - _e));
}
const q = h("pushError") ?? _t,
  St = () => P.slice(),
  Pe = h("lastErrors") ?? St,
  At = (e) =>
    e instanceof Error ||
    (typeof e == "object" &&
      e !== null &&
      typeof e.name == "string" &&
      typeof e.message == "string"),
  Ae = (e) => {
    if (At(e)) return `${e.name}: ${e.message}`;
    if (typeof e == "string") return e;
    try {
      return JSON.stringify(e) ?? String(e);
    } catch {
      return String(e);
    }
  },
  ye = (e) => {
    try {
      q(e);
    } catch {}
  };
function ve() {
  if (Se || typeof window > "u" || typeof window.addEventListener != "function")
    return;
  ((Se = !0),
    window.addEventListener("error", (t) =>
      ye(
        `${t.message || "error"} @${(t.filename || "").split("/").pop()}:${t.lineno}`,
      ),
    ),
    window.addEventListener("unhandledrejection", (t) =>
      ye(`unhandledrejection: ${Ae(t.reason)}`),
    ));
  const e = console.error.bind(console);
  console.error = (...t) => {
    try {
      q(t.map(Ae).join(" "));
    } catch {}
    e(...t);
  };
}
ve();
const Pn = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        installErrorRing: ve,
        lastErrors: Pe,
        pushError: q,
        scrub: Z,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  C = "pb.blackbox.v1",
  F = "pb.blackbox.out.v1",
  Be = 3e3,
  He = 2900,
  D = 21e3,
  yt = 6,
  Ct = 4,
  Ie = 3 * 36e5,
  Ce = 1e4,
  Ue = "t,fps,tex,buf,rb,ntex,aud,bm,c2d,wasm,heap,rtex,rgeo,trik,pl,hid,pend",
  b = {
    get(e) {
      try {
        return localStorage.getItem(e);
      } catch {
        return null;
      }
    },
    set(e, t) {
      try {
        localStorage.setItem(e, t);
      } catch {}
    },
    del(e) {
      try {
        localStorage.removeItem(e);
      } catch {}
    },
  };
let _ = null,
  ee = null,
  H = null;
const r = {
    phase: "",
    loadAt: 0,
    phaseAt: 0,
    tl: [],
    stage: "",
    stageAt: 0,
    room: "",
    prep: "",
    samples: [],
    hiddenMs: 0,
    hiddenSince: 0,
    hidN: 0,
    frames: 0,
    framesAt: 0,
    rafOn: !1,
    minute: 0,
    lastPerfAt: 0,
    lastSentAt: 0,
    holdUntil: 0,
    timer: void 0,
  },
  m = new Map();
let xe = 0,
  M = 0,
  I = 0,
  w;
const Et = 200;
let v = 0,
  R = 0,
  te = [],
  Le = (e) => {
    const t = new Uint8Array(e);
    for (let n = 0; n < e; n += 4096) t[n] = 1;
    return t;
  };
function De(e) {
  const t = Number(new URLSearchParams(e).get("memprobe") ?? 0);
  return Number.isFinite(t) && t > 0 ? Math.min(Et, Math.round(t)) : 0;
}
function wt() {
  return R;
}
function Rt(e) {
  Le = e;
}
function Ot() {
  if (
    !v ||
    r.phase !== "match" ||
    (te.push(Le(v << 20)), (R += v), typeof document > "u" || !document.body)
  )
    return;
  let e = document.getElementById("pb-memprobe");
  (e ||
    ((e = document.createElement("div")),
    (e.id = "pb-memprobe"),
    (e.style.cssText =
      "position:fixed;left:8px;top:8px;z-index:99999;pointer-events:none;font:bold 14px Tahoma,sans-serif;color:#ffd27a;text-shadow:0 0 3px #000"),
    document.body.appendChild(e)),
    (e.textContent = `+${R} MB`));
}
function Mt() {
  const e = R > 0;
  if (((te = []), (R = 0), e && typeof document < "u"))
    try {
      document.getElementById("pb-memprobe")?.remove();
    } catch {}
}
const i = () => Date.now(),
  E = (e) => Math.round(e / 100) / 10,
  ne = (e) => {
    try {
      const t = new URL(e, location.href);
      return (
        (t.pathname.startsWith("/assets/")
          ? t.pathname.replace(/\.v[0-9a-f]{8}(\.[^/.]+)$/i, "$1")
          : t.pathname) + t.search
      );
    } catch {
      return e;
    }
  },
  se = () => typeof document < "u" && document.visibilityState === "hidden";
function kt(e) {
  _ ||
    ((_ = e),
    (v = typeof location > "u" ? 0 : De(location.search)),
    Xt(),
    typeof document < "u" && document.addEventListener("visibilitychange", zt),
    Jt(),
    ce().length && Je());
}
function Tt(e) {
  ee = e;
}
const K = new Set();
function Nt(e) {
  return (
    K.add(e),
    () => {
      K.delete(e);
    }
  );
}
const Pt = h("addMemProbe") ?? Nt;
function vt() {
  r.lastPerfAt = i();
}
const Bt = h("notePerfSent") ?? vt;
function Ht() {
  (re(),
    (r.phase = "load"),
    (r.loadAt = r.phaseAt = i()),
    (r.tl = []),
    (r.samples = []),
    (r.room = r.prep = ""),
    (r.stage = ""),
    (r.hiddenMs = 0),
    (r.hidN = 0),
    (r.hiddenSince = se() ? i() : 0),
    (M = I = 0));
  for (const [e, t] of m) i() - t.at > 6e4 && m.delete(e);
  (Fe(), Ke("r-start"));
}
function Ke(e) {
  if (!r.phase) return;
  const t = i();
  ((e = String(e)),
    (r.stage = e),
    (r.stageAt = t),
    e.startsWith("r-") ? (r.room = e) : e.startsWith("p-") && (r.prep = e),
    r.phase === "load" && r.tl.length < 40 && r.tl.push([e, E(t - r.loadAt)]),
    _?.note(`bb-${e}`),
    ae());
}
const It = h("bbStage") ?? Ke;
function Ut(e) {
  (r.phase || ((r.loadAt = i()), (r.tl = []), Fe()),
    (H = e),
    (r.phase = "match"),
    (r.phaseAt = i()),
    (r.samples = []),
    (r.minute = 1),
    (r.stage = "m"),
    (r.stageAt = i()),
    _?.note("bb-m1"),
    ae());
}
const xt = h("bbMatchStart") ?? Ut;
function Lt() {
  r.frames++;
}
const Dt = h("bbFrame") ?? Lt;
function Kt(e) {
  if (r.phase !== "load") return;
  oe();
  const t = We("load");
  ((t.why = e.slice(0, 120)), (t.room = r.room), (t.prep = r.prep));
  const n = i();
  ((t.pend = [...m.values()]
    .sort((s, o) => s.at - o.at)
    .slice(0, 6)
    .map((s) => [s.path.slice(-70), E(n - s.at), s.head ? 1 : 0])),
    $e(t),
    je(!1));
}
function je(e = !0) {
  r.phase &&
    (re(),
    (r.phase = ""),
    (H = null),
    Mt(),
    b.del(C),
    e && _?.note("bb-lobby"));
}
const jt = h("bbEnd") ?? je;
function Ft() {
  oe();
}
function Fe() {
  if (
    ((r.frames = 0),
    (r.framesAt = performance.now()),
    typeof setInterval < "u" && (r.timer = setInterval(oe, Be)),
    typeof requestAnimationFrame < "u" && !r.rafOn)
  ) {
    r.rafOn = !0;
    const e = () => {
      if (r.phase !== "load") {
        r.rafOn = !1;
        return;
      }
      (r.frames++, requestAnimationFrame(e));
    };
    requestAnimationFrame(e);
  }
}
function re() {
  (r.timer !== void 0 && clearInterval(r.timer), (r.timer = void 0));
}
const A = (e) => (e == null ? -1 : Math.round(e * 10) / 10),
  Wt = ["tex", "buf", "rb", "nTex", "audio", "bitmaps", "canvas2d", "wasm"];
function Gt() {
  let e = null;
  const t = (n) => {
    if (!n || typeof n != "object") return;
    const s =
      typeof n.heap == "number" && Number.isFinite(n.heap) ? n.heap : null;
    e
      ? s !== null && (e.heap = e.heap === null ? s : Math.max(e.heap, s))
      : (e = {
          tex: 0,
          buf: 0,
          rb: 0,
          nTex: 0,
          audio: 0,
          bitmaps: 0,
          canvas2d: 0,
          wasm: 0,
          heap: s,
        });
    for (const o of Wt) e[o] += Number(n[o]) || 0;
  };
  try {
    t(ee?.());
  } catch {}
  for (const n of [...K])
    try {
      t(n());
    } catch {}
  return e;
}
function oe() {
  if (!r.phase) return;
  const e = performance.now(),
    t = e - r.framesAt,
    n = t > 0 ? Math.round((r.frames * 1e3) / t) : 0;
  ((r.frames = 0), (r.framesAt = e));
  const s = Gt();
  let o = null;
  try {
    o = r.phase === "match" ? (H?.() ?? null) : null;
  } catch {
    o = null;
  }
  const a = [
    Math.round((i() - r.phaseAt) / 1e3),
    n,
    A(s?.tex),
    A(s?.buf),
    A(s?.rb),
    s ? s.nTex : -1,
    A(s?.audio),
    A(s?.bitmaps),
    A(s?.canvas2d),
    A(s?.wasm),
    A(s?.heap ?? $t()),
    o ? o.tex : -1,
    o ? o.geo : -1,
    o ? Math.round(o.tris / 1e3) : -1,
    o ? o.players : -1,
    se() ? 1 : 0,
    m.size,
  ];
  if (
    (r.samples.push(a),
    r.samples.length > yt && r.samples.shift(),
    Ot(),
    r.phase === "match")
  ) {
    const c = Math.floor((i() - r.phaseAt) / 6e4) + 1;
    c !== r.minute && ((r.minute = c), _?.note(`bb-m${c}`));
  }
  ae();
}
function $t() {
  const e = performance.memory?.usedJSHeapSize;
  return typeof e == "number" ? e / 1048576 : null;
}
function We(e) {
  const t = _?.context() ?? {},
    n = (() => {
      try {
        return r.phase === "match" ? (H?.() ?? null) : null;
      } catch {
        return null;
      }
    })(),
    s = r.samples.at(-1),
    o = i();
  return {
    v: 2,
    bb: e,
    fps: s ? s[1] : 0,
    secs: 0,
    frames: 0,
    stage: r.stage,
    stage_s: E(o - r.stageAt),
    phase: r.phase,
    phase_s: E(o - r.phaseAt),
    load_s: E(o - r.loadAt),
    tl: r.tl.map(([a, c]) => `${a}:${c}`).join(" "),
    s_keys: Ue,
    s: r.samples,
    fetch: [M, I],
    hid_ms: Math.round(r.hiddenMs + (r.hiddenSince ? o - r.hiddenSince : 0)),
    hid_n: r.hidN,
    vis_changes: r.hidN,
    lp_s: r.lastPerfAt ? E(o - r.lastPerfAt) : null,
    textures: n?.tex,
    tris: n?.tris,
    players: n?.players,
    bots: n?.bots,
    res: n?.res,
    screen:
      typeof window > "u"
        ? void 0
        : [
            window.innerWidth,
            window.innerHeight,
            Math.round((window.devicePixelRatio || 1) * 100) / 100,
          ],
    mobile: t.mobile,
    gpu: n?.gpu ?? t.gpu,
    gfx: n?.gfx ?? t.gfx,
    build: t.build,
    ua: typeof navigator > "u" ? "" : navigator.userAgent.slice(0, 200),
    room_id: t.room_id ?? null,
    map: t.map == null ? null : String(t.map),
    mode: t.mode == null ? null : String(t.mode),
    ...(R > 0 ? { probe_mb: R } : {}),
  };
}
function ae() {
  if (!r.phase) return;
  const e = We("crash");
  ((e.room = r.room),
    (e.prep = r.prep),
    (e.w = i()),
    (e.lp = r.lastPerfAt),
    b.set(C, ie(e)));
}
function ie(e, t = He) {
  let n = JSON.stringify(e);
  const s = Array.isArray(e.s) ? [...e.s] : [];
  for (; n.length > t && s.length > 1;)
    (s.shift(), (e.s = s), (n = JSON.stringify(e)));
  return (
    n.length > t &&
      typeof e.tl == "string" &&
      ((e.tl = e.tl.slice(-400)), (n = JSON.stringify(e))),
    n.length > t &&
      (delete e.pend,
      (e.ua = String(e.ua ?? "").slice(0, 120)),
      (n = JSON.stringify(e))),
    n
  );
}
function Jt() {
  const e = b.get(C);
  if (!e) return;
  let t;
  try {
    t = JSON.parse(e);
  } catch {
    b.del(C);
    return;
  }
  const n = typeof t.w == "number" ? t.w : 0;
  if (!(i() - n < Ie)) {
    b.del(C);
    return;
  }
  const s = () => {
    if (b.get(C) !== e) return;
    b.del(C);
    const a = Ge(t, i());
    a && $e(a);
  };
  i() - n < Ce && typeof setTimeout < "u" ? setTimeout(s, Ce) : s();
}
function Ge(e, t) {
  const n = typeof e.w == "number" ? e.w : 0;
  if (!n || !(t - n < Ie)) return null;
  const s = typeof e.lp == "number" ? e.lp : 0,
    o = { ...e, bb: "crash", age: E(t - n), lp_s: s ? E(n - s) : null };
  return (
    delete o.w,
    delete o.lp,
    s && (r.holdUntil = Math.max(r.holdUntil, s + D)),
    o
  );
}
function ce() {
  try {
    const e = JSON.parse(b.get(F) ?? "[]");
    return Array.isArray(e) ? e.filter((t) => typeof t == "string") : [];
  } catch {
    return [];
  }
}
function $e(e) {
  const t = ce();
  for (t.push(ie(e)); t.length > Ct;) t.shift();
  (b.set(F, JSON.stringify(t)), Je(), le());
}
function Je() {
  w !== void 0 || typeof setInterval > "u" || (w = setInterval(le, 5e3));
}
function le() {
  const e = ce();
  if (!e.length) {
    (w !== void 0 && clearInterval(w), (w = void 0));
    return;
  }
  const t = i();
  if (
    !_?.connected() ||
    t < r.holdUntil ||
    t - r.lastPerfAt < D ||
    t - r.lastSentAt < D
  )
    return;
  let n = !1;
  try {
    n = _.send(e[0]);
  } catch {
    n = !1;
  }
  n && ((r.lastSentAt = t), e.shift(), b.set(F, JSON.stringify(e)));
}
function zt() {
  r.phase &&
    (se()
      ? ((r.hiddenSince = i()), r.hidN++)
      : r.hiddenSince &&
        ((r.hiddenMs += i() - r.hiddenSince), (r.hiddenSince = 0)));
}
function Xt() {
  const e = globalThis;
  if (typeof e.fetch != "function" || e.fetch.__bb || typeof location > "u")
    return;
  const t = e.fetch,
    n = (s, o) => {
      const a = t.call(globalThis, s, o);
      if (!r.phase) return a;
      try {
        const c = typeof s == "string" ? s : s instanceof URL ? s.href : s.url,
          f = (
            o?.method ??
            (typeof s == "object" && "method" in s ? s.method : "GET")
          ).toUpperCase(),
          l = ++xe,
          d = f === "HEAD";
        (m.set(l, { path: ne(c), at: i(), head: d }),
          a.then(
            (g) => {
              (d || !g.body) && (m.delete(l), M++);
            },
            () => {
              (m.delete(l), I++);
            },
          ));
      } catch {}
      return a;
    };
  ((n.__bb = !0), (e.fetch = n));
  try {
    typeof PerformanceObserver < "u" &&
      PerformanceObserver.supportedEntryTypes?.includes("resource") &&
      new PerformanceObserver((s) => {
        for (const o of s.getEntries()) ze(o.name);
      }).observe({ type: "resource", buffered: !1 });
  } catch {}
}
function ze(e) {
  if (!m.size) return;
  const t = ne(e);
  let n,
    s = 1 / 0;
  for (const [o, a] of m) a.path === t && a.at < s && ((n = o), (s = a.at));
  n !== void 0 && (m.delete(n), M++);
}
function Qt(e, t) {
  if (!r.phase) return 0;
  const n = ++xe;
  return (m.set(n, { path: ne(String(e)), at: i(), head: t === !0 }), n);
}
function Vt(e, t) {
  m.delete(Number(e)) && (t ? M++ : I++);
}
function Yt(e) {
  ze(String(e));
}
function Zt() {
  (re(),
    w !== void 0 && clearInterval(w),
    (w = void 0),
    (_ = null),
    (ee = null),
    (H = null),
    K.clear(),
    (v = 0),
    (te = []),
    (R = 0),
    Object.assign(r, {
      phase: "",
      loadAt: 0,
      phaseAt: 0,
      tl: [],
      stage: "",
      stageAt: 0,
      room: "",
      prep: "",
      samples: [],
      hiddenMs: 0,
      hiddenSince: 0,
      hidN: 0,
      frames: 0,
      framesAt: 0,
      minute: 0,
      lastPerfAt: 0,
      lastSentAt: 0,
      holdUntil: 0,
    }),
    m.clear(),
    (M = I = 0));
}
const vn = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        BB_BREAD_KEY: C,
        BB_GAP_MS: D,
        BB_MAX_JSON: He,
        BB_OUTBOX_KEY: F,
        BB_SAMPLE_KEYS: Ue,
        BB_SAMPLE_MS: Be,
        addMemProbe: Pt,
        bbEnd: jt,
        bbFetchArrived: Yt,
        bbFetchEnded: Vt,
        bbFetchStarted: Qt,
        bbFrame: Dt,
        bbLoadFail: Kt,
        bbLoadStart: Ht,
        bbMatchStart: xt,
        bbStage: It,
        deadPageReport: Ge,
        fit: ie,
        flushOutbox: le,
        installBlackBox: kt,
        memProbeMb: wt,
        memProbeStepFrom: De,
        notePerfSent: Bt,
        resetBlackBoxForTest: Zt,
        sampleNow: Ft,
        setBlackBoxMemProbe: Tt,
        setMemProbeAllocForTest: Rt,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  Xe = Symbol("pb-own-hook");
function Bn(e) {
  try {
    Object.defineProperty(e, Xe, {
      value: !0,
      enumerable: !1,
      configurable: !1,
      writable: !1,
    });
  } catch {}
  return e;
}
const Hn = (e) => typeof e == "function" && e[Xe] === !0,
  qt = 9070,
  Ee = () => ({
    observer: !1,
    stealth: !1,
    hud: !0,
    nicks: !1,
    ids: !1,
    nickSize: 12,
    flySpeed: 6.7,
  }),
  en = () => ({
    state: Ee(),
    actions: [],
    receive(e) {
      const t = e.readH();
      if (t > 2048 || t > e.remaining) return;
      const n = JSON.parse(e.readU(t));
      !n.state ||
        typeof n.state.observer != "boolean" ||
        ((this.state = n.state),
        n.action && this.actions.length < 32 && this.actions.push(n.action));
    },
    reset() {
      ((this.state = Ee()), (this.actions = []));
    },
    takeActions() {
      return this.actions.splice(0);
    },
  }),
  Q = h("gmControl") ?? en(),
  In = Object.freeze(
    Object.defineProperty(
      { __proto__: null, gmControl: Q },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  tn = 9071,
  Qe = 200,
  nn = Qe + 5,
  Un = 5e3,
  sn = 32,
  rn = 1,
  we = 2,
  G = 3,
  on = 64,
  an = (e) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(e),
  xn = (e) => `/gmpanel/announcement-badges/${e}.png`,
  cn = { name: "กองบัญชาการ", rank: 98 },
  $ = (e) => /^\/ann(?:\s|$)/i.test(e.trim());
class ln {
  listeners = new Set();
  onNotice(t) {
    return (this.listeners.add(t), () => this.listeners.delete(t));
  }
  receive(t) {
    if (t.remaining < 2) return;
    const n = t.readH();
    if (!n || n > Qe || t.remaining < n * 2) return;
    const s = t.readU(n * 2).trim();
    let o = cn;
    if (t.remaining > 2) {
      if (t.remaining < 3) return;
      const a = t.readC();
      if (![rn, we, G].includes(a)) return;
      const c = t.readC(),
        f = t.readC();
      if (!f || f > sn || t.remaining < f * 2) return;
      const l = t.readU(f * 2).trim();
      if (!l) return;
      if (((o = { name: l, rank: c }), a === we || a === G)) {
        if (!t.remaining) return;
        const d = t.readC();
        if (!d || d > on || t.remaining < d * 2) return;
        const g = t.readU(d * 2);
        if (!an(g)) return;
        o.badgeId = g;
      }
      if (a === G) {
        if (t.remaining < 2) return;
        const d = t.readH();
        if (d < 5 || d > 120) return;
        o.displaySeconds = d;
      }
    }
    (t.remaining && (t.remaining !== 2 || t.readH() !== 0)) ||
      (s && this.emit({ text: s, ...o }));
  }
  reset() {
    this.emit(null);
  }
  emit(t) {
    for (const n of this.listeners) n(t);
  }
}
const Re = new ln(),
  p = {
    CHAT_REQ: 2384,
    LOBBY_CHAT_ACK: 2571,
    ROOM_CHAT_ACK: 3606,
    WHISPER_NICK_REQ: 1826,
    WHISPER_ID_REQ: 1828,
    WHISPER_ERR_ACK: 1827,
    WHISPER_ACK: 1830,
    REPORT_COND_REQ: 3852,
    REPORT_COND_ACK: 3853,
    REPORT_REQ: 3850,
    REPORT_ACK: 3851,
    CLAN_CHAT_REQ: 854,
    CLAN_CHAT_ACK: 855,
  },
  V = { ALL: 1, TEAM: 4, ROOM: 6 },
  x = 60,
  Y = 100,
  Ve = "BUG",
  Ye = "GM",
  un = 2147491432,
  fn = 2147491433,
  Oe = "pbweb.chat.blocked",
  J = (e) => e.trim().toLowerCase(),
  O = (e) =>
    e
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
function dn(e, t = 1 / 0) {
  const n = [];
  let s = 0;
  const o = e.length;
  for (; s < o;) {
    for (; s < o && e[s] === " ";) s++;
    if (s >= o) break;
    if (n.length >= t - 1) {
      n.push(e.slice(s).trim());
      break;
    }
    if (e[s] === '"') {
      const a = e.indexOf('"', s + 1);
      if (a < 0) {
        n.push(e.slice(s + 1));
        break;
      }
      (n.push(e.slice(s + 1, a)), (s = a + 1));
    } else {
      let a = s;
      for (; a < o && e[a] !== " ";) a++;
      (n.push(e.slice(s, a)), (s = a));
    }
  }
  return n;
}
function Ze(e) {
  const t = e.readD(),
    n = e.readC(),
    s = e.readU(n * 2),
    o = e.readC(),
    a = e.readC() !== 0,
    c = e.readH();
  return { session: t, nick: s, color: o, gm: a, text: e.readU(c * 2) };
}
function qe(e) {
  const t = e.readH(),
    n = e.readD(),
    s = e.readC() !== 0,
    o = e.readD();
  return { type: t, slot: n, gm: s, text: e.readU(Math.min(o, 400) * 2) };
}
function et(e) {
  const t = e.readU(66),
    n = e.readC() !== 0;
  e.readC();
  const s = e.readH();
  return { nick: t, gm: n, text: e.readU(s * 2) };
}
class tt {
  conn = null;
  off = null;
  hist = [];
  lineCbs = new Set();
  bugCbs = new Set();
  blocked = null;
  nickOfSlot = () => "";
  nickColorOfSlot = () => 0;
  lastWhisper = "";
  myNick = "";
  attach(t) {
    (this.detach(),
      (this.conn = t),
      ge.attach(t),
      be.attach(t),
      (this.off = t.on((n, s) => {
        try {
          n === tn
            ? Re.receive(s)
            : n === qt
              ? Q.receive(s)
              : n === p.LOBBY_CHAT_ACK
                ? this.onLobby(s)
                : n === p.ROOM_CHAT_ACK
                  ? this.onRoom(s)
                  : n === p.WHISPER_ACK
                    ? this.onWhisper(s)
                    : n === p.WHISPER_ERR_ACK
                      ? this.onWhisperErr(s)
                      : n === p.CLAN_CHAT_ACK && this.onClan(s);
        } catch (o) {
          console.warn(`[chat] parse ${n}`, o);
        }
      })));
  }
  detach() {
    (this.off?.(),
      (this.off = null),
      (this.conn = null),
      Q.reset(),
      Re.reset(),
      ge.detach(),
      be.detach());
  }
  get connected() {
    return !!this.conn;
  }
  get connection() {
    return this.conn;
  }
  history() {
    return this.hist.slice();
  }
  clear() {
    this.hist = [];
  }
  onLine(t) {
    return (this.lineCbs.add(t), () => this.lineCbs.delete(t));
  }
  onBugPopup(t) {
    return (this.bugCbs.add(t), () => this.bugCbs.delete(t));
  }
  push(t) {
    const n = { ...t, time: t.time ?? Date.now() };
    if (!(
      n.kind !== "system" &&
      !n.gm &&
      n.nick !== this.myNick &&
      this.isBlocked(n.nick)
    )) {
      (this.hist.push(n),
        this.hist.length > Y && this.hist.splice(0, this.hist.length - Y));
      for (const s of this.lineCbs)
        try {
          s(n);
        } catch (o) {
          console.warn("[chat] listener", o);
        }
    }
  }
  system(t) {
    this.push({ kind: "system", nick: "", gm: !1, color: 0, text: t });
  }
  send(t, n) {
    const s = O(n).slice(0, $(n) ? nn : x);
    if (!this.conn || !s) return !1;
    try {
      this.conn.send(
        p.CHAT_REQ,
        new N(16 + s.length * 2)
          .writeH(t)
          .writeH(s.length)
          .writeU(s, s.length * 2),
      );
    } catch {
      return !1;
    }
    return !0;
  }
  sendClan(t) {
    if ($(t)) return this.send(V.ALL, t);
    const n = O(t).slice(0, x);
    if (!this.conn || !n) return !1;
    try {
      this.conn.send(
        p.CLAN_CHAT_REQ,
        new N(16 + n.length * 2)
          .writeH(5)
          .writeH(n.length)
          .writeU(n, n.length * 2),
      );
    } catch {
      return !1;
    }
    return !0;
  }
  whisper(t, n) {
    if ($(n)) return this.send(V.ALL, n);
    const s = O(n).slice(0, x),
      o = O(t).slice(0, 32);
    if (!this.conn || !s || !o) return !1;
    try {
      this.conn.send(
        p.WHISPER_NICK_REQ,
        new N(96 + s.length * 2)
          .writeU(o, 66)
          .writeH(s.length)
          .writeU(s, s.length * 2),
      );
    } catch {
      return !1;
    }
    return (
      (this.lastWhisper = o),
      this.push({
        kind: "whisper",
        nick: this.myNick,
        gm: !1,
        color: 0,
        text: s,
        to: o,
      }),
      !0
    );
  }
  async reportCondition() {
    if (!this.conn) return { canReport: !1, err: 2147483648 };
    const t = this.conn.waitFor(p.REPORT_COND_ACK, 5e3);
    this.conn.send(p.REPORT_COND_REQ);
    const n = await t;
    return (
      n.readH(),
      { canReport: n.readC() !== 0, err: n.remaining >= 4 ? n.readD() : 0 }
    );
  }
  async report(t, n, s) {
    if (!this.conn) return 2147483648;
    const o = O(s).slice(0, 50),
      a = O(t).slice(0, 32),
      c = new N(160)
        .writeC(o.length)
        .writeU(o, o.length * 2)
        .writeC(n)
        .writeC(a.length)
        .writeU(a, a.length * 2),
      f = this.conn.waitFor(p.REPORT_ACK, 5e3);
    this.conn.send(p.REPORT_REQ, c);
    const l = await f;
    return (l.readH(), l.remaining >= 4 ? l.readD() : 0);
  }
  onLobby(t) {
    const n = Ze(t),
      s = n.text;
    if (n.session === 0) {
      if (s === Ye) return;
      if (s === Ve) {
        for (const o of this.bugCbs)
          try {
            o();
          } catch (a) {
            console.warn("[chat] bug popup", a);
          }
        return;
      }
      this.push({
        kind: "system",
        nick: n.nick || "Server",
        gm: !1,
        color: n.color,
        text: s,
      });
      return;
    }
    this.push({ kind: "all", nick: n.nick, gm: n.gm, color: n.color, text: s });
  }
  onRoom(t) {
    const n = qe(t);
    this.push({
      kind: n.type === 4 ? "team" : "all",
      nick: this.nickOfSlot(n.slot) || `#${n.slot + 1}`,
      slot: n.slot,
      gm: n.gm,
      color: this.nickColorOfSlot(n.slot),
      text: n.text,
    });
  }
  onClan(t) {
    const n = gt(t);
    this.push({
      kind: "clan",
      nick: n.nick,
      gm: n.gm,
      color: n.nickColor,
      text: n.text,
    });
  }
  onWhisper(t) {
    const n = et(t);
    ((this.lastWhisper = n.nick),
      this.push({
        kind: "whisper",
        nick: n.nick,
        gm: n.gm,
        color: 0,
        text: n.text,
      }));
  }
  onWhisperErr(t) {
    const n = t.readD();
    t.readC();
    const s = t.remaining >= 66 ? t.readU(66) : "";
    n !== 0 &&
      this.system(`${s || "Jogador"}: jogador não encontrado ou offline.`);
  }
  load() {
    if (this.blocked) return this.blocked;
    let t = [];
    try {
      const n = JSON.parse(globalThis.localStorage?.getItem(Oe) ?? "[]");
      Array.isArray(n) && (t = n.filter((s) => typeof s == "string"));
    } catch {}
    return (this.blocked = new Set(t));
  }
  save() {
    try {
      globalThis.localStorage?.setItem(Oe, JSON.stringify([...this.load()]));
    } catch {}
  }
  isBlocked(t) {
    return !!t && this.load().has(J(t));
  }
  block(t) {
    const n = J(t);
    n && (this.load().add(n), this.save());
  }
  unblock(t) {
    this.load().delete(J(t)) && this.save();
  }
  blockedNicks() {
    return [...this.load()];
  }
}
const nt = h("chat") ?? new tt(),
  Ln = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        BUG_MARK: Ve,
        CHAT_MAX: x,
        ChatClient: tt,
        ChatOp: p,
        ChatType: V,
        ERR_REPORT_NO_TICKET: un,
        ERR_REPORT_RANK: fn,
        GM_MARK: Ye,
        HISTORY_MAX: Y,
        chat: nt,
        parseLobbyChat: Ze,
        parseRoomChat: qe,
        parseWhisper: et,
        splitArgs: dn,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  hn = {
    BASE_URL: "/",
    DEV: !1,
    MODE: "prod",
    PROD: !0,
    SSR: !1,
    VITE_API_URL: "/",
    VITE_ASSET_BASE: "https://cdn.pbmobile-th.online",
    VITE_GW_URL: "/",
  },
  st = 9001,
  rt = 9002,
  ot = 1e3,
  Me = 4e3,
  y = 2147483648,
  at = 2147491841;
let j = () => ({});
function pn(e) {
  const t = j;
  return ((j = e), t);
}
function mn() {
  return j();
}
const gn = h("setBugContext") ?? pn,
  bn = h("currentBugContext") ?? mn;
let z = 0,
  T = 0,
  B = null,
  ke = !1;
function _n() {
  if (ke || typeof requestAnimationFrame > "u") return;
  ke = !0;
  const e = (t) => {
    if ((T || (T = t), z++, t - T >= 2e3)) {
      const n = (z * 1e3) / (t - T);
      ((B = B === null ? n : B * 0.7 + n * 0.3), (z = 0), (T = t));
    }
    requestAnimationFrame(e);
  };
  requestAnimationFrame(e);
}
function it() {
  try {
    const e = new URL(import.meta.url).pathname.split("/").pop() ?? "",
      t = hn;
    return /-[A-Za-z0-9_-]{6,}\./.test(e) ? e : `${t?.MODE ?? "dev"}`;
  } catch {
    return "unknown";
  }
}
function ct(e) {
  const t = { ...j(), ...e },
    n = {
      client_build: it(),
      user_agent:
        typeof navigator > "u" ? "" : navigator.userAgent.slice(0, 200),
      fps: t.fps ?? (B === null ? null : Math.round(B)),
      ping: t.ping ?? null,
      p2p_role: t.p2p_role ?? "none",
      room_id: t.room_id ?? null,
      map: t.map ?? null,
      mode: t.mode ?? null,
      last_errors: Pe().map((o) => Z(o)),
    };
  let s = JSON.stringify(n);
  for (; s.length > Me && n.last_errors.length;)
    (n.last_errors.shift(), (s = JSON.stringify(n)));
  return s.length > Me ? "{}" : s;
}
const U = {
  [at]: () =>
    L(
      "ส่งรายงานครบจำนวนแล้ว (3 ครั้งต่อชั่วโมง) ลองใหม่ภายหลัง",
      "Report limit reached (3 per hour). Try again later.",
      "Batas laporan tercapai (3 per jam). Coba lagi nanti.",
    ),
  [y]: () =>
    L(
      "ส่งรายงานไม่สำเร็จ",
      "Could not send the report.",
      "Laporan gagal dikirim.",
    ),
};
async function Sn(e, t) {
  const n = e
      .replace(/\u0000/g, "")
      .trim()
      .slice(0, ot),
    s = nt.connection;
  if (!n)
    return {
      ok: !1,
      err: y,
      id: 0,
      message: L(
        "อธิบายปัญหาก่อน",
        "Describe the problem.",
        "Jelaskan masalahnya.",
      ),
    };
  if (!s) return { ok: !1, err: y, id: 0, message: U[y]() };
  const o = ct(t);
  try {
    const a = s.waitFor(rt, 8e3);
    s.send(
      st,
      new N(16 + (n.length + o.length) * 2)
        .writeH(n.length)
        .writeU(n, n.length * 2)
        .writeH(o.length)
        .writeU(o, o.length * 2),
    );
    const c = await a,
      f = c.readD() >>> 0,
      l = c.remaining >= 4 ? c.readD() : 0;
    return f === 0
      ? {
          ok: !0,
          err: f,
          id: l,
          message: L(
            `ส่งรายงาน #${l} แล้ว ขอบคุณ!`,
            `Report #${l} sent. Thank you!`,
            `Laporan #${l} terkirim. Terima kasih!`,
          ),
        }
      : { ok: !1, err: f, id: 0, message: (U[f] ?? U[y])() };
  } catch {
    return { ok: !1, err: y, id: 0, message: U[y]() };
  }
}
const An = h("sendBugReport") ?? Sn;
let Te = null;
function yn(e) {
  const t = Te;
  return ((Te = e), t);
}
const Cn = h("setBugOpener") ?? yn,
  Dn = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        BUG_ACK: rt,
        BUG_REQ: st,
        BUG_TEXT_MAX: ot,
        ERR_BUG_FAIL: y,
        ERR_BUG_LIMIT: at,
        buildBugMeta: ct,
        clientBuild: it,
        currentBugContext: bn,
        sendBugReport: An,
        setBugContext: gn,
        setBugOpener: Cn,
        startFpsProbe: _n,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  lt = "2026-10-28.1",
  ue = {},
  fe = {},
  de = {},
  he = {},
  pe = {},
  ut = new URL("tables/avatarData-DnSaiZ_m.json", import.meta.url).href,
  ft = (async () => {
    try {
      const e = await fetch(ut);
      if (!e.ok) throw new Error(String(e.status));
      const t = await e.json();
      (Object.assign(ue, t.PC_CHARAS),
        Object.assign(fe, t.PC_EQUIP),
        Object.assign(de, t.PC_MASK_ALIAS),
        Object.assign(he, t.PC_MASK_TYPO_KEYS),
        Object.assign(pe, t.PC_MASK_VARIANT));
    } catch (e) {
      const t = new Error("table avatarData: " + ((e && e.message) || e));
      throw (console.error(t), t);
    }
  })();
ft.catch(() => {});
const Kn = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        PC_AVATAR_RULES_VERSION: lt,
        PC_CHARAS: ue,
        PC_EQUIP: fe,
        PC_MASK_ALIAS: de,
        PC_MASK_TYPO_KEYS: he,
        PC_MASK_VARIANT: pe,
        __tableReady: ft,
        __tableUrl: ut,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  jn = new Set([6, 7, 8, 9, 10, 11, 12, 13, 14, 27]),
  dt = {
    charas: ue,
    equip: fe,
    maskVariant: pe,
    maskAlias: de,
    maskTypoKeys: he,
    rulesVersion: lt,
  };
let S = dt;
const ht = (e) =>
  new Set(
    Object.values(e.charas)
      .flatMap((t) => [t.defaults.head, t.defaultHead ?? 0])
      .filter(Boolean),
  );
let pt = ht(S);
function Fn(e) {
  ((S = e ?? dt), (pt = ht(S)));
}
const Wn = (e) => pt.has(e);
function Ne(e) {
  const t = e ? (S.equip[e]?.key ?? "") : "";
  return /^(?:I_HW_|IF_H_)/.test(t) && !t.startsWith("I_HW_EarSet_");
}
function X(e, t) {
  return !t || ![7, 8, 27].includes(Math.floor(t / 1e5))
    ? !0
    : !!(e && S.charas[e]?.defaultHead)
      ? Math.floor(t / 1e5) === 7 && Ne(t)
      : !Ne(t);
}
function Gn() {
  return S;
}
function $n() {
  for (const e in S.charas) return !0;
  return !1;
}
const me = (e) => (e ? S.charas[e] : void 0),
  mt = (e) => (e ? S.equip[e] : void 0),
  En = {
    FastReload_Assault: "AR",
    FastReload_MG: "MG",
    FastReload_Pistol: "HG",
    FastReload_SG: "SG",
    FastReload_SMG: "SMG",
    FastReload_Sniper: "SR",
  };
function wn(e) {
  return e === "torso" ? "body" : e === "limb" ? "leg" : e;
}
function Jn(e, t) {
  const n = me(e);
  return n ? n.rate[wn(t)] : null;
}
function zn(e, t = 0, n) {
  const s = me(e);
  return s ? Math.round((s.hp + 0) * (1 + t)) : null;
}
function Xn(e) {
  const t = mt(e);
  return t ? (t.ability.HelmetProtectionRate ?? 0) : null;
}
function Rn() {
  return {
    damageRate: 0,
    damage: 0,
    penetrate: 0,
    helmetProtection: 0,
    hpIncrease: 0,
    hpIncreaseMax: 0,
    defense: { head: 0, body: 0, arm: 0, hand: 0, leg: 0, foot: 0 },
    moveSpeed: { front: 0, back: 0, side: 0, diagonal: 0 },
    fastReload: {},
    reloadTime: 0,
    quickChange: 0,
    swapTime: 0,
    accuracy: 0,
    crosshairSpeed: 0,
    recoilHorzCount: 0,
    protectionTime: 0,
    ids: [],
  };
}
function Qn(e) {
  const t = Rn(),
    n = me(e.charaId),
    s = n?.defaults,
    o = X(e.charaId, e.head) ? e.head : 0,
    a = X(e.charaId, e.face) ? e.face : 0,
    c = X(e.charaId, e.beret) ? e.beret : 0,
    f = [
      c ? 0 : o,
      a,
      c,
      e.upper ?? s?.upper,
      e.lower ?? s?.lower,
      e.glove ?? s?.glove,
      e.belt ?? s?.belt,
      e.holster ?? s?.holster,
      e.skin ?? s?.skin,
    ];
  for (const l of f) {
    const d = mt(l);
    if (d) {
      t.ids.push(d.id);
      for (const [g, u] of Object.entries(d.ability)) {
        if (!u) continue;
        const W = En[g];
        if (W) {
          t.fastReload[W] = (t.fastReload[W] ?? 0) + u;
          continue;
        }
        if (g.startsWith("Defense_")) {
          const k = g.slice(8).toLowerCase();
          k in t.defense && (t.defense[k] += u);
          continue;
        }
        if (g.startsWith("MoveSpeed_")) {
          const k = g.slice(10).toLowerCase();
          k in t.moveSpeed && (t.moveSpeed[k] += u);
          continue;
        }
        switch (g) {
          case "DamageRate":
            t.damageRate += u;
            break;
          case "Damage":
            t.damage += u;
            break;
          case "WeaponPenetrate":
            t.penetrate += u;
            break;
          case "HelmetProtectionRate":
            t.helmetProtection = Math.max(t.helmetProtection, u);
            break;
          case "HPIncrease":
            t.hpIncrease += u;
            break;
          case "HPIncrease_Max":
            t.hpIncreaseMax += u;
            break;
          case "WeaponReloadTime":
            t.reloadTime += u;
            break;
          case "QuickChangeWeapon":
            t.quickChange += u;
            break;
          case "WeaponSwapTime":
            t.swapTime += u;
            break;
          case "WeaponAccuracy":
            t.accuracy += u;
            break;
          case "CrossHair_SpeedFactor":
            t.crosshairSpeed += u;
            break;
          case "RecoilHorzCount":
            t.recoilHorzCount += u;
            break;
          case "ProtectionTime":
            t.protectionTime += u;
            break;
        }
      }
    }
  }
  return t;
}
function Vn(e, t) {
  if (!t.moveSpeed && !t.crosshairSpeed) return e;
  const n = t.moveSpeed;
  return {
    ...e,
    moveSpeed: n
      ? {
          front: e.moveSpeed.front + n.front,
          back: e.moveSpeed.back + n.back,
          side: e.moveSpeed.side + n.side,
          diagonal: e.moveSpeed.diagonal + n.diagonal,
        }
      : e.moveSpeed,
    crosshairSpeed: e.crosshairSpeed + (t.crosshairSpeed ?? 0),
  };
}
function On(e) {
  const t = {};
  for (const [n, s] of Object.entries(e.fastReload))
    s > 0 && (t[n] = Math.max(0.1, 1 - e.reloadTime));
  return t;
}
function Mn(e) {
  return e.quickChange > 0 ? Math.max(0.1, 1 - e.swapTime) : 1;
}
function Yn(e, t) {
  return Math.max(1 / 2.3, (e ? 1 / 1.50002 : 1) * Mn(t));
}
function Zn(e, t, n) {
  return (t ? 1 / 1.25 : 1) * (On(n)[e] ?? 1);
}
export {
  Un as A,
  Qn as B,
  V as C,
  Jn as D,
  Yn as E,
  Zn as F,
  nn as G,
  Vn as H,
  Hn as I,
  xt as J,
  Dt as K,
  Bt as L,
  Xn as M,
  $n as N,
  Gn as O,
  jn as P,
  zn as Q,
  un as R,
  fn as S,
  vn as T,
  Pn as U,
  Dn as V,
  In as W,
  Ln as X,
  Ht as a,
  Kt as b,
  It as c,
  nt as d,
  X as e,
  Wn as f,
  Cn as g,
  gn as h,
  Ne as i,
  Q as j,
  dn as k,
  An as l,
  it as m,
  jt as n,
  xn as o,
  me as p,
  Re as q,
  kt as r,
  _n as s,
  bn as t,
  Pt as u,
  Tt as v,
  Bn as w,
  Kn as x,
  Fn as y,
  mt as z,
};
