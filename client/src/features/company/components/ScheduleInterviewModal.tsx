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

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleInterviewModal = ({ isOpen, onClose, onSuccess }: ScheduleInterviewModalProps) => {
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

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [appsRes, usersRes] = await Promise.all([
        api.get('/applications'),
        api.get('/companies/me/users')
      ]);
      setApplications(appsRes.data.data?.data || appsRes.data.data || []);
      setInterviewers(usersRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load form data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.application_id || !formData.interviewer_id || !formData.date || !formData.time) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const scheduled_at = new Date(`${formData.date}T${formData.time}`).toISOString();

      await api.post('/interviews', {
        application_id: formData.application_id,
        round_type: formData.round_type,
        interviewer_id: formData.interviewer_id,
        scheduled_at,
        duration: Number(formData.duration),
        meeting_link: formData.meeting_link,
      });

      toast.success('Interview scheduled successfully');
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
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                    {app.candidate_name || app.user_name} - {app.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <Label>Round Type *</Label>
            <Select 
              value={formData.round_type} 
              onValueChange={(v) => setFormData({ ...formData, round_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="phone">Phone Screen</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="final">Final Round</SelectItem>
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
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm transition-all btn-premium">
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
