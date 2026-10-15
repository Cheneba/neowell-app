/**
 * Live connection to the backend's /ws endpoint. After the first-message JWT auth the server
 * pushes `notification` events, which screens use to refresh without waiting for a poll.
 * Reconnects with backoff; push notifications (FCM) cover the app being closed.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

/** Calls `fn` whenever the server sends a notification. Returns an unsubscribe function. */
export function onLiveNotification(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function wsUrl(apiUrl: string) {
  return `${apiUrl.replace(/^http/, 'ws')}/ws`;
}

export function connectRealtime(opts: { url: string; getToken: () => Promise<string | undefined> }) {
  let socket: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let stopped = false;

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(open, Math.min(30_000, 1_000 * 2 ** attempt++));
  };

  async function open() {
    const token = await opts.getToken();
    if (stopped || !token) return;
    const ws = new WebSocket(opts.url);
    socket = ws;
    ws.onopen = () => ws.send(JSON.stringify({ event: 'auth', data: { token } }));
    ws.onmessage = (m) => {
      try {
        const msg = JSON.parse(String(m.data)) as { event: string };
        if (msg.event === 'ready') attempt = 0;
        if (msg.event === 'notification') listeners.forEach((l) => l());
      } catch {
        // Ignore malformed frames.
      }
    };
    ws.onclose = schedule;
    ws.onerror = () => ws.close();
  }

  void open();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
  };
}
