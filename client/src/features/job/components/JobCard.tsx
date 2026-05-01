import { formatDistanceToNow } from 'date-fns';
import { 
  MapPin, 
  Users, 
  Briefcase, 
  Edit, 
  Eye, 
  Trash2, 
  MoreVertical 
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: 'draft' | 'published' | 'closed';
  applicant_count: number;
  created_at: string;
  remote?: boolean;
}

interface JobCardProps {
  job: Job;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, status: string) => void;
}

export const JobCard = ({ job, onEdit, onView, onDelete, onChangeStatus }: JobCardProps) => {
  const getStatusBadge = () => {
    switch (job.status) {
      case 'published': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Published</Badge>;
      case 'draft': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Draft</Badge>;
      case 'closed': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Closed</Badge>;
      default: return null;
    }
  };

  const getEmploymentType = (type: string) => {
    const format: Record<string, string> = {
      full_time: 'Full-Time',
      part_time: 'Part-Time',
      contract: 'Contract',
      internship: 'Internship'
    };
    return format[type] || type;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge()}
            {job.department && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {job.department}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onView(job.id)}>
            {job.title}
          </h3>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-900">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onView(job.id)}><Eye className="mr-2" size={14}/> View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(job.id)}><Edit className="mr-2" size={14}/> Edit Job</DropdownMenuItem>
            
            {job.status === 'draft' && <DropdownMenuItem onClick={() => onChangeStatus(job.id, 'published')}>Publish Job</DropdownMenuItem>}
            {job.status === 'published' && <DropdownMenuItem onClick={() => onChangeStatus(job.id, 'closed')}>Close Job</DropdownMenuItem>}
            {job.status === 'closed' && <DropdownMenuItem onClick={() => onChangeStatus(job.id, 'published')}>Reopen Job</DropdownMenuItem>}
            
            <DropdownMenuItem onClick={() => onDelete(job.id)} className="text-red-600 focus:text-red-600 border-t mt-1 pt-1">
              <Trash2 className="mr-2" size={14}/> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex items-center text-sm text-slate-500">
          <MapPin size={14} className="mr-2 text-slate-400" />
          <span className="line-clamp-1">{job.remote ? 'Remote' : job.location || 'Location unassigned'}</span>
        </div>
        <div className="flex items-center text-sm text-slate-500">
          <Briefcase size={14} className="mr-2 text-slate-400" />
          <span>{getEmploymentType(job.employment_type)}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
        <div className="flex items-center text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded-md">
          <Users size={14} className="mr-1.5 text-slate-400" />
          {job.applicant_count || 0} applicants
        </div>
        <span className="text-slate-400 text-xs">
          Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};
