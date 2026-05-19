import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const step1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  location: z.string().optional(),
  date_of_birth: z.string().optional(),
  about_me: z.string().max(300, 'About me must be less than 300 characters').optional(),
});

const step2Schema = z.object({
  summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
  resume_drive_link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const step3Schema = z.object({
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  leetcode_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  other_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const step4Schema = z.object({
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  preferred_role: z.string().optional(),
  preferred_location: z.string().optional(),
});

export const CandidateOnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const navigate = useNavigate();

  const { register: reg1, handleSubmit: handle1, setValue: set1, formState: { errors: err1 } } = useForm({ resolver: zodResolver(step1Schema) });
  const { register: reg2, handleSubmit: handle2, setValue: set2, formState: { errors: err2 } } = useForm({ resolver: zodResolver(step2Schema) });
  const { register: reg3, handleSubmit: handle3, setValue: set3 } = useForm({ resolver: zodResolver(step3Schema) });
  const { register: reg4, handleSubmit: handle4, setValue: set4, formState: { errors: err4 } } = useForm({ resolver: zodResolver(step4Schema) });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/candidate/profile');
        const profile = data.data;
        if (profile) {
          // Pre-fill Step 1
          set1('name', profile.name || '');
          set1('phone', profile.phone || '');
          set1('location', profile.location || '');
          set1('date_of_birth', profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '');
          set1('about_me', profile.about_me || '');

          // Pre-fill Step 2
          set2('summary', profile.summary || '');
          set2('resume_drive_link', profile.resume_drive_link || '');

          // Pre-fill Step 3
          set3('github_url', profile.github_url || '');
          set3('linkedin_url', profile.linkedin_url || '');
          set3('portfolio_url', profile.portfolio_url || '');
          set3('leetcode_url', profile.leetcode_url || '');
          set3('other_url', profile.other_url || '');

          // Pre-fill Step 4
          const prefs = profile.preferences || {};
          set4('preferred_role', prefs.preferred_role || '');
          set4('preferred_location', prefs.preferred_location || '');
          set4('salary_min', prefs.salary_min ? String(prefs.salary_min) : '');
          set4('salary_max', prefs.salary_max ? String(prefs.salary_max) : '');
          if (profile.skills) {
            setSkills(profile.skills);
            set4('skills', profile.skills);
          }

          if (profile.current_step && profile.current_step <= 4) {
            setStep(profile.current_step);
          } else if (profile.onboarding_completed) {
             navigate('/candidate/dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [set1, set2, set3, set4, navigate]);

  const onStep1Submit = async (data: any) => {
    try {
      await api.patch('/candidate/profile/step/1', data);
      setStep(2);
    } catch (err) { toast.error('Failed to save progress'); }
  };

  const onStep2Submit = async (data: any) => {
    try {
      await api.patch('/candidate/profile/step/2', data);
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        await api.post('/candidate/me/resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setStep(3);
    } catch (err) { toast.error('Failed to save progress'); }
  };

  const onStep3Submit = async (data: any) => {
    try {
      await api.patch('/candidate/profile/step/3', data);
      setStep(4);
    } catch (err) { toast.error('Failed to save progress'); }
  };

  const onStep4Submit = async (data: any) => {
    try {
      const payload = {
        ...data,
        salary_min: data.salary_min ? Number(data.salary_min) : undefined,
        salary_max: data.salary_max ? Number(data.salary_max) : undefined,
      };
      await api.patch('/candidate/profile/step/4', payload);
      toast.success('Profile completed!');
      navigate('/candidate/dashboard');
    } catch (err) { toast.error('Failed to complete profile'); }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const newSkills = [...skills, skillInput.trim()];
      if (!skills.includes(skillInput.trim())) {
        setSkills(newSkills);
        set4('skills', newSkills);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const newSkills = skills.filter(s => s !== skill);
    setSkills(newSkills);
    set4('skills', newSkills);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border p-8">
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Step {step} of 4</span>
            <span className="text-sm font-medium text-blue-600">
              {step === 1 && 'Personal Info'}
              {step === 2 && 'Resume & Summary'}
              {step === 3 && 'Professional Links'}
              {step === 4 && 'Preferences & Skills'}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handle1(onStep1Submit)} className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...reg1('name')} />
                {err1.name && <p className="text-red-500 text-xs">{err1.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input {...reg1('phone')} />
                {err1.phone && <p className="text-red-500 text-xs">{err1.phone.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...reg1('location')} placeholder="City, State" />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" {...reg1('date_of_birth')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>About Me</Label>
              <Textarea {...reg1('about_me')} placeholder="A short bio..." className="h-24" />
              {err1.about_me && <p className="text-red-500 text-xs">{err1.about_me.message as string}</p>}
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Continue</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handle2(onStep2Submit)} className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
              <Label>Resume Upload</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                <Input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  id="resume-upload"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                <Label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <span className="text-blue-600 font-medium hover:underline">Click to upload PDF</span>
                  <p className="text-xs text-slate-500 mt-1">Max 5MB</p>
                </Label>
                {resumeFile && <p className="mt-3 text-sm font-medium text-slate-700">Selected: {resumeFile.name}</p>}
              </div>
              
              <div className="text-center text-sm text-slate-500 my-2">OR</div>
              
              <div className="space-y-2">
                <Label>Resume Drive Link</Label>
                <Input {...reg2('resume_drive_link')} placeholder="https://drive.google.com/..." />
                {err2.resume_drive_link && <p className="text-red-500 text-xs">{err2.resume_drive_link.message as string}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Professional Summary</Label>
              <Textarea {...reg2('summary')} placeholder="Summarize your professional experience..." className="h-32" />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Continue</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handle3(onStep3Submit)} className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>LinkedIn Profile</Label>
                <Input {...reg3('linkedin_url')} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-2">
                <Label>GitHub Profile</Label>
                <Input {...reg3('github_url')} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Portfolio Website</Label>
                <Input {...reg3('portfolio_url')} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>LeetCode Profile</Label>
                <Input {...reg3('leetcode_url')} placeholder="https://leetcode.com/..." />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Continue</Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handle4(onStep4Submit)} className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Top Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map(skill => (
                    <span key={skill} className="bg-blue-100 text-blue-800 text-sm px-2.5 py-1 rounded-md flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)}><X size={14} /></button>
                    </span>
                  ))}
                </div>
                <Input 
                  value={skillInput} 
                  onChange={e => setSkillInput(e.target.value)} 
                  onKeyDown={handleAddSkill}
                  placeholder="Type a skill and press Enter" 
                />
                {err4.skills && <p className="text-red-500 text-xs">{err4.skills.message as string}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Role</Label>
                  <Input {...reg4('preferred_role')} placeholder="e.g. Full Stack Developer" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Location</Label>
                  <Input {...reg4('preferred_location')} placeholder="e.g. Remote, NYC" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Salary Min</Label>
                  <Input type="number" {...reg4('salary_min')} placeholder="50000" />
                </div>
                <div className="space-y-2">
                  <Label>Expected Salary Max</Label>
                  <Input type="number" {...reg4('salary_max')} placeholder="120000" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Complete Profile</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
