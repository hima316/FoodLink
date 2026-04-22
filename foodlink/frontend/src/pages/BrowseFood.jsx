import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Leaf, Drumstick, RefreshCw } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';
import FoodCard from '../components/FoodCard';
import RequestModal from '../components/RequestModal';
import toast from 'react-hot-toast';

export default function BrowseFood() {
  const { user } = useAuth();
  const [allFood, setAllFood] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // all | veg | nonveg
  const [search, setSearch] = useState('');
  const [useMyLocation, setUseMyLocation] = useState(true);

  const fetchFood = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (useMyLocation) {
        if (user.pincode) params.pincode = user.pincode;
        if (user.city_id) params.city_id = user.city_id;
        if (user.state) params.state = user.state;
      }
      if (filter === 'veg') params.is_veg = 1;
      if (filter === 'nonveg') params.is_veg = 0;

      const res = await API.get('/food', { params });
      setAllFood(res.data);
    } catch {
      toast.error('Failed to load food listings.');
    } finally {
      setLoading(false);
    }
  }, [user, filter, useMyLocation]);

  useEffect(() => { fetchFood(); }, [fetchFood]);

  const filtered = allFood.filter(f =>
    f.food_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.food_type?.toLowerCase().includes(search.toLowerCase()) ||
    f.city_name?.toLowerCase().includes(search.toLowerCase())
  );

  const urgent = filtered.filter(f => f.priority_score === 4);
  const regular = filtered.filter(f => f.priority_score !== 4);
  const veg = regular.filter(f => f.is_veg === 1);
  const nonveg = regular.filter(f => f.is_veg === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-gray-900">Browse Available Food</h1>
        <p className="text-gray-500 mt-1">Showing prioritized results based on your location and urgency</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, type, city..."
              className="input pl-9 text-sm"
            />
          </div>

          {/* Veg filter */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
            {[
              { id: 'all', label: 'All', icon: <SlidersHorizontal size={14} /> },
              { id: 'veg', label: 'Veg', icon: <Leaf size={14} /> },
              { id: 'nonveg', label: 'Non-Veg', icon: <Drumstick size={14} /> },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === opt.id ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Location toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <div
              onClick={() => setUseMyLocation(s => !s)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${useMyLocation ? 'bg-brand-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${useMyLocation ? 'left-4' : 'left-0.5'}`} />
            </div>
            Near me
          </label>

          <button onClick={fetchFood} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Priority legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-50">
          <span className="text-xs text-gray-400 font-medium">Priority:</span>
          {[
            { color: 'bg-orange-100 text-orange-700', label: '🔴 Expiring in 5h' },
            { color: 'bg-green-100 text-green-700', label: '📍 Same Pincode' },
            { color: 'bg-blue-100 text-blue-700', label: '🏙️ Same City' },
            { color: 'bg-purple-100 text-purple-700', label: '🗺️ Same State' },
          ].map(p => (
            <span key={p.label} className={`text-xs px-2 py-0.5 rounded-full ${p.color}`}>{p.label}</span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Search size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-400">Try adjusting your filters or disable location filtering.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Urgent section */}
          {urgent.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h2 className="font-display font-bold text-xl text-gray-800">🔴 Expiring Soon — Act Fast!</h2>
                <span className="text-sm text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{urgent.length} items</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {urgent.map(f => (
                  <FoodCard key={f.food_id} food={f} onRequest={setSelected} />
                ))}
              </div>
            </section>
          )}

          {/* Veg section */}
          {(filter === 'all' || filter === 'veg') && veg.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Leaf size={18} className="text-brand-600" />
                <h2 className="font-display font-bold text-xl text-gray-800">Vegetarian</h2>
                <span className="text-sm text-brand-600 bg-green-50 px-2 py-0.5 rounded-full">{veg.length} items</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {veg.map(f => (
                  <FoodCard key={f.food_id} food={f} onRequest={setSelected} />
                ))}
              </div>
            </section>
          )}

          {/* Non-veg section */}
          {(filter === 'all' || filter === 'nonveg') && nonveg.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Drumstick size={18} className="text-red-500" />
                <h2 className="font-display font-bold text-xl text-gray-800">Non-Vegetarian</h2>
                <span className="text-sm text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{nonveg.length} items</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {nonveg.map(f => (
                  <FoodCard key={f.food_id} food={f} onRequest={setSelected} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {selected && (
        <RequestModal
          food={selected}
          onClose={() => setSelected(null)}
          onSuccess={fetchFood}
        />
      )}
    </div>
  );
}
