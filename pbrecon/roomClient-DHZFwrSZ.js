const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "bundle/combatProtocol-ugHSWx7a.js",
      "bundle/noteClient-Diy66me5.js",
    ]),
) => i.map((i) => d[i]);
import { _ as Se } from "./preload-helper-CLcXU_4U.js";
import {
  P as _,
  z as Oe,
  a as k,
  A as ge,
  b as Ie,
  B as ye,
  D as De,
  n as Ne,
  E as Le,
} from "./noteClient-Diy66me5.js";
import { M as Y, m as Z, a as Be } from "./maintenance-oGso2NiD.js";
import { a as ee } from "./frameEnv-BBzonJVb.js";
import {
  D as ke,
  l as G,
  a as Me,
  r as q,
  b as W,
} from "./testBots-WllQD4W5.js";
import { b as m } from "./language-CGImk_RO.js";
import { l as be } from "./accessoryMount-vWra_6Ct.js";
const te = 1,
  He = 2;
function j(e, t) {
  const n = (t >> 3) & 7,
    s = t & 7;
  if (s !== 0) {
    const a = ((e[n] & (255 >> s)) << s) & 255,
      o = e[(n + 1) & 7] >> (8 - s);
    return (a + o) & 255;
  }
  return e[n];
}
function Ge(e, t, n) {
  ((e[0] ^= n),
    (e[2] ^= n),
    (e[4] ^= n),
    (e[6] ^= n),
    (t[1] ^= n),
    (t[3] ^= n),
    (t[5] ^= n),
    (t[7] ^= n));
}
function Ke(e, t, n, s) {
  let a, o, i;
  switch (s) {
    case te:
      ((a = (n >> 4) + e), (o = n & 15), (i = 8));
      break;
    case He:
      ((a = (n & 15) + e), (o = n >> 4), (i = 14));
      break;
    default:
      ((a = n + e), (o = n), (i = 12));
      break;
  }
  return { initPos0: a, initPos1: o + t, step: i };
}
class Pe {
  k0;
  k1;
  v18 = 0;
  runXor = 0;
  p0;
  p1;
  step;
  constructor(t, n, s, a, o) {
    if (t.length < 16) throw new Error("CMess key must be 16 bytes");
    ((this.k0 = t.slice(0, 8)), (this.k1 = t.slice(8, 16)));
    const i = Ke(n, s, a, o);
    ((this.p0 = i.initPos0), (this.p1 = i.initPos1), (this.step = i.step));
  }
  next() {
    const t = j(this.k0, this.v18 + this.p0),
      n = j(this.k1, this.v18 + this.p1);
    return (
      (this.runXor = (this.runXor ^ t ^ n) & 255),
      (this.v18 = this.runXor + this.v18 + this.step),
      this.runXor
    );
  }
  feed(t) {
    Ge(this.k0, this.k1, t);
  }
}
function Ue() {
  const e = new Uint8Array(3);
  return (
    crypto.getRandomValues(e),
    { r0: e[0] % 64, r1: e[1] % 64, r2: e[2] }
  );
}
function ve(e, t, n, s = Ue()) {
  const { r0: a, r1: o, r2: i } = s,
    r = ((2 - t.length) & 7) + 2,
    c = new Pe(e, a, o, i, n),
    l = new Uint8Array(4 + t.length + r);
  ((l[0] = a), (l[1] = o), (l[2] = i), (l[3] = r));
  let h = 4;
  for (let u = 0; u < t.length; u++) {
    const E = (c.next() ^ t[u]) & 255;
    ((l[h++] = E), c.feed(E));
  }
  for (let u = 0; u < r; u++) {
    const E = (r ^ c.next()) & 255;
    ((l[h++] = E), c.feed(E));
  }
  return l;
}
const se = 32768;
function Qe(e) {
  if (e.length > 32767) throw new Error("CMess payload too large");
  const t = e.length | se,
    n = new Uint8Array(3 + e.length);
  return ((n[0] = t & 255), (n[1] = t >> 8), n.set(e, 2), n);
}
function Fe(e) {
  return (((Math.imul(e, 214013) + 2531011) | 0) >> 16) & 32767;
}
class x {
  pending = new Uint8Array(0);
  push(t) {
    const n = new Uint8Array(this.pending.length + t.length);
    (n.set(this.pending, 0), n.set(t, this.pending.length));
    const s = [];
    let a = 0;
    for (; a + 2 <= n.length;) {
      const o = n[a] | (n[a + 1] << 8),
        i = (o & se) !== 0,
        r = o & 32767,
        c = i ? 3 + r : 5 + r;
      if (a + c > n.length) break;
      (r >= 2 && s.push({ payload: n.slice(a + 2, a + 2 + r), encrypted: i }),
        (a += c));
    }
    return ((this.pending = n.slice(a)), s);
  }
}
const A = {
    BASE_CONNECT_ACK: 2306,
    BASE_LOGIN_REQ: 1281,
    BASE_LOGIN_ACK: 1283,
    BASE_KEEP_ALIVE_REQ: 2309,
    BASE_USER_LEAVE_REQ: 2328,
    BASE_USER_LEAVE_ACK: 2329,
    BASE_USER_ENTER_REQ: 2330,
    BASE_USER_ENTER_ACK: 2331,
    BASE_GET_CHANNELLIST_REQ: 2332,
    BASE_GET_CHANNELLIST_ACK: 2333,
    BASE_SELECT_CHANNEL_REQ: 2334,
    BASE_SELECT_CHANNEL_ACK: 2335,
    BASE_GAME_SERVER_STATE_REQ: 2399,
    BASE_GAME_SERVER_STATE_ACK: 2400,
    LOBBY_LEAVE_REQ: 2561,
    LOBBY_ENTER_REQ: 2583,
    LOBBY_ENTER_ACK: 2584,
    LOBBY_GET_ROOMLIST_REQ: 2587,
    LOBBY_GET_ROOMLIST_ACK: 2588,
    LOBBY_GET_ROOMINFOADD_REQ: 2567,
    LOBBY_GET_ROOMINFOADD_ACK: 2568,
    SERVER_MESSAGE_DISCONNECTIONSUCCESS_ACK: 3074,
  },
  Ye = {
    0: "SUCCESS",
    2147483648: "FAIL",
    2147483905: "EVENT_LOG_IN_ALREADY_LOGIN",
    2147483906: "EVENT_LOG_IN_INVALID_ACCOUNT",
    2147483910: "EVENT_LOG_IN_TIME_OUT_2 (access level)",
    2147483911: "EVENT_LOG_IN_BLOCK_ACCOUNT",
    2147483927: "LOGIN_ID_PASS_INCORRECT (token not found)",
    2147483937: "LOGIN_BLOCK_IP",
    2147484161: "CHANNEL_FULL",
    2147484162: "CHANNEL_REQUIREMENT",
    [Y]: Be,
  };
function ne(e) {
  return (
    (e >>>= 0),
    e === Y ? Z() : (Ye[e] ?? `0x${e.toString(16).padStart(8, "0")}`)
  );
}
function Ve(e) {
  let t = "";
  for (const n of e) t += n.toString(16).padStart(2, "0");
  return t;
}
function rs(e) {
  let t = "";
  for (const n of e) t += String.fromCharCode(n);
  return btoa(t);
}
function cs(e) {
  const t = atob(e.trim()),
    n = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++) n[s] = t.charCodeAt(s);
  return n;
}
const $e = { DEV: !1, VITE_GW_URL: "/" };
class K extends Error {}
const ae = $e,
  qe = ae?.VITE_GW_URL,
  We = ae?.DEV === !0,
  V = new Map();
function oe(e, t) {
  const n = new URL(e, t);
  if (
    (n.protocol === "http:"
      ? (n.protocol = "ws:")
      : n.protocol === "https:" && (n.protocol = "wss:"),
    n.protocol !== "ws:" && n.protocol !== "wss:")
  )
    throw new Error("Invalid gateway protocol");
  return ((n.search = ""), (n.hash = ""), n.href.replace(/\/+$/, ""));
}
function M() {
  const e = typeof location < "u" ? location.href : "http://127.0.0.1/";
  return oe(qe, e);
}
function ie(e) {
  e.readH();
  const t = e.readC();
  e.skip(t);
  const n = e.readH(),
    s = e.readH(),
    a = e.readB(s),
    o = e.readB(n - 2 - s);
  (e.readC(), e.readH());
  const i = e.readH();
  return {
    sessionId: e.readD(),
    sessionSeed: i,
    modulus: a,
    exponent: o,
    serverKey: a.slice(0, 16),
    clientKey: a.slice(16, 32),
  };
}
const P = new Set();
function je(e) {
  for (const t of P)
    try {
      t.isOpen && t.sendText({ t: "clientEvent", kind: e });
    } catch {}
}
const xe = ee("noteToServer") ?? je;
let U = 0;
function ze() {
  const e = U;
  return ((U = 0), e);
}
const Je = ee("takeNetMs") ?? ze;
class $ {
  maintenance = null;
  onMaintenance = null;
  target;
  serverUrl;
  info = null;
  debug = !1;
  onClose = null;
  signalTicket = null;
  combatAuthority = !1;
  ws = null;
  decoder = new x();
  seed = 0;
  listeners = new Set();
  keepAlive = null;
  closed = !1;
  get connected() {
    return (
      !this.closed &&
      this.ws?.readyState === WebSocket.OPEN &&
      this.info !== null
    );
  }
  constructor(t, n = M()) {
    ((this.target = t), (this.serverUrl = n));
  }
  async connect(t = 6, n = 8e3) {
    for (let s = 0; ; s++)
      try {
        return await this.connectOnce(n);
      } catch (a) {
        if (!(a instanceof K) || s >= t) throw a;
        (await new Promise((o) => setTimeout(o, 5500)),
          (this.decoder = new x()),
          (this.closed = !1));
      }
  }
  connectOnce(t) {
    return new Promise((n, s) => {
      const a = `${this.serverUrl.replace(/\/$/, "")}/tcp?target=${this.target}`,
        o = new WebSocket(a);
      ((o.binaryType = "arraybuffer"), (this.ws = o));
      const i = setTimeout(() => {
          (s(new Error(`${this.target}: no CONNECT_ACK within ${t}ms (${a})`)),
            this.close());
        }, t),
        r = this.on((c, l) => {
          if (c === A.BASE_CONNECT_ACK) {
            (r(), clearTimeout(i));
            try {
              ((this.info = ie(l)),
                P.add(this),
                (this.seed = this.info.sessionSeed),
                (this.keepAlive = setInterval(
                  () => this.send(A.BASE_KEEP_ALIVE_REQ),
                  3e4,
                )),
                n(this.info));
            } catch (h) {
              s(h);
            }
          }
        });
      ((o.onmessage = (c) => {
        const l = performance.now();
        (typeof c.data == "string"
          ? this.onText(c.data)
          : this.onBytes(new Uint8Array(c.data)),
          (U += performance.now() - l));
      }),
        (o.onerror = () => {
          (clearTimeout(i),
            s(
              new Error(
                `${this.target}: WebSocket error (server ${this.serverUrl} up?)`,
              ),
            ));
        }),
        (o.onclose = (c) => {
          if ((clearTimeout(i), this.teardown(), !this.info)) {
            (r(),
              s(
                new K(
                  `${this.target}: server closed before CONNECT_ACK (throttle 5s/IP?)`,
                ),
              ));
            return;
          }
          this.onClose?.(c.reason || `closed (${c.code})`);
        }));
    });
  }
  on(t) {
    return (this.listeners.add(t), () => this.listeners.delete(t));
  }
  waitFor(t, n = 5e3) {
    return new Promise((s, a) => {
      const o = setTimeout(() => {
          (i(),
            a(new Error(`${this.target}: timeout waiting for opcode ${t}`)));
        }, n),
        i = this.on((r, c) => {
          r === t && (clearTimeout(o), i(), s(c));
        });
    });
  }
  send(t, n) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.info)
      throw new Error(`${this.target}: not connected`);
    this.seed = Fe(this.seed);
    const s = new _().writeH(t).writeH(this.seed);
    n && s.writeB(Oe(n));
    const a = s.toBytes();
    (this.debug && console.debug(`[${this.target}] >> ${t} ${Ve(a)}`),
      this.ws.send(Qe(ve(this.info.clientKey, a, te))));
  }
  sendText(t) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      throw new Error(`${this.target}: not connected`);
    this.ws.send(JSON.stringify(t));
  }
  close() {
    if (!this.closed) {
      this.teardown();
      try {
        this.ws?.close();
      } catch {}
    }
  }
  get isOpen() {
    return !this.closed && this.ws?.readyState === WebSocket.OPEN;
  }
  get realtimeReady() {
    return this.isOpen && (this.ws?.bufferedAmount ?? 0) < 64 * 1024;
  }
  teardown() {
    ((this.closed = !0),
      P.delete(this),
      this.keepAlive && clearInterval(this.keepAlive),
      (this.keepAlive = null));
  }
  onText(t) {
    try {
      const n = JSON.parse(t);
      if (n.t === "signalTicket" && typeof n.ticket == "string")
        ((this.signalTicket = n.ticket),
          (this.combatAuthority = n.combat === "server-v1"));
      else if (
        n.t === "enterTicket" &&
        typeof n.ticket == "string" &&
        typeof n.pid == "string" &&
        /^\d{1,20}$/.test(n.pid)
      )
        V.set(BigInt(n.pid), n.ticket);
      else if (
        n.t === "maintenance" &&
        typeof n.enabled == "boolean" &&
        typeof n.isGM == "boolean"
      ) {
        const s =
          this.maintenance?.enabled !== n.enabled ||
          this.maintenance?.isGM !== n.isGM;
        ((this.maintenance = { enabled: n.enabled, isGM: n.isGM }),
          s && this.onMaintenance?.());
      }
    } catch {}
  }
  onBytes(t) {
    for (const n of this.decoder.push(t)) {
      if (n.encrypted || n.payload.length < 2) continue;
      const s = n.payload[0] | (n.payload[1] << 8);
      this.debug &&
        console.debug(`[${this.target}] << ${s} (${n.payload.length}b)`);
      for (const a of [...this.listeners])
        try {
          a(s, new k(n.payload, 2));
        } catch (o) {
          console.warn(`[${this.target}] handler error for opcode ${s}`, o);
        }
    }
  }
}
const ls = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        EarlyCloseError: K,
        GW_OVERRIDE: We,
        PbConnection: $,
        defaultServerUrl: M,
        enterTickets: V,
        gatewayBaseUrl: oe,
        noteToServer: xe,
        parseConnectAck: ie,
        takeNetMs: Je,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  R = {
    GET_USER_INFO_REQ: 2316,
    GET_USER_INFO_ACK: 2317,
    GET_INVEN_INFO_REQ: 2318,
    GET_INVEN_INFO_ACK: 2319,
    GET_OPTION_REQ: 2320,
    GET_OPTION_ACK: 2321,
    GET_CHARA_INFO_ACK: 2453,
    GET_POINT_CASH_REQ: 1060,
    GET_POINT_CASH_ACK: 1061,
  };
