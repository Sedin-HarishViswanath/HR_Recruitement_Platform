import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  Gift, CheckCircle2, XCircle, Building2, Calendar, DollarSign,
  Clock, Sparkles, FileText
} from 'lucide-react';

interface Offer {
  id: string;
  application_id: string;
  job_title: string;
  company_name: string;
  salary: number;
  currency: string;
  start_date: string;
  status: 'pending' | 'accepted' | 'declined';
  additional_terms?: string;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Awaiting Response', badgeClass: 'badge-premium badge-amber' },
  accepted: { label: 'Accepted', badgeClass: 'badge-premium badge-emerald' },
  declined: { label: 'Declined', badgeClass: 'badge-premium badge-red' },
};

const formatSalary = (salary: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(salary);
};

const OfferCardSkeleton = () => (
  <div className="outer-bezel animate-pulse">
    <div className="inner-core space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-200 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 bg-stone-200 rounded w-40" />
            <div className="h-3 bg-stone-100 rounded w-28" />
          </div>
        </div>
        <div className="h-6 w-24 bg-stone-100 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-16 bg-stone-50 rounded-xl" />
        <div className="h-16 bg-stone-50 rounded-xl" />
        <div className="h-16 bg-stone-50 rounded-xl" />
      </div>
    </div>
  </div>
);

const OFFER_FILTERS = ['All', 'Pending', 'Accepted', 'Declined'] as const;
type OfferFilter = typeof OFFER_FILTERS[number];

