import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

interface SubmitFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  interview: {
    id: string;
    candidate_name?: string;
    job_title?: string;
    round_type?: string;
  };
}

const recommendationOptions = [
  { value: 'strong_hire', label: 'Strong Hire', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'ðŸŒŸ' },
  { value: 'hire', label: 'Hire', color: 'bg-green-50 text-green-700 border-green-200', icon: 'ðŸ‘' },
  { value: 'no_hire', label: 'No Hire', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'ðŸ‘Ž' },
  { value: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-50 text-red-700 border-red-200', icon: 'ðŸš«' },
];

export const SubmitFeedbackModal = ({ isOpen, onClose, onSuccess, interview }: SubmitFeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredStar(0);
      setStrengths('');
      setWeaknesses('');
      setRecommendation('');
      setAdditionalComments('');
      setSubmitting(false);
    }
  }, [isOpen]);

  // Guard against accidentally closing a partially-filled form
  const isDirty =
    rating > 0 ||
    strengths.trim().length > 0 ||
    weaknesses.trim().length > 0 ||
    recommendation !== '' ||
    additionalComments.trim().length > 0;

  const handleClose = () => {
    if (isDirty && !submitting) {
      const confirmed = window.confirm(
        'You have unsaved feedback. Are you sure you want to close without submitting?'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    if (strengths.trim().length < 10) {
      toast.error('Please describe strengths (at least 10 characters)');
      return;
    }
    if (weaknesses.trim().length < 10) {
      toast.error('Please describe areas for improvement (at least 10 characters)');
      return;
    }
    if (!recommendation) {
      toast.error('Please select a recommendation');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/interviews/${interview.id}/feedback`, {
        rating,
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        recommendation,
        additional_comments: additionalComments.trim() || undefined,
      });
      toast.success('Feedback submitted successfully!');
      onSuccess();
      onClose();
      // Reset form
      setRating(0);
      setStrengths('');
      setWeaknesses('');
      setRecommendation('');
      setAdditionalComments('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit feedback';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare size={20} className="text-violet-500" />
            <span>Submit Interview Feedback</span>
          </DialogTitle>
        </DialogHeader>

        {/* Candidate Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(interview.candidate_name || 'C')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{interview.candidate_name || 'Candidate'}</p>
            <p className="text-xs text-slate-500 font-medium">{interview.job_title || 'Position'} Â· {(interview.round_type || 'Interview').charAt(0).toUpperCase() + (interview.round_type || 'Interview').slice(1)} Round</p>
          </div>
        </div>

        <div className="space-y-5 pt-2">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={28}
                    className={`transition-colors duration-150 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-amber-400 text-violet-400'
                        : 'text-slate-200 hover:text-slate-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-bold text-slate-600">
                  {rating}/5 â€” {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <ThumbsUp size={13} className="text-emerald-500" />
              Strengths *
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What did the candidate do well? Technical skills, communication, problem-solving..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-violet-400 transition-all resize-none placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{strengths.length}/2000 characters (min 10)</p>
          </div>

          {/* Weaknesses */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <ThumbsDown size={13} className="text-red-400" />
              Areas for Improvement *
            </label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="Where could the candidate improve? Knowledge gaps, communication issues..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-violet-400 transition-all resize-none placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{weaknesses.length}/2000 characters (min 10)</p>
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recommendation *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {recommendationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecommendation(opt.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    recommendation === opt.value
                      ? `${opt.color} border-current shadow-sm scale-[1.02]`
                      : 'bg-white border-slate-150 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Additional Comments <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Any additional notes for the hiring team..."
              rows={2}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-violet-400 transition-all resize-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !recommendation}
            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 rounded-xl shadow-sm shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
