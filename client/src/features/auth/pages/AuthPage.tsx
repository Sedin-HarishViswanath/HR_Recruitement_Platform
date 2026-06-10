import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { LoginForm } from '../components/LoginForm';
import {
  ShieldCheck, Building2, Briefcase, Calendar, BarChart3,
  FileText, Sparkles, Globe, Menu, X,
  ArrowRight, CheckCircle2, Layers, Target,
} from 'lucide-react';

/* ── Scroll-reveal hook ── */
const useReveal = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(el); } }, { threshold, rootMargin: '0px 0px -60px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
};

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = (user.role || '').toLowerCase().trim();
      const onboardingCompleted = user.onboardingCompleted;

      if (userRole === 'candidate') {
        if (onboardingCompleted === false) {
          navigate('/candidate/onboarding', { replace: true });
        } else {
          navigate('/candidate/dashboard', { replace: true });
        }
      } else if (userRole === 'super admin' || userRole === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        // Company admin or other roles
        if (onboardingCompleted === false) {
          navigate('/company/onboarding', { replace: true });
        } else if (['pending', 'revoked', 'rejected'].includes(user.companyStatus?.toLowerCase() || '')) {
          navigate('/pending-approval', { replace: true });
        } else {
          navigate('/company/dashboard', { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthView = location.pathname === '/login';
  const [authRole, setAuthRole] = useState<'internal' | 'candidate'>(
    (location.state as any)?.role || 'internal'
  );

  const handleLoginClick = (role: 'internal' | 'candidate') => { setAuthRole(role); navigate('/login'); };

  // Scroll-reveal refs for landing sections
  const hero = useReveal();
  const stats = useReveal();
  const features = useReveal();
  const workflow = useReveal();
  const cta = useReveal();

  /* ═══ LOGIN VIEW ═══ */
  if (isAuthView) {
    return (
      <div className="min-h-screen bg-white flex overflow-hidden font-sans">
        {/* Left Panel - Premium Dark Carbon Theme */}
        <div className="hidden lg:flex w-[460px] p-10 flex-col justify-between shrink-0 relative overflow-hidden border-r border-slate-900/80"
          style={{ background: 'radial-gradient(120% 70% at 0% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%), linear-gradient(180deg, #0b0d14 0%, #050608 100%)' }}>
          {/* Glowing structural backgrounds */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 -right-16 w-64 h-64 rounded-full bg-sky-500/10 blur-[110px] pointer-events-none" />

          {/* Logo brand */}
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-md ring-1 ring-white/10 font-bold">
              <span className="text-[14px]">R</span>
            </div>
            <div>
              <h2 className="text-white text-[14px] font-bold tracking-tight leading-none animate-float" style={{ fontFamily: 'Sora' }}>RecruitAI</h2>
              <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-[0.16em] font-black">Enterprise Suite</p>
            </div>
          </div>

          {/* Main Title info */}
          <div className="space-y-4 relative z-10 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-violet-400 border border-violet-500/20 uppercase tracking-widest bg-violet-500/5">
              <Sparkles size={11} className="text-violet-400" /> co-pilot engine active
            </span>
            <h1 className="text-[30px] font-extrabold tracking-tight leading-[1.2] text-white" style={{ fontFamily: 'Sora' }}>
              Transform your hiring pipelines.
            </h1>
            <p className="text-[12.5px] text-slate-400 font-medium leading-relaxed">
              Log in to access candidate scorecards, check matching parameters, and manage active simulator rooms.
            </p>
          </div>

          {/* Telemetry/Suggestions grid block */}
          <div className="relative z-10 bg-slate-950/60 p-1.5 rounded-[22px] border border-slate-900 shadow-xl mt-6">
            <div className="bg-slate-900/60 rounded-[calc(22px-6px)] p-4 border border-slate-800/50 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center"><Sparkles size={11} /></div>
                  <p className="text-[11px] font-bold text-slate-200" style={{ fontFamily: 'Sora' }}>Telemetry · Fit Score</p>
                </div>
                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">ML Active</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'Sarah Jenkins', role: 'Staff Product Eng', score: '96% fit', color: 'from-blue-600 to-indigo-600' },
                  { name: 'David Mercer', role: 'DevOps Architect', score: '91% fit', color: 'from-violet-600 to-fuchsia-600' },
                  { name: 'Elena Rostova', role: 'Lead UI Designer', score: '88% fit', color: 'from-emerald-600 to-teal-600' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-[9px] font-bold shadow-sm`}>
                        {c.name.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-250 font-bold leading-none">{c.name}</p>
                        <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{c.role}</p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-black text-emerald-400">{c.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats footer row */}
          <div className="flex gap-3 mt-auto relative z-10 pt-6">
            {[
              { val: '2.8x', label: 'Velocity' },
              { val: '94%', label: 'Retention' },
              { val: '4.9★', label: 'App Rating' },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                <p className="text-[14px] font-extrabold text-white" style={{ fontFamily: 'Sora' }}>{s.val}</p>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-4">
            <span>© 2026 RecruitAI INC.</span>
            <span>SOC 2 COMPLIANT</span>
          </div>
        </div>

        {/* Right Panel - Login Forms */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-50/20 relative">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-[11px] font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1.5 transition-spring cursor-pointer">
            ← Back to platform overview
          </button>
          <div className="w-full max-w-[360px] animate-fade-in-up">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold"><span className="text-[13px]">R</span></div>
                <h2 className="text-slate-900 text-[15px] font-extrabold" style={{ fontFamily: 'Sora' }}>RecruitAI</h2>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Sora' }}>
                Access workspace
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-1.5">
                New user? <button onClick={() => navigate('/register')} className="text-violet-600 hover:text-violet-800 font-bold">Register an account →</button>
              </p>
              <div className="flex bg-slate-100 border border-slate-200/50 p-0.5 rounded-xl mt-5 gap-0.5">
                {['internal', 'candidate'].map(r => (
                  <button key={r} onClick={() => setAuthRole(r as any)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-spring cursor-pointer ${authRole === r ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-700'}`}>
                    {r === 'internal' ? 'Recruiter Team' : 'Candidate'}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel p-5 bg-white shadow-md">
              <LoginForm role={authRole} onToggleMode={() => navigate('/register')} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ LANDING PAGE ═══ */
  return (
    <div className="min-h-screen bg-background text-slate-900 overflow-x-hidden flex flex-col font-sans">
      {/* ── Navbar ── */}
      <nav className="w-full topbar-frost px-6 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-md ring-1 ring-white/20 font-bold">
            <span className="text-[12px]">R</span>
          </div>
          <div>
            <h1 className="text-slate-900 text-[14px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>RecruitAI</h1>
            <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-black hidden sm:block">ATS Engine</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => handleLoginClick('candidate')} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-[13px] font-bold transition-spring">Sign In</button>
          <button onClick={() => handleLoginClick('internal')} className="btn-primary">Register Workspace</button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-slate-600 p-1">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </nav>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-100 px-4 py-3 space-y-2 animate-fade-in shadow-sm">
          <button onClick={() => { handleLoginClick('candidate'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-slate-650 hover:text-slate-900 text-[13px] font-bold rounded-lg hover:bg-slate-50 transition-colors">Sign in</button>
          <button onClick={() => { handleLoginClick('internal'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 bg-violet-650 text-white text-[13px] font-bold rounded-lg">Register Workspace</button>
        </div>
      )}

      {/* ── Hero ── */}
      <section ref={hero.ref} className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-400 rounded-full blur-[300px] opacity-[0.07] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-400 rounded-full blur-[200px] opacity-[0.04] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(124,92,246,0.08) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)' }} />

        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center relative z-10">
          <div className={`space-y-6 max-w-3xl mx-auto transition-all duration-1000 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="chip-brand">
              <Sparkles size={11} className="animate-float" /> AI-augmented recruiting sandbox
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.1] text-slate-900" style={{ fontFamily: 'Sora' }}>
              Recruit with deep<br />
              <span className="text-violet-750">structural insights.</span>
            </h2>

            <p className="text-[15px] text-slate-500 leading-relaxed font-semibold max-w-xl mx-auto">
              Combining automated scorecards, custom zero-dependency ML signals,
              and code sandbox execution for transparent hiring.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button onClick={() => handleLoginClick('internal')}
                className="btn-primary !px-6 !py-3 !text-[14px]">
                Create Recruiter Workspace <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/candidate/jobs')}
                className="btn-soft !px-6 !py-3 !text-[14px]">
                Candidate Search Portal
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {['14-Day Free Evaluation', 'Zero Sandbox Dependencies', 'Scorecard Analytics'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className={`mt-14 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="outer-bezel">
              <div className="inner-core bg-[#fafbfc] p-4 rounded-[18px]">
                <div className="flex items-center gap-1.5 px-2 pb-3 border-b border-slate-200/40 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-auto text-[9px] text-slate-400 font-bold uppercase tracking-wider">interface preview</span>
                </div>
                <div className="flex gap-4 text-left">
                  {/* Mini sidebar */}
                  <div className="w-32 shrink-0 hidden sm:block border-r border-slate-200/40 pr-2">
                    {['Dashboard', 'Applications', 'Job Posts', 'Interviews', 'Debriefs'].map((item, i) => (
                      <div key={i} className={`text-[10px] font-bold py-1.5 px-2.5 rounded-lg mb-0.5 ${i === 0 ? 'bg-violet-50 text-violet-755' : 'text-slate-400'}`}>{item}</div>
                    ))}
                  </div>
                  {/* Mini dashboard */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Shortlisted', val: '2,847', trend: '+12%', color: 'text-emerald-600' },
                        { label: 'Active Rounds', val: '312', trend: '+5%', color: 'text-emerald-600' },
                        { label: 'Placed', val: '156', trend: '+18%', color: 'text-emerald-600' },
                      ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{s.label}</p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <p className="text-[17px] font-extrabold text-slate-900 leading-none" style={{ fontFamily: 'Sora' }}>{s.val}</p>
                            <span className={`text-[8.5px] font-bold ${s.color}`}>{s.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200/50 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-extrabold text-slate-800" style={{ fontFamily: 'Sora' }}>Recruiting Conversion Ratio</p>
                        <span className="text-[8px] bg-emerald-50 text-emerald-650 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Metrics Live</span>
                      </div>
                      <div className="flex items-end gap-2 h-16 pt-1">
                        {[24, 38, 42, 31, 52, 18, 28].map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className={`w-full rounded ${i === 1 ? 'bg-violet-500' : 'bg-slate-200'}`} style={{ height: `${(v / 52) * 44}px` }} />
                            <span className="text-[7.5px] text-slate-400 font-bold uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Stats ── */}
      <section ref={stats.ref} className="py-12 sm:py-14 bg-slate-50/40 border-y border-slate-200/40">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.22em] text-center mb-7">TRUSTED BY TEAMS WORLDWIDE</p>
          <div className={`flex flex-wrap justify-center items-center gap-x-12 gap-y-6 transition-all duration-700 ${stats.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { name: 'Stripe', slug: 'stripe' },
              { name: 'Notion', slug: 'notion' },
              { name: 'Linear', slug: 'linear' },
              { name: 'Vercel', slug: 'vercel' },
              { name: 'Figma', slug: 'figma' },
              { name: 'Ramp', slug: 'ramp' }
            ].map((logo, i) => logo.slug === 'ramp' ? (
              <svg
                key={i}
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 sm:h-5.5 opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-default text-[#64748b] dark:text-slate-400"
              >
                <mask id="ramp-mask">
                  <rect width="500" height="500" fill="white" />
                  <path d="M382 357.969V359.099L218.605 359.147V357.969C242.176 344.678 258.435 331.162 273.075 317.016H340.164L382 357.969ZM341.523 145.533L300.108 105H298.895C298.895 105 299.591 180.576 230.059 249.304C162.015 316.58 82 316.725 82 316.725V317.904L124.192 359.164C124.192 359.164 203.042 359.939 272.703 291.743C342.106 223.757 341.523 145.533 341.523 145.533Z" fill="black" />
                </mask>
                <circle cx="250" cy="250" r="250" fill="currentColor" mask="url(#ramp-mask)" />
              </svg>
            ) : (
              <img
                key={i}
                src={`https://cdn.simpleicons.org/${logo.slug}/64748b`}
                alt={logo.name}
                className="h-5 sm:h-5.5 opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-default object-contain"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section ref={features.ref} className="py-24 sm:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="chip-brand mb-4">
              <Layers size={11} /> Platform Capabilities
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3" style={{ fontFamily: 'Sora' }}>Core Modules</h2>
            <p className="text-slate-500 text-[14px] font-semibold max-w-lg mx-auto">Fully unified candidate and recruiter interfaces built for speed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Building2, title: 'Multi-Tenant Workspaces', desc: 'Secure database isolation layer and roles mapping.' },
              { icon: ShieldCheck, title: 'Zero-Dependency ML', desc: 'Resume shortlisting indicators computed directly on the backend.' },
              { icon: Calendar, title: 'Automated Calendar Sync', desc: 'Book interview timeframes, auto-generate links, and score feedback.' },
              { icon: Globe, title: 'Unified Job Pipelines', desc: 'Track stages, filter applicants, and compare candidates.' },
              { icon: Briefcase, title: 'Interviewer Scorecards', desc: 'Custom rating benchmarks and AI summary tools.' },
              { icon: BarChart3, title: 'Conversion Metrics', desc: 'Real-time pipeline analysis dashboarding.' },
            ].map((f, i) => (
              <div key={i}
                className={`outer-bezel group hover:scale-[1.01] ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 80 + 100}ms` }}>
                <div className="inner-core p-6 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center mb-4 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-200 transition-spring">
                    <f.icon size={18} className="transition-transform group-hover:scale-105 group-hover:translate-x-[0.5px] group-hover:-translate-y-[0.5px]" />
                  </div>
                  <h3 className="text-[13px] font-black text-slate-900 mb-2" style={{ fontFamily: 'Sora' }}>{f.title}</h3>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section ref={workflow.ref} className="py-24 sm:py-32 bg-slate-50/40 border-y border-slate-200/40">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3" style={{ fontFamily: 'Sora' }}>Platform Flow</h2>
            <p className="text-slate-500 text-[14px] font-semibold">Four sequential blocks mapping candidates to placements.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Post Listings', desc: 'Create listings with custom JD signals.', icon: FileText },
              { step: '02', title: 'Process Resumes', desc: 'Algorithm ranks candidate match signal.', icon: Target },
              { step: '03', title: 'Simulate Rounds', desc: 'Conduct mock interviews and review output.', icon: Calendar },
              { step: '04', title: 'Complete Hires', desc: 'Finalize offers and inspect analytics.', icon: CheckCircle2 },
            ].map((s, i) => (
              <div key={i}
                className={`text-center group transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100 + 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center mx-auto mb-4 group-hover:border-violet-200/80 group-hover:shadow-md transition-spring shadow-sm/5">
                  <s.icon size={22} className="text-violet-600 transition-transform group-hover:scale-105 group-hover:translate-x-[0.5px] group-hover:-translate-y-[0.5px]" />
                </div>
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em]">{s.step}</span>
                <h3 className="text-[14px] font-bold text-slate-900 mt-1 mb-1" style={{ fontFamily: 'Sora' }}>{s.title}</h3>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed px-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <footer ref={cta.ref} className="bg-slate-950 py-24 sm:py-32 relative overflow-hidden mt-auto">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-violet-600/10 rounded-full blur-[250px] pointer-events-none" />
        <div className={`max-w-4xl mx-auto px-6 sm:px-8 text-center relative z-10 transition-all duration-1000 ${cta.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'Sora' }}>Ready to optimize recruiting?</h2>
          <p className="text-slate-400 text-[14px] font-medium mb-8 max-w-md mx-auto leading-relaxed">Isolate teams, configure custom ML signals, and track placement ratios seamlessly.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => handleLoginClick('internal')}
              className="btn-primary !px-8 !py-3.5 !text-[13px] cursor-pointer">
              Deploy Recruiter Workspace →
            </button>
            <button onClick={() => handleLoginClick('candidate')}
              className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-[13px] border border-white/10 transition-spring active:scale-[0.98] cursor-pointer">
              Candidate Workspace
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;
