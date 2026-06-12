"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSSE } from "@/hooks/use-sse";
import type { NotificationData } from "@/types/seo";

interface NotificationContextValue {
  notifications: NotificationData[];
  unreadCount: number;
  connected: boolean;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  connected: false,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data, connected } = useSSE<{
    unread: number;
    notifications: NotificationData[];
  }>("/api/notifications/stream");

  return (
    <NotificationContext.Provider
      value={{
        notifications: data?.notifications ?? [],
        unreadCount: data?.unread ?? 0,
        connected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
