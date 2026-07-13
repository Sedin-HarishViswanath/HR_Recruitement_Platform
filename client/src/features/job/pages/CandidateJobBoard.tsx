import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Search, MapPin, Briefcase, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { ApplyModal } from '../components/ApplyModal';
import { formatDistanceToNow } from 'date-fns';
import { unwrapArray } from '../../../shared/lib/response';

export const CandidateJobBoard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  const fetchPublicJobs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/jobs/public', {
        params: {
          search: search || undefined,
          location: locationFilter || undefined,
        }
      });
      setJobs(unwrapArray(data, ['jobs']));
    } catch (err) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPublicJobs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, locationFilter]);

  const getEmploymentType = (type: string) => {
    const format: Record<string, string> = {
      full_time: 'Full-Time',
      part_time: 'Part-Time',
      contract: 'Contract',
      internship: 'Internship'
    };
    return format[type] || type;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-3 py-8 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            <div className="w-64 h-64 bg-emerald-400 rounded-full blur-[120px] opacity-[0.06]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {loading ? 'Loading jobs...' : `${jobs.length}+ open positions`}
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-extrabold tracking-tight text-stone-900 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Find your next<br />
            <span className="text-emerald-700">great opportunity</span>
          </h1>
          <p className="text-[14px] text-stone-500 max-w-md mx-auto font-normal leading-relaxed">
            Browse open positions from top companies on our platform.
          </p>
        </div>

        {/* Search Bar */}
        <div className="card-premium p-3 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <Input 
              placeholder="Job title, keywords..." 
              className="pl-10 h-10 text-[13px] border-0 bg-stone-50 shadow-none focus-visible:ring-0 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-px bg-stone-100 hidden md:block my-2"></div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <Input 
              placeholder="City or 'Remote'..." 
              className="pl-10 h-10 text-[13px] border-0 bg-stone-50 shadow-none focus-visible:ring-0 rounded-xl"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          {(search || locationFilter) && (
            <Button variant="ghost" onClick={() => { setSearch(''); setLocationFilter(''); }} className="h-10 px-3 text-stone-400 hover:text-red-500 transition-colors">
              <FilterX size={18} />
            </Button>
          )}
          <Button className="h-10 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all btn-premium">
            Search Jobs
          </Button>
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-stone-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {loading ? 'Searching...' : `${jobs.length} jobs available`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 shimmer rounded-2xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center card-premium">
              <Briefcase size={40} className="mx-auto text-stone-200 mb-3" />
              <h3 className="text-[14px] font-bold text-stone-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>No matching jobs</h3>
              <p className="text-[12px] text-stone-400 font-medium mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
              {jobs.map((job) => (
                <div key={job.id} className="card-premium p-4 flex flex-col h-full group hover-lift transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {job.company_name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[14px] text-stone-900 line-clamp-1 group-hover:text-emerald-600 transition-colors leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-stone-400 font-bold text-[10px] uppercase tracking-wider mt-0.5">{job.company_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center text-[11px] text-stone-500 font-medium">
                      <MapPin size={12} className="mr-1.5 text-stone-300" />
                      <span className="truncate">{job.remote ? 'Remote' : job.location || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-[11px] text-stone-500 font-medium">
                      <Briefcase size={12} className="mr-1.5 text-stone-300" />
                      <span className="truncate">{getEmploymentType(job.employment_type)}</span>
                    </div>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.required_skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-100">
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 3 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 text-stone-400">+{job.required_skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-stone-50 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-medium italic">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                    
                    {job.already_applied ? (
                      <span className="tag-pill bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">
                        Applied
                      </span>
                    ) : isAuthenticated ? (
                      <ApplyModal 
                        jobId={job.id} 
                        jobTitle={job.title} 
                        onSuccess={fetchPublicJobs}
                        trigger={
                          <Button size="sm" className="h-8 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all active:scale-95">
                            View & Apply
                          </Button>
                        }
                      />
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => navigate('/login', { state: { role: 'candidate' } })}
                        className="h-8 px-4 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-[11px] font-bold rounded-lg shadow-sm transition-all active:scale-95">
                        Sign In to Apply
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
