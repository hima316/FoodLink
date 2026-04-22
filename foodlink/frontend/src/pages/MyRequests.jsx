import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, Leaf, Drumstick, X } from 'lucide-react';
import { API } from '../context/AuthContext';
import { formatDate, timeUntilExpiry, getStatusColor, formatQuantity } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    API.get('/requests/my')
      .then(r => setRequests(r.data))
      .catch(() => toast.error('Failed to load requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this request? Allocated quantity will be returned to the listing.')) return;
    try {
      await API.patch(`/requests/${id}/cancel`);
      toast.success('Request cancelled.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-gray-900">My Requests</h1>
        <p className="text-gray-500 mt-1">{requests.length} total requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No requests yet</h3>
          <p className="text-gray-400 mb-6">Browse available food and submit your first request.</p>
          <Link to="/browse" className="btn-primary inline-flex items-center gap-2">
            Browse Food Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const expiry = timeUntilExpiry(req.expiry_time);
            const canCancel = ['approved', 'partially_approved', 'pending'].includes(req.status);

            return (
              <div key={req.request_id} className="card hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-semibold text-lg text-gray-900">{req.food_name}</h3>
                      {req.is_veg
                        ? <span className="badge-veg"><Leaf size={11} /> Veg</span>
                        : <span className="badge-nonveg"><Drumstick size={11} /> Non-Veg</span>
                      }
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(req.status)}`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Quantity breakdown */}
                    <div className="grid grid-cols-3 gap-3 my-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Requested</div>
                        <div className="font-semibold text-gray-800">{formatQuantity(req.requested_quantity, req.unit)}</div>
                      </div>
                      <div className="bg-brand-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Allocated</div>
                        <div className="font-semibold text-brand-700">{formatQuantity(req.allocated_quantity, req.unit)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Status</div>
                        <div className="text-xs font-medium text-gray-600 capitalize">{req.status?.replace(/_/g, ' ')}</div>
                      </div>
                    </div>

                    {req.status === 'partially_approved' && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-3">
                        ℹ️ Partial allocation — only {formatQuantity(req.allocated_quantity, req.unit)} was available when you requested.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className={`flex items-center gap-1 ${expiry.urgent ? 'text-orange-600' : ''}`}>
                        <Clock size={13} /> Food {expiry.text}
                      </span>
                      {req.donor_name && (
                        <span>Donor: <strong className="text-gray-700">{req.donor_name}</strong>
                          {req.donor_contact && <span className="text-brand-600"> · {req.donor_contact}</span>}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {[req.city_name, req.state, req.pincode].filter(Boolean).join(', ')} · Requested: {formatDate(req.request_time)}
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(req.request_id)}
                      className="btn-danger flex items-center gap-1.5 text-sm shrink-0"
                    >
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
