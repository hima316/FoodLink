'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Building2,
  Leaf, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2,
  UtensilsCrossed, HandHeart, Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import  useAuthStore  from '../../../context/authStore';
import { UserRole } from '../../../types';
import { cn, getPasswordStrength } from '../../../lib/utils';

// ==========================================
// Role options
// ==========================================
const roles: {
  id:    UserRole;
  label: string;
  icon:  React.ElementType;
  desc:  string;
  color: string;
}[] = [
  {
    id:    'hotel',
    label: 'Hotel / Restaurant',
    icon:  UtensilsCrossed,
    desc:  'Donate surplus food from your establishment',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id:    'ngo',
    label: 'NGO / Charity',
    icon:  HandHeart,
    desc:  'Receive and distribute food to communities',
    color: 'from-brand-500 to-brand-700',
  },
  {
    id:    'volunteer',
    label: 'Volunteer',
    icon:  Truck,
    desc:  'Help pick up and deliver food donations',
    color: 'from-blue-500 to-blue-700',
  },
];

// ==========================================
// Component
// ==========================================
export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const [step,         setStep]         = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name:             '',
    email:            '',
    password:         '',
    organizationName: '',
    phone:            '',
  });

  const passwordStrength = getPasswordStrength(form.password);

  // ── Step 1: pick a role
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    clearError();
    setFieldErrors({});
    setStep(2);
  };

  // ── Step 2 validation
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())
      errs.name = 'Full name is required';
    if (!form.email.trim())
      errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Enter a valid email address';
    if (!form.password)
      errs.password = 'Password is required';
    else if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if ((selectedRole === 'hotel' || selectedRole === 'ngo') && !form.organizationName.trim())
      errs.organizationName = 'Organization name is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Safety check — should never happen because step 1 forces a role
    if (!selectedRole) {
      toast.error('Please go back and select a role first.');
      setStep(1);
      return;
    }

    if (!validateStep2()) {
      toast.error('Please fix the highlighted errors.');
      return;
    }

    try {
      await registerUser({
        name:             form.name.trim(),
        email:            form.email.trim().toLowerCase(),
        password:         form.password,
        role: selectedRole as "hotel" | "ngo" | "volunteer",         
        organizationName: form.organizationName.trim() || undefined,
        phone:            form.phone.trim()        || undefined,
      });

      toast.success('Account created! Welcome to FoodLink.');

      // Read role directly from selectedRole — no need to re-read store
      router.push(`/dashboard/${selectedRole}`);

    } catch (err: unknown) {
      // Error message is already set in the store (shown in the alert below)
      // But also show a toast so it's obvious
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  // ── Field updater helper
  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  // ── Input class helper
  const inputCls = (field: string) => cn(
    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all',
    'bg-background text-foreground placeholder:text-muted-foreground/60',
    'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
    fieldErrors[field]
      ? 'border-red-400 dark:border-red-600'
      : 'border-border hover:border-muted-foreground/40'
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {/* ── Mobile logo */}
      <Link href="/" className="inline-flex items-center gap-2 mb-6 lg:hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-lg">FoodLink</span>
      </Link>

      {/* ── Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className={cn('flex-1 h-1.5 rounded-full transition-all duration-300', 'bg-brand-600')} />
        <div className={cn('flex-1 h-1.5 rounded-full transition-all duration-300', step === 2 ? 'bg-brand-600' : 'bg-muted')} />
      </div>

      {/* ── Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-foreground">
          {step === 1 ? 'Join FoodLink' : 'Create your account'}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {step === 1
            ? 'Choose your role to get started.'
            : `Registering as ${selectedRoleData?.label ?? ''}`}
          {' '}
          <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-semibold">
            Sign in instead →
          </Link>
        </p>
      </div>

      {/* ── Error alert */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 mb-6">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════
            STEP 1 — Role selection
            ════════════════════════════════ */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3">
            {roles.map(role => {
              const Icon = role.icon;
              return (
                <button key={role.id} type="button"
                  onClick={() => handleSelectRole(role.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-brand-400 dark:hover:border-brand-600 hover:bg-muted/40 transition-all group text-left">
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform',
                    role.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </motion.div>
        )}

        {/* ════════════════════════════════
            STEP 2 — Account details
            ════════════════════════════════ */}
        {step === 2 && (
          <motion.form key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="space-y-4">

            {/* Organization name (hotel / ngo only) */}
            {(selectedRole === 'hotel' || selectedRole === 'ngo') && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text"
                    value={form.organizationName}
                    onChange={e => setField('organizationName', e.target.value)}
                    placeholder={selectedRole === 'hotel' ? 'Grand Palace Hotel' : 'Feed The Hungry Foundation'}
                    className={cn(inputCls('organizationName'), 'pl-10')} />
                </div>
                {fieldErrors.organizationName && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.organizationName}</p>
                )}
              </div>
            )}

            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {selectedRole === 'hotel' || selectedRole === 'ngo'
                  ? 'Contact Person Name' : 'Full Name'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="John Smith"
                  className={cn(inputCls('name'), 'pl-10')} />
              </div>
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={cn(inputCls('email'), 'pl-10')} />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Phone Number{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel"
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={cn(inputCls('phone'), 'pl-10')} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  className={cn(inputCls('password'), 'pl-10 pr-12')} />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={cn(
                        'flex-1 h-1 rounded-full transition-all',
                        i <= passwordStrength.score
                          ? passwordStrength.score <= 2
                            ? 'bg-red-400'
                            : passwordStrength.score <= 3
                            ? 'bg-amber-400'
                            : 'bg-brand-500'
                          : 'bg-muted'
                      )} />
                    ))}
                  </div>
                  <p className={cn('text-xs font-medium', passwordStrength.color)}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}

              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="button"
                onClick={() => { setStep(1); clearError(); setFieldErrors({}); }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button type="submit"
                disabled={isLoading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all',
                  'bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-glow active:scale-[0.99]',
                  isLoading && 'opacity-70 cursor-not-allowed'
                )}>
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-1">
              By registering, you agree to use FoodLink responsibly to reduce food waste.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
