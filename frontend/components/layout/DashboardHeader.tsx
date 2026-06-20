'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, X, Menu } from 'lucide-react';
import { formatTimeAgo, cn } from '../../lib/utils';
import useAuthStore from '../../context/authStore';
import api from '../../lib/api';
import { Notification } from '../../types';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export default function DashboardHeader({
  title,
  subtitle,
  onMobileMenuToggle,
}: DashboardHeaderProps) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      // Silently fail
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left - Title & greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            {title ? (
              <>
                <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{getGreeting()},</p>
                <h1 className="text-lg font-bold text-foreground truncate">
                  {user?.organizationName || user?.name || 'Welcome back'}
                </h1>
              </>
            )}
          </div>
        </div>

        {/* Right - Search, Notifications */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search Bar */}
          <div className={cn(
            'relative hidden sm:flex items-center transition-all duration-300',
            isSearchFocused ? 'w-64' : 'w-44'
          )}>
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search donations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-muted/60 border border-transparent hover:border-border focus:border-brand-500 focus:outline-none focus:bg-background transition-all placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-premium overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif._id}
                            className={cn(
                              'px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors',
                              !notif.isRead && 'bg-brand-50/50 dark:bg-brand-950/20'
                            )}
                          >
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-border">
                      <Link
                        href="/dashboard/notifications"
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