function Xe() {
  return new _(0);
}
function Ze() {
  return new _(0);
}
function et() {
  return new _(0);
}
function tt() {
  return new _(0);
}
function re(e) {
  return {
    objectId: e.readD(),
    itemId: e.readD(),
    equip: e.readC(),
    count: e.readD(),
  };
}
function L(e) {
  return { itemId: e.readD(), objectId: e.readD() };
}
function z(e) {
  return {
    matches: e.readD(),
    wins: e.readD(),
    loses: e.readD(),
    draws: e.readD(),
    kills: e.readD(),
    headshots: e.readD(),
    deaths: e.readD(),
    totalMatches: e.readD(),
    totalKills: e.readD(),
    escapes: e.readD(),
    assists: e.readD(),
    mvp: e.readD(),
  };
}
function ce(e) {
  return { season: z(e), total: z(e) };
}
function le(e) {
  const t = e.readU(66),
    n = e.readD(),
    s = e.readD(),
    a = e.readD();
  e.skip(4);
  const o = BigInt.asUintN(64, e.readQ());
  e.skip(15);
  const i = e.readD();
  e.skip(6);
  const r = e.readH();
  e.skip(4);
  const c = e.readD(),
    l = e.readD(),
    h = e.readD();
  e.skip(8);
  const u = e.readC();
  e.skip(1);
  const E = e.readU(34);
  return {
    nickname: t,
    rank: n,
    rankHigh: s,
    gold: a,
    exp: o,
    tags: i,
    inventoryPlus: r,
    cash: c,
    clanId: l,
    clanAccess: h,
    cafePC: u,
    clanName: E,
    clanRank: e.readC(),
    clanUnit: e.readC(),
    clanLogo: e.readD(),
    clanNameColor: e.readC(),
    clanEffect: e.readC(),
  };
}
function de(e) {
  const t = e.readC(),
    n = e.readC(),
    s = e.readD();
  return (
    e.readD(),
    {
      tag: t,
      nickColor: n,
      fakeRank: s,
      fakeNick: e.readU(66),
      crosshairColor: e.readH(),
      muzzleColor: e.readH(),
      nickBorderColor: e.readC(),
    }
  );
}
function st(e) {
  e.readH();
  const t = e.readD(),
    n = () => ({ itemId: 0, objectId: 0 }),
    s = {
      error: t,
      basic: null,
      record: null,
      invItem: null,
      redSlot: 0,
      blueSlot: 1,
      dino: n(),
      spray: n(),
      namecard: n(),
      pointUp: 0,
      expUp: 0,
      age: 0,
    };
  if (t !== 0) return s;
  const a = (o) => {
    const i = e.readC();
    if (i !== 0)
      throw new Error(`2317: ${o} count ${i} (element size not known)`);
  };
  return (
    e.skip(8),
    a("P_QUEST_VERSION_INFO"),
    e.skip(127),
    a("ITEM_INFO[6]"),
    e.skip(444),
    a("LADDER_RECORD a"),
    a("LADDER_RECORD b"),
    e.skip(6 * 32 + 3),
    e.skip(4 * e.readC()),
    e.skip(33),
    a("NOTIFY_MEDAL"),
    e.skip(4),
    a("uchar[3]"),
    e.skip(8),
    a("uchar[160]"),
    (s.questing = e.readB(89)),
    e.skip(25),
    e.skip(468 * e.readC()),
    e.skip(9 * e.readC()),
    e.skip(8),
    (s.redSlot = e.readC()),
    (s.blueSlot = e.readC()),
    (s.dino = L(e)),
    (s.spray = L(e)),
    (s.namecard = L(e)),
    e.skip(13),
    (s.pointUp = new DataView(e.readB(4).buffer).getFloat32(0, !0)),
    (s.expUp = new DataView(e.readB(4).buffer).getFloat32(0, !0)),
    (s.invItem = de(e)),
    (s.record = ce(e)),
    (s.basic = le(e)),
    (s.age = e.readC()),
    s
  );
}
function nt(e) {
  e.readH();
  const t = e.readD();
  if (t !== 0) return { error: t, items: [], basicCount: 0 };
  const n = e.readH(),
    s = [];
  for (let o = 0; o < n; o++) s.push(re(e));
  const a = e.readH();
  return (e.skip(8), { error: t, items: s, basicCount: a });
}
function at(e) {
  const t = e.readD(),
    n = e.readD(),
    s = e.readD(),
    a = { error: t, cash: n, gold: s, tags: e.readD() };
  return e.remaining >= 4 ? { ...a, diamonds: e.readD() } : a;
}
async function ot(e, t = 5e3) {
  let n = null;
  const s = e.on((a, o) => {
    a === R.GET_CHARA_INFO_ACK
      ? (n = o.data.slice(o.pos))
      : a === ge.LIST_ACK
        ? Ie.set(ye(new k(o.data.slice(o.pos))))
        : a === De.LIST_ACK && Ne.set(Le(new k(o.data.slice(o.pos))));
  });
  try {
    const a = e.waitFor(R.GET_USER_INFO_ACK, t);
    e.send(R.GET_USER_INFO_REQ, Xe());
    const o = st(await a),
      i = e.waitFor(R.GET_INVEN_INFO_ACK, 2e3).catch(() => null);
    e.send(R.GET_INVEN_INFO_REQ, Ze());
    const r = await i;
    e.send(R.GET_OPTION_REQ, et());
    const c = e.waitFor(R.GET_POINT_CASH_ACK, t);
    e.send(R.GET_POINT_CASH_REQ, tt());
    const { error: l, ...h } = at(await c);
    return {
      userInfo: o,
      inventory: r ? nt(r) : null,
      wallet: l === 0 ? h : null,
      charaInfoRaw: n,
    };
  } finally {
    s();
  }
}
const ds = { Durable: 1, Temporary: 2, Permanent: 3, CafePC: 4 },
  S = {
    Primary: 0,
    Secondary: 1,
    Melee: 2,
    Throw: 3,
    Special: 4,
    Chara: 8,
    Head: 9,
    Face: 10,
    Jacket: 11,
    Pocket: 12,
    Glove: 13,
    Belt: 14,
    Holster: 15,
    Skin: 16,
    Beret: 17,
  },
  y = 18,
  hs = { Cash: 1, Gold: 2 },
  C = {
    USER_ENTER_ACK: 2331,
    MYINFO_BASIC_ACK: 2371,
    INV_ITEM_DATA_ACK: 2395,
    POINT_CASH_ACK: 1061,
    MYINFO_RECORD_ACK: 2369,
    CHARA_INFO_ACK: 2453,
    CHANGE_INVENTORY_ACK: 3082,
    INVENTORY_GET_INFO_ACK: 3334,
    SHOP_DELETE_ITEM_ACK: 1059,
    CHAR_CREATE_CHARA_REQ: 6145,
    CHAR_CREATE_CHARA_ACK: 6146,
    CHAR_CHANGE_EQUIP_REQ: 6149,
    CHAR_CHANGE_EQUIP_ACK: 6150,
    CHAR_DELETE_CHARA_REQ: 6151,
    CHAR_DELETE_CHARA_ACK: 6152,
    SHOP_GET_SAILLIST_REQ: 1029,
    SHOP_GOODS_BUY_REQ: 1045,
    SHOP_GOODS_BUY_ACK: 1047,
    SHOP_GOODS_GIFT_REQ: 1048,
    SHOP_GOODS_GIFT_ACK: 1049,
    SHOP_AUTH_GIFT_REQ: 1056,
    SHOP_AUTH_GIFT_ACK: 1057,
    BATTLE_RESPAWN_REQ: 5137,
    BATTLE_RESPAWN_ACK: 5138,
  },
  he = 1,
  w = () => ({ itemId: 0, objectId: 0 });
