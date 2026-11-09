const d = [
    [
      601024, 601007, 601003, 601032, 601001, 601030, 601037, 601005, 601068,
      601038,
    ],
    [
      602011, 602009, 602067, 602034, 602060, 602039, 602036, 602008, 602035,
      602061, 602004, 602033, 602058, 602002, 602031, 602059,
    ],
  ],
  T = [103037, 103015, 103049, 103013, 103004, 104033, 104013, 104010],
  R = [
    "แมวซุ่มยิง",
    "ข้าวเหนียว",
    "หมูกรอบ",
    "สายฟ้า",
    "เสือหลงทาง",
    "ชาเย็น",
    "น้องวาฬ",
    "มังกรน้อย",
    "ดาวเหนือ",
    "นักรบเงา",
  ],
  B = [
    "NightOwl",
    "CrimsonFox",
    "ZeroHour",
    "SilverWolf",
    "GhostRunner",
    "NeonTiger",
    "StormRider",
    "PixelHunter",
    "IronFalcon",
    "MoonBlade",
  ];
function f(e, o) {
  const n = [...e];
  for (let t = n.length - 1; t > 0; t--) {
    const a = Math.floor(o() * (t + 1));
    [n[t], n[a]] = [n[a], n[t]];
  }
  return n;
}
function M(e, o = Math.random, n) {
  const t = new Set(e.map((r) => r.slot)),
    a = new Set(e.map((r) => r.nick)),
    i = d.map((r) =>
      f(
        r.filter((g) => !e.some((s) => s.chara === g)),
        o,
      ),
    ),
    c = f(T, o),
    u = f(R, o),
    h = f(B, o),
    m = [0, 0],
    A = [0, 0],
    w = [];
  for (let r = 0; r < 16; r++) {
    if (t.has(r) || (n && !n.has(r))) continue;
    const g = w.length,
      s = r % 2,
      C = ((r >> 1) + s) % 2,
      E = C ? h : u,
      p = E[A[C]++ % E.length];
    let l = p,
      I = 1;
    for (; a.has(l);) l = `${p}${I++}`;
    a.add(l);
    const D = i[s].length ? i[s] : d[s];
    w.push({
      slot: r,
      nick: l,
      rank: 1 + Math.floor(o() * 50),
      chara: D[m[s]++ % D.length],
      weapon: c[g % c.length],
    });
  }
  return w;
}
const S = 21570,
  k = 17494,
  H = { unknown: 0, pc: 1, mobile: 2 },
  x = 9030;
let _ = H.unknown;
function O(e) {
  _ = e;
}
const b = () => _;
function v(e, o, n) {
  e.writeH(S).writeC(1).writeC(o.length);
  for (const t of o)
    e.writeC(t.slot)
      .writeC(t.rank)
      .writeD(t.chara)
      .writeD(t.weapon)
      .writeU(t.nick, 66);
  if (n) {
    e.writeH(k);
    for (let t = 0; t < 18; t++) e.writeC(n[t] ?? 0);
  }
  return e.writeH(0);
}
function y(e) {
  return e.remaining < 20 || e.readH() !== k
    ? Array(18).fill(0)
    : Array.from({ length: 18 }, () => e.readC());
}
function N(e) {
  if (e.remaining < 4 || e.readH() !== S || e.readC() !== 1) return [];
  const o = e.readC(),
    n = [];
  if (o > 16 || e.remaining < o * 76) return [];
  for (let t = 0; t < o; t++) {
    const a = e.readC(),
      i = e.readC(),
      c = e.readD(),
      u = e.readD(),
      h = e.readU(66);
    a < 16 &&
      !n.some((m) => m.slot === a) &&
      n.push({ slot: a, rank: i, chara: c, weapon: u, nick: h });
  }
  return n;
}
const j = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      DEVICE: H,
      DEVICE_REQ: x,
      TEST_BOT_CHARAS: d,
      TEST_BOT_WEAPONS: T,
      localDevice: b,
      makeTestBots: M,
      readSlotDevices: y,
      readTestBots: N,
      setLocalDevice: O,
      writeTestBots: v,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
export { H as D, x as a, y as b, b as l, M as m, N as r, O as s, j as t };
