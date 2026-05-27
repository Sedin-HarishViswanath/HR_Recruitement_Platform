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
      if (userRole === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else if (userRole === 'super admin' || userRole === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        // Company admin or other roles
        if (user.companyStatus?.toLowerCase() === 'pending' || user.companyStatus?.toLowerCase() === 'revoked') {
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
      <div className="min-h-screen bg-white flex overflow-hidden">
        {/* Left Panel */}
        <div className="hidden lg:flex w-[420px] bg-[#fafbfc] p-10 flex-col gap-6 shrink-0 relative overflow-hidden border-r border-slate-200">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm">
              <span className="text-[15px] font-bold">R</span>
            </div>
            <div>
              <h2 className="text-slate-900 text-[15px] font-bold tracking-tight leading-none">RecruitAI</h2>
              <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-semibold">Enterprise ATS</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 mt-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-200">
              <Sparkles size={10} className="mr-1" /> v2.4 · AI co-pilot live
            </span>
            <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] text-slate-900">
              Welcome back.<br />Let's ship offers.
            </h1>
            <p className="text-[13px] text-slate-500 font-normal leading-relaxed">Your team made <strong className="text-slate-800">23 hires</strong> last quarter — 40% faster than your benchmark.</p>
          </div>

          {/* AI suggestions card */}
          <div className="relative z-10 bg-white rounded-xl p-4 border border-slate-200 shadow-sm mt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Sparkles size={12} /></div>
              <p className="text-[12px] font-semibold text-slate-800">AI suggested 3 candidates</p>
            </div>
            {[
              { name: 'Maria S.', role: 'Sr. Designer', score: '94 %', color: 'from-rose-500 to-pink-500' },
              { name: 'James K.', role: 'Backend Eng', score: '91 %', color: 'from-blue-500 to-cyan-500' },
              { name: 'Priya R.', role: 'Product Manager', score: '88 %', color: 'from-violet-500 to-purple-500' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-[9px] font-semibold`}>
                    {c.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <span className="text-[12px] text-slate-600 font-medium">{c.name} — {c.role}</span>
                </div>
                <span className="text-[12px] font-semibold text-emerald-600">{c.score}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-auto relative z-10">
            {[
              { val: '500+', label: 'TEAMS' },
              { val: '50k', label: 'HIRES' },
              { val: '4.9★', label: 'G2' },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-white rounded-lg border border-slate-200 p-3">
                <p className="text-[16px] font-bold text-slate-900">{s.val}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 font-normal mt-2">© 2026 RecruitAI · SOC 2 Type II Certified</p>
        </div>

        {/* Right - Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-white relative">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-[12px] font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors">← Back</button>
          <div className="w-full max-w-[380px] animate-fade-in-up">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-5 lg:hidden">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white"><span className="text-[14px] font-bold">R</span></div>
                <h2 className="text-slate-900 text-[16px] font-bold">RecruitAI</h2>
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h3>
              <p className="text-[13px] text-slate-500 font-normal mt-1">
                New here? <button onClick={() => navigate('/register')} className="text-violet-600 hover:text-violet-700 font-medium">Create an account →</button>
              </p>
              <div className="flex bg-slate-100 p-1 rounded-full mt-5">
                {['internal', 'candidate'].map(r => (
                  <button key={r} onClick={() => setAuthRole(r as any)}
                    className={`flex-1 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${authRole === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {r === 'internal' ? 'Internal team' : 'Candidate'}
                  </button>
                ))}
              </div>
            </div>
            <LoginForm role={authRole} onToggleMode={() => navigate('/register')} />
          </div>
        </div>
      </div>
    );
  }

  /* ═══ LANDING PAGE ═══ */
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden flex flex-col">
      {/* ── Navbar ── */}
      <nav className="w-full bg-white px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-sm">
            <span className="text-[12px] font-bold">R</span>
          </div>
          <div>
            <h1 className="text-slate-900 text-[14px] font-bold tracking-tight leading-none">RecruitAI</h1>
            <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-semibold hidden sm:block">Enterprise ATS</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => handleLoginClick('candidate')} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-[13px] font-medium transition-colors">Sign in</button>
          <button onClick={() => handleLoginClick('internal')} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium transition-all shadow-sm">Get started →</button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-slate-600 p-1">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </nav>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-100 px-4 py-3 space-y-2 animate-fade-in">
          <button onClick={() => { handleLoginClick('candidate'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-slate-600 hover:text-slate-900 text-[13px] font-medium rounded-lg hover:bg-slate-50 transition-colors">Sign in</button>
          <button onClick={() => { handleLoginClick('internal'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 bg-violet-600 text-white text-[13px] font-medium rounded-lg">Get started →</button>
        </div>
      )}

      {/* ── Hero ── */}
      <section ref={hero.ref} className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-400 rounded-full blur-[300px] opacity-[0.06]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-400 rounded-full blur-[200px] opacity-[0.04]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-28 text-center relative z-10">
          <div className={`space-y-6 max-w-3xl mx-auto transition-all duration-1000 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-medium border border-violet-200">
              <Sparkles size={11} className="animate-float" /> New · AI-powered shortlisting v2 →
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.1] text-slate-900">
              Hire faster, with<br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-gradient">data on your side.</span>
            </h2>

            <p className="text-[16px] text-slate-500 leading-relaxed font-normal max-w-xl mx-auto">
              An enterprise ATS that combines AI resume scoring, multi-tenant teams,<br className="hidden sm:block" />
              and real-time analytics — so you ship offers in days, not weeks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button onClick={() => handleLoginClick('internal')}
                className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-[14px] transition-all shadow-sm flex items-center gap-2">
                Start free trial <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/candidate/jobs')}
                className="px-6 py-3 rounded-lg bg-white text-slate-700 font-medium text-[14px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2">
                Browse Jobs
              </button>
            </div>

            <div className="flex items-center justify-center gap-5 pt-2 text-[12px] text-slate-400 font-normal">
              {['Free 14-day trial', 'No credit card', 'SOC 2 Type II'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className={`mt-14 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-1">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-auto text-[10px] text-slate-400 font-normal">app.recruitai.com/company/dashboard</span>
              </div>
              <div className="bg-[#fafbfc] rounded-lg p-4">
                <div className="flex gap-4">
                  {/* Mini sidebar */}
                  <div className="w-32 shrink-0 hidden sm:block">
                    {['Dashboard', 'Applications', 'Jobs', 'Interviews', 'Feedback'].map((item, i) => (
                      <div key={i} className={`text-[10px] font-medium py-1.5 px-2.5 rounded-md mb-0.5 ${i === 0 ? 'bg-violet-50 text-violet-700' : 'text-slate-400'}`}>{item}</div>
                    ))}
                  </div>
                  {/* Mini dashboard */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'APPLICATIONS', val: '2,847', trend: '+12%', color: 'text-emerald-600' },
                        { label: 'INTERVIEWS', val: '312', trend: '+5%', color: 'text-emerald-600' },
                        { label: 'HIRED', val: '156', trend: '+18%', color: 'text-emerald-600' },
                      ].map((s, i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-100 p-3">
                          <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <p className="text-[18px] font-bold text-slate-900">{s.val}</p>
                            <span className={`text-[9px] font-semibold ${s.color}`}>{s.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-slate-700">Pipeline this week</p>
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">Live</span>
                      </div>
                      <div className="flex items-end gap-2 h-16">
                        {[24, 38, 42, 31, 52, 18, 28].map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full rounded-sm ${i === 1 ? 'bg-violet-500' : 'bg-slate-200'}`} style={{ height: `${(v / 52) * 48}px` }} />
                            <span className="text-[7px] text-slate-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
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
      <section ref={stats.ref} className="py-12 sm:py-14 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 relative z-10">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.15em] text-center mb-6">TRUSTED BY 500+ TEAMS · FROM SCALE-UPS TO FORTUNE 500</p>
          <div className={`flex justify-center items-center gap-8 sm:gap-12 text-slate-300 transition-all duration-700 ${stats.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {['Stripe', 'Notion', 'Linear', 'Vercel', 'Figma', 'Ramp'].map((name, i) => (
              <span key={i} className="text-[16px] sm:text-[18px] font-bold text-slate-300 hover:text-slate-500 transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section ref={features.ref} className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className={`text-center mb-12 transition-all duration-700 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-medium border border-violet-200 mb-4">
              <Layers size={11} className="mr-1.5" /> Platform
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">One platform, every step</h2>
            <p className="text-slate-500 text-[14px] font-normal max-w-lg mx-auto">From posting to onboarding — six modules that work as one.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Building2, title: 'Multi-tenant', desc: 'Isolate workspaces with RBAC and SSO.' },
              { icon: ShieldCheck, title: 'AI Shortlisting', desc: 'ML ranks candidates by JD fit + signal.' },
              { icon: Calendar, title: 'Auto-scheduling', desc: 'Calendar sync, video links, reminders.' },
              { icon: Globe, title: 'Pipeline View', desc: 'End-to-end application tracking with stages.' },
              { icon: Briefcase, title: 'Smart Jobs', desc: 'AI-optimized job descriptions and matching.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards with conversion rates.' },
            ].map((f, i) => (
              <div key={i}
                className={`bg-white rounded-xl border border-slate-200 p-6 group transition-all duration-700 hover:shadow-md hover:border-violet-200 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 80 + 200}ms` }}>
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-200 transition-all">
                  <f.icon size={18} />
                </div>
                <h3 className="text-[14px] font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-slate-500 font-normal leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section ref={workflow.ref} className="py-16 sm:py-24 bg-[#fafbfc] border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className={`text-center mb-14 transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">How it works</h2>
            <p className="text-slate-500 text-[14px] font-normal">From job posting to hiring — in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Post Jobs', desc: 'Create listings with AI-optimized descriptions.', icon: FileText },
              { step: '02', title: 'AI Screens', desc: 'ML algorithms rank and shortlist candidates.', icon: Target },
              { step: '03', title: 'Interview', desc: 'Auto-schedule with calendar and video links.', icon: Calendar },
              { step: '04', title: 'Hire', desc: 'Make data-driven decisions with analytics.', icon: CheckCircle2 },
            ].map((s, i) => (
              <div key={i}
                className={`text-center group transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100 + 200}ms` }}>
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 group-hover:border-violet-200 group-hover:shadow-sm transition-all">
                  <s.icon size={22} className="text-violet-600" />
                </div>
                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-widest">{s.step}</span>
                <h3 className="text-[14px] font-semibold text-slate-900 mt-1 mb-1">{s.title}</h3>
                <p className="text-[12px] text-slate-500 font-normal leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <footer ref={cta.ref} className="bg-slate-900 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-violet-500 rounded-full blur-[250px] opacity-[0.1]" />
        <div className={`max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10 transition-all duration-1000 ${cta.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Ready to transform your hiring?</h2>
          <p className="text-slate-400 text-[14px] font-normal mb-8 max-w-md mx-auto">Join hundreds of companies using RecruitAI to find, evaluate, and hire top talent faster.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => handleLoginClick('internal')}
              className="px-8 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-[14px] transition-all shadow-sm">
              Get started free →
            </button>
            <button onClick={() => handleLoginClick('candidate')}
              className="px-8 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-[14px] border border-white/10 transition-all">
              Candidate Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
