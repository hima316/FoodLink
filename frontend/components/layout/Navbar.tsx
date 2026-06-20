'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Leaf, Menu, X, Sun, Moon, ChevronDown,
  LayoutDashboard, LogIn, UserPlus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import useAuthStore from '../../context/authStore';

const navLinks = [
  
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#features', label: 'Features' },
  { href: '/#about', label: 'About' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const getDashboardHref = () => {
    if (!user) return '/auth/login';
    return `/dashboard/${user.role}`;
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'glass shadow-glass border-b border-white/20 dark:border-white/5'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                Food<span className="text-brand-600 dark:text-brand-400">Link</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    'text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                aria-label="Toggle theme"
              >
                <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
                <Moon className="w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated ? (
                  <Link
                    href={getDashboardHref()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-glow"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-glow"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 glass border-b border-white/20 dark:border-white/5 md:hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    href={getDashboardHref()}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-foreground"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold"
                    >
                      <UserPlus className="w-4 h-4" />
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
