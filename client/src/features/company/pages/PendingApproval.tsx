import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Building2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin,
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

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <nav className="w-full bg-[#0a0e17] px-8 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight leading-none">Recruiting AI</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Company Portal</p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-white/10"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Status Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-8 shadow-inner animate-pulse">
                  <Clock size={40} />
                </div>
                
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                  Account Pending <br />
                  <span className="text-blue-600">Verification</span>
                </h2>
                
                <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-lg">
                  Thanks for joining Recruiting AI! Our Super Admin is currently reviewing your company details. You'll have full access as soon as your account is approved.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:bg-blue-50/50">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Verification</p>
                      <p className="text-sm font-bold text-slate-900">In Progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:bg-blue-50/50">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Wait Time</p>
                      <p className="text-sm font-bold text-slate-900">~24 Hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Verification Journey</h3>
              <div className="space-y-8">
                {[
                  { step: '1', title: 'Registration', desc: 'Your company and admin details were submitted.', completed: true },
                  { step: '2', title: 'Super Admin Review', desc: 'We are verifying your company domain and information.', current: true },
                  { step: '3', title: 'Platform Access', desc: 'Unlock job management, AI shortlisting, and more.', pending: true },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6 relative">
                    {i !== 2 && <div className="absolute left-5 top-10 w-0.5 h-12 bg-slate-100" />}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm transition-all ${s.completed ? 'bg-blue-600 text-white' : s.current ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50' : 'bg-slate-100 text-slate-400'}`}>
                      {s.completed ? <CheckCircle2 size={20} /> : <span className="font-black text-sm">{s.step}</span>}
                    </div>
                    <div className="pt-1">
                      <h4 className={`font-black text-base ${s.pending ? 'text-slate-400' : 'text-slate-900'}`}>{s.title}</h4>
                      <p className="text-sm text-slate-500 font-medium mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Info Sidebar */}
          <div className="space-y-8">
            {/* Company Summary */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">Company Details</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Name</p>
                    <p className="text-sm font-bold text-slate-900">{user?.name}'s Company</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Admin</p>
                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-wider">
                      <AlertCircle size={14} /> Need to update details?
                   </div>
                   <p className="text-[11px] text-slate-400 mt-1 font-medium italic">Contact support@recruiting.ai</p>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-[#0a0e17] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mb-16" />
               <h4 className="font-black text-lg mb-4 relative z-10">Have Questions?</h4>
               <p className="text-sm text-slate-400 font-medium mb-6 relative z-10 leading-relaxed">
                 Our team is here to help you get started with the platform features.
               </p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl relative z-10">
                 Read Documentation
               </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-8 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">© 2026 Recruiting AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-400 hover:text-blue-600 font-bold transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-blue-600 font-bold transition-colors uppercase tracking-widest">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
