import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { Readable } from "node:stream";

import app from "./dist/server/server.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const clientDir = join(process.cwd(), "dist", "client");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(clientDir, normalized);
  const rel = relative(clientDir, filePath);
  if (rel.startsWith("..") || rel === "" || rel.includes("..")) return null;
  return filePath;
}

function sendStaticFile(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/") return false;

  const filePath = safeStaticPath(url.pathname);
  if (!filePath || !existsSync(filePath)) return false;

  const stat = statSync(filePath);
  if (!stat.isFile()) return false;

  const type = contentTypes[extname(filePath)] || "application/octet-stream";
  const immutable = url.pathname.startsWith("/assets/");
  res.writeHead(200, {
    "content-type": type,
    "content-length": stat.size,
    "cache-control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=300",
  });
  createReadStream(filePath).pipe(res);
  return true;
}

function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${port}`;
  const url = `${protocol}://${hostHeader}${req.url || "/"}`;
  const hasBody = !["GET", "HEAD"].includes(req.method || "GET");

  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? "half" : undefined,
  });
}

async function sendWebResponse(webResponse, res) {
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => res.setHeader(key, value));

  if (!webResponse.body) {
    res.end();
    return;
  }

  Readable.fromWeb(webResponse.body).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/health" || req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (sendStaticFile(req, res)) return;

    const webRequest = toWebRequest(req);
    const webResponse = await app.fetch(webRequest, process.env, {
      waitUntil: () => undefined,
      passThroughOnException: () => undefined,
    });
    await sendWebResponse(webResponse, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Leo Graphyc frontend listening on http://${host}:${port}`);
});
