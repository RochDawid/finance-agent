import type { WSMessage, WSEventType } from "./types.js";

declare global {
  // eslint-disable-next-line no-var
  var __wsBroadcast: ((type: WSEventType, data: unknown) => void) | undefined;
}

export function broadcast(type: WSEventType, data: unknown): void {
  const message: WSMessage = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  if (globalThis.__wsBroadcast) {
    globalThis.__wsBroadcast(type, data);
  } else {
    console.warn("[ws] No broadcast function registered, message dropped:", message.type);
  }
}
