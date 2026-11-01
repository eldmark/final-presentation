// Sirve la presentación (carpeta dist/) y retransmite los mensajes del control remoto.
// - GET  /            la presentación
// - GET  /remote      la vista del presentador, pensada para el celular
// - GET  /api/info    { publicUrl } para armar el QR del celular
// - WS   /ws?k=TOKEN  relevo: lo que manda un cliente lo reciben los demás
import http from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { WebSocketServer } from "ws";

const ROOT = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const PORT = Number(process.env.PORT ?? 8080);
const TOKEN = process.env.PRESENTER_TOKEN || randomBytes(6).toString("hex");
const PUBLIC_URL = (process.env.PUBLIC_URL ?? "").replace(/\/$/, "");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".glb": "model/gltf-binary", ".woff2": "font/woff2", ".woff": "font/woff",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8",
};

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  let path = decodeURIComponent(url.pathname);

  if (path === "/healthz") return void res.writeHead(200, { "content-type": "text/plain" }).end("ok");
  if (path === "/api/info") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    return void res.end(JSON.stringify({ publicUrl: PUBLIC_URL }));
  }
  if (path === "/remote" || path === "/remote/") path = "/presenter.html";
  if (path === "/acerca") path = "/acerca.html";
  if (path.endsWith("/")) path += "index.html";

  const file = normalize(join(ROOT, path));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return void res.writeHead(403).end("Prohibido");

  let stat;
  try {
    stat = statSync(file);
    if (!stat.isFile()) throw new Error("no es archivo");
  } catch {
    return void res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("No encontrado");
  }
  const hashed = path.startsWith("/assets/");
  res.writeHead(200, {
    "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
    "content-length": stat.size,
    "cache-control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
    "x-content-type-options": "nosniff",
  });
  createReadStream(file).pipe(res);
});

// ---- relevo del control remoto ----
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname !== "/ws" || !safeEqual(url.searchParams.get("k") ?? "", TOKEN)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
});
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
  ws.on("message", (data, isBinary) => {
    for (const client of wss.clients) if (client !== ws && client.readyState === 1) client.send(data, { binary: isBinary });
  });
});
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) ws.terminate();
    else {
      ws.isAlive = false;
      ws.ping();
    }
  }
}, 20000).unref();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Presentación lista en el puerto ${PORT}`);
  console.log(`  Principal:  ${PUBLIC_URL || `http://localhost:${PORT}`}/?k=${TOKEN}`);
  console.log(`  Celular:    ${PUBLIC_URL || `http://<IP-de-este-equipo>:${PORT}`}/remote?k=${TOKEN}`);
});
