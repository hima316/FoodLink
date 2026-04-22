import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ArrowRight, Clock, CheckCircle, TrendingUp, Leaf } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/transactions/stats'),
      user.role === 'donor'
        ? API.get('/food/my')
        : API.get('/requests/my'),
    ])
      .then(([statsRes, recentRes]) => {
        setStats(statsRes.data);
        setRecent(recentRes.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.role]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-gray-900">
          Welcome back, <span className="text-brand-600">{user.name}</span>!
        </h1>
        <p className="text-gray-500 mt-1 capitalize">{user.role} Dashboard · {user.city_name || user.state || 'Location not set'}</p>
      </div>

      {/* Stats */}
      {user.role === 'donor' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package size={20} />} label="Total Listings" value={stats?.total_listings ?? 0} color="green" />
          <StatCard icon={<TrendingUp size={20} />} label="Active Listings" value={stats?.active_listings ?? 0} color="blue" />
          <StatCard icon={<Leaf size={20} />} label="Qty Donated (kg)" value={parseFloat(stats?.total_donated || 0).toFixed(1)} color="orange" />
          <StatCard icon={<Users size={20} />} label="NGOs Served" value={stats?.ngos_served ?? 0} color="purple" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package size={20} />} label="Available Now" value={stats?.available_listings ?? 0} color="green" />
          <StatCard icon={<CheckCircle size={20} />} label="Requests Made" value={stats?.total_requests ?? 0} color="blue" />
          <StatCard icon={<Leaf size={20} />} label="Qty Received (kg)" value={parseFloat(stats?.total_received || 0).toFixed(1)} color="orange" />
          <StatCard icon={<TrendingUp size={20} />} label="Fulfilled" value={stats?.fulfilled_requests ?? 0} color="purple" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {user.role === 'donor' ? (
          <>
            <Link to="/add-food" className="card hover:shadow-md transition-all group bg-gradient-to-br from-brand-50 to-green-100 border-brand-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-xl text-brand-800">Add Food Listing</h3>
                  <p className="text-brand-600 text-sm mt-1">List surplus food for NGOs to request</p>
                </div>
                <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight size={20} className="text-white" />
                </div>
              </div>
            </Link>
            <Link to="/my-listings" className="card hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-xl text-gray-800">View My Listings</h3>
                  <p className="text-gray-500 text-sm mt-1">Manage your active food listings</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package size={20} className="text-gray-600" />
                </div>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link to="/browse" className="card hover:shadow-md transition-all group bg-gradient-to-br from-brand-50 to-green-100 border-brand-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-xl text-brand-800">Browse Food</h3>
                  <p className="text-brand-600 text-sm mt-1">Find available food in your area</p>
                </div>
                <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight size={20} className="text-white" />
                </div>
              </div>
            </Link>
            <Link to="/my-requests" className="card hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-xl text-gray-800">My Requests</h3>
                  <p className="text-gray-500 text-sm mt-1">Track status of your food requests</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock size={20} className="text-gray-600" />
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-xl text-gray-800">
            {user.role === 'donor' ? 'Recent Listings' : 'Recent Requests'}
          </h2>
          <Link
            to={user.role === 'donor' ? '/my-listings' : '/my-requests'}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>No recent activity yet.</p>
            <Link to={user.role === 'donor' ? '/add-food' : '/browse'} className="text-brand-600 text-sm mt-2 inline-block">
              {user.role === 'donor' ? 'Add your first listing →' : 'Browse available food →'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                    <Leaf size={16} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.food_name}</p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'donor'
                        ? `${parseFloat(item.remaining_quantity).toFixed(1)} / ${parseFloat(item.total_quantity).toFixed(1)} ${item.unit} remaining`
                        : `${parseFloat(item.allocated_quantity).toFixed(1)} ${item.unit} allocated`
                      }
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  item.status === 'available' || item.status === 'approved' ? 'bg-green-100 text-green-700' :
                  item.status === 'partially_allocated' || item.status === 'partially_approved' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'expired' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>{item.status?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
