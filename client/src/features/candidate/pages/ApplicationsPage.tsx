import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  Building2, Calendar, MapPin, Search, Trash2, AlertCircle
} from 'lucide-react';

export const CandidateApplicationsPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawConfirm, setWithdrawConfirm] = useState<{ open: boolean; id: string; jobTitle: string; loading: boolean }>({
    open: false, id: '', jobTitle: '', loading: false,
  });

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/candidate/applications');
      setApplications(unwrapArray(data, ['applications']));
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleSync = () => { fetchApplications(); };
    window.addEventListener('sync-applications', handleSync);
    fetchApplications();
    return () => { window.removeEventListener('sync-applications', handleSync); };
  }, []);

  const confirmWithdraw = async () => {
    setWithdrawConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.patch(`/candidate/applications/${withdrawConfirm.id}/withdraw`);
      toast.success('Application withdrawn successfully');
      fetchApplications();
      setWithdrawConfirm({ open: false, id: '', jobTitle: '', loading: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
      setWithdrawConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const getStageIndex = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'applied' || s === 'new') return 0;
    if (s === 'screening') return 1;
    if (s === 'interview' || s.startsWith('interview_')) return 2;
    if (s === 'offer') return 3;
    if (s === 'hired') return 4;
    return -1; // rejected/withdrawn
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'applied' || s === 'new') return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    if (s === 'screening') return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    if (s === 'interview' || s.startsWith('interview_')) return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    if (s === 'offer') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    if (s === 'hired') return 'bg-emerald-600 text-white border-emerald-600';
    if (s === 'rejected') return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
    return 'bg-stone-500/10 text-stone-600 border-stone-500/20';
  };

  const getStageStyle = (stageIdx: number, currentIdx: number, isWithdrawnOrRejected: boolean) => {
    if (isWithdrawnOrRejected) {
      return {
        dot: 'bg-white border-stone-200 text-stone-350',
        text: 'text-stone-400',
        line: 'bg-stone-100'
      };
    }
    if (stageIdx < currentIdx) {
      return {
        dot: 'bg-emerald-500 border-emerald-500 text-white',
        text: 'text-stone-800 font-bold',
        line: 'bg-emerald-500'
      };
    }
    if (stageIdx === currentIdx) {
      return {
        dot: 'bg-emerald-650 border-emerald-600 ring-4 ring-emerald-500/10 text-white',
        text: 'text-emerald-600 font-black',
        line: 'bg-stone-100'
      };
    }
    return {
      dot: 'bg-white border-stone-200 text-stone-300',
      text: 'text-stone-400 font-semibold',
      line: 'bg-stone-100'
    };
  };

  const filteredApps = applications.filter(app => {
    const job = String(app.job_title || '').toLowerCase();
    const company = String(app.company_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return job.includes(query) || company.includes(query);
  });

  const stagesList = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Workspace Header Bar */}
      <div className="topbar-frost px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-stone-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Candidate</span>
            <span>&rsaquo;</span>
            <span className="text-stone-600 font-semibold">Applications</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
              My Applications
            </h1>
            <span className="text-xs text-stone-400 font-medium">{applications.length} submitted applications</span>
          </div>
        </div>
      </div>

      <main className="p-5 max-w-[1200px] w-full mx-auto space-y-5 flex-1 flex flex-col">
        {/* Search Controls toolbar */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-3 flex items-center gap-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-stone-700 placeholder:text-stone-400 transition-all"
            />
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-400 font-medium">Loading your applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-20 text-center surface-raised !rounded-xl max-w-xl mx-auto w-full">
            <Building2 size={36} className="mx-auto text-stone-250 mb-3" />
            <h3 className="text-sm font-bold text-stone-800" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>No applications found</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              {searchQuery ? "We couldn't find any matches for your search query." : "You haven't submitted any applications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const currentIdx = getStageIndex(app.status);
              const isWithdrawnOrRejected = ['withdrawn', 'rejected'].includes(app.status?.toLowerCase());
              const dateApplied = app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

              return (
                <div key={app.id} className="surface-raised !rounded-xl overflow-hidden p-5 space-y-5 transition-all duration-300 hover:shadow-md hover:border-stone-300">
                  
                  {/* Top card block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        {app.company_name?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-stone-900 leading-none group-hover:text-emerald-600 transition-colors">
                            {app.job_title}
                          </h3>
                          <span className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadgeStyle(app.status)}`}>
                            {app.status || 'Applied'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-stone-400 font-semibold mt-1.5 flex-wrap">
                          <span className="text-stone-500 font-bold">{app.company_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {app.location || 'Remote'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> Applied {dateApplied}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions block */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isWithdrawnOrRejected && (
                        <button
                          onClick={() => setWithdrawConfirm({ open: true, id: app.id, jobTitle: app.job_title, loading: false })}
                          className="h-8 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10.5px] font-bold transition-all flex items-center gap-1"
                        >
                          <Trash2 size={11} />
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection / Special reason alert block */}
                  {app.status === 'rejected' && app.rejection_reason && (
                    <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 flex gap-2 items-start text-xs text-rose-800 animate-fade-in">
                      <AlertCircle size={14} className="shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <p className="font-bold">Rejection Feedback:</p>
                        <p className="italic mt-0.5">"{app.rejection_reason}"</p>
                      </div>
                    </div>
                  )}

                  {/* Horizontal stepper timeline */}
                  <div className="border-t border-stone-100 pt-5 pb-1">
                    <div className="flex items-center justify-between relative px-2 sm:px-6">
                      {/* Timeline bar line */}
                      <div className="absolute left-6 right-6 top-[7px] h-0.5 bg-stone-100 -z-10" />

                      {stagesList.map((stage, sIdx) => {
                        const style = getStageStyle(sIdx, currentIdx, isWithdrawnOrRejected);
                        const isCompleted = sIdx < currentIdx && !isWithdrawnOrRejected;
                        const isActive = sIdx === currentIdx && !isWithdrawnOrRejected;

                        return (
                          <div key={stage} className="flex flex-col items-center relative z-10">
                            {/* Line connecting previous dot (drawn absolute) */}
                            {sIdx > 0 && (
                              <div className={`absolute right-1/2 top-[7px] h-0.5 w-[calc(100vw/5)] -z-20 max-w-[200px] ${
                                sIdx <= currentIdx && !isWithdrawnOrRejected ? 'bg-emerald-500' : 'bg-stone-100'
                              }`} />
                            )}

                            {/* Dot indicator */}
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all ${style.dot}`}>
                              {isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>

                            <span className={`text-[9px] font-black mt-2 tracking-tight uppercase ${style.text}`}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={withdrawConfirm.open}
        onClose={() => setWithdrawConfirm({ open: false, id: '', jobTitle: '', loading: false })}
        onConfirm={confirmWithdraw}
        title={`Withdraw application${withdrawConfirm.jobTitle ? ` for ${withdrawConfirm.jobTitle}` : ''}?`}
        description="This will permanently remove your application. The company will no longer be able to review it. This action cannot be undone."
        confirmLabel="Yes, Withdraw"
        variant="danger"
        loading={withdrawConfirm.loading}
      />
    </div>
  );
};
export default CandidateApplicationsPage;
