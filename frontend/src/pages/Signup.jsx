import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, User, Mail, FileText, AlertCircle, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

const Signup = ({ setAuthView }) => {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signup(username, email, password, fullName);
    setLoading(false);
    if (res.success) { setSuccess(true); setTimeout(() => setAuthView('login'), 2000); }
    else setError(res.error);
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
        <button onClick={() => setAuthView('login')}
          className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-800 transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </button>

        <div className="card p-8" style={{ borderRadius: '28px' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-800">Create account</h2>
              <p className="text-xs text-ink-400">Start your wellness journey 🌱</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs"
              style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs animate-scale-in"
              style={{ background: '#f0faf0', border: '1px solid #a8d9ab', color: '#388e3c' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Account created! Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {[
              { label: 'Full Name',  icon: FileText, type: 'text',     val: fullName, set: setFullName, ph: 'Your full name'        },
              { label: 'Email',      icon: Mail,     type: 'email',    val: email,    set: setEmail,    ph: 'name@example.com'       },
              { label: 'Username',   icon: User,     type: 'text',     val: username, set: setUsername, ph: 'Pick a unique username' },
            ].map(({ label, icon: Icon, type, val, set, ph }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type={type} required value={val} onChange={e => set(e.target.value)}
                    placeholder={ph} className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <button type="submit" disabled={loading || success} className="btn-primary w-full mt-1">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Sparkles className="w-4 h-4" /> Create Account</>}
            </button>
          </form>

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