function B(e, t) {
  const n = [];
  for (let s = 0; s < t; s++) n.push(L(e));
  return n;
}
function it(e) {
  return le(e);
}
function rt(e) {
  return de(e);
}
function ct(e) {
  return ce(e);
}
function _e(e) {
  e.readH();
  const t = e.readH(),
    n = [];
  for (let s = 0; s < t; s++) {
    const a = e.readC();
    (e.readC(), n.push({ slot: a, itemId: e.readD(), objectId: e.readD() }));
  }
  return { charas: n, equip: B(e, y) };
}
function lt(e) {
  e.readH();
  const t = B(e, e.readC()),
    n = [];
  for (let i = e.readC(), r = 0; r < i; r++) n.push(e.readD());
  e.readC();
  const s = L(e);
  e.skip(5);
  const a = B(e, y),
    o = B(e, e.readC());
  return {
    emoticons: t,
    charaSlots: n,
    accessory: s,
    equip: a,
    dino: o[0] ?? w(),
    spray: o[1] ?? w(),
    namecard: o[2] ?? w(),
  };
}
function dt(e) {
  e.readH();
  const t = e.readH(),
    n = e.readH(),
    s = [];
  for (let a = 0; a < n; a++) s.push(re(e));
  return { inventoryTotal: t, items: s, changeType: e.readC() };
}
function _s(e) {
  const t = e.readD(),
    n = e.readD();
  return { code: t, ok: t === 1, objectId: t === 1 ? n : 0 };
}
function ht(e) {
  return { error: e.readD() };
}
function _t(e) {
  e.readH();
  const t = e.readD();
  if (t !== 0)
    return {
      error: t,
      kind: 0,
      slot: -1,
      itemId: 0,
      objectId: 0,
      equip: [],
      cash: 0,
      gold: 0,
    };
  e.readC();
  const n = B(e, y),
    s = e.readD(),
    a = e.readD(),
    o = e.readC();
  e.readC();
  const i = e.readC();
  return {
    error: t,
    kind: o,
    slot: i,
    itemId: n[S.Chara].itemId,
    objectId: n[S.Chara].objectId,
    equip: n,
    cash: s,
    gold: a,
  };
}
function us(e) {
  const t = e.readD();
  return t !== 0
    ? { error: t, slot: -1, objectId: 0 }
    : { error: t, slot: e.readC(), objectId: e.readD() };
}
function ue(e, t) {
  e.readH();
  const n = e.readC(),
    s = [];
  for (let c = 0; c < n; c++) (e.readD(), s.push(e.readD()), e.readC());
  e.readD();
  const a = e.readD(),
    o = e.readD(),
    i = e.readD();
  let r = n > 0 && s.every((c) => c !== 0);
  return (
    r && t && (r = t.every((c) => s.includes(c.goodId))),
    {
      ok: r,
      code: r ? he : i,
      goodIds: r ? s : [],
      gold: a,
      cash: o,
      time: r ? i : 0,
    }
  );
}
function ut(e) {
  const t = e.readD(),
    n = e.readD(),
    s = e.readD(),
    a = {
      primary: e.readD(),
      secondary: e.readD(),
      melee: e.readD(),
      grenade: e.readD(),
      special: e.readD(),
    };
  e.skip(20);
  const o = e.readD(),
    i = [];
  for (let c = 0; c < 8; c++) i.push(e.readD());
  const r = e.readD();
  return e.remaining >= 4
    ? {
        slot: t,
        roomSpawns: n,
        slotSpawns: s,
        weapons: a,
        chara: o,
        parts: i,
        beret: r,
        accessory: e.readD(),
      }
    : {
        slot: t,
        roomSpawns: n,
        slotSpawns: s,
        weapons: a,
        chara: o,
        parts: i,
        beret: r,
        accessory: null,
        ...(e.remaining >= 2 ? { accessoryLow: e.readH() } : {}),
      };
}
function Es(e = "") {
  return new _(32).writeS(e, 32);
}
function Ee(e) {
  const t = new _(1 + e.length * 15).writeC(e.length);
  for (const n of e)
    t.writeC(0).writeD(n.goodId).writeC(n.buyType).writeC(0).writeQ(0n);
  return t;
}
function Et(e, t, n) {
  const s = n.slice(0, 32);
  return new _(10 + s.length * 2)
    .writeC(0)
    .writeC(s.length)
    .writeU(s, s.length * 2)
    .writeC(0)
    .writeD(e)
    .writeC(t)
    .writeC(0);
}
function As(e) {
  return new _(1).writeC(e);
}
function At(e) {
  const t = new _(256),
    n = (i, r) => {
      if (i.length > r) throw new RangeError(`6149: ${i.length} > ${r}`);
      t.writeC(i.length);
      for (const c of i) t.writeD(c.itemId).writeD(c.objectId);
    },
    s = (i) => {
      if (i.length > 39) throw new RangeError("6149: coupon list > 39");
      t.writeC(i.length);
      for (const r of i) t.writeD(r);
    };
  (n(e.emoticons ?? [], 6), t.writeC(e.emoticonsChanged ? 1 : 0));
  const a = e.accessory ?? w();
  (t
    .writeD(a.itemId)
    .writeD(a.objectId)
    .writeC(e.accessoryChanged ? 1 : 0),
    s(e.couponsDisable ?? []),
    t.writeH(0),
    s(e.couponsEnable ?? []),
    t.writeH(0));
  const o = e.equip ?? [];
  if (o.length > y) throw new RangeError("6149: equip > 18 pairs");
  t.writeC(0);
  for (let i = 0; i < y; i++) {
    const r = o[i] ?? w();
    t.writeD(r.itemId).writeD(r.objectId);
  }
  return (
    t.writeC(e.equipChanged ? 1 : 0),
    n(e.items3 ?? [], 3),
    t.writeC(e.items3Changed ? 1 : 0),
    t.writeC(2).writeC(e.charaSlots[0]).writeC(e.charaSlots[1]),
    t
  );
}
const g = 255;
function Ct(e) {
  return e.charas.filter(
    (t) => t.objectId >= 1073741824 && t.objectId <= 1090519039,
  );
}
function Cs(e, t, n) {
  const s = e.equip.map((r, c) => t[c] ?? r);
  for (const r of [5, 6, 7]) s[r] = w();
  const a = (r) =>
      n && n.charas.filter((c) => c.slot === r).length === 1 ? r : g,
    [o, i] = e.charaSlots;
  return {
    equip: s,
    equipChanged: !0,
    charaSlots: e.charaSlots.length === 2 ? [a(o), a(i)] : [g, g],
  };
}
function ms(e, t) {
  return {
    items3: [{ ...e.dino }, { ...e.spray }, t ? { ...t } : w()],
    items3Changed: !0,
    charaSlots: [g, g],
  };
}
function Ts(e) {
  return {
    accessory: e ? { ...e } : w(),
    accessoryChanged: !0,
    charaSlots: [g, g],
  };
}
function ws(e) {
  return {
    primary: e[S.Primary]?.itemId ?? 0,
    secondary: e[S.Secondary]?.itemId ?? 0,
    melee: e[S.Melee]?.itemId ?? 0,
    grenade: e[S.Throw]?.itemId ?? 0,
    special: e[S.Special]?.itemId ?? 0,
  };
}
function mt(e, t, n = w()) {
  const s = new _(160);
  for (let a = 0; a < y; a++) {
    const o = a >= 5 && a <= 7 ? w() : (e[a] ?? w());
    s.writeD(o.itemId).writeD(o.objectId);
  }
  return s
    .writeH(t & 65535)
    .writeD(n.itemId)
    .writeD(n.objectId);
}
function Tt(e, t = 5e3) {
  const n = {};
  let s = () => {};
  const a = new Promise((o) => {
    const i = setTimeout(() => {
        (r(), o(n));
      }, t),
      r = e.on((c, l) => {
        switch (c) {
          case C.MYINFO_BASIC_ACK:
            n.basic = it(l);
            break;
          case C.INV_ITEM_DATA_ACK:
            n.invItem = rt(l);
            break;
          case C.POINT_CASH_ACK: {
            l.readD() === 0 &&
              ((n.wallet = {
                cash: l.readD(),
                gold: l.readD(),
                tags: l.readD(),
              }),
              l.remaining >= 4 && (n.wallet.diamonds = l.readD()));
            break;
          }
          case C.MYINFO_RECORD_ACK:
            n.record = ct(l);
            break;
          case C.CHARA_INFO_ACK:
            n.charaInfo = _e(l);
            break;
          case C.CHANGE_INVENTORY_ACK:
            ((n.loadout = lt(l)), clearTimeout(i), r(), o(n));
            break;
        }
      });
    s = () => {
      (clearTimeout(i), r(), o(n));
    };
  });
  return { state: n, done: a, stop: () => s() };
}
async function ps(e, t, n = 5e3) {
  const s = [],
    a = e.on((o, i) => {
      o === C.INVENTORY_GET_INFO_ACK && s.push(dt(i));
    });
  try {
    const o = e.waitFor(C.SHOP_GOODS_BUY_ACK, n);
    return (
      e.send(C.SHOP_GOODS_BUY_REQ, Ee(t)),
      { result: ue(await o, t), deltas: s }
    );
  } finally {
    a();
  }
}
function wt(e, t, n = "") {
  return Ee(e)
    .writeC(n.length)
    .writeU(n, n.length * 2)
    .writeC(t.length)
    .writeU(t, t.length * 2);
}
function pt(e) {
  e.readH();
  const t = e.readC(),
    n = [];
  for (let i = 0; i < t; i++) (e.readD(), n.push(e.readD()), e.readC());
  const s = e.readD(),
    a = e.readD(),
    o = e.readD();
  return { ok: !0, code: he, goodIds: n, gold: a, cash: s, time: o };
}
function fs(e, t, n, s = "", a = 5e3) {
  return new Promise((o) => {
    const i = (l) => {
        (clearTimeout(r), c(), o(l));
      },
      r = setTimeout(
        () =>
          i({
            ok: !1,
            code: 2147483648,
            goodIds: [],
            gold: 0,
            cash: 0,
            time: 0,
          }),
        a,
      ),
      c = e.on((l, h) => {
        l === C.SHOP_GOODS_GIFT_ACK
          ? i(pt(h))
          : l === C.SHOP_GOODS_BUY_ACK && i(ue(h, t));
      });
    e.send(C.SHOP_GOODS_GIFT_REQ, wt(t, n, s));
  });
}
async function Rs(e, t, n = 5e3) {
  const s = e.waitFor(C.SHOP_AUTH_GIFT_ACK, n).then(
    (a) => a.readD(),
    () => 2147483648,
  );
  return (e.send(C.SHOP_AUTH_GIFT_REQ, new _(4).writeD(t)), s);
}
async function Ss(e, t, n = 5e3) {
  const s = e.waitFor(C.CHAR_CHANGE_EQUIP_ACK, n);
  return (e.send(C.CHAR_CHANGE_EQUIP_REQ, At(t)), ht(await s).error);
}
async function Os(e, t, n, s, a = 5e3) {
  const o = e.waitFor(C.CHAR_CREATE_CHARA_ACK, a);
  return (e.send(C.CHAR_CREATE_CHARA_REQ, Et(t, n, s)), _t(await o));
}
const ft = "c9bb7c4f004ede8ed47e11ca58721167",
  J = 1100,
  gs = 4;
