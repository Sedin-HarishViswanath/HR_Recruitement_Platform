import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Building2,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import type { RootState } from '../../../app/store';
import { logout, updateUser } from '../../auth/auth.slice';
import { Button } from '../../../components/ui/button';
import { api } from '../../../shared/lib/api';

export const PendingApproval = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/');
  };

  const companyStatus = user?.companyStatus?.toLowerCase();
  const isRevoked = companyStatus === 'revoked';
  const isRejected = companyStatus === 'rejected';
  const isNegative = isRevoked || isRejected;

  // Poll for status changes every 12 seconds
  const pollStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const fetched = data.data?.user;
      if (!fetched) return;

      const newStatus = fetched.companyStatus?.toLowerCase();
      if (newStatus === 'active') {
        dispatch(updateUser({ companyStatus: 'active', onboardingCompleted: true }));
        navigate('/company/dashboard', { replace: true });
      } else if (newStatus === 'rejected' && companyStatus !== 'rejected') {
        dispatch(updateUser({ companyStatus: 'rejected' }));
      } else if (newStatus === 'revoked' && companyStatus !== 'revoked') {
        dispatch(updateUser({ companyStatus: 'revoked' }));
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [dispatch, navigate, companyStatus]);

  useEffect(() => {
    // Don't poll if already in a negative terminal state
    if (isRevoked || isRejected) return;

    pollStatus(); // Check immediately on mount
    const interval = setInterval(pollStatus, 12000);
    return () => clearInterval(interval);
  }, [pollStatus, isRevoked, isRejected]);

  const statusColor = isNegative ? 'bg-rose-400' : 'bg-blue-400';
  const iconBg = isNegative ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-violet-50 border-violet-100 text-violet-600 animate-pulse';

  const statusTitle = isRejected
    ? <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
        Application <span className="text-rose-600">Rejected</span>
      </h2>
    : isRevoked
    ? <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
        Account Access <span className="text-rose-600">Revoked</span>
      </h2>
    : <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
        Account Pending <span className="text-violet-600">Verification</span>
      </h2>;

  const statusDesc = isRejected
    ? 'Your company application was reviewed and not approved. Please contact support if you believe this is an error or wish to reapply.'
    : isRevoked
    ? 'Your company\'s access has been suspended by the system administrator. Please reach out to support if you think this is in error.'
    : 'Thanks for joining RecruitAI! Our team is reviewing your company details. You\'ll receive full access as soon as your account is approved.';

  const steps = isRejected ? [
    { step: '1', title: 'Registration', desc: 'Your company and admin details were submitted.', completed: true },
    { step: '2', title: 'Super Admin Review', desc: 'Application was reviewed by our team.', completed: true },
    { step: '3', title: 'Application Rejected', desc: 'Your application was not approved at this time.', error: true },
  ] : isRevoked ? [
    { step: '1', title: 'Registration', desc: 'Your company and admin details were submitted.', completed: true },
    { step: '2', title: 'Super Admin Review', desc: 'We verified your company domain and information.', completed: true },
    { step: '3', title: 'Access Revoked', desc: 'Your access has been terminated.', error: true },
  ] : [
    { step: '1', title: 'Registration', desc: 'Your company and admin details were submitted.', completed: true },
    { step: '2', title: 'Super Admin Review', desc: 'We are verifying your company domain and information.', current: true },
    { step: '3', title: 'Platform Access', desc: 'Unlock job management, AI shortlisting, and more.', pending: true },
  ];

  return (
    <div className="min-h-screen font-sans text-slate-900 flex flex-col">
      <nav className="w-full bg-[#0b0f19] px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-md">
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-white text-sm font-bold tracking-tight leading-none">RecruitAI</h1>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-black">Company Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNegative && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Checking status...
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 transition-all duration-700 opacity-20 ${statusColor}`} />
              <div className="relative z-10 space-y-6">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner ${iconBg}`}>
                  {isNegative ? <XCircle size={28} /> : <Clock size={28} />}
                </div>
                <div className="space-y-2">
                  {statusTitle}
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md">{statusDesc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm ${isNegative ? 'text-rose-600' : 'text-violet-600'}`}>
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest">Status</p>
                      <p className="text-xs font-bold text-slate-800">
                        {isRejected ? 'Rejected' : isRevoked ? 'Revoked' : 'Under Review'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm ${isNegative ? 'text-rose-600' : 'text-violet-600'}`}>
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest">Action Required</p>
                      <p className="text-xs font-bold text-slate-800">
                        {isNegative ? 'Contact Support' : 'Wait for Approval'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-900 tracking-tight mb-6" style={{ fontFamily: 'Sora' }}>Verification Journey</h3>
              <div className="space-y-6">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== steps.length - 1 && <div className="absolute left-4 top-8 w-0.5 h-10 bg-slate-100" />}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm transition-all border ${
                      (s as any).error
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : (s as any).completed
                          ? 'bg-violet-50 border-violet-200 text-violet-600'
                          : (s as any).current
                            ? 'bg-violet-100 border-violet-300 text-violet-600 ring-2 ring-violet-50'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {(s as any).completed ? <CheckCircle2 size={15} /> : (s as any).error ? <XCircle size={15} /> : <span className="font-bold text-xs">{s.step}</span>}
                    </div>
                    <div className="pt-0.5">
                      <h4 className={`font-bold text-xs ${(s as any).pending ? 'text-slate-400' : 'text-slate-900'}`}>{s.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-l-2 border-violet-600 pl-3">Company Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest leading-none mb-1">Company</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name ? `${user.name}'s Company` : 'Your Company'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest leading-none mb-1">Admin</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Admin'}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-3.5 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-violet-600 font-black text-[9px] uppercase tracking-wider">
                    <AlertCircle size={12} /> Need to update details?
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 font-medium italic">Contact support@recruitai.com</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0f19] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full -mr-12 -mb-12" />
              <h4 className="font-bold text-[14px] mb-2 relative z-10" style={{ fontFamily: 'Sora' }}>Have Questions?</h4>
              <p className="text-[11.5px] text-slate-400 font-medium mb-5 relative z-10 leading-relaxed">
                Our team is here to help you get started with the platform.
              </p>
              <Button className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg relative z-10 transition-colors">
                Read Documentation
              </Button>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full border-t border-slate-150 bg-white py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 RecruitAI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-[10px] text-slate-400 hover:text-violet-600 font-bold transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-[10px] text-slate-400 hover:text-violet-600 font-bold transition-colors uppercase tracking-widest">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
