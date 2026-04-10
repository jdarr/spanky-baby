import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { makeRedisClient } from "./redis.js";

const PORT = Number(process.env.PORT || 3001);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REDIS_KEY = process.env.REDIS_KEY || "counter:value";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const redis = makeRedisClient(REDIS_URL);
await redis.connect();

async function getCounter() {
  const v = await redis.get(REDIS_KEY);
  if (v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function setCounter(n) {
  await redis.set(REDIS_KEY, String(n));
  return n;
}

async function incrCounter() {
  return await redis.incr(REDIS_KEY);
}

async function decrCounter() {
  return await redis.decr(REDIS_KEY);
}

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new SocketIOServer(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] }
});

io.on("connection", async (socket) => {
  socket.emit("counter:value", { value: await getCounter() });

  socket.on("counter:get", async () => {
    socket.emit("counter:value", { value: await getCounter() });
  });

  socket.on("counter:set", async (payload) => {
    const next = Number(payload?.value);
    if (!Number.isFinite(next)) return;
    const value = await setCounter(next);
    io.emit("counter:value", { value });
  });

  socket.on("counter:inc", async () => {
    const value = await incrCounter();
    io.emit("counter:value", { value });
  });

  socket.on("counter:dec", async () => {
    const value = await decrCounter();
    io.emit("counter:value", { value });
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});