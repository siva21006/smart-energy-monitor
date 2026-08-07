import React, { useState } from 'react';
import { Zap, Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onAuthSuccess(data.user);
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Welcome Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Welcome to Smart Energy Monitor
        </h1>
        <p className="text-xs text-slate-500 mt-1">AI-Powered Tariff Tracking & Forecasting</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md p-8 relative overflow-hidden">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-xl border border-emerald-200 shadow-inner">
            ⚡
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500">
            {isSignUp
              ? 'Sign up to start monitoring your energy'
              : 'Log in to monitor your energy usage'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-lg cursor-pointer select-none p-1 min-h-[40px] flex items-center"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm min-h-[48px]"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div\
    </div>
  );
};
