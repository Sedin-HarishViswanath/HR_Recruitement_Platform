import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
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

const onboardingSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  domain: z.string().min(3, 'Domain is required'),
  company_size: z.string().min(1, 'Please select company size'),
  industry: z.string().min(1, 'Please select industry'),
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
  website_url: z.string().url().or(z.literal('')),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      company_size: '',
      industry: '',
      country: '',
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/companies/me/profile');
        const profile = data.data;
        if (profile) {
          Object.keys(profile).forEach((key) => {
            if (key in onboardingSchema.shape) {
               setValue(key as keyof OnboardingValues, profile[key] || '');
            }
          });
          // Simple logic to determine step: if Step 1 fields are filled, go to Step 2
          if (profile.company_size && profile.industry) {
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

  const onNext = async () => {
    // Basic validation for Step 1
    const step1Data = watch();
    if (!step1Data.name || !step1Data.domain || !step1Data.company_size || !step1Data.industry) {
      toast.error('Please fill all required fields in Step 1');
      return;
    }
    
    try {
      await api.patch('/companies/me/profile', watch());
      setStep(2);
    } catch (err) {
      toast.error('Failed to save progress');
    }
  };

  const onSubmit = async (data: OnboardingValues) => {
    try {
      await api.patch('/companies/me/profile', data);
      toast.success('Onboarding complete!');
      navigate('/company/dashboard');
    } catch (err) {
      toast.error('Failed to complete onboarding');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border p-8">
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Step {step} of 2
            </span>
            <span className="text-sm font-medium text-blue-600">
              {step === 1 ? 'Company Profile' : 'Location & Contact'}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input {...register('name')} placeholder="Acme Inc" />
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input {...register('domain')} placeholder="acme.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select onValueChange={(v) => setValue('company_size', v)} value={watch('company_size')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {['1-10', '11-50', '51-200', '201-500', '500+'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select onValueChange={(v) => setValue('industry', v)} value={watch('industry')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Technology', 'Finance', 'Healthcare', 'Education', 'Other'].map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input {...register('website_url')} placeholder="https://acme.com" />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea {...register('bio')} placeholder="Tell us about your company..." className="h-32" />
              </div>

              <Button type="button" onClick={onNext} className="w-full">
                Save & Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input {...register('address_line1')} placeholder="123 Main St" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="San Francisco" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input {...register('state')} placeholder="CA" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select onValueChange={(v) => setValue('country', v)} value={watch('country')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {['United States', 'India', 'United Kingdom', 'Canada', 'Germany'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input {...register('postal_code')} placeholder="94103" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input {...register('contact_email')} type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input {...register('contact_phone')} />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1">
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