function Rt() {
  const e = "pbweb.mac";
  try {
    const n = localStorage.getItem(e);
    if (n && /^[0-9a-f]{12}$/.test(n))
      return Uint8Array.from(n.match(/../g).map((s) => parseInt(s, 16)));
  } catch {}
  const t = crypto.getRandomValues(new Uint8Array(6));
  t[0] = (t[0] & 254) | 2;
  try {
    localStorage.setItem(
      e,
      [...t].map((n) => n.toString(16).padStart(2, "0")).join(""),
    );
  } catch {}
  return t;
}
function St(e) {
  const [t, n] = e.clientVersion ?? [122, 0],
    s = e.userFileList ?? ft,
    a = new _();
  return (
    a.writeB([0, 87, 69, 66]),
    a.writeB(e.mac ?? Rt()),
    a.zeros(21),
    a.writeH(e.width ?? 1280).writeH(e.height ?? 720),
    a.zeros(10),
    a.writeC(s.length).writeS(s, s.length),
    a.zeros(16),
    a.writeC(e.locale ?? 9),
    a.writeC(t).writeC(n),
    a.zeros(1),
    a.writeH(e.token.length).writeB(e.token),
    a
  );
}
function Ot(e) {
  e.readH();
  const t = e.readD();
  (e.skip(12), e.readD(), e.readH(), e.skip(16));
  let n = 0n,
    s = "";
  const a = e.readC();
  a > 0
    ? (e.readS(a), e.readC(), (s = e.readS(e.readC())), (n = e.readQ()))
    : e.skip(10);
  const o = e.readD();
  return {
    error: o,
    errorName: ne(o),
    ok: o === 0,
    playerId: n,
    username: s,
    verificationKey: t,
  };
}
function gt(e) {
  e.readH();
  const t = e.readC(),
    n = [];
  for (let s = 0; s < t; s++) {
    const a = e.readD() !== 0,
      o = e.readB(4);
    e.skip(4);
    const i = e.readH(),
      r = e.readC(),
      c = e.readH(),
      l = e.readSignedD(),
      h = [...e.readB(11)];
    (e.skip(4),
      n.push({
        index: s,
        online: a,
        ip: [...o].join("."),
        port: i,
        type: r,
        maxPlayers: c,
        players: l,
        channelTypes: h,
      }));
  }
  return n;
}
function Ae(e) {
  e.skip(15);
  const t = e.readC(),
    n = [];
  for (let a = 0; a < t; a++) n.push(e.readH());
  e.readH();
  const s = e.readH();
  return { channelPlayers: n, maxPerChannel: s };
}
class Is {
  conn;
  login = null;
  meta = null;
  channelListAt = 0;
  channelQueue = Promise.resolve();
  constructor(t = M()) {
    this.conn = new $("auth", t);
  }
  async connectAndLogin(t) {
    await this.conn.connect();
    const n = this.conn.waitFor(A.BASE_LOGIN_ACK, 1e4);
    return (
      this.conn.send(A.BASE_LOGIN_REQ, St(t)),
      (this.login = Ot(await n)),
      (this.channelListAt = Date.now() + J),
      this.login
    );
  }
  async fetchMeta(t = 5e3) {
    if (this.meta) return this.meta;
    const n = await ot(this.conn, t);
    try {
      const s = n.charaInfoRaw ? Ct(_e(new k(n.charaInfoRaw))) : [];
      s.length &&
        console.warn(
          "[auth] 2453: characters not saved, the Game will duplicate a slot",
          s,
        );
    } catch {}
    return (this.meta = n);
  }
  async getServers() {
    const t = this.conn.waitFor(A.BASE_GAME_SERVER_STATE_ACK);
    return (this.conn.send(A.BASE_GAME_SERVER_STATE_REQ), gt(await t));
  }
  getChannels(t, n = 3e3) {
    const s = this.channelQueue.then(() => this.requestChannels(t, n));
    return ((this.channelQueue = s.catch(() => null)), s);
  }
  async requestChannels(t, n) {
    for (let s = 0; s < 2 && this.conn.isOpen; s++) {
      const a = this.channelListAt - Date.now();
      a > 0 && (await new Promise((i) => setTimeout(i, a)));
      const o = this.conn.waitFor(A.BASE_GET_CHANNELLIST_ACK, n);
      this.conn.send(A.BASE_GET_CHANNELLIST_REQ, new _().writeD(t));
      try {
        const i = Ae(await o);
        return ((this.channelListAt = Date.now() + J), i);
      } catch {}
    }
    return null;
  }
  async leave() {
    if (!this.conn.isOpen) return;
    const t = this.conn.waitFor(A.BASE_USER_LEAVE_ACK, 3e3).catch(() => null);
    (this.conn.send(A.BASE_USER_LEAVE_REQ), await t, this.conn.close());
  }
}
function ys(e) {
  return `game${Math.max(e.index, 1)}`;
}
const It = 65536,
  yt = 2147488001,
  Dt = "ห้องนี้เปิดเฉพาะโมบาย PC ไม่สามารถเข้าได้",
  Nt = () =>
    m(
      Dt,
      "This room is for mobile players only. PC cannot join",
      "Room ini khusus pemain mobile. PC tidak bisa masuk",
    ),
  Lt = !1,
  Ce = (e) => (e & It) !== 0,
  Ds = (e) => (Ce(e) ? m("โมบาย", "Mobile", "Mobile") : "PC");
function Ns(e, t, n = !1) {
  return !Ce(e) || t === ke.mobile || Lt;
}
const Ls = new Set([
    1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 18, 20, 21, 22, 23, 26, 27, 28, 29, 32,
    33, 34, 35, 36, 37, 41, 42, 65, 67, 69, 105, 106, 107, 118, 119, 134, 136,
    123, 139,
  ]),
  Bs = new Set([
    131, 138, 135, 88, 91, 12, 13, 14, 15, 19, 24, 25, 43, 44, 45, 46, 47, 48,
    89, 109, 111, 112, 117,
  ]),
  ks = new Set([17, 51]),
  Ms = new Set([52]),
  Bt = [1, 2, 4, 5, 7, 9, 10, 23, 29, 67],
  kt = [1, 2, 4, 7, 9, 10, 20, 23, 42, 67],
  Mt = [
    {
      key: "deathmatch",
      rule: 0,
      stage: 1,
      roomType: 4,
      label: "เดธแมตช์ (ทีม)",
      group: "main",
      pool: "tdm",
    },
    {
      key: "modeSniper",
      rule: 0,
      stage: 96,
      roomType: 4,
      label: "เดธแมตช์ สไนเปอร์",
      group: "special",
      parent: "deathmatch",
      pool: "tdm",
    },
    {
      key: "modeShotgun",
      rule: 0,
      stage: 128,
      roomType: 4,
      label: "เดธแมตช์ ลูกซอง",
      group: "special",
      parent: "deathmatch",
      pool: "tdm",
    },
    {
      key: "modeKnife",
      rule: 0,
      stage: 224,
      roomType: 4,
      label: "เดธแมตช์ หมัด",
      group: "special",
      parent: "deathmatch",
      pool: "tdm",
    },
    {
      key: "modeHeadHunter",
      rule: 32,
      stage: 0,
      roomType: 4,
      label: "เฮดฮันเตอร์",
      group: "special",
      pool: "tdm",
      only: Bt,
    },
    {
      key: "modeChaos",
      rule: 80,
      stage: 0,
      roomType: 4,
      label: "เคออส",
      group: "special",
      pool: "tdm",
      only: kt,
    },
    {
      key: "modeBots",
      rule: 0,
      stage: 2,
      roomType: 4,
      label: "ฝึกกับบอท (AI)",
      group: "ai",
      pool: "tdm",
    },
    {
      key: "modeBomb",
      rule: 128,
      stage: 1,
      roomType: 8,
      label: "วางระเบิด",
      group: "main",
      pool: "bomb",
    },
    {
      key: "modeBombSniper",
      rule: 128,
      stage: 96,
      roomType: 8,
      label: "วางระเบิด สไนเปอร์",
      group: "special",
      parent: "modeBomb",
      pool: "bomb",
    },
    {
      key: "modeBombShotgun",
      rule: 128,
      stage: 128,
      roomType: 8,
      label: "วางระเบิด ลูกซอง",
      group: "special",
      parent: "modeBomb",
      pool: "bomb",
    },
    {
      key: "modeBombKnife",
      rule: 128,
      stage: 224,
      roomType: 8,
      label: "วางระเบิด หมัด",
      group: "special",
      parent: "modeBomb",
      pool: "bomb",
    },
    {
      key: "modeDestroy",
      rule: 128,
      stage: 1,
      roomType: 12,
      label: "ทำลายเป้าหมาย",
      group: "main",
      pool: "destroy",
    },
    {
      key: "modeDestroySniper",
      rule: 128,
      stage: 96,
      roomType: 12,
      label: "ทำลายเป้าหมาย สไนเปอร์",
      group: "special",
      parent: "modeDestroy",
      pool: "destroy",
    },
    {
      key: "modeDestroyShotgun",
      rule: 128,
      stage: 128,
      roomType: 12,
      label: "ทำลายเป้าหมาย ลูกซอง",
      group: "special",
      parent: "modeDestroy",
      pool: "destroy",
    },
    {
      key: "modeDestroyKnife",
      rule: 128,
      stage: 224,
      roomType: 12,
      label: "ทำลายเป้าหมาย หมัด",
      group: "special",
      parent: "modeDestroy",
      pool: "destroy",
    },
    {
      key: "modeDefence",
      rule: 128,
      stage: 1,
      roomType: 20,
      label: "ป้องกันฐาน",
      group: "main",
      pool: "defence",
    },
  ];
function bs(e) {
  const t = e?.modes;
  if (!t || typeof t != "object") return null;
  const n = { modes: {} };
  for (const s of Mt) {
    const a = t[s.key];
    a &&
      typeof a.enabled == "boolean" &&
      Array.isArray(a.maps) &&
      a.maps.every((o) => Number.isInteger(o)) &&
      (n.modes[s.key] = { enabled: a.enabled, maps: a.maps });
  }
  return n;
}
const bt = 2147488002,
  Ht = "โหมดหรือแมปนี้ปิดอยู่ตอนนี้ — เลือกแมปอื่นจากรายการ",
  Gt = () =>
    m(
      Ht,
      "This mode or map is closed right now — pick another map from the list",
      "Mode atau map ini sedang ditutup — pilih map lain dari daftar",
    );
class O extends Error {
  code;
  constructor(t, n) {
    (super(
      n === yt ? Nt() : n === bt ? Gt() : n === Y ? Z() : `${t}: ${ne(n)}`,
    ),
      (this.code = n));
  }
}
function Kt(e) {
  const t = e.readD(),
    n = e.readD(),
    s = e.readD(),
    a = [];
  for (let l = 0; l < s; l++)
    (a.push({
      roomId: e.readSignedD(),
      name: e.readU(46),
      mapId: e.readC(),
      rule: e.readC(),
      stage: e.readC(),
      roomType: e.readC(),
      state: e.readC(),
      players: e.readC(),
      slots: e.readC(),
      ping: e.readC(),
      weaponsFlag: e.readH(),
      flag: e.readD(),
      leaderAddr: (e.readH(), [...e.readB(4)].join(".")),
    }),
      e.readC());
  const o = e.readD(),
    i = e.readD(),
    r = e.readD(),
    c = [];
  for (let l = 0; l < r; l++) {
    const h = e.readD(),
      u = e.readD();
    e.readC();
    const E = e.readU(34),
      T = e.readC();
    e.readC();
    const f = e.readC(),
      D = e.readU(66),
      p = e.readC();
    e.readC();
    const I = e.readD(),
      N = e.readC();
    (e.readC(),
      c.push({
        sessionId: h,
        clanLogo: u,
        clanName: E,
        rank: T,
        nickColor: f,
        nickname: D,
        nation: p,
        nameCard: I,
        nickBorderColor: N,
      }));
  }
  return {
    totalRooms: t,
    roomPage: n,
    rooms: a,
    totalPlayers: o,
    playerPage: i,
    players: c,
  };
}
class Hs {
  conn;
  serverId = 0;
  channelId = -1;
  enterPushes = null;
  constructor(t, n = M()) {
    this.conn = new $(t, n);
  }
  async enter(t, n, s) {
    ((this.serverId = s), await this.conn.connect());
    const a = V.get(n);
    a && this.conn.sendText({ t: "enter", ticket: a });
    const o = Tt(this.conn),
      i = this.conn.waitFor(A.BASE_USER_ENTER_ACK, 1e4),
      r = new _().writeC(t.length).writeS(t, t.length).writeQ(n);
    this.conn.send(A.BASE_USER_ENTER_REQ, r);
    let c;
    try {
      c = (await i).readD();
    } catch (h) {
      throw (o.stop(), h);
    }
    if (c !== 0) throw (o.stop(), new O("USER_ENTER", c));
    const l = await o.done;
    return (
      (!l.loadout || !l.charaInfo) &&
        console.warn(
          "[game] USER_ENTER: 2453/3082 not received; 6149 will keep both character slots (255)",
        ),
      G() && this.conn.send(Me, new _(1).writeC(G())),
      (this.enterPushes = l)
    );
  }
  async getChannels(t = 3e3) {
    const n = this.conn.waitFor(A.BASE_GET_CHANNELLIST_ACK, t);
    this.conn.send(A.BASE_GET_CHANNELLIST_REQ, new _().writeD(this.serverId));
    try {
      return Ae(await n);
    } catch {
      return null;
    }
  }
  async selectChannel(t) {
    const n = this.conn.waitFor(A.BASE_SELECT_CHANNEL_ACK);
    this.conn.send(
      A.BASE_SELECT_CHANNEL_REQ,
      new _().writeD(this.serverId).writeH(t),
    );
    const s = await n;
    s.readH();
    const a = s.readD();
    if (a !== 0) throw new O("SELECT_CHANNEL", a);
    (s.readD(), (this.channelId = s.readH()));
  }
  async enterLobby() {
    const t = this.conn.waitFor(A.LOBBY_ENTER_ACK);
    this.conn.send(A.LOBBY_ENTER_REQ);
    const n = (await t).readD();
    if (n !== 0) throw new O("LOBBY_ENTER", n);
  }
  async getRoomList(t = 2500) {
    const n = this.conn.waitFor(A.LOBBY_GET_ROOMLIST_ACK, t);
    this.conn.send(A.LOBBY_GET_ROOMLIST_REQ);
    try {
      return Kt(await n);
    } catch {
      return null;
    }
  }
  async getRoomInfoAdd(t, n = 2500) {
    const s = this.conn.waitFor(A.LOBBY_GET_ROOMINFOADD_ACK, n);
    this.conn.send(A.LOBBY_GET_ROOMINFOADD_REQ, new _().writeD(t));
    try {
      const a = await s;
      return (
        a.readC(),
        {
          roomId: t,
          leaderName: a.readU(66),
          killTime: a.readC(),
          round: a.readC(),
          battleTime: a.readH(),
          limit: a.readC(),
          watchRuleFlag: a.readC(),
          balanceType: a.readH(),
        }
      );
    } catch {
      return null;
    }
  }
  close() {
    this.conn.close();
  }
}
const Pt = 21314,
  Ut = 21328,
  vt = 9040;
