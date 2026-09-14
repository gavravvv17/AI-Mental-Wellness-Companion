import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

const ForgotPassword = ({ setAuthView }) => {
  const { forgotPassword, verifyResetOtp, resetPassword, resendOtp } = useAuth();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [cooldown, setCooldown] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

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

  // Step 1: Send Reset Code
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await forgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setStep(2);
      setSuccessMsg('If registered, a password reset code was sent to ' + email);
      setCooldown(60);
      setIsTimerActive(true);
    } else {
      setError(res.error);
    }
  };

  // Step 2: Verify Reset OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await verifyResetOtp(email.trim(), otp.trim());
    setLoading(false);

    if (res.success) {
      setStep(3);
      setSuccessMsg('Code verified! Please enter your new password.');
    } else {
      setError(res.error);
    }
  };

  // Resend OTP for password reset
  const handleResendCode = async () => {
    if (isTimerActive) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await resendOtp(email.trim(), 'PASSWORD_RESET');
    setLoading(false);

    if (res.success) {
      setSuccessMsg('A new password reset code has been sent to your email.');
      setCooldown(60);
      setIsTimerActive(true);
    } else {
      setError(res.error);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await resetPassword(email.trim(), otp.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      setStep(4);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #fafaf7 40%, #f0faf0 100%)' }}>
      <div className="w-full max-w-md animate-fade-up">
        {step < 4 && (
          <button onClick={() => {
            if (step > 1) setStep(step - 1);
            else setAuthView('login');
          }}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-800 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}

        <div className="card p-8" style={{ borderRadius: '28px' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-800">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Enter Verification Code'}
                {step === 3 && 'Set New Password'}
                {step === 4 && 'Password Reset'}
              </h2>
              <p className="text-xs text-ink-400">
                {step === 1 && 'Enter your email to receive a reset code'}
                {step === 2 && `Code sent to ${email}`}
                {step === 3 && 'Choose a strong new password for your account'}
                {step === 4 && 'Your password has been changed successfully'}
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

          {successMsg && step < 4 && (
            <div className="mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs animate-scale-in"
              style={{ background: '#f0faf0', border: '1px solid #a8d9ab', color: '#388e3c' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="johnsmith@example.com"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Sparkles className="w-4 h-4" /> Send Reset Code</>}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">6-Digit Reset Code</label>
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
                  : <><ShieldCheck className="w-4 h-4" /> Verify Code</>}
              </button>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-ink-400">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isTimerActive || loading}
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: isTimerActive ? '#94a3b8' : '#8b5cf6' }}
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {isTimerActive ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle2 className="w-4 h-4" /> Reset Password</>}
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: '#f0faf0', color: '#22c55e' }}>
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-ink-800">Your password has been reset successfully.</h3>
              <p className="text-xs text-ink-400 max-w-xs mx-auto">
                You can now log in to your Serenity AI account using your new password.
              </p>
              <button
                onClick={() => setAuthView('login')}
                className="btn-primary w-full mt-4"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {step < 4 && (
            <p className="mt-5 text-center text-xs text-ink-400">
              Remember your password?{' '}
              <button onClick={() => setAuthView('login')}
                className="font-semibold underline" style={{ color: '#8b5cf6' }}>
                Sign in →
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
