const ce = new TextEncoder(),
  de = new TextDecoder("utf-8"),
  Ee = new TextDecoder("utf-16le");
function Ce(e) {
  return (
    ArrayBuffer.isView(e) &&
    Object.prototype.toString.call(e) === "[object Uint8Array]"
  );
}
function ue(e) {
  return (
    typeof e == "object" &&
    e !== null &&
    !ArrayBuffer.isView(e) &&
    typeof e.toBytes == "function"
  );
}
function Ye(e) {
  return ue(e) ? e.toBytes() : e;
}
class d {
  buf;
  view;
  length = 0;
  constructor(t = 64) {
    ((this.buf = new Uint8Array(t)),
      (this.view = new DataView(this.buf.buffer)));
  }
  ensure(t) {
    if (this.length + t <= this.buf.length) return;
    let n = this.buf.length * 2;
    for (; n < this.length + t;) n *= 2;
    const s = new Uint8Array(n);
    (s.set(this.buf.subarray(0, this.length)),
      (this.buf = s),
      (this.view = new DataView(s.buffer)));
  }
  writeC(t) {
    return (
      this.ensure(1),
      this.view.setUint8(this.length, t & 255),
      (this.length += 1),
      this
    );
  }
  writeH(t) {
    return (
      this.ensure(2),
      this.view.setUint16(this.length, t & 65535, !0),
      (this.length += 2),
      this
    );
  }
  writeD(t) {
    return (
      this.ensure(4),
      this.view.setUint32(this.length, t >>> 0, !0),
      (this.length += 4),
      this
    );
  }
  writeQ(t) {
    return (
      this.ensure(8),
      this.view.setBigUint64(this.length, BigInt.asUintN(64, t), !0),
      (this.length += 8),
      this
    );
  }
  writeT(t) {
    return (
      this.ensure(4),
      this.view.setFloat32(this.length, t, !0),
      (this.length += 4),
      this
    );
  }
  writeB(t) {
    const n = Ce(t) ? t : Uint8Array.from(t);
    return (
      this.ensure(n.length),
      this.buf.set(n, this.length),
      (this.length += n.length),
      this
    );
  }
  zeros(t) {
    return (
      this.ensure(t),
      this.buf.fill(0, this.length, this.length + t),
      (this.length += t),
      this
    );
  }
  writeS(t, n) {
    const s = ce.encode(t);
    return (
      this.writeB(s.subarray(0, n)),
      this.zeros(Math.max(0, n - s.length))
    );
  }
  writeU(t, n) {
    const s = new Uint8Array(n);
    for (let r = 0; r < t.length && r * 2 + 1 < n; r++) {
      const i = t.charCodeAt(r);
      ((s[r * 2] = i & 255), (s[r * 2 + 1] = i >> 8));
    }
    return this.writeB(s);
  }
  toBytes() {
    return this.buf.slice(0, this.length);
  }
}
class Q {
  data;
  view;
  pos;
  constructor(t, n = 0) {
    ((this.data = t),
      (this.view = new DataView(t.buffer, t.byteOffset, t.byteLength)),
      (this.pos = n));
  }
  get remaining() {
    return this.data.length - this.pos;
  }
  need(t) {
    if (this.pos + t > this.data.length)
      throw new RangeError(
        `PacketReader: need ${t} bytes at ${this.pos}, have ${this.remaining}`,
      );
  }
  readC() {
    return (this.need(1), this.view.getUint8(this.pos++));
  }
  readH() {
    this.need(2);
    const t = this.view.getUint16(this.pos, !0);
    return ((this.pos += 2), t);
  }
  readD() {
    this.need(4);
    const t = this.view.getUint32(this.pos, !0);
    return ((this.pos += 4), t);
  }
  readSignedD() {
    this.need(4);
    const t = this.view.getInt32(this.pos, !0);
    return ((this.pos += 4), t);
  }
  readT() {
    this.need(4);
    const t = this.view.getFloat32(this.pos, !0);
    return ((this.pos += 4), t);
  }
  readQ() {
    this.need(8);
    const t = this.view.getBigInt64(this.pos, !0);
    return ((this.pos += 8), t);
  }
  readB(t) {
    this.need(t);
    const n = this.data.slice(this.pos, this.pos + t);
    return ((this.pos += t), n);
  }
  skip(t) {
    return (this.need(t), (this.pos += t), this);
  }
  readS(t) {
    const n = this.readB(t),
      s = n.indexOf(0);
    return de.decode(s >= 0 ? n.subarray(0, s) : n);
  }
  readU(t) {
    const n = Ee.decode(this.readB(t)),
      s = n.indexOf("\0");
    return s >= 0 ? n.slice(0, s) : n;
  }
}
const _ = {
    INVITE_REQ: 1811,
    INVITE_ERR_ACK: 1812,
    LIST_ACK: 1810,
    INFO_CHANGE_ACK: 1815,
    ACCEPT_REQ: 1816,
    ACCEPT_ERR_ACK: 1817,
    DELETE_REQ: 1820,
    DELETE_ACK: 1821,
    FIND_USER_REQ: 2426,
    USER_DETAIL_ACK: 2438,
    FIND_LOBBY_REQ: 297,
  },
  he = {
    SELF: 2147487799,
    FULL: 2147487800,
    ALREADY: 2147487809,
    NOT_FOUND: 2147487810,
    FAIL: 2147487801,
  },
  m = { INSERT: 1, ACCEPT: 2, DELETE: 3, UPDATE: 4 },
  Y = { ROOM: 8 },
  J = { SENT: 1, RECEIVED: 2, OFFLINE: 3, ONLINE: 4, LOBBY: 5, ROOM: 6 };
