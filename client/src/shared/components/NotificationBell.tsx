import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { api } from '../lib/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { io, Socket } from 'socket.io-client';
import { unwrapArray } from '../lib/response';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read_at: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<string, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

const TYPE_DOT: Record<string, string> = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
};

function timeAgo(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const NotificationBell = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(unwrapArray<Notification>(res.data, ['notifications']));
      setUnreadCount(Number(res.data?.data?.unreadCount || res.data?.unreadCount || 0));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  // Real-time socket for new notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = io();
    socketRef.current = socket;
    socket.emit('authenticate', user.id);

    socket.on('new-notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(c => c + 1);
    });

    return () => { socket.disconnect(); };
  }, [isAuthenticated, user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); }}
        className="text-slate-400 hover:text-amber-500 transition-colors relative p-2 rounded-xl hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-medium">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-violet-600 font-bold px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${n.read_at ? 'bg-white hover:bg-slate-50/60' : 'bg-violet-50/40 hover:bg-violet-50/70'}`}
                  onClick={() => {
                    if (!n.read_at) markOneRead(n.id);
                    if (n.link) window.location.href = n.link;
                    setOpen(false);
                  }}
                >
                  {/* Dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${n.read_at ? 'bg-slate-300' : TYPE_DOT[n.type] || 'bg-amber-400'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${n.read_at ? 'text-slate-600' : 'text-slate-900'} line-clamp-1`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                    <p className={`text-[10px] mt-1 font-medium ${TYPE_STYLES[n.type] || 'text-slate-400'}`}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
