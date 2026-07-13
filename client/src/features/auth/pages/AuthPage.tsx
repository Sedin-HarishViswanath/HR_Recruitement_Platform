import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { LoginForm } from '../components/LoginForm';
import {
  ShieldCheck, Building2, Calendar, BarChart3,
  Sparkles, Menu, X, ArrowRight, CheckCircle2, Target, Code2,
} from 'lucide-react';

const SERIF = "'Plus Jakarta Sans', Inter, sans-serif";

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

const FIT_CANDIDATES = [
  { name: 'Sarah Jenkins', role: 'Staff Product Engineer', score: 96, bg: '#3B6E8F' },
  { name: 'David Mercer', role: 'DevOps Architect', score: 91, bg: '#5C6B4A' },
  { name: 'Elena Rostova', role: 'Platform Engineer', score: 88, bg: '#2E5A46' },
  { name: 'Tomás Okafor', role: 'Senior SRE', score: 84, bg: '#A07C3B' },
];

const initials = (n: string) => n.split(' ').map(w => w[0]).join('');

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = (user.role || '').toLowerCase().trim();
      const onboardingCompleted = user.onboardingCompleted;

      if (userRole === 'candidate') {
        navigate(onboardingCompleted === false ? '/candidate/onboarding' : '/candidate/dashboard', { replace: true });
      } else if (userRole === 'super admin' || userRole === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
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

  const hero = useReveal();
  const features = useReveal();
  const workflow = useReveal();
  const cta = useReveal();

  /* ═══ LOGIN VIEW ═══ */
  if (isAuthView) {
    return (
      <div className="min-h-screen bg-background flex overflow-hidden">
        {/* Left — warm espresso editorial panel */}
        <div className="hidden lg:flex w-[480px] p-12 flex-col justify-between shrink-0 relative overflow-hidden"
          style={{ background: 'radial-gradient(110% 60% at 0% 0%, rgba(63,126,92,0.20) 0%, transparent 58%), linear-gradient(180deg, #1f1b15 0%, #14110c 100%)' }}>
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-700/10 blur-[120px] pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-[#f4f1e8] shadow-md" style={{ fontFamily: SERIF, fontSize: 22 }}>R</div>
            <div>
              <h2 className="text-[#f4f1e8] text-[19px] leading-none" style={{ fontFamily: SERIF }}>RecruitAI</h2>
              <p className="text-[9px] text-stone-400 mt-1 uppercase tracking-[0.2em] font-mono">Applicant Tracking</p>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400/90 mb-4">Access workspace</p>
            <h1 className="text-[38px] leading-[1.05] text-[#f4f1e8]" style={{ fontFamily: SERIF }}>
              Hire on evidence,<br />not on <em className="text-emerald-400" style={{ fontStyle: 'italic' }}>hunches.</em>
            </h1>
            <p className="text-[13.5px] text-stone-300/80 leading-relaxed mt-5 max-w-sm">
              Sign in to review candidate scorecards, check fit signals, and run live interview rooms.
            </p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-[12px] text-stone-200" style={{ fontFamily: SERIF }}>Fit Score · Backend Engineer</span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Model live
              </span>
            </div>
            {FIT_CANDIDATES.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: c.bg }}>{initials(c.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-stone-100 font-semibold leading-none">{c.name}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{c.role}</p>
                </div>
                <span className="text-[13px] font-mono font-semibold text-emerald-400 tabular-nums">{c.score}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[9px] text-stone-500 font-mono uppercase tracking-wider relative z-10">
            <span>© 2026 RecruitAI Inc.</span>
            <span>SOC 2 Aligned</span>
          </div>
        </div>

        {/* Right — login form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer">
            ← Back to overview
          </button>
          <div className="w-full max-w-[370px] animate-fade-in-up">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground" style={{ fontFamily: SERIF, fontSize: 18 }}>R</div>
                <h2 className="text-foreground text-[18px]" style={{ fontFamily: SERIF }}>RecruitAI</h2>
              </div>
              <h3 className="text-[30px] leading-tight text-foreground" style={{ fontFamily: SERIF }}>
                Welcome back
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1.5">
                New here? <button onClick={() => navigate('/register')} className="text-primary hover:underline font-semibold">Create an account →</button>
              </p>
              <div className="flex bg-secondary border border-border p-0.5 rounded-[10px] mt-5 gap-0.5">
                {(['internal', 'candidate'] as const).map(r => (
                  <button key={r} onClick={() => setAuthRole(r)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${authRole === r ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                    {r === 'internal' ? 'Recruiter Team' : 'Candidate'}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel p-6">
              <LoginForm role={authRole} onToggleMode={() => navigate('/register')} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ LANDING PAGE ═══ */
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {/* ── Navbar ── */}
      <nav className="w-full topbar-frost px-6 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground" style={{ fontFamily: SERIF, fontSize: 20 }}>R</div>
          <div>
            <h1 className="text-foreground text-[19px] leading-none" style={{ fontFamily: SERIF }}>RecruitAI</h1>
            <p className="text-[8px] text-muted-foreground mt-0.5 uppercase tracking-[0.16em] font-mono hidden sm:block">Applicant Tracking</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => handleLoginClick('candidate')} className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-[13px] font-semibold transition-colors">Sign in</button>
          <button onClick={() => handleLoginClick('internal')} className="btn-primary">Request access</button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-foreground p-1">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </nav>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-card border-b border-border px-4 py-3 space-y-2 animate-fade-in shadow-sm">
          <button onClick={() => { handleLoginClick('candidate'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-foreground text-[13px] font-semibold rounded-lg hover:bg-secondary transition-colors">Sign in</button>
          <button onClick={() => { handleLoginClick('internal'); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg">Request access</button>
        </div>
      )}

      {/* ── Hero (asymmetric editorial) ── */}
      <section ref={hero.ref} className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full blur-[300px] opacity-[0.08] pointer-events-none" style={{ background: '#2e5a46' }} />
        <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">
          <div className={`grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center transition-all duration-1000 ${hero.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Left column */}
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2.5 mb-5">
                <span className="w-6 h-px bg-[#a07c3b]" /> AI-augmented hiring
              </p>
              <h2 className="text-[clamp(2.7rem,5.4vw,4.3rem)] leading-[1.03] tracking-tight text-foreground" style={{ fontFamily: SERIF }}>
                Hire on evidence,<br />not on <em className="text-primary" style={{ fontStyle: 'italic' }}>hunches.</em>
              </h2>
              <p className="text-[16px] text-muted-foreground leading-relaxed mt-6 max-w-lg">
                RecruitAI reads every resume, scores fit against the role, and gives interviewers a shared scorecard — so the pipeline stays transparent from application to offer.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
                <button onClick={() => handleLoginClick('internal')} className="btn-primary !px-6 !py-3 !text-[14px]">
                  Create a workspace <ArrowRight size={15} />
                </button>
                <button onClick={() => navigate('/candidate/jobs')} className="btn-soft !px-6 !py-3 !text-[14px]">
                  Browse open roles
                </button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 pt-6 border-t border-border">
                {['14-day evaluation', 'No sandbox setup', 'SOC 2 aligned'].map((t, i) => (
                  <span key={i} className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 size={13} className="text-primary" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column — candidate fit panel */}
            <aside className="panel overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <span className="text-[14px] text-foreground" style={{ fontFamily: SERIF }}>Fit Score · Backend Engineer</span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Model live
                </span>
              </div>
              {FIT_CANDIDATES.map((c, i) => (
                <div key={i} className="flex items-center gap-3.5 px-5 py-4 border-b border-border/60 last:border-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: c.bg }}>{initials(c.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-none">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{c.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-data text-[16px] font-semibold text-primary">{c.score}</div>
                    <div className="w-16 h-[3px] rounded-full bg-secondary mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="py-10 border-y border-border bg-secondary/40">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <p className="text-center text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground mb-6">Trusted by hiring teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-5">
            {['Stripe', 'Notion', 'Linear', 'Vercel', 'Figma', 'Ramp'].map((n, i) => (
              <span key={i} className="text-[20px] text-muted-foreground/70" style={{ fontFamily: SERIF }}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={features.ref} className="py-24 sm:py-28">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className={`max-w-2xl mb-14 transition-all duration-700 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2.5 mb-4">
              <span className="w-6 h-px bg-[#a07c3b]" /> Core modules
            </p>
            <h2 className="text-[clamp(1.9rem,3.4vw,2.7rem)] leading-tight tracking-tight text-foreground" style={{ fontFamily: SERIF }}>
              Everything a hiring team touches, in one workspace.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { n: '01', icon: Building2, title: 'Multi-tenant workspaces', desc: 'Isolated data per company with role-based access for admins, recruiters, and interviewers.' },
              { n: '02', icon: ShieldCheck, title: 'Transparent match scoring', desc: 'Resumes ranked against the role on the backend — no black box, every signal explainable.' },
              { n: '03', icon: Calendar, title: 'Scheduling & scorecards', desc: 'Book rounds, auto-generate meeting links, and collect structured interviewer feedback.' },
              { n: '04', icon: Target, title: 'Unified pipelines', desc: 'Track every stage, filter applicants, and compare finalists side by side in one view.' },
              { n: '05', icon: Code2, title: 'Live code assessment', desc: 'Run technical rounds in a sandbox with execution and plagiarism signals built in.' },
              { n: '06', icon: BarChart3, title: 'Conversion analytics', desc: 'Real-time pipeline metrics and placement ratios, from first touch to signed offer.' },
            ].map((f, i) => (
              <div key={i}
                className={`panel p-6 hover:-translate-y-1 transition-all duration-300 ${features.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 70 + 100}ms` }}>
                <div className="text-[11px] font-mono text-[#a07c3b]">{f.n}</div>
                <div className="w-10 h-10 rounded-[9px] bg-[hsl(150_24%_92%)] text-primary flex items-center justify-center my-4">
                  <f.icon size={18} />
                </div>
                <h3 className="text-[18px] text-foreground mb-2" style={{ fontFamily: SERIF }}>{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow (a real sequence) ── */}
      <section ref={workflow.ref} className="py-24 sm:py-28 bg-secondary/40 border-y border-border">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className={`max-w-2xl mb-12 transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2.5 mb-4">
              <span className="w-6 h-px bg-[#a07c3b]" /> How it runs
            </p>
            <h2 className="text-[clamp(1.9rem,3.4vw,2.7rem)] leading-tight tracking-tight text-foreground" style={{ fontFamily: SERIF }}>
              Four steps from open role to signed offer.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[14px] border border-border overflow-hidden bg-card">
            {[
              { n: '01', title: 'Post the role', desc: 'Publish a listing with the signals the match model should weigh.' },
              { n: '02', title: 'Screen resumes', desc: 'Every applicant is scored and ranked the moment they apply.' },
              { n: '03', title: 'Run the rounds', desc: 'Schedule interviews, assess live, and collect shared scorecards.' },
              { n: '04', title: 'Make the offer', desc: 'Finalize, send the offer, and review what the pipeline reveals.' },
            ].map((s, i) => (
              <div key={i}
                className={`p-7 border-border sm:[&:not(:nth-child(2n))]:border-r lg:border-r lg:last:border-r-0 border-b lg:border-b-0 transition-all duration-700 ${workflow.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 90 + 100}ms` }}>
                <div className="text-[42px] leading-none text-primary" style={{ fontFamily: SERIF }}>{s.n}</div>
                <h3 className="text-[17px] text-foreground mt-4 mb-2" style={{ fontFamily: SERIF }}>{s.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={cta.ref} className="py-24 sm:py-28">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className={`rounded-[20px] px-10 py-16 text-center relative overflow-hidden transition-all duration-1000 ${cta.vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ background: 'linear-gradient(160deg, #2e5a46 0%, #234636 100%)' }}>
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[200px] pointer-events-none" style={{ background: 'rgba(143,186,165,0.18)' }} />
            <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-[#f4f1e8] relative z-10" style={{ fontFamily: SERIF }}>Ready to hire on evidence?</h2>
            <p className="text-[16px] text-[#f4f1e8]/80 max-w-md mx-auto mt-4 relative z-10 leading-relaxed">
              Spin up an isolated workspace, tune the match signals to your roles, and watch the pipeline in real time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 relative z-10">
              <button onClick={() => handleLoginClick('internal')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] bg-[#f4f1e8] text-[#234636] font-semibold text-[13px] hover:-translate-y-0.5 transition-transform cursor-pointer">
                Deploy recruiter workspace <ArrowRight size={15} />
              </button>
              <button onClick={() => handleLoginClick('candidate')}
                className="px-7 py-3.5 rounded-[10px] bg-white/5 hover:bg-white/10 text-[#f4f1e8] font-semibold text-[13px] border border-white/20 transition-colors cursor-pointer">
                Enter as a candidate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground" style={{ fontFamily: SERIF, fontSize: 15 }}>R</div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">RecruitAI</span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#a07c3b]" /> © 2026 RecruitAI Inc. · SOC 2 aligned
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;
