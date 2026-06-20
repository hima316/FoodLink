'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Building2, Save,
  Shield, AlertCircle, Camera, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn, getInitials } from '../../../lib/utils';
import useAuthStore from '../../../context/authStore';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

// Load map picker only on client (Leaflet needs window)
const LocationPickerMap = dynamic(
  () => import('../../../components/shared/LocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 bg-muted/30 rounded-xl flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState<'profile' | 'security'>('profile');

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState({
    name:             '',
    phone:            '',
    bio:              '',
    organizationName: '',
    organizationType: '',
    street:           '',
    city:             '',
    state:            '',
    country:          '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  // Populate form from existing user data
  useEffect(() => {
    if (!user) return;
    setForm({
      name:             user.name             || '',
      phone:            user.phone            || '',
      bio:              user.bio              || '',
      organizationName: user.organizationName || '',
      organizationType: user.organizationType || '',
      street:           user.address?.street  || '',
      city:             user.address?.city    || '',
      state:            user.address?.state   || '',
      country:          user.address?.country || '',
    });

    // Restore existing pin from profile if coordinates are valid
    const coords = user.location?.coordinates;
    if (
      coords &&
      Array.isArray(coords) &&
      coords.length === 2 &&
      (coords[0] !== 0 || coords[1] !== 0)
    ) {
      // MongoDB stores [lng, lat] — picker needs { lat, lng }
      setPickedLocation({ lat: coords[1], lng: coords[0] });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build location object:
      // If user picked on map → send real coords (backend uses them directly)
      // If no pin → send [0,0] so backend falls back to geocoding the address
      const location = pickedLocation
        ? { type: 'Point', coordinates: [pickedLocation.lng, pickedLocation.lat] }
        : { type: 'Point', coordinates: [0, 0] };

      const res = await api.patch('/users/profile', {
        name:             form.name,
        phone:            form.phone,
        bio:              form.bio,
        organizationName: form.organizationName || undefined,
        organizationType: form.organizationType || undefined,
        address: {
          street:  form.street  || undefined,
          city:    form.city    || undefined,
          state:   form.state   || undefined,
          country: form.country || undefined,
        },
        location, // always send — backend decides which coords to use
      });

      setUser(res.data.data.user);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = cn(
    'w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none',
    'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all',
    'placeholder:text-muted-foreground/60 text-foreground'
  );

  const roleGradient: Record<string, string> = {
    hotel:     'from-amber-400 to-orange-500',
    ngo:       'from-brand-500 to-brand-700',
    volunteer: 'from-blue-400 to-blue-600',
    admin:     'from-purple-500 to-purple-700',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences</p>
      </motion.div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br shadow-lg',
              roleGradient[user?.role || 'volunteer']
            )}>
              {getInitials(user?.organizationName || user?.name || 'U')}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">{user?.organizationName || user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full capitalize',
                user?.role === 'hotel'     ? 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400'  :
                user?.role === 'ngo'       ? 'bg-brand-100  dark:bg-brand-900/30  text-brand-700  dark:text-brand-400'  :
                user?.role === 'volunteer' ? 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400'   :
                                             'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
              )}>{user?.role}</span>
              {user?.isVerified && (
                <span className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['profile', 'security'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize',
              tab === t
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile} className="space-y-5">

          {/* Organization — hotel / ngo only */}
          {(user?.role === 'hotel' || user?.role === 'ngo') && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-brand-600" />
                <h2 className="font-bold text-sm text-foreground">Organization Details</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Organization Name</label>
                <input type="text" value={form.organizationName}
                  onChange={e => setForm({ ...form, organizationName: e.target.value })}
                  className={inputCls} placeholder="Your organization name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Organization Type</label>
                <input type="text" value={form.organizationType}
                  onChange={e => setForm({ ...form, organizationType: e.target.value })}
                  className={inputCls} placeholder="e.g. Hotel, Food Bank, NGO" />
              </div>
            </div>
          )}

          {/* Personal Info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-sm text-foreground">Personal Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={inputCls} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Bio / About</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={3} className={cn(inputCls, 'resize-none')}
                placeholder="Tell us about yourself or your organization..." />
            </div>
          </div>

          {/* Address */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-foreground">Address</h2>
              <span className="text-xs text-muted-foreground ml-1">
                — used to show your location on the map
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-1.5">Street</label>
                <input type="text" value={form.street}
                  onChange={e => setForm({ ...form, street: e.target.value })}
                  className={inputCls} placeholder="123 Main Street" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">City</label>
                <input type="text" value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  className={inputCls} placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">State</label>
                <input type="text" value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  className={inputCls} placeholder="Maharashtra" />
              </div>
            </div>

            {/* ── Map Location Picker */}
            <div className="pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold',
                  showLocationPicker
                    ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                    : 'border-border hover:border-brand-300 text-muted-foreground hover:text-foreground'
                )}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {pickedLocation
                      ? `📍 Pin set: ${pickedLocation.lat.toFixed(5)}, ${pickedLocation.lng.toFixed(5)}`
                      : 'Pin your exact location on map'}
                  </span>
                </div>
                {showLocationPicker
                  ? <ChevronUp className="w-4 h-4 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
              </button>

              {showLocationPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden">
                  <LocationPickerMap
                    onLocationChange={setPickedLocation}
                    initialCoords={pickedLocation}
                    height={300}
                  />
                  {/* Explanation */}
                  <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Your pinned location will appear as a <strong>blue dot</strong> on the FoodLink map for
                      all roles to see.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Save */}
          <button type="submit" disabled={saving}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm transition-all',
              'bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-glow',
              saving && 'opacity-70 cursor-not-allowed'
            )}>
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </motion.form>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <h2 className="font-bold text-sm text-foreground">Security Settings</h2>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              After changing your password you will need to log in again.
            </p>
          </div>

          {['currentPassword', 'newPassword', 'confirmPassword'].map(field => (
            <div key={field}>
              <label className="block text-sm font-semibold text-foreground mb-1.5 capitalize">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input type="password" value={passwordForm[field as keyof typeof passwordForm]}
                onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                className={inputCls} placeholder="••••••••" />
            </div>
          ))}

          <button
            onClick={() => toast('Password change coming soon.', { icon: '🔒' })}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-purple-600 hover:bg-purple-700 transition-all shadow-md flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Update Password
          </button>

          {/* Account info */}
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Info</p>
            {[
              { label: 'Email',            value: user?.email          || '-' },
              { label: 'Role',             value: user?.role           || '-' },
              { label: 'Email Verified',   value: user?.emailVerified  ? '✅ Yes' : '❌ No' },
              { label: 'Account Verified', value: user?.isVerified     ? '✅ Yes' : '⏳ Pending' },
              { label: 'Location Pinned',  value: pickedLocation       ? `✅ ${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}` : '❌ Not set' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold text-foreground capitalize">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}