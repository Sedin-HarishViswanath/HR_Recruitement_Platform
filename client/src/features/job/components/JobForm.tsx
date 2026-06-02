import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { X, Sparkles, Loader2, CheckCircle2, Wand2 } from 'lucide-react';

const jobFormSchema = z.object({
  title: z.string().min(3, 'Title is required (min 3 characters)').max(200),
  description: z.string().min(50, 'Description is required (min 50 characters)'),
  department: z.string().optional(),
  location: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
  experience_level: z.enum(['entry', 'mid', 'senior']).default('mid'),
  required_skills: z.array(z.string()).default([]),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  deadline: z.string().optional(),
  remote: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  interview_rounds: z.number().int().min(1).max(10).default(1),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const JobForm = ({ initialData, onSubmit, onCancel }: JobFormProps) => {
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  const {
    register, handleSubmit, setValue, watch, formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema as any),
    defaultValues: initialData || {
      employment_type: 'full_time',
      experience_level: 'mid',
      required_skills: [],
      remote: false,
      status: 'draft',
      interview_rounds: 1,
    },
  });

  const skills = watch('required_skills');
  const remote = watch('remote');
  const titleValue = watch('title');

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.includes(s)) setValue('required_skills', [...skills, s]);
    setSkillInput('');
  };

  const handleRemoveSkill = (s: string) =>
    setValue('required_skills', skills.filter(x => x !== s));

  // ── AI generate description ──────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!titleValue || titleValue.trim().length < 3) {
      toast.error('Enter a job title first before generating a description.');
      return;
    }
    setIsGenerating(true);
    setAiApplied(false);
    try {
      const { data } = await api.post('/jobs/generate-description', {
        title: titleValue,
        department: watch('department'),
        experience_level: watch('experience_level'),
        employment_type: watch('employment_type'),
        location: watch('location'),
        skills,
      });

      const result = data.data;
      if (result.description) setValue('description', result.description);

      if (result.suggested_skills?.length) {
        const merged = Array.from(new Set([...skills, ...result.suggested_skills]));
        setValue('required_skills', merged);
      }

      if (result.salary_min) setValue('salary_min', result.salary_min);
      if (result.salary_max) setValue('salary_max', result.salary_max);

      setAiApplied(true);
      toast.success('AI generated your job description, skills, and salary range.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = async (data: JobFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...data,
        salary_min: data.salary_min || undefined,
        salary_max: data.salary_max || undefined,
      });
    } catch {
      // error handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* ── AI banner ── */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/60 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <Sparkles size={15} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-violet-900">AI-Assisted Job Posting</p>
            <p className="text-[11px] text-violet-500 font-medium">Fill in the title, then let Gemini write the description, skills, and salary.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !titleValue || titleValue.trim().length < 3}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.97]"
        >
          {isGenerating
            ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
            : aiApplied
            ? <><CheckCircle2 size={13} /> Regenerate</>
            : <><Wand2 size={13} /> Generate with AI</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Title */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Job Title <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register('title')}
            placeholder="e.g. Senior Frontend Engineer"
            className="h-10 text-sm rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-200"
          />
          {errors.title && <p className="text-red-500 text-xs">{errors.title.message as string}</p>}
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Department</Label>
          <Input {...register('department')} placeholder="e.g. Engineering" className="h-10 text-sm rounded-xl border-slate-200" />
        </div>

        {/* Employment Type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Employment Type</Label>
          <Select value={watch('employment_type')} onValueChange={(v: any) => setValue('employment_type', v)}>
            <SelectTrigger className="h-10 text-sm rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full-Time</SelectItem>
              <SelectItem value="part_time">Part-Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Location</Label>
          <Input {...register('location')} placeholder="e.g. San Francisco, CA" disabled={remote} className="h-10 text-sm rounded-xl border-slate-200 disabled:opacity-50" />
          <div className="flex items-center gap-2 mt-1">
            <Checkbox id="remote" checked={remote} onCheckedChange={(v) => setValue('remote', v as boolean)} />
            <label htmlFor="remote" className="text-xs font-medium text-slate-600 cursor-pointer select-none">Remote position</label>
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Experience Level</Label>
          <Select value={watch('experience_level')} onValueChange={(v: any) => setValue('experience_level', v)}>
            <SelectTrigger className="h-10 text-sm rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interview Rounds */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Interview Rounds <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number" min="1" max="10"
            {...register('interview_rounds', { valueAsNumber: true })}
            placeholder="e.g. 3"
            className="h-10 text-sm rounded-xl border-slate-200"
          />
          {errors.interview_rounds && <p className="text-red-500 text-xs">{errors.interview_rounds.message as string}</p>}
        </div>

        {/* Required Skills */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Required Skills</Label>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1 bg-violet-50 text-violet-800 border border-violet-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-600 cursor-pointer transition-colors ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="Type a skill and press Enter..."
              className="h-10 text-sm rounded-xl border-slate-200 flex-1"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="h-10 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Job Description <span className="text-red-500">*</span>
            </Label>
            {aiApplied && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                <Sparkles size={9} /> AI-generated
              </span>
            )}
          </div>
          <Textarea
            {...register('description')}
            placeholder="Describe responsibilities, requirements, and benefits... (or use Generate with AI above)"
            className="min-h-[220px] text-sm rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-200 font-mono text-xs leading-relaxed"
          />
          {errors.description && <p className="text-red-500 text-xs">{errors.description.message as string}</p>}
        </div>

        {/* Salary */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Salary Range (USD / year)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              {...register('salary_min', { setValueAs: v => v === '' || isNaN(v) ? undefined : parseInt(v, 10) })}
              placeholder="Min"
              className="h-10 text-sm rounded-xl border-slate-200"
            />
            <span className="text-slate-400 font-bold shrink-0">—</span>
            <Input
              type="number"
              {...register('salary_max', { setValueAs: v => v === '' || isNaN(v) ? undefined : parseInt(v, 10) })}
              placeholder="Max"
              className="h-10 text-sm rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Application Deadline</Label>
          <Input type="date" {...register('deadline')} className="h-10 text-sm rounded-xl border-slate-200" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { setValue('status', 'draft'); handleSubmit(handleFormSubmit)(); }}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="submit"
          onClick={() => setValue('status', 'published')}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-violet-200 disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Publishing...</span>
          ) : 'Publish Job'}
        </button>
      </div>
    </form>
  );
};
