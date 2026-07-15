import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Wallet, CalendarClock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApplyModal } from '../components/ApplyModal';
import { formatDistanceToNow } from 'date-fns';

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  internship: 'Internship',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
};

export const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/jobs/public/${id}`);
      setJob(data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to load job details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-32 shimmer rounded-lg" />
          <div className="h-40 shimmer rounded-2xl" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center card-premium p-10 max-w-sm">
          <Briefcase size={40} className="mx-auto text-stone-200 mb-3" />
          <h3 className="text-[15px] font-bold text-stone-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>Job not found</h3>
          <p className="text-[12px] text-stone-400 font-medium mt-1 mb-4">This position may have closed or been removed.</p>
          <Button onClick={() => navigate('/candidate/jobs')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Back to job board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/candidate/jobs')}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-stone-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to job board
        </button>

        {/* Header card */}
        <div className="card-premium p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-500 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
              {job.company_name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] sm:text-[26px] font-extrabold text-stone-900 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {job.title}
              </h1>
              <p className="flex items-center gap-1.5 text-stone-500 font-bold text-[13px] mt-1">
                <Building2 size={13} className="text-stone-400" /> {job.company_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-100">
            <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
              <MapPin size={14} className="text-stone-300 shrink-0" />
              <span className="truncate">{job.remote ? 'Remote' : job.location || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
              <Briefcase size={14} className="text-stone-300 shrink-0" />
              <span className="truncate">{EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}</span>
            </div>
            {job.experience_level && (
              <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                <GraduationCap size={14} className="text-stone-300 shrink-0" />
                <span className="truncate">{EXPERIENCE_LABELS[job.experience_level] || job.experience_level}</span>
              </div>
            )}
            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                <Wallet size={14} className="text-stone-300 shrink-0" />
                <span className="truncate">
                  {job.salary_min && job.salary_max
                    ? `$${Number(job.salary_min).toLocaleString()} – $${Number(job.salary_max).toLocaleString()}`
                    : `$${Number(job.salary_min || job.salary_max).toLocaleString()}+`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
            <span className="text-[10.5px] text-stone-400 font-medium italic flex items-center gap-1.5">
              <CalendarClock size={12} /> Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              {job.deadline && ` · Apply by ${new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>

            {job.already_applied ? (
              <span className="tag-pill bg-emerald-50 text-emerald-700 border-emerald-100 text-[11px]">Applied</span>
            ) : isAuthenticated ? (
              <ApplyModal
                jobId={job.id}
                jobTitle={job.title}
                onSuccess={fetchJob}
                trigger={
                  <Button className="h-9 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-[12px] font-bold rounded-xl shadow-sm transition-all active:scale-95">
                    Apply Now
                  </Button>
                }
              />
            ) : (
              <Button
                onClick={() => navigate('/login', { state: { role: 'candidate' } })}
                className="h-9 px-5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-[12px] font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                Sign In to Apply
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card-premium p-6">
          <h2 className="text-[13px] font-bold text-stone-800 uppercase tracking-wide mb-3" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            About this role
          </h2>
          <p className="text-[13.5px] text-stone-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Required skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="card-premium p-6">
            <h2 className="text-[13px] font-bold text-stone-800 uppercase tracking-wide mb-3" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Required skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill: string) => (
                <span key={skill} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-50 text-stone-600 border border-stone-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
