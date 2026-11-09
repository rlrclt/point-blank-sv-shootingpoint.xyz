const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "bundle/battleLineup-D5pdNSul.js",
      "bundle/vendor-three-BL04HsGo.js",
      "bundle/index-HK_qZtim.js",
      "bundle/modulepreload-polyfill-B5Qt9EMX.js",
      "bundle/preload-helper-CLcXU_4U.js",
      "bundle/safeArea-BqULpcn_.js",
      "bundle/assetMap-CgwVrQUz.js",
      "bundle/frameEnv-BBzonJVb.js",
      "bundle/avatarCombat-Cn0Sf-BG.js",
      "bundle/noteClient-Diy66me5.js",
      "bundle/language-CGImk_RO.js",
      "bundle/matchHandles-DDRISjpa.js",
      "bundle/voice-C8jYGp6t.js",
      "bundle/deviceProfile-BbMjcetF.js",
      "bundle/qualityTier-ox0sz1dC.js",
      "bundle/levelCache-BBQB85vx.js",
      "bundle/ktx2-BurdhfpX.js",
      "bundle/pbLighting-CAdVN-gf.js",
      "bundle/settings-JwaLg-ci.js",
      "bundle/pbConfig-BTAdk4SQ.js",
      "bundle/jsonOnce-wOxh8pA7.js",
      "bundle/switch-B4AFZRxn.js",
      "bundle/accessoryMount-vWra_6Ct.js",
      "bundle/roomClient-DHZFwrSZ.js",
      "bundle/maintenance-oGso2NiD.js",
      "bundle/testBots-WllQD4W5.js",
      "bundle/heroRank-BfA3QP1E.js",
      "bundle/audioUrl-Bd_dPWJx.js",
      "bundle/config-TO6a17NM.js",
      "bundle/i18n-CSbTfxpT.js",
      "bundle/assets-Bz3hisdZ.js",
      "bundle/assets-DDkStGMg.css",
      "bundle/pcGuns-C2EjMTvP.js",
      "bundle/voice-U0ixT5i-.css",
      "bundle/combatProtocol-ugHSWx7a.js",
      "bundle/propClip-DIR9JJpz.js",
      "bundle/battleLoadingRoster-CbERb-oP.js",
      "bundle/rendererListeners-BJdZ3WUV.js",
      "bundle/titleFx-Ch6yEVoA.js",
      "bundle/pbmb-th-tactical-v4-xhxMEcCm.js",
      "bundle/touchDevice-dT6al0av.js",
      "bundle/physicalInput-CouVmXPj.js",
      "bundle/index-tnRL9UZl.css",
      "bundle/previewWeapon-HYtXD4hv.js",
      "bundle/worldModel-9IP3WuWy.js",
      "bundle/throwables-C1g7WPSZ.js",
      "bundle/accessoryModel-BqXcIAKo.js",
      "bundle/charAnimLib-Baguv_ZO.js",
      "bundle/knifeThrow-CohpjfBQ.js",
    ]),
) => i.map((i) => d[i]);
import { _ as ae } from "./preload-helper-CLcXU_4U.js";
import { MAP_LABELS as ne } from "./config-TO6a17NM.js";
import { b as P } from "./language-CGImk_RO.js";
import { l as re } from "./assets-Bz3hisdZ.js";
import { b as se } from "./pbmb-th-tactical-v4-xhxMEcCm.js";
import { a as Q } from "./frameEnv-BBzonJVb.js";
function V(e = {}) {
  const n = document.createElement("div");
  ((n.className = "bl-transition"),
    e.id && (n.id = e.id),
    n.setAttribute("role", "status"),
    n.setAttribute("aria-label", "Loading"));
  const a = (m) => {
    ((n.dataset.entryPhase = m), e.onPhase?.(m));
  };
  (a("fade-to-black"), document.body.append(n));
  let t = !1,
    s,
    r = () => {},
    l = () => {};
  const o = new Promise((m) => {
      l = m;
    }),
    p = new Promise((m) => {
      r = () => m(!1);
    }),
    f = async (m, M, E) => {
      if (t) return !1;
      (s?.cancel(),
        (s = n.animate([{ opacity: m }, { opacity: M }], {
          duration: E,
          fill: "forwards",
          easing: "ease-in-out",
        })));
      try {
        await s.finished;
      } catch {
        return !1;
      }
      return !t;
    },
    L = async () => {
      if (!(await f(0, 1, 1800))) return !1;
      (a("black"), l(!0));
      const [m] = await Promise.all([f(1, 1, 950), e.onCovered?.()]);
      return !m || t || (a("reveal"), !(await f(1, 0, 250)))
        ? !1
        : (a("ready"), n.remove(), s?.cancel(), !0);
    },
    A = Promise.race([L(), p]);
  return (
    A.then(
      (m) => {
        m || l(!1);
      },
      () => {
        l(!1);
      },
    ),
    {
      root: n,
      covered: o,
      ready: A,
      cancel: () => {
        ((t = !0), s?.cancel(), n.remove(), l(!1), r());
      },
    }
  );
}
function Ee(e) {
  let n = () => {};
  const a = new Promise((s) => {
      n = s;
    }),
    t = V({ id: e, onCovered: () => a });
  return {
    covered: t.covered,
    cancel: () => {
      (n(), t.cancel());
    },
  };
}
const ie = 5e3;
function oe(e, n) {
  ((e.style.visibility = "hidden"),
    (e.style.opacity = "0"),
    e.setAttribute("aria-hidden", "true"));
  let a = !1,
    t,
    s = () => {};
  const r = new Promise((o) => {
      s = o;
    }),
    l = V({
      onPhase: (o) => {
        e.dataset.entryPhase = o;
      },
      onCovered: async () => {
        const o = (async () => {
          try {
            await n?.();
          } catch (p) {
            a ||
              console.warn(
                "[loading] Lineup preview unavailable; continuing match loading",
                p,
              );
          }
        })();
        try {
          await Promise.race([
            o,
            new Promise((p) => {
              t = setTimeout(p, ie);
            }),
            r,
          ]);
        } finally {
          clearTimeout(t);
        }
        a || ((e.style.visibility = "visible"), (e.style.opacity = "1"));
      },
    });
  return {
    covered: l.covered,
    ready: l.ready.then((o) => (o && e.removeAttribute("aria-hidden"), o)),
    cancel: () => {
      ((a = !0), clearTimeout(t), s(), l.cancel());
    },
  };
}
class le {
  startedAt;
  duration;
  finish;
  times;
  points;
  slopes;
  constructor(n, a = 1e4, t = Math.floor(Math.random() * 4294967296)) {
    ((this.startedAt = n),
      (this.duration = a),
      (this.finish = null),
      (this.times = [0, 0.08, 0.19, 0.29, 0.44, 0.56, 0.7, 0.82, 0.92, 1]));
    const s = [0, 0.025, 0.2, 0.235, 0.54, 0.58, 0.82, 0.87, 0.97, 1];
    this.points = s.map((l, o) =>
      !o || o === s.length - 1
        ? l
        : ((t = (Math.imul(t, 1664525) + 1013904223) >>> 0),
          l +
            (t / 4294967296 - 0.5) *
              Math.min(l - s[o - 1], s[o + 1] - l) *
              0.35),
    );
    const r = this.points
      .slice(1)
      .map(
        (l, o) => (l - this.points[o]) / (this.times[o + 1] - this.times[o]),
      );
    this.slopes = this.points.map((l, o) =>
      !o || o === s.length - 1 ? 0 : 2 / (1 / r[o - 1] + 1 / r[o]),
    );
  }
  schedule(n) {
    const a = Math.min(1, Math.max(0, (n - this.startedAt) / this.duration));
    let t = 0;
    for (; t < this.times.length - 2 && a > this.times[t + 1];) t++;
    const s = this.times[t + 1] - this.times[t],
      r = (a - this.times[t]) / s,
      l = this.points[t],
      o = this.points[t + 1],
      p = this.slopes[t] * s,
      f = this.slopes[t + 1] * s;
    return {
      value:
        (2 * r * r * r - 3 * r * r + 1) * l +
        (r * r * r - 2 * r * r + r) * p +
        (-2 * r * r * r + 3 * r * r) * o +
        (r * r * r - r * r) * f,
      speed:
        ((6 * r * r - 6 * r) * l +
          (3 * r * r - 4 * r + 1) * p +
          (-6 * r * r + 6 * r) * o +
          (3 * r * r - 2 * r) * f) /
        s /
        this.duration,
    };
  }
  pending(n) {
    const a = Math.max(0, n - this.startedAt);
    if (a <= this.duration) {
      const s = this.schedule(n);
      return { value: 0.9 * s.value, speed: 0.9 * s.speed };
    }
    const t = Math.exp(-(a - this.duration) / 4e3);
    return {
      value: 0.9 + 0.09 * (1 - t) ** 2,
      speed: (0.18 * (1 - t) * t) / 4e3,
    };
  }
  ready(n) {
    if (this.finish) return;
    const a = this.pending(n),
      t = this.startedAt + this.duration,
      s = n <= t ? t : n + 600;
    this.finish = {
      start: n,
      end: s,
      early: n <= t,
      from: a.value,
      tangent: Math.min(a.speed * (s - n), 3 * (1 - a.value)),
    };
  }
  value(n) {
    const a = this.finish;
    if (!a || n < a.start) return this.pending(n).value;
    if (n >= a.end) return 1;
    if (a.early) {
      const s = Math.min(1, (n - a.start) / Math.min(1500, a.end - a.start)),
        r = s * s * (3 - 2 * s);
      return this.schedule(n).value * (0.9 + 0.1 * r);
    }
    const t = Math.max(0, (n - a.start) / (a.end - a.start));
    return Math.min(
      1,
      (2 * t * t * t - 3 * t * t + 1) * a.from +
        (t * t * t - 2 * t * t + t) * a.tangent +
        (-2 * t * t * t + 3 * t * t),
    );
  }
}
let d = null,
  k = !1;
