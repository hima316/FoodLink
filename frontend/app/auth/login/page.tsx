'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Leaf, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../../context/authStore';
import { UserRole } from '../../../types';
import { cn } from '../../../lib/utils';

// Quick-login demo credentials
const demoAccounts = [
  { role: 'hotel' as UserRole,     label: 'Hotel',    email: 'hotel@grandpalace.com',       password: 'Hotel@1234' },
  { role: 'ngo' as UserRole,       label: 'NGO',      email: 'contact@feedthehungry.org',    password: 'NGO@1234' },
  { role: 'volunteer' as UserRole, label: 'Volunteer', email: 'veda@gmail.com',              password: 'veda2606' },
  { role: 'admin' as UserRole,     label: '👑 Admin',    email: 'admin@foodlink.com',            password: 'Admin@1234' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Enter a valid email';
    if (!form.password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');

      const { user } = useAuthStore.getState();
      if (user) {
        router.push(`/dashboard/${user.role}`);
      }
    } catch {
      // Error handled by store
    }
  };

  const handleDemoLogin = async (demo: (typeof demoAccounts)[0]) => {
  clearError();

  // Prevent auto login for admin
  if (demo.role === 'admin') {
  setForm({
    email: demo.email,
    password: '',
  });

  toast('Enter admin password to continue');
  return;
  }

  try {
    await login(demo.email, demo.password);
    toast.success(`Logged in as ${demo.label}`);

    const { user } = useAuthStore.getState();
    if (user) router.push(`/dashboard/${user.role}`);
  } catch {
    // Error handled by store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg">FoodLink</span>
        </Link>
        <h2 className="text-3xl font-display font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to continue making an impact.{' '}
          <Link href="/auth/register" className="text-brand-600 hover:text-brand-700 font-semibold">
            New here? Join us →
          </Link>
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 mb-6"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
              }}
              placeholder="you@example.com"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none',
                'bg-background text-foreground placeholder:text-muted-foreground/60',
                'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                fieldErrors.email ? 'border-red-400 dark:border-red-600' : 'border-border hover:border-muted-foreground/40'
              )}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-foreground">Password</label>
            
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
              }}
              placeholder="••••••••"
              className={cn(
                'w-full pl-10 pr-12 py-3 rounded-xl border text-sm transition-all outline-none',
                'bg-background text-foreground placeholder:text-muted-foreground/60',
                'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                fieldErrors.password ? 'border-red-400' : 'border-border hover:border-muted-foreground/40'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all',
            'bg-brand-600 hover:bg-brand-700 active:scale-[0.99] shadow-md hover:shadow-glow',
            isLoading && 'opacity-70 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-3">Demo Accounts & Admin Access</span>
        </div>
      </div>

      {/* Demo Accounts */}
      <div className="grid grid-cols-2 gap-2">
        {demoAccounts.map((demo) => (
          <button
            key={demo.role}
            onClick={() => handleDemoLogin(demo)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:border-brand-300 dark:hover:border-brand-700 hover:bg-muted/60 text-xs font-medium text-foreground transition-all disabled:opacity-50"
          >
            <span>{demo.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
