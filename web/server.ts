import dotenv from "dotenv";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node:url";
import next from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { WebSocketServer, type WebSocket } from "ws";
import type { WSEventType, WSMessage } from "./lib/types.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true);
  handle(req, res, parsedUrl);
});

// WebSocket server on /ws path
const wss = new WebSocketServer({ server, path: "/ws" });
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[ws] Client connected (${clients.size} total)`);

  // Send init message
  const initMsg: WSMessage = {
    type: "connection:init",
    data: { connected: true },
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(initMsg));

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as { action?: string; apiKey?: string };
      if (msg.action === "trigger_scan") {
        import("./lib/scan-loop.js").then((m) => m.performScan(msg.apiKey));
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[ws] Client disconnected (${clients.size} total)`);
  });
});

// Register global broadcast
globalThis.__wsBroadcast = (type: WSEventType, data: unknown) => {
  const message: WSMessage = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  const payload = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
};

server.listen(port, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
});