function _e(e) {
  const t = e >>> 28;
  return t === Y.ROOM ? J.ROOM : t;
}
function Ae(e) {
  return {
    server: (e >>> 20) & 255,
    channel: (e >>> 12) & 255,
    room: e & 4095,
  };
}
const K = 2147483648;
function q(e, t) {
  const n = e.readC();
  if (n === 0) return (e.skip(t + 17), null);
  let s = "";
  for (let c = 0; c < n; c++) s += String.fromCharCode(e.readH());
  const r = e.readQ(),
    i = e.readD();
  e.readD();
  const o = e.readC();
  return (
    e.skip(t),
    { nick: s.replace(/\0+$/, ""), playerId: r, status: i >>> 0, rank: o }
  );
}
function j(e) {
  const t = e.readC(),
    n = [];
  for (let s = 0; s < t; s++) n.push(q(e, 13));
  return n;
}
function z(e) {
  const t = e.readC(),
    n = e.readC();
  return { cs: t, idx: n, entry: q(e, 6) };
}
class X {
  list = [];
  off = null;
  subs = new Set();
  set(t) {
    ((this.list = t), this.emit());
  }
  attach(t) {
    (this.detach(),
      (this.off = t.on((n, s) => {
        n === _.LIST_ACK
          ? this.set(j(new Q(s.data.slice(s.pos))))
          : n === _.INFO_CHANGE_ACK &&
            (this.apply(z(new Q(s.data.slice(s.pos)))), this.emit());
      })));
  }
  detach() {
    (this.off?.(), (this.off = null));
  }
  subscribe(t) {
    return (this.subs.add(t), () => this.subs.delete(t));
  }
  apply(t) {
    if (t.cs === m.DELETE) {
      this.list.splice(t.idx, 1);
      return;
    }
    if (!(t.cs !== m.INSERT && t.cs !== m.UPDATE)) {
      for (; this.list.length < t.idx;) this.list.push(null);
      this.list[t.idx] = t.entry;
    }
  }
  emit() {
    for (const t of this.subs) t();
  }
}
const le = new X();
async function Re(e, t) {
  const n = e.waitFor(_.INFO_CHANGE_ACK, 5e3).then(() => 0),
    s = e.waitFor(_.INVITE_ERR_ACK, 5e3).then((r) => r.readD());
  try {
    return (
      e.send(_.INVITE_REQ, new d(72).writeU(t, 66)),
      await Promise.race([n, s])
    );
  } catch {
    return K;
  }
}
async function we(e, t) {
  const n = e
    .waitFor(_.USER_DETAIL_ACK, 5e3)
    .then((s) => (s.readH(), s.readD() === 0));
  try {
    return (e.send(_.FIND_USER_REQ, new d(68).writeU(t, 66)), await n);
  } catch {
    return !1;
  }
}
function fe(e, t) {
  new TextEncoder().encode(t).length >= 33 ||
    e.send(_.FIND_LOBBY_REQ, new d(33).writeS(t, 33));
}
async function Te(e, t) {
  let n = () => {};
  const s = new Promise((r) => {
    const i = setTimeout(() => {
      (n(), r(K));
    }, 5e3);
    n = e.on((o, c) => {
      const E = new Q(c.data.slice(c.pos));
      if (o === _.INFO_CHANGE_ACK && E.readC() === m.ACCEPT) r(0);
      else if (o === _.ACCEPT_ERR_ACK) r(E.readD());
      else return;
      (clearTimeout(i), n());
    });
  });
  try {
    e.send(_.ACCEPT_REQ, new d(2).writeC(t));
  } catch {
    return (n(), K);
  }
  return s;
}
async function De(e, t) {
  const n = e.waitFor(_.DELETE_ACK, 5e3).then((s) => s.readD());
  try {
    return (e.send(_.DELETE_REQ, new d(2).writeC(t)), await n);
  } catch {
    return K;
  }
}
const Je = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        CrossState: J,
        FriendChange: m,
        FriendErr: he,
        FriendList: X,
        FriendOp: _,
        FriendState: Y,
        acceptFriend: Te,
        crossState: _e,
        deleteFriend: De,
        findUser: we,
        friendList: le,
        friendLocation: Ae,
        readFriendChange: z,
        readFriendList: j,
        requestFriend: Re,
        sendFindLobby: fe,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  a = {
    ENTER_REQ: 769,
    ENTER_ACK: 770,
    LEAVE_REQ: 771,
    LEAVE_ACK: 772,
    LIST_REQ: 997,
    LIST_ACK: 1e3,
    DETAIL_REQ: 800,
    DETAIL_ACK: 801,
    SIMPLE_REQ: 1001,
    SIMPLE_ACK: 1002,
    MEMBER_CTX_REQ: 802,
    MEMBER_CTX_ACK: 803,
    MEMBER_LIST_REQ: 804,
    MEMBER_LIST_ACK: 805,
    CREATE_REQ: 806,
    CREATE_ACK: 807,
    JOIN_REQ: 812,
    JOIN_ACK: 813,
    CANCEL_REQ: 814,
    CANCEL_ACK: 815,
    SECEDE_REQ: 828,
    SECEDE_ACK: 829,
    CHAT_REQ: 854,
    CHAT_ACK: 855,
    CLOSE_REQ: 808,
    CLOSE_ACK: 809,
    JOIN_AUTH_REQ: 810,
    JOIN_AUTH_ACK: 811,
    CONTEXT_REQ: 816,
    CONTEXT_ACK: 817,
    REQUEST_LIST_REQ: 818,
    REQUEST_LIST_ACK: 819,
    REQUEST_INFO_REQ: 820,
    REQUEST_INFO_ACK: 821,
    ACCEPT_REQ: 822,
    ACCEPT_ACK: 823,
    ACCEPT_RESULT_PUSH: 824,
    DENY_REQ: 825,
    DENY_ACK: 826,
    DEPORT_REQ: 830,
    DEPORT_ACK: 831,
    DEPORTED_PUSH: 832,
    MEMBER_LEAVE_PUSH: 849,
    MASTER_REQ: 833,
    MASTER_ACK: 834,
    MASTER_PUSH: 835,
    STAFF_REQ: 836,
    STAFF_ACK: 837,
    STAFF_PUSH: 838,
    REGULAR_REQ: 839,
    REGULAR_ACK: 840,
    REGULAR_PUSH: 841,
    MARK_REQ: 856,
    MARK_ACK: 857,
    NOTICE_REQ: 858,
    NOTICE_ACK: 859,
    INTRO_REQ: 860,
    INTRO_ACK: 861,
    MANAGE_REQ: 868,
    MANAGE_ACK: 869,
    ROOM_INVITE_REQ: 877,
    ROOM_INVITE_PUSH: 3077,
    PAGE_CHAT_REQ: 886,
    PAGE_CHAT_PUSH: 887,
    INVITE_REQ: 888,
    INVITE_ACK: 889,
    INVITE_ACCEPT_REQ: 890,
    INVITE_ACCEPT_ERR_ACK: 891,
    INVITE_RESULT_PUSH: 1922,
    NOTE_REQ: 892,
    NOTE_ACK: 893,
    CONDITION_REQ: 916,
    CONDITION_ACK: 917,
    DUPLICATE_REQ: 918,
    DUPLICATE_ACK: 919,
    MEMBER_INFO_PUSH: 845,
    MEMBER_INSERT_PUSH: 847,
    STATUS_PUSH: 851,
  },
  qe = {
    ALREADY_IN_CLAN: 2147487836,
    OWNER_CANNOT_SECEDE: 2147487838,
    CREATE_CONDITION: 2147487818,
    NAME_IN_USE: 2147487834,
    MASTER_RANK: 2147487928,
    RANK_LIMIT: 2147487867,
  },
  je = { ONLINE: 4, LOBBY: 5, ROOM: 8 },
  Ne = 2147483648,
  Ie = 5e3,
  u = (e, t) => (e === 0 ? { ok: !0, err: e, data: t } : { ok: !1, err: e }),
  pe = (e) =>
    e & Ne ? { ok: !1, err: e } : { ok: !0, err: 0, data: { count: e } };
