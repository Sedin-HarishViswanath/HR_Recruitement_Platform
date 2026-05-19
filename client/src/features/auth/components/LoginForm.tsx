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
import { GoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = ({ role }: { role: 'internal' | 'candidate', onToggleMode?: () => void }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      dispatch(setCredentials({ user: res.data.data.user, accessToken: res.data.data.accessToken }));
      
      const user = res.data.data.user;
      const userRole = (user.role || '').toLowerCase().trim();
      
      if (userRole === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (userRole === 'super admin' || userRole === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (user.companyStatus?.toLowerCase() === 'pending') {
        navigate('/pending-approval');
      } else {
        navigate('/company/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
     try {
       const res = await api.post('/auth/google', {
         idToken: credentialResponse.credential,
         role: role === 'candidate' ? 'candidate' : 'company'
       });
       dispatch(setCredentials({ user: res.data.data.user, accessToken: res.data.data.accessToken }));
       
       const user = res.data.data.user;
       if (user.role === 'Candidate') {
         navigate('/candidate/dashboard');
       } else if (user.role === 'Super Admin') {
         navigate('/superadmin/dashboard');
       } else {
         navigate('/company/dashboard');
       }
     } catch (err: any) {
       setError(err.response?.data?.message || 'Google login failed');
     }
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[11px] font-black uppercase text-slate-500 ml-1">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@company.com" 
            className="h-10 rounded-xl bg-white border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-medium text-sm"
            {...register('email')} 
          />
          {errors.email && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[11px] font-black uppercase text-slate-500 ml-1">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••"
            className="h-10 rounded-xl bg-white border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-sm"
            {...register('password')} 
          />
          {errors.password && <p className="text-red-500 text-[9px] font-bold ml-1">{errors.password.message}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black tracking-tight text-base shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center pt-1">
        <p className="text-[13px] font-bold text-slate-400">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline">
            Register
          </button>
        </p>
      </div>

      <div className="relative pt-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
          <span className="bg-white px-4 text-slate-400">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center scale-105">
         <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
            theme="outline"
            shape="pill"
            width="100%"
         />
      </div>
    </div>
  );
};
