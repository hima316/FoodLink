'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, UtensilsCrossed, HandHeart, Truck,
  TrendingUp, Shield, AlertTriangle, BarChart3,
  ArrowRight, RefreshCw, CheckCircle2, Clock,
} from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import { AnalyticsOverview, MonthlyStats } from '../../../types';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [monthly, setMonthly]   = useState<MonthlyStats[]>([]);
  const [recentUsers, setRecentUsers] = useState<unknown[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [overviewRes, monthlyRes, usersRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/monthly'),
        api.get('/users?limit=5&sortBy=createdAt&sortOrder=desc'),
      ]);
      setOverview(overviewRes.data.data);
      setMonthly(monthlyRes.data.data.stats);
      setRecentUsers(usersRes.data.data.users);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Role distribution for pie chart
  const roleData = overview
    ? [
        { name: 'Hotels',     value: overview.totalHotels },
        { name: 'NGOs',       value: overview.totalNGOs },
        { name: 'Volunteers', value: overview.totalVolunteers },
      ]
    : [];

  const donationStatusData = overview
    ? [
        { name: 'Active',    value: overview.activeDonations },
        { name: 'Delivered', value: overview.deliveredDonations },
        { name: 'Total',     value: overview.totalDonations },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-6 text-white"
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)',
        }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-purple-200" />
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wider">Admin Control Centre</span>
            </div>
            <h2 className="text-xl font-display font-bold">Platform Overview</h2>
            <p className="text-white/70 text-sm mt-0.5">Real-time statistics across all roles and operations.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/dashboard/admin/analytics"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-purple-700 text-sm font-bold hover:bg-purple-50 shadow-md transition-all">
              <BarChart3 className="w-4 h-4" />
              Full Analytics
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Donations" value={overview?.totalDonations ?? 0} icon={UtensilsCrossed} color="amber"  loading={loading} delay={0} />
        <StatCard label="Meals Saved"     value={overview?.totalMealsSaved  ?? 0} icon={HandHeart}      color="green"  loading={loading} delay={0.05} trendLabel="People fed" />
        <StatCard label="Active Now"      value={overview?.activeDonations  ?? 0} icon={Clock}          color="blue"   loading={loading} delay={0.1} />
        <StatCard label="Delivered"       value={overview?.deliveredDonations ?? 0} icon={CheckCircle2} color="purple" loading={loading} delay={0.15} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hotels / Restaurants" value={overview?.totalHotels    ?? 0} icon={UtensilsCrossed} color="amber" loading={loading} delay={0.2} />
        <StatCard label="NGOs"                 value={overview?.totalNGOs      ?? 0} icon={HandHeart}      color="green" loading={loading} delay={0.25} />
        <StatCard label="Volunteers"           value={overview?.totalVolunteers ?? 0} icon={Truck}         color="blue"  loading={loading} delay={0.3} />
        <StatCard label="Food Redistributed"   value={`${overview?.totalFoodKg ?? 0} kg`} icon={TrendingUp} color="teal" loading={loading} delay={0.35} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-foreground">Monthly Donations</h3>
              <p className="text-xs text-muted-foreground">Total vs. delivered over time</p>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          {loading ? <div className="h-52 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="donations" name="Total"     stroke="#7c3aed" fill="url(#totalGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#16a34a" fill="url(#delivGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* User Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground mb-1">User Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Platform roles distribution</p>
          {loading ? <div className="h-52 skeleton rounded-xl" /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {roleData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground text-xs">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground text-xs">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Meals Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-foreground">Meals Saved Per Month</h3>
            <p className="text-xs text-muted-foreground">Estimated number of people fed monthly</p>
          </div>
          <HandHeart className="w-5 h-5 text-brand-500" />
        </div>
        {loading ? <div className="h-44 skeleton rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="meals" name="Meals Saved" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Quick Admin Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/dashboard/admin/users',     icon: Users,          label: 'Manage Users',       sub: 'View, verify, suspend',           color: 'from-purple-500 to-purple-700' },
          { href: '/dashboard/admin/donations', icon: UtensilsCrossed, label: 'All Donations',      sub: 'Monitor & moderate',              color: 'from-amber-500 to-orange-500' },
          { href: '/dashboard/admin/emergency', icon: AlertTriangle,   label: 'Emergency Queue',    sub: 'Critical requests',               color: 'from-red-500 to-red-700' },
          { href: '/dashboard/admin/map',       icon: BarChart3,       label: 'Platform Map',       sub: 'Live geo view',                   color: 'from-blue-500 to-blue-700' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.05 }}>
              <Link href={item.href}
                className="flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-bold text-foreground">Recently Joined</h3>
          <Link href="/dashboard/admin/users"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            All users <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentUsers as Array<{ _id: string; name: string; role: string; email: string; status: string; organizationName?: string }>).map((u) => (
                  <tr key={u._id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.organizationName || u.name)?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-[140px]">{u.organizationName || u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                        ${u.role === 'hotel'     ? 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400'  :
                          u.role === 'ngo'       ? 'bg-brand-100  dark:bg-brand-900/30  text-brand-700  dark:text-brand-400'  :
                          u.role === 'volunteer' ? 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400'   :
                                                   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${u.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
