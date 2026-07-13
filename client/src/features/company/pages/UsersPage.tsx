import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, MoreVertical, Shield, UserX, UserCheck, CheckCircle2, Users, UserCog, UserCheck2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { unwrapArray } from '../../../shared/lib/response';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';

const GRADIENTS = [
  'from-emerald-500 to-emerald-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-emerald-500',
];

interface User {
  id: string;
  name: string;
  email: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
}

export const UsersPage = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Recruiter', password: '' });
  const [invitedLink, setInvitedLink] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const metrics = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role_name === 'Admin').length,
    recruiters: users.filter(u => u.role_name === 'Recruiter').length,
    interviewers: users.filter(u => u.role_name === 'Interviewer').length,
  }), [users]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/companies/me/users', {
        params: { search: search || undefined }
      });
      setUsers(unwrapArray<User>(data, ['users']));
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInviting) return;
    setIsInviting(true);
    try {
      const res = await api.post('/companies/me/users/invite', inviteData);
      toast.success('User invited successfully');
      setInvitedLink(res.data.data.inviteLink);
      setInviteData({ name: '', email: '', role: 'Recruiter', password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot deactivate your own account.');
      return;
    }
    try {
      await api.patch(`/companies/me/users/${user.id}/deactivate`);
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update user status');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2.5 py-0.5"><Shield size={12} className="mr-1" /> Admin</Badge>;
      case 'Recruiter': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-0.5">Recruiter</Badge>;
      case 'Interviewer': return <Badge className="bg-stone-100 text-stone-700 hover:bg-stone-100 border-none px-2.5 py-0.5">Interviewer</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Workspace Header ── */}
      <div className="topbar-frost px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
            Workspace &rsaquo; <span className="text-stone-600">Team</span>
          </p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>Team</h1>
            <span className="text-xs text-stone-400 font-medium">{users.length} members</span>
          </div>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={(open) => {
          setIsInviteOpen(open);
          if (!open) {
            setInvitedLink(null);
            fetchUsers();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm btn-premium text-xs h-9 px-4">
              <Plus size={14} className="mr-1.5" /> Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {invitedLink ? (
              <div className="space-y-6 py-4 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-center text-xl font-bold">User Invited Successfully!</DialogTitle>
                  <p className="text-sm text-stone-500">
                    An email has been sent. You can also copy and share the invitation link directly:
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border">
                  <input
                    readOnly
                    value={invitedLink}
                    className="flex-1 bg-transparent text-xs text-stone-600 font-mono focus:outline-none overflow-x-auto"
                  />
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(invitedLink);
                      toast.success('Link copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <Button
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold"
                  onClick={() => {
                    setIsInviteOpen(false);
                    setInvitedLink(null);
                    fetchUsers();
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Invite a new team member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required value={inviteData.name} onChange={e => setInviteData({...inviteData, name: e.target.value})} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input required type="email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} placeholder="john@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteData.role} onValueChange={v => setInviteData({...inviteData, role: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recruiter">Recruiter</SelectItem>
                        <SelectItem value="Interviewer">Interviewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <Input required type="password" value={inviteData.password} onChange={e => setInviteData({...inviteData, password: e.target.value})} />
                  </div>
                  <Button type="submit" disabled={isInviting} className="w-full">
                    {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto space-y-5 flex-1 animate-fade-in-up">

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: metrics.total, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Active', value: metrics.active, icon: UserCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Recruiters', value: metrics.recruiters, icon: UserCog, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
            { label: 'Interviewers', value: metrics.interviewers, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="metric-card p-4 group cursor-default">
                <div className="metric-card-accent" />
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg} border ${card.border}`}>
                    <Icon size={15} className={card.color} />
                  </div>
                  <p className="text-[9.5px] font-black text-stone-400 uppercase tracking-[0.12em] pt-0.5 text-right">{card.label}</p>
                </div>
                <p className="text-[28px] font-extrabold text-stone-900 leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {loading ? '—' : card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Search Toolbar ── */}
        <div className="surface-raised !rounded-xl p-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={13} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 font-medium text-stone-700 placeholder:text-stone-400 transition-all"
            />
          </div>
        </div>

        {/* ── Users Table ── */}
        <div className="surface-raised !rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow>
                <TableHead className="w-[300px] text-[10px] font-semibold uppercase tracking-wider text-stone-500">Member</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Role</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Status</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Joined</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-stone-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-stone-400 font-medium">Loading team...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Users size={28} className="mx-auto text-stone-200 mb-2" />
                    <p className="text-sm font-bold text-stone-600">No team members found</p>
                    <p className="text-xs text-stone-400 mt-1">Invite your first team member to get started.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, i) => (
                  <TableRow key={user.id} className="hover:bg-stone-50/50 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-white font-extrabold text-[11px] shrink-0 shadow-sm`}>
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-stone-900 group-hover:text-emerald-700 transition-colors">{user.name}</p>
                          <p className="text-[10.5px] text-stone-400 font-semibold">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role_name)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[9.5px] font-bold">Active</Badge>
                      ) : (
                        <Badge className="bg-stone-100 text-stone-500 hover:bg-stone-100 border-stone-200 text-[9.5px] font-bold">Deactivated</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-stone-500 font-semibold">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={15} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.id !== currentUser?.id && (
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600 text-xs"
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.is_active ? (
                                <><UserX size={13} className="mr-2" /> Deactivate</>
                              ) : (
                                <><UserCheck size={13} className="mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </main>
    </div>
  );
};
