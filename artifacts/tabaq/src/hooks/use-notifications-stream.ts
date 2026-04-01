import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/api';

interface NotificationsStreamState {
  unreadCount: number;
  isConnected: boolean;
  refresh: () => void;
}

/**
 * Connects to the SSE notifications stream for real-time unread count updates.
 * Falls back to polling every 30s if SSE is unavailable or the user is not logged in.
 */
export function useNotificationsStream(enabled: boolean): NotificationsStreamState {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchCount = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setUnreadCount(data.count ?? 0);
      }
    } catch {}
  }, []);

  const refresh = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    let cleanup: (() => void) | undefined;

    const startSSE = () => {
      if (typeof EventSource === 'undefined') {
        // Fallback: polling
        fetchCount();
        pollRef.current = setInterval(fetchCount, 30_000);
        return;
      }

      try {
        const es = new EventSource(`${API_BASE}/api/notifications/stream`, {
          withCredentials: true,
        });
        esRef.current = es;

        es.onopen = () => {
          if (mountedRef.current) setIsConnected(true);
        };

        es.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'unread_count') {
              setUnreadCount(payload.count ?? 0);
            }
          } catch {}
        };

        es.onerror = () => {
          if (!mountedRef.current) return;
          setIsConnected(false);
          es.close();
          esRef.current = null;
          // Fallback to polling after SSE error
          if (!pollRef.current) {
            fetchCount();
            pollRef.current = setInterval(fetchCount, 30_000);
          }
        };

        cleanup = () => {
          es.close();
          esRef.current = null;
        };
      } catch {
        fetchCount();
        pollRef.current = setInterval(fetchCount, 30_000);
      }
    };

    startSSE();

    return () => {
      mountedRef.current = false;
      cleanup?.();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, fetchCount]);

  return { unreadCount, isConnected, refresh };
}
