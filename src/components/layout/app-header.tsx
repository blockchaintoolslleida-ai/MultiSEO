"use client";

import { Bell, ChevronDown } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useNotifications } from "./notification-provider";

export function AppHeader() {
  const { unreadCount: unread } = useNotifications();

  return (
    <header className="flex items-center justify-between h-[60px] px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2.5 font-bold text-[17px] text-gray-900">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        {APP_NAME}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-[38px] h-[38px] rounded-[10px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell className="w-[18px] h-[18px] text-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-500 text-white rounded-full text-[10px] px-1.5 font-semibold">
              {unread}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center text-white font-bold text-sm">
            JD
          </div>
          <span className="text-[13.5px] font-medium text-gray-700">Juan Díaz</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
