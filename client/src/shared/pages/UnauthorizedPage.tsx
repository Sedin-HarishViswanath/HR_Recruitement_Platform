import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[28px] border border-slate-200/60 p-10 text-center animate-scale-in" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}>

        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-7 shadow-inner">
          <ShieldAlert size={30} />
        </div>

        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Access Denied
        </h1>

        <p className="text-[14px] text-slate-500 font-normal mb-8 leading-relaxed max-w-[300px] mx-auto">
          You don't have permission to view this page. Contact your administrator if you think this is a mistake.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full h-11 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-violet-200"
          >
            <Home size={16} /> Back to Home
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.16em]">
            RBAC Enforcement Active
          </p>
        </div>
      </div>
    </div>
  );
};
