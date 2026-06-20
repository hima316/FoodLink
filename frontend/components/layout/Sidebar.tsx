'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Leaf, LayoutDashboard, UtensilsCrossed, HandHeart,
  Users, Bell, BarChart3, Map, Settings, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon, Shield,
  Package, Truck, AlertTriangle, MessageCircle,
  ClipboardList, UserCircle, Menu,
} from 'lucide-react';
import { cn, getInitials } from '../../lib/utils';
import useAuthStore from '../../context/authStore';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

// ==========================================
// Role-based navigation items
// ==========================================
const navConfig: Record<UserRole, Array<{
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}>> = {
  hotel: [
    { href: '/dashboard/hotel', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/hotel/donations', label: 'My Donations', icon: UtensilsCrossed },
    { href: '/dashboard/hotel/new-donation', label: 'New Donation', icon: Package },
    { href: '/dashboard/hotel/history', label: 'History', icon: ClipboardList },
    { href: '/dashboard/hotel/map', label: 'Map View', icon: Map },
    { href: '/dashboard/hotel/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  ngo: [
    { href: '/dashboard/ngo', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/ngo/feed', label: 'Live Feed', icon: HandHeart },
    { href: '/dashboard/ngo/claimed', label: 'Claimed', icon: Package },
    { href: '/dashboard/ngo/volunteers', label: 'Volunteers', icon: Users },
    { href: '/dashboard/ngo/emergency', label: 'Emergency', icon: AlertTriangle },
    { href: '/dashboard/ngo/map', label: 'Map View', icon: Map },
    { href: '/dashboard/ngo/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  volunteer: [
    { href: '/dashboard/volunteer', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/volunteer/pickups', label: 'My Pickups', icon: Truck },
    { href: '/dashboard/volunteer/history', label: 'History', icon: ClipboardList },
    { href: '/dashboard/volunteer/map', label: 'Map View', icon: Map },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/donations', label: 'All Donations', icon: UtensilsCrossed },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/admin/emergency', label: 'Emergency', icon: AlertTriangle },
    { href: '/dashboard/admin/map', label: 'Map View', icon: Map },
  ],
};

const roleColors: Record<UserRole, string> = {
  hotel:     'from-amber-500 to-orange-500',
  ngo:       'from-brand-600 to-brand-700',
  volunteer: 'from-blue-500 to-blue-600',
  admin:     'from-purple-500 to-purple-600',
};

const roleLabels: Record<UserRole, string> = {
  hotel:     'Hotel / Restaurant',
  ngo:       'NGO / Charity',
  volunteer: 'Volunteer',
  admin:     'Administrator',
};

// ==========================================
// Sidebar Component
// ==========================================
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const navItems = navConfig[user.role] || [];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col',
        'sidebar-frosted border-r border-border/50',
        'transition-all duration-300'
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/50 flex-shrink-0">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                Food<span className="text-brand-600 dark:text-brand-400">Link</span>
              </span>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center mx-auto"
            >
              <Leaf className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Expand button (collapsed state) ── */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-all z-10"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ── User Profile Card ── */}
      <div className={cn(
        'px-3 py-3 border-b border-border/50 flex-shrink-0',
        collapsed && 'flex justify-center'
      )}>
        {collapsed ? (
          <Link href="/dashboard/settings" title={user.name}>
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br',
              roleColors[user.role]
            )}>
              {getInitials(user.organizationName || user.name)}
            </div>
          </Link>
        ) : (
          <Link href="/dashboard/settings" className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-all group">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br',
              roleColors[user.role]
            )}>
              {getInitials(user.organizationName || user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.organizationName || user.name}
              </p>
              <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
            </div>
            {user.isVerified && (
              <Shield className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            )}
          </Link>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard/' + user.role && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-white' : '')} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-sidebar-item"
                  className="absolute inset-0 rounded-xl bg-brand-600 -z-10"
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-border/50" />

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          title={collapsed ? 'Notifications' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/70',
            collapsed && 'justify-center px-2'
          )}
        >
          <Bell className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Notifications</span>}
        </Link>

        {/* Chatbot */}
        <Link
          href="/dashboard/chatbot"
          title={collapsed ? 'AI Assistant' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/70',
            collapsed && 'justify-center px-2'
          )}
        >
          <MessageCircle className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>AI Assistant</span>}
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/70',
            collapsed && 'justify-center px-2'
          )}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* ── Footer ── */}
      <div className="px-2 py-3 border-t border-border/50 space-y-0.5 flex-shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={collapsed ? 'Toggle theme' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/70',
            collapsed && 'justify-center px-2'
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] flex-shrink-0" />
          ) : (
            <Moon className="w-[18px] h-[18px] flex-shrink-0" />
          )}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
