import React, { useState, useEffect, useRef } from "react";
import { notificationAPI, Notification } from "../../services/api";
import { Bell } from "lucide-react";
import { format } from "date-fns";

const NotificationBell: React.FC = () => {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 10s
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await notificationAPI.getUnreadCount();
        if (res.success && res.data) setCount(res.data.count);
      } catch {
        /* non-critical */
      }
    }
    fetchCount();
    const id = setInterval(fetchCount, 60000); // 60s — Neon idles connections aggressively
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      try {
        const res = await notificationAPI.list();
        if (res.success && res.data) setNotifications(res.data);
      } catch {
        /* non-critical */
      }
    }
  }

  async function handleMarkRead(id: number) {
    await notificationAPI.markRead(id);
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    await notificationAPI.markAllRead();
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
    setCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {count > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-indigo-600 hover:text-indigo-800">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.is_read ? "bg-indigo-50/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{format(new Date(n.created_at), "MMM d, HH:mm")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
