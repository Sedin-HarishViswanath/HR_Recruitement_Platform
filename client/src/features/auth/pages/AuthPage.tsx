import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import {
  ShieldCheck, Building2, Briefcase, UserCheck, Calendar, BarChart3,
  BriefcaseBusiness, FileText, Sparkles, Zap, Globe, Menu, X,
  ArrowRight, CheckCircle2, Layers, Target, TrendingUp,
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

/* ── Animated counter ── */
const Counter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = Date.now();
        const step = () => {
          const p = Math.min((Date.now() - start) / 1200, 1);
          setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
};

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthView = location.pathname === '/login';
  const [authRole, setAuthRole] = useState<'internal' | 'candidate'>('internal');

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
      <div className="min-h-screen bg-[#f4f5f7] flex overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Left Panel */}
        <div className="hidden lg:flex w-[400px] bg-[#0b0f1a] p-8 flex-col gap-5 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 grain" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-amber-500 rounded-full blur-[160px] opacity-[0.07]" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-500 rounded-full blur-[120px] opacity-[0.05]" />

          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 animate-pulse-glow">
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <h2 className="text-white text-[15px] font-bold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>RecruitAI</h2>
              <p className="text-[9px] text-amber-500/70 mt-0.5 uppercase tracking-[0.15em] font-semibold">Enterprise ATS Platform</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10 animate-slide-in-left" style={{ animationDelay: '200ms' }}>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
              <Sparkles size={10} className="mr-1" /> AI-Powered
            </span>
            <h1 className="text-[26px] font-bold tracking-tight leading-tight text-white" style={{ fontFamily: 'Sora' }}>
              Recruiting AI for<br /><span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">companies & teams</span>
            </h1>
            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">Multi-tenant ATS with RBAC, AI shortlisting, interview scheduling, and real-time analytics.</p>
          </div>

          <div className="space-y-1.5 flex-1 relative z-10 list-slide-in">
            {[
              { icon: ShieldCheck, title: 'RBAC + Tenant Isolation' },
              { icon: Building2, title: 'Multi-tenant Companies' },
              { icon: Briefcase, title: 'Smart Job Pipelines' },
              { icon: UserCheck, title: 'AI Resume Scoring' },
              { icon: Calendar, title: 'Interview Scheduling' },
              { icon: BarChart3, title: 'Real-time Analytics' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] group hover:bg-white/[0.07] transition-all duration-300 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  <f.icon size={14} />
                </div>
                <span className="text-white/80 text-[12px] font-medium group-hover:text-white transition-colors">{f.title}</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
            <p className="text-[11px] text-slate-400 italic leading-relaxed">"RecruitAI cut our time-to-hire by 40%. The AI scoring is a game-changer."</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-2">— Sarah Chen, VP People @ TechCorp</p>
          </div>
        </div>

        {/* Right - Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-[#f4f5f7] relative">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-[12px] font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors">← Back</button>
          <div className="w-full max-w-[380px] animate-fade-in-up">
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white"><BriefcaseBusiness size={15} /></div>
                <h2 className="text-slate-900 text-[16px] font-bold" style={{ fontFamily: 'Sora' }}>RecruitAI</h2>
              </div>
              <h3 className="text-[24px] font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Sora' }}>
                {authRole === 'internal' ? 'Welcome back' : 'Find your next role'}
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">{authRole === 'internal' ? 'Sign in to your dashboard' : 'Access your candidate portal'}</p>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mt-4">
                {['internal', 'candidate'].map(r => (
                  <button key={r} onClick={() => setAuthRole(r as any)}
                    className={`py-2 rounded-lg text-[12px] font-semibold transition-all duration-300 ${authRole === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {r === 'internal' ? 'Internal' : 'Candidate'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-premium p-6"><LoginForm role={authRole} onToggleMode={() => navigate('/register')} /></div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ LANDING PAGE ═══ */
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Navbar ── */}
      <nav className="w-full bg-[#0b0f1a]/95 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <BriefcaseBusiness size={14} />
          </div>
          <div>
            <h1 className="text-white text-[14px] font-bold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>RecruitAI</h1>
            <p className="text-[8px] text-amber-500/60 mt-0.5 uppercase tracking-[0.15em] font-semibold hidden sm:block">Enterprise Hiring Platform</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => handleLoginClick('candidate')} className="px-4 py-2 rounded-lg text-white/60 hover:text-white text-[12px] font-medium transition-colors">Candidate Login</button>
          <button onClick={() => handleLoginClick('internal')} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold transition-all shadow-sm btn-premium">Get Started</button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-white p-1">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </nav>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0b0f1a] border-t border-white/[0.06] px-4 py-3 space-y-2 animate-fade-in">
          <button onClick={() => { handleLoginClick('candidate'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-white/70 hover:text-white text-[13px] font-medium rounded-lg hover:bg-white/5 transition-colors">Candidate Login</button>
          <button onClick={() => { handleLoginClick('internal'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 bg-amber-500 text-white text-[13px] font-bold rounded-lg">Get Started</button>
        </div>
      )}

      {/* ── Hero ── */}
      <section ref={hero.ref} className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-400 rounded-full blur-[300px] opacity-[0.06]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-400 rounded-full blur-[250px] opacity-[0.04]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-24 flex flex-col lg:flex-row gap-12 items-center relative z-10">
          <div className={`flex-1 space-y-6 max-w-2xl transition-all duration-1000 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200">
              <Sparkles size={11} className="animate-float" /> AI-Powered Recruitment
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold tracking-tight leading-[1.08] text-slate-900" style={{ fontFamily: 'Sora' }}>
              Hire smarter with<br />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent animate-gradient">AI-powered recruiting</span>
            </h2>

            <p className="text-[15px] text-slate-500 leading-relaxed font-medium max-w-lg">
              Enterprise-grade ATS with multi-tenant isolation, AI resume scoring, automated interview scheduling, and real-time hiring analytics.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button onClick={() => handleLoginClick('internal')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[14px] transition-all shadow-lg shadow-amber-500/25 btn-premium flex items-center justify-center gap-2">
                Start Free Trial <ArrowRight size={16} />
              </button>
              <button onClick={() => handleLoginClick('candidate')}
                className="px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-[14px] border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-center gap-2">
                Browse Jobs
              </button>
            </div>

            <div className="flex items-center gap-4 pt-2 text-[12px] text-slate-400 font-medium">
              {['No credit card required', 'Free 14-day trial', 'Cancel anytime'].map((t, i) => (
                <span key={i} className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> {t}</span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className={`w-full lg:w-[420px] shrink-0 hidden md:block transition-all duration-1000 delay-300 ${hero.vis ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 via-transparent to-violet-400/20 rounded-3xl blur-2xl" />
              <div className="card-premium p-6 relative">
                <div className="bg-[#0b0f1a] rounded-xl p-4 text-white mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center"><Zap size={14} /></div>
                    <div>
                      <h4 className="font-bold text-white text-[12px]">Live Pipeline</h4>
                      <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">Real-time data</p>
                    </div>
                  </div>
                </div>

                {[
                  { icon: FileText, title: 'Apply', val: '2,847', color: 'text-blue-600 bg-blue-50' },
                  { icon: Target, title: 'AI Score', val: '94%', color: 'text-amber-600 bg-amber-50' },
                  { icon: Calendar, title: 'Interview', val: '312', color: 'text-violet-600 bg-violet-50' },
                  { icon: TrendingUp, title: 'Hired', val: '156', color: 'text-emerald-600 bg-emerald-50' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${m.color} flex items-center justify-center icon-bounce`}><m.icon size={15} /></div>
                      <span className="font-semibold text-slate-800 text-[13px]">{m.title}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-[14px]" style={{ fontFamily: 'Sora' }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Stats ── */}
      <section ref={stats.ref} className="bg-[#0b0f1a] py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 grain" />
        <div className="max-w-5xl mx-auto px-4 sm:px-8 relative z-10">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 text-center transition-all duration-700 ${stats.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { val: 500, suffix: '+', label: 'Companies' },
              { val: 50, suffix: 'K+', label: 'Candidates' },
              { val: 98, suffix: '%', label: 'Uptime SLA' },
              { val: 40, suffix: '%', label: 'Faster Hiring' },
            ].map((s, i) => (
              <div key={i} className="space-y-1" style={{ transitionDelay: `${i * 100}ms` }}>
                <p className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: 'Sora' }}>
                  {stats.vis ? <Counter target={s.val} suffix={s.suffix} /> : `0${s.suffix}`}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section ref={features.ref} className="py-16 sm:py-24 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className={`text-center mb-12 transition-all duration-700 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200 mb-4">
              <Layers size={11} className="mr-1.5" /> Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Sora' }}>Everything you need to hire</h2>
            <p className="text-slate-500 text-[14px] font-medium max-w-lg mx-auto">Six powerful modules that work together seamlessly under one platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Building2, title: 'Companies', desc: 'Multi-tenant workspace with team management and verification.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Briefcase, title: 'Smart Jobs', desc: 'AI-enhanced job board with smart filters and candidate matching.', gradient: 'from-amber-500 to-orange-500' },
              { icon: ShieldCheck, title: 'AI Shortlisting', desc: 'Automated resume parsing with ML-powered candidate ranking.', gradient: 'from-violet-500 to-purple-500' },
              { icon: Globe, title: 'Pipeline View', desc: 'End-to-end application tracking with drag-and-drop stages.', gradient: 'from-emerald-500 to-teal-500' },
              { icon: Calendar, title: 'Interviews', desc: 'Automated scheduling with calendar sync and video integration.', gradient: 'from-rose-500 to-pink-500' },
              { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards with hiring metrics and conversion rates.', gradient: 'from-sky-500 to-blue-500' },
            ].map((f, i) => (
              <div key={i}
                className={`card-premium p-6 group transition-all duration-700 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100 + 200}ms` }}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 text-white shadow-lg icon-bounce`}>
                  <f.icon size={20} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">{f.title}</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section ref={workflow.ref} className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className={`text-center mb-14 transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Sora' }}>How it works</h2>
            <p className="text-slate-500 text-[14px] font-medium">From job posting to hiring — in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Post Jobs', desc: 'Create job listings with AI-optimized descriptions.', icon: FileText },
              { step: '02', title: 'AI Screens', desc: 'ML algorithms rank and shortlist candidates.', icon: Target },
              { step: '03', title: 'Interview', desc: 'Auto-schedule with calendar and video links.', icon: Calendar },
              { step: '04', title: 'Hire', desc: 'Make data-driven decisions with analytics.', icon: CheckCircle2 },
            ].map((s, i) => (
              <div key={i}
                className={`text-center group transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 150 + 200}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-500/10 transition-all duration-300">
                  <s.icon size={24} className="text-amber-600" />
                </div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{s.step}</span>
                <h3 className="text-[15px] font-bold text-slate-900 mt-1 mb-1">{s.title}</h3>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <footer ref={cta.ref} className="bg-[#0b0f1a] py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[250px] opacity-[0.08]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-500 rounded-full blur-[200px] opacity-[0.05]" />
        <div className={`max-w-4xl mx-auto px-4 sm:px-8 text-center relative z-10 transition-all duration-1000 ${cta.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Sora' }}>Ready to transform your hiring?</h2>
          <p className="text-slate-400 text-[14px] font-medium mb-8 max-w-md mx-auto">Join hundreds of companies using RecruitAI to find, evaluate, and hire top talent faster.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => handleLoginClick('internal')}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[14px] transition-all shadow-lg shadow-amber-500/20 btn-premium">
              Get Started Free
            </button>
            <button onClick={() => handleLoginClick('candidate')}
              className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[14px] border border-white/10 transition-all">
              Candidate Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