function Se(e) {
  const t = BigInt.asUintN(64, e),
    n = Number(t & 0xffffffffn);
  return {
    raw: t,
    high: Number(t >> 32n),
    state: n >>> 28,
    server: (n >>> 20) & 255,
    channel: (n >>> 12) & 255,
    room: n & 4095,
  };
}
const R = (e) => BigInt.asUintN(64, e.readQ()),
  y = (e) => e.readU(e.readC() * 2),
  ge = (e) => e.readU(e.readH() * 2),
  $ = (e) => {
    let t = "";
    for (let n = e.readH(); n !== 0; n = e.readH()) t += String.fromCharCode(n);
    return t;
  },
  v = (e) => {
    const t = e.readB(8);
    return new DataView(t.buffer, t.byteOffset, 8).getFloat64(0, !0);
  },
  O = (e) => Se(e.readQ());
function ke(e) {
  const t = e.readD(),
    n = e.readD(),
    s = e.readD(),
    r =
      n !== 0 && s !== 0
        ? null
        : {
            count: e.readD(),
            perPage: e.readC(),
            pages: e.readH(),
            date: e.readD(),
          };
  return u(t, { clanId: n, access: s, list: r });
}
function Le(e) {
  const t = e.readD(),
    n = e.readH(),
    s = e.readH(),
    r = e.readH(),
    i = [];
  for (let o = 0; o < n; o++) {
    const c = e.readD(),
      E = y(e),
      C = e.readD(),
      h = ge(e);
    (e.skip(1), i.push({ id: c, name: E, logo: C, info: h }));
  }
  return u(t, { total: s, start: r, clans: i });
}
function Z(e) {
  const t = e.readD(),
    n = e.readD(),
    s = e.readU(34),
    r = e.readC(),
    i = e.readC(),
    o = e.readC(),
    c = e.readD(),
    E = e.readD(),
    C = e.readC(),
    h = e.readC(),
    A = e.readC(),
    w = e.readD(),
    f = R(e);
  e.skip(4);
  const T = e.readU(66),
    D = e.readC(),
    I = e.readC(),
    S = e.readU(510);
  e.skip(41);
  const g = e.readC(),
    k = e.readC(),
    P = e.readC(),
    M = e.readC(),
    b = e.readC(),
    H = e.readU(510),
    F = e.readD(),
    ne = e.readD(),
    se = e.readD();
  e.skip(96);
  const ae = e.readD(),
    re = e.readD(),
    ie = e.readD();
  e.skip(133);
  const oe = e.readD();
  return (
    e.skip(148),
    {
      echo: t,
      id: n,
      name: s,
      rank: r,
      members: i,
      maxPlayers: o,
      createDate: c,
      logo: E,
      nameColor: C,
      effects: h,
      unit: A,
      exp: w,
      ownerId: f,
      ownerNick: T,
      ownerNickColor: D,
      ownerRank: I,
      info: S,
      joinPermission: g,
      rankLimit: k,
      maxAge: P,
      minAge: M,
      authority: b,
      news: H,
      points: F,
      wins: ne,
      loses: se,
      matches: ae,
      matchWins: re,
      matchLoses: ie,
      clanRank: oe,
    }
  );
}
function me(e) {
  (e.readD(), e.readH());
  const t = e.readD();
  if (t !== 0) return u(t);
  const n = e.readD(),
    s = e.readC(),
    r = e.readD(),
    i = e.readD(),
    o = e.readD(),
    c = e.readD(),
    E = e.readC(),
    C = e.readC(),
    h = e.readC(),
    A = e.readU(e.readC() * 2),
    w = R(e),
    f = e.readC();
  return u(t, {
    points: n,
    nameColor: s,
    loses: r,
    wins: i,
    matches: o,
    logo: c,
    unit: E,
    members: h,
    maxPlayers: C,
    name: A,
    ownerId: w,
    rank: f,
  });
}
function V(e) {
  const t = e.readD();
  if (t !== 0) return u(t);
  const n = e.readC(),
    s = e.readC(),
    r = e.readC(),
    i = e.readD();
  return u(t, { count: n, perPage: s, pages: r, date: i });
}
function ye(e) {
  const t = e.readD();
  if (t !== 0) return u(t);
  const n = e.readC(),
    s = e.readC(),
    r = [];
  for (let i = 0; i < s; i++) {
    const o = R(e),
      c = e.readU(66),
      E = e.readC(),
      C = e.readC(),
      h = O(e),
      A = e.readD(),
      w = e.readC(),
      f = e.readD(),
      T = e.readD(),
      D = e.readD();
    (e.skip(13),
      r.push({
        playerId: o,
        nick: c,
        rank: E,
        access: C,
        status: h,
        joinDate: A,
        nickColor: w,
        wins: f,
        loses: T,
        nameCard: D,
      }));
  }
  return u(t, { page: n, members: r });
}
function Ue(e) {
  const t = e.readD();
  if (t !== 0) return u(t);
  if (e.remaining === 0) return u(0);
  const n = e.readD(),
    s = e.readU(34),
    r = e.readC(),
    i = e.readC(),
    o = e.readC(),
    c = e.readD(),
    E = e.readD();
  e.skip(11);
  const C = R(e),
    h = e.readS(66),
    A = e.readC(),
    w = e.readC(),
    f = e.readU(510);
  e.skip(42);
  const T = e.readC(),
    D = e.readC(),
    I = e.readC(),
    S = e.readC();
  e.skip(554);
  const g = v(e);
  (e.skip(24), v(e), e.skip(154));
  const k = e.readD();
  return u(t, {
    id: n,
    name: s,
    rank: r,
    members: i,
    maxPlayers: o,
    createDate: c,
    logo: E,
    ownerId: C,
    ownerNick: h,
    ownerNickColor: A,
    ownerRank: w,
    info: f,
    rankLimit: T,
    minAge: D,
    maxAge: I,
    authority: S,
    points: g,
    gold: k,
  });
}
function Qe(e) {
  const t = e.readD(),
    n = (t | 0) >= 0 && e.remaining >= 4 ? e.readD() : 0;
  return u(t, { clanId: n });
}
function Ke(e) {
  const t = e.readD();
  if (t !== 0) return u(t);
  const n = e.readC(),
    s = e.readC(),
    r = [];
  for (let i = 0; i < s; i++) {
    const o = R(e),
      c = e.readU(66),
      E = e.readC(),
      C = e.readC(),
      h = e.readD(),
      A = e.readD(),
      w = e.readD(),
      f = e.readD(),
      T = e.readD(),
      D = e.readD(),
      I = $(e);
    (e.readD(),
      r.push({
        playerId: o,
        nick: c,
        rank: E,
        nickColor: C,
        inviteDate: h,
        kills: A,
        deaths: w,
        matches: f,
        wins: T,
        loses: D,
        text: I,
      }));
  }
  return u(t, { page: n, requests: r });
}
function Oe(e) {
  const t = e.readD();
  if (t !== 0) return u(t);
  const n = R(e),
    s = e.readU(66),
    r = e.readC(),
    i = e.readD(),
    o = e.readD(),
    c = e.readD(),
    E = e.readD(),
    C = e.readD();
  return u(t, {
    playerId: n,
    nick: s,
    rank: r,
    kills: i,
    deaths: o,
    matches: c,
    wins: E,
    loses: C,
    text: $(e),
  });
}
function Pe(e) {
  const t = e.readD(),
    n = e.readU(34),
    s = e.readC(),
    r = e.readC(),
    i = e.readC(),
    o = e.readD(),
    c = e.readD(),
    E = e.readC(),
    C = e.readC(),
    h = e.readC(),
    A = e.readD();
  e.skip(4);
  const w = R(e),
    f = e.readU(66),
    T = e.readC(),
    D = e.readC(),
    I = e.readU(510);
  e.skip(42);
  const S = e.readC(),
    g = e.readC(),
    k = e.readC(),
    P = e.readC(),
    M = e.readU(510),
    b = e.readD(),
    H = e.readD(),
    F = e.readD();
  return (
    e.skip(12),
    {
      id: t,
      name: n,
      rank: s,
      members: r,
      maxPlayers: i,
      createDate: o,
      logo: c,
      nameColor: E,
      effects: C,
      unit: h,
      exp: A,
      ownerId: w,
      ownerNick: f,
      ownerNickColor: T,
      ownerRank: D,
      info: I,
      rankLimit: S,
      minAge: g,
      maxAge: k,
      authority: P,
      news: M,
      matches: b,
      wins: H,
      loses: F,
    }
  );
}
function Me(e) {
  const t = e.readC(),
    n = [];
  for (let s = 0; s < t; s++) {
    const r = y(e),
      i = R(e),
      o = O(e),
      c = e.readC(),
      E = e.readD(),
      C = e.readD(),
      h = e.readD(),
      A = e.readC();
    (e.skip(12),
      n.push({
        playerId: i,
        nick: r,
        rank: c,
        status: o,
        wins: E,
        loses: C,
        nameCard: h,
        nickBorderColor: A,
      }));
  }
  return n;
}
function be(e) {
  const t = y(e),
    n = R(e),
    s = O(e),
    r = e.readC(),
    i = e.readC(),
    o = e.readD(),
    c = e.readD(),
    E = e.readD(),
    C = e.readC();
  return (
    e.skip(12),
    {
      nick: t,
      playerId: n,
      status: s,
      rank: r,
      nickColor: i,
      wins: o,
      loses: c,
      nameCard: E,
      nickBorderColor: C,
    }
  );
}
function G(e) {
  const t = y(e),
    n = e.readC() !== 0,
    s = e.readC(),
    r = y(e);
  return { nick: t, gm: n, nickColor: s, text: r };
}
function He(e) {
  return {
    nick: e.readU(66),
    roomId: e.readD(),
    inviterId: R(e),
    password: e.readS(4),
  };
}
function Fe(e) {
  return { minRank: e.readC(), minGold: e.readD() };
}
const l = (e) => u(e.readD());
function Be(e, t) {
  switch (e) {
    case a.DETAIL_ACK:
      return { type: "detail", detail: Z(t) };
    case a.MEMBER_INFO_PUSH:
      return { type: "members", members: Me(t) };
    case a.MEMBER_INSERT_PUSH:
      return { type: "member-insert", member: be(t) };
    case a.MEMBER_LEAVE_PUSH:
      return { type: "member-leave", playerId: R(t) };
    case a.STATUS_PUSH:
      return { type: "member-status", playerId: R(t), status: O(t) };
    case a.ACCEPT_RESULT_PUSH:
      return { type: "accept-result", clan: Pe(t) };
    case a.DEPORTED_PUSH:
      return { type: "deported" };
    case a.MASTER_PUSH:
      return { type: "master" };
    case a.STAFF_PUSH:
      return { type: "staff" };
    case a.REGULAR_PUSH:
      return { type: "regular" };
    case a.CHAT_ACK:
      return { type: "chat", msg: G(t) };
    case a.PAGE_CHAT_PUSH:
      return (t.readC(), { type: "page-chat", msg: G(t) });
    case a.ROOM_INVITE_PUSH:
      return { type: "room-invite", invite: He(t) };
    case a.INVITE_RESULT_PUSH:
      return { type: "invite-result", err: t.readD() };
    default:
      return null;
  }
}
const U = (e, t) => {
    const n = t.slice(0, 255);
    return e.writeC(n.length).writeU(n, n.length * 2);
  },
  x = (e, t) => e.writeH(t.length).writeU(t, t.length * 2),
  L = (e) => {
    const t = new d(1 + e.length * 8).writeC(e.length);
    for (const n of e) t.writeQ(n);
    return t;
  };
