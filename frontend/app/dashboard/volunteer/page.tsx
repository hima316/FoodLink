'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck, CheckCircle2, MapPin, Clock, ArrowRight,
  Package, Star, TrendingUp, Navigation, RefreshCw,
} from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import DonationCard from '../../../components/dashboard/DonationCard';
import { Donation, MyStats } from '../../../types';
import api from '../../../lib/api';
import useAuthStore from '../../../context/authStore';
import toast from 'react-hot-toast';
import { formatAddress } from '../../../lib/utils';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Legend,
} from 'recharts';

export default function VolunteerDashboard() {
  const { user } = useAuthStore();
  const [activePickups, setActivePickups] = useState<Donation[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, statsRes] = await Promise.all([
        api.get('/donations?status=in_transit'),
        api.get('/analytics/my-stats'),
      ]);
      setActivePickups(activeRes.data.data.donations);
      setStats(statsRes.data.data.stats);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkDelivered = async (donationId: string) => {
  try {
    await api.patch(`/donations/${donationId}/deliver`);

    toast.success('Marked as delivered. Great work!');

    await fetchData();
  } catch {
    toast.error('Failed to update status');
  }
  };

  const completionRate =
    stats?.assigned && stats.assigned > 0
     ? Math.min(
        100,
        Math.round(((stats.completed ?? 0) / stats.assigned) * 100)
      )
    : 0;

  const radialData = [
    { name: 'Completion Rate', value: completionRate, fill: '#16a34a' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 text-white"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)' }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold mb-1">
              Ready to deliver, {user?.name}? 
            </h2>
            <p className="text-white/80 text-sm">
              {activePickups.length > 0
                ? `You have ${activePickups.length} active pickup${activePickups.length > 1 ? 's' : ''} in progress.`
                : 'No active pickups. Check available assignments below.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <Link
              href="/dashboard/volunteer/map"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              Open Map
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assigned" value={stats?.assigned ?? 0} icon={Package} color="blue" loading={loading} delay={0} />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} color="green" loading={loading} delay={0.05} />
        <StatCard label="Rating" value={user?.rating ? `${user.rating}/5` : 'N/A'} icon={Star} color="amber" loading={loading} delay={0.1} />
        <StatCard label="Completion %" value={`${completionRate}%`} icon={TrendingUp} color="purple" loading={loading} delay={0.15} />
      </div>

      {/* Chart + Active Pickups */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center"
        >
          <h3 className="font-display font-bold text-foreground mb-1 self-start">Performance</h3>
          <p className="text-xs text-muted-foreground mb-4 self-start">Completion rate</p>
          {loading ? (
            <div className="w-40 h-40 skeleton rounded-full" />
          ) : (
            <div className="relative w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={90 - (completionRate / 100) * 360}
                >
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-bold text-foreground">{completionRate}%</span>
                <span className="text-xs text-muted-foreground">completion</span>
              </div>
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-3 w-full">
            <div className="text-center p-3 rounded-xl bg-muted/50">
              <p className="text-lg font-bold text-foreground">{stats?.assigned ?? 0}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30">
              <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{stats?.completed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
          </div>
        </motion.div>

        {/* Active Pickups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-foreground">Active Pickups</h3>
              <p className="text-xs text-muted-foreground">Currently in transit</p>
            </div>
            <Truck className="w-5 h-5 text-blue-500" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : activePickups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Truck className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No active pickups</p>
              <p className="text-xs text-muted-foreground/60">Accept an assignment below to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePickups.map((pickup) => (
                <div
                  key={pickup._id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{pickup.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{formatAddress(pickup.address)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkDelivered(pickup._id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Delivered
                  </button>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/dashboard/volunteer/pickups"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View all pickups <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

    </div>
  );
}
