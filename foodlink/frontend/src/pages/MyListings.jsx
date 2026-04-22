import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Clock, Leaf, Drumstick, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { API } from '../context/AuthContext';
import { formatDate, timeUntilExpiry, getStatusColor, formatQuantity } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [requestsMap, setRequestsMap] = useState({});

  const fetchListings = () => {
    API.get('/food/my')
      .then(r => setListings(r.data))
      .catch(() => toast.error('Failed to load listings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const fetchRequests = async (food_id) => {
    if (requestsMap[food_id]) return;
    try {
      const res = await API.get(`/requests/food/${food_id}`);
      setRequestsMap(m => ({ ...m, [food_id]: res.data }));
    } catch { toast.error('Failed to load requests.'); }
  };

  const toggleExpand = (id) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      fetchRequests(id);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900">My Listings</h1>
          <p className="text-gray-500 mt-1">{listings.length} total listings</p>
        </div>
        <Link to="/add-food" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Food
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No listings yet</h3>
          <p className="text-gray-400 mb-6">Start by adding surplus food to help NGOs in need.</p>
          <Link to="/add-food" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Add Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(item => {
            const expiry = timeUntilExpiry(item.expiry_time);
            const pct = item.total_quantity > 0 ? Math.round((item.remaining_quantity / item.total_quantity) * 100) : 0;
            const isOpen = expanded === item.food_id;

            return (
              <div key={item.food_id} className="card hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-semibold text-lg text-gray-900">{item.food_name}</h3>
                      {item.is_veg
                        ? <span className="badge-veg"><Leaf size={11} /> Veg</span>
                        : <span className="badge-nonveg"><Drumstick size={11} /> Non-Veg</span>
                      }
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(item.status)}`}>
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {item.food_type && <p className="text-sm text-gray-500 mb-2">{item.food_type}</p>}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Package size={13} />
                        {formatQuantity(item.remaining_quantity, item.unit)} / {formatQuantity(item.total_quantity, item.unit)}
                      </span>
                      <span className={`flex items-center gap-1 ${expiry.urgent ? 'text-orange-600 font-medium' : ''}`}>
                        <Clock size={13} />
                        {expiry.text}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs mb-1">
                      <div
                        className={`h-full rounded-full ${pct > 50 ? 'bg-brand-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{pct}% remaining</p>
                  </div>

                  <button
                    onClick={() => toggleExpand(item.food_id)}
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
                  >
                    <Users size={14} />
                    Requests
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Requests section */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-up">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">NGO Requests</h4>
                    {!requestsMap[item.food_id] ? (
                      <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                    ) : requestsMap[item.food_id].length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm">No requests yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {requestsMap[item.food_id].map(req => (
                          <div key={req.request_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                            <div>
                              <p className="font-medium text-gray-800">{req.ngo_name}</p>
                              <p className="text-gray-500 text-xs">{req.ngo_email} · {req.ngo_contact}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-700">Req: <strong>{formatQuantity(req.requested_quantity, item.unit)}</strong></p>
                              <p className="text-brand-700 text-xs">Alloc: {formatQuantity(req.allocated_quantity, item.unit)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(req.status)}`}>
                                {req.status?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                  <span>Listed: {formatDate(item.created_at)}</span>
                  <span>{item.city_name && `${item.city_name}, `}{item.state}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