function Qt(e) {
  if (e.remaining < 9) return null;
  const t = e.readD(),
    n = [e.readH(), e.readH()],
    s = e.readC();
  if (s > 18 || e.remaining < s * 7) return null;
  const a = [];
  for (let o = 0; o < s; o++)
    a.push({
      slot: e.readC(),
      kills: e.readH(),
      deaths: e.readH(),
      headshots: e.readH(),
    });
  return { timeLeft: t, score: n, rows: a };
}
const Ft = 19538,
  v = () => ({ votes: 0, required: 1, candidate: -1, voters: 0 }),
  Yt = { ready: 2147492353 },
  Vt =
    "ให้ผู้เล่นที่กดพร้อมร่วมกันร้องขอ ใช้เสียงเกินครึ่งของผู้เล่นคนอื่นในห้อง (ไม่นับหัวห้องและผู้สังเกตการณ์) เมื่อสำเร็จ ผู้ร้องขอที่ยังพร้อมและเข้าห้องมาก่อนจะได้เป็นหัวห้อง เปลี่ยนทีมไม่ทำให้เสียลำดับ",
  Gs = () =>
    m(
      Vt,
      "Ready players request it together. It needs more than half of the other players in the room (not the host or observers). When it passes, the earliest requester who is still ready becomes host. Changing team keeps your place.",
      "Pemain yang sudah siap memintanya bersama. Butuh lebih dari separuh pemain lain di room (tidak termasuk host dan penonton). Jika berhasil, peminta paling awal yang masih siap menjadi host. Ganti tim tidak menghilangkan urutan.",
    );
function b(e) {
  if (e.remaining < 9 || e.readH() !== Ft) return v();
  const t = e.readC(),
    n = e.readC(),
    s = e.readC(),
    a = e.readD();
  return { votes: t, required: n, candidate: s === 255 ? -1 : s, voters: a };
}
const $t = 9005,
  qt = 300,
  Wt = 5e3,
  d = {
    ROOM_JOIN_REQ: 3585,
    ROOM_JOIN_ACK: 3586,
    ROOM_GET_SLOTONEINFO_ACK: 3588,
    ROOM_CREATE_REQ: 3592,
    ROOM_CREATE_ACK: 3593,
    ROOM_GET_SLOTINFO_ACK: 3595,
    ROOM_GET_PLAYERINFO_REQ: 3596,
    ROOM_GET_PLAYERINFO_ACK: 3597,
    ROOM_GET_NICKNAME_ACK: 3599,
    ROOM_GET_COLOR_NICK_ACK: 3629,
    ROOM_GET_COLOR_MUZZLE_FLASH_ACK: 3671,
    ROOM_GET_NICK_OUTLINE_COLOR_ACK: 3639,
    ROOM_CHANGE_ROOMINFO_ACK: 3601,
    ROOM_CHANGE_ROOM_OPTIONINFO_ACK: 3637,
    ROOM_CHANGE_ROOMINFO_REQ: 3640,
    ROOM_PERSONAL_TEAM_CHANGE_REQ: 3609,
    ROOM_CHANGE_SLOT_REQ: 3604,
    ROOM_REQUEST_MAIN_REQ: 3611,
    ROOM_REQUEST_MAIN_ACK: 3612,
    ROOM_REQUEST_MAIN_CHANGE_WHO_REQ: 3615,
    ROOM_REQUEST_MAIN_CHANGE_WHO_ACK: 3616,
    ROOM_TEAM_BALANCE_ACK: 3622,
    ROOM_LOADING_START_REQ: 3657,
    ROOM_LOADING_START_ACK: 3659,
    BATTLE_READYBATTLE_REQ: 5123,
    BATTLE_READYBATTLE_ACK: 5124,
    BATTLE_START_COUNTDOWN_ACK: 5126,
    BATTLE_START_GAME_ACK: 5127,
    BATTLE_PRESTARTBATTLE_REQ: 5129,
    BATTLE_PRESTARTBATTLE_ACK: 5130,
    BATTLE_STARTBATTLE_REQ: 5131,
    BATTLE_STARTBATTLE_ACK: 5132,
    BATTLE_GIVEUPBATTLE_REQ: 5133,
    BATTLE_GIVEUPBATTLE_ACK: 5134,
    BATTLE_DEATH_REQ: 5135,
    BATTLE_DEATH_ACK: 5136,
    BATTLE_RESPAWN_REQ: 5137,
    BATTLE_RESPAWN_ACK: 5138,
    BATTLE_ENDBATTLE_ACK: 5140,
    BATTLE_ROUND_PRE_START_ACK: 5151,
    BATTLE_ROUND_START_ACK: 5153,
    BATTLE_ROUND_END_ACK: 5155,
    BATTLE_MISSION_BOMB_INSTALL_REQ: 5156,
    BATTLE_MISSION_BOMB_INSTALL_ACK: 5157,
    BATTLE_MISSION_BOMB_UNINSTALL_REQ: 5158,
    BATTLE_MISSION_BOMB_UNINSTALL_ACK: 5159,
    BATTLE_MISSION_GENERATOR_INFO_REQ: 5166,
    BATTLE_MISSION_GENERATOR_INFO_ACK: 5167,
    BATTLE_TIMERSYNC_REQ: 5168,
    SERVER_MESSAGE_KICK_PLAYER_ACK: 3075,
    SERVER_MESSAGE_KICK_BATTLE_PLAYER_ACK: 3076,
    LOBBY_ENTER_REQ: 2583,
    LOBBY_ENTER_ACK: 2584,
  },
  Q = { READY: 1 },
  Ks = [
    "UNK",
    "READY",
    "COUNTDOWN",
    "LOADING",
    "RENDEZVOUS",
    "PRE_BATTLE",
    "BATTLE_READY",
    "BATTLE",
    "BATTLE_END",
    "EMPTY",
  ];
function Ps(e) {
  return e === 0
    ? "EMPTY"
    : e === 1
      ? "CLOSE"
      : ({
          3: "SHOP",
          4: "INFO",
          5: "CLAN",
          6: "INVENTORY",
          7: "GACHA",
          8: "GIFTSHOP",
          12: "NORMAL",
          13: "READY",
          14: "LOAD",
          15: "RENDEZVOUS",
          16: "PRESTART",
          17: "BATTLE_LOAD",
          18: "BATTLE_READY",
          19: "BATTLE",
        }[e] ?? `S${e}`);
}
const jt = 13,
  Us = 14,
  F = { mapId: 36, rule: 0, stage: 1, roomType: 4, mapName: "Metro" },
  xt = { mapName: "M. Station" };
