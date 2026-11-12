// diff-guard-strings.mjs — strings added/removed between two guard builds
import fs from "node:fs";
const read = (f) => fs.readFileSync(f, "utf8").split("\n").map((l) => l.slice(l.indexOf("\t") + 1));
const a = new Set(read("pbrecon/live/guard-Z-strings.txt").filter((s) => s.length >= 3 && s !== "<end>"));
const b = new Set(read("pbrecon/live/guard-V-strings.txt").filter((s) => s.length >= 3 && s !== "<end>"));
const keep = (s) =>
  s.length >= 8 &&
  /[a-z]{3,}/.test(s) &&
  !/^[A-Za-z]{6}$/.test(s) &&                    // pure 6-char tokens = padding
  /[ .\/:()\-_#\[\]=<>{}|&;$@,!?]/.test(s) ||    // punctuation-bearing phrases
  /^(get|set|has|on)[A-Z]/.test(s) || s.includes("phone") || s.includes("webrtc");
const isPhrase = (s) => {
  if (s.length < 9) return false;
  if (!/[a-z]{3,}/.test(s)) return false;
  // padding tokens are 5-8 random-ish alnum chars with no spaces
  if (!/[\s./:()\-=<>|&;[\]_#,$@!?'"]/.test(s)) {
    const words = s.split(/(?=[A-Z])/);
    if (words.length < 3) return false;
  }
  return true;
};
const added = [...b].filter((s) => !a.has(s) && s.length >= 4 && !/^[A-Z][a-z]{4}$|^[a-z]{4,6}$|^[A-Za-z]{5}$/.test(s));
const removed = [...a].filter((s) => !b.has(s) && s.length >= 4 && !/^[A-Z][a-z]{4}$|^[a-z]{4,6}$|^[A-Za-z]{5}$/.test(s));
console.log("ADDED", added.length);
console.log(added.join("\n"));
console.log("\nREMOVED", removed.length);
console.log(removed.slice(0, 120).join("\n"));
console.log("== ADDED (" + added.length + ") ==");
console.log(added.join("\n"));
console.log("\n== REMOVED (" + removed.length + ") ==");
console.log(removed.slice(0, 80).join("\n"));
