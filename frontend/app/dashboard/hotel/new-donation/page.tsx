'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, Package, Clock, MapPin, AlertTriangle,
  ChevronLeft, Save, Thermometer, Info, CheckCircle2,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import donationService from '../../../../lib/donations';
import { FoodCategory, CreateDonationData } from '../../../../types';
import toast from 'react-hot-toast';

// ── Load map picker only on client (Leaflet needs window)
const LocationPickerMap = dynamic(
  () => import('../../../../components/shared/LocationPickerMap'),
  { ssr: false, loading: () => (
    <div className="w-full h-80 bg-muted/30 rounded-xl flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )}
);

// ==========================================
// Constants
// ==========================================
const CATEGORIES: { value: FoodCategory; label: string; icon: string }[] = [
  { value: 'cooked_meals',      label: 'Cooked Meals',        icon: '🍽️' },
  { value: 'raw_ingredients',   label: 'Raw Ingredients',     icon: '🥕' },
  { value: 'bakery',            label: 'Bakery & Bread',      icon: '🥖' },
  { value: 'beverages',         label: 'Beverages',           icon: '🥤' },
  { value: 'fruits_vegetables', label: 'Fruits & Vegetables', icon: '🥦' },
  { value: 'dairy',             label: 'Dairy Products',      icon: '🥛' },
  { value: 'packaged_food',     label: 'Packaged Food',       icon: '📦' },
  { value: 'other',             label: 'Other',               icon: '🍱' },
];

const UNITS      = ['kg', 'lbs', 'portions', 'boxes', 'packets', 'liters', 'pieces'];
const ALLERGENS  = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Shellfish', 'Fish', 'Sesame'];

interface FormErrors { [key: string]: string; }

// ==========================================
// Page
// ==========================================
export default function NewDonationPage() {
  const router  = useRouter();
  const [loading, setLoading]   = useState(false);
  const [errors,  setErrors]    = useState<FormErrors>({});

  // Map picker state
  const [showMapPicker,  setShowMapPicker]  = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState({
    title:            '',
    description:      '',
    category:         '' as FoodCategory | '',
    quantity:         '',
    unit:             'kg',
    servings:         '',
    expiryHours:      '4',
    temperatureRequirements: 'ambient' as 'ambient' | 'refrigerated' | 'frozen',
    isEmergency:      false,
    allergens:        [] as string[],
    specialInstructions: '',
    street: '', city: '', state: '', zipCode: '',
  });

  const set = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const toggleAllergen = (allergen: string) => {
    setForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category)           e.category    = 'Select a food category';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
                                  e.quantity    = 'Enter a valid quantity';
    if (!form.city.trim())        e.city        = 'City is required';
    if (!form.expiryHours || isNaN(Number(form.expiryHours)) || Number(form.expiryHours) < 0.5)
                                  e.expiryHours = 'Minimum 0.5 hours';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the highlighted errors'); return; }

    setLoading(true);
    try {
      const expiryTime     = new Date(Date.now() + Number(form.expiryHours) * 3600000).toISOString();
      const pickupDeadline = new Date(Date.now() + Number(form.expiryHours) * 0.75 * 3600000).toISOString();

      // Build location object:
      // If user picked on map → send real coords (overrides geocoding)
      // Otherwise → send [0,0] so backend tries geocoding from address
      const location = pickedLocation
        ? { type: 'Point', coordinates: [pickedLocation.lng, pickedLocation.lat] }
        : { type: 'Point', coordinates: [0, 0] };

      const payload = {
        title:       form.title,
        description: form.description,
        category:    form.category as FoodCategory,
        quantity:    Number(form.quantity),
        unit:        form.unit,
        servings:    form.servings ? Number(form.servings) : undefined,
        expiryTime,
        pickupDeadline,
        address: {
          street:  form.street  || undefined,
          city:    form.city,
          state:   form.state   || undefined,
          country: 'India',
          zipCode: form.zipCode || undefined,
        },
        location,
        allergens:             form.allergens,
        specialInstructions:   form.specialInstructions || undefined,
        temperatureRequirements: form.temperatureRequirements,
        isEmergency:           form.isEmergency,
      };

      await donationService.create(payload as unknown as CreateDonationData);
      toast.success('Donation posted! NGOs have been notified. 🎉');
      router.push('/dashboard/hotel/donations');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to create donation';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) => cn(
    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all',
    'bg-background text-foreground placeholder:text-muted-foreground/60',
    'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
    errors[field]
      ? 'border-red-400 dark:border-red-600'
      : 'border-border hover:border-muted-foreground/40'
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Post New Donation</h1>
          <p className="text-sm text-muted-foreground">Fill in the details about your surplus food</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Emergency Toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all select-none',
            form.isEmergency ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : 'border-border hover:border-red-300'
          )}
          onClick={() => set('isEmergency', !form.isEmergency)}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              form.isEmergency ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted')}>
              <AlertTriangle className={cn('w-5 h-5', form.isEmergency ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Emergency Donation</p>
              <p className="text-xs text-muted-foreground">Urgent — gets priority visibility to NGOs</p>
            </div>
          </div>
          <div className={cn('w-12 h-6 rounded-full transition-all relative', form.isEmergency ? 'bg-red-500' : 'bg-muted')}>
            <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
              form.isEmergency ? 'left-6' : 'left-0.5')} />
          </div>
        </motion.div>

        {/* Food Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="w-4 h-4 text-brand-600" />
            <h2 className="font-bold text-foreground text-sm">Food Details</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Donation Title <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Fresh Biryani — 40 Portions" className={inputCls('title')} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={3} placeholder="Describe the food, packaging, condition..."
              className={cn(inputCls('description'), 'resize-none')} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Food Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.value} type="button" onClick={() => set('category', cat.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all',
                    form.category === cat.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                      : 'border-border hover:border-brand-300 text-muted-foreground hover:text-foreground'
                  )}>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
                min="0.1" step="0.1" placeholder="25" className={inputCls('quantity')} />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Unit</label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)}
                className={cn(inputCls('unit'), 'cursor-pointer')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Estimated Servings
              <span className="text-muted-foreground text-xs font-normal ml-2">(optional)</span>
            </label>
            <input type="number" value={form.servings} onChange={(e) => set('servings', e.target.value)}
              min="1" placeholder="e.g. 50" className={inputCls('servings')} />
          </div>
        </motion.div>

        {/* Timing & Storage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-foreground text-sm">Timing & Storage</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Food Valid For (hours) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input type="number" value={form.expiryHours} onChange={(e) => set('expiryHours', e.target.value)}
                min="0.5" step="0.5" placeholder="4" className={cn(inputCls('expiryHours'), 'flex-1')} />
              <span className="text-sm text-muted-foreground whitespace-nowrap">hours from now</span>
            </div>
            {errors.expiryHours && <p className="text-xs text-red-500 mt-1">{errors.expiryHours}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              <Thermometer className="w-4 h-4 inline mr-1 text-amber-500" />
              Temperature Requirements
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'ambient',      label: 'Room Temp',    icon: '🌡️' },
                { value: 'refrigerated', label: 'Refrigerated', icon: '❄️' },
                { value: 'frozen',       label: 'Frozen',       icon: '🧊' },
              ].map((opt) => (
                <button key={opt.value} type="button" onClick={() => set('temperatureRequirements', opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all',
                    form.temperatureRequirements === opt.value
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                      : 'border-border hover:border-amber-300 text-muted-foreground'
                  )}>
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-foreground text-sm">Pickup Location</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Street Address</label>
              <input type="text" value={form.street} onChange={(e) => set('street', e.target.value)}
                placeholder="123 Main Street" className={inputCls('street')} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)}
                placeholder="Mumbai" className={inputCls('city')} />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">State</label>
              <input type="text" value={form.state} onChange={(e) => set('state', e.target.value)}
                placeholder="Maharashtra" className={inputCls('state')} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">ZIP / PIN Code</label>
              <input type="text" value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)}
                placeholder="400001" className={inputCls('zipCode')} />
            </div>
          </div>

          {/* ── Map Picker (collapsible) */}
          <div className="pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => setShowMapPicker(!showMapPicker)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold',
                showMapPicker
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                  : 'border-border hover:border-brand-300 text-muted-foreground hover:text-foreground'
              )}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {pickedLocation
                    ? `📍 Pin set: ${pickedLocation.lat.toFixed(5)}, ${pickedLocation.lng.toFixed(5)}`
                    : 'Pin exact location on map for accuracy.'}
                </span>
              </div>
              {showMapPicker
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMapPicker && (
              <div className="mt-3">
                <LocationPickerMap
                  onLocationChange={setPickedLocation}
                  initialCoords={pickedLocation}
                  height={320}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Allergens & Instructions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-purple-500" />
            <h2 className="font-bold text-foreground text-sm">Additional Information</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Allergens Present</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((allergen) => (
                <button key={allergen} type="button" onClick={() => toggleAllergen(allergen)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all',
                    form.allergens.includes(allergen)
                      ? 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                      : 'border-border text-muted-foreground hover:border-red-300'
                  )}>
                  {allergen}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Special Instructions</label>
            <textarea value={form.specialInstructions}
              onChange={(e) => set('specialInstructions', e.target.value)}
              rows={2} placeholder="Handling notes, packaging details, pickup instructions..."
              className={cn(inputCls('specialInstructions'), 'resize-none')} />
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex gap-3 pb-6">
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm transition-all',
              form.isEmergency ? 'bg-red-500 hover:bg-red-600 shadow-md' : 'bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-glow',
              loading && 'opacity-70 cursor-not-allowed'
            )}>
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</>
            ) : (
              <><Save className="w-4 h-4" />{form.isEmergency ? 'Post Emergency Donation' : 'Post Donation'}</>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}
