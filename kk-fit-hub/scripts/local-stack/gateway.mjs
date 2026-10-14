// Routes Supabase-style paths to the local services, like Kong does:
// /auth/v1 → GoTrue, /rest/v1 → PostgREST, /storage/v1 → storage stand-in.
import http from "node:http";

const routes = [
  ["/auth/v1", Number(process.env.AUTH_PORT ?? 9999)],
  ["/rest/v1", Number(process.env.REST_PORT ?? 3001)],
  ["/storage/v1", Number(process.env.STORAGE_PORT ?? 5001)],
];
const port = Number(process.env.GATEWAY_PORT ?? 54321);

http
  .createServer((req, res) => {
    const route = routes.find(([prefix]) => req.url.startsWith(prefix));
    if (!route) {
      res.writeHead(404).end("not found");
      return;
    }
    const [prefix, target] = route;
    const path = req.url.slice(prefix.length) || "/";
    const upstream = http.request(
      { host: "127.0.0.1", port: target, path, method: req.method, headers: req.headers },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", (e) => res.writeHead(502).end(String(e)));
    req.pipe(upstream);
  })
  .listen(port, "127.0.0.1", () => console.log(`gateway on ${port}`));
