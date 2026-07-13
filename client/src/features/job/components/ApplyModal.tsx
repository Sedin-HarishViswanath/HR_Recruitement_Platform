import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

const applyFormSchema = z.object({
  cover_note: z.string().max(500, 'Cover note must be less than 500 characters').optional(),
});

type ApplyFormValues = z.infer<typeof applyFormSchema>;

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export const ApplyModal = ({ jobId, jobTitle, onSuccess, trigger }: ApplyModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
  });

  const onSubmit = async (data: ApplyFormValues) => {
    if (!resumeFile) {
      toast.error('Please upload a resume in PDF format');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('job_id', jobId);
      if (data.cover_note) {
        formData.append('cover_note', data.cover_note);
      }
      formData.append('resume', resumeFile);

      await api.post('/applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Application submitted successfully!');
      setIsOpen(false);
      setResumeFile(null);
      reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setResumeFile(null);
        reset();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-sm transition-all btn-premium w-full">Apply Now</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
          <DialogDescription>
            Submit your application with a custom resume for this position.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Cover Note (Optional)</Label>
            <Textarea 
              {...register('cover_note')} 
              placeholder="Why are you a good fit for this role?" 
              className="min-h-[150px]"
            />
            {errors.cover_note && <p className="text-red-500 text-sm">{errors.cover_note.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-upload">Resume (PDF only) *</Label>
            <Input
              id="resume-upload"
              type="file"
              accept=".pdf"
              required
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.type !== 'application/pdf') {
                    toast.error('Only PDF files are allowed');
                    e.target.value = '';
                    setResumeFile(null);
                  } else {
                    setResumeFile(file);
                  }
                }
              }}
              className="cursor-pointer"
            />
            <p className="text-xs text-stone-400">Each application requires a target PDF resume.</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-sm transition-all btn-premium">
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
