import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { loginApi, registerApi } from '../api';
import { User } from '../types';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export function AuthModal({ initialMode = 'login', onSuccess, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(mode === 'login' ? 'dronajaybhaye017@gmail.com' : '');
  const [password, setPassword] = useState(mode === 'login' ? 'TraceLock@2026' : '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim() || !email.includes('@')) throw new Error('Please provide a valid email address.');
        if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');

        const result = await registerApi(name, email, password, confirmPassword);
        setSuccess('Registration successful! Logging you in...');
        setTimeout(() => {
          onSuccess(result.user);
        }, 600);
      } else {
        if (!email.trim() || !password) throw new Error('Please enter your email and password.');
        const result = await loginApi(email, password);
        setSuccess('Authentication successful.');
        setTimeout(() => {
          onSuccess(result.user);
        }, 400);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden my-8">
        {/* Modal Header in Deep Indigo */}
        <div className="bg-[#243B6B] px-6 py-5 text-white flex items-center justify-between border-b border-[#1E3159]">
          <Logo textColor="text-white" size={30} />
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-xl leading-none font-medium p-1 rounded transition-colors cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* Modal Form */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#172033]">
              {mode === 'login' ? 'Sign In to TraceLock' : 'Create Your TraceLock Account'}
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              {mode === 'login'
                ? 'Access your monitored documents and cryptographic integrity vault.'
                : 'Register your secure workspace for smart document protection.'}
            </p>
          </div>

          {/* Quick Demo Pre-fill helper */}
          {mode === 'login' && (
            <div className="mb-5 p-3 rounded-lg bg-[#4776D0]/10 border border-[#4776D0]/20 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-semibold text-[#243B6B] block">Demo Account Loaded</span>
                <span className="text-[#64748B] font-mono text-[11px]">dronajaybhaye017@gmail.com</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('dronajaybhaye017@gmail.com');
                  setPassword('TraceLock@2026');
                }}
                className="text-xs font-semibold text-[#243B6B] hover:text-[#4776D0] hover:underline cursor-pointer transition-colors"
              >
                Reset Demo
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[#15966A] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15966A]" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Drona Jaybhaye"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0] focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-[#E2E8F0] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0] focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#243B6B] focus:ring-[#4776D0] border-[#E2E8F0] rounded cursor-pointer accent-[#243B6B]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-[#64748B] cursor-pointer">
                  Remember me on this browser session
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] shadow-sm rounded-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center">
            {mode === 'login' ? (
              <p className="text-xs text-[#64748B]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="font-semibold text-[#243B6B] hover:text-[#4776D0] hover:underline cursor-pointer transition-colors"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#64748B]">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="font-semibold text-[#243B6B] hover:text-[#4776D0] hover:underline cursor-pointer transition-colors"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          {/* Security Assurance Badge */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1.5 text-[#15966A] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15966A]" />
              <span>Bcrypt Hashed &amp; JWT Secured</span>
            </span>
            <span className="text-slate-400">Intrusion Shield Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
