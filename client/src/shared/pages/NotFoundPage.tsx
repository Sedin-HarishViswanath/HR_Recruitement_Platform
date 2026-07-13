import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="max-w-md w-full bg-white rounded-[28px] border border-stone-200/60 p-10 text-center animate-scale-in"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-7 shadow-inner">
          <Compass size={30} />
        </div>

        <h1
          className="text-[28px] font-extrabold text-stone-900 tracking-tight mb-3"
          style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
        >
          Page Not Found
        </h1>

        <p className="text-[14px] text-stone-500 font-normal mb-8 leading-relaxed max-w-[300px] mx-auto">
          The page you're looking for doesn't exist or may have been moved. Check the URL or head back to safety.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full h-11 rounded-xl border border-stone-200 text-stone-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-emerald-200"
          >
            <Home size={16} /> Back to Home
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.16em]">
            Error 404
          </p>
        </div>
      </div>
    </div>
  );
};
