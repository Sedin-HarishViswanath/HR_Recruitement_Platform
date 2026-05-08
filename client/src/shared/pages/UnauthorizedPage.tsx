import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] border border-slate-200 p-10 shadow-2xl shadow-slate-200/50 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
          Access Denied
        </h1>
        
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          Oops! It looks like you don't have the required permissions to access this page. 
          Please contact your administrator if you believe this is an error.
        </p>

        <div className="space-y-4">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="w-full h-12 rounded-2xl border-slate-200 font-black text-slate-900 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ArrowLeft size={18} /> Go Back
          </Button>
          
          <Button 
            onClick={() => navigate('/')} 
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Home size={18} /> Back to Home
          </Button>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
            RBAC Enforcement Active
          </p>
        </div>
      </div>
    </div>
  );
};
