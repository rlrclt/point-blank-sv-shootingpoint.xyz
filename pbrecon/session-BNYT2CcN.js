import { _ as re } from "./preload-helper-CLcXU_4U.js";
import {
  bA as q,
  bB as L,
  bC as C,
  bD as J,
  bE as K,
  bk as _,
  bF as x,
  bc as ie,
} from "./voice-C8jYGp6t.js";
import { a4 as ae } from "./roomClient-DHZFwrSZ.js";
import { b as R } from "./language-CGImk_RO.js";
import "./vendor-three-BL04HsGo.js";
import "./noteClient-Diy66me5.js";
import "./frameEnv-BBzonJVb.js";
import "./avatarCombat-Cn0Sf-BG.js";
import "./deviceProfile-BbMjcetF.js";
import "./qualityTier-ox0sz1dC.js";
import "./levelCache-BBQB85vx.js";
import "./assetMap-CgwVrQUz.js";
import "./ktx2-BurdhfpX.js";
import "./matchHandles-DDRISjpa.js";
import "./pbLighting-CAdVN-gf.js";
import "./settings-JwaLg-ci.js";
import "./pbConfig-BTAdk4SQ.js";
import "./jsonOnce-wOxh8pA7.js";
import "./switch-B4AFZRxn.js";
import "./accessoryMount-vWra_6Ct.js";
import "./heroRank-BfA3QP1E.js";
import "./audioUrl-Bd_dPWJx.js";
import "./config-TO6a17NM.js";
import "./i18n-CSbTfxpT.js";
import "./assets-Bz3hisdZ.js";
import "./maintenance-oGso2NiD.js";
import "./pcGuns-C2EjMTvP.js";
import "./testBots-WllQD4W5.js";
const le = 5132,
  ce = 5138,
  he = 5140,
  de = 5153,
  ue = 3;
class fe {
  off;
  startTick = 0;
  spawned = new Set();
  restored = new Set();
  sync;
  room;
  replay() {
    for (const e of this.room.respawnAcks.values())
      this.inBattle(e.slot) && !this.restored.has(e.slot) && this.sync(e, 2);
  }
  exportState() {
    return { spawned: [...this.spawned] };
  }
  inBattle(e) {
    const t = this.room.slots[e]?.state;
    return t === void 0 || t >= 14;
  }
  replaySlot(e) {
    if (this.restored.delete(e)) return;
    const t = this.room.respawnAcks.get(e);
    t && this.inBattle(e) && this.sync(t, 2);
  }
  constructor(e, t, s, i = {}) {
    if (t.restored) {
      this.startTick = t.restored.startTick;
      for (const n of t.restored.slots) this.restored.add(n);
      for (const n of i.spawned ?? []) this.spawned.add(n);
    }
    const o = () => (this.startTick ||= Date.now());
    ((this.sync = (n, a) => {
      (t.respawn({
        uniqueRoomId: s.uniqueRoomId,
        roomSeed: s.roomSeed,
        startTick: o(),
        type: a ?? (this.spawned.has(n.slot) ? 2 : 0),
        round: e.round,
        slot: n.slot,
        respawnCount: n.slotSpawns & 255,
        accountId: n.slot === s.slot ? s.accountId : void 0,
        charaId: n.chara,
        weapons: {
          primary: n.weapons.primary,
          secondary: n.weapons.secondary,
          melee: n.weapons.melee,
          explosive: n.weapons.grenade,
          special: n.weapons.special,
        },
        accessory: n.accessory ?? 0,
      }),
        this.spawned.add(n.slot));
    }),
      (this.room = e),
      (this.off = e.game.conn.on((n, a) => {
        if (n === le) o();
        else if (n === ce) {
          let l;
          try {
            l = ae(a);
          } catch {
            return;
          }
          this.sync(l);
        } else if (n === he) (t.end("ENDBATTLE"), i.onEnd?.());
        else if (n === de)
          try {
            const l = a.readC();
            (a.readD(), a.readD(), t.round(l, a.readC() !== 0));
          } catch {}
      })),
      (t.onGame = (n) => this.fromMatch(n, e, i)));
  }
  fromMatch(e, t, s) {
    if (e.t === "death") {
      if (e.killerSlot !== t.mySlot) return;
      for (const i of e.deaths)
        s.reportKill?.(
          i.slot,
          e.weaponId,
          i.deathType === ue,
          e.killerPos,
          i.pos,
        );
    } else
      e.t === "sabotage"
        ? t.isLeader && t.generatorInfo(e.bar1, e.bar2, e.slotDamage)
        : e.t !== "ping" && console.debug("[p2p host] match -> game", e);
  }
  dispose() {
    this.off();
  }
}
class pe {
  id;
  label;
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  closeCode = 0;
  state = 0;
  host;
  constructor(e, t, s) {
    ((this.host = e), (this.id = t), (this.label = s));
  }
  get isOpen() {
    return this.state === 1;
  }
  send(e, t) {
    this.state === 1 && this.host.post({ t: "dgram", id: this.id, data: e });
  }
  close() {
    this.state !== 3 &&
      (this.host.post({ t: "close", id: this.id }), this.closed(1e3, "closed"));
  }
  opened() {
    this.state === 0 && ((this.state = 1), this.onopen?.());
  }
  closed(e, t) {
    this.state !== 3 &&
      ((this.state = 3), (this.closeCode = e), this.onclose?.(`${e} ${t}`));
  }
}
class P {
  peers = new Map();
  nextId = 1;
  worker;
  statsWaiters = [];
  snapshotWaiters = [];
  restored = null;
  onGame = null;
  onCheat = null;
  onLog = (e) => console.debug(`[p2p host] ${e}`);
  constructor(e) {
    this.worker = e;
  }
  static browserWorker() {
    return new Worker(new URL("/bundle/worker-urm1rOLP.js", import.meta.url), {
      type: "module",
      name: "pb-match-host",
    });
  }
  static start(e, t, s = 2e4) {
    return new Promise((i, o) => {
      const n = new P(e);
      let a = !0;
      const l = (d) => {
          a &&
            ((a = !1),
            clearTimeout(f),
            (e.onmessage = null),
            (e.onerror = null),
            e.terminate(),
            o(d));
        },
        f = setTimeout(
          () => l(new Error("p2p host: the match worker did not start")),
          s,
        );
      ((e.onmessage = (d) => {
        const u = d.data;
        switch (u.t) {
          case "ready":
            if (!a) break;
            ((a = !1),
              clearTimeout(f),
              (n.restored = u.restored ?? null),
              i(n));
            break;
          case "snapshot":
            for (const p of n.snapshotWaiters.splice(0)) p(u.snapshot);
            break;
          case "dgram":
            n.peers.get(u.id)?.onmessage?.(u.data, u.rel);
            break;
          case "close": {
            const p = n.peers.get(u.id);
            (n.peers.delete(u.id), p?.closed(u.code, u.reason));
            break;
          }
          case "game":
            n.onGame?.(u.m);
            break;
          case "cheat":
            n.onCheat?.(u.e);
            break;
          case "log":
            n.onLog?.(u.line);
            break;
          case "stats":
            for (const p of n.statsWaiters.splice(0)) p(u.stats);
            break;
          case "error":
            a
              ? l(new Error(`p2p host: ${u.message}`))
              : console.warn(`[p2p host] worker: ${u.message}`);
            break;
        }
      }),
        (e.onerror = (d) =>
          l(new Error(`p2p host: worker error ${d.message}`))));
      try {
        e.postMessage({ t: "start", ...t });
      } catch (d) {
        l(d instanceof Error ? d : new Error(String(d)));
      }
    });
  }
  peer(e, t) {
    const s = new pe(this, this.nextId++, e);
    return (
      this.peers.set(s.id, s),
      this.post({
        t: "open",
        id: s.id,
        label: e,
        ...(t !== void 0 ? { slot: t } : {}),
      }),
      queueMicrotask(() => s.opened()),
      s
    );
  }
  respawn(e) {
    this.post({ t: "respawn", s: e });
  }
  removePlayer(e, t = 1) {
    this.post({ t: "remove", slot: e, type: t });
  }
  round(e, t) {
    this.post({ t: "round", round: e, teamSwap: t });
  }
  end(e) {
    this.post({ t: "end", reason: e });
  }
  stats() {
    return new Promise((e) => {
      (this.statsWaiters.push(e), this.post({ t: "stats" }));
    });
  }
  snapshot(e = 2e3) {
    return new Promise((t, s) => {
      const i = setTimeout(
        () =>
          s(
            new Error("p2p host: the match worker did not answer the snapshot"),
          ),
        e,
      );
      (this.snapshotWaiters.push((o) => {
        (clearTimeout(i), t(o));
      }),
        this.post({ t: "snapshot" }));
    });
  }
  post(e) {
    this.worker.postMessage(e);
  }
  stop() {
    for (const e of this.peers.values()) e.closed(1001, "host stopped");
    (this.peers.clear(), this.worker.terminate());
  }
}
const F = "state",
  X = "rel",
  ye = { ordered: !1, maxRetransmits: 0 },
  me = { ordered: !0 },
  W = 64 * 1024,
  U = 8096,
  Y = (r, e) => JSON.stringify({ t: "_close", code: r, reason: e });
