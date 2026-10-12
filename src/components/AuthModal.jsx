import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ChefHat,
  Sparkles
} from 'lucide-react';
import { api } from '../utils/api';

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  syncStatus,
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError('Password must be at least 4 characters long.');
          setLoading(false);
          return;
        }

        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });

        if (res.success && res.user) {
          setSuccessMsg(`Welcome aboard, ${res.user.name}! Your account has been registered.`);
          if (onAuthSuccess) {
            onAuthSuccess(res.user);
          }
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setError(res.error || 'Registration failed. Please check your details.');
        }
      } else {
        // Login mode
        if (!email.trim() || !password) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }

        const res = await api.login({
          email: email.trim(),
          password,
        });

        if (res.success && res.user) {
          setSuccessMsg(`Welcome back, ${res.user.name}! Connected to Silver Catering.`);
          if (onAuthSuccess) {
            onAuthSuccess(res.user);
          }
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setError(res.error || 'Invalid credentials or backend unreachable.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = `${import.meta.env.BASE_URL || './'}silver_logo.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Silver Catering Branding */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-[#1A2E22] to-slate-900 text-white relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={logoUrl} 
                alt="Silver Catering Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<span class="text-xs font-bold text-white">SC</span>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white tracking-tight">SILVER CATERING</h3>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {mode === 'login' ? 'Team Member Sign In' : 'Create Team Account'}
              </p>
            </div>
          </div>
        </div>

        {/* Shared Team Business Data Notice */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
          <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-tight text-[11.5px]">
            <strong className="font-semibold text-amber-950">Shared Business Workspace:</strong> All team members share the same live catering calculations, income, expenses, and PDF statements.
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nihal MV / Coordinator"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F3D2B] focus:border-[#1F3D2B] text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@silvercatering.in"
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F3D2B] focus:border-[#1F3D2B] text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F3D2B] focus:border-[#1F3D2B] text-slate-900 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Role / Designation
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1F3D2B] focus:border-[#1F3D2B] text-slate-900 bg-white"
              >
                <option value="manager">Event Manager / Administrator</option>
                <option value="coordinator">Event Coordinator</option>
                <option value="accountant">Accounts &amp; Finance</option>
                <option value="staff">Kitchen &amp; Service Staff</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#1F3D2B] hover:bg-[#162D20] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Registering...'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {mode === 'login' ? 'Sign In to Workspace' : 'Create Team Account'}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          {/* Toggle between Login and Register */}
          <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100 flex flex-col gap-2">
            {mode === 'login' ? (
              <div>
                New team member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="font-bold text-[#1F3D2B] hover:underline cursor-pointer"
                >
                  Register here &amp; join team
                </button>
              </div>
            ) : (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="font-bold text-[#1F3D2B] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer mt-1"
            >
              Continue without signing in (Local / Guest mode)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
