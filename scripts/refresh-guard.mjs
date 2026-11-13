#!/usr/bin/env node
/*
 * scripts/refresh-guard.mjs — one command for a new game build.
 *
 *  1. read the live index-*.js
 *  2. find the pb-guard-*.js it imports
 *  3. locate the host flag (the `typeof location ... && ...location.hostname`)
 *  4. replace only that declaration with `!0`
 *  5. strip `debugger;` statements (the guard's own devtools-timing probe —
 *     with a CDP port open the statement pauses the VM and inflates the probe)
 *  6. write guard-patched.js + syntax check it
 *
 * Usage:
 *   node scripts/refresh-guard.mjs            # fetch, patch, write
 *   node scripts/refresh-guard.mjs --check    # exit 1 if guard-patched is stale
 *   node scripts/refresh-guard.mjs --out x.js
 *   node scripts/refresh-guard.mjs --sync ../pb-esp-ext-cf
 *
 * Exit codes: 0 ok/up-to-date, 1 stale (--check), 2 fetch/parse error.
 */
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const argv = process.argv.slice(2);
const opt = {
  base: "https://shootingpoint.xyz",
  out: path.join(ROOT, "guard-patched.js"),
  check: false,
  sync: "",
};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const val = () => argv[++i];
  if (a === "--check") opt.check = true;
  else if (a === "--out") opt.out = path.resolve(val() || opt.out);
  else if (a === "--sync") opt.sync = path.resolve(val() || "");
  else if (a === "--base") opt.base = (val() || opt.base).replace(/\/+$/, "");
  else if (a === "-h" || a === "--help") {
    console.log(
      "node scripts/refresh-guard.mjs [--check] [--out file] [--sync dir] [--base url]",
    );
    process.exit(0);
  } else {
    console.error("unknown argument: " + a);
    process.exit(2);
  }
}

