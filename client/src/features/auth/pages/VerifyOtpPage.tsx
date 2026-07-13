import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';

export const VerifyOtpPage = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const { user } = useSelector((state: RootState) => state.auth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: code });
      setVerified(true);
      toast.success('Email verified successfully!');
      const role = (user?.role || '').toLowerCase().trim();
      setTimeout(() => {
        if (role === 'candidate') {
          navigate('/candidate/onboarding');
        } else if (role === 'super admin' || role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else if (role === 'admin') {
          navigate('/company/onboarding');
        } else {
          navigate('/company/dashboard');
        }
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new code has been sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        <div className="text-center animate-in zoom-in-50 duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Verified!</h2>
          <p className="text-stone-400">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Mail size={28} className="text-emerald-400" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
              Check Your Email
            </h1>
            <p className="text-stone-400 text-sm">
              We've sent a 6-digit code to
            </p>
            <p className="text-emerald-400 font-bold text-sm mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all bg-white/5 text-white
                  ${digit ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-white/20 focus:border-emerald-400'}`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-500 disabled:bg-white/10 disabled:text-white/30 text-stone-900 font-black text-base transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Verify Email'}
          </button>

          {/* Resend */}
          <div className="text-center mt-6">
            {countdown > 0 ? (
              <p className="text-stone-400 text-sm">Resend code in <span className="text-emerald-400 font-bold">{countdown}s</span></p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-bold transition-colors mx-auto"
              >
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </div>

          {/* Back to login */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors mx-auto"
            >
              <ArrowLeft size={12} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
