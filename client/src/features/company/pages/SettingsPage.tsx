import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../../../shared/lib/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Building2, Mail, MapPin } from 'lucide-react';

const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name is too short'),
  domain: z.string().min(3, 'Domain is required'),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
  industry: z.string().min(1, 'Industry is required'),
  bio: z.string().max(500, 'Bio is too long').optional().or(z.literal('')),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  contact_email: z.string().email('Invalid contact email').optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof companySettingsSchema>;

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'Admin';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'location'>('general');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/companies/me/profile');
        if (res.data.success && res.data.data) {
          const profile = res.data.data;
          reset({
            name: profile.name || '',
            domain: profile.domain || '',
            company_size: profile.company_size || '11-50',
            industry: profile.industry || '',
            bio: profile.bio || '',
            website_url: profile.website_url || '',
            address_line1: profile.address_line1 || '',
            address_line2: profile.address_line2 || '',
            city: profile.city || '',
            state: profile.state || '',
            country: profile.country || '',
            postal_code: profile.postal_code || '',
            contact_email: profile.contact_email || '',
            contact_phone: profile.contact_phone || '',
          });
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load company settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const res = await api.patch('/companies/me/profile', data);
      if (res.data.success) {
        toast.success('Company profile updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-1">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Workspace Header Bar */}
      <div className="topbar-frost px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Settings</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Company Settings
          </h1>
          {!isAdmin && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold ml-3">
              View only — contact your Admin to make changes
            </span>
          )}
        </div>
      </div>

      <main className="p-5 max-w-[1200px] w-full mx-auto animate-fade-in flex-1 flex flex-col">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          
          {/* Navigation tabs panel on left */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-1 shadow-sm shrink-0">
            {[
              { id: 'general', label: 'General Information', icon: Building2 },
              { id: 'contact', label: 'Contact Information', icon: Mail },
              { id: 'location', label: 'Address & Location', icon: MapPin },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} className={activeTab === tab.id ? 'text-violet-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form fields on right */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">General Information</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage your corporate details, website URL, and overview.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Company Name</Label>
                    <Input 
                      placeholder="e.g. Acme Corp" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('name')} 
                    />
                    {errors.name && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Domain</Label>
                    <Input 
                      placeholder="e.g. acme.com" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('domain')} 
                    />
                    {errors.domain && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.domain.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Industry</Label>
                    <Input 
                      placeholder="e.g. Technology, Healthcare" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('industry')} 
                    />
                    {errors.industry && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.industry.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Company Size</Label>
                    <select 
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/20 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      {...register('company_size')}
                    >
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                    {errors.company_size && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.company_size.message}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Website URL</Label>
                    <Input 
                      placeholder="https://acme.com" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('website_url')} 
                    />
                    {errors.website_url && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.website_url.message}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Company Bio</Label>
                    <textarea 
                      rows={3}
                      placeholder="Brief description of your company..." 
                      className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50/20 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                      {...register('bio')} 
                    />
                    {errors.bio && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.bio.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Contact Information</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage contact details for recruitment and support inquiries.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Contact Email</Label>
                    <Input 
                      placeholder="info@acme.com" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('contact_email')} 
                    />
                    {errors.contact_email && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.contact_email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Contact Phone</Label>
                    <Input 
                      placeholder="+1 (555) 000-0000" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('contact_phone')} 
                    />
                    {errors.contact_phone && <p className="text-rose-500 text-[10px] font-bold mt-0.5">{errors.contact_phone.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Address & Location</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage physical offices, headquarters address, and settings.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Address Line 1</Label>
                    <Input 
                      placeholder="123 Corporate Blvd" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('address_line1')} 
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Address Line 2</Label>
                    <Input 
                      placeholder="Suite 400" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('address_line2')} 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">City</Label>
                    <Input 
                      placeholder="San Francisco" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('city')} 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">State / Province</Label>
                    <Input 
                      placeholder="California" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('state')} 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Country</Label>
                    <Input 
                      placeholder="United States" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('country')} 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10.5px] font-semibold uppercase text-slate-400">Postal / ZIP Code</Label>
                    <Input 
                      placeholder="94107" 
                      className="rounded-lg h-9 text-xs border-slate-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-slate-50/20"
                      {...register('postal_code')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm hover:scale-[1.01] transition-all"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </Button>
              </div>
            )}

          </div>
        </form>
      </main>
    </div>
  );
}
