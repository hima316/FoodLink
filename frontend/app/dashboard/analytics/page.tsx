'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Utensils, Users,
  Leaf, Award, RefreshCw,
} from 'lucide-react';
import StatCard from '../../../components/dashboard/StatCard';
import { AnalyticsOverview, MonthlyStats } from '../../../types';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import useAuthStore from '../../../context/authStore';

const PIE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#ef4444', '#0891b2'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-premium text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold text-foreground">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [overview,  setOverview]  = useState<AnalyticsOverview | null>(null);
  const [monthly,   setMonthly]   = useState<MonthlyStats[]>([]);
  const [myStats,   setMyStats]   = useState<Record<string, number>>({});
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const fetchData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [overviewRes, monthlyRes, myStatsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/monthly'),
        api.get('/analytics/my-stats'),
      ]);
      setOverview(overviewRes.data.data);
      setMonthly(monthlyRes.data.data.stats);
      setMyStats(myStatsRes.data.data.stats);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived chart data
  const categoryBreakdown = overview ? [
    { name: 'Hotels',     value: overview.totalHotels },
    { name: 'NGOs',       value: overview.totalNGOs },
    { name: 'Volunteers', value: overview.totalVolunteers },
  ] : [];

  const deliveryRate = overview && overview.totalDonations > 0
    ? Math.round((overview.deliveredDonations / overview.totalDonations) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Platform-wide impact metrics</p>
          </div>
        </div>
        <button onClick={() => fetchData(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Donations"   value={overview?.totalDonations  ?? 0} icon={Utensils}  color="amber"  loading={loading} delay={0} />
        <StatCard label="Meals Saved"        value={overview?.totalMealsSaved ?? 0} icon={Users}     color="green"  loading={loading} delay={0.05} trendLabel="Total people fed" />
        <StatCard label="Food Redistributed" value={`${overview?.totalFoodKg ?? 0} kg`} icon={Leaf} color="teal"   loading={loading} delay={0.1} />
        <StatCard label="Delivery Rate"      value={`${deliveryRate}%`}             icon={Award}    color="purple" loading={loading} delay={0.15} trendLabel="Of all donations delivered" />
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Hotels / Restaurants" value={overview?.totalHotels    ?? 0} icon={Utensils}    color="amber" loading={loading} delay={0.2} />
        <StatCard label="NGOs"                  value={overview?.totalNGOs      ?? 0} icon={Users}       color="green" loading={loading} delay={0.25} />
        <StatCard label="Volunteers"            value={overview?.totalVolunteers ?? 0} icon={TrendingUp}  color="blue"  loading={loading} delay={0.3} />
      </div>

      {/* Monthly Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donations vs Delivered */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground mb-1">Donations Over Time</h3>
          <p className="text-xs text-muted-foreground mb-5">Posted vs. successfully delivered</p>
          {loading ? <div className="h-52 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="delGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="donations" name="Posted"    stroke="#d97706" fill="url(#donGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#16a34a" fill="url(#delGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Meals Saved Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground mb-1">Meals Saved Monthly</h3>
          <p className="text-xs text-muted-foreground mb-5">Estimated people fed each month</p>
          {loading ? <div className="h-52 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="meals" name="Meals Saved" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Food Volume + User Dist */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Food KG Line Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground mb-1">Food Volume (kg)</h3>
          <p className="text-xs text-muted-foreground mb-5">Kilograms of food redistributed monthly</p>
          {loading ? <div className="h-52 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="foodKg" name="Food (kg)" stroke="#0891b2" strokeWidth={2.5} dot={{ fill: '#0891b2', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* User Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-bold text-foreground mb-1">User Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Platform roles breakdown</p>
          {loading ? <div className="h-52 skeleton rounded-xl" /> : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* My Personal Stats (role-specific) */}
      {Object.keys(myStats).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
          <h3 className="font-display font-bold text-lg mb-4">Your Personal Impact</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(myStats).map(([key, val], i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-display font-bold text-white">
                  {typeof val === 'number' ? val.toLocaleString() : val}
                </p>
                <p className="text-xs text-white/70 mt-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// cn helper needed for this file
import { cn } from '../../../lib/utils';
