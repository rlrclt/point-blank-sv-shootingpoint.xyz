#!/usr/bin/env node
/**
 * Minimal static server for the catalog.
 *   node site/serve.mjs [port]
 * Then open http://localhost:4173/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent((req.url || "/").split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const file = path.resolve(root, "." + rel);
    if (!file.startsWith(root)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
        return;
      }
      res.writeHead(200, {
        "content-type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-cache",
      });
      res.end(buf);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`PB Index: http://localhost:${port}/`);
  });
