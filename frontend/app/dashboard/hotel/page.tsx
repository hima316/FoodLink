'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, TrendingUp, Users, Clock,
  Plus, ArrowRight, Package, CheckCircle2,
} from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import DonationCard from '../../../components/dashboard/DonationCard';
import { Donation, MyStats, MonthlyStats } from '../../../types';
import api from '../../../lib/api';
import useAuthStore from '../../../context/authStore';
import { formatNumber } from '../../../lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function HotelDashboard() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsRes, statsRes, monthlyRes] = await Promise.all([
        api.get('/donations?limit=6&sortBy=createdAt&sortOrder=desc'),
        api.get('/analytics/my-stats'),
        api.get('/analytics/monthly'),
      ]);
      setDonations(donationsRes.data.data.donations);
      setStats(statsRes.data.data.stats);
      setMonthlyData(monthlyRes.data.data.stats);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 text-white"
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)',
        }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold mb-1">
              Welcome back, {user?.organizationName || user?.name}! 👋
            </h2>
            <p className="text-white/80 text-sm">
              Every donation you make feeds real people. Let's continue making a difference.
            </p>
          </div>
          <Link
            href="/dashboard/hotel/new-donation"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-amber-700 font-bold text-sm hover:bg-amber-50 transition-all shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Donation
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Donations"
          value={stats?.total ?? 0}
          icon={UtensilsCrossed}
           color="amber"
           loading={loading}
           delay={0}
           trendLabel="Excludes expired & cancelled"
         />
        <StatCard
           label="Available Now"
           value={stats?.active ?? 0}
           icon={Clock}
           color="blue"
           loading={loading}
           delay={0.05}
           trendLabel="Waiting to be claimed"
         />
       <StatCard
         label="In Transit / Claimed"
         value={stats?.claimed ?? 0}
         icon={Package}
         color="teal"
         loading={loading}
         delay={0.1}
         trendLabel="Pickup in progress"
       />
       <StatCard
        label="Delivered"
        value={stats?.delivered ?? 0}
        icon={CheckCircle2}
        color="green"
        loading={loading}
        delay={0.15}
        trendLabel="Successfully redistributed"
     />
  </div>

      {/* Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Donation Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-foreground">Donation Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly donations over the last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          {loading ? (
            <div className="h-48 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="hotelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="donations" stroke="#f59e0b" fill="url(#hotelGradient)" strokeWidth={2.5} dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h3 className="font-display font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: '/dashboard/hotel/new-donation', icon: Plus, label: 'Post New Donation', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
              { href: '/dashboard/hotel/donations', icon: Package, label: 'Manage Donations', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
              { href: '/dashboard/hotel/map', icon: Users, label: 'Find Nearby NGOs', color: 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400' },
              { href: '/dashboard/hotel/analytics', icon: TrendingUp, label: 'View Analytics', color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>

          {/* Impact summary */}
          <div className="mt-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50">
            <p className="text-s font-semibold text-brand-700 dark:text-brand-300 mb-1"> Your Impact</p>
            <p className="text-2xl font-display font-bold text-brand-700 dark:text-brand-300">
              {formatNumber(stats?.mealsSaved ?? 0)}
            </p>
            <p className="text-xs text-brand-600/70 dark:text-brand-400/70">total meals contributed</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">Recent Donations</h3>
          <Link href="/dashboard/hotel/donations"
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
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border border-dashed">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No donations yet</p>
            <p className="text-sm text-muted-foreground/60 mb-4">Start by posting your first food donation</p>
            <Link href="/dashboard/hotel/new-donation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all">
              <Plus className="w-4 h-4" /> Post First Donation
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {donations.map((d, i) => (
              <DonationCard key={d._id} donation={d} delay={i * 0.05} showActions={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
