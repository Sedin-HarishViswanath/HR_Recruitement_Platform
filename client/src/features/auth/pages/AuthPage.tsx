// Reading this as: B2B recruitment platform landing and authentication page for candidate and internal recruiters, with a clean and modern design language, leaning toward Tailwind v4 utility-driven layout + custom typography + motion-enhanced components.
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
      <div className="min-h-screen bg-[#fafbfc] flex overflow-hidden">
        {/* Left Panel */}
        <div className="hidden lg:flex w-[420px] bg-slate-50/50 p-10 flex-col gap-6 shrink-0 relative overflow-hidden border-r border-slate-200/60">
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm font-bold">
              <span className="text-[15px]">R</span>
            </div>
            <div>
              <h2 className="text-slate-900 text-[15px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>RecruitAI</h2>
              <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-semibold">Enterprise ATS</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 mt-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-200/60 shadow-[0_1px_2px_rgba(109,40,217,0.05)]">
              <Sparkles size={10} className="mr-1" /> v2.4 · AI co-pilot live
            </span>
            <h1 className="text-[32px] font-extrabold tracking-tight leading-[1.15] text-slate-900" style={{ fontFamily: 'Sora' }}>
              Welcome back.<br />Let's ship offers.
            </h1>
            <p className="text-[13px] text-slate-500 font-normal leading-relaxed">Your team made <strong className="text-slate-800">23 hires</strong> last quarter — 40% faster than your benchmark.</p>
          </div>

          {/* AI suggestions card with Double-Bezel Concentric Style */}
          <div className="relative z-10 bg-slate-100/60 p-1 rounded-[18px] border border-slate-200/40 shadow-sm/5 mt-2">
            <div className="bg-white rounded-[14px] p-4 border border-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100/50"><Sparkles size={12} /></div>
                <p className="text-[12px] font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>AI suggested 3 candidates</p>
              </div>
              {[
                { name: 'Maria S.', role: 'Sr. Designer', score: '94 %', color: 'from-rose-500 to-pink-500' },
                { name: 'James K.', role: 'Backend Eng', score: '91 %', color: 'from-blue-500 to-cyan-500' },
                { name: 'Priya R.', role: 'Product Manager', score: '88 %', color: 'from-violet-500 to-purple-500' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-[9px] font-semibold shadow-sm`}>
                      {c.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <span className="text-[12px] text-slate-600 font-medium">{c.name} — {c.role}</span>
                  </div>
                  <span className="text-[12px] font-bold text-emerald-600">{c.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row with refined details */}
          <div className="flex gap-3 mt-auto relative z-10">
            {[
              { val: '500+', label: 'TEAMS' },
              { val: '50k', label: 'HIRES' },
              { val: '4.9★', label: 'G2' },
            ].map((s, i) => (
              <div key={i} className="flex-1 bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm/5">
                <p className="text-[16px] font-extrabold text-slate-900" style={{ fontFamily: 'Sora' }}>{s.val}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 font-normal mt-2">© 2026 RecruitAI · SOC 2 Type II Certified</p>
        </div>

        {/* Right - Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-white relative">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-[12px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-spring active:scale-[0.98]">← Back</button>
          <div className="w-full max-w-[380px] animate-fade-in-up">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-5 lg:hidden">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold"><span className="text-[14px]">R</span></div>
                <h2 className="text-slate-900 text-[16px] font-extrabold" style={{ fontFamily: 'Sora' }}>RecruitAI</h2>
              </div>
              <h3 className="text-[22px] font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Sora' }}>
                Sign in to your account
              </h3>
              <p className="text-[13px] text-slate-500 font-normal mt-1">
                New here? <button onClick={() => navigate('/register')} className="text-violet-600 hover:text-violet-700 font-semibold">Create an account →</button>
              </p>
              <div className="flex bg-slate-100 p-1 rounded-full mt-5">
                {['internal', 'candidate'].map(r => (
                  <button key={r} onClick={() => setAuthRole(r as any)}
                    className={`flex-1 py-2 rounded-full text-[12px] font-semibold transition-spring active:scale-[0.98] ${authRole === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
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
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 overflow-x-hidden flex flex-col font-sans">
      {/* ── Navbar ── */}
      <nav className="w-full bg-white px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-sm font-bold">
            <span className="text-[12px]">R</span>
          </div>
          <div>
            <h1 className="text-slate-900 text-[14px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>RecruitAI</h1>
            <p className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-semibold hidden sm:block">Enterprise ATS</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => handleLoginClick('candidate')} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-[13px] font-medium transition-spring active:scale-[0.98]">Sign in</button>
          <button onClick={() => handleLoginClick('internal')} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium shadow-sm transition-spring active:scale-[0.98]">Get started →</button>
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
      <section ref={hero.ref} className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-400 rounded-full blur-[300px] opacity-[0.05]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-400 rounded-full blur-[200px] opacity-[0.03]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center relative z-10">
          <div className={`space-y-6 max-w-3xl mx-auto transition-all duration-1000 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold border border-violet-200/60 shadow-[0_1px_2px_rgba(109,40,217,0.05)]">
              <Sparkles size={11} className="animate-float" /> New · AI-powered shortlisting v2 →
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.1] text-slate-900" style={{ fontFamily: 'Sora' }}>
              Hire faster, with<br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-gradient">data on your side.</span>
            </h2>

            <p className="text-[16px] text-slate-500 leading-relaxed font-normal max-w-xl mx-auto">
              An enterprise ATS that combines AI resume scoring, multi-tenant teams,
              and real-time analytics — so you ship offers in days, not weeks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button onClick={() => handleLoginClick('internal')}
                className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[14px] shadow-sm flex items-center gap-2 active:scale-[0.98] transition-spring">
                Start free trial <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/candidate/jobs')}
                className="px-6 py-3 rounded-lg bg-white text-slate-700 font-semibold text-[14px] border border-slate-200 hover:border-slate-350 hover:bg-slate-50 flex items-center gap-2 active:scale-[0.98] transition-spring">
                Browse Jobs
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-400 font-medium">
              {['Free 14-day trial', 'No credit card', 'SOC 2 Type II'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className={`mt-14 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="outer-bezel">
              <div className="inner-core bg-[#fafbfc] p-4 rounded-[18px]">
                <div className="flex items-center gap-1.5 px-2 pb-3 border-b border-slate-100 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-auto text-[10px] text-slate-400 font-medium">app.recruitai.com/company/dashboard</span>
                </div>
                <div className="flex gap-4 text-left">
                  {/* Mini sidebar */}
                  <div className="w-32 shrink-0 hidden sm:block border-r border-slate-100 pr-2">
                    {['Dashboard', 'Applications', 'Jobs', 'Interviews', 'Feedback'].map((item, i) => (
                      <div key={i} className={`text-[10px] font-semibold py-1.5 px-2.5 rounded-md mb-0.5 ${i === 0 ? 'bg-violet-50 text-violet-700' : 'text-slate-400'}`}>{item}</div>
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
                        <div key={i} className="bg-white rounded-lg border border-slate-100 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                          <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <p className="text-[18px] font-extrabold text-slate-900" style={{ fontFamily: 'Sora' }}>{s.val}</p>
                            <span className={`text-[9px] font-bold ${s.color}`}>{s.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-slate-700" style={{ fontFamily: 'Sora' }}>Pipeline this week</p>
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">Live</span>
                      </div>
                      <div className="flex items-end gap-2 h-16">
                        {[24, 38, 42, 31, 52, 18, 28].map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full rounded-sm ${i === 1 ? 'bg-violet-500' : 'bg-slate-200'}`} style={{ height: `${(v / 52) * 48}px` }} />
                            <span className="text-[7px] text-slate-400 font-semibold">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
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
      <section ref={stats.ref} className="py-12 sm:py-14 bg-slate-50/30 border-y border-slate-100/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 relative z-10">
          <p className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-[0.2em] text-center mb-7">TRUSTED BY 500+ TEAMS · FROM SCALE-UPS TO FORTUNE 500</p>
          <div className={`flex flex-wrap justify-center items-center gap-x-12 gap-y-6 transition-all duration-700 ${stats.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { name: 'Stripe', slug: 'stripe' },
              { name: 'Notion', slug: 'notion' },
              { name: 'Linear', slug: 'linear' },
              { name: 'Vercel', slug: 'vercel' },
              { name: 'Figma', slug: 'figma' },
              { name: 'Ramp', slug: 'ramp' }
            ].map((logo, i) => (
              <img
                key={i}
                src={`https://cdn.simpleicons.org/${logo.slug}/64748b`}
                alt={logo.name}
                className="h-5 sm:h-5.5 opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-default object-contain dark:brightness-125"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section ref={features.ref} className="py-24 sm:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-200/60 mb-4 shadow-[0_1px_2px_rgba(109,40,217,0.05)]">
              <Layers size={11} className="mr-1.5" /> Platform
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3" style={{ fontFamily: 'Sora' }}>One platform, every step</h2>
            <p className="text-slate-500 text-[14px] font-normal max-w-lg mx-auto">From posting to onboarding — six modules that work as one.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Building2, title: 'Multi-tenant', desc: 'Isolate workspaces with RBAC and SSO.' },
              { icon: ShieldCheck, title: 'AI Shortlisting', desc: 'ML ranks candidates by JD fit + signal.' },
              { icon: Calendar, title: 'Auto-scheduling', desc: 'Calendar sync, video links, reminders.' },
              { icon: Globe, title: 'Pipeline View', desc: 'End-to-end application tracking with stages.' },
              { icon: Briefcase, title: 'Smart Jobs', desc: 'AI-optimized job descriptions and matching.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards with conversion rates.' },
            ].map((f, i) => (
              <div key={i}
                className={`bg-slate-50/70 p-1 rounded-[20px] border border-slate-200/40 group hover:border-violet-200/60 hover:shadow-md transition-spring ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 80 + 100}ms` }}>
                <div className="bg-white p-5 rounded-[16px] border border-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center mb-4 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-200 transition-spring">
                    <f.icon size={18} className="transition-transform group-hover:scale-105 group-hover:translate-x-[0.5px] group-hover:-translate-y-[0.5px]" />
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-900 mb-1.5" style={{ fontFamily: 'Sora' }}>{f.title}</h3>
                  <p className="text-[13px] text-slate-500 font-normal leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section ref={workflow.ref} className="py-24 sm:py-32 bg-[#fafbfc] border-y border-slate-100/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3" style={{ fontFamily: 'Sora' }}>How it works</h2>
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
                style={{ transitionDelay: `${i * 100 + 100}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center mx-auto mb-4 group-hover:border-violet-200/80 group-hover:shadow-md transition-spring shadow-sm/5">
                  <s.icon size={22} className="text-violet-600 transition-transform group-hover:scale-105 group-hover:translate-x-[0.5px] group-hover:-translate-y-[0.5px]" />
                </div>
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em]">{s.step}</span>
                <h3 className="text-[14px] font-bold text-slate-900 mt-1 mb-1" style={{ fontFamily: 'Sora' }}>{s.title}</h3>
                <p className="text-[12px] text-slate-500 font-normal leading-relaxed px-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <footer ref={cta.ref} className="bg-slate-950 py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-violet-600 rounded-full blur-[250px] opacity-[0.08]" />
        <div className={`max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10 transition-all duration-1000 ${cta.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'Sora' }}>Ready to transform your hiring?</h2>
          <p className="text-slate-400 text-[14px] font-normal mb-8 max-w-md mx-auto leading-relaxed">Join hundreds of companies using RecruitAI to find, evaluate, and hire top talent faster.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => handleLoginClick('internal')}
              className="px-8 py-3.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[14px] shadow-lg shadow-violet-700/10 transition-spring active:scale-[0.98] cursor-pointer">
              Get started free →
            </button>
            <button onClick={() => handleLoginClick('candidate')}
              className="px-8 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-[14px] border border-white/10 transition-spring active:scale-[0.98] cursor-pointer">
              Candidate Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