class ve {
  conn;
  subs = new Set();
  off;
  constructor(t) {
    ((this.conn = t),
      (this.off = t.on((n, s) => {
        const r = Be(n, s);
        if (r) for (const i of [...this.subs]) i(r);
      })));
  }
  on(t) {
    return (this.subs.add(t), () => this.subs.delete(t));
  }
  dispose() {
    (this.off(), this.subs.clear());
  }
  chain = Promise.resolve();
  pending = 0;
  ask(t, n, s) {
    const r =
      this.pending === 0
        ? this.askNow(t, n, s)
        : this.chain.then(() => this.askNow(t, n, s));
    this.pending++;
    const i = r
      .then(
        () => {},
        () => {},
      )
      .then(() => {
        this.pending--;
      });
    return ((this.chain = i), r);
  }
  askNow(t, n, s) {
    return new Promise((r, i) => {
      let o = () => {};
      const c = setTimeout(() => {
        (o(), i(new Error(`clan: no ACK for opcode ${t}`)));
      }, Ie);
      o = this.conn.on((E, C) => {
        n.includes(E) && (clearTimeout(c), o(), r(C));
      });
      try {
        this.conn.send(t, s);
      } catch (E) {
        (clearTimeout(c), o(), i(E));
      }
    });
  }
  async enter() {
    return ke(await this.ask(a.ENTER_REQ, [a.ENTER_ACK]));
  }
  async leave() {
    return l(await this.ask(a.LEAVE_REQ, [a.LEAVE_ACK]));
  }
  async list(t = 0) {
    const n = new d(4).writeC(t).writeC(0).writeC(0).writeC(0);
    return Le(await this.ask(a.LIST_REQ, [a.LIST_ACK], n));
  }
  async detail(t, n = 0) {
    const s = await this.ask(
      a.DETAIL_REQ,
      [a.DETAIL_ACK],
      new d(5).writeD(t).writeC(n),
    );
    return u(0, Z(s));
  }
  async simpleInfo(t) {
    return me(await this.ask(a.SIMPLE_REQ, [a.SIMPLE_ACK], new d(4).writeD(t)));
  }
  async memberContext() {
    return V(await this.ask(a.MEMBER_CTX_REQ, [a.MEMBER_CTX_ACK]));
  }
  async memberList(t = 0) {
    return ye(
      await this.ask(
        a.MEMBER_LIST_REQ,
        [a.MEMBER_LIST_ACK],
        new d(1).writeC(t),
      ),
    );
  }
  async create(t, n, s = 0) {
    const r = new d(564)
      .writeD(0)
      .writeU(t, 34)
      .writeU(n, 510)
      .writeD(s >>> 0);
    return Ue(await this.ask(a.CREATE_REQ, [a.CREATE_ACK], r));
  }
  async requestJoin(t, n) {
    const s = new d(16).writeD(t);
    return (U(s, n), Qe(await this.ask(a.JOIN_REQ, [a.JOIN_ACK], s)));
  }
  async cancelJoin() {
    return l(await this.ask(a.CANCEL_REQ, [a.CANCEL_ACK]));
  }
  async secede() {
    return l(await this.ask(a.SECEDE_REQ, [a.SECEDE_ACK]));
  }
  chat(t) {
    const n = new d(8 + t.length * 2).writeH(5);
    (x(n, t), this.conn.send(a.CHAT_REQ, n));
  }
  async close() {
    return l(await this.ask(a.CLOSE_REQ, [a.CLOSE_ACK]));
  }
  async checkJoinAuthority(t) {
    return l(
      await this.ask(a.JOIN_AUTH_REQ, [a.JOIN_AUTH_ACK], new d(4).writeD(t)),
    );
  }
  async requestContext() {
    return V(await this.ask(a.CONTEXT_REQ, [a.CONTEXT_ACK]));
  }
  async requestList(t = 0) {
    return Ke(
      await this.ask(
        a.REQUEST_LIST_REQ,
        [a.REQUEST_LIST_ACK],
        new d(1).writeC(t),
      ),
    );
  }
  async requestInfo(t) {
    return Oe(
      await this.ask(
        a.REQUEST_INFO_REQ,
        [a.REQUEST_INFO_ACK],
        new d(8).writeQ(t),
      ),
    );
  }
  async accept(t) {
    return this.countAck(a.ACCEPT_REQ, a.ACCEPT_ACK, L(t));
  }
  async deny(t) {
    return this.countAck(a.DENY_REQ, a.DENY_ACK, L(t));
  }
  async deport(t) {
    return this.countAck(a.DEPORT_REQ, a.DEPORT_ACK, L(t));
  }
  async commissionMaster(t) {
    return l(await this.ask(a.MASTER_REQ, [a.MASTER_ACK], new d(8).writeQ(t)));
  }
  async commissionStaff(t) {
    return this.countAck(a.STAFF_REQ, a.STAFF_ACK, L(t));
  }
  async commissionRegular(t) {
    return this.countAck(a.REGULAR_REQ, a.REGULAR_ACK, L(t));
  }
  async checkMark(t) {
    return l(await this.ask(a.MARK_REQ, [a.MARK_ACK], new d(4).writeD(t)));
  }
  async replaceNotice(t) {
    return l(
      await this.ask(
        a.NOTICE_REQ,
        [a.NOTICE_ACK],
        U(new d(2 + t.length * 2), t),
      ),
    );
  }
  async replaceIntro(t) {
    return l(
      await this.ask(a.INTRO_REQ, [a.INTRO_ACK], U(new d(2 + t.length * 2), t)),
    );
  }
  async replaceManagement(t) {
    const n = new d(5)
      .writeC(t.authority)
      .writeC(t.rankLimit)
      .writeC(t.maxAge)
      .writeC(t.minAge)
      .writeC(t.join);
    return l(await this.ask(a.MANAGE_REQ, [a.MANAGE_ACK], n));
  }
  roomInvite(t) {
    this.conn.send(a.ROOM_INVITE_REQ, new d(8).writeQ(BigInt(t)));
  }
  pageChat(t) {
    const n = new d(4 + t.length * 2).writeH(8);
    (x(n, t), this.conn.send(a.PAGE_CHAT_REQ, n));
  }
  async invite() {
    return l(await this.ask(a.INVITE_REQ, [a.INVITE_ACK]));
  }
  async inviteAccept(t, n) {
    const s = await this.ask(
      a.INVITE_ACCEPT_REQ,
      [a.INVITE_ACCEPT_ERR_ACK, a.INVITE_RESULT_PUSH],
      new d(5).writeD(t).writeC(n ? 1 : 0),
    );
    return l(s);
  }
  async clanNote(t, n) {
    const s = new d(2 + n.length * 2).writeC(t);
    return (U(s, n), this.countAck(a.NOTE_REQ, a.NOTE_ACK, s));
  }
  async createCondition() {
    return u(0, Fe(await this.ask(a.CONDITION_REQ, [a.CONDITION_ACK])));
  }
  async checkDuplicate() {
    return l(await this.ask(a.DUPLICATE_REQ, [a.DUPLICATE_ACK]));
  }
  async countAck(t, n, s) {
    return pe((await this.ask(t, [n], s)).readD());
  }
}
const N = {
    SEND_REQ: 1921,
    SEND_ACK: 1922,
    LIST_ACK: 1925,
    READ_REQ: 1926,
    DELETE_REQ: 1928,
    DELETE_ACK: 1929,
    REPLY_REQ: 1930,
    RECEIVE_ACK: 1931,
  },
  ze = { FULL: 2147487871, FAIL: 2147483648 },
  p = {
    NORMAL: 0,
    NORMAL_ASK: 1,
    GIFT: 2,
    WEB: 3,
    CLAN: 4,
    CLAN_ASK: 5,
    CLAN_ASK_WIRE: 6,
  },
  Xe = { READ: 0, UNREAD: 1 },
  $e = 7,
  Ze = (e) =>
    e === p.NORMAL || e === p.NORMAL_ASK || e === p.WEB || e === p.CLAN,
  B = 2147483648,
  Ve = (e) => e === p.CLAN_ASK || e === p.CLAN_ASK_WIRE,
  et = (e) => Number(BigInt.asUintN(32, e.senderId));
