import { io } from 'socket.io-client';

// Backend root URL — strip the trailing /api from VITE_API_URL since
// Socket.io listens on the server root, not under /api.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

let socket = null;
let tokenGetter = null;

// Listeners registered before the socket connects (or while it's bouncing
// between disconnects) live here. They get re-attached on every fresh
// connection so a component that subscribed early doesn't silently drop
// every event the server sends.
const subscriptions = [];

function attachAll(s) {
  for (const { event, handler } of subscriptions) {
    s.on(event, handler);
  }
}

export async function connectSocket(getToken) {
  tokenGetter = getToken;
  if (socket?.connected) return socket;

  let token;
  try {
    token = await getToken();
  } catch {
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  // Re-attach any listeners that were registered before the socket existed,
  // and again on every reconnect so handlers survive transient drops.
  socket.on('connect', () => attachAll(socket));

  // If the backend rejected the token, refresh and reconnect once
  socket.on('connect_error', async (err) => {
    if (err?.message?.toLowerCase().includes('unauthorized') && tokenGetter) {
      try {
        const fresh = await tokenGetter();
        socket.auth = { token: fresh };
        socket.connect();
      } catch {
        // user logged out — leave the socket disconnected
      }
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  tokenGetter = null;
}

export function joinTask(taskId) {
  if (socket?.connected) socket.emit('join-task', Number(taskId));
}

export function leaveTask(taskId) {
  if (socket?.connected) socket.emit('leave-task', Number(taskId));
}

export function joinChat(conversationId) {
  if (socket?.connected) socket.emit('chat:join', Number(conversationId));
}

export function leaveChat(conversationId) {
  if (socket?.connected) socket.emit('chat:leave', Number(conversationId));
}

// Subscribe to a server-pushed event. Registers the listener immediately if
// the socket is connected; otherwise queues it so it'll attach on next
// connect. Returns an unsubscribe function that cleans up both places.
export function onSocketEvent(event, handler) {
  subscriptions.push({ event, handler });
  if (socket) socket.on(event, handler);
  return () => {
    const i = subscriptions.findIndex((s) => s.event === event && s.handler === handler);
    if (i !== -1) subscriptions.splice(i, 1);
    if (socket) socket.off(event, handler);
  };
}
