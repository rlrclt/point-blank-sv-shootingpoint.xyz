#!/usr/bin/env node
/*
 * pbrecon/refresh.mjs — pull the live shootingpoint.xyz bundle.
 *
 * Vite emits a new content hash on every deploy, so the snapshot in this
 * folder goes stale silently. This script reads the live index, follows its
 * chunk graph, and downloads only files whose hash/name we do not have yet.
 *
 * Usage:
 *   node refresh.mjs                  # fetch what is new into pbrecon/live
 *   node refresh.mjs --check          # report only, write nothing
 *   node refresh.mjs --all            # re-download every chunk
 *   node refresh.mjs --include guard  # only files whose name matches
 *   node refresh.mjs --out live2 --base https://shootingpoint.xyz
 *
 * Exit code: 0 normally, 1 when --check finds a new index/guard.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const argv = process.argv.slice(2);
const opt = {
  base: "https://shootingpoint.xyz",
  out: fileURLToPath(new URL("./live", import.meta.url)),
  all: false,
  check: false,
  include: "",
  max: 0,
  depth: 3,
};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const val = () => argv[++i];
  if (a === "--all") opt.all = true;
  else if (a === "--check" || a === "--dry") opt.check = true;
  else if (a === "--include") opt.include = val() || "";
  else if (a === "--max") opt.max = Number(val()) || 0;
  else if (a === "--depth") opt.depth = Number(val()) || 0;
  else if (a === "--out") opt.out = path.resolve(val() || opt.out);
  else if (a === "--base") opt.base = (val() || opt.base).replace(/\/+$/, "");
  else if (a === "-h" || a === "--help") {
    console.log(
      "node refresh.mjs [--check] [--all] [--include text] [--max n] " +
        "[--depth n] [--out dir] [--base url]",
    );
    process.exit(0);
  } else {
    console.error("unknown argument: " + a);
    process.exit(2);
  }
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const fmt = (n) =>
  n > 1024 * 1024
    ? (n / 1024 / 1024).toFixed(1) + " MB"
    : n > 1024
      ? (n / 1024).toFixed(0) + " KB"
      : n + " B";

async function get(url, tries = 3) {
  let err = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept": "*/*" },
        redirect: "follow",
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return res;
    } catch (e) {
      err = e;
    }
  }
  throw err;
}

