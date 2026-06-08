import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Briefcase, MapPin, Clock, DollarSign, ArrowRight, Building2, Globe, Search } from 'lucide-react';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';

export const PublicCareersPage = () => {
  const { companyId } = useParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/jobs/public?company_id=${companyId}`);
        setJobs(unwrapArray(res.data, ['jobs']));
      } catch (err) {
        toast.error('Failed to load job listings');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [companyId]);

  const company = jobs[0] ? { name: jobs[0].company_name, domain: jobs[0].company_domain } : null;

  const filteredJobs = jobs.filter(job => 
    (job.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (job.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Header */}
      <div className="bg-slate-900 py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-xl shadow-black/20">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{company?.name || 'Company'} Careers</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest flex items-center gap-1">
                  <Globe size={14} />
                  {company?.domain || 'recruitai.com'}
                </p>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{jobs.length} Open Positions</p>
              </div>
            </div>
          </div>
          <p className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
            Join our mission-driven team and help us build the future of recruitment. We're looking for passionate individuals who want to make a difference.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 -mt-8 pb-20">
        
        {/* Search Bar */}
        <div className="card-premium p-4 mb-8 flex flex-col sm:flex-row gap-4 shadow-xl shadow-slate-200/50">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by role or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-violet-500/5 focus:border-violet-400 outline-none transition-all font-bold text-slate-700 text-sm"
              />
           </div>
        </div>

        {loading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-20 text-center card-premium">
             <Briefcase size={40} className="mx-auto text-slate-200 mb-3" />
             <p className="text-slate-400 font-bold">No positions found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <Link 
                key={job.id}
                to={`/jobs/${job.id}`}
                className="card-premium p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-violet-200 transition-all duration-300"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors">{job.title}</h3>
                    <span className="px-2 py-1 bg-violet-50 text-violet-600 text-[9px] font-semibold uppercase tracking-wider rounded border border-violet-100">
                      {job.employment_type || 'Full Time'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-slate-500 font-bold text-xs">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      {job.experience_level || 'Mid Level'}
                    </div>
                    {job.salary_min && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={14} className="text-slate-400" />
                        ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(job.required_skills || []).slice(0, 4).map((skill: string) => (
                      <span key={skill} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded border border-slate-100">
                        {skill}
                      </span>
                    ))}
                    {(job.required_skills || []).length > 4 && (
                      <span className="text-[10px] text-slate-400 font-bold ml-1">+{job.required_skills.length - 4} more</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-8">
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Posted</p>
                      <p className="text-xs font-bold text-slate-900">{new Date(job.created_at).toLocaleDateString()}</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white group-hover:bg-violet-500 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={20} />
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
           <p className="text-slate-400 text-sm font-medium mb-4">Powered by</p>
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 grayscale opacity-50">
              <span className="font-black text-slate-900 tracking-tighter text-lg">RecruitAI</span>
           </div>
        </div>
      </main>
    </div>
  );
};
