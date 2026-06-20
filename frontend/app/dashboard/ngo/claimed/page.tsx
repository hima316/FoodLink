'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, RefreshCw, CheckCircle2, Truck,
  Users, X, Star, Phone, MapPin, Shield,
} from 'lucide-react';
import { Donation, DonationStatus } from '../../../../types';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { cn, getInitials } from '../../../../lib/utils';

// ── Volunteer type
interface Volunteer {
  _id:           string;
  name:          string;
  phone?:        string;
  rating?:       number;
  totalPickups?: number;
  isVerified:    boolean;
  address?: { city?: string; state?: string };
}

// ── Tabs config
const TABS: {
  key:   DonationStatus;
  label: string;
  icon:  React.ElementType;
  color: string;
}[] = [
  { key: 'claimed',    label: 'Claimed',    icon: Package,      color: 'bg-blue-600' },
  { key: 'in_transit', label: 'In Transit', icon: Truck,        color: 'bg-amber-500' },
  { key: 'delivered',  label: 'Delivered',  icon: CheckCircle2, color: 'bg-brand-600' },
];

export default function NGOClaimedPage() {
  const [donations,  setDonations]  = useState<Donation[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<DonationStatus>('claimed');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [modalOpen,      setModalOpen]      = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [assigningId,    setAssigningId]    = useState<string | null>(null);
  const [loadingVols,    setLoadingVols]    = useState(false);

  // Fetch donations whenever tab/page changes
  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/donations?status=${tab}&limit=9&page=${page}&sortBy=createdAt&sortOrder=desc`
      );
      setDonations(res.data.data.donations);
      setTotalPages(res.data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { setPage(1); }, [tab]);

  // Open modal — load volunteers at the same time
  const openAssignModal = async (donation: Donation) => {
    setSelectedDonation(donation);
    setModalOpen(true);
    setLoadingVols(true);
    try {
      const res = await api.get('/users/volunteers');
      setVolunteers(res.data.data.volunteers);
    } catch {
      toast.error('Failed to load volunteers');
    } finally {
      setLoadingVols(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDonation(null);
  };

  // Assign a volunteer to the selected donation
  const handleAssign = async (volunteerId: string, volunteerName: string) => {
    if (!selectedDonation) return;
    setAssigningId(volunteerId);
    try {
      await api.patch(
        `/donations/${selectedDonation._id}/assign-volunteer`,
        { volunteerId }
      );
      toast.success(`${volunteerName} assigned successfully! 🚗`);
      closeModal();
      fetchDonations(); // Refresh list
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Failed to assign volunteer';
      toast.error(msg);
    } finally {
      setAssigningId(null);
    }
  };

  // Star renderer
  const renderStars = (rating = 0) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn('w-3 h-3',
          s <= Math.round(rating)
            ? 'fill-amber-400 text-amber-400'
            : 'text-muted-foreground/20'
        )} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {(rating || 0).toFixed(1)}
      </span>
    </div>
  );

  // Donor name helper
  const getDonorName = (donor: unknown): string => {
    if (!donor || typeof donor === 'string') return 'Unknown';
    const d = donor as { organizationName?: string; name?: string };
    return d.organizationName || d.name || 'Unknown';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ── Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Claimed Donations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage donations your NGO has claimed
        </p>
      </motion.div>

      {/* ── Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                tab === t.key
                  ? `${t.color} text-white shadow-sm`
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              )}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
        <button onClick={fetchDonations}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* ── Tip banner for claimed tab */}
      {tab === 'claimed' && donations.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
          <Users className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Click <strong>Assign Volunteer</strong> on any donation card below to pick
            a volunteer for that pickup.
          </p>
        </div>
      )}

      {/* ── Donation Cards Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <Package className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">
            No {tab.replace('_', ' ')} donations
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {tab === 'claimed'
              ? 'Go to the Live Feed to claim donations'
              : 'Nothing here yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {donations.map((d, i) => (
              <motion.div key={d._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-card-hover',
                  tab === 'claimed'
                    ? 'border-blue-200 dark:border-blue-800/50'
                    : tab === 'in_transit'
                    ? 'border-amber-200 dark:border-amber-800/50'
                    : 'border-brand-200 dark:border-brand-800/50'
                )}>

                {/* Status bar */}
                <div className={cn(
                  'px-4 py-2 text-xs font-bold uppercase tracking-wide text-white flex items-center gap-2',
                  tab === 'claimed'    ? 'bg-blue-600' :
                  tab === 'in_transit' ? 'bg-amber-500' : 'bg-brand-600'
                )}>
                  {tab === 'claimed'    && <><Package className="w-3.5 h-3.5" /> Claimed — Awaiting Pickup</>}
                  {tab === 'in_transit' && <><Truck className="w-3.5 h-3.5" /> In Transit</>}
                  {tab === 'delivered'  && <><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</>}
                </div>

                <div className="p-5">
                  {/* Title */}
                  <h3 className="font-bold text-foreground text-base mb-1">{d.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    From: {getDonorName(d.donor)}
                  </p>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="font-bold text-foreground">{d.quantity} {d.unit}</p>
                      <p className="text-muted-foreground">Quantity</p>
                    </div>
                    {d.servings && (
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="font-bold text-foreground">~{d.servings}</p>
                        <p className="text-muted-foreground">Servings</p>
                      </div>
                    )}
                  </div>

                  {/* Volunteer assigned info */}
                  {d.volunteer && typeof d.volunteer === 'object' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials((d.volunteer as { name?: string }).name || 'V')}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                          {(d.volunteer as { name?: string }).name || 'Volunteer'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Assigned volunteer</p>
                      </div>
                    </div>
                  )}

                  {/* Assign button — only for claimed donations without a volunteer yet */}
                  {tab === 'claimed' && !d.volunteer && (
                    <button
                      onClick={() => openAssignModal(d)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm">
                      <Users className="w-4 h-4" />
                      Assign Volunteer
                    </button>
                  )}

                  {/* Re-assign button — if already has a volunteer */}
                  {tab === 'claimed' && d.volunteer && (
                    <button
                      onClick={() => openAssignModal(d)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Change Volunteer
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-all">
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          ASSIGN VOLUNTEER MODAL
          ════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && selectedDonation && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-premium overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="font-display font-bold text-foreground">
                    Assign a Volunteer
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
                    For: {selectedDonation.title}
                  </p>
                </div>
                <button onClick={closeModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Volunteer list */}
              <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
                {loadingVols ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-1/2 rounded" />
                          <div className="skeleton h-3 w-1/3 rounded" />
                        </div>
                        <div className="skeleton h-8 w-20 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : volunteers.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No volunteers available
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Volunteers will appear here once they register
                    </p>
                  </div>
                ) : (
                  volunteers.map((v, i) => (
                    <motion.div key={v._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand-300 dark:hover:border-brand-700 hover:bg-muted/40 transition-all">

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {getInitials(v.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {v.name}
                          </p>
                          {v.isVerified && (
                            <Shield className="w-3 h-3 text-brand-500 flex-shrink-0" />
                          )}
                        </div>
                        {renderStars(v.rating ?? 0)}
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {v.totalPickups ?? 0} pickups
                          </span>
                          {v.address?.city && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MapPin className="w-2.5 h-2.5" />
                              {v.address.city}
                            </span>
                          )}
                          {v.phone && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Phone className="w-2.5 h-2.5" />
                              {v.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assign button */}
                      <button
                        onClick={() => handleAssign(v._id, v.name)}
                        disabled={assigningId === v._id}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap flex-shrink-0',
                          'bg-brand-600 hover:bg-brand-700 shadow-sm',
                          assigningId === v._id && 'opacity-60 cursor-not-allowed'
                        )}>
                        {assigningId === v._id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Truck className="w-3.5 h-3.5" /> Assign</>
                        )}
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Modal footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {volunteers.length} volunteer{volunteers.length !== 1 ? 's' : ''} available
                </p>
                <button onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}