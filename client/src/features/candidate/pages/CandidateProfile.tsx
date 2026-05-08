import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Link as LinkIcon, FileText, Briefcase } from 'lucide-react';

export const CandidateProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/candidate/profile');
      setProfile(data.data);
      setFormData(data.data);
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
      if (payload.preferences) {
        payload.preferences.salary_min = payload.preferences.salary_min ? Number(payload.preferences.salary_min) : undefined;
        payload.preferences.salary_max = payload.preferences.salary_max ? Number(payload.preferences.salary_max) : undefined;
      }
      
      await api.patch('/candidate/me/profile', payload);

      if (resumeFile) {
        const resumeFormData = new FormData();
        resumeFormData.append('resume', resumeFile);
        await api.post('/candidate/me/resume', resumeFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResumeFile(null);
      }

      toast.success('Profile updated successfully');
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!profile) return <div className="p-8">Profile not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and resume.</p>
        </div>
        {!editMode ? (
          <Button onClick={() => setEditMode(true)} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm transition-all btn-premium">Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditMode(false); setFormData(profile); setResumeFile(null); }} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleSave} disabled={uploading} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm transition-all btn-premium">
              {uploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-slate-400 mb-4">
              {profile.name?.charAt(0) || <User />}
            </div>
            {editMode ? (
              <Input 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="text-center font-bold text-lg mb-2" 
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            )}
            <p className="text-slate-500 text-sm mb-4">{profile.preferences?.preferred_role || 'Job Seeker'}</p>
            
            <div className="space-y-3 text-sm text-left border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-slate-400" />
                {editMode ? (
                  <Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-8" />
                ) : (
                  <span>{profile.phone || 'Add phone number'}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                {editMode ? (
                  <Input value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="h-8" />
                ) : (
                  <span>{profile.location || 'Add location'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <LinkIcon size={18} className="text-blue-500" /> Links
            </h3>
            <div className="space-y-3">
              {(['linkedin_url', 'github_url', 'portfolio_url'] as const).map(link => (
                <div key={link}>
                  {editMode ? (
                    <Input 
                      placeholder={link.replace('_url', '')} 
                      value={formData[link] || ''} 
                      onChange={e => setFormData({...formData, [link]: e.target.value})} 
                      className="h-8 text-sm"
                    />
                  ) : profile[link] ? (
                    <a href={profile[link]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate block">
                      {profile[link]}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-500" /> About Me
            </h3>
            {editMode ? (
              <Textarea 
                value={formData.summary || ''} 
                onChange={e => setFormData({...formData, summary: e.target.value})} 
                className="h-32"
              />
            ) : (
              <p className="text-slate-600 whitespace-pre-wrap">{profile.summary || 'No summary added.'}</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FileText size={18} className="text-blue-500" /> Resume
            </h3>
            {profile.resume_url || profile.resume_drive_link ? (
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText size={20} /></div>
                  <div>
                    <p className="font-medium text-slate-900">Current Resume</p>
                    <p className="text-xs text-slate-500">Uploaded on Platform</p>
                  </div>
                </div>
                {profile.resume_url ? (
                  <a href={`http://localhost:5000${profile.resume_url}`} target="_blank" rel="noreferrer" className="text-sm text-amber-600 hover:underline font-bold">View PDF</a>
                ) : (
                  <a href={profile.resume_drive_link} target="_blank" rel="noreferrer" className="text-sm text-amber-600 hover:underline font-bold">Open Link</a>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm font-medium">No resume uploaded.</p>
            )}
            
            {editMode && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload New Resume (PDF)</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="text-[12px] h-9 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                    />
                  </div>
                  {resumeFile && <p className="text-xs text-amber-600 font-bold">Selected: {resumeFile.name}</p>}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or Resume Drive Link</Label>
                  <Input 
                    placeholder="https://drive.google.com/..." 
                    value={formData.resume_drive_link || ''} 
                    onChange={e => setFormData({...formData, resume_drive_link: e.target.value})} 
                    className="text-sm h-9"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Briefcase size={18} className="text-blue-500" /> Job Preferences
            </h3>
            {editMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Role</Label>
                  <Input value={formData.preferences?.preferred_role || ''} onChange={e => setFormData({...formData, preferences: {...formData.preferences, preferred_role: e.target.value}})} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input value={formData.preferences?.preferred_location || ''} onChange={e => setFormData({...formData, preferences: {...formData.preferences, preferred_location: e.target.value}})} className="h-8" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Role</span>
                  <span className="font-medium text-slate-900">{profile.preferences?.preferred_role || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Location</span>
                  <span className="font-medium text-slate-900">{profile.preferences?.preferred_location || '-'}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