async function get(url, tries = 3) {
  let err = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept": "*/*" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return res;
    } catch (e) {
      err = e;
    }
  }
  throw err;
}

/* Return the index after the initialiser that ends this const declaration.
   Handles strings and (), [], {} nesting in minified code. */
function exprEnd(src, eq) {
  let depth = 0;
  let quote = null;
  for (let i = eq + 1; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (depth === 0 && (ch === "," || ch === ";")) return i;
  }
  return src.length;
}

const FLAG_PATTERNS = [
  /* minified with string decoder: location[c(785)+"me"] */
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*typeof\s+location\s*!==[^;,]{0,160}?location\s*\[\s*[^\]]*\+\s*["']me["']\s*\]/g,
  /* plain: location.hostname */
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*typeof\s+location\s*!==[^;,]{0,160}?location\s*\.\s*hostname/g,
];

function findFlag(src) {
  for (const re of FLAG_PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(src);
    if (!m) continue;
    const name = m[1];
    const eq = src.indexOf("=", m.index);
    const end = exprEnd(src, eq);
    return {
      name,
      start: m.index,
      eq,
      end,
      decl: src.slice(m.index, end),
    };
  }
  return null;
}

function exportCount(src) {
  const m = src.match(/export\{[^}]*\}/g);
  if (!m) return 0;
  return m[m.length - 1].slice(7, -1).split(",").filter(Boolean).length;
}

async function main() {
  const home = await get(opt.base + "/");
  const html = await home.text();
  const index = [...html.matchAll(/index-[\w-]+\.js/g)].map((m) => m[0])[0];
  if (!index) throw new Error("ไม่พบ index-*.js ในหน้าแรก");

  const indexText = await (await get(`${opt.base}/bundle/${index}`)).text();
  const guards = [...new Set([...indexText.matchAll(/pb-guard-[\w-]+\.js/g)].map((m) => m[0]))];
  if (!guards.length) throw new Error("index ไม่ได้อ้าง pb-guard-*.js");
  const guard = guards[0];

  console.log(`index: ${index}`);
  console.log(`guard: ${guard}`);

  let currentHeader = "";
  try {
    currentHeader = (await readFile(opt.out, "utf8")).slice(0, 400);
  } catch {}
  const patchedMatch = currentHeader.match(/guard=([\w.-]+\.js)/);
  const already = patchedMatch && patchedMatch[1] === guard;

  if (opt.check) {
    if (already) {
      console.log("guard-patched.js ตรงกับ build ล่าสุด — ไม่ต้องทำอะไร");
      process.exit(0);
    }
    console.log(
      "guard-patched.js เก่า/ไม่ตรงกับ build ล่าสุด — รัน `node scripts/refresh-guard.mjs`",
    );
    process.exit(1);
  }

  const src = await (await get(`${opt.base}/bundle/${guard}`)).text();
  const flag = findFlag(src);
  if (!flag) {
    const i = src.search(/hostname|["']me["']/);
    throw new Error(
      "หารูปแบบ host flag ไม่เจอ — ตรวจ guard ด้วยมือ" +
        (i >= 0 ? `\nnear: ${src.slice(Math.max(0, i - 200), i + 200)}` : ""),
    );
  }

  // strip `debugger;` statements — the guard uses them as a devtools-timing
  // probe (function pt/pe); with a CDP port attached the statement pauses the
  // VM and inflates the measured delta. Never inside string literals (the
  // string table is base64-ish), and count them so the change is visible.
  let dbgStripped = 0;
  let body = src.slice(flag.end).replace(/\bdebugger\b\s*;?/g, () => {
    dbgStripped++;
    return "void 0;";
  });

  // neutralize the cheat self-report (sendCheatSelfReport): the guard's
  // ClientSentinel measures local play (speed / recoil / synthetic input /
  // gl hooks / clock drift) and reports itself to the server via the chat
  // connection (CHEAT_CLIENT_REQ = 9007). We find its function name through
  // the export map — `sendCheatSelfReport:<name>` — and replace the whole
  // function body with `return !1`, so no console log, no report list entry,
  // and no packet ever leaves the page. The export map keeps the name, and
  // callers that check the boolean see "not sent".
  let reportKilled = false;
  const em = body.match(/sendCheatSelfReport\s*:\s*(\w+)/);
  if (em) {
    const fnName = em[1];
    const fd = body.indexOf(`function ${fnName}(`);
    if (fd >= 0) {
      const ob = body.indexOf("{", fd);
      let depth = 0, end = -1;
      for (let i = ob; i < body.length; i++) {
        const ch = body[i];
        if (ch === "{") depth++;
        else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
      }
      if (ob >= 0 && end > ob) {
        body =
          body.slice(0, ob) +
          "{return !1}" +
          body.slice(end + 1);
        reportKilled = true;
      }
    }
  }
  if (reportKilled) console.log("self-report (9007): neutralized at source");
  if (dbgStripped) console.log(`debugger statements stripped: ${dbgStripped}`);

  const patched =
    `/* pb-guard-patched guard=${guard} build=${index} */\n` +
    src.slice(0, flag.eq + 1) +
    "!0" +
    body;

  const before = exportCount(src);
  const after = exportCount(patched);
  if (before !== after) {
    throw new Error(`export count เปลี่ยน (${before} -> ${after}) — หยุดก่อนเขียน`);
  }

  await writeFile(opt.out, patched);

  const chk = spawnSync(process.execPath, ["--check", opt.out], { encoding: "utf8" });
  if (chk.status !== 0) {
    throw new Error("syntax check ไม่ผ่าน:\n" + (chk.stderr || chk.stdout));
  }

  console.log(`flag: ${flag.name} -> !0`);
  console.log(`decl: ${flag.decl.slice(0, 160)}`);
  console.log(`exports: ${after} · bytes: ${patched.length}`);
  console.log(`wrote: ${opt.out}`);

  if (opt.sync) {
    await writeFile(path.join(opt.sync, "guard-patched.js"), patched);
    console.log(`synced: ${path.join(opt.sync, "guard-patched.js")}`);
  }

  console.log("\nต่อไป: bump VERSION/manifest แล้ว reload extension + F5");
}

main().catch((e) => {
  console.error("refresh-guard failed:", e.message);
  process.exit(2);
});
