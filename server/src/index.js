import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { makeRedisClient } from "./redis.js";

import { createServer } from 'node:http';
import { readFile } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('../', import.meta.url));

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

const httpServer = createServer((req, res) => {

	// check heaalth of the server
	if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

	// load static files if they exist	
	let filePath = join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
	
	const mimeTypes = {
			'.html': 'text/html',
			'.js': 'text/javascript',
			'.css': 'text/css',
			'.json': 'application/json',
			'.png': 'image/png',
			'.svg': 'image/svg+xml',
			'.ico': 'image/x-icon',
			'.wav': 'audio/wav',
			'.mp3': 'audio/mpeg',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2',
			'.ttf': 'font/ttf',
			'.otf': 'font/otf',
			'.wasm': 'application/wasm',
	};
	
	const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';

	readFile(filePath, (error, content) => {
		if (error) {
				if (error.code === 'ENOENT') {
						res.writeHead(404, { 'Content-Type': 'text/html' });
						res.end('<h1>404 Not Found</h1>', 'utf-8');
				} else {
						res.writeHead(500);
						res.end(`Server Error: ${error.code}`);
				}
		} else {
				res.writeHead(200, { 'Content-Type': contentType });
				res.end(content, 'utf-8');
		}
  });

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
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});