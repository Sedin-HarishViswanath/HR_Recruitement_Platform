import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Briefcase, Globe, 
  Code, Sparkles, Plus, X, Landmark, CheckCircle2, Shield, 
  Award, ExternalLink, Edit3, Save, XCircle
} from 'lucide-react';

const GithubIcon = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedInIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export const CandidateProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/candidate/profile');
      setProfile(data.data);
      setFormData(data.data || {});
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setUploading(true);
      const payload = { ...formData };
      
      // Clean preferences
      if (payload.preferences) {
        payload.preferences.salary_min = payload.preferences.salary_min ? Number(payload.preferences.salary_min) : undefined;
        payload.preferences.salary_max = payload.preferences.salary_max ? Number(payload.preferences.salary_max) : undefined;
      }
      
      await api.patch('/candidate/me/profile', payload);
      toast.success('Profile updated successfully');
      setEditMode(false);
      fetchProfile();
      
      // Notify parent pages that a profile update occurred (for completion percentages)
      window.dispatchEvent(new Event('sync-profile'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    
    const skillsList = Array.isArray(formData.skills) ? formData.skills : [];
    if (skillsList.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    
    setFormData({
      ...formData,
      skills: [...skillsList, newSkill.trim()]
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const skillsList: string[] = Array.isArray(formData.skills) ? formData.skills : [];
    setFormData({
      ...formData,
      skills: skillsList.filter((s: string) => s !== skillToRemove)
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 border-[2.5px] border-slate-100 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-[2.5px] border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[13px] text-slate-400 font-medium mt-4">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 max-w-md mx-auto rounded-2xl mt-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
          <User size={24} className="text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Sora' }}>Profile not found</h3>
        <p className="text-sm text-slate-500 mt-1">Please try again or log in to create a candidate profile.</p>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const initials = (profile.name || '').trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const completionScore = profile.profile_completion ?? 0;
  const hasLinks = profile.linkedin_url || profile.github_url || profile.portfolio_url;

  // Skill color rotation for visual variety
  const skillColors = [
    'bg-violet-50 text-violet-700 border-violet-200/80',
    'bg-sky-50 text-sky-700 border-sky-200/80',
    'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    'bg-amber-50 text-amber-700 border-amber-200/80',
    'bg-rose-50 text-rose-700 border-rose-200/80',
    'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    'bg-teal-50 text-teal-700 border-teal-200/80',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80',
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Workspace Header ── */}
      <div className="topbar-frost px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mb-0.5 uppercase tracking-[0.1em]">
            <span>Candidate</span>
            <span className="text-slate-300">›</span>
            <span className="text-slate-600">Profile</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            My Profile
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {!editMode ? (
            <button 
              onClick={() => setEditMode(true)} 
              className="btn-primary text-[12px] gap-1.5"
            >
              <Edit3 size={13} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditMode(false); setFormData(profile); }} 
                className="btn-soft text-[12px] gap-1.5"
              >
                <XCircle size={13} /> Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={uploading} 
                className="btn-primary text-[12px] gap-1.5 disabled:opacity-50"
              >
                <Save size={13} /> {uploading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="p-5 max-w-[1200px] w-full mx-auto space-y-6 flex-1 flex flex-col">
        
        {/* ═══ Hero Profile Card ═══ */}
        <div className="surface-raised !rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className="h-36 relative overflow-hidden bg-[#0d0e12]">
            {/* High-end Dark Carbon & Slate mesh gradient (Apple/Linear style) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950" />
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(45,212,191,0.1) 0%, transparent 45%)'
            }} />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(139,92,246,0.12) 0%, transparent 60%)'
            }} />
            {/* Subtle carbon grid lines overlay */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>

          {/* Profile info overlapping cover */}
          <div className="px-6 lg:px-8 pb-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-14">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-[4px] border-white text-white flex items-center justify-center font-black text-3xl shadow-xl shrink-0 ring-1 ring-black/5"
                  style={{ fontFamily: 'Sora' }}>
                  {initials || 'A'}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full" />
              </div>

              {/* Name & role */}
              <div className="flex-1 text-center sm:text-left pb-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight" style={{ fontFamily: 'Sora' }}>
                    {profile.name}
                  </h2>
                  {completionScore >= 80 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                      <Shield size={10} /> Verified Profile
                    </span>
                  )}
                </div>
                <p className="text-sm text-violet-600 font-bold">
                  {profile.preferences?.preferred_role || 'Software Developer'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[12px] text-slate-400 font-medium mt-0.5">
                  {profile.location && (
                    <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>
                  )}
                  {profile.email && (
                    <span className="flex items-center gap-1"><Mail size={12} /> {profile.email}</span>
                  )}
                </div>
              </div>

              {/* Social links — top right on desktop */}
              {hasLinks && (
                <div className="flex items-center gap-2 self-center sm:self-end pb-2">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" 
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                      <LinkedInIcon size={15} />
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" 
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200">
                      <GithubIcon size={15} />
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noreferrer" 
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200 transition-all duration-200">
                      <Globe size={15} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Profile completion bar — only shows if incomplete */}
            {completionScore < 100 && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-violet-50/80 via-indigo-50/50 to-transparent border border-violet-100/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Profile Completeness</span>
                  <span className="text-[13px] font-extrabold text-violet-700" style={{ fontFamily: 'Sora' }}>{completionScore}%</span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200/60">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${completionScore}%`,
                      background: completionScore >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : completionScore >= 50 ? 'linear-gradient(90deg, #8b5cf6, #6d28d9)' 
                        : 'linear-gradient(90deg, #f59e0b, #d97706)',
                    }} 
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                  {completionScore < 50 ? 'Add skills and experience to attract more recruiters.' 
                    : completionScore < 80 ? 'Almost there! Complete your preferences to boost visibility.'
                    : 'Great progress! Just a few more details.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Content Grid ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ── Left Column ── */}
          <div className="space-y-6">
            
            {/* Contact Details */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <User size={13} className="text-violet-600" />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>Contact Info</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Full Name</Label>
                  {editMode ? (
                    <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-9 text-[13px] font-medium text-slate-700" />
                  ) : (
                    <p className="text-[13px] font-semibold text-slate-800">{profile.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email</Label>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                      <Mail size={12} className="text-slate-400" />
                    </div>
                    <span className="truncate">{profile.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Phone</Label>
                  {editMode ? (
                    <Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-9 text-[13px] font-medium text-slate-700" />
                  ) : (
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                        <Phone size={12} className="text-slate-400" />
                      </div>
                      {profile.phone || <span className="text-slate-400 font-normal italic">Not added</span>}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Location</Label>
                  {editMode ? (
                    <Input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="h-9 text-[13px] font-medium text-slate-700" />
                  ) : (
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                        <MapPin size={12} className="text-slate-400" />
                      </div>
                      {profile.location || <span className="text-slate-400 font-normal italic">Not set</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Links */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Globe size={13} className="text-sky-600" />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>Links & Socials</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* LinkedIn */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">LinkedIn</Label>
                  {editMode ? (
                    <Input value={formData.linkedin_url || ''} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" className="h-9 text-[13px] font-medium" />
                  ) : profile.linkedin_url ? (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg border border-slate-200/80 transition-all group">
                      <LinkedInIcon size={14} />
                      <span className="truncate flex-1">{profile.linkedin_url.replace('https://', '').replace('www.', '')}</span>
                      <ExternalLink size={11} className="text-slate-300 group-hover:text-blue-400 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[12px] text-slate-400 italic">Not connected</p>
                  )}
                </div>

                {/* GitHub */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">GitHub</Label>
                  {editMode ? (
                    <Input value={formData.github_url || ''} onChange={e => setFormData({ ...formData, github_url: e.target.value })} placeholder="https://github.com/username" className="h-9 text-[13px] font-medium" />
                  ) : profile.github_url ? (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80 transition-all group">
                      <GithubIcon size={14} />
                      <span className="truncate flex-1">{profile.github_url.replace('https://', '').replace('www.', '')}</span>
                      <ExternalLink size={11} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[12px] text-slate-400 italic">Not connected</p>
                  )}
                </div>

                {/* Portfolio */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Portfolio</Label>
                  {editMode ? (
                    <Input value={formData.portfolio_url || ''} onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })} placeholder="https://yoursite.dev" className="h-9 text-[13px] font-medium" />
                  ) : profile.portfolio_url ? (
                    <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-2 rounded-lg border border-slate-200/80 transition-all group">
                      <Globe size={14} />
                      <span className="truncate flex-1">{profile.portfolio_url.replace('https://', '').replace('www.', '')}</span>
                      <ExternalLink size={11} className="text-slate-300 group-hover:text-violet-400 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[12px] text-slate-400 italic">Not connected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column (2/3 width) ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About Me */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Sparkles size={13} className="text-amber-600" />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>About Me</h3>
                </div>
              </div>
              <div className="p-5">
                {editMode ? (
                  <div className="space-y-2">
                    <Textarea 
                      value={formData.summary || ''} 
                      onChange={e => setFormData({ ...formData, summary: e.target.value })} 
                      className="min-h-[140px] text-[13px] font-medium text-slate-700 leading-relaxed rounded-xl resize-none"
                      placeholder="Write a compelling summary about your professional background, key achievements, and what you're looking for in your next role..."
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-slate-400 font-medium">Tip: A strong summary increases recruiter responses by 3×</p>
                      <p className="text-[10px] text-slate-400 font-medium">{(formData.summary || '').length}/1000</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-600 font-normal leading-[1.75] whitespace-pre-wrap">
                    {profile.summary || (
                      <span className="text-slate-400 italic flex items-center gap-2">
                        <Edit3 size={13} /> No professional summary added yet. Click "Edit Profile" to describe your experience.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Code size={13} className="text-emerald-600" />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>Core Skills</h3>
                  {!editMode && skills.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{skills.length}</span>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-4">
                {editMode && (
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Add a skill (e.g. React, Python, AWS…)"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        className="input-premium w-full text-[13px] !py-2 !pl-4 !pr-3"
                      />
                    </div>
                    <button type="submit" className="btn-primary text-[12px] !px-4 !py-2 shrink-0 gap-1">
                      <Plus size={13} /> Add
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap gap-2">
                  {editMode ? (
                    Array.isArray(formData.skills) && formData.skills.length > 0 ? (
                      formData.skills.map((s: string, i: number) => (
                        <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold animate-fade-in ${skillColors[i % skillColors.length]}`}>
                          {s}
                          <button type="button" onClick={() => handleRemoveSkill(s)} className="text-current opacity-40 hover:opacity-100 hover:text-red-500 transition-all cursor-pointer ml-0.5">
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-[12px] text-slate-400 italic py-2">No skills listed yet. Start typing above to add your skills.</p>
                    )
                  ) : (
                    skills.length > 0 ? (
                      skills.map((s: string, i: number) => (
                        <span key={s} className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all hover:scale-[1.03] ${skillColors[i % skillColors.length]}`}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <div className="text-center py-6 w-full">
                        <Award size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[12px] text-slate-400 italic">No skills listed. Click edit to add your core technical skills.</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Career Preferences */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Briefcase size={13} className="text-indigo-600" />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>Career Preferences</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Preferred Role */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Briefcase size={10} /> Target Role
                    </Label>
                    {editMode ? (
                      <Input 
                        value={formData.preferences?.preferred_role || ''} 
                        onChange={e => setFormData({ ...formData, preferences: { ...formData.preferences, preferred_role: e.target.value } })} 
                        placeholder="e.g. Senior Frontend Engineer"
                        className="h-9 text-[13px] font-medium text-slate-700" 
                      />
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800">{profile.preferences?.preferred_role || <span className="text-slate-400 font-normal italic">Not set</span>}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <MapPin size={10} /> Preferred Location
                    </Label>
                    {editMode ? (
                      <Input 
                        value={formData.preferences?.preferred_location || ''} 
                        onChange={e => setFormData({ ...formData, preferences: { ...formData.preferences, preferred_location: e.target.value } })} 
                        placeholder="e.g. Remote, NYC, Bangalore"
                        className="h-9 text-[13px] font-medium text-slate-700" 
                      />
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800">{profile.preferences?.preferred_location || <span className="text-slate-400 font-normal italic">Not set</span>}</p>
                    )}
                  </div>

                  {/* Salary Min */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Landmark size={10} /> Min. Salary (₹/yr)
                    </Label>
                    {editMode ? (
                      <Input 
                        type="number"
                        value={formData.preferences?.salary_min ?? ''} 
                        onChange={e => setFormData({ ...formData, preferences: { ...formData.preferences, salary_min: e.target.value ? Number(e.target.value) : undefined } })} 
                        placeholder="e.g. 800000"
                        className="h-9 text-[13px] font-medium text-slate-700" 
                      />
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800">
                        {profile.preferences?.salary_min ? `₹${profile.preferences.salary_min.toLocaleString('en-IN')}` : <span className="text-slate-400 font-normal italic">Not set</span>}
                      </p>
                    )}
                  </div>

                  {/* Salary Max */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Landmark size={10} /> Max. Salary (₹/yr)
                    </Label>
                    {editMode ? (
                      <Input 
                        type="number"
                        value={formData.preferences?.salary_max ?? ''} 
                        onChange={e => setFormData({ ...formData, preferences: { ...formData.preferences, salary_max: e.target.value ? Number(e.target.value) : undefined } })} 
                        placeholder="e.g. 1500000"
                        className="h-9 text-[13px] font-medium text-slate-700" 
                      />
                    ) : (
                      <p className="text-[13px] font-semibold text-slate-800">
                        {profile.preferences?.salary_max ? `₹${profile.preferences.salary_max.toLocaleString('en-IN')}` : <span className="text-slate-400 font-normal italic">Not set</span>}
                      </p>
                    )}
                  </div>

                  {/* Relocation */}
                  <div className="sm:col-span-2 pt-2">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                      {editMode ? (
                        <input 
                          type="checkbox"
                          id="relocation-checkbox"
                          checked={!!formData.preferences?.open_to_relocation}
                          onChange={e => setFormData({ ...formData, preferences: { ...formData.preferences, open_to_relocation: e.target.checked } })}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4.5 h-4.5 cursor-pointer"
                        />
                      ) : (
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${profile.preferences?.open_to_relocation ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          {profile.preferences?.open_to_relocation && <CheckCircle2 size={13} className="text-white" />}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="relocation-checkbox" className="text-[13px] font-semibold text-slate-700 cursor-pointer">Open to relocation</Label>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Willing to relocate for the right opportunity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default CandidateProfile;
