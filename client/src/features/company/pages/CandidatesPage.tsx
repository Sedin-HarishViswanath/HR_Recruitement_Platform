import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import {
  Search, MapPin, X, Mail, Phone,
  BriefcaseBusiness, FileText, Loader2, Calendar,
  Star, Bookmark, MessageSquare
} from 'lucide-react';
import { unwrapArray } from '../../../shared/lib/response';
import { TranscriptViewerModal } from '../components/TranscriptViewerModal';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

const avatarColors = [
  'bg-sky-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-blue-500',
];


const roundTypeColor: Record<string, string> = {
  aptitude: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  technical: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  hr: 'bg-violet-50 text-violet-700 border-violet-200',
  final: 'bg-violet-50 text-violet-700 border-violet-200',
};

// Removing mockCandidates
export const CompanyCandidatesPage = () => {
  const [dbCandidates, setDbCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  
  // Sidebar active selections
  const [activeSavedSearch, setActiveSavedSearch] = useState('All candidates');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [aiScoreRange, setAiScoreRange] = useState<number>(0);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Transcript state
  const [candidateInterviews, setCandidateInterviews] = useState<any[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [transcriptModal, setTranscriptModal] = useState<{
    isOpen: boolean;
    interviewId: string;
    roundType: string;
    roundNumber?: number;
    candidateName: string;
    interviewerName?: string;
    scheduledAt?: string;
    recordingUrl?: string;
  }>({ isOpen: false, interviewId: '', roundType: '', candidateName: '' });

  const fetchCandidates = async (searchQuery = '') => {
    try {
      setLoading(true);
      const { data } = await api.get(`/companies/me/candidates?search=${searchQuery}`);
      setDbCandidates(unwrapArray(data, ['candidates']));
    } catch (err) {
      // Don't show toast error since we fall back to mock data gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Fetch transcripts for selected candidate
  useEffect(() => {
    if (!selectedCandidate) {
      setCandidateInterviews([]);
      return;
    }
    // No mock fetching logic needed
    const fetchTranscripts = async () => {
      setLoadingInterviews(true);
      try {
        const { data } = await api.get(`/companies/me/candidates/${selectedCandidate.id}/transcripts`);
        setCandidateInterviews(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setCandidateInterviews([]);
      } finally {
        setLoadingInterviews(false);
      }
    };
    fetchTranscripts();
  }, [selectedCandidate?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates(search);
  };

  const filteredCandidates = dbCandidates.map(c => {
    const skillsArray = Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(',').map(s => s.trim()) : []);
    const aiScore = Number(c.ai_match_score) || 0;
    return {
      ...c,
      skills: skillsArray,
      ai_score: aiScore,
      matching_jobs_count: c.applied_jobs_count || 0,
      source: c.source || 'Direct',
      star: aiScore >= 90
    };
  }).filter((c) => {
    // Search query filter
    const nameMatch = !search || 
      c.name?.toLowerCase().includes(search.toLowerCase()) || 
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    
    if (!nameMatch) return false;

    // Saved search filter
    if (activeSavedSearch === 'Top performers' && c.ai_score < 85) return false;
    if (activeSavedSearch === 'Diverse pipeline' && c.skills.length < 3) return false;
    if (activeSavedSearch === 'Recently active' && c.matching_jobs_count === 0) return false;
    if (activeSavedSearch === 'New this week') {
      if (!c.first_applied_date) return false;
      const diff = new Date().getTime() - new Date(c.first_applied_date).getTime();
      if (diff >= 30 * 24 * 60 * 60 * 1000) return false;
    }

    // Department filter
    if (selectedDepts.length > 0) {
      const candidateDepts = c.departments 
        ? c.departments.split(',').map((d: string) => d.trim()) 
        : [];
      const hasMatchingDept = candidateDepts.some((d: string) => selectedDepts.includes(d));
      if (!hasMatchingDept) return false;
    }

    // AI score filter
    if (c.ai_score < aiScoreRange) return false;

    // Location filter
    if (selectedLocations.length > 0) {
      const hasMatchingLoc = selectedLocations.some((loc: string) => 
        c.location?.toLowerCase().includes(loc.toLowerCase())
      );
      if (!hasMatchingLoc) return false;
    }

    return true;
  });

  const toggleDept = (dept: string) => {
    setSelectedDepts(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Search Header Bar matching Image 1 */}
      <div className="topbar-frost px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Candidates</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Candidates
            </h1>
            <span className="text-xs text-slate-400 font-medium">{dbCandidates.length} in your talent pool</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-1 md:flex-none items-center gap-3 max-w-xl">
          <div className="relative flex-1 min-w-[240px] md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search candidates, jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-[240px_1fr] max-w-[1600px] w-full mx-auto">
        
        {/* Left Filters Sidebar */}
        <aside className="border-r border-slate-100/80 bg-white p-5 space-y-6 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] overflow-y-auto hidden md:block">

          {/* Saved Searches */}
          <div className="space-y-2">
            <h3 className="section-eyebrow">Saved Searches</h3>
            <div className="space-y-0.5">
              {[
                { name: 'All candidates', count: dbCandidates.length },
                { name: 'Top performers', count: dbCandidates.filter(c => (c.ai_match_score || 0) >= 85).length },
                { name: 'Diverse pipeline', count: dbCandidates.filter(c => {
                    const skills = Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(',') : []);
                    return skills.length >= 3;
                  }).length },
                { name: 'Recently active', count: dbCandidates.filter(c => (c.applied_jobs_count || 0) > 0).length },
                { name: 'New this week', count: dbCandidates.filter(c => {
                    if (!c.first_applied_date) return false;
                    const diff = new Date().getTime() - new Date(c.first_applied_date).getTime();
                    return diff < 30 * 24 * 60 * 60 * 1000;
                  }).length },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveSavedSearch(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSavedSearch === item.name
                      ? 'bg-violet-50/70 text-violet-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeSavedSearch === item.name ? 'bg-violet-100 text-violet-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Department Filters */}
          <div className="space-y-3">
            <h3 className="section-eyebrow">Filters</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500">Department</label>
              <div className="space-y-2">
                {[
                  { name: 'Engineering', count: dbCandidates.filter(c => (c.departments || '').split(',').map((d: any) => d.trim()).includes('Engineering')).length },
                  { name: 'Design', count: dbCandidates.filter(c => (c.departments || '').split(',').map((d: any) => d.trim()).includes('Design')).length },
                  { name: 'Product', count: dbCandidates.filter(c => (c.departments || '').split(',').map((d: any) => d.trim()).includes('Product')).length },
                  { name: 'Data', count: dbCandidates.filter(c => (c.departments || '').split(',').map((d: any) => d.trim()).includes('Data')).length },
                  { name: 'Sales', count: dbCandidates.filter(c => (c.departments || '').split(',').map((d: any) => d.trim()).includes('Sales')).length },
                ].map((dept) => (
                  <label key={dept.name} className="flex items-center justify-between text-xs text-slate-600 hover:text-slate-950 font-semibold cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDepts.includes(dept.name)}
                        onChange={() => toggleDept(dept.name)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500/20 w-3.5 h-3.5"
                      />
                      <span>{dept.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{dept.count}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* AI Score Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500">AI score</label>
              <span className="text-[11px] font-black text-slate-800">{aiScoreRange}&ndash;100</span>
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="100"
                value={aiScoreRange}
                onChange={(e) => setAiScoreRange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Location Filters */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-500">Location</label>
            <div className="flex flex-wrap gap-1.5">
              {['Remote', 'NYC', 'SF', 'London', 'Berlin'].map((loc) => {
                const isSelected = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    onClick={() => toggleLocation(loc)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-violet-50 border-violet-200 text-violet-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    <span>{loc}</span>
                    {isSelected && <span className="text-[8px] font-black opacity-60">✕</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right main candidates panel */}
        <main className="p-5 space-y-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span><strong>{filteredCandidates.length}</strong> matching candidates</span>
            <div className="flex items-center gap-1">
              <span>Sort:</span>
              <select className="bg-transparent border-none outline-none font-bold text-slate-700 text-[11px] cursor-pointer">
                <option value="ai-score">AI score</option>
                <option value="completeness">Completeness</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Candidate list matching Image 1 */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-white border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-16 text-center card-premium">
              <p className="text-[13px] text-slate-400 font-medium">No candidates match the criteria.</p>
            </div>
          ) : (
            <div className="space-y-3 animate-stagger">
              {filteredCandidates.map((candidate, i) => {
                const initials = getInitials(candidate.name);
                const avatarBg = avatarColors[i % avatarColors.length];
                const matchingJobs = candidate.matching_jobs_count || 0;
                
                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm group relative"
                  >
                    {/* Left Info Column */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      
                      {/* Initials Circle */}
                      <div className={`w-11 h-11 rounded-full ${avatarBg} flex items-center justify-center text-white font-extrabold text-[12px] shrink-0 shadow-sm`}>
                        {initials}
                      </div>

                      {/* Details Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[14px] text-slate-900 leading-tight group-hover:text-violet-600 transition-colors">
                            {candidate.name}
                          </h4>
                          {candidate.star && (
                            <Star size={13} className="fill-amber-400 text-amber-400 shrink-0" />
                          )}
                          {matchingJobs > 0 && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 border border-violet-500/20 shrink-0 uppercase tracking-wide">
                              {matchingJobs} matching jobs
                            </span>
                          )}
                        </div>
                        
                        <p className="text-[11.5px] text-slate-500 font-medium leading-none">
                          {candidate.location?.includes('·') ? candidate.location : `${candidate.location || 'Remote'} · Remote`} &middot; {candidate.experience_years || 5}y
                        </p>

                        {/* Skill Tags */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {candidate.skills.map((skill: string) => (
                              <span
                                key={skill}
                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-500/10 text-slate-650 border border-slate-500/20"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Score Ring & Metadata Column */}
                    <div className="flex items-center gap-6 shrink-0 self-end sm:self-center">
                      
                      {/* AI fit circle */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-11 h-11">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="transparent" r="18" cx="22" cy="22" />
                            <circle className="text-violet-600" strokeWidth="3" strokeDasharray={113} strokeDashoffset={113 - (113 * candidate.ai_score) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="22" cy="22" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-black text-slate-800 text-[11px]">
                            {candidate.ai_score}
                          </span>
                        </div>
                        <span className="text-[8px] font-semibold uppercase text-slate-400 mt-1 tracking-wider">AI FIT</span>
                      </div>

                      {/* Source */}
                      <div className="text-right leading-none min-w-[70px]">
                        <p className="text-[11px] font-bold text-slate-800">{candidate.source || 'LinkedIn'}</p>
                        <p className="text-[8px] font-bold uppercase text-slate-400 mt-1 tracking-wider">source</p>
                      </div>

                      {/* Interaction icons */}
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                          <MessageSquare size={14} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                          <Bookmark size={14} />
                        </button>
                      </div>

                      {/* View button */}
                      <button className="text-[11px] font-bold border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm shrink-0">
                        View &rarr;
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </main>

      </div>

      {/* Selected Candidate Drawer Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCandidate(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col animate-scale-in" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 p-5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white font-extrabold text-[13px] shrink-0 shadow-md">
                  {getInitials(selectedCandidate.name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900 truncate" style={{ fontFamily: 'Sora' }}>{selectedCandidate.name}</h2>
                  <p className="text-[12px] text-slate-500 font-medium truncate">{selectedCandidate.bio || 'Candidate profile'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
                <div className="space-y-4">
                  <div className="grid gap-2 text-[13px] font-semibold text-slate-600">
                    <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-2 text-violet-600 hover:underline">
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
                        {selectedCandidate.skills.map((skill: string) => (
                          <span key={skill} className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile</p>
                  <p className="mt-2 text-3xl font-black text-slate-900" style={{ fontFamily: 'Sora' }}>{selectedCandidate.ai_score || 80}%</p>
                  <p className="mt-1 text-[12px] font-medium text-slate-500">AI Score Match</p>
                  <div className="mt-4 space-y-2">
                    {selectedCandidate.resume_url && (
                      <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[12px] font-bold text-slate-700 hover:border-violet-300 hover:text-violet-600 transition-colors">
                        View Resume
                      </a>
                    )}
                    <a href={selectedCandidate.linkedin_url || `https://linkedin.com/in/${selectedCandidate.name.toLowerCase().replace(' ', '')}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>

              {/* Interview Transcripts Section */}
              <div className="px-5 pb-5">
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-violet-500" />
                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-700">Interview Rounds & Transcripts</p>
                  </div>

                  {loadingInterviews ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="text-violet-400 animate-spin mr-2" />
                      <span className="text-[12px] text-slate-400 font-medium">Loading interviews...</span>
                    </div>
                  ) : candidateInterviews.length === 0 ? (
                    <div className="py-6 text-center rounded-xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[12px] text-slate-400 font-medium">No transcripts scheduled for this candidate yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {candidateInterviews.map((iv: any) => {
                        const dateStr = iv.scheduled_at
                          ? new Date(iv.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '';
                        const typeStyle = roundTypeColor[iv.round_type?.toLowerCase()] || 'bg-slate-100 text-slate-600';
                        const isCompleted = iv.status === 'completed';
                        return (
                          <div
                            key={iv.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-violet-200 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${typeStyle}`}>
                                  {iv.round_type || 'Interview'}
                                </span>
                                {iv.round_number && (
                                  <span className="text-[10px] text-slate-400 font-medium">Round {iv.round_number}</span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-600'
                                }`}>
                                  {isCompleted ? 'Completed' : iv.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                {dateStr && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={10} className="text-slate-400" /> {dateStr}
                                  </span>
                                )}
                                {iv.interviewer_name && <span>&middot; {iv.interviewer_name}</span>}
                                {iv.aptitude_score != null && (
                                  <span className="text-indigo-600 font-bold">Score: {iv.aptitude_score}/20</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setTranscriptModal({
                                isOpen: true,
                                interviewId: iv.id,
                                roundType: iv.round_type,
                                roundNumber: iv.round_number,
                                candidateName: selectedCandidate.name,
                                interviewerName: iv.interviewer_name,
                                scheduledAt: iv.scheduled_at,
                                recordingUrl: iv.recording_url,
                              })}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                                iv.has_transcript || iv.recording_url
                                  ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                                  : 'bg-slate-50 text-slate-400 border border-slate-200'
                              }`}
                            >
                              <FileText size={12} />
                              {iv.has_transcript || iv.recording_url ? 'View Details' : 'No Details'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Viewer Modal */}
      <TranscriptViewerModal
        isOpen={transcriptModal.isOpen}
        onClose={() => setTranscriptModal(prev => ({ ...prev, isOpen: false }))}
        interviewId={transcriptModal.interviewId}
        roundType={transcriptModal.roundType}
        roundNumber={transcriptModal.roundNumber}
        candidateName={transcriptModal.candidateName}
        interviewerName={transcriptModal.interviewerName}
        scheduledAt={transcriptModal.scheduledAt}
        recordingUrl={transcriptModal.recordingUrl}
      />
    </div>
  );
};