function z(r) {
  try {
    const e = JSON.parse(r);
    return e.t !== "_close"
      ? null
      : {
          code: typeof e.code == "number" ? e.code : 1e3,
          reason: typeof e.reason == "string" ? e.reason : "",
        };
  } catch {
    return null;
  }
}
function E(r) {
  return r instanceof ArrayBuffer
    ? new Uint8Array(r)
    : ArrayBuffer.isView(r)
      ? new Uint8Array(r.buffer, r.byteOffset, r.byteLength)
      : null;
}
const A = 17,
  D = 0,
  v = 1,
  $ = 2,
  Q = 3;
function we(r, e, t) {
  if (
    !/^[0-9a-f]{32}$/.test(r) ||
    !Number.isInteger(e) ||
    e < 0 ||
    e > 3 ||
    t.length > U
  )
    throw new Error("invalid relay frame");
  const s = new Uint8Array(A + t.length);
  for (let i = 0; i < 16; i++) s[i] = parseInt(r.slice(i * 2, i * 2 + 2), 16);
  return ((s[16] = e), s.set(t, A), s);
}
function ge(r) {
  const e = E(r);
  if (!e || e.length < A || e.length > A + U || e[16] > 3) return null;
  let t = "";
  for (let s = 0; s < 16; s++) t += e[s].toString(16).padStart(2, "0");
  return { sid: t, kind: e[16], data: e.subarray(A) };
}
class be {
  guests = new Map();
  used = new Set();
  onGuest = null;
  onVoice = null;
  sig;
  log;
  constructor(e, t, s, i, o, n) {
    ((this.sig = t),
      (this.log = n),
      (t.onRelayOffer = (a, l) => {
        if (
          !t.relayAnswer ||
          !t.relayData ||
          this.used.has(a) ||
          !s(l) ||
          !o()
        ) {
          t.bye(a);
          return;
        }
        (this.used.add(a), i(l), this.dropSlot(l));
        const f = e.peer(`relay:slot${l}`, l),
          d = { sid: a, slot: l, peer: f, voiceRate: new q(), joined: !1 };
        (this.guests.set(a, d),
          (f.onmessage = (p, y) => {
            t.relayData?.(a, y ? v : D, p) === !1 &&
              this.drop(a, "relay send failed");
          }),
          (f.onclose = () => {
            this.guests.get(a) === d &&
              (t.relayData?.(
                a,
                Q,
                new TextEncoder().encode(
                  Y(
                    f.closeCode || 1e3,
                    f.closeCode === 1001 ? "match over" : "closed by the host",
                  ),
                ),
              ),
              setTimeout(() => this.drop(a, "match closed"), 500));
          }));
        const u = () => {
          d.joined ||
            this.guests.get(a) !== d ||
            ((d.joined = !0),
            t.relayAnswer?.(a),
            this.log(`slot ${l} connected through the web relay`),
            this.onGuest?.(l, !0));
        };
        ((f.onopen = u), f.isOpen && u());
      }),
      (t.onRelayData = (a) => {
        const l = this.guests.get(a.sid);
        if (!(!l?.peer.isOpen || !s(l.slot)))
          if (a.kind === $) {
            if (!l.voiceRate.allow(performance.now())) return;
            const f = L(a.data, l.slot);
            f && this.onVoice?.(l.slot, f);
          } else
            (a.kind === D || a.kind === v) &&
              l.peer.send(a.data.slice(), a.kind === v);
      }));
  }
  get count() {
    return this.guests.size;
  }
  slots() {
    return [...this.guests.values()].filter((e) => e.joined).map((e) => e.slot);
  }
  sendVoice(e, t) {
    if (C(e))
      for (const s of this.guests.values())
        s.peer.isOpen && t(s.slot) && this.sig.relayData?.(s.sid, $, e);
  }
  dropSlot(e) {
    for (const t of [...this.guests.values()])
      t.slot === e && this.drop(t.sid, "replaced");
  }
  drop(e, t, s = !0) {
    const i = this.guests.get(e);
    i &&
      (this.guests.delete(e),
      i.peer.isOpen && i.peer.close(),
      s && this.sig.bye(e),
      this.log(`slot ${i.slot} relay disconnected: ${t}`),
      i.joined && this.onGuest?.(i.slot, !1));
  }
  close(e) {
    for (const t of [...this.guests.keys()]) this.drop(t, e);
  }
}
const M = 17;
class Se {
  guests = new Map();
  used = new Set();
  host;
  sig;
  ice;
  PC;
  allowSlot;
  log;
  relay;
  onGuest = null;
  onVoice = null;
  constructor(e, t, s, i = {}) {
    ((this.host = e),
      (this.sig = t),
      (this.ice = s),
      (this.PC = i.RTCPeerConnection ?? globalThis.RTCPeerConnection),
      (this.allowSlot = i.allowSlot ?? (() => !0)),
      (this.log = i.log ?? ((o) => console.log(`[p2p] ${o}`))),
      (this.relay = new be(
        e,
        t,
        this.allowSlot,
        (o) => {
          for (const n of [...this.guests.values()])
            n.slot === o && this.drop(n.sid, "switching to web relay");
        },
        () => this.count < M,
        this.log,
      )),
      (this.relay.onGuest = (o, n) => this.onGuest?.(o, n)),
      (this.relay.onVoice = (o, n) => this.onVoice?.(o, n)),
      (t.onClose = () => this.relay.close("signaling connection lost")),
      (t.onOffer = (o) => {
        this.offer(o).catch((n) => {
          (this.log(`offer from slot ${o.slot} failed: ${n.message}`),
            this.drop(o.sid, "bad offer"));
        });
      }),
      (t.onCandidate = (o, n) => {
        const a = this.guests.get(o);
        a &&
          (a.remoteSet
            ? a.pc.addIceCandidate(n).catch(() => {})
            : a.pending.push(n));
      }),
      (t.onBye = (o) => {
        (this.drop(o, "guest bye", !1), this.relay.drop(o, "guest bye", !1));
      }),
      t.flush?.());
  }
  get count() {
    return this.guests.size + this.relay.count;
  }
  slots() {
    return [...this.guests.values()]
      .filter((e) => e.peer)
      .map((e) => e.slot)
      .concat(this.relay.slots());
  }
  async offer(e) {
    if (this.used.has(e.sid) || this.count >= M || !this.allowSlot(e.slot)) {
      (this.log(
        `refused offer from slot ${e.slot}${this.allowSlot(e.slot) ? "" : " (not in this battle)"}`,
      ),
        this.sig.bye(e.sid));
      return;
    }
    (this.used.add(e.sid), this.relay.dropSlot(e.slot));
    for (const i of [...this.guests.values()])
      i.slot === e.slot && this.drop(i.sid, "replaced by a new attempt");
    const t = new this.PC(this.ice),
      s = {
        sid: e.sid,
        slot: e.slot,
        pc: t,
        state: null,
        rel: null,
        voice: null,
        voiceRate: new q(),
        peer: null,
        remoteSet: !1,
        pending: [],
      };
    (this.guests.set(e.sid, s),
      (t.onicecandidate = (i) => {
        i.candidate && this.sig.candidate(e.sid, i.candidate.toJSON());
      }),
      (t.onconnectionstatechange = () => {
        (t.connectionState === "failed" || t.connectionState === "closed") &&
          this.drop(e.sid, `connection ${t.connectionState}`);
      }),
      (t.ondatachannel = (i) => {
        const o = i.channel;
        if (o.label === J && !s.voice) {
          ((s.voice = o),
            (o.binaryType = "arraybuffer"),
            (o.onmessage = (n) => {
              if (!s.peer?.isOpen || !this.allowSlot(s.slot)) return;
              const a = E(n.data);
              if (!a || !s.voiceRate.allow(performance.now())) return;
              const l = L(a, s.slot);
              l && this.onVoice?.(s.slot, l);
            }));
          return;
        }
        if (o.label === F && !s.state) s.state = o;
        else if (o.label === X && !s.rel) s.rel = o;
        else {
          o.close();
          return;
        }
        ((o.binaryType = "arraybuffer"),
          (o.onopen = () => this.maybeJoin(s)),
          (o.onclose = () => this.drop(s.sid, `${o.label} channel closed`)),
          (o.onmessage = (n) => this.fromGuest(s, n.data)),
          o.readyState === "open" && this.maybeJoin(s));
      }),
      await t.setRemoteDescription({ type: "offer", sdp: e.sdp }),
      (s.remoteSet = !0));
    for (const i of s.pending.splice(0)) t.addIceCandidate(i).catch(() => {});
    (await t.setLocalDescription(await t.createAnswer()),
      this.guests.get(e.sid) === s &&
        this.sig.answer(e.sid, t.localDescription.sdp));
  }
  maybeJoin(e) {
    if (
      e.peer ||
      e.state?.readyState !== "open" ||
      e.rel?.readyState !== "open" ||
      this.guests.get(e.sid) !== e
    )
      return;
    const t = (e.peer = this.host.peer(`p2p:slot${e.slot}`, e.slot));
    ((t.onmessage = (s, i) => this.toGuest(e, s, i)),
      (t.onclose = () => {
        if (this.guests.get(e.sid) === e) {
          try {
            e.rel?.readyState === "open" &&
              e.rel.send(
                Y(
                  t.closeCode || 1e3,
                  t.closeCode === 1001 ? "match over" : "closed by the host",
                ),
              );
          } catch {}
          setTimeout(
            () => this.drop(e.sid, `closed by the match (${t.closeCode})`),
            500,
          );
        }
      }),
      this.log(`slot ${e.slot} connected (${this.slots().length} guest(s))`),
      this.onGuest?.(e.slot, !0));
  }
  fromGuest(e, t) {
    if (!e.peer?.isOpen) return;
    const s = E(t);
    if (s) {
      if (s.length > U) {
        this.drop(e.sid, "datagram too big");
        return;
      }
      try {
        e.peer.send(s.slice(), !1);
      } catch {
        this.drop(e.sid, "send to the match failed");
      }
    }
  }
  toGuest(e, t, s) {
    try {
      s
        ? e.rel?.readyState === "open" && e.rel.send(t)
        : e.state?.readyState === "open" &&
          e.state.bufferedAmount < W &&
          e.state.send(t);
    } catch {
      this.drop(e.sid, `${s ? "rel" : "state"} send failed`);
    }
  }
  sendVoice(e, t) {
    if (C(e)) {
      this.relay.sendVoice(e, t);
      for (const s of this.guests.values())
        if (
          s.peer?.isOpen &&
          t(s.slot) &&
          s.voice?.readyState === "open" &&
          s.voice.bufferedAmount < K
        )
          try {
            s.voice.send(e);
          } catch {}
    }
  }
  drop(e, t, s = !0) {
    const i = this.guests.get(e);
    if (i) {
      (this.guests.delete(e), i.peer?.isOpen && i.peer.close());
      try {
        i.pc.close();
      } catch {}
      (s && !i.peer && this.sig.bye(e),
        this.log(
          `slot ${i.slot} ${i.peer ? "disconnected" : "not connected"}: ${t}`,
        ),
        i.peer && this.onGuest?.(i.slot, !1));
    }
  }
  dropGuests(e) {
    this.relay.close(e);
    for (const t of [...this.guests.keys()]) this.drop(t, e);
  }
  close() {
    (this.dropGuests("host closing"), this.sig.close());
  }
}
function Z() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (r) =>
    r.toString(16).padStart(2, "0"),
  ).join("");
}
const ee = (r, e) => `${(r >>> 0).toString(16)}-${(e >>> 0).toString(16)}`;
class H {
  onRelayOffer = null;
  onRelayReady = null;
  onRelayData = null;
  relaySupported = !1;
  onOffer = null;
  onCandidate = null;
  onBye = null;
  onAnswer = null;
  onError = (e, t) =>
    console.warn(`[p2p] signaling: ${e}${t ? ` (${t.slice(0, 8)})` : ""}`);
  onClose = null;
  onHandoff = null;
  ready;
  hostOnline = !1;
  ws;
  stopped = !1;
  reconnectTimer = null;
  hostWaiters = [];
  queue = [];
  authed = !1;
  backlog = [];
  constructor(e, t, s, i, o = "") {
    const n = `${e.replace(/\/$/, "")}/signal?room=${encodeURIComponent(t)}&role=${s}&slot=${i}`;
    ((this.ready = new Promise((a, l) => {
      let f = !1,
        d = 0;
      const u = () => {
        if (this.stopped) return;
        const p = new WebSocket(n);
        ((this.ws = p),
          (p.binaryType = "arraybuffer"),
          (this.authed = !1),
          (p.onopen = () => {
            !this.stopped &&
              this.ws === p &&
              p.send(JSON.stringify({ t: "auth", ticket: o }));
          }),
          (p.onmessage = (y) => {
            if (this.stopped || this.ws !== p) return;
            if (typeof y.data != "string") {
              const b = ge(y.data);
              b && this.onRelayData?.(b);
              return;
            }
            let m;
            try {
              m = JSON.parse(String(y.data));
            } catch {
              return;
            }
            (m.t === "ready" && ((f = !0), (d = 0)), this.dispatch(m, a));
          }),
          (p.onerror = () =>
            l(new Error(`p2p: signaling WebSocket error (${n})`))),
          (p.onclose = (y) => {
            if (this.ws !== p) return;
            ((this.authed = !1),
              this.setHost(!1),
              (this.queue = []),
              (this.backlog = []),
              l(new Error(`p2p: signaling closed (${y.code} ${y.reason})`)),
              this.onClose?.(`${y.code} ${y.reason}`));
            const m = [1003, 1008, 4e3, 4001, 4003, 4004, 4005, 4010].includes(
              y.code,
            );
            if (!this.stopped && s === "host" && f && !m) {
              const b = Math.min(500 * 2 ** Math.min(d++, 5), 1e4);
              this.reconnectTimer = setTimeout(() => {
                ((this.reconnectTimer = null), u());
              }, b);
            }
          }));
      };
      u();
    })),
      this.ready.catch(() => {}));
  }
  dispatch(e, t) {
    const s = () => {
      this.backlog.push(e);
    };
    switch (e.t) {
      case "ready":
        ((this.authed = !0),
          (this.relaySupported = e.relay === !0),
          this.setHost(e.hostOnline));
        for (const i of this.queue.splice(0)) this.ws.send(i);
        t?.(e.ice ?? []);
        break;
      case "host":
        this.setHost(e.online);
        break;
      case "relay-offer":
        this.onRelayOffer ? this.onRelayOffer(e.sid, e.slot) : s();
        break;
      case "relay-answer":
        this.onRelayReady ? this.onRelayReady(e.sid) : s();
        break;
      case "offer":
        this.onOffer
          ? this.onOffer({ sid: e.sid, sdp: e.sdp, slot: e.slot })
          : s();
        break;
      case "answer":
        this.onAnswer ? this.onAnswer(e.sid, e.sdp) : s();
        break;
      case "ice":
        if (!e.c || typeof e.c.candidate != "string") break;
        this.onCandidate ? this.onCandidate(e.sid, e.c) : s();
        break;
      case "bye":
        this.onBye ? this.onBye(e.sid) : s();
        break;
      case "handoff":
        this.onHandoff ? this.onHandoff(e) : s();
        break;
      case "error":
        this.onError?.(e.err, e.sid);
        break;
    }
  }
  flush() {
    for (const e of this.backlog.splice(0)) this.dispatch(e);
  }
  setHost(e) {
    if (((this.hostOnline = e), e))
      for (const t of this.hostWaiters.splice(0)) t();
  }
  hostReady(e = 3e4) {
    return this.ready.then(() =>
      this.hostOnline
        ? void 0
        : new Promise((t, s) => {
            const i = setTimeout(
              () =>
                s(
                  new Error(
                    `p2p: the room leader is not hosting (no host on /signal within ${e} ms)`,
                  ),
                ),
              e,
            );
            this.hostWaiters.push(() => {
              (clearTimeout(i), t());
            });
          }),
    );
  }
  send(e) {
    const t = JSON.stringify(e);
    this.ws.readyState === WebSocket.OPEN && this.authed
      ? this.ws.send(t)
      : (this.ws.readyState === WebSocket.CONNECTING ||
          this.ws.readyState === WebSocket.OPEN) &&
        this.queue.push(t);
  }
  offer(e, t) {
    this.send({ t: "offer", sid: e, sdp: t });
  }
  answer(e, t) {
    this.send({ t: "answer", sid: e, sdp: t });
  }
  candidate(e, t) {
    this.send({ t: "ice", sid: e, c: t });
  }
  bye(e) {
    this.send({ t: "bye", sid: e });
  }
  relayOffer(e) {
    this.send({ t: "relay-offer", sid: e });
  }
  relayAnswer(e) {
    this.send({ t: "relay-answer", sid: e });
  }
  relayData(e, t, s) {
    if (this.stopped || !this.authed || this.ws.readyState !== WebSocket.OPEN)
      return !1;
    if ((t === D || t === $) && this.ws.bufferedAmount > W) return !0;
    if (this.ws.bufferedAmount > 1024 * 1024) return !1;
    try {
      return (this.ws.send(we(e, t, s)), !0);
    } catch {
      return !1;
    }
  }
  handoff(e, t) {
    this.send({ t: "handoff", to: e, x: t.x, i: t.i, n: t.n, blob: t.blob });
  }
  close() {
    ((this.stopped = !0),
      this.reconnectTimer !== null && clearTimeout(this.reconnectTimer),
      (this.reconnectTimer = null),
      (this.queue = []));
    try {
      this.ws.close(1e3, "done");
    } catch {}
  }
}
class V {
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  open = !1;
  done = !1;
  pc;
  state;
  rel;
  voice;
  onvoice = null;
  constructor(e) {
    ((this.pc = e),
      (this.state = e.createDataChannel(F, ye)),
      (this.rel = e.createDataChannel(X, me)),
      (this.voice = e.createDataChannel(J, { ordered: !1, maxRetransmits: 0 })),
      (this.voice.binaryType = "arraybuffer"),
      (this.voice.onmessage = (t) => {
        const s = E(t.data);
        s && this.isOpen && C(s) && this.onvoice?.(s);
      }));
  }
  static connect(e, t, s = {}) {
    const i = s.RTCPeerConnection ?? globalThis.RTCPeerConnection,
      o = new V(new i(t)),
      n = Z(),
      a = [],
      l = [];
    let f = !1,
      d = !1;
    return new Promise((u, p) => {
      let y = !1;
      const m = (h) => {
          if (y) {
            o.fail(h.message);
            return;
          }
          ((y = !0), clearTimeout(b), p(h), f && e.bye(n), o.fail(h.message));
        },
        b = setTimeout(
          () => m(new Error("p2p: WebRTC link timeout (NAT without TURN?)")),
          s.timeoutMs ?? 2e4,
        ),
        O = () => {
          o.open ||
            o.done ||
            o.state.readyState !== "open" ||
            o.rel.readyState !== "open" ||
            ((o.open = !0), (y = !0), clearTimeout(b), u(o));
        };
      for (const h of [o.state, o.rel])
        ((h.binaryType = "arraybuffer"),
          (h.onopen = O),
          (h.onclose = () => m(new Error(`p2p: ${h.label} channel closed`))),
          (h.onmessage = (w) => {
            if (typeof w.data == "string") {
              const g = h === o.rel ? z(w.data) : null;
              g && o.fail(`${g.code} ${g.reason}`);
              return;
            }
            const c = E(w.data);
            c && o.onmessage?.(c, h === o.rel);
          }));
      ((o.pc.onicecandidate = (h) => {
        if (o.done || !h.candidate) return;
        const w = h.candidate.toJSON();
        f ? e.candidate(n, w) : l.push(w);
      }),
        (o.pc.onconnectionstatechange = () => {
          (o.pc.connectionState === "failed" ||
            o.pc.connectionState === "closed") &&
            m(new Error(`p2p: WebRTC connection ${o.pc.connectionState}`));
        }),
        (e.onAnswer = (h, w) => {
          h !== n ||
            o.done ||
            o.pc
              .setRemoteDescription({ type: "answer", sdp: w })
              .then(() => {
                d = !0;
                for (const c of a.splice(0))
                  o.pc.addIceCandidate(c).catch(() => {});
              })
              .catch((c) => m(c instanceof Error ? c : new Error(String(c))));
        }),
        (e.onCandidate = (h, w) => {
          h !== n ||
            o.done ||
            (d ? o.pc.addIceCandidate(w).catch(() => {}) : a.push(w));
        }),
        (e.onBye = (h) => {
          h !== n ||
            o.open ||
            m(
              new Error(
                "p2p: the host refused the link (slot not in the battle?)",
              ),
            );
        }),
        e.flush?.(),
        o.pc
          .createOffer()
          .then((h) => o.pc.setLocalDescription(h))
          .then(() => {
            if (!o.done) {
              ((f = !0), e.offer(n, o.pc.localDescription.sdp));
              for (const h of l.splice(0)) e.candidate(n, h);
            }
          })
          .catch((h) => m(h instanceof Error ? h : new Error(String(h)))));
    });
  }
  get isOpen() {
    return this.open && !this.done;
  }
  sendVoice(e) {
    if (!(
      !this.isOpen ||
      !C(e) ||
      this.voice.readyState !== "open" ||
      this.voice.bufferedAmount > K
    ))
      try {
        this.voice.send(e);
      } catch {}
  }
  send(e, t) {
    if (!this.isOpen) return;
    const s = e;
    try {
      t
        ? this.rel.readyState === "open" && this.rel.send(s)
        : this.state.readyState === "open" &&
          this.state.bufferedAmount < W &&
          this.state.send(s);
    } catch {
      this.fail(`${t ? "rel" : "state"} send failed`);
    }
  }
  fail(e) {
    if (this.done) return;
    this.done = !0;
    const t = this.open;
    this.open = !1;
    try {
      this.pc.close();
    } catch {}
    t && this.onclose?.(e);
  }
  close() {
    setTimeout(() => this.fail("closed"), 200);
  }
}
class G {
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  onvoice = null;
  open = !1;
  done = !1;
  timer = null;
  rejectConnect = null;
  sid = Z();
  sig;
  constructor(e) {
    this.sig = e;
  }
  static connect(e, t = 5e3) {
    const s = new G(e);
    return new Promise((i, o) => {
      ((s.rejectConnect = o),
        (s.timer = setTimeout(
          () =>
            s.fail(
              R(
                "หมดเวลารอเส้นทางสำรอง กรุณาให้หัวห้องรีเฟรชหน้าเว็บแล้วลองอีกครั้ง",
                "Timed out waiting for the backup route. Ask the host to refresh the page and try again",
                "Waktu habis menunggu jalur cadangan. Minta host memuat ulang halaman lalu coba lagi",
              ),
            ),
          t,
        )),
        (e.onClose = (n) =>
          s.fail(
            R(
              `การเชื่อมต่อสำรองขาด (${n})`,
              `The backup connection dropped (${n})`,
              `Koneksi cadangan terputus (${n})`,
            ),
          )),
        (e.onBye = (n) => {
          n === s.sid &&
            s.fail(
              R(
                "หัวห้องปิดการเชื่อมต่อสำรอง",
                "The host closed the backup connection",
                "Host menutup koneksi cadangan",
              ),
            );
        }),
        (e.onRelayReady = (n) => {
          n !== s.sid ||
            s.done ||
            s.open ||
            ((s.open = !0),
            (s.rejectConnect = null),
            s.timer !== null && clearTimeout(s.timer),
            i(s));
        }),
        (e.onRelayData = (n) => {
          if (!(n.sid !== s.sid || !s.isOpen))
            if (n.kind === Q) {
              const a = z(new TextDecoder().decode(n.data));
              s.fail(
                a
                  ? `${a.code} ${a.reason}`
                  : R(
                      "หัวห้องปิดการเชื่อมต่อสำรอง",
                      "The host closed the backup connection",
                      "Host menutup koneksi cadangan",
                    ),
              );
            } else
              n.kind === $
                ? C(n.data) && s.onvoice?.(n.data)
                : s.onmessage?.(n.data, n.kind === v);
        }),
        e.flush(),
        e.relayOffer(s.sid));
    });
  }
  get isOpen() {
    return this.open && !this.done;
  }
  send(e, t) {
    this.isOpen &&
      !this.sig.relayData(this.sid, t ? v : D, e) &&
      this.fail(
        R(
          "เส้นทางสำรองขาดการเชื่อมต่อ",
          "The backup route lost its connection",
          "Jalur cadangan terputus",
        ),
      );
  }
  sendVoice(e) {
    this.isOpen && C(e) && this.sig.relayData(this.sid, $, e);
  }
  fail(e) {
    if (this.done) return;
    ((this.done = !0), this.timer !== null && clearTimeout(this.timer));
    const t = this.open;
    ((this.open = !1),
      this.rejectConnect?.(new Error(e)),
      (this.rejectConnect = null),
      this.sig.bye(this.sid),
      this.sig.close(),
      t && this.onclose?.(e));
  }
  close() {
    setTimeout(() => this.fail("closed"), 200);
  }
}
const Te = {},
  ke = "stun:stun.l.google.com:19302",
  Ce = (r) =>
    String(r ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
  Re = (r) => [r.urls].flat().some((e) => /^turns?:/.test(e));
function B(r = [], e = !1) {
  const t = Ce(Te?.VITE_STUN_URLS),
    s = [...r, ...(t.length ? [{ urls: t }] : [])];
  return (
    s.some((i) => [i.urls].flat().some((o) => /^stuns?:/.test(o))) ||
      s.unshift({ urls: ke }),
    e &&
      !s.some(Re) &&
      console.warn(
        "[p2p] relay only without a TURN server (TURN_URLS / CF_TURN_* on the server): the link will fail",
      ),
    { iceServers: s, iceTransportPolicy: e ? "relay" : "all" }
  );
}
const te = 1,
  I = 12e3,
  Ae = 4 * 1024 * 1024,
  se = 16,
  ve = (r) => {
    let e = "";
    for (let t = 0; t < r.length; t += 32768)
      e += String.fromCharCode(...r.subarray(t, t + 32768));
    return btoa(e);
  },
  Ee = (r) => Uint8Array.from(atob(r), (e) => e.charCodeAt(0));
async function oe(r, e, t = 1 / 0) {
  const s = e.writable.getWriter();
  s.write(r)
    .then(() => s.close())
    .catch(() => {});
  const i = [];
  let o = 0;
  const n = e.readable.getReader();
  for (;;) {
    const { value: f, done: d } = await n.read();
    if (d) break;
    if (((o += f.length), o > t))
      throw (n.cancel(), new Error("handoff: snapshot too big"));
    i.push(f);
  }
  const a = new Uint8Array(o);
  let l = 0;
  for (const f of i) (a.set(f, l), (l += f.length));
  return a;
}
const $e = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (r) =>
    r.toString(16).padStart(2, "0"),
  ).join("");
