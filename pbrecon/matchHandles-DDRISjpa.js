function i(e = typeof location > "u" ? "" : location.search) {
  return new URLSearchParams(e).get("leakfix") !== "0";
}
function l(e, o) {
  let a = 0;
  for (const [n, t] of Object.entries(o))
    t == null || !(n in e) || e[n] !== t || (delete e[n], a++);
  return a;
}
export { i as l, l as r };
