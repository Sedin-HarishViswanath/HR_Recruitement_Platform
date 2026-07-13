import {
  MapPin,
  Users,
  BriefcaseBusiness,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
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
  const isClosed = job.status === 'closed';
  const isDraft = job.status === 'draft';

  return (
    <div className="metric-card p-5 flex flex-col group cursor-default">
      {/* Top Row: Icon + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors group-hover:scale-105 ${
          isClosed
            ? 'bg-stone-50 text-stone-400 border-stone-100'
            : isDraft
            ? 'bg-amber-50 text-amber-500 border-amber-100'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          <BriefcaseBusiness size={17} />
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          isClosed
            ? 'bg-stone-50 text-stone-500 border-stone-200'
            : isDraft
            ? 'bg-amber-50 text-amber-600 border-amber-200'
            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
          {isClosed ? 'Closed' : isDraft ? 'Draft' : 'Open'}
        </span>
      </div>

      {/* Title + Department */}
      <div className="mb-4">
        <h3 className="text-[14px] font-bold text-stone-900 leading-tight group-hover:text-emerald-700 transition-colors">
          {job.title}
        </h3>
        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{job.department}</p>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 mb-5 text-[11px] text-stone-500 font-medium">
        <span className="flex items-center gap-1">
          <MapPin size={11} className="text-stone-400" />
          {job.remote ? 'Remote' : job.location || 'Remote'}
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} className="text-stone-400" />
          {job.applicant_count || 0} applicants
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone-100">
        <button
          onClick={() => onView(job.id)}
          className="text-[11.5px] font-semibold text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer"
        >
          View Pipeline
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5 border-stone-200 shadow-lg">
            <DropdownMenuItem onClick={() => onView(job.id)} className="rounded-lg text-[12px] font-semibold cursor-pointer">
              <Eye className="mr-2" size={14} /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(job.id)} className="rounded-lg text-[12px] font-semibold cursor-pointer">
              <Edit className="mr-2" size={14} /> Edit Job
            </DropdownMenuItem>
            <div className="h-px bg-stone-100 my-1" />
            <DropdownMenuItem
              onClick={() => onChangeStatus(job.id, isClosed ? 'published' : 'closed')}
              className="rounded-lg text-[12px] font-semibold cursor-pointer"
            >
              {isClosed ? 'Reopen Job' : 'Close Job'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(job.id)}
              className="rounded-lg text-[12px] font-semibold text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="mr-2" size={14} /> Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
