import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Link as LinkIcon, Briefcase, Globe, 
  Code, Sparkles, Plus, X, Landmark, CheckCircle2 
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
      <div className="flex flex-col min-h-screen bg-[#fafbfc] items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold mt-2">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 max-w-md mx-auto rounded-xl mt-12">
        <User size={32} className="mx-auto text-slate-350 mb-2" />
        <h3 className="font-bold text-slate-800">Profile not found</h3>
        <p className="text-xs text-slate-500 mt-1">Please try again or log in to create a candidate profile.</p>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const initials = (profile.name || '').trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Workspace Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Candidate</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Profile</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              My Profile
            </h1>
            <span className="text-xs text-slate-400 font-medium">Manage your resume details & preferences</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editMode ? (
            <button 
              onClick={() => setEditMode(true)} 
              className="text-[12px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-all shadow-sm shadow-violet-500/10 hover:scale-[1.01]"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditMode(false); setFormData(profile); }} 
                className="text-[12px] font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={uploading} 
                className="text-[12px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="p-5 max-w-[1200px] w-full mx-auto space-y-6 flex-1 flex flex-col">
        
        {/* Profile Card with Cover Banner */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 relative" />

          {/* Overlapping Avatar details */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                {/* Initials circle avatar */}
                <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-white text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                  {initials || 'A'}
                </div>
                <div className="mb-2 space-y-1">
                  <h2 className="text-lg font-black text-slate-900 leading-tight" style={{ fontFamily: 'Sora' }}>{profile.name}</h2>
                  <p className="text-xs text-violet-600 font-extrabold uppercase tracking-wider">{profile.preferences?.preferred_role || 'Developer'}</p>
                  <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <MapPin size={11} className="text-slate-400" /> {profile.location || 'Remote'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 self-center sm:self-end mb-2">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-slate-50 transition-all shadow-sm">
                    <LinkIcon size={14} />
                  </a>
                )}
                 {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-slate-50 transition-all shadow-sm">
                    <GithubIcon size={14} />
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-slate-50 transition-all shadow-sm">
                    <Globe size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dual Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Contact & Links */}
          <div className="space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" /> Contact Info
              </h3>
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                  {editMode ? (
                    <Input 
                      value={formData.name || ''} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800">{profile.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Email address</Label>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" />
                    {profile.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number</Label>
                  {editMode ? (
                    <Input 
                      value={formData.phone || ''} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      {profile.phone || 'Not added'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Location</Label>
                  {editMode ? (
                    <Input 
                      value={formData.location || ''} 
                      onChange={e => setFormData({ ...formData, location: e.target.value })} 
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400" />
                      {profile.location || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Links Editor Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Globe size={13} className="text-slate-400" /> Professional Links
              </h3>
              
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">LinkedIn URL</Label>
                  {editMode ? (
                    <Input 
                      value={formData.linkedin_url || ''} 
                      onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} 
                      placeholder="https://linkedin.com/in/username" 
                      className="h-8 text-xs font-semibold text-slate-750" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {profile.linkedin_url ? (
                        <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-violet-650 hover:underline flex items-center gap-1">
                          <LinkIcon size={11} /> {profile.linkedin_url.replace('https://', '')}
                        </a>
                      ) : 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">GitHub URL</Label>
                  {editMode ? (
                    <Input 
                      value={formData.github_url || ''} 
                      onChange={e => setFormData({ ...formData, github_url: e.target.value })} 
                      placeholder="https://github.com/username" 
                      className="h-8 text-xs font-semibold text-slate-750" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800 truncate">
                       {profile.github_url ? (
                        <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-violet-650 hover:underline flex items-center gap-1">
                          <GithubIcon size={11} /> {profile.github_url.replace('https://', '')}
                        </a>
                      ) : 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Portfolio Website</Label>
                  {editMode ? (
                    <Input 
                      value={formData.portfolio_url || ''} 
                      onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })} 
                      placeholder="https://username.dev" 
                      className="h-8 text-xs font-semibold text-slate-750" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {profile.portfolio_url ? (
                        <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-violet-650 hover:underline flex items-center gap-1">
                          <Globe size={11} /> {profile.portfolio_url.replace('https://', '')}
                        </a>
                      ) : 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: About, Skills, Preferences */}
          <div className="md:col-span-2 space-y-6">
            
            {/* About Me Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Sparkles size={13} className="text-violet-500 animate-float" /> About Me Summary
              </h3>
              
              {editMode ? (
                <div className="space-y-1">
                  <Textarea 
                    value={formData.summary || ''} 
                    onChange={e => setFormData({ ...formData, summary: e.target.value })} 
                    className="h-32 text-xs font-semibold text-slate-700 leading-relaxed rounded-lg"
                    placeholder="Provide a detailed overview of your professional skills, achievements, and goals..."
                  />
                  <p className="text-[9px] text-slate-400 font-medium text-right">Max 1000 characters</p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap pt-1">
                  {profile.summary || 'No professional summary added yet. Click edit to describe your experience.'}
                </p>
              )}
            </div>

            {/* Top Skills Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Code size={13} className="text-slate-400" /> Core Skills
              </h3>
              
              {/* Tag Editor list */}
              <div className="space-y-4">
                {editMode && (
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill (e.g. React, Next.js, Python)..."
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 shrink-0 h-8"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap gap-2">
                  {editMode ? (
                    Array.isArray(formData.skills) && formData.skills.length > 0 ? (
                      formData.skills.map((s: string) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-violet-50 border border-violet-100 text-violet-750 text-xs font-bold animate-fade-in">
                          {s}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(s)} 
                            className="text-violet-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No skills listed yet.</p>
                    )
                  ) : (
                    skills.length > 0 ? (
                      skills.map((s: string) => (
                        <span key={s} className="px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-slate-650 text-xs font-extrabold">
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No skills listed. Click edit to add core skills.</p>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Job Preferences Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <Briefcase size={13} className="text-slate-400" /> Career Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Target / Preferred Role</Label>
                  {editMode ? (
                    <Input 
                      value={formData.preferences?.preferred_role || ''} 
                      onChange={e => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, preferred_role: e.target.value }
                      })} 
                      placeholder="e.g. Senior Frontend Engineer"
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800">{profile.preferences?.preferred_role || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Preferred Location</Label>
                  {editMode ? (
                    <Input 
                      value={formData.preferences?.preferred_location || ''} 
                      onChange={e => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, preferred_location: e.target.value }
                      })} 
                      placeholder="e.g. SF, Remote, NYC"
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-800">{profile.preferences?.preferred_location || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Landmark size={11} className="text-slate-450" /> Salary Range Min ($)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      value={formData.preferences?.salary_min ?? ''} 
                      onChange={e => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, salary_min: e.target.value ? Number(e.target.value) : undefined }
                      })} 
                      placeholder="e.g. 120000"
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-850">
                      {profile.preferences?.salary_min ? `$${profile.preferences.salary_min.toLocaleString()}` : 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Landmark size={11} className="text-slate-450" /> Salary Range Max ($)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      value={formData.preferences?.salary_max ?? ''} 
                      onChange={e => setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, salary_max: e.target.value ? Number(e.target.value) : undefined }
                      })} 
                      placeholder="e.g. 180000"
                      className="h-8 text-xs font-semibold text-slate-700" 
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-850">
                      {profile.preferences?.salary_max ? `$${profile.preferences.salary_max.toLocaleString()}` : 'Not set'}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 pt-2">
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <input 
                        type="checkbox"
                        id="relocation-checkbox"
                        checked={!!formData.preferences?.open_to_relocation}
                        onChange={e => setFormData({
                          ...formData,
                          preferences: { ...formData.preferences, open_to_relocation: e.target.checked }
                        })}
                        className="rounded border-slate-200 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                      />
                    ) : (
                      <CheckCircle2 size={14} className={profile.preferences?.open_to_relocation ? 'text-emerald-500' : 'text-slate-350'} />
                    )}
                    <Label htmlFor="relocation-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">Open to relocation</Label>
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
