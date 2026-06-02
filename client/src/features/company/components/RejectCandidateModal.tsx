import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { XCircle, MessageSquare } from 'lucide-react';

const REJECTION_REASONS = [
  'Not enough experience',
  'Skills mismatch',
  'Position filled internally',
  'Salary expectations too high',
  'Cultural fit concerns',
  'Candidate withdrew',
  'Other',
];

interface RejectCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, message: string) => Promise<void>;
  candidateName: string;
  jobTitle?: string;
}

export const RejectCandidateModal = ({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  jobTitle,
}: RejectCandidateModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedReason) return;
    setLoading(true);
    try {
      await onConfirm(selectedReason, customMessage.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                Reject Candidate
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {candidateName}{jobTitle ? ` · ${jobTitle}` : ''}
              </p>
            </div>
          </div>

          {/* Reason picker */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for rejection</p>
            <div className="grid grid-cols-1 gap-1.5">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`text-left px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer ${
                    selectedReason === reason
                      ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Optional message */}
          <div className="mt-4">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <MessageSquare size={11} />
              Personal message <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal note to send with the rejection email..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-[12px] border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none placeholder:text-slate-400 font-medium text-slate-700"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason || loading}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rejecting...
              </span>
            ) : 'Reject Candidate'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
