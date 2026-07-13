import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { unwrapArray } from '../../../shared/lib/response';
import { Cpu, Video, Info } from 'lucide-react';

const AUTOMATED_ROUNDS = ['aptitude', 'technical'];

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedApplicationId?: string;
}

export const ScheduleInterviewModal = ({ isOpen, onClose, onSuccess, preselectedApplicationId }: ScheduleInterviewModalProps) => {
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviewers, setInterviewers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    application_id: '',
    round_type: 'technical',
    interviewer_id: '',
    date: '',
    time: '',
    duration: 60,
    meeting_link: '',
  });

  const isAutomated = AUTOMATED_ROUNDS.includes(formData.round_type);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setFormData({
        application_id: preselectedApplicationId || '',
        round_type: 'technical',
        interviewer_id: '',
        date: '',
        time: '',
        duration: 60,
        meeting_link: '',
      });
    }
  }, [isOpen, preselectedApplicationId]);

  const fetchData = async () => {
    try {
      const [appsRes, usersRes] = await Promise.all([
        api.get('/applications'),
        api.get('/companies/me/users')
      ]);
      setApplications(unwrapArray(appsRes.data, ['applications']));
      setInterviewers(unwrapArray(usersRes.data, ['users']));
    } catch (err) {
      toast.error('Failed to load form data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.application_id) {
      toast.error('Please select a candidate application');
      return;
    }
    if (!isAutomated && (!formData.interviewer_id || !formData.date || !formData.time)) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const payload: Record<string, any> = {
        application_id: formData.application_id,
        round_type: formData.round_type,
        duration: Number(formData.duration),
      };

      if (!isAutomated) {
        payload.interviewer_id = formData.interviewer_id;
        payload.scheduled_at = new Date(`${formData.date}T${formData.time}`).toISOString();
        payload.meeting_link = formData.meeting_link;
      }

      await api.post('/interviews', payload);

      toast.success(isAutomated ? 'Assessment created — candidate can start it anytime' : 'Interview scheduled successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isAutomated
              ? <Cpu size={16} className="text-emerald-500" />
              : <Video size={16} className="text-emerald-500" />}
            <DialogTitle>
              {isAutomated ? 'Create Automated Assessment' : 'Schedule Live Interview'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Round Type — first so it drives the rest of the form */}
          <div className="space-y-2">
            <Label>Round Type *</Label>
            <Select
              value={formData.round_type}
              onValueChange={(v) => setFormData({ ...formData, round_type: v, interviewer_id: '', date: '', time: '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aptitude">Aptitude — Automated MCQ</SelectItem>
                <SelectItem value="technical">Technical — Automated Coding</SelectItem>
                <SelectItem value="hr">HR — Live Video</SelectItem>
                <SelectItem value="final">Final — Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Automated round info banner */}
          {isAutomated && (
            <div className="flex gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>No scheduling needed.</strong> The candidate will see a "Start Test" button and can take it anytime. Camera and tab-switch proctoring runs automatically.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Candidate Application *</Label>
            <Select
              value={formData.application_id}
              onValueChange={(v) => setFormData({ ...formData, application_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an application" />
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.candidate_name || app.user_name} — {app.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live-only fields */}
          {!isAutomated && (
            <>
              <div className="space-y-2">
                <Label>Interviewer *</Label>
                <Select
                  value={formData.interviewer_id}
                  onValueChange={(v) => setFormData({ ...formData, interviewer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an interviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Duration (mins)</Label>
            <Input
              type="number"
              min="15"
              max="180"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`font-bold rounded-xl shadow-sm transition-all text-white ${
                isAutomated
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
              }`}
            >
              {loading
                ? (isAutomated ? 'Creating...' : 'Scheduling...')
                : (isAutomated ? 'Create Assessment' : 'Schedule Interview')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
