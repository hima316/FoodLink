'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, X, Shield, RefreshCw,
  MoreVertical, CheckCircle2, Ban, Eye,
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn, formatDate, getInitials } from '../../../../lib/utils';

const ROLE_FILTERS: { value: UserRole | ''; label: string }[] = [
  { value: '',          label: 'All Roles' },
  { value: 'hotel',     label: '🏨 Hotel' },
  { value: 'ngo',       label: '🏛 NGO' },
  { value: 'volunteer', label: '🚗 Volunteer' },
  { value: 'admin',     label: '👑 Admin' },
];

const STATUS_FILTERS: { value: UserStatus | ''; label: string }[] = [
  { value: '',          label: 'All Status' },
  { value: 'active',    label: '✅ Active' },
  { value: 'pending',   label: '⏳ Pending' },
  { value: 'suspended', label: '🚫 Suspended' },
  { value: 'inactive',  label: '⬛ Inactive' },
];

const roleColors: Record<string, string> = {
  hotel:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ngo:       'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
  volunteer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  admin:     'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

const gradients: Record<string, string> = {
  hotel:     'from-amber-400 to-orange-500',
  ngo:       'from-brand-500 to-brand-700',
  volunteer: 'from-blue-400 to-blue-600',
  admin:     'from-purple-500 to-purple-700',
};

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page), limit: '10',
      };
      if (search)       params.search = search;
      if (roleFilter)   params.role   = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/users', { params });
      setUsers(res.data.data.users);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
      setTotal(res.data.pagination?.total ?? 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  const updateStatus = async (userId: string, status: UserStatus) => {
    try {
      await api.patch(`/users/${userId}/status`, { status });
      toast.success(`User ${status} successfully`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
            <p className="text-xs text-muted-foreground">{total} total users registered</p>
          </div>
        </div>
        <button onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or organization..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          {ROLE_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-brand-500 text-foreground cursor-pointer">
          {STATUS_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
                <div className="skeleton h-7 w-20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No users found</p>
            {(search || roleFilter || statusFilter) && (
              <button onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['User', 'Role', 'Email', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr key={user.id || String(i)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">

                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br',
                          gradients[user.role] || 'from-gray-400 to-gray-600'
                        )}>
                          {getInitials(user.organizationName || user.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                              {user.organizationName || user.name}
                            </p>
                            {user.isVerified && (
                              <Shield className="w-3 h-3 text-brand-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{user.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
                        roleColors[user.role] || 'bg-muted text-muted-foreground')}>
                        {user.role}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full',
                        user.status === 'active'    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        user.status === 'suspended' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        user.status === 'pending'   ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-muted text-muted-foreground')}>
                        {user.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {user.status === 'active' ? (
                          <button
                            onClick={() => updateStatus(user.id || (user as unknown as { _id: string })._id, 'suspended')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            title="Suspend user">
                            <Ban className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatus(user.id || (user as unknown as { _id: string })._id, 'active')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
                            title="Activate user">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
            Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={cn('w-9 h-9 rounded-xl text-sm font-medium transition-all',
                  page === p ? 'bg-brand-600 text-white' : 'border border-border hover:bg-muted text-muted-foreground')}>
                {p}
              </button>
            ))}
          </div>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
