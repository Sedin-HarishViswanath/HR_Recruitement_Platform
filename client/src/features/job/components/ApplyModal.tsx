import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
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
  resume_url: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
  });

  const onSubmit = async (data: ApplyFormValues) => {
    try {
      setIsSubmitting(true);
      await api.post('/applications', {
        job_id: jobId,
        ...data,
      });
      toast.success('Application submitted successfully!');
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm transition-all btn-premium w-full">Apply Now</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
          <DialogDescription>
            Submit your application. Your default profile resume will be used.
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

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-center justify-between">
            <div className="text-sm">
              <p className="font-bold text-amber-900">Resume Attached</p>
              <p className="text-amber-700 font-medium">Using resume from your candidate profile.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm transition-all btn-premium">
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
