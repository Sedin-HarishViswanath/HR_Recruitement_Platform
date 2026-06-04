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
    <div className="min-h-screen font-sans text-slate-900 flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-[#0c0e14] px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/40 relative">
            <Sparkles size={14} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <h1 className="text-white text-[14px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>RecruitAI</h1>
            <p className="text-[8.5px] uppercase tracking-[0.15em] font-bold mt-0.5" style={{ color: 'rgba(139,92,246,0.8)' }}>Enterprise ATS</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login?role=candidate')}
            className="px-4 py-2 rounded-lg text-white/60 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Candidate Login
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
          >
            Internal Login
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-[760px]">

          {/* Page heading */}
          <div className="text-center mb-7">
            <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora' }}>
              Create your account
            </h2>
            <p className="text-[13px] text-slate-500 font-normal mt-1">
              Already have one?{' '}
              <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700 cursor-pointer">Sign in →</Link>
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex gap-3 mb-6 justify-center">
            {[
              { key: 'internal', label: 'Company Registration', icon: Building2, desc: 'Manage jobs, hiring & teams' },
              { key: 'candidate', label: 'Candidate Account', icon: User, desc: 'Discover and apply to great roles' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRole(t.key as any)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-left transition-all flex-1 max-w-[280px] cursor-pointer ${
                  role === t.key
                    ? 'bg-white border-violet-400 shadow-md shadow-violet-100'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  role === t.key ? 'bg-violet-600 text-white shadow-sm shadow-violet-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  <t.icon size={15} />
                </div>
                <div>
                  <p className={`text-[12px] font-bold leading-tight ${role === t.key ? 'text-violet-700' : 'text-slate-700'}`}>{t.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="px-8 pt-7 pb-5 border-b border-slate-100">
              <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Sora' }}>
                {role === 'internal' ? 'Register your Company' : 'Create your Account'}
              </h2>
              <p className="text-[12px] text-slate-500 font-medium mt-1">
                {role === 'internal'
                  ? 'Set up your organization to start managing jobs and candidates.'
                  : 'Join to discover and apply to amazing opportunities.'}
              </p>
            </div>
            <div className="p-8">
              <SignupForm role={role} onToggleMode={() => navigate('/')} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
