"use client";

import { useState, useEffect, useRef } from "react";

interface UseSSEResult<T> {
  data: T | null;
  connected: boolean;
}

export function useSSE<T = unknown>(url: string): UseSSEResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      eventSource.onmessage = (event) => {
        if (cancelled) return;
        try {
          setData(JSON.parse(event.data) as T);
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        if (cancelled) return;
        eventSource?.close();
        setConnected(false);
        // Reconnect after 3s
        reconnectRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      eventSource?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [url]);

  return { data, connected };
}
