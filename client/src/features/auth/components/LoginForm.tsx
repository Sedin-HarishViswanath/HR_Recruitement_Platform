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
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = ({ role, onToggleMode }: { role: 'internal' | 'candidate', onToggleMode: () => void }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await api.post('/auth/login', data);
      dispatch(setCredentials({ user: res.data.data.user, accessToken: res.data.data.accessToken }));
      
      if (res.data.data.user.role === 'Candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/company/dashboard'); // Or superadmin based on role
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
     try {
       const res = await api.post('/auth/google', {
         idToken: credentialResponse.credential,
         role: role === 'candidate' ? 'candidate' : 'company'
       });
       dispatch(setCredentials({ user: res.data.data.user, accessToken: res.data.data.accessToken }));
       navigate(res.data.data.user.role === 'Candidate' ? '/candidate/dashboard' : '/company/dashboard');
     } catch (err: any) {
       setError(err.response?.data?.message || 'Google login failed');
     }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Log in to your {role === 'internal' ? 'company' : 'candidate'} account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
          </div>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full font-semibold">Log in</Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
         <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
         />
      </div>

      <div className="text-center text-sm">
        Don't have an account?{' '}
        <button onClick={onToggleMode} className="text-blue-600 font-medium hover:underline">
          Sign up
        </button>
      </div>
    </div>
  );
};
