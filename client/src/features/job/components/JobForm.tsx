import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const jobFormSchema = z.object({
  title: z.string().min(3, 'Title is required (min 3 characters)').max(200),
  description: z.string().min(50, 'Description is required (min 50 characters)'),
  department: z.string().optional(),
  location: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
  experience_level: z.enum(['entry', 'mid', 'senior']).default('mid'),
  required_skills: z.array(z.string()).default([]),
  salary_min: z.number().positive().optional().or(z.literal('')),
  salary_max: z.number().positive().optional().or(z.literal('')),
  deadline: z.string().optional(),
  remote: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema as any), // Zod union type issues with empty strings workaround
    defaultValues: initialData || {
      employment_type: 'full_time',
      experience_level: 'mid',
      required_skills: [],
      remote: false,
      status: 'draft',
    }
  });

  const skills = watch('required_skills');
  const remote = watch('remote');

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !skillInput.trim()) return;
    e.preventDefault();
    const newSkill = skillInput.trim();
    if (!skills.includes(newSkill)) {
      setValue('required_skills', [...skills, newSkill]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue('required_skills', skills.filter(s => s !== skillToRemove));
  };

  const handleFormSubmit = async (data: JobFormValues) => {
    try {
      setIsSubmitting(true);
      // Clean up empty strings for numbers
      const cleanedData = {
        ...data,
        salary_min: data.salary_min === '' ? undefined : Number(data.salary_min),
        salary_max: data.salary_max === '' ? undefined : Number(data.salary_max),
      };
      await onSubmit(cleanedData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label>Job Title <span className="text-red-500">*</span></Label>
          <Input {...register('title')} placeholder="e.g. Senior Frontend Engineer" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Input {...register('department')} placeholder="e.g. Engineering" />
        </div>

        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select value={watch('employment_type')} onValueChange={(v: any) => setValue('employment_type', v)}>
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label>Location</Label>
          <Input {...register('location')} placeholder="e.g. San Francisco, CA" disabled={remote} />
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox 
              id="remote" 
              checked={remote} 
              onCheckedChange={(checked) => setValue('remote', checked as boolean)} 
            />
            <label htmlFor="remote" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              This is a remote position
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Experience Level</Label>
          <Select value={watch('experience_level')} onValueChange={(v: any) => setValue('experience_level', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Required Skills</Label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {skills.map(skill => (
              <span key={skill} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-blue-900">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              value={skillInput} 
              onChange={e => setSkillInput(e.target.value)} 
              onKeyDown={handleAddSkill}
              placeholder="e.g. React, Node.js (Press Enter to add)" 
            />
            <Button type="button" variant="secondary" onClick={handleAddSkill}>Add</Button>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Job Description <span className="text-red-500">*</span></Label>
          <Textarea 
            {...register('description')} 
            placeholder="Describe the responsibilities, requirements, and benefits..." 
            className="min-h-[200px]"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Salary Range (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input type="number" {...register('salary_min')} placeholder="Min" />
            <span className="text-slate-400">-</span>
            <Input type="number" {...register('salary_max')} placeholder="Max" />
          </div>
          {errors.salary_max && <p className="text-red-500 text-sm">{errors.salary_max.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Application Deadline</Label>
          <Input type="date" {...register('deadline')} />
          {errors.deadline && <p className="text-red-500 text-sm">{errors.deadline.message as string}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => {
            setValue('status', 'draft');
            handleSubmit(handleFormSubmit)();
          }}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setValue('status', 'published')}
          disabled={isSubmitting}
        >
          Publish Job
        </Button>
      </div>
    </form>
  );
};
