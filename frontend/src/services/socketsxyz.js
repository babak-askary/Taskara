import { io } from 'socket.io-client';

// Backend root URL — strip the trailing /api from VITE_API_URL since
// Socket.io listens on the server root, not under /api.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

let socket = null;
let tokenGetter = null;

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

// Subscribe to a server-pushed event. Returns an unsubscribe function.
export function onSocketEvent(event, handler) {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => socket?.off(event, handler);
}
