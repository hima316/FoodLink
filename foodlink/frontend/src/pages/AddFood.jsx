import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Drumstick, Info } from 'lucide-react';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'g', 'liter', 'pieces', 'boxes', 'servings', 'packets'];
const FOOD_TYPES = ['Cooked Meal', 'Raw Vegetables', 'Fruits', 'Bread & Bakery', 'Rice & Grains', 'Dairy', 'Snacks', 'Beverages', 'Other'];

export default function AddFood() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    food_name: '', food_type: '', is_veg: true,
    total_quantity: '', unit: 'kg',
    expiry_time: '', city_name: '', state: '', pincode: '',
    description: ''
  });

  useEffect(() => {
    API.get('/cities').then(r => setCities(r.data)).catch(() => {});
    // Default expiry to 24h from now
    const d = new Date();
    d.setHours(d.getHours() + 24);
    setForm(f => ({ ...f, expiry_time: d.toISOString().slice(0, 16) }));
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (new Date(form.expiry_time) <= new Date()) {
      return toast.error('Expiry time must be in the future.');
    }
    setLoading(true);
    try {
      await API.post('/food', { ...form, is_veg: form.is_veg ? 1 : 0 });
      toast.success('Food listing created successfully!');
      navigate('/my-listings');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-gray-900">Add Food Listing</h1>
        <p className="text-gray-500 mt-1">List surplus food available for NGOs to request</p>
      </div>

      <div className="card shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Food Name */}
          <div>
            <label className="label">Food Name *</label>
            <input name="food_name" value={form.food_name} onChange={handleChange} placeholder="e.g. Dal Rice, Bread Loaves..." className="input" required />
          </div>

          {/* Food Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Food Category</label>
              <select name="food_type" value={form.food_type} onChange={handleChange} className="input">
                <option value="">Select category</option>
                {FOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dietary Type</label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_veg: true }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.is_veg ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-brand-200'
                  }`}
                >
                  <Leaf size={15} /> Veg
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_veg: false }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    !form.is_veg ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-200'
                  }`}
                >
                  <Drumstick size={15} /> Non-Veg
                </button>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Total Quantity *</label>
              <input name="total_quantity" type="number" step="0.1" min="0.1" value={form.total_quantity} onChange={handleChange} placeholder="e.g. 50" className="input" required />
            </div>
            <div>
              <label className="label">Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="input">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="label">Expiry Date & Time *</label>
            <input name="expiry_time" type="datetime-local" value={form.expiry_time} onChange={handleChange} className="input" required />
            <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600">
              <Info size={12} />
              <span>Food expiring within 5 hours gets highest priority in NGO search results.</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="label">Pickup Location</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  name="city_name"
                  value={form.city_name}
                  onChange={handleChange}
                  placeholder="City"
                  list="cities-list"
                  className="input text-sm"
                />
                <datalist id="cities-list">
                  {cities.map(c => <option key={c.city_id} value={c.city_name} />)}
                </datalist>
              </div>
              <div>
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input text-sm" />
              </div>
              <div>
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" className="input text-sm" maxLength={6} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Additional Notes</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Any special handling instructions, allergens, packaging details..." className="input resize-none h-24" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