/* Bundle files live flat under /bundle/, so the file name alone is the key. */
function nameOf(spec) {
  const clean = spec.split(/[?#]/)[0].replace(/^\.?\//, "");
  return clean.includes("/") ? clean.slice(clean.lastIndexOf("/") + 1) : clean;
}

const JS_IMPORT = /\b(?:from\s*|import\s*)["'](?:\.\/|bundle\/)([\w.-]+\.(?:js|css))["']/g;
const MAP_DEP = /["']bundle\/([\w.-]+\.(?:js|css))["']/g;

function extractNames(text) {
  const names = new Set();
  for (const re of [JS_IMPORT, MAP_DEP]) {
    for (const m of text.matchAll(re)) names.add(nameOf(m[1]));
  }
  return [...names];
}

async function main() {
  console.log(`base: ${opt.base}`);
  const home = await get(opt.base + "/");
  if (!home) throw new Error("หน้าแรกตอบ 404");
  const html = await home.text();

  const index = [...html.matchAll(/index-[\w-]+\.js/g)].map((m) => m[0])[0];
  if (!index) throw new Error("หา index-*.js ในหน้าแรกไม่เจอ");

  const indexUrl = `${opt.base}/bundle/${index}`;
  const res = await get(indexUrl);
  if (!res) throw new Error(`โหลด ${indexUrl} ไม่ได้`);
  const indexText = await res.text();

  /* BFS: the index lists most chunks in __vite__mapDeps, but lazy chunks
     import each other, so follow those edges too (bounded by --depth). */
  const queue = extractNames(indexText).map((n) => ({ name: n, depth: 0 }));
  const discovered = new Map(); // name -> text (js only)
  while (queue.length) {
    const { name, depth } = queue.shift();
    if (discovered.has(name)) continue;
    if (!name.endsWith(".js")) {
      discovered.set(name, "");
      continue;
    }
    const r = await get(`${opt.base}/bundle/${name}`);
    if (!r) {
      console.warn(`  ! missing: ${name}`);
      discovered.set(name, "");
      continue;
    }
    const text = await r.text();
    discovered.set(name, text);
    if (depth < opt.depth) {
      for (const child of extractNames(text)) {
        if (!discovered.has(child)) queue.push({ name: child, depth: depth + 1 });
      }
    }
  }

  const names = [...discovered.keys()]
    .filter((n) => !opt.include || n.includes(opt.include))
    .sort();
  const guards = [...discovered.keys()].filter((n) => /^pb-guard-/.test(n));

  await mkdir(opt.out, { recursive: true });

  const prevPath = path.join(opt.out, "manifest.json");
  let prev = null;
  try {
    prev = JSON.parse(await readFile(prevPath, "utf8"));
  } catch {}

  const files = [];
  let downloaded = 0;
  let unchanged = 0;
  let bytes = 0;

  for (const name of names) {
    if (opt.max && downloaded >= opt.max) break;
    const localPath = path.join(opt.out, name);
    let old = null;
    try {
      old = await readFile(localPath);
    } catch {}
    const oldHash = old ? sha256(old) : null;

    let body = null;
    const needsFetch = opt.all || !old;
    if (needsFetch) {
      const r = await get(`${opt.base}/bundle/${name}`);
      body = r ? Buffer.from(await r.arrayBuffer()) : null;
      if (!body) {
        files.push({ name, status: "missing" });
        continue;
      }
    } else {
      /* Same name = same content hash in Vite, but verify cheaply by size
         only when --all is off. */
      files.push({ name, bytes: old.length, sha256: oldHash, status: "unchanged" });
      unchanged++;
      bytes += old.length;
      continue;
    }

    const hash = sha256(body);
    bytes += body.length;
    if (hash === oldHash) {
      files.push({ name, bytes: body.length, sha256: hash, status: "unchanged" });
      unchanged++;
      continue;
    }
    if (!opt.check) {
      await writeFile(localPath, body);
      downloaded++;
    }
    files.push({
      name,
      bytes: body.length,
      sha256: hash,
      status: oldHash ? "changed" : "new",
    });
  }

  const newIndex = !prev || prev.index !== index;
  const newGuard =
    !prev ||
    guards.join(",") !== (prev.guards || []).join(",");

  console.log(`index: ${index}${newIndex ? "  (ใหม่)" : ""}`);
  console.log(
    `guard: ${guards.length ? guards.join(", ") : "ไม่พบ"}${newGuard ? "  (ใหม่)" : ""}`,
  );
  console.log(
    `files: ${names.length} · new ${files.filter((f) => f.status === "new").length}` +
      ` · changed ${files.filter((f) => f.status === "changed").length}` +
      ` · unchanged ${unchanged}` +
      (files.some((f) => f.status === "missing")
        ? ` · missing ${files.filter((f) => f.status === "missing").length}`
        : ""),
  );
  if (!opt.check) console.log(`out: ${opt.out} (${fmt(bytes)})`);

  if (opt.check) {
    for (const f of files) {
      if (f.status === "new" || f.status === "changed") {
        console.log(`  ${f.status === "new" ? "+" : "~"} ${f.name}`);
      }
    }
    console.log(newIndex || newGuard ? "\nมีการอัปเดต — รันโดยไม่ใส่ --check เพื่อดาวน์โหลด" : "\nไม่มีอะไรเปลี่ยน");
  }

  if (!opt.check) {
    const manifest = {
      base: opt.base,
      index,
      guards,
      fetchedAt: new Date().toISOString(),
      counts: {
        total: names.length,
        new: files.filter((f) => f.status === "new").length,
        changed: files.filter((f) => f.status === "changed").length,
        unchanged,
      },
      files,
    };
    await writeFile(prevPath, JSON.stringify(manifest, null, 2) + "\n");
    await writeFile(path.join(opt.out, "index.txt"), index + "\n");
  }

  if (newGuard && guards.length) {
    console.log(
      "\nหมายเหตุ: guard เปลี่ยนชื่อ/เนื้อหา → ต้อง regenerate guard-patched.js " +
        "(ดู docs/ANTI-CHEAT-UPDATE.md §6)",
    );
  }

  if (opt.check && (newIndex || newGuard)) process.exitCode = 1;
}

main().catch((e) => {
  console.error("refresh failed:", e.message);
  process.exit(2);
});
