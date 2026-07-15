import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { updateUser } from '../../auth/auth.slice';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';

const step1Schema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  domain: z.string().min(3, 'Domain must be at least 3 characters'),
  company_size: z.string().min(1, 'Please select company size'),
  industry: z.string().min(1, 'Please select industry'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().or(z.literal('')),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const step2Schema = z.object({
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  contact_email: z.string().email('Valid email required'),
  contact_phone: z.string().optional().or(z.literal('')),
});

const onboardingSchema = step1Schema.merge(step2Schema);
type OnboardingValues = z.infer<typeof onboardingSchema>;

export const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      domain: '',
      company_size: '',
      industry: '',
      bio: '',
      website_url: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      contact_email: '',
      contact_phone: '',
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/companies/me/profile');
        const profile = data.data;
        if (profile) {
          if (profile.name) setValue('name', profile.name);
          if (profile.domain) setValue('domain', profile.domain);
          // Only set enum/select fields if they have a valid non-empty value
          if (profile.company_size) setValue('company_size', profile.company_size);
          if (profile.industry) setValue('industry', profile.industry);
          if (profile.country) setValue('country', profile.country);
          // Text fields: set to empty string when null to avoid uncontrolled inputs
          setValue('bio', profile.bio || '');
          setValue('website_url', profile.website_url || '');
          setValue('address_line1', profile.address_line1 || '');
          setValue('address_line2', profile.address_line2 || '');
          setValue('city', profile.city || '');
          setValue('state', profile.state || '');
          setValue('postal_code', profile.postal_code || '');
          setValue('contact_email', profile.contact_email || '');
          setValue('contact_phone', profile.contact_phone || '');

          // Advance to step 2 if step 1 was already saved
          if (profile.company_size && profile.industry && profile.domain) {
            setStep(2);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setValue]);

  const validateStep1 = () => {
    const { name, domain, company_size, industry } = watch();
    const errs: Record<string, string> = {};
    if (!name || name.trim().length < 2) errs.name = 'Company name must be at least 2 characters';
    if (!domain || domain.trim().length < 3) errs.domain = 'Domain must be at least 3 characters';
    if (!company_size) errs.company_size = 'Please select company size';
    if (!industry) errs.industry = 'Please select industry';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const onNext = async () => {
    if (!validateStep1()) return;

    const { name, domain, company_size, industry, bio, website_url } = watch();

    try {
      await api.patch('/companies/me/profile', {
        name: name.trim(),
        domain: domain.trim(),
        company_size,
        industry: industry.trim(),
        bio: bio?.trim() || '',
        website_url: website_url?.trim() || '',
      });
      setStep1Errors({});
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : err.response?.data?.message || 'Failed to save progress';
      toast.error(msg);
    }
  };

  // If validation fails on step-1 fields (which aren't visible on step 2),
  // send the user back to step 1 so they can see and fix them.
  const onInvalid = (formErrors: Record<string, unknown>) => {
    const step1Fields = ['name', 'domain', 'company_size', 'industry'];
    if (step1Fields.some((f) => f in formErrors)) {
      setStep(1);
      toast.error('Please complete the required company details.');
    }
  };

  const onSubmit = async (data: OnboardingValues) => {
    try {
      await api.patch('/companies/me/profile', {
        name: data.name.trim(),
        domain: data.domain.trim(),
        company_size: data.company_size,
        industry: data.industry.trim(),
        bio: data.bio?.trim() || '',
        website_url: data.website_url?.trim() || '',
        address_line1: data.address_line1.trim(),
        address_line2: data.address_line2?.trim() || '',
        city: data.city.trim(),
        state: data.state.trim(),
        country: data.country,
        postal_code: data.postal_code.trim(),
        contact_email: data.contact_email.trim(),
        contact_phone: data.contact_phone?.trim() || '',
      });
      dispatch(updateUser({ onboardingCompleted: true, companyStatus: 'pending' }));
      toast.success('Onboarding complete! Your company is pending approval.');
      navigate('/pending-approval');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to complete onboarding';
      toast.error(msg);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border p-8">

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
              Step {step} of 2
            </span>
            <span className="text-sm font-medium text-emerald-600">
              {step === 1 ? 'Company Profile' : 'Location & Contact'}
            </span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name <span className="text-red-500">*</span></Label>
                  <Input {...register('name')} placeholder="Acme Inc" />
                  {step1Errors.name && <p className="text-red-500 text-xs">{step1Errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Domain <span className="text-red-500">*</span></Label>
                  <Input {...register('domain')} placeholder="acme.com" />
                  {step1Errors.domain && <p className="text-red-500 text-xs">{step1Errors.domain}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Size <span className="text-red-500">*</span></Label>
                  <Select
                    onValueChange={(v) => { setValue('company_size', v); setStep1Errors(e => ({ ...e, company_size: '' })); }}
                    value={watch('company_size') || undefined}
                  >
                    <SelectTrigger className={step1Errors.company_size ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {['1-10', '11-50', '51-200', '201-500', '500+'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step1Errors.company_size && <p className="text-red-500 text-xs">{step1Errors.company_size}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Industry <span className="text-red-500">*</span></Label>
                  <Select
                    onValueChange={(v) => { setValue('industry', v); setStep1Errors(e => ({ ...e, industry: '' })); }}
                    value={watch('industry') || undefined}
                  >
                    <SelectTrigger className={step1Errors.industry ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Technology', 'Finance', 'Healthcare', 'Education', 'Other'].map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step1Errors.industry && <p className="text-red-500 text-xs">{step1Errors.industry}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input {...register('website_url')} placeholder="https://acme.com" />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea {...register('bio')} placeholder="Tell us about your company..." className="h-28 resize-none" />
              </div>

              <Button type="button" onClick={onNext} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Save & Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label>Address Line 1 <span className="text-red-500">*</span></Label>
                <Input {...register('address_line1')} placeholder="123 Main St" className={errors.address_line1 ? 'border-red-400' : ''} />
                {errors.address_line1 && <p className="text-red-500 text-xs">{errors.address_line1.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input {...register('address_line2')} placeholder="Suite 100 (optional)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input {...register('city')} placeholder="San Francisco" className={errors.city ? 'border-red-400' : ''} />
                  {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Input {...register('state')} placeholder="CA" className={errors.state ? 'border-red-400' : ''} />
                  {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country <span className="text-red-500">*</span></Label>
                  <Select
                    onValueChange={(v) => setValue('country', v)}
                    value={watch('country') || undefined}
                  >
                    <SelectTrigger className={errors.country ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {['United States', 'India', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Singapore'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Postal Code <span className="text-red-500">*</span></Label>
                  <Input {...register('postal_code')} placeholder="94103" className={errors.postal_code ? 'border-red-400' : ''} />
                  {errors.postal_code && <p className="text-red-500 text-xs">{errors.postal_code.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email <span className="text-red-500">*</span></Label>
                  <Input {...register('contact_email')} type="email" placeholder="hr@acme.com" className={errors.contact_email ? 'border-red-400' : ''} />
                  {errors.contact_email && <p className="text-red-500 text-xs">{errors.contact_email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input {...register('contact_phone')} placeholder="+1 555 000 0000" />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
