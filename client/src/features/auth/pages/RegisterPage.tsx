import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SignupForm } from '../components/SignupForm';
import { BriefcaseBusiness, Building2, User } from 'lucide-react';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get('role');
  const [role, setRole] = useState<'internal' | 'candidate'>(
    roleParam === 'candidate' ? 'candidate' : 'internal'
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      {/* Dark Navbar */}
      <nav className="w-full bg-[#0d1117] px-8 py-3.5 flex items-center justify-between shadow-lg sticky top-0 z-50 shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <BriefcaseBusiness size={16} />
          </div>
          <div>
            <h1 className="text-white text-[13px] font-bold tracking-tight leading-none">Recruiting AI</h1>
            <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">Multi-tenant ATS + AI shortlisting</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login?role=candidate')}
            className="px-4 py-2 rounded-lg text-white/70 hover:text-white text-[12px] font-semibold transition-colors"
          >
            Candidate Login
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all shadow-sm"
          >
            Internal Login
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-[760px]">
          {/* Tab Switcher */}
          <div className="flex gap-3 mb-5 justify-center">
            {[
              { key: 'internal', label: 'Company Registration', icon: Building2, desc: 'Register your company and manage hiring' },
              { key: 'candidate', label: 'Candidate Account', icon: User, desc: 'Create your profile and apply for jobs' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRole(t.key as any)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-left transition-all flex-1 max-w-[280px] ${
                  role === t.key
                    ? 'bg-white border-blue-500 shadow-md shadow-blue-600/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  role === t.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <t.icon size={15} />
                </div>
                <div>
                  <p className={`text-[12px] font-bold leading-tight ${role === t.key ? 'text-blue-700' : 'text-slate-700'}`}>{t.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Card Header */}
            <div className="px-8 pt-7 pb-5 border-b border-slate-100">
              <h2 className="text-[18px] font-black tracking-tight text-slate-900">
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

          <p className="text-center mt-6 text-[12px] font-medium text-slate-500 pb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
