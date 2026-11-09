const o = {
    hp: 100,
    run: { front: 6.5, side: 6, diagonal: 6, back: 6 },
    walk: { front: 4.2, side: 4, diagonal: 4, back: 4 },
    accelerationTime: 0.2,
    accelRateBackVsFront: 0,
    jumpHeight: 1,
    jumpTime: 0.55,
    jumpDelay: 0.06,
    jumpPenaltyRate: 0.15,
    jumpPenaltyTime: 0.5,
    crouchJumpHeight: 1.15,
    crouchJumpCheckTime: 0.5,
    camIKHeight: [1.407, 1.062, 0.86, 1.407],
    damageRate: {
      head: 35,
      body: 1.2,
      arm: 0.8,
      hand: 0.6,
      leg: 0.8,
      foot: 0.6,
    },
    ladder: {
      run: { front: 0, side: 0, diagonal: 0, back: 0 },
      walk: { front: 0, side: 0, diagonal: 0, back: 0 },
    },
    speedReduction: {
      body: { pct: 0, time: 0 },
      arm: { pct: 0, time: 0 },
      hand: { pct: 0, time: 0 },
      leg: { pct: 0, time: 0 },
      foot: { pct: 0, time: 0 },
    },
  },
  c = {
    fallMinDamage: 2,
    fallDamageMinHeight: 5.8,
    fallDamageSlope: 5,
    dinoFallMinDamage: 3,
    dinoFallDamageMinHeight: 9.8,
    dinoFallDamageSlope: 6,
    speedReductionTime: 0.5,
    speedReductionMaxRate: 20,
    invincibleTime: 4,
    respawnTime: 5,
    aimingAngleMin: -80,
    aimingAngleMax: 80,
  },
  p = {
    fov: 70,
    fovMin: 35,
    fovMax: 80,
    near: 0.1,
    far: 300,
    fpsCamPos: {
      male: [0.00565, 0.1392, -0.029],
      female: [0.01421, 0.0879, -0.026],
    },
    zoomTime: 0.15,
    postureTimeDown: 0.1,
    postureTimeUp: 0.3,
  },
  g = {
    damage: (a, e) => ({
      amp: 2.5 + Math.min(a, e) / e,
      freq: 1,
      phase: 0.2,
      time: 0.5,
    }),
    hitPoint: { amp: 2, freq: 2, phase: 0, time: 0.1 },
    explosion: (a, e) => {
      const i = 1 - a / (2 * e);
      return i > 0
        ? { amp: 15 * i * i, freq: 10 * i, phase: 0.2, time: i }
        : null;
    },
  };
function r(a = o, e = !1) {
  const i = e ? a.crouchJumpHeight : a.jumpHeight,
    t = a.jumpTime;
  return { gravity: (8 * a.jumpHeight) / (t * t), v0: (4 * i) / t };
}
function f(a, e) {
  return e > 0
    ? a !== 0
      ? "diagonal"
      : "front"
    : e < 0
      ? a !== 0
        ? "diagonal"
        : "back"
      : "side";
}
function u(a, e = o.hp, i = !1, t = 0) {
  const n = c,
    l = (i ? n.dinoFallDamageMinHeight : n.fallDamageMinHeight) + t,
    m = i ? n.dinoFallMinDamage : n.fallMinDamage,
    s = i ? n.dinoFallDamageSlope : n.fallDamageSlope;
  return a > l ? Math.min(e, Math.max(m, m + Math.trunc(s * a))) : 0;
}
const d = 0.75,
  h = {
    radius: 0.39,
    halfHeightStand: 0.325,
    halfHeightCrouch: 0.325,
    maxStepHeight: 0.4,
    maxSlopeClimbDeg: 45,
  },
  M = 0.005,
  S = 0.5,
  _ = 0.1,
  D = 1.2,
  E = 0.01,
  T = {
    moveNormal: null,
    firing: !1,
    aiming: !1,
    scoped: !1,
    walking: !1,
    fpsFamily: "male",
  };
export {
  D as M,
  h as P,
  _ as a,
  o as b,
  p as c,
  c as d,
  T as e,
  d as f,
  g,
  E as h,
  S as i,
  r as j,
  M as k,
  f as m,
  u as p,
};