const _ = new Set();
function ce(e) {
  return (
    _.add(e),
    e(k),
    () => {
      _.delete(e);
    }
  );
}
function H(e) {
  if (k !== e) {
    k = e;
    for (const n of _) n(e);
  }
}
async function de() {
  const e = d;
  return !e || ((await e.entry.covered) && d === e);
}
let B = null;
const z = [
  "/assets/ui/team-logos/free-rebels.png",
  "/assets/ui/team-logos/ct-force.png",
];
let j,
  v = null;
function ue(e) {
  if (!d) {
    if ((F(), v)) {
      ((v.players = e), v.lineup?.setPlayers(e));
      return;
    }
    v = X(e);
  }
}
function X(e) {
  const n = document.createElement("div");
  ((n.className = "bl-stage bl-prewarm"),
    n.setAttribute("aria-hidden", "true"),
    document.body.append(n));
  const a = { host: n, players: e, disposed: !1, ready: void 0 };
  return (
    (a.ready = ae(
      async () => {
        const { BattleLineup: t } = await import("./battleLineup-D5pdNSul.js");
        return { BattleLineup: t };
      },
      __vite__mapDeps([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
        38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
      ]),
    )
      .then(({ BattleLineup: t }) =>
        a.disposed
          ? null
          : ((a.lineup = new t(n, () => {}, !0)),
            a.lineup.setPlayers(a.players),
            a.lineup),
      )
      .catch((t) => (console.warn("[lineup-prewarm]", t), null))),
    a
  );
}
function J(e) {
  ((e.disposed = !0),
    (e.players = []),
    e.lineup?.dispose(),
    (e.lineup = void 0),
    e.host.remove());
}
function pe() {
  const e = v;
  ((v = null), e && J(e));
}
const K = 1e4;
async function me() {
  const e = d;
  return e
    ? !(await e.entry.ready) || d !== e
      ? !1
      : x(e, e.shownAt + K)
    : Promise.resolve(!0);
}
function x(e, n) {
  const a = n - performance.now();
  return a <= 0
    ? Promise.resolve(!0)
    : new Promise((t) => {
        const s = () => {
            (clearTimeout(r), e.cancelWaits.delete(s), t(!1));
          },
          r = setTimeout(() => {
            (e.cancelWaits.delete(s), t(d === e));
          }, a);
        e.cancelWaits.add(s);
      });
}
async function fe() {
  const e = d;
  return e
    ? !(await e.entry.ready) ||
      d !== e ||
      !e.presentation ||
      (N(1), !(await x(e, e.presentation.finish.end)) || d !== e)
      ? !1
      : (Y(e, performance.now()), x(e, performance.now() + 80))
    : !0;
}
const he = Q("waitBattleLoadingComplete") ?? fe;
function F() {
  if (
    (typeof document < "u" && re(),
    !j &&
      typeof Image < "u" &&
      (j = z.map((n) => {
        const a = new Image();
        return ((a.src = n), a);
      })),
    B || typeof Image > "u")
  )
    return;
  const e = (B = new Image());
  ((e.onerror = () => {
    B === e && (B = null);
  }),
    (e.src = "/bundle/battle-hangar-v1.png"));
}
function i(e, n, a = "") {
  const t = document.createElement(e);
  return ((t.className = n), (t.textContent = a), t);
}
function N(e) {
  const n = d;
  !n ||
    !Number.isFinite(e) ||
    ((n.progress = Math.max(n.progress, Math.min(1, Math.max(0, e)))),
    (e === 0.9 || e >= 1) && (n.assetsReady = !0),
    n.assetsReady && n.presentation?.ready(performance.now()));
}
const be = Q("setBattleProgress") ?? N;
function Y(e, n) {
  const a = e.presentation?.value(n) ?? 0,
    t = a >= 1 ? 100 : Math.min(99, Math.floor(a * 100));
  e.fill.style.clipPath = `inset(0 ${(1 - a) * 100}% 0 0)`;
  const s = `${t}%`;
  return (
    e.percent.textContent !== s &&
      ((e.percent.textContent = s),
      e.bar.setAttribute("aria-valuenow", String(t))),
    a
  );
}
function I(e, n = !0) {
  const a = d;
  if (a) {
    a.players = e
      .map((t) => {
        const s = a.players.find(
          (r) => r.slot === t.slot && r.nick === t.nick && r.team === t.team,
        );
        return !t.chara && s
          ? {
              ...s,
              ...t,
              chara: s.chara,
              weapon: t.weapon ?? s.weapon,
              equip: t.equip ?? s.equip,
            }
          : t;
      })
      .filter(
        (t) =>
          t.slot >= 0 &&
          t.slot < 16 &&
          t.nick &&
          (t.team === 0 || t.team === 1),
      )
      .sort((t, s) => t.slot - s.slot)
      .filter((t, s, r) => r.findIndex((l) => l.slot === t.slot) === s);
    for (const t of [0, 1]) {
      const s = a.players.filter((r) => r.team === t);
      ((a.counts[t].textContent = String(s.length).padStart(2, "0")),
        a.names[t].replaceChildren());
      for (const [r, l] of s.entries()) {
        const o = i(
          "div",
          `bl-player${r % 2 ? " bl-player-above" : ""}${l.local ? " bl-player-local" : ""}`,
        );
        ((o.dataset.slot = String(l.slot)), (o.title = l.nick));
        const p = i("i", "bl-player-arrow");
        (p.setAttribute("aria-hidden", "true"),
          o.append(p, i("span", "bl-player-nick", l.nick)),
          a.names[t].append(o));
      }
    }
    (a.lineup?.setPlayers(a.players), n && a.confirmEquipment());
  }
}
function ye(e, n) {
  if ((F(), d)) {
    (n && (d.caption.textContent = n.replace(/\n/g, " · ")),
      e.players && I(e.players, !1));
    return;
  }
  const a = i("div", "battle-loading");
  (a.setAttribute("role", "dialog"),
    a.setAttribute("aria-modal", "true"),
    a.setAttribute(
      "aria-label",
      P("กำลังเตรียมการแข่งขัน", "Preparing match", "Menyiapkan pertandingan"),
    ));
  const t = i("header", "bl-header"),
    s = i("img", "bl-brand");
  ((s.src = se),
    (s.alt = "PBMB TH"),
    (s.draggable = !1),
    t.append(s, i("span", "bl-eyebrow", "BATTLE PREPARATION")));
  const r = i("div", "bl-teams"),
    l = [];
  for (const c of [0, 1]) {
    const h = i("div", `bl-team bl-team-${c}`),
      y = i("div", "bl-team-label"),
      w = i("img", "bl-team-badge");
    ((w.src = z[c]),
      (w.alt = c === 0 ? "Free Rebels" : "CT-Force"),
      (w.draggable = !1));
    const g = i("div", "bl-team-wordmark");
    (g.append(
      i("span", "bl-team-kicker", c === 0 ? "RED TEAM" : "BLUE TEAM"),
      i("span", "bl-team-title", c === 0 ? "FREE REBELS" : "CT-FORCE"),
    ),
      y.append(w, g));
    const U = i("span", "bl-team-count", "00");
    (l.push(U), h.append(y, U), r.append(h));
  }
  const o = i("div", "bl-versus", "VS"),
    p = i("div", "bl-stage");
  p.setAttribute("aria-hidden", "true");
  const f = i("div", "bl-roster"),
    L = [i("div", "bl-names bl-red"), i("div", "bl-names bl-blue")];
  f.append(...L);
  const A = i("footer", "bl-footer"),
    m = i("div", "bl-meta"),
    M = i("div", "bl-map");
  M.append(
    i("span", "bl-eyebrow", "NEXT OPERATION"),
    i("h1", "bl-map-title", ne[e.map] ?? e.map),
    i("div", "bl-mode", e.mode ?? (e.ai ? "AI TRAINING" : "TEAM BATTLE")),
  );
  const E = i("div", "bl-percent", "0%");
  m.append(M, E);
  const b = i("div", "bl-progress");
  (b.setAttribute("role", "progressbar"),
    b.setAttribute("aria-valuemin", "0"),
    b.setAttribute("aria-valuemax", "100"),
    b.setAttribute("aria-valuenow", "0"),
    b.setAttribute(
      "aria-label",
      P("ความคืบหน้าการโหลด", "Loading progress", "Progres memuat"),
    ));
  const q = i("div", "bl-progress-track"),
    O = i("div", "bl-progress-cells"),
    C = i("div", "bl-progress-cells bl-progress-fill");
  for (let c = 0; c < 64; c++)
    for (const h of [O, C]) {
      const y = i("i", "bl-cell");
      h.append(y);
    }
  (q.append(O, C), b.append(q));
  const W = i("div", "bl-status"),
    S = i(
      "span",
      "bl-caption",
      n?.replace(/\n/g, " · ") ??
        P("กำลังโหลดการแข่งขัน…", "Loading match…", "Memuat pertandingan…"),
    );
  (S.setAttribute("role", "status"),
    W.append(S, i("span", "bl-status-label", "LOADING")));
  const Z = i(
    "div",
    "bl-tip",
    P(
      "เคล็ดลับ  ·  กด Q เพื่อสลับกลับไปใช้อาวุธก่อนหน้า",
      "TIP  ·  Press Q to switch to your previous weapon",
      "TIPS  ·  Tekan Q untuk kembali ke senjata sebelumnya",
    ),
  );
  (A.append(m, b, W, Z),
    a.append(t, r, o, p, f, A),
    (a.style.visibility = "hidden"),
    (a.style.opacity = "0"),
    document.body.append(a));
  const T = v ?? X(e.players ?? []);
  v = null;
  let $;
  const G = new Promise((c) => {
    $ = c;
  });
  let D;
  const R = oe(a, async () => {
      await G;
      const c = await D;
      if (d === u) {
        if (!c)
          throw new Error(
            P(
              "โหลดโมเดลหน้าเตรียมการแข่งขันไม่สำเร็จ กรุณาลองอีกครั้ง",
              "Could not load the match lineup. Please try again.",
              "Gagal memuat model pertandingan. Silakan coba lagi.",
            ),
          );
        (await c.whenReady()) && d === u && (a.dataset.lineupReady = "true");
      }
    }),
    u = {
      root: a,
      stage: p,
      names: L,
      counts: l,
      caption: S,
      bar: b,
      fill: C,
      percent: E,
      players: T.players,
      progress: 0,
      shownAt: performance.now(),
      presentation: null,
      progressFrame: 0,
      assetsReady: !1,
      cancelWaits: new Set(),
      entry: R,
      prepared: T,
      confirmEquipment: $,
    };
  ((d = u),
    R.covered.then((c) => {
      c && d === u && H(!0);
    }),
    R.ready
      .then((c) => {
        if (!c || d !== u) return;
        ((u.shownAt = performance.now()),
          (u.presentation = new le(u.shownAt, K)),
          u.assetsReady && u.presentation.ready(u.shownAt));
        const h = (y) => {
          d === u &&
            Y(u, y) < 1 &&
            (u.progressFrame = requestAnimationFrame(h));
        };
        u.progressFrame = requestAnimationFrame(h);
      })
      .catch((c) => {
        console.warn("[battle-loading] Lineup preparation failed", c);
      }),
    I(e.players ?? [], !e.waitForEquipment),
    N(0));
  const ee = (c, h, y, w) => {
      const g = f.querySelector(`[data-slot="${c}"]`);
      g &&
        ((g.style.left = `${h}px`),
        (g.style.top = `${y}px`),
        (g.style.width = `${w}px`),
        (g.style.visibility = "visible"));
    },
    te = (c) =>
      !c || d !== u
        ? null
        : (c.setPlayers(u.players),
          (u.lineup = c),
          c.mount(p, ee),
          T.host.remove(),
          c);
  D = Promise.all([T.ready, G]).then(([c]) => te(c));
}
function ge() {
  const e = d;
  ((d = null),
    e && cancelAnimationFrame(e.progressFrame),
    e?.entry.cancel(),
    e?.confirmEquipment());
  for (const n of e?.cancelWaits ?? []) n();
  (e && J(e.prepared), e?.root.remove(), H(!1));
}
const Te = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      clearWarmBattleLineup: pe,
      hideBattleLoading: ge,
      onBattleLoadingCovered: ce,
      preloadBattleLoading: F,
      setBattleProgress: be,
      showBattleLoading: ye,
      updateBattleLoadingPlayers: I,
      waitBattleLoadingComplete: he,
      waitBattleLoadingCovered: de,
      waitBattleLoadingMinimum: me,
      warmBattleLineup: ue,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
export {
  me as a,
  ue as b,
  pe as c,
  ye as d,
  V as e,
  he as f,
  Te as g,
  ge as h,
  ce as o,
  F as p,
  Ee as r,
  be as s,
  I as u,
  de as w,
};
