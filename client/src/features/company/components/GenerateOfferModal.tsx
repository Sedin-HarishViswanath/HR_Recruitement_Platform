import { useState } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { FileText, DollarSign, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

interface GenerateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  application: {
    id: string;
    candidate_name: string;
    job_title: string;
  };
}

export const GenerateOfferModal = ({ isOpen, onClose, onSuccess, application }: GenerateOfferModalProps) => {
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!salary || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/applications/${application.id}/offer`, {
        salary: parseFloat(salary),
        currency,
        start_date: startDate,
        additional_terms: additionalTerms,
      });
      toast.success('Offer letter generated and sent to candidate!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} className="text-emerald-500" />
            <span>Generate Offer Letter</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
          <p className="text-xs font-bold text-emerald-800">Candidate: {application.candidate_name}</p>
          <p className="text-[11px] text-emerald-700/70 font-medium">Position: {application.job_title}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Annual Salary *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <DollarSign size={16} />
              </div>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-500 focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Start Date *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Additional Terms & Benefits
            </label>
            <textarea
              value={additionalTerms}
              onChange={(e) => setAdditionalTerms(e.target.value)}
              placeholder="E.g., Stock options, health insurance, sign-on bonus..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Generating...' : 'Send Offer'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
