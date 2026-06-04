import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Building2, 
  ShieldCheck, 
  CheckCircle2,
  LogOut,
  AlertCircle
} from 'lucide-react';
import type { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';
import { Button } from '../../../components/ui/button';

export const PendingApproval = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/');
  };

  const isRevoked = user?.companyStatus?.toLowerCase() === 'revoked';

  return (
    <div className="min-h-screen font-sans text-slate-900 flex flex-col">
      {/* Header bar matching Image 4 */}
      <nav className="w-full bg-[#0b0f19] px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-md">
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-white text-sm font-bold tracking-tight leading-none">Recruiting AI</h1>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-black">Company Portal</p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Status Card & Journey Progress */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm relative overflow-hidden group">
              {/* Decorative radial overlay */}
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 transition-all duration-700 opacity-20 ${isRevoked ? 'bg-rose-400' : 'bg-blue-400'}`} />
              
              <div className="relative z-10 space-y-6">
                {isRevoked ? (
                  <>
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                      <AlertCircle size={28} />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
                        Account Access <span className="text-rose-600">Revoked</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md">
                        Your company's access to recruiting tools has been suspended or revoked by the system administrator. Please reach out to support if you think this is in error.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-center text-violet-600 shadow-inner animate-pulse">
                      <Clock size={28} />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
                        Account Pending <span className="text-violet-600">Verification</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-md">
                        Thanks for joining Recruiting AI! Our Super Admin is currently reviewing your company details. You'll have full access as soon as your account is approved.
                      </p>
                    </div>
                  </>
                )}

                {/* Sub status details box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center ${isRevoked ? 'text-rose-600' : 'text-violet-600'} shadow-sm`}>
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest">Status</p>
                      <p className="text-xs font-bold text-slate-800">{isRevoked ? 'Revoked' : 'In Progress'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center ${isRevoked ? 'text-rose-600' : 'text-violet-600'} shadow-sm`}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest">Action Required</p>
                      <p className="text-xs font-bold text-slate-800">{isRevoked ? 'Contact Support' : 'Wait for Email'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Journey Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <h3 className="text-[14px] font-black text-slate-900 tracking-tight mb-6" style={{ fontFamily: 'Sora' }}>Verification Journey</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Registration', desc: 'Your company and admin details were submitted.', completed: true },
                  { step: '2', title: 'Super Admin Review', desc: 'We are verifying your company domain and information.', current: !isRevoked, completed: isRevoked },
                  { step: '3', title: isRevoked ? 'Access Revoked' : 'Platform Access', desc: isRevoked ? 'Your access has been terminated.' : 'Unlock job management, AI shortlisting, and more.', pending: !isRevoked, error: isRevoked },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== 2 && <div className="absolute left-4 top-8 w-0.5 h-10 bg-slate-100" />}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm transition-all border ${
                      s.error 
                        ? 'bg-rose-50 border-rose-200 text-rose-600' 
                        : s.completed 
                          ? 'bg-violet-50 border-violet-200 text-violet-600' 
                          : s.current 
                            ? 'bg-violet-100 border-violet-300 text-violet-600 ring-2 ring-violet-50' 
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {s.completed ? <CheckCircle2 size={15} /> : s.error ? <AlertCircle size={15} /> : <span className="font-bold text-xs">{s.step}</span>}
                    </div>
                    <div className="pt-0.5">
                      <h4 className={`font-bold text-xs ${s.pending ? 'text-slate-400' : 'text-slate-900'}`}>{s.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Info Sidebar */}
          <div className="space-y-6">
            {/* Company details panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-l-2 border-violet-600 pl-3">Company Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest leading-none mb-1">Name</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {user?.name ? `${user.name}'s Company` : 'Harish Viswanath\'s Company'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest leading-none mb-1">Admin</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Harish Viswanath'}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{user?.email || 'harishviswanath017@gmail.com'}</p>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-violet-600 font-black text-[9px] uppercase tracking-wider">
                    <AlertCircle size={12} /> Need to update details?
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 font-medium italic">Contact support@recruiting.ai</p>
                </div>
              </div>
            </div>

            {/* Have Questions Documentation Card */}
            <div className="bg-[#0b0f19] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full -mr-12 -mb-12" />
              <h4 className="font-bold text-[14px] mb-2 relative z-10" style={{ fontFamily: 'Sora' }}>Have Questions?</h4>
              <p className="text-[11.5px] text-slate-400 font-medium mb-5 relative z-10 leading-relaxed">
                Our team is here to help you get started with the platform features.
              </p>
              <Button className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg relative z-10 transition-colors">
                Read Documentation
              </Button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full border-t border-slate-150 bg-white py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 Recruiting AI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-[10px] text-slate-400 hover:text-violet-600 font-bold transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-[10px] text-slate-400 hover:text-violet-600 font-bold transition-colors uppercase tracking-widest">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
