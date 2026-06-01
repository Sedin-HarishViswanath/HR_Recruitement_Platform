import { useState, useEffect } from 'react';
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
import { Plus, Search, MoreVertical, Shield, UserX, UserCheck, CheckCircle2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { unwrapArray } from '../../../shared/lib/response';

interface User {
  id: string;
  name: string;
  email: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
}

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Recruiter', password: '' });
  const [invitedLink, setInvitedLink] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

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
     try {
       await api.patch(`/companies/me/users/${user.id}/deactivate`);
       toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
       fetchUsers();
     } catch (err) {
       toast.error('Failed to update user status');
     }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-2.5 py-0.5"><Shield size={12} className="mr-1" /> Admin</Badge>;
      case 'Recruiter': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-0.5">Recruiter</Badge>;
      case 'Interviewer': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-2.5 py-0.5">Interviewer</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in bg-[#fafbfc] min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>User Management</h1>
          <p className="text-slate-500 mt-1 text-[13px]">Manage your team members and their access levels.</p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={(open) => {
          setIsInviteOpen(open);
          if (!open) {
            setInvitedLink(null);
            fetchUsers();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-violet-500 hover:bg-violet-700 text-white font-bold rounded-xl shadow-sm btn-premium">
              <Plus size={16} className="mr-1.5" /> Invite User
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
                  <p className="text-sm text-slate-500">
                    An email has been sent. You can also copy and share the invitation link directly:
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border">
                  <input
                    readOnly
                    value={invitedLink}
                    className="flex-1 bg-transparent text-xs text-slate-600 font-mono focus:outline-none overflow-x-auto"
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
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold"
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

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500">Loading users...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-500">No team members found.</TableCell></TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role_name)}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">Active</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-slate-200">Deactivated</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.is_active ? (
                            <><UserX size={14} className="mr-2" /> Deactivate</>
                          ) : (
                            <><UserCheck size={14} className="mr-2" /> Activate</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
