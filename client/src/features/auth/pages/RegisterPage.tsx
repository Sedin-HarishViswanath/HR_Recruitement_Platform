import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SignupForm } from '../components/SignupForm';
import { Building2, User, Sparkles } from 'lucide-react';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get('role');
  const [role, setRole] = useState<'internal' | 'candidate'>(
    roleParam === 'candidate' ? 'candidate' : 'internal'
  );

  return (
    <div className="min-h-screen font-sans text-stone-900 bg-background flex flex-col">
      {/* Navbar - dark themed for high contrast layout */}
      <nav className="w-full bg-[#0c0e14] px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-650 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 relative">
            <Sparkles size={14} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <h1 className="text-white text-[14px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>RecruitAI</h1>
            <p className="text-[8px] uppercase tracking-[0.16em] font-black mt-0.5 text-emerald-400">ATS Engine</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login?role=candidate')}
            className="px-4 py-2 rounded-lg text-white/60 hover:text-white text-[12px] font-bold transition-colors cursor-pointer"
          >
            Candidate Portal
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-750 text-white text-[12px] font-bold transition-spring shadow-sm cursor-pointer shadow-emerald-500/10"
          >
            Internal Team Sign In
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center py-10 px-4 animate-fade-in-up">
        <div className="w-full max-w-[760px] space-y-6">
          {/* Page heading */}
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Create your account
            </h2>
            <p className="text-xs text-stone-400 font-semibold mt-1.5">
              Already registered?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-800 cursor-pointer">Sign in to workspace →</Link>
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex gap-3 justify-center">
            {[
              { key: 'internal', label: 'Recruiter Workspace', icon: Building2, desc: 'Manage job posts, teams & simulation pipelines' },
              { key: 'candidate', label: 'Candidate Account', icon: User, desc: 'Practice mock rounds & review matching metrics' },
            ].map((t) => {
              const isSelected = role === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setRole(t.key as any)}
                  className={`flex items-center gap-3.5 px-5 py-4 rounded-xl border text-left transition-spring flex-1 max-w-[340px] cursor-pointer bg-white ${
                    isSelected
                      ? 'border-emerald-500 shadow-md shadow-emerald-100/50 scale-[1.01]'
                      : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-spring ${
                    isSelected ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-stone-100 text-stone-500'
                  }`}>
                    <t.icon size={16} />
                  </div>
                  <div>
                    <p className={`text-[12px] font-bold leading-tight ${isSelected ? 'text-emerald-750' : 'text-stone-700'}`}>{t.label}</p>
                    <p className="text-[10px] text-stone-400 font-semibold leading-tight mt-1">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="outer-bezel">
            <div className="inner-core !p-0 overflow-hidden">
              <div className="px-8 pt-7 pb-5 border-b border-stone-100 bg-stone-50/30">
                <h2 className="text-base font-extrabold tracking-tight text-stone-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {role === 'internal' ? 'Deploy Recruiter Workspace' : 'Configure Candidate Profile'}
                </h2>
                <p className="text-[12px] text-stone-450 font-bold mt-1">
                  {role === 'internal'
                    ? 'Register your company organization below to coordinate multi-tenant team members.'
                    : 'Configure your profile to start testing code sandbox mock rounds.'}
                </p>
              </div>
              <div className="p-8">
                <SignupForm role={role} onToggleMode={() => navigate('/')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
