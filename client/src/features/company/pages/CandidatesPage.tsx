import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Search, MapPin, ExternalLink, X, Mail, Phone, BriefcaseBusiness } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { unwrapArray } from '../../../shared/lib/response';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

const avatarColors = [
  'bg-blue-400', 'bg-violet-400', 'bg-amber-400', 'bg-emerald-400',
  'bg-pink-400', 'bg-sky-400', 'bg-orange-400', 'bg-teal-400',
];

const getSkillStyle = (_skill: string, i: number) => {
  const colors = [
    'bg-blue-50 text-blue-700',
    'bg-purple-50 text-purple-700',
    'bg-amber-50 text-amber-700',
    'bg-emerald-50 text-emerald-700',
    'bg-pink-50 text-pink-700',
    'bg-sky-50 text-sky-700',
  ];
  return colors[i % colors.length];
};

export const CompanyCandidatesPage = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const fetchCandidates = async (searchQuery = '') => {
    try {
      setLoading(true);
      const { data } = await api.get(`/companies/me/candidates?search=${searchQuery}`);
      setCandidates(unwrapArray(data, ['candidates']));
    } catch (err) {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates(search);
  };

  const rows = candidates;
  const filtered = rows.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Candidates" subtitle="Browse and manage candidate profiles" />

      <main className="p-4 sm:p-6 space-y-4 animate-fade-in">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by name, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 font-medium text-slate-700 placeholder:text-slate-400 shadow-sm transition-all"
            />
          </form>
        </div>

        {/* Candidate Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center card-premium">
            <p className="text-[13px] text-slate-400 font-medium">No candidates found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-stagger">
            {filtered.map((candidate, i) => {
              const initials = getInitials(candidate.name);
              const avatarBg = avatarColors[i % avatarColors.length];
              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className="card-premium p-5 cursor-pointer group"
                >
                  {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center text-white font-bold text-[12px] shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900 leading-tight truncate group-hover:text-amber-600 transition-colors">{candidate.name}</p>
                      <a href={`mailto:${candidate.email}`} className="text-[11px] text-amber-500 font-medium leading-tight flex items-center gap-1 hover:underline truncate">
                        ✉ {candidate.email}
                      </a>
                    </div>
                  </div>

                  {/* Bio */}
                  {candidate.bio && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">
                      {candidate.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {candidate.skills.slice(0, 4).map((skill: string, si: number) => (
                        <span
                          key={skill}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSkillStyle(skill, si)}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                      {candidate.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-slate-400" /> {candidate.location}
                        </span>
                      )}
                      {candidate.experience_years && (
                        <span>{candidate.experience_years} yrs exp</span>
                      )}
                      {candidate.applied_jobs_count != null && (
                        <span>· {candidate.applied_jobs_count} app</span>
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2 mt-3">
                    {candidate.linkedin_url && (
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink size={10} /> LinkedIn
                      </a>
                    )}
                    {candidate.github_url && (
                      <a
                        href={candidate.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink size={10} /> GitHub
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                  {getInitials(selectedCandidate.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900 truncate">{selectedCandidate.name}</h2>
                  <p className="text-[12px] text-slate-500 font-medium truncate">{selectedCandidate.summary || 'Candidate profile'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
              <div className="space-y-4">
                <div className="grid gap-2 text-[13px] font-medium text-slate-600">
                  <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-2 text-amber-600 hover:underline">
                    <Mail size={14} /> {selectedCandidate.email}
                  </a>
                  {selectedCandidate.phone && (
                    <span className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" /> {selectedCandidate.phone}
                    </span>
                  )}
                  {selectedCandidate.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" /> {selectedCandidate.location}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness size={14} className="text-slate-400" /> {selectedCandidate.applied_jobs_count || 0} application(s)
                  </span>
                </div>

                {selectedCandidate.skills?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.skills.map((skill: string, i: number) => (
                        <span key={skill} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getSkillStyle(skill, i)}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{selectedCandidate.profile_completion || 0}%</p>
                <p className="mt-1 text-[12px] font-medium text-slate-500">completion</p>
                <div className="mt-4 space-y-2">
                  {selectedCandidate.resume_url && (
                    <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[12px] font-bold text-slate-700 hover:border-amber-300 hover:text-amber-600">
                      View Resume
                    </a>
                  )}
                  {selectedCandidate.linkedin_url && (
                    <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600">
                      LinkedIn
                    </a>
                  )}
                  {selectedCandidate.github_url && (
                    <a href={selectedCandidate.github_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600">
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
