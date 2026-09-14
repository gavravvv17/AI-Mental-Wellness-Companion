import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, User, Mail, FileText, AlertCircle, Sparkles, CheckCircle2, ArrowLeft, KeyRound, RefreshCw } from 'lucide-react';

const Signup = ({ setAuthView }) => {
  const { signup, verifyOtp, resendOtp } = useAuth();
  
  // Step 1 states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2 states (OTP)
  const [step, setStep] = useState(1); // 1: Registration form, 2: OTP verification
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  // Status states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (isTimerActive && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, cooldown]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    
    const submittedUsername = username.trim() || email.trim();
    const res = await signup(submittedUsername, email.trim(), password, fullName.trim());
    setLoading(false);
    
    if (res.success) {
      setStep(2);
      setSuccessMsg('Verification code sent to ' + email);
      setCooldown(60);
      setIsTimerActive(true);
    } else {
      let displayErr = res.error;
      if (res.error && (res.error.toLowerCase().includes('authentication failed') || res.error.toLowerCase().includes('unable to send verification email'))) {
        displayErr = 'Unable to send verification email. Please try again later.';
      }
      setError(displayErr);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await verifyOtp(email.trim(), otp.trim(), 'EMAIL_VERIFICATION');
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Email verified successfully! Redirecting to login…');
      setTimeout(() => {
        setAuthView('login');
      }, 1800);
    } else {
      setError(res.error);
    }
  };

  const handleResendCode = async () => {
    if (isTimerActive) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await resendOtp(email.trim(), 'EMAIL_VERIFICATION');
    setLoading(false);

    if (res.success) {
      setSuccessMsg('A new verification code has been sent to your email.');
      setCooldown(60);
      setIsTimerActive(true);
    } else {
      setError(res.error);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength = passwordStrength();
  const strengthColors  = ['#e2e6ed','#ef4444','#f97316','#f59e0b','#22c55e'];
  const strengthLabels  = ['','Weak','Fair','Good','Strong'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0faf0 0%, #fafaf7 40%, #f5f0ff 100%)' }}>
      <div className="w-full max-w-md animate-fade-up">
        <button onClick={() => step === 2 ? setStep(1) : setAuthView('login')}
          className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-800 transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> {step === 2 ? 'Back to Details' : 'Back to Sign In'}
        </button>

        <div className="card p-8" style={{ borderRadius: '28px' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-800">
                {step === 1 ? 'Create account' : 'Verify your email'}
              </h2>
              <p className="text-xs text-ink-400">
                {step === 1 ? 'Start your wellness journey 🌱' : "We've sent a verification code to your email."}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs"
              style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs animate-scale-in"
              style={{ background: '#f0faf0', border: '1px solid #a8d9ab', color: '#388e3c' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="John Smith" className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="johnsmith@example.com" className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Username <span className="text-ink-300 font-normal">(optional)</span></label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="johnsmith" className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColors[strength] : '#e2e6ed' }} />
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Sparkles className="w-4 h-4" /> Create Account</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">6-Digit Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-base tracking-widest font-mono text-center"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle2 className="w-4 h-4" /> Verify OTP</>}
              </button>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-ink-400">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isTimerActive || loading}
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: isTimerActive ? '#94a3b8' : '#8b5cf6' }}
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {isTimerActive ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-ink-400">
            Already have an account?{' '}
            <button onClick={() => setAuthView('login')}
              className="font-semibold underline" style={{ color: '#8b5cf6' }}>
              Sign in →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