function W(e) {
  let t = "";
  for (;;) {
    const n = e.readH();
    if (n === 0) return t;
    t += String.fromCharCode(n);
  }
}
function ee(e, t) {
  const n = e.readC(),
    s = e.readC(),
    r = e.readU(n * 2);
  if (t !== p.CLAN && !Ve(t)) return { sender: r, text: W(e), clanNote: 0 };
  if (s > 0) return { sender: r, text: W(e), clanNote: 0 };
  const i = e.readH(),
    o = e.readH();
  if (o >= 4 && o <= 6) {
    const c = e.readU((i - 1) * 2);
    return (e.readC(), { sender: r, text: c, clanNote: o });
  }
  return (e.skip(4), { sender: r, text: "", clanNote: o });
}
function te(e) {
  const t = e.readD(),
    n = e.readQ(),
    s = e.readC(),
    r = e.readC(),
    i = e.readC(),
    o = e.readD();
  return { id: t, senderId: n, type: s, state: r, days: i, clanId: o };
}
function tt(e) {
  e.readC();
  const t = e.readC();
  return Array.from({ length: t }, () => te(e)).map((s) => ({
    ...s,
    ...ee(e, s.type),
  }));
}
function Ge(e) {
  const t = te(e);
  return { ...t, ...ee(e, t.type) };
}
async function nt(e, t, n) {
  const s = e.waitFor(N.SEND_ACK, 5e3).then(
      (i) => i.readD(),
      () => B,
    ),
    r = new d(2 + (t.length + n.length) * 2)
      .writeC(t.length)
      .writeC(n.length)
      .writeU(t, t.length * 2)
      .writeU(n, n.length * 2);
  return (e.send(N.SEND_REQ, r), s);
}
async function st(e, t, n) {
  const s = e.waitFor(N.SEND_ACK, 5e3).then(
    (r) => r.readD(),
    () => B,
  );
  return (
    e.send(
      N.REPLY_REQ,
      new d(11 + n.length * 2)
        .writeQ(t)
        .writeC(n.length)
        .writeU(n, n.length * 2),
    ),
    s
  );
}
async function at(e, t, n) {
  const s = await new ve(e).inviteAccept(t.clanId, n);
  return (xe(e, [t.id]), { ok: s.ok, err: s.err });
}
const rt = (e) => [...e].reverse();
function xe(e, t) {
  const n = new d(1 + t.length * 4).writeC(t.length);
  for (const s of t) n.writeD(s);
  e.send(N.READ_REQ, n);
}
async function it(e, t) {
  const n = e.waitFor(N.DELETE_ACK, 5e3).then(
      (r) => r.readD(),
      () => B,
    ),
    s = new d(1 + t.length * 4).writeC(t.length);
  for (const r of t) s.writeD(r);
  return (e.send(N.DELETE_REQ, s), n);
}
class We {
  list = [];
  off = null;
  subs = new Set();
  set(t) {
    ((this.list = t), this.emit());
  }
  attach(t) {
    (this.detach(),
      (this.off = t.on((n, s) => {
        if (n !== N.RECEIVE_ACK) return;
        const r = Ge(new Q(s.data.slice(s.pos)));
        ((this.list = [...this.list.filter((i) => i.id !== r.id), r]),
          this.emit());
      })));
  }
  detach() {
    (this.off?.(), (this.off = null));
  }
  mark(t, n, s) {
    ((this.list = this.list.map((r) =>
      t.includes(r.id) ? { ...r, state: n, days: s ?? r.days } : r,
    )),
      this.emit());
  }
  remove(t) {
    ((this.list = this.list.filter((n) => !t.includes(n.id))), this.emit());
  }
  subscribe(t) {
    return (this.subs.add(t), () => this.subs.delete(t));
  }
  emit() {
    for (const t of this.subs) t();
  }
}
const ot = new We();
export {
  _ as A,
  j as B,
  ve as C,
  N as D,
  tt as E,
  he as F,
  Je as G,
  ze as N,
  d as P,
  $e as R,
  Q as a,
  le as b,
  _e as c,
  J as d,
  we as e,
  Ae as f,
  Te as g,
  De as h,
  nt as i,
  p as j,
  et as k,
  Ve as l,
  Xe as m,
  ot as n,
  Ze as o,
  xe as p,
  rt as q,
  st as r,
  fe as s,
  at as t,
  it as u,
  Re as v,
  je as w,
  qe as x,
  G as y,
  Ye as z,
};
