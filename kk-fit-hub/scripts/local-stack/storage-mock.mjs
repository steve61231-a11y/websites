// A small stand-in for Supabase Storage, implementing only the endpoints the
// app uses: signed uploads, list, move, remove, signed downloads. Files live
// under .stack/storage. For local development and tests only.
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.env.STORAGE_DIR ?? ".stack/storage");
const port = Number(process.env.STORAGE_PORT ?? 5001);
const serviceKey = process.env.SERVICE_ROLE_KEY ?? "";
const tokens = new Map(); // token → { bucket, key, kind, exp }
const meta = new Map(); // "bucket/key" → { size, mimetype, created }

fs.mkdirSync(root, { recursive: true });

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,HEAD,OPTIONS",
  "access-control-allow-headers": "authorization,apikey,content-type,x-upsert,cache-control,x-client-info,x-metadata",
};

function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(status, { ...cors, "content-type": isBuf ? headers["content-type"] : "application/json", ...headers });
  res.end(isBuf ? body : JSON.stringify(body));
}
const isService = (req) => (req.headers.authorization ?? "").replace(/^Bearer /, "") === serviceKey;
const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
const file = (bucket, key) => {
  const resolved = path.resolve(root, bucket, key);
  if (!resolved.startsWith(root + path.sep)) throw new Error("bad path");
  return resolved;
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const p = decodeURIComponent(url.pathname);
    if (req.method === "OPTIONS") return send(res, 204, {});
    try {
      let m;
      if (req.method === "POST" && (m = p.match(/^\/object\/upload\/sign\/([^/]+)\/(.+)$/))) {
        if (!isService(req)) return send(res, 403, { message: "forbidden" });
        const token = randomUUID();
        tokens.set(token, { bucket: m[1], key: m[2], kind: "upload", exp: Date.now() + 600_000 });
        return send(res, 200, { url: `/object/upload/sign/${m[1]}/${m[2]}?token=${token}` });
      }
      if (req.method === "PUT" && (m = p.match(/^\/object\/upload\/sign\/([^/]+)\/(.+)$/))) {
        const t = tokens.get(url.searchParams.get("token") ?? "");
        if (!t || t.kind !== "upload" || t.bucket !== m[1] || t.key !== m[2] || t.exp < Date.now())
          return send(res, 400, { message: "invalid token" });
        const body = await readBody(req);
        if (body.length > 10 * 1024 * 1024) return send(res, 413, { message: "too large" });
        const dest = file(m[1], m[2]);
        if (fs.existsSync(dest)) return send(res, 409, { message: "exists" });
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, body);
        meta.set(`${m[1]}/${m[2]}`, {
          size: body.length,
          mimetype: req.headers["content-type"] ?? "application/octet-stream",
          created: new Date().toISOString(),
        });
        tokens.delete(url.searchParams.get("token"));
        return send(res, 200, { Key: `${m[1]}/${m[2]}` });
      }
      if (req.method === "POST" && (m = p.match(/^\/object\/list\/([^/]+)$/))) {
        if (!isService(req)) return send(res, 403, { message: "forbidden" });
        const { prefix = "" } = JSON.parse((await readBody(req)).toString() || "{}");
        const dir = file(m[1], prefix);
        const names = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
        return send(
          res,
          200,
          names.map((name) => {
            const key = `${m[1]}/${prefix ? `${prefix}/` : ""}${name}`;
            const info = meta.get(key);
            const stat = fs.statSync(path.join(dir, name));
            return {
              name,
              id: stat.isDirectory() ? null : key,
              created_at: info?.created ?? stat.mtime.toISOString(),
              metadata: stat.isDirectory() ? null : { size: info?.size ?? stat.size, mimetype: info?.mimetype ?? "" },
            };
          }),
        );
      }
      if (req.method === "POST" && p === "/object/move") {
        if (!isService(req)) return send(res, 403, { message: "forbidden" });
        const { bucketId, sourceKey, destinationKey } = JSON.parse((await readBody(req)).toString());
        const from = file(bucketId, sourceKey);
        if (!fs.existsSync(from)) return send(res, 404, { message: "not found" });
        const to = file(bucketId, destinationKey);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.renameSync(from, to);
        const info = meta.get(`${bucketId}/${sourceKey}`);
        if (info) meta.set(`${bucketId}/${destinationKey}`, info);
        meta.delete(`${bucketId}/${sourceKey}`);
        return send(res, 200, { message: "Successfully moved" });
      }
      if (req.method === "DELETE" && (m = p.match(/^\/object\/([^/]+)$/))) {
        if (!isService(req)) return send(res, 403, { message: "forbidden" });
        const { prefixes = [] } = JSON.parse((await readBody(req)).toString() || "{}");
        const removed = [];
        for (const key of prefixes) {
          const f = file(m[1], key);
          if (fs.existsSync(f)) {
            fs.rmSync(f, { recursive: true });
            meta.delete(`${m[1]}/${key}`);
            removed.push({ name: key });
          }
        }
        return send(res, 200, removed);
      }
      if (req.method === "POST" && (m = p.match(/^\/object\/sign\/([^/]+)\/(.+)$/))) {
        if (!isService(req)) return send(res, 403, { message: "forbidden" });
        if (!fs.existsSync(file(m[1], m[2]))) return send(res, 404, { message: "not found" });
        const { expiresIn = 60 } = JSON.parse((await readBody(req)).toString() || "{}");
        const token = randomUUID();
        tokens.set(token, { bucket: m[1], key: m[2], kind: "download", exp: Date.now() + expiresIn * 1000 });
        return send(res, 200, { signedURL: `/object/sign/${m[1]}/${m[2]}?token=${token}` });
      }
      if (req.method === "GET" && (m = p.match(/^\/object\/sign\/([^/]+)\/(.+)$/))) {
        const t = tokens.get(url.searchParams.get("token") ?? "");
        if (!t || t.kind !== "download" || t.bucket !== m[1] || t.key !== m[2] || t.exp < Date.now())
          return send(res, 400, { message: "invalid token" });
        const info = meta.get(`${m[1]}/${m[2]}`);
        return send(res, 200, fs.readFileSync(file(m[1], m[2])), {
          "content-type": info?.mimetype ?? "application/octet-stream",
        });
      }
      send(res, 404, { message: `no route ${req.method} ${p}` });
    } catch (e) {
      send(res, 500, { message: String(e) });
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`storage stand-in on ${port}`));
