import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Search, MapPin, Briefcase, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/badge';
import { ApplyModal } from '../components/ApplyModal';
import { formatDistanceToNow } from 'date-fns';

export const CandidateJobBoard = () => {
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
      setJobs(data.data.jobs);
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Find your next great opportunity
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Browse hundreds of job openings from top companies on our platform.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Job title, keywords, or company" 
              className="pl-12 h-12 text-lg border-0 shadow-none focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-px bg-slate-200 hidden md:block"></div>
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="City, state, or 'Remote'" 
              className="pl-12 h-12 text-lg border-0 shadow-none focus-visible:ring-0"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          {(search || locationFilter) && (
            <Button variant="ghost" onClick={() => { setSearch(''); setLocationFilter(''); }} className="h-12 px-4 text-slate-500">
              <FilterX size={20} />
            </Button>
          )}
          <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg rounded-xl">
            Search
          </Button>
        </div>

        {/* Job Listings */}
        <div>
          <h2 className="text-xl font-bold mb-6 text-slate-800">
            {loading ? 'Searching...' : `${jobs.length} jobs available`}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-2xl border border-slate-100 bg-white animate-pulse"></div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No matching jobs</h3>
              <p className="text-slate-500 mt-2">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                      {job.company_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm line-clamp-1">{job.company_name}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin size={16} className="mr-2 text-slate-400" />
                      {job.remote ? 'Remote' : job.location || 'Location not specified'}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Briefcase size={16} className="mr-2 text-slate-400" />
                      {getEmploymentType(job.employment_type)}
                    </div>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {job.required_skills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 font-normal border-none">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 3 && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal border-none">
                          +{job.required_skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </span>
                    
                    {job.already_applied ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg border-none">
                        Applied
                      </Badge>
                    ) : (
                      <ApplyModal 
                        jobId={job.id} 
                        jobTitle={job.title} 
                        onSuccess={fetchPublicJobs}
                        trigger={
                          <Button size="sm" className="bg-slate-900 hover:bg-blue-600 rounded-lg">
                            View & Apply
                          </Button>
                        }
                      />
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
