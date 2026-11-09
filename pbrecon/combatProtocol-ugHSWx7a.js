import { P as o } from "./noteClient-Diy66me5.js";
const i = 9009,
  c = 9010,
  w = 2;
function m(e, n) {
  const t = new TextEncoder().encode(JSON.stringify(e));
  if (t.length > 48 * 1024) throw new Error("Combat packet too large");
  const r = new o(t.length + 4);
  return (n !== void 0 && r.writeH(n), r.writeH(t.length).writeB(t).toBytes());
}
function f(e, n = 48 * 1024) {
  const t = e.readH();
  if (t > n || t > e.remaining || (e.remaining !== t && e.remaining !== t + 2))
    throw new Error("Invalid combat packet length");
  const r = e.readB(t);
  if (e.remaining && (e.readC() !== 0 || e.readC() !== 0))
    throw new Error("Invalid combat packet trailer");
  return JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(r));
}
export {
  c as COMBAT_ACK,
  i as COMBAT_REQ,
  w as COMBAT_VERSION,
  f as readCombat,
  m as writeCombat,
};