export const CandidateOffersPage = () => {
  usePageTitle('Job Offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OfferFilter>('All');
  const [confirm, setConfirm] = useState<{
    open: boolean; offerId: string; action: 'accepted' | 'declined'; company: string; loading: boolean;
  }>({ open: false, offerId: '', action: 'accepted', company: '', loading: false });

  const fetchOffers = async () => {
    try {
      const { data } = await api.get('/offers/mine');
      setOffers(Array.isArray(data.data) ? data.data : []);
    } catch {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleRespond = (offerId: string, action: 'accepted' | 'declined', company: string) => {
    setConfirm({ open: true, offerId, action, company, loading: false });
  };

  const confirmRespond = async () => {
    setConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.patch(`/offers/${confirm.offerId}/respond`, { action: confirm.action });
      toast.success(confirm.action === 'accepted' ? '🎉 Offer accepted! Congratulations!' : 'Offer declined.');
      fetchOffers();
      setConfirm(prev => ({ ...prev, open: false, loading: false }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to respond to offer');
      setConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const pendingCount = offers.filter(o => o.status === 'pending').length;

  const filterCounts: Record<OfferFilter, number> = {
    All: offers.length,
    Pending: offers.filter(o => o.status === 'pending').length,
    Accepted: offers.filter(o => o.status === 'accepted').length,
    Declined: offers.filter(o => o.status === 'declined').length,
  };

  const filteredOffers = activeFilter === 'All'
    ? offers
    : offers.filter(o => o.status === activeFilter.toLowerCase() as Offer['status']);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="topbar-frost px-6 py-4 sticky top-0 z-40">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
          Candidate &rsaquo; <span className="text-stone-600">Offers</span>
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
              Job Offers
            </h1>
            {pendingCount > 0 && (
              <span className="chip-brand">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {pendingCount} Action Required
              </span>
            )}
          </div>

          {/* Filter tabs */}
          {!loading && offers.length > 0 && (
            <div className="flex items-center bg-stone-100/80 border border-stone-200/50 rounded-xl p-0.5 gap-0.5">
              {OFFER_FILTERS.map((filter) => {
                const count = filterCounts[filter];
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-spring flex items-center gap-1 ${
                      isActive ? 'bg-white text-stone-900 shadow-sm border border-stone-200/40' : 'text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    {filter}
                    {filter !== 'All' && count > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200/80 text-stone-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <main className="p-6 max-w-[900px] w-full mx-auto space-y-6 flex-1 animate-fade-in-up">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map(i => <OfferCardSkeleton key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="py-24 text-center panel">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Gift size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-stone-700" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {activeFilter === 'All' ? 'No Offers Yet' : `No ${activeFilter} Offers`}
            </h3>
            <p className="text-xs text-stone-400 font-medium mt-1.5 max-w-xs mx-auto leading-relaxed">
              {activeFilter === 'All'
                ? 'Job offers from companies will appear here after completing your interview rounds.'
                : `You have no ${activeFilter.toLowerCase()} offers at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6 list-slide-in">
            {filteredOffers.map((offer) => {
              const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
              const isPending = offer.status === 'pending';

              return (
                <div key={offer.id} className="outer-bezel">
                  <div className="inner-core relative overflow-hidden">
                    {/* Decorative accent top bar */}
                    {isPending && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-orange-400" />}
                    {offer.status === 'accepted' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-400" />}

                    <div className="space-y-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0 border border-stone-700/35">
                            {(offer.company_name || 'C').charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-stone-900 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                              {offer.job_title}
                            </h3>
                            <p className="text-[11px] text-stone-500 font-semibold flex items-center gap-1 mt-0.5">
                              <Building2 size={10} className="text-stone-400" /> {offer.company_name}
                            </p>
                          </div>
                        </div>

                        <span className={cfg.badgeClass}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="surface-sunken p-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-wider">
                            <DollarSign size={10} className="text-stone-400" /> Compensation
                          </div>
                          <p className="text-lg font-extrabold text-stone-900 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                            {formatSalary(Number(offer.salary), offer.currency)}
                          </p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">per year</p>
                        </div>

                        <div className="surface-sunken p-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-wider">
                            <Calendar size={10} className="text-stone-400" /> Start Date
                          </div>
                          <p className="text-sm font-bold text-stone-900">
                            {offer.start_date
                              ? new Date(offer.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Estimated</p>
                        </div>

                        <div className="surface-sunken p-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-wider">
                            <Clock size={10} className="text-stone-400" /> Received
                          </div>
                          <p className="text-sm font-bold text-stone-900">
                            {new Date(offer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Sent Date</p>
                        </div>
                      </div>

                      {/* Additional terms */}
                      {offer.additional_terms && (
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 uppercase tracking-wider mb-2">
                            <FileText size={10} /> Additional Terms
                          </div>
                          <p className="text-[12px] text-stone-700 font-medium leading-relaxed">{offer.additional_terms}</p>
                        </div>
                      )}

                      {/* Action buttons — only for pending offers */}
                      {isPending && (
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleRespond(offer.id, 'accepted', offer.company_name)}
                            className="flex-1 btn-primary"
                          >
                            <CheckCircle2 size={15} /> Accept Offer
                          </button>
                          <button
                            onClick={() => handleRespond(offer.id, 'declined', offer.company_name)}
                            className="flex-1 btn-soft hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          >
                            <XCircle size={15} /> Decline
                          </button>
                        </div>
                      )}

                      {/* Accepted state */}
                      {offer.status === 'accepted' && (
                        <div className="flex items-center gap-2 p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                          <Sparkles size={14} className="text-emerald-600 shrink-0" />
                          <p className="text-[12px] font-bold text-emerald-800">
                            Congratulations! You accepted this offer. The HR team will reach out soon.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm(prev => ({ ...prev, open: false }))}
        onConfirm={confirmRespond}
        title={confirm.action === 'accepted' ? `Accept offer from ${confirm.company}?` : `Decline offer from ${confirm.company}?`}
        description={
          confirm.action === 'accepted'
            ? 'You are accepting this job offer. The company will be notified and this will mark your application as hired.'
            : 'You are declining this offer. This action cannot be undone.'
        }
        confirmLabel={confirm.action === 'accepted' ? 'Yes, Accept' : 'Yes, Decline'}
        variant={confirm.action === 'accepted' ? 'success' : 'danger'}
        loading={confirm.loading}
      />
    </div>
  );
};

export default CandidateOffersPage;

