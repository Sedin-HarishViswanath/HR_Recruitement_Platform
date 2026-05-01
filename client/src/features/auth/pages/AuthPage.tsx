import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<'internal' | 'candidate'>('internal');
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Left side - Branding/Marketing */}
      <div className="hidden lg:flex w-[60%] bg-blue-600 text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-8 left-8 font-bold text-2xl tracking-tighter">
          HR Platform
        </div>
        <div className="z-10 max-w-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            The modern way to hire <br /> top talent.
          </h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Replace fragmented spreadsheets and lost candidate data with a seamless, automated hiring pipeline.
          </p>
          <div className="bg-white/10 p-6 rounded-xl border border-white/20 backdrop-blur-md">
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/30 rounded-lg">
              {/* Placeholder for Kanban animation */}
              <span className="text-blue-200 font-medium">Pipeline Visualization Demo</span>
            </div>
          </div>
        </div>
        {/* Decorative background shapes */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-8 bg-white shadow-[0_0_40px_rgba(0,0,0,0.05)] z-20">
        
        {/* Toggle Switcher */}
        <div className="w-full max-w-md flex bg-slate-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('internal')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'internal' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Internal
          </button>
          <button
            onClick={() => setActiveTab('candidate')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'candidate' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Candidate
          </button>
        </div>

        {/* Form Container */}
        {isLogin ? (
          <LoginForm role={activeTab} onToggleMode={() => setIsLogin(false)} />
        ) : (
          <div className="w-full max-w-md text-center">
            {/* Signup form placeholder to save time, logic is identical structurally to login but with more fields */}
            <h2 className="text-2xl font-bold mb-4">Sign up</h2>
            <p className="text-muted-foreground mb-6">Signup form placeholder. Implement full fields later.</p>
            <button onClick={() => setIsLogin(true)} className="text-blue-600 hover:underline text-sm font-medium">
              Back to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
