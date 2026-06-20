'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, AlertTriangle, Package, Truck, CheckCircle2, Info } from 'lucide-react';
import { cn, formatTimeAgo } from '../../../lib/utils';
import { Notification, NotificationType } from '../../../types';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  donation_available: { icon: Package,       color: 'text-brand-600',  bg: 'bg-brand-50  dark:bg-brand-950/30' },
  donation_claimed:   { icon: CheckCircle2,  color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-950/30' },
  donation_picked_up: { icon: Truck,         color: 'text-amber-600',  bg: 'bg-amber-50  dark:bg-amber-950/30' },
  donation_delivered: { icon: CheckCircle2,  color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  donation_expired:   { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50    dark:bg-red-950/30' },
  emergency_request:  { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50    dark:bg-red-950/30' },
  volunteer_assigned: { icon: Truck,         color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-950/30' },
  system_alert:       { icon: Info,          color: 'text-gray-600',   bg: 'bg-gray-50   dark:bg-gray-900/30' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<'all' | 'unread'>('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update');
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      // Silently fail
    }
  };

  const filtered    = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              filter === f
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            )}>
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {filter === 'unread' ? 'No unread notifications' : "You'll see alerts here as activity happens"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((notif, i) => {
              const config = typeConfig[notif.type] ?? typeConfig.system_alert;
              const Icon   = config.icon;
              return (
                <motion.div key={notif._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !notif.isRead && markOneRead(notif._id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-card',
                    notif.isRead
                      ? 'bg-card border-border'
                      : 'bg-card border-brand-200 dark:border-brand-800/50 shadow-sm'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-semibold', notif.isRead ? 'text-foreground/80' : 'text-foreground')}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1.5">{formatTimeAgo(notif.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