function zt(e, t, n) {
  const s = e.opts,
    a = new _(260);
  a.writeD(e.roomId)
    .writeU(t.name ?? e.name, 46)
    .writeC(t.mapId ?? e.mapId)
    .writeC(t.rule ?? e.rule)
    .writeC(t.stage ?? e.stage)
    .writeC(t.roomType ?? e.roomType)
    .writeC(Math.max(Q.READY, e.state))
    .writeC(e.players)
    .writeC(t.slots ?? e.slotCount)
    .writeC(s?.ping ?? 0)
    .writeH(t.weaponsFlag ?? e.weaponsFlag)
    .writeD(t.flag ?? s?.flag ?? 0)
    .writeH(0)
    .writeD(s?.newInt ?? 0)
    .writeH(0)
    .writeU(e.leaderName, 66)
    .writeD(t.killTime ?? e.killTime)
    .writeC(t.limit ?? s?.limit ?? 0)
    .writeC(t.watchRuleFlag ?? s?.watchRuleFlag ?? 0)
    .writeH(t.balanceType ?? s?.balanceType ?? 0)
    .writeB(t.randomMaps ?? s?.randomMaps ?? new Uint8Array(24))
    .writeC(s?.countdown ?? 5)
    .writeB(s?.leaderAddr ?? new Uint8Array(4))
    .writeC(s?.killCam ?? 0)
    .writeH(0);
  const o = t.ai ?? n;
  return (
    a.writeC(o?.count ?? 0).writeC(o?.level ?? 0),
    t.password !== void 0 && a.writeC(1).writeS(t.password, 4),
    a
  );
}
function Jt(e, t) {
  (e.readH(), e.readD(), e.skip(8));
  const n = () => {
      const h = Array.from({ length: 12 }, () => e.readD());
      return {
        matches: h[0],
        wins: h[1],
        loses: h[2],
        draws: h[3],
        kills: h[4],
        headshots: h[5],
        deaths: h[6],
        totalKills: h[8],
        escapes: h[9],
        assists: h[10],
        mvp: h[11],
      };
    },
    s = n(),
    a = n();
  (e.readC(), e.skip(24));
  const o = Array.from({ length: 18 }, () => {
    const h = e.readD();
    return (e.readD(), h);
  });
  (e.readC(), e.skip(3));
  const i = e.readU(66);
  e.readD();
  const r = e.readD();
  e.skip(67);
  const c = e.readC();
  e.readC();
  const l = e.readU(34);
  return {
    slot: t,
    nick: i,
    rank: r,
    equip: o,
    season: s,
    total: a,
    cafe: c,
    clan: l,
  };
}
function Xt(e) {
  (e.skip(e.readC()), e.skip(43));
  const t = e.readD();
  (e.readD(), e.skip(10));
  const n = e.readU(e.readC()),
    s = e.readC(),
    a = e.readC(),
    o = e.readD(),
    i = e.readC(),
    r = e.readC();
  return { id: t, name: n, rank: s, unit: a, logo: o, nameColor: i, effect: r };
}
function H(e) {
  const t = e.pos,
    n = e.readSignedD(),
    s = e.readU(46),
    a = e.readC(),
    o = e.readC(),
    i = e.readC(),
    r = e.readC(),
    c = e.readC(),
    l = e.readC(),
    h = e.readC(),
    u = e.readC(),
    E = e.readH(),
    T = e.readD();
  e.readH();
  const f = e.readD();
  e.readH();
  const D = e.readU(66),
    p = e.readD();
  let I;
  if (e.remaining >= 34) {
    const N = e.readC(),
      me = e.readC(),
      Te = e.readH(),
      we = e.readB(24),
      pe = e.readC(),
      fe = e.readB(4),
      Re = e.readC();
    I = {
      ping: u,
      flag: T,
      newInt: f,
      limit: N,
      watchRuleFlag: me,
      balanceType: Te,
      randomMaps: we,
      countdown: pe,
      leaderAddr: fe,
      killCam: Re,
    };
  }
  return (
    (e.pos = Math.min(e.data.length, t + 246)),
    {
      roomId: n,
      name: s,
      mapId: a,
      rule: o,
      stage: i,
      roomType: r,
      state: c,
      players: l,
      slotCount: h,
      weaponsFlag: E,
      leaderName: D,
      killTime: p,
      opts: I,
    }
  );
}
function X(e, t) {
  const n = e.pos,
    s = e.readC(),
    a = e.readC();
  e.pos = n + 34;
  const o = e.readC();
  e.pos = n + 11;
  const i = e.readD();
  e.pos = n + 15;
  const r = e.readC();
  e.pos = n + 36;
  const c = e.readU(34),
    l = e.readC(),
    h = e.readU(66),
    u = e.readC();
  e.pos = n + 29;
  const E = e.readD(),
    T = e.readC();
  e.pos = n + 138;
  const f = e.readC();
  return (
    (e.pos = Math.min(e.data.length, n + 142)),
    {
      slot: l,
      state: s,
      team: t,
      nick: h,
      rank: a,
      auth: o,
      cafe: r,
      clan: c,
      nickColor: u,
      clanLogo: i,
      nickBorderColor: T,
      muzzleColor: f,
      nameCard: E,
    }
  );
}
class vs {
  game;
  room = null;
  mySlot = -1;
  isGM = !1;
  gmObserverMode = !1;
  hiddenGm = !1;
  get gmObserver() {
    return (
      this.gmObserverMode || (this.isGM && (this.mySlot >= 16 || this.hiddenGm))
    );
  }
  sitsOutRound(t) {
    return this.gmObserver || !((t >>> this.mySlot) & 1);
  }
  leaderSlot = -1;
  leaderRequest = v();
  onLeadershipNotice = null;
  respawnAcks = new Map();
  battleRespawns = new Set();
  equipAcks = new Map();
  ai = null;
  testBots = [];
  devices = Array(18).fill(0);
  deviceOf(t) {
    return this.devices[t] || (t === this.mySlot ? G() : 0);
  }
  slots = Array.from({ length: 18 }, (t, n) => ({
    slot: n,
    state: 0,
    team: n % 2,
    nick: "",
    rank: 0,
  }));
  endpoint = null;
  mySpawns = 0;
  onChange = null;
  onRulesChanged = null;
  onStartGame = null;
  onCountdown = null;
  onBattleStart = null;
  onRespawn = null;
  onRespawnAck = null;
  onDeath = null;
  onEndBattle = null;
  onRoundStart = null;
  onRoundEnd = null;
  onBomb = null;
  onGenerator = null;
  onScoreSync = null;
  round = 1;
  roundDeadline = 0;
  lastRoundStart = null;
  onKicked = null;
  onRoomKicked = null;
  off;
  disposed = !1;
  battleStartAckSeen = !1;
  handlers = new Map();
  lastRoundEnd = null;
  constructor(t) {
    this.game = t;
    const n = (s, a) => this.handlers.set(s, a);
    (n(d.ROOM_CHANGE_ROOMINFO_ACK, (s) => {
      const a = this.room;
      this.room = H(s);
      const o = a,
        i = this.room;
      (o &&
        i &&
        !this.isLeader &&
        (o.name !== i.name ||
          o.mapId !== i.mapId ||
          o.rule !== i.rule ||
          o.stage !== i.stage ||
          o.roomType !== i.roomType ||
          o.weaponsFlag !== i.weaponsFlag ||
          o.slotCount !== i.slotCount ||
          o.killTime !== i.killTime) &&
        this.onRulesChanged?.(),
        this.isBotRoom &&
          s.remaining >= 2 &&
          (this.ai = {
            count: s.readC(),
            level: s.readC(),
            allies: this.ai?.allies,
          }),
        this.changed());
    }),
      n(d.ROOM_GET_SLOTINFO_ACK, (s) => this.parseSlotInfo(s)),
      n(d.ROOM_REQUEST_MAIN_ACK, (s) => {
        const a = s.readD();
        if (a & 2147483648) {
          this.onLeadershipNotice?.(
            a === Yt.ready
              ? m(
                  "กรุณากดพร้อมก่อนร้องขอเปลี่ยนหัวห้อง",
                  "Press Ready before requesting a host change",
                  "Tekan Siap sebelum meminta ganti host",
                )
              : m(
                  "ร้องขอเปลี่ยนหัวห้องไม่ได้ในขณะนี้",
                  "A host change cannot be requested now",
                  "Ganti host belum bisa diminta sekarang",
                ),
            !0,
          );
          return;
        }
        this.leaderRequest = b(s);
        const o = this.leaderRequest,
          i =
            this.slots[o.candidate]?.nick ||
            m(
              "ผู้ร้องขอที่เข้าห้องก่อน",
              "the earliest requester",
              "peminta paling awal",
            );
        (this.onLeadershipNotice?.(
          m(
            `ร้องขอเปลี่ยนหัวห้อง ${o.votes}/${o.required} เสียง · เมื่อสำเร็จ หัวห้องใหม่: ${i}`,
            `Host change request ${o.votes}/${o.required} votes · new host if it passes: ${i}`,
            `Permintaan ganti host ${o.votes}/${o.required} suara · host baru jika berhasil: ${i}`,
          ),
        ),
          this.changed());
      }),
      n(d.ROOM_REQUEST_MAIN_CHANGE_WHO_ACK, (s) => {
        const a = s.readD();
        if (a & 2147483648 || a >= 18) return;
        const o =
          this.slots[a]?.nick ||
          m(
            `ผู้เล่นช่อง ${a + 1}`,
            `player in slot ${a + 1}`,
            `pemain slot ${a + 1}`,
          );
        ((this.leaderSlot = a),
          (this.leaderRequest = v()),
          this.room && (this.room.leaderName = o),
          this.onLeadershipNotice?.(
            m(
              `เปลี่ยนหัวห้องแล้ว · ${o} เป็นหัวห้องใหม่`,
              `Host changed · ${o} is the new host`,
              `Host berganti · ${o} jadi host baru`,
            ),
          ),
          this.changed());
      }),
      n(d.ROOM_GET_SLOTONEINFO_ACK, (s) => {
        s.readH();
        const a = s.readC(),
          o = X(s, a);
        ((this.slots[o.slot] = o), this.changed());
      }),
      n(d.ROOM_GET_NICKNAME_ACK, (s) => {
        const a = s.readD(),
          o = s.readU(66),
          i = s.readC();
        this.slots[a] &&
          ((this.slots[a] = { ...this.slots[a], nick: o, nickColor: i }),
          this.changed());
      }),
      n(d.ROOM_GET_COLOR_NICK_ACK, (s) => {
        const a = s.readD(),
          o = s.readC();
        this.slots[a] &&
          ((this.slots[a] = { ...this.slots[a], nickColor: o }),
          this.changed());
      }),
      n(d.ROOM_GET_COLOR_MUZZLE_FLASH_ACK, (s) => {
        const a = s.readD(),
          o = s.readH();
        this.slots[a] &&
          ((this.slots[a] = { ...this.slots[a], muzzleColor: o }),
          this.changed());
      }),
      n(d.ROOM_GET_NICK_OUTLINE_COLOR_ACK, (s) => {
        const a = s.readD(),
          o = s.readC();
        this.slots[a] &&
          ((this.slots[a] = { ...this.slots[a], nickBorderColor: o }),
          this.changed());
      }),
      n(d.ROOM_TEAM_BALANCE_ACK, (s) => {
        (s.readC(), (this.leaderSlot = s.readC()));
        const a = s.readC();
        for (let o = 0; o < a; o++) {
          const i = s.readC(),
            r = s.readC();
          s.skip(2);
          const c = this.slots[i];
          ((this.slots[r] = { ...c, slot: r, team: r % 2 }),
            (this.slots[i] = {
              slot: i,
              state: 0,
              team: i % 2,
              nick: "",
              rank: 0,
            }),
            i === this.mySlot && (this.mySlot = r));
        }
        this.changed();
      }),
      n(d.BATTLE_START_COUNTDOWN_ACK, (s) =>
        this.onCountdown?.((s.readC() << 24) >> 24),
      ),
      n(d.BATTLE_START_GAME_ACK, () => {
        (this.battleRespawns.clear(), this.onStartGame?.());
      }),
      n(3667, (s) => {
        if ((s.readH(), s.readD() !== 0)) return;
        s.skip(13);
        const a = s.readD(),
          o = Array.from({ length: 9 }, () => s.readD());
        s.skip(1);
        const i = Array.from({ length: 8 }, () => s.readD());
        s.skip(9);
        const r = s.readC(),
          c = {
            slot: r,
            roomSpawns: 0,
            slotSpawns: 0,
            weapons: {
              primary: i[0],
              secondary: i[1],
              melee: i[2],
              grenade: i[3],
              special: i[4],
            },
            chara: a,
            parts: o.slice(0, 8),
            beret: o[8],
            accessory: null,
          };
        (this.equipAcks.set(r, c),
          console.info(
            `[room] USER_EQUIPMENT slot ${r}: chara ${a}, head ${o[0]}, face ${o[1]}, beret ${o[8]}${this.onRespawnAck ? "" : " (held until the battle screens chain)"}`,
          ),
          this.onRespawnAck?.(c));
      }),
      n(5149, (s) => {
        const a = s.readD();
        a >= 0 && a < 18 && ((this.leaderSlot = a), this.changed());
      }),
      n(d.BATTLE_STARTBATTLE_ACK, () => {
        ((this.battleStartAckSeen = !0), this.finishBattleStart());
      }),
      n(d.BATTLE_RESPAWN_ACK, (s) => {
        const a = s.pos,
          o = s.readD();
        s.readD();
        const i = s.readD();
        (o === this.mySlot && (this.mySpawns = i),
          this.onRespawn?.(o, i),
          (s.pos = a));
        let r = null;
        try {
          r = ut(s);
        } catch {}
        (r &&
          (this.respawnAcks.set(r.slot, r), this.battleRespawns.add(r.slot)),
          r && this.onRespawnAck?.(r));
      }),
      n(d.BATTLE_DEATH_ACK, (s) => {
        s.readC();
        const a = s.readC(),
          o = s.readC(),
          i = s.readD();
        s.skip(14);
        const r = [];
        for (let h = 0; h < a; h++) {
          const u = s.readC();
          s.readC();
          const E = s.readC();
          (s.skip(20), r.push({ slot: u, headshot: E >> 4 === 3 }));
        }
        const c = s.readH();
        s.skip(4);
        const l = s.readH();
        this.onDeath?.({
          killerSlot: o,
          weaponId: i,
          victims: r,
          frKills: c,
          ctKills: l,
        });
      }),
      n(d.BATTLE_ROUND_END_ACK, (s) => {
        const a = s.readC(),
          o = s.readC(),
          i = s.remaining >= 2 ? s.readH() : void 0,
          r = s.remaining >= 2 ? s.readH() : void 0;
        ((this.lastRoundEnd = { frKills: i, ctKills: r }),
          this.onRoundEnd?.({ winner: a, motive: o, fr: i ?? 0, ct: r ?? 0 }));
      }),
      n(d.BATTLE_ROUND_START_ACK, (s) => {
        const a = s.readC(),
          o = s.readD(),
          i = s.readD(),
          r = s.readC() !== 0,
          c = s.readH(),
          l = s.readH();
        ((this.round = a),
          (this.roundDeadline = Date.now() + o * 1e3),
          (this.lastRoundStart = {
            round: a,
            timeLeft: o,
            swap: r,
            frRounds: c,
            ctRounds: l,
            slotsFlag: i,
          }),
          this.onRoundStart?.(this.lastRoundStart));
      }),
      n(vt, (s) => {
        const a = Qt(s);
        a &&
          ((this.roundDeadline = Date.now() + a.timeLeft * 1e3),
          this.onScoreSync?.(a));
      }),
      n(d.BATTLE_MISSION_BOMB_INSTALL_ACK, (s) => {
        const a = s.readD(),
          o = s.readC(),
          i = s.readH();
        this.onBomb?.({
          kind: "planted",
          slot: a,
          zone: o,
          pos: [s.readT(), s.readT(), s.readT()],
          fuse: i & 32768 ? (i & 32767) / 10 : void 0,
        });
      }),
      n(d.BATTLE_MISSION_BOMB_UNINSTALL_ACK, (s) =>
        this.onBomb?.({
          kind: "defused",
          slot: s.readD(),
          zone: 0,
          pos: [0, 0, 0],
        }),
      ),
      n(d.BATTLE_MISSION_GENERATOR_INFO_ACK, (s) => {
        const a = s.readH(),
          o = s.readH(),
          i = Array.from({ length: 18 }, () => s.readH());
        this.onGenerator?.({ bar1: a, bar2: o, damage: i });
      }),
      n(d.BATTLE_ENDBATTLE_ACK, (s) => {
        ((this.battleStartAckSeen = !1), (this.roundDeadline = 0), s.readD());
        const a = s.readC(),
          o = {};
        try {
          const i = s.readB(378),
            r = new DataView(i.buffer, i.byteOffset, i.byteLength);
          ((o.exp = Array.from({ length: 18 }, (h, u) =>
            r.getUint16(u * 2, !0),
          )),
            (o.gold = Array.from({ length: 18 }, (h, u) =>
              r.getUint16(36 + u * 2, !0),
            )),
            s.readD());
          const c = this.room?.roomType ?? 4,
            l = c === 11 ? 11 : Math.trunc(c / 4);
          ([2, 3, 4, 5, 7, 8, 12, 13, 15, 16, 17, 18, 19].includes(l) &&
            ((o.frRounds = s.readH()), (o.ctRounds = s.readH()), s.skip(40)),
            [0, 7, 9, 10, 12].includes(l) || s.skip(36),
            s.skip(264),
            (o.clan = Xt(s)));
        } catch {}
        (this.onEndBattle?.({ winner: a, ...(this.lastRoundEnd ?? {}), ...o }),
          (this.lastRoundEnd = null),
          (this.endpoint = null),
          this.respawnAcks.clear(),
          this.battleRespawns.clear(),
          this.equipAcks.clear());
      }),
      n(d.SERVER_MESSAGE_KICK_PLAYER_ACK, () => this.onRoomKicked?.()),
      n(d.SERVER_MESSAGE_KICK_BATTLE_PLAYER_ACK, (s) =>
        this.onKicked?.(`kick 0x${s.readD().toString(16)}`),
      ),
      (this.off = t.conn.on((s, a) => {
        const o = this.handlers.get(s);
        if (o)
          try {
            o(a);
          } catch (i) {
            console.warn(`[room] parse ${s}`, i);
          }
      })));
  }
  requestEquip(t) {
    t !== this.mySlot &&
      t >= 0 &&
      t < 18 &&
      this.game.conn.send(3666, new _().writeC(t));
  }
  replayEquip(t = !1) {
    for (const n of this.equipAcks.values()) this.onRespawnAck?.(n);
    if (t)
      for (const n of [...this.respawnAcks.values()])
        this.battleRespawns.has(n.slot) && this.onRespawnAck?.(n);
    for (const n of this.slots)
      n.slot !== this.mySlot &&
        n.nick &&
        n.state >= 14 &&
        this.game.conn.send(3666, new _().writeC(n.slot));
  }
  dispose() {
    ((this.disposed = !0), this.off());
  }
  get isLeader() {
    return this.mySlot >= 0 && this.mySlot === this.leaderSlot;
  }
  get isBotRoom() {
    const t = this.room?.stage ?? 0;
    return this.testBots.length > 0 || t === 2 || t === 4 || t === 6;
  }
  get hasPlayersOnBotTeam() {
    return (
      !this.testBots.length &&
      this.isBotRoom &&
      this.slots.some((t) => t.slot < 16 && t.slot % 2 === 1 && t.state > 1)
    );
  }
  changed() {
    for (const t of this.testBots)
      ((this.slots[t.slot] = {
        slot: t.slot,
        team: t.slot % 2,
        nick: t.nick,
        rank: t.rank,
        state: 13,
        bot: !0,
      }),
        this.equipAcks.set(t.slot, {
          slot: t.slot,
          roomSpawns: 0,
          slotSpawns: 0,
          chara: t.chara,
          weapons: {
            primary: t.weapon,
            secondary: 0,
            melee: 0,
            grenade: 0,
            special: 0,
          },
          parts: Array(8).fill(0),
          beret: 0,
          accessory: 0,
        }));
    ((this.slots[this.mySlot]?.auth ?? 0) > 0 && (this.isGM = !0),
      this.onChange?.());
  }
  parseSlotInfo(t) {
    this.leaderSlot = t.readC();
    const n = [];
    for (let s = 0; s < 18; s++) {
      const a = t.pos;
      t.readH();
      const o = t.readC(),
        i = t.readC();
      t.pos = a + 2 + 11;
      const r = t.readD();
      t.pos = a + 2 + 15;
      const c = t.readC();
      t.pos = a + 2 + 36;
      const l = t.readC(),
        h = t.readU(l);
      ((t.pos = a + 2 + 37 + l),
        n.push({ state: o, rank: i, cafe: c, clan: h, clanLogo: r }));
    }
    for (let s = 0; s < 18; s++) {
      const a = this.slots[s],
        o = t.remaining > 0 ? t.readC() : a.team,
        { state: i, rank: r, cafe: c, clan: l, clanLogo: h } = n[s];
      this.slots[s] = {
        ...a,
        bot: !1,
        slot: s,
        state: i,
        rank: r,
        team: o,
        cafe: c,
        clan: l,
        clanLogo: h,
        nick: i === 0 || i === 1 ? "" : a.nick,
      };
    }
    for (const s of this.testBots) this.equipAcks.delete(s.slot);
    ((this.testBots = q(t)),
      (this.devices = W(t)),
      (this.leaderRequest = b(t)),
      this.changed(),
      this.finishBattleStart());
  }
  finishBattleStart() {
    !this.battleStartAckSeen ||
      (this.slots[this.mySlot]?.state ?? 0) < 19 ||
      ((this.battleStartAckSeen = !1), this.onBattleStart?.());
  }
  async request(t, n, s, a = 5e3) {
    const o = this.game.conn.waitFor(s, a);
    return (this.game.conn.send(t, n), o);
  }
  async create(t) {
    const n = { ...F, ...t },
      s = new _(256);
    (s
      .writeD(0)
      .writeU(t.name, 46)
      .writeC(n.mapId)
      .writeC(n.rule)
      .writeC(n.stage)
      .writeC(n.roomType)
      .writeC(Q.READY)
      .writeC(0)
      .writeC(t.slots ?? 16)
      .writeC(0)
      .writeH(t.weaponsFlag ?? 511)
      .writeD(t.flag ?? 0)
      .writeH(0)
      .writeD(0)
      .writeH(0)
      .writeU("", 66)
      .writeD(t.killTime ?? 99)
      .writeC(t.limit ?? 0)
      .writeC(t.watchRule ?? 0)
      .writeH(0)
      .writeB(t.randomMaps ?? new Uint8Array(24))
      .writeC(t.cdFlag ?? 1)
      .zeros(4)
      .writeC(0)
      .writeH(0)
      .writeS(t.password ?? "", 4)
      .zeros(68)
      .writeC(t.ai?.count ?? 0)
      .writeC(t.ai?.level ?? 0)
      .writeC(t.ai?.type ?? 0),
      (this.ai = t.ai
        ? { count: t.ai.count, level: t.ai.level, allies: t.ai.allies }
        : null));
    let a = null;
    for (let i = 0; i < 3 && !a; i++)
      ((a = await this.request(
        d.ROOM_CREATE_REQ,
        s,
        d.ROOM_CREATE_ACK,
        2e3,
      ).catch(() => null)),
        !a && i < 2 && (await new Promise((r) => setTimeout(r, 2500))));
    if (!a)
      throw new Error(
        m(
          "สร้างห้องไม่สำเร็จ: ห้องในช่องนี้เต็มแล้ว หรือกดสร้างถี่เกินไป รอสักครู่แล้วลองใหม่ หรือเข้าห้องที่มีอยู่",
          "Could not create the room: this channel has no free room, or you created one too quickly. Wait a moment and try again, or join a room",
          "Gagal membuat room: room di channel ini penuh, atau terlalu cepat membuat room. Tunggu sebentar lalu coba lagi, atau masuk room yang ada",
        ),
      );
    const o = a.readD();
    if (a.remaining < 246) throw new O("CREATE_ROOM", o);
    return (
      (this.room = H(a)),
      (this.testBots = []),
      (this.devices = Array(18).fill(0)),
      this.equipAcks.clear(),
      (this.mySlot = 0),
      (this.leaderSlot = 0),
      (this.slots = Array.from({ length: 18 }, (i, r) => ({
        slot: r,
        state: 0,
        team: r % 2,
        nick: "",
        rank: 0,
      }))),
      (this.slots[0] = {
        slot: 0,
        state: 12,
        team: 0,
        nick: this.room.leaderName,
        rank: 0,
      }),
      this.changed(),
      this.room
    );
  }
  playerInfoTail = Promise.resolve();
  getPlayerInfo(t, n = 3e3) {
    const s = this.room,
      a = this.slots.find((i) => i.slot === t)?.nick,
      o = this.playerInfoTail.then(async () => {
        if (
          this.disposed ||
          this.room !== s ||
          !a ||
          this.slots.find((r) => r.slot === t)?.nick !== a
        )
          return null;
        const i = await this.fetchPlayerInfo(t, n);
        return !this.disposed &&
          this.room === s &&
          i?.nick === a &&
          this.slots.find((r) => r.slot === t)?.nick === a
          ? i
          : null;
      });
    return ((this.playerInfoTail = o.catch(() => null)), o);
  }
  async fetchPlayerInfo(t, n) {
    const s = this.testBots.find((i) => i.slot === t);
    if (s) {
      const i = Array(18).fill(0);
      ((i[0] = s.weapon), (i[8] = s.chara));
      const r = {
        matches: 0,
        wins: 0,
        loses: 0,
        draws: 0,
        kills: 0,
        headshots: 0,
        deaths: 0,
        totalKills: 0,
        escapes: 0,
        assists: 0,
        mvp: 0,
      };
      return {
        slot: t,
        nick: s.nick,
        rank: s.rank,
        equip: i,
        season: { ...r },
        total: { ...r },
        cafe: 0,
        clan: "",
      };
    }
    const a = new _(8).writeD(t),
      o = await this.request(
        d.ROOM_GET_PLAYERINFO_REQ,
        a,
        d.ROOM_GET_PLAYERINFO_ACK,
        n,
      ).catch(() => null);
    if (!o) return null;
    try {
      return Jt(o, t);
    } catch {
      return null;
    }
  }
  changeRoomInfo(t) {
    return !this.room || !this.isLeader
      ? !1
      : (t.ai &&
          this.ai &&
          (this.ai = { ...this.ai, count: t.ai.count, level: t.ai.level }),
        this.game.conn.send(
          d.ROOM_CHANGE_ROOMINFO_REQ,
          zt(this.room, t, this.ai),
        ),
        !0);
  }
  async join(t, n = "", s = !1) {
    const a = new _()
        .writeD(t)
        .writeS(n, 4)
        .writeC(0)
        .writeC(s ? 1 : 0),
      o = await this.request(d.ROOM_JOIN_REQ, a, d.ROOM_JOIN_ACK);
    return this.adopt(o, s);
  }
  adopt(t, n = !1) {
    t.readH();
    const s = t.readD();
    if (s !== 0) throw new O("JOIN_ROOM", s);
    ((this.testBots = []), this.equipAcks.clear());
    const a = t.readC(),
      o = Array.from({ length: a }, () => t.readC()),
      i = t.readC();
    for (let h = 0; h < i; h++) {
      const u = X(t, o[h] ?? h % 2);
      this.slots[u.slot] = u;
    }
    (t.skip(3), t.readC(), (this.leaderSlot = t.readC()), t.skip(6));
    const r = t.readB(175),
      c = t.readB(71),
      l = new Uint8Array(246);
    return (
      l.set(c, 0),
      l.set(r, 71),
      (this.room = H(new k(l))),
      (this.mySlot = t.readC()),
      (this.testBots = q(t)),
      (this.devices = W(t)),
      (this.leaderRequest = b(t)),
      (this.slots[this.mySlot]?.auth ?? 0) > 0 && (this.isGM = !0),
      (this.hiddenGm = n && this.isGM && this.mySlot >= 16),
      this.changed(),
      this.mySlot
    );
  }
  ready(t = 0) {
    (this.isGM && (this.mySlot >= 16 || this.hiddenGm) && (t = 2),
      (this.gmObserverMode = t === 2),
      this.game.conn.send(
        d.BATTLE_READYBATTLE_REQ,
        new _().writeC(t).writeD(0),
      ));
  }
  async start(t = 15e3) {
    if (this.hasPlayersOnBotTeam) throw new O("READYBATTLE", 2147487753);
    if (this.isBotRoom) {
      const { COMBAT_REQ: n, writeCombat: s } = await Se(
        async () => {
          const { COMBAT_REQ: a, writeCombat: o } =
            await import("./combatProtocol-ugHSWx7a.js");
          return { COMBAT_REQ: a, writeCombat: o };
        },
        __vite__mapDeps([0, 1]),
      );
      this.game.conn.send(
        n,
        s({ t: "configure", allies: this.ai?.allies ?? 0 }),
      );
    }
    return new Promise((n, s) => {
      const a = setTimeout(() => {
          (o(),
            s(
              new Error(
                m(
                  "การแข่งขันไม่เริ่ม (หมดเวลารอ)",
                  "The match did not start (timed out)",
                  "Pertandingan tidak dimulai (waktu habis)",
                ),
              ),
            ));
        }, t),
        o = this.game.conn.on((i, r) => {
          if (
            i === d.BATTLE_START_GAME_ACK ||
            i === d.BATTLE_START_COUNTDOWN_ACK
          )
            (clearTimeout(a),
              o(),
              n(i === d.BATTLE_START_GAME_ACK ? "game" : "countdown"));
          else if (i === d.BATTLE_READYBATTLE_ACK) {
            r.skip(3);
            const c = r.readD();
            c & 2147483648 &&
              (clearTimeout(a), o(), s(new O("READYBATTLE", c)));
          }
        });
      this.ready();
    });
  }
  changeTeam(t) {
    const n = this.slots.find(
      (s) =>
        s.slot % 2 === t &&
        s.state === 0 &&
        s.slot < (this.room?.slotCount ?? 16),
    );
    return n
      ? (this.game.conn.send(
          d.ROOM_PERSONAL_TEAM_CHANGE_REQ,
          new _().writeD(t).writeC(n.slot),
        ),
        !0)
      : !1;
  }
  changeSlot(t) {
    const n = this.slots.find((s) => s.slot === t)?.state === 1;
    this.game.conn.send(
      d.ROOM_CHANGE_SLOT_REQ,
      new _().writeD(t | (n ? 268435456 : 0)),
    );
  }
  changeLeader(t) {
    this.game.conn.send(d.ROOM_REQUEST_MAIN_CHANGE_WHO_REQ, new _().writeD(t));
  }
  get canRequestLeadership() {
    return (
      this.room?.state === Q.READY &&
      !this.isLeader &&
      !this.gmObserver &&
      this.mySlot >= 0 &&
      this.mySlot < 16 &&
      this.slots[this.mySlot]?.state === jt &&
      !(this.leaderRequest.voters & (1 << this.mySlot))
    );
  }
  requestLeadership() {
    this.canRequestLeadership &&
      this.game.conn.send(d.ROOM_REQUEST_MAIN_REQ, new _().writeC(1));
  }
  changeTeamSlot(t) {
    if (t < 0 || t >= (this.room?.slotCount ?? 16) || t === this.mySlot)
      return !1;
    const n = this.slots.find((s) => s.slot === t);
    return !n || n.state !== 0
      ? !1
      : (this.game.conn.send(
          d.ROOM_PERSONAL_TEAM_CHANGE_REQ,
          new _().writeD(t % 2).writeC(t),
        ),
        !0);
  }
  async loadingStart() {
    ((this.battleStartAckSeen = !1),
      (this.lastRoundStart = null),
      (this.round = 1));
    const t = this.room ? Zt(this.room.mapId) : F.mapName;
    await this.request(
      d.ROOM_LOADING_START_REQ,
      new _().writeC(t.length).writeS(t, t.length),
      d.ROOM_LOADING_START_ACK,
    );
  }
  async preStart() {
    const t = this.room,
      n = new _()
        .writeC(t.mapId)
        .writeC(t.rule)
        .writeC(t.stage)
        .writeC(t.roomType),
      s = await new Promise((u, E) => {
        const T = setTimeout(() => {
            (f(), E(new Error("PRESTARTBATTLE: sem resposta")));
          }, 8e3),
          f = this.game.conn.on((D, p) => {
            if (D !== d.BATTLE_PRESTARTBATTLE_ACK) return;
            const I = p.pos,
              N =
                p.remaining >= 8 &&
                p.readD() === 1 &&
                p.readD() !== this.mySlot;
            ((p.pos = I), !N && (clearTimeout(T), f(), u(p)));
          });
        this.game.conn.send(d.BATTLE_PRESTARTBATTLE_REQ, n);
      });
    if (s.readD() !== 1)
      throw new Error(
        "PRESTARTBATTLE recusado (mapa/regra não conferem ou líder ainda não fez LOADING_START)",
      );
    const o = s.readD(),
      i = s.readC(),
      r = [...s.readB(4)].join(".");
    s.readB(4);
    const c = s.readH(),
      l = s.readD(),
      h = s.readD();
    return (
      (this.endpoint = {
        slot: o,
        udpType: i,
        ip: r,
        port: c,
        uniqueRoomId: l,
        roomSeed: h,
        signalTicket: this.game.conn.signalTicket ?? void 0,
        authoritative: this.game.conn.combatAuthority,
      }),
      this.endpoint
    );
  }
  startBattle() {
    ((this.battleStartAckSeen = !1),
      this.game.conn.send(d.BATTLE_STARTBATTLE_REQ));
  }
  async respawn(t = this.room?.weaponsFlag ?? 511, n, s = be()) {
    const a = n
        ? mt(n, t, { itemId: s, objectId: 0 })
        : new _(160)
            .zeros(144)
            .writeH(t & 15)
            .writeD(s)
            .writeD(0),
      o = new Promise((i, r) => {
        const c = () =>
            !!this.lastRoundStart &&
            this.sitsOutRound(this.lastRoundStart.slotsFlag),
          l = (E) => {
            (clearTimeout(h),
              u(),
              E === null ? r(new Error("RESPAWN: sem RESPAWN_ACK")) : i(E));
          },
          h = setTimeout(() => l(c() ? this.mySpawns : null), Wt),
          u = this.game.conn.on((E, T) => {
            if (E === d.BATTLE_ROUND_START_ACK) {
              c() && l(this.mySpawns);
              return;
            }
            E !== d.BATTLE_RESPAWN_ACK ||
              T.readD() !== this.mySlot ||
              (T.readD(), l(T.readD()));
          });
        c() && l(this.mySpawns);
      });
    return (
      this.game.conn.send(d.BATTLE_RESPAWN_REQ, a),
      (this.mySpawns = await o),
      this.mySpawns
    );
  }
  reportKill(t, n, s, a = [0, 0, 0], o = [0, 0, 0]) {
    const i = new _(64)
        .writeC(0)
        .writeC(1)
        .writeC(this.mySlot)
        .writeD(n)
        .writeT(a[0])
        .writeT(a[1])
        .writeT(a[2])
        .writeC(0)
        .writeC(0),
      r = s ? 3 : 1;
    (i
      .writeC(t)
      .writeC(Math.trunc((n % 1e5) / 1e3) & 255)
      .writeC((r << 4) | (t & 15))
      .writeH(0)
      .writeC(0)
      .writeT(o[0])
      .writeT(o[1])
      .writeT(o[2])
      .writeC(this.mySlot)
      .zeros(4),
      this.game.conn.send(d.BATTLE_DEATH_REQ, i));
  }
  timerSync(t, n, s) {
    const a = this.round,
      o = Math.ceil((this.roundDeadline - Date.now()) / 1e3);
    t === 0 && this.room?.roomType === 4 && o > 3 && (t = o);
    const i = new _()
      .writeD(t)
      .writeT(0)
      .writeC(a)
      .writeC(5)
      .writeC(0)
      .writeH(30);
    if ((n && i.writeH(Pt).writeH(n[0]).writeH(n[1]), n && s)) {
      i.writeH(Ut).writeC(s.length);
      for (const r of s)
        i.writeC(r.slot).writeH(r.kills).writeH(r.deaths).writeH(r.headshots);
    }
    this.game.conn.send(d.BATTLE_TIMERSYNC_REQ, i);
  }
  bombInstall(t, n, s = this.mySlot) {
    this.game.conn.send(
      d.BATTLE_MISSION_BOMB_INSTALL_REQ,
      new _(24)
        .writeD(s)
        .writeC(t)
        .writeD(0)
        .writeT(n[0])
        .writeT(n[1])
        .writeT(n[2]),
    );
  }
  generatorInfo(t, n, s) {
    const a = new _(40).writeH(t).writeH(n);
    for (let o = 0; o < 18; o++) a.writeH(s[o] ?? 0);
    this.game.conn.send(d.BATTLE_MISSION_GENERATOR_INFO_REQ, a);
  }
  bombUninstall(t = this.mySlot) {
    this.game.conn.send(
      d.BATTLE_MISSION_BOMB_UNINSTALL_REQ,
      new _(8).writeD(t),
    );
  }
  devBomb(t) {
    this.game.conn.send(5199, new _(4).writeC(t));
  }
  reportCheat(t) {
    if (!this.game.conn.isOpen) return;
    const n = t.kind.replace(/[^a-z0-9-]/gi, "").slice(0, 32),
      s = t.detail.slice(0, qt),
      a = new _(16 + n.length + s.length * 2)
        .writeC(t.slot & 255)
        .writeC(t.kick ? 1 : 0)
        .writeC(Math.min(255, Math.max(0, Math.round(t.weight))))
        .writeH(Math.min(65535, Math.max(0, Math.round(t.strikes))))
        .writeH(Math.min(65535, Math.max(0, Math.round(t.repeats))))
        .writeC(n.length)
        .writeS(n, n.length)
        .writeH(s.length)
        .writeU(s, s.length * 2);
    this.game.conn.send($t, a);
  }
  giveUp() {
    try {
      this.game.conn.send(d.BATTLE_GIVEUPBATTLE_REQ, new _().writeD(0));
    } catch (t) {
      console.warn("[room] giveUp:", t.message);
    }
  }
  async leave() {
    (await this.request(d.LOBBY_ENTER_REQ, void 0, d.LOBBY_ENTER_ACK).catch(
      () => null,
    ),
      (this.room = null),
      (this.mySlot = -1),
      (this.endpoint = null),
      (this.testBots = []),
      this.equipAcks.clear(),
      (this.slots = Array.from({ length: 18 }, (t, n) => ({
        slot: n,
        state: 0,
        team: n % 2,
        nick: "",
        rank: 0,
      }))));
  }
}
function Zt(e) {
  return { 4: xt.mapName, 36: F.mapName }[e] ?? `Map${e}`;
}
export {
  Ds as $,
  Rs as A,
  Os as B,
  hs as C,
  As as D,
  y as E,
  us as F,
  C as G,
  Is as H,
  ds as I,
  ys as J,
  g as K,
  Hs as L,
  bs as M,
  Nt as N,
  It as O,
  d as P,
  Ce as Q,
  vs as R,
  Ns as S,
  Bs as T,
  Ls as U,
  ks as V,
  jt as W,
  Ms as X,
  xe as Y,
  gs as Z,
  Q as _,
  Ks as a,
  Gs as a0,
  ce as a1,
  Je as a2,
  ls as a3,
  ut as a4,
  Bt as a5,
  kt as a6,
  Us as a7,
  S as b,
  Es as c,
  M as d,
  rt as e,
  cs as f,
  it as g,
  _t as h,
  _e as i,
  lt as j,
  at as k,
  _s as l,
  Zt as m,
  dt as n,
  tt as o,
  ct as p,
  Ss as q,
  Cs as r,
  Ps as s,
  rs as t,
  Ct as u,
  ms as v,
  ws as w,
  Ts as x,
  ps as y,
  fs as z,
};
