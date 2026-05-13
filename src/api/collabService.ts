import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;
const subscriptions: Record<number, StompSubscription> = {};
const pendingSubscriptions: Record<number, { userId: number; onMessage: (msg: any) => void }> = {};

export function connectCollab(
  sessionId: number,
  userId: number,
  onMessage: (msg: any) => void
) {
  if (subscriptions[sessionId]) return; // Already subscribed to this file

  if (stompClient?.connected) {
    // Already connected to WebSocket, just subscribe to the new session
    subscribeToSession(sessionId, userId, onMessage);
    return;
  }

  // Save as pending if we are about to connect
  pendingSubscriptions[sessionId] = { userId, onMessage };

  if (stompClient) return; // Connection already in progress

  stompClient = new Client({
    brokerURL: "ws://localhost:8084/ws/collab/websocket",
    reconnectDelay: 5000,
    connectHeaders: { "X-User-Id": String(userId) },
    debug: (str) => console.log("[STOMP Debug]:", str),
    onConnect: () => {
      console.log("✅ Connected to collaboration websocket");
      // Subscribe to all pending sessions
      Object.entries(pendingSubscriptions).forEach(([sId, data]) => {
        subscribeToSession(Number(sId), data.userId, data.onMessage);
        delete pendingSubscriptions[Number(sId)];
      });
    },
    onStompError: (frame) => console.error("❌ STOMP error:", frame.headers['message'], frame.body),
    onWebSocketError: (err) => console.error("❌ WebSocket error:", err),
  });

  stompClient.activate();
}

function subscribeToSession(sessionId: number, userId: number, onMessage: (msg: any) => void) {
  if (!stompClient?.connected || subscriptions[sessionId]) return;

  const sub = stompClient.subscribe(
    `/topic/session/${sessionId}`,
    (message) => {
      try {
        const body = JSON.parse(message.body);
        onMessage(body);
      } catch (e) {
        console.error("Failed to parse STOMP message", e);
      }
    }
  );
  
  subscriptions[sessionId] = sub;

  // announce join
  stompClient.publish({
    destination: "/app/collab/presence",
    headers: { "X-User-Id": String(userId) },
    body: JSON.stringify({
      sessionId,
      userId,
      type: "JOIN",
      timestamp: Date.now(),
    }),
  });
}

export function sendEdit(payload: any) {
  if (!stompClient?.connected) {
    console.warn("⚠️ Cannot send edit: STOMP not connected yet!");
    return;
  }
  console.log("📤 Sending edit via STOMP:", payload);
  stompClient.publish({
    destination: "/app/collab/edit",
    headers: { "X-User-Id": String(payload.userId) },
    body: JSON.stringify(payload),
  });
}

export function sendCursor(payload: any) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: "/app/collab/cursor",
    headers: { "X-User-Id": String(payload.userId) },
    body: JSON.stringify(payload),
  });
}

export function sendTyping(payload: any) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: "/app/collab/typing",
    headers: { "X-User-Id": String(payload.userId) },
    body: JSON.stringify(payload),
  });
}

export function sendCommentEvent(payload: any) {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: "/app/collab/comment",
    headers: { "X-User-Id": String(payload.userId) },
    body: JSON.stringify(payload),
  });
}

export function disconnectCollab(sessionId: number, userId: number) {
  if (stompClient?.connected) {
    stompClient.publish({
      destination: "/app/collab/presence",
      headers: { "X-User-Id": String(userId) },
      body: JSON.stringify({
        sessionId,
        userId,
        type: "LEAVE",
        timestamp: Date.now(),
      }),
    });
  }

  // Unsubscribe from this specific file session
  if (subscriptions[sessionId]) {
    subscriptions[sessionId].unsubscribe();
    delete subscriptions[sessionId];
  }
  delete pendingSubscriptions[sessionId];

  // If no more subscriptions, disconnect WebSocket
  if (Object.keys(subscriptions).length === 0 && Object.keys(pendingSubscriptions).length === 0) {
    stompClient?.deactivate();
    stompClient = null;
  }
}