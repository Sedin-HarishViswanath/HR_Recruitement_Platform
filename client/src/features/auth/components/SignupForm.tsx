import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { setCredentials } from '../auth.slice';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';

const signupSchema = z.object({
  // Common
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  
  // Company specific
  companyName: z.string().optional(),
  domain: z.string().optional(),
  size: z.string().optional(),
  industry: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),

  // Candidate specific
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupForm = ({ role }: { role: 'internal' | 'candidate', onToggleMode?: () => void }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: role === 'candidate' ? 'candidate' : 'company',
        companyDetails: role === 'internal' ? {
          companyName: data.companyName,
          domain: data.domain,
          size: data.size,
          industry: data.industry,
          address1: data.address1,
          address2: data.address2,
          city: data.city,
          state: data.state,
          country: data.country,
          zip: data.zip,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone
        } : undefined,
        candidateDetails: role === 'candidate' ? {
          phone: data.phone,
          location: data.location,
          skills: data.skills
        } : undefined
      };

      const res = await api.post('/auth/signup', payload);
      const { accessToken, user } = res.data.data;
      dispatch(setCredentials({ user, accessToken }));
      
      toast.success('Account created! Please verify your email.');
      
      // Redirect to OTP verification page with email
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (role === 'candidate') {
    return (
      <div className="w-full space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[12px] font-semibold">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Full Name" className="h-10 rounded-xl text-sm" {...register('name')} />
              {errors.name && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="you@example.com" className="h-10 rounded-xl text-sm" {...register('email')} />
              {errors.email && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
                Phone <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input placeholder="Contact Number" className="h-10 rounded-xl text-sm" {...register('phone')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
                Location <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input placeholder="City, Country" className="h-10 rounded-xl text-sm" {...register('location')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
              Skills <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input placeholder="e.g. Ruby, Rails, React" className="h-10 rounded-xl text-sm" {...register('skills')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input type="password" placeholder="••••••••" className="h-10 rounded-xl text-sm" {...register('password')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">
                Confirm <span className="text-red-500">*</span>
              </Label>
              <Input type="password" placeholder="••••••••" className="h-10 rounded-xl text-sm" {...register('confirmPassword')} />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-xl btn-primary !rounded-xl !text-[13px] mt-2">
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-[12px] font-medium text-slate-500">
          Already have an account? <button onClick={() => navigate('/login')} className="text-violet-600 font-bold hover:underline">Sign in</button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[12px] font-semibold">
            {error}
          </div>
        )}
        {/* Company Details Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full inline-block">Company Details</h4>
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Company name <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Company Name" className="h-9 rounded-lg text-[13px]" {...register('companyName')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Domain <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="e.g. example.com" className="h-9 rounded-lg text-[13px]" {...register('domain')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Company size <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input placeholder="e.g. 1-10" className="h-9 rounded-lg text-[13px]" {...register('size')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Industry <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input placeholder="e.g. Software" className="h-9 rounded-lg text-[13px]" {...register('industry')} />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full inline-block">Address</h4>
          <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Address line 1 <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Address Line 1" className="h-9 rounded-lg text-[13px]" {...register('address1')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Address line 2 <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input placeholder="Address Line 2" className="h-9 rounded-lg text-[13px]" {...register('address2')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="City" className="h-9 rounded-lg text-[13px]" {...register('city')} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="State" className="h-9 rounded-lg text-[13px]" {...register('state')} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="Country" className="h-9 rounded-lg text-[13px]" {...register('country')} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500">
                  Postal code <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="Postal code" className="h-9 rounded-lg text-[13px]" {...register('zip')} />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full inline-block">Contact</h4>
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Contact email <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Contact email" className="h-9 rounded-lg text-[13px]" {...register('contactEmail')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Contact phone <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input placeholder="Contact phone" className="h-9 rounded-lg text-[13px]" {...register('contactPhone')} />
            </div>
          </div>
        </div>

        {/* Admin User Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full inline-block">Admin User Details</h4>
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Admin Name" className="h-9 rounded-lg text-[13px]" {...register('name')} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Admin Email" className="h-9 rounded-lg text-[13px]" {...register('email')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] font-bold text-slate-500">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input type="password" placeholder="••••••••" className="h-9 rounded-lg text-[13px]" {...register('password')} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] font-bold text-slate-500">
                Confirm password <span className="text-red-500">*</span>
              </Label>
              <Input type="password" placeholder="••••••••" className="h-9 rounded-lg text-[13px]" {...register('confirmPassword')} />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-xl btn-primary !rounded-xl !text-[13px]">
          {isLoading ? 'Processing...' : 'Register'}
        </Button>

        <p className="text-center text-[12px] font-medium text-slate-500">
          Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-violet-600 font-bold hover:underline">Sign in</button>
        </p>
      </form>
    </div>
  );
};
