# Realtime Redis Counter (Socket.IO + Vite Vanilla)

## Prereqs
- Node.js 18+ recommended
- Docker (for Redis)

## Start Redis
```bash
docker compose up -d
```

## Start server
```bash
cd server
cp .env.example .env
npm i
npm run dev
```

Server: http://localhost:3001  
Health: http://localhost:3001/health

## Start web
```bash
cd ../web
npm i
npm run dev
```

Web: http://localhost:5173