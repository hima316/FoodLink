import { useState } from 'react';
import { X, Leaf, Drumstick, Clock, AlertTriangle } from 'lucide-react';
import { API } from '../context/AuthContext';
import { timeUntilExpiry, formatQuantity } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function RequestModal({ food, onClose, onSuccess }) {
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const expiry = timeUntilExpiry(food.expiry_time);
  const max = parseFloat(food.remaining_quantity);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = parseFloat(qty);
    if (!q || q <= 0) return toast.error('Enter a valid quantity.');
    if (q > max) return toast.error(`Maximum available: ${formatQuantity(max, food.unit)}`);

    setLoading(true);
    try {
      const res = await API.post('/requests', { food_id: food.food_id, requested_quantity: q });
      const d = res.data;
      if (d.allocated_quantity < q) {
        toast.success(`Partially approved! You received ${formatQuantity(d.allocated_quantity, food.unit)} (requested ${formatQuantity(q, food.unit)}).`);
      } else {
        toast.success(`Request approved! ${formatQuantity(d.allocated_quantity, food.unit)} allocated.`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900">Request Food</h2>
            <p className="text-sm text-gray-500 mt-0.5">Submit a partial or full quantity request</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Food summary */}
          <div className="bg-green-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{food.food_name}</h3>
              {food.is_veg
                ? <span className="badge-veg"><Leaf size={11} /> Veg</span>
                : <span className="badge-nonveg"><Drumstick size={11} /> Non-Veg</span>
              }
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Available</span>
                <p className="font-semibold text-brand-700">{formatQuantity(max, food.unit)}</p>
              </div>
              <div>
                <span className="text-gray-500">Expires</span>
                <p className={`font-semibold ${expiry.urgent ? 'text-orange-600' : 'text-gray-700'}`}>
                  {expiry.text}
                </p>
              </div>
            </div>
          </div>

          {expiry.urgent && (
            <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 rounded-xl p-3">
              <AlertTriangle size={16} />
              <span>This food is expiring soon — please act quickly!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Quantity to Request ({food.unit || 'kg'})</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={max}
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder={`Max: ${max} ${food.unit || 'kg'}`}
                className="input"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                You can request up to {formatQuantity(max, food.unit)}. Partial requests are supported.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
