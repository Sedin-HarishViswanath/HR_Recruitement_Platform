import { useState } from 'react';
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
  DialogDescription,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

interface RescheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  interviewId: string;
  interviewType: string;
  companyName: string;
}

export const RescheduleRequestModal = ({
  isOpen,
  onClose,
  onSuccess,
  interviewId,
  interviewType,
  companyName,
}: RescheduleRequestModalProps) => {
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      toast.error('Reason must be at least 5 characters');
      return;
    }
    if (!preferredDate) {
      toast.error('Please select your preferred date and time');
      return;
    }

    try {
      setIsSubmitting(true);
      // Backend expects: reason: string, preferred_date: string (ISO string)
      await api.post(`/interviews/${interviewId}/reschedule-request`, {
        reason: reason.trim(),
        preferred_date: new Date(preferredDate).toISOString(),
      });
      toast.success('Reschedule request submitted successfully!');
      setReason('');
      setPreferredDate('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit reschedule request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }} className="text-lg font-black text-stone-900">
            Request Interview Reschedule
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Please suggest a preferred date and time for your {interviewType || 'technical'} interview with {companyName || 'the company'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">Preferred Date & Time *</Label>
            <Input
              type="datetime-local"
              required
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full text-stone-700 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">Reason for Rescheduling *</Label>
            <Textarea
              required
              placeholder="e.g. I have a conflict with my current university exam or work shift at this time."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[100px] text-stone-700 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <p className="text-[10px] text-stone-400">At least 5 characters. The hiring manager will review and approve or reject this request.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border border-stone-200 text-xs font-bold px-4 py-2 hover:bg-stone-50 text-stone-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-sm transition-all btn-premium px-4 py-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
