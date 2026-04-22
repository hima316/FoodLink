import { Clock, MapPin, User, Leaf, Drumstick, Zap } from 'lucide-react';
import { timeUntilExpiry, getPriorityLabel, formatQuantity, formatDate } from '../utils/helpers';

export default function FoodCard({ food, onRequest, showRequestBtn = true }) {
  const expiry = timeUntilExpiry(food.expiry_time);
  const priority = getPriorityLabel(food.priority_score);
  const pct = food.total_quantity > 0
    ? Math.round((food.remaining_quantity / food.total_quantity) * 100)
    : 0;

  return (
    <div className={`card hover:shadow-md transition-all duration-200 animate-slide-up relative overflow-hidden ${expiry.urgent ? 'border-orange-200' : ''}`}>
      {expiry.urgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-400" />
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg text-gray-900 truncate">{food.food_name}</h3>
          {food.food_type && <p className="text-sm text-gray-500">{food.food_type}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {food.is_veg ? (
            <span className="badge-veg"><Leaf size={11} /> Veg</span>
          ) : (
            <span className="badge-nonveg"><Drumstick size={11} /> Non-Veg</span>
          )}
          {expiry.urgent && !expiry.expired && (
            <span className="badge-urgent"><Zap size={11} /> Urgent</span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      {priority && (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-3 ${priority.color}`}>
          {priority.label}
        </div>
      )}

      {/* Quantity bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Available: <strong className="text-gray-800">{formatQuantity(food.remaining_quantity, food.unit)}</strong></span>
          <span>Total: {formatQuantity(food.total_quantity, food.unit)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-brand-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Meta info */}
      <div className="space-y-1.5 mb-4">
        <div className={`flex items-center gap-1.5 text-sm ${expiry.expired ? 'text-red-500' : expiry.urgent ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
          <Clock size={13} />
          <span>{expiry.text}</span>
          <span className="text-gray-400 text-xs">· {formatDate(food.expiry_time)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={13} />
          <span>{[food.city_name, food.state].filter(Boolean).join(', ')} {food.pincode && `· ${food.pincode}`}</span>
        </div>
        {food.donor_name && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <User size={13} />
            <span>{food.donor_name}</span>
            {food.donor_contact && <span className="text-brand-600">· {food.donor_contact}</span>}
          </div>
        )}
      </div>

      {food.description && (
        <p className="text-sm text-gray-500 italic mb-4 line-clamp-2">{food.description}</p>
      )}

      {showRequestBtn && !expiry.expired && food.remaining_quantity > 0 && (
        <button onClick={() => onRequest(food)} className="btn-primary w-full text-sm">
          Request Food
        </button>
      )}
      {(expiry.expired || food.remaining_quantity <= 0) && (
        <div className="text-center text-sm text-gray-400 py-2 bg-gray-50 rounded-xl">
          {expiry.expired ? 'Listing Expired' : 'Fully Allocated'}
        </div>
      )}
    </div>
  );
}
