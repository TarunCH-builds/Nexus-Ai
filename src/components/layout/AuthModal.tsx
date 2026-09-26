/**
 * NEXUS AI - Authentication Modal
 * Sign In, Sign Up, and Account Switcher with password validation and security tips.
 */

import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { NexusLogo } from '../brand/NexusLogo.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode, setAuthModalMode, refreshUser, addToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (authModalMode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Full name is required.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    try {
      setLoading(true);
      if (authModalMode === 'signup') {
        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        addToast('success', `Welcome to NEXUS, ${res.user.name}! Your isolated workspace is ready.`, 'Account Created');
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        addToast('success', `Welcome back, ${res.user.name}!`, 'Signed In');
      }

      await refreshUser();
      setIsAuthModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#0c101a] border border-white/[0.12] shadow-2xl overflow-hidden relative">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <NexusLogo variant="symbol" size="md" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {authModalMode === 'signup' ? 'Create NEXUS Workspace' : 'Sign In to NEXUS'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {authModalMode === 'signup'
                  ? 'Isolated local workspace with zero-leak privacy'
                  : 'Access your persistent history, memories & documents'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tarun C H"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
            {authModalMode === 'signup' && (
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                Min 8 chars, hashed with scrypt + unique salt. Never stored plaintext.
              </p>
            )}
          </div>

          {authModalMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>
            </div>
          )}

          {/* Privacy badge */}
          <div className="p-2.5 rounded-lg bg-neutral-900/50 border border-white/[0.04] flex items-center gap-2 text-[10px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Multi-Account Isolation: Your records are never visible to other users.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{authModalMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Modal Footer Mode Switch */}
        <div className="p-4 border-t border-white/[0.06] bg-white/[0.01] text-center text-xs text-neutral-400">
          {authModalMode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setAuthModalMode('signin');
                }}
                className="text-cyan-400 hover:underline font-medium cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Need a new workspace?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setAuthModalMode('signup');
                }}
                className="text-cyan-400 hover:underline font-medium cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
