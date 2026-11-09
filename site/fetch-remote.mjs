#!/usr/bin/env node
/**
 * Cache the remote manifests the catalog needs from the asset host.
 *
 *   node site/fetch-remote.mjs
 *   node site/fetch-remote.mjs https://shootingpoint.xyz
 *
 * Writes site/data/remote/*.json. build-items.mjs reads these caches to map
 * items to their real icon sheets; it still builds without them (glyph art).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "site", "data", "remote");
const BASE = (process.argv[2] || "https://shootingpoint.xyz").replace(/\/+$/, "");

const FILES = {
  "weapons-models.json": "/assets/weapons/models/index.json",
  "items.en.json": "/assets/ui/sea3123/strings/items.en.json",
  "cross-icons.json": "/assets/ui/cross/icons/index.json",
};

fs.mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const [name, rel] of Object.entries(FILES)) {
  const url = BASE + rel;
  const dest = path.join(OUT, name);
  process.stdout.write(`fetching ${name} ... `);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    JSON.parse(buf.toString("utf8")); // reject HTML error pages
    fs.writeFileSync(dest, buf);
    console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    failed++;
    console.log(`FAILED: ${err.message}`);
  }
}

if (failed) {
  console.error(`\n${failed} manifest(s) failed. The catalog still builds, but without images for those parts.`);
  process.exitCode = 1;
} else {
  console.log(`\ncached manifests in ${path.relative(ROOT, OUT)}`);
}