async function Oe(r) {
  const e = ve(
      await oe(
        new TextEncoder().encode(JSON.stringify(r)),
        new CompressionStream("gzip"),
      ),
    ),
    t = Math.max(1, Math.ceil(e.length / I));
  if (t > se) throw new Error(`handoff: snapshot needs ${t} frames`);
  const s = $e();
  return Array.from({ length: t }, (i, o) => ({
    x: s,
    i: o,
    n: t,
    blob: e.slice(o * I, (o + 1) * I),
  }));
}
class _e {
  x = "";
  chunks = [];
  done = !1;
  add(e) {
    return this.done ||
      typeof e.x != "string" ||
      !Number.isInteger(e.i) ||
      !Number.isInteger(e.n) ||
      e.n < 1 ||
      e.n > se ||
      e.i < 0 ||
      e.i >= e.n ||
      typeof e.blob != "string" ||
      ((e.x !== this.x || this.chunks.length !== e.n) &&
        ((this.x = e.x), (this.chunks = new Array(e.n).fill(void 0))),
      (this.chunks[e.i] = e.blob),
      this.chunks.some((t) => t === void 0))
      ? Promise.resolve(null)
      : ((this.done = !0), Pe(this.chunks.join("")));
  }
}
async function Pe(r) {
  const e = JSON.parse(
    new TextDecoder().decode(
      await oe(Ee(r), new DecompressionStream("gzip"), Ae),
    ),
  );
  if (
    !e ||
    e.v !== te ||
    !e.core ||
    !Array.isArray(e.core.rooms) ||
    !Array.isArray(e.bridge?.spawned)
  )
    throw new Error("handoff: not a snapshot of this build");
  return e;
}
async function De(r, e, t, s = {}) {
  const i = await Oe(t),
    o = s.everyMs ?? 300,
    n = Date.now() + (s.forMs ?? 1200),
    a = () => {
      for (const l of i) r.handoff(e, l);
    };
  for (a(); Date.now() + o < n;)
    (await new Promise((l) => setTimeout(l, o)), a());
}
function Ne(r, e = 2e3) {
  return new Promise((t) => {
    const s = new _e(),
      i = (n) => {
        (clearTimeout(o), (r.onHandoff = null), t(n));
      },
      o = setTimeout(() => i(null), e);
    ((r.onHandoff = (n) => {
      s.add(n)
        .then((a) => {
          a && i(a);
        })
        .catch((a) => {
          (console.warn("[p2p] handoff refused:", a.message), i(null));
        });
    }),
      r.flush?.());
  });
}
async function lt(r) {
  const e = r.log ?? ((s) => console.log(`[p2p] ${s}`));
  let t = null;
  try {
    ((t = new H(
      r.serverUrl,
      ee(r.session.uniqueRoomId, r.session.roomSeed),
      "guest",
      r.session.slot,
      r.session.signalTicket,
    )),
      (t.onError = () => {}));
    const s = r.ms ?? 2e3,
      i = await Promise.race([
        t.ready.then(() => Ne(t, s)),
        new Promise((o) => setTimeout(() => o(null), s + 1e3)),
      ]);
    return (
      e(
        i
          ? `handoff from slot ${i.from}: ${i.core.rooms.length} room(s) restored`
          : "no handoff snapshot: fresh match core",
      ),
      i
    );
  } catch (s) {
    return (e(`handoff listen failed (${s.message}): fresh match core`), null);
  } finally {
    t?.close();
  }
}
function j() {
  let r = null;
  try {
    navigator.locks
      ?.request(
        "pbweb-p2p",
        () =>
          new Promise((e) => {
            r = e;
          }),
      )
      .catch(() => {});
  } catch {}
  return () => r?.();
}
async function ct(r) {
  const { session: e } = r,
    t = r.leader ?? !!r.room?.isLeader,
    s = ee(e.uniqueRoomId, e.roomSeed),
    i = r.log ?? ((c) => console.log(`[p2p] ${c}`));
  if (!t) {
    const c = new H(r.serverUrl, s, "guest", e.slot, e.signalTicket);
    let g = !1;
    try {
      const k = B(await c.ready, r.relayOnly);
      (await c.hostReady(r.hostWaitMs),
        i(`room ${s}: host online, connecting slot ${e.slot}`));
      let S;
      try {
        S = await V.connect(c, k, {
          RTCPeerConnection: r.RTCPeerConnection,
          timeoutMs: c.relaySupported ? 8e3 : 2e4,
        });
      } catch (T) {
        if (!c.relaySupported || /refused the link/.test(T.message)) throw T;
        (i(
          `slot ${e.slot}: direct link failed (${T.message}); using the authenticated web relay`,
        ),
          (S = await G.connect(c)),
          (g = !0));
      }
      const N = j(),
        ne =
          typeof window < "u" && r.room
            ? _.bind(e.slot, (T) => S.sendVoice(T))
            : () => {};
      return (
        (S.onvoice = (T) => {
          r.room && x(T[2], e.slot, r.room.slots) && _.receive(T);
        }),
        {
          transport: S,
          leader: t,
          stop: () => {
            (ne(), N(), S.close());
          },
        }
      );
    } finally {
      g || c.close();
    }
  }
  const o =
      r.data ??
      (
        await re(async () => {
          const { default: c } = await import("./matchData-DFdnbklM.js");
          return { default: c };
        }, [])
      ).default,
    n = {
      ...(r.room?.room?.stage === ie ? { barefistOnly: !0 } : {}),
      ...(r.takeover && !r.restore ? { takeover: !0 } : {}),
    },
    a = await P.start((r.worker ?? P.browserWorker)(), {
      uniqueRoomId: e.uniqueRoomId,
      roomSeed: e.roomSeed,
      data: o,
      config: n,
      ...(r.restore ? { restore: r.restore.core } : {}),
    }),
    l = new H(r.serverUrl, s, "host", e.slot, e.signalTicket);
  let f;
  try {
    f = B(await l.ready, r.relayOnly);
  } catch (c) {
    throw (l.close(), a.stop(), c);
  }
  const d = r.room,
    u = new Se(a, l, f, {
      RTCPeerConnection: r.RTCPeerConnection,
      allowSlot: (c) =>
        c !== e.slot &&
        c >= 0 &&
        c < 18 &&
        (!d || !!d.slots[c]?.nick || c >= 16),
      log: i,
    }),
    p = d
      ? new fe(d, a, e, {
          ...r.bridge,
          ...(r.restore ? { spawned: r.restore.bridge.spawned } : {}),
        })
      : null;
  a.onCheat = (c) => {
    (i(
      `anti-cheat: slot ${c.slot} ${c.kind}${c.kick ? " (dropped)" : ""}: ${c.detail}`,
    ),
      d?.reportCheat(c));
  };
  const y = (c, g) => {
    if (!d) return;
    const k = L(g, c);
    if (!k) return;
    const S = (N) => x(c, N, d.slots);
    (u.sendVoice(k, S), S(e.slot) && _.receive(k));
  };
  u.onVoice = y;
  const m =
    typeof window < "u" && d ? _.bind(e.slot, (c) => y(e.slot, c)) : () => {};
  ((u.onGuest = (c, g) => {
    g && p?.replaySlot(c);
  }),
    i(
      `room ${s}: hosting the match (slot ${e.slot}) — guests connect over WebRTC`,
    ));
  const b = a.peer("leader"),
    O = j();
  let h = !1;
  return {
    transport: b,
    leader: t,
    host: {
      local: a,
      rtc: u,
      bridge: p,
      handoff: async (c) => {
        if (h) return;
        const g = await a.snapshot();
        ((h = !0), m(), O());
        const k = {
          v: te,
          from: e.slot,
          core: g,
          bridge: p?.exportState() ?? { spawned: [] },
        };
        (p?.dispose(), u.dropGuests("host handoff"), a.stop());
        try {
          await De(l, c, k);
        } finally {
          u.close();
        }
        i(`handoff to slot ${c} sent`);
      },
    },
    stop: () => {
      h ||
        ((h = !0),
        m(),
        O(),
        p?.dispose(),
        l.close(),
        setTimeout(() => {
          (u.close(), a.stop());
        }, 700));
    },
  };
}
export { lt as awaitHandoff, ct as openP2P };
