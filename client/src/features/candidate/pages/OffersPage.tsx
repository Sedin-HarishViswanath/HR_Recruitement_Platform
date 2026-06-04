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
  pending: { label: 'Awaiting Response', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

const formatSalary = (salary: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(salary);
};

const OfferCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 animate-pulse shadow-sm space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-40" />
          <div className="h-3 bg-slate-100 rounded w-28" />
        </div>
      </div>
      <div className="h-6 w-24 bg-slate-100 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-16 bg-slate-50 rounded-xl" />
      <div className="h-16 bg-slate-50 rounded-xl" />
      <div className="h-16 bg-slate-50 rounded-xl" />
    </div>
    <div className="flex gap-3">
      <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
      <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
          Candidate &rsaquo; <span className="text-slate-600">Offers</span>
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Job Offers
            </h1>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {pendingCount} awaiting response
              </span>
            )}
          </div>

          {/* Filter tabs */}
          {!loading && offers.length > 0 && (
            <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 gap-0.5">
              {OFFER_FILTERS.map((filter) => {
                const count = filterCounts[filter];
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-md text-[10.5px] font-bold transition-all flex items-center gap-1 ${
                      isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {filter}
                    {filter !== 'All' && count > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
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

      <main className="p-5 max-w-[900px] w-full mx-auto space-y-5 flex-1">

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map(i => <OfferCardSkeleton key={i} />)}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-100">
              <Gift size={28} className="text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              {activeFilter === 'All' ? 'No offers yet' : `No ${activeFilter.toLowerCase()} offers`}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5 max-w-xs mx-auto leading-relaxed">
              {activeFilter === 'All'
                ? 'Job offers from companies will appear here after completing your interview rounds.'
                : `You have no ${activeFilter.toLowerCase()} offers at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => {
              const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
              const isPending = offer.status === 'pending';

              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
                    isPending
                      ? 'border-amber-200 shadow-amber-100/50 hover:shadow-md'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Pending accent bar */}
                  {isPending && <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />}
                  {offer.status === 'accepted' && <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />}

                  <div className="p-6 space-y-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
                          {(offer.company_name || 'C').charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Sora' }}>
                            {offer.job_title}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <Building2 size={10} /> {offer.company_name}
                          </p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isPending ? 'animate-pulse' : ''}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          <DollarSign size={10} /> Compensation
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Sora' }}>
                          {formatSalary(Number(offer.salary), offer.currency)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">per year</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          <Calendar size={10} /> Start Date
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {offer.start_date
                            ? new Date(offer.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          <Clock size={10} /> Received
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(offer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Additional terms */}
                    {offer.additional_terms && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-wider mb-2">
                          <FileText size={10} /> Additional Terms
                        </div>
                        <p className="text-[12px] text-slate-700 font-medium leading-relaxed">{offer.additional_terms}</p>
                      </div>
                    )}

                    {/* Action buttons — only for pending offers */}
                    {isPending && (
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => handleRespond(offer.id, 'accepted', offer.company_name)}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-200 active:scale-[0.98]"
                        >
                          <CheckCircle2 size={15} /> Accept Offer
                        </button>
                        <button
                          onClick={() => handleRespond(offer.id, 'declined', offer.company_name)}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <XCircle size={15} /> Decline
                        </button>
                      </div>
                    )}

                    {/* Accepted state */}
                    {offer.status === 'accepted' && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <Sparkles size={14} className="text-emerald-600 shrink-0" />
                        <p className="text-[12px] font-bold text-emerald-700">
                          Congratulations! You accepted this offer. The HR team will reach out soon.
                        </p>
                      </div>
                    )}
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
