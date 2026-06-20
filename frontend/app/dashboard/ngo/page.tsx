'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HandHeart, Package, CheckCircle2, Users,
  RefreshCw, ArrowRight, AlertTriangle, TrendingUp,
} from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import DonationCard from '../../../components/dashboard/DonationCard';
import { Donation, MyStats, MonthlyStats } from '../../../types';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function NGODashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [donationsRes, statsRes, monthlyRes] = await Promise.all([
        api.get('/donations?status=available&limit=6&sortBy=expiryTime&sortOrder=asc'),
        api.get('/analytics/my-stats'),
        api.get('/analytics/monthly'),
      ]);
      const now = new Date();
        setDonations(
          donationsRes.data.data.donations.filter(
           (d: Donation) =>
            d.status !== 'expired' &&
            d.status === 'available' &&
            new Date(d.expiryTime) > now
        )
     );
       
      setStats(statsRes.data.data.stats);
      setMonthlyData(monthlyRes.data.data.stats);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleClaim = async (donationId: string) => {
    setClaimingId(donationId);
    try {
      await api.patch(`/donations/${donationId}/claim`);
      toast.success('Donation claimed successfully! 🎉');
      setDonations((prev) => prev.filter((d) => d._id !== donationId));
      setStats((prev) => prev ? { ...prev, total: (prev.total ?? 0) + 1 } : prev);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to claim donation';
      toast.error(message);
    } finally {
      setClaimingId(null);
    }
  };

  const emergencyDonations = donations.filter((d) => d.isEmergency);
  const regularDonations = donations.filter((d) => !d.isEmergency);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-6 text-white"
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold mb-1">Live Donation Feed 🍽️</h2>
            <p className="text-white/80 text-sm">Available donations sorted by expiry time — act fast!</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-dot-online" />
            <span className="text-xs text-white/70">Live Feed</span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-all border border-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Claimed" value={stats?.total ?? 0} icon={HandHeart} color="green" loading={loading} delay={0} />
        <StatCard label="Pending Pickup" value={stats?.active ?? 0} icon={Package} color="amber" loading={loading} delay={0.05} />
        <StatCard label="Delivered" value={stats?.delivered ?? 0} icon={CheckCircle2} color="blue" loading={loading} delay={0.1} />
        <StatCard label="Meals Received" value={stats?.mealsReceived ?? 0} icon={Users} color="purple" loading={loading} delay={0.15} />
      </div>

      {/* Chart + Emergency */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-foreground">Monthly Received</h3>
              <p className="text-xs text-muted-foreground">Donations claimed per month</p>
            </div>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          {loading ? <div className="h-48 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Bar dataKey="donations" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: '/dashboard/ngo/feed', icon: HandHeart, label: 'Browse All Donations', color: 'bg-brand-50 dark:bg-brand-950/30 text-brand-600' },
              { href: '/dashboard/ngo/volunteers', icon: Users, label: 'Manage Volunteers', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' },
              { href: '/dashboard/ngo/emergency', icon: AlertTriangle, label: 'Emergency Requests', color: 'bg-red-50 dark:bg-red-950/30 text-red-600' },
              { href: '/dashboard/ngo/map', icon: Package, label: 'Map View', color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Emergency Donations */}
      {emergencyDonations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-display font-bold text-red-600 dark:text-red-400">Emergency Donations</h3>
            <span className="text-xs bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
              {emergencyDonations.length} urgent
            </span>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {emergencyDonations.map((d, i) => (
              <DonationCard
                key={d._id}
                donation={d}
                delay={i * 0.05}
                onClaim={claimingId ? undefined : handleClaim}
                onView={(id) => window.location.href = `/dashboard/ngo/donations/${id}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">Available Donations</h3>
          <Link href="/dashboard/ngo/feed"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
              </div>
            ))}
          </div>
        ) : regularDonations.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
            <HandHeart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No available donations right now</p>
            <p className="text-sm text-muted-foreground/60">Check back soon or enable notifications</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {regularDonations.map((d, i) => (
              <DonationCard
                key={d._id}
                donation={d}
                delay={i * 0.05}
                onClaim={claimingId ? undefined : handleClaim}
                onView={(id) => window.location.href = `/dashboard/ngo/donations/${id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
