/**
 * NEXUS AI - Profile & Personal Workspace
 * Detailed user profile, true database statistics, security center,
 * privacy preferences, data retention settings, data export, and account deletion.
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Download,
  Trash2,
  Key,
  Database,
  FileText,
  Users,
  MessageSquare,
  Sparkles,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

export const NexusProfile: React.FC = () => {
  const { user, stats, refreshUser, signOut, addToast } = useApp();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences / Retention State
  const [retentionDays, setRetentionDays] = useState<number>(user?.preferences?.retentionDays ?? 0);
  const [localOnly, setLocalOnly] = useState<boolean>(user?.preferences?.localOnly ?? false);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(user?.preferences?.memoryEnabled ?? true);
  const [telemetryOptIn, setTelemetryOptIn] = useState<boolean>(user?.preferences?.telemetryOptIn ?? false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || '');
      if (user.preferences) {
        setRetentionDays(user.preferences.retentionDays ?? 0);
        setLocalOnly(user.preferences.localOnly ?? false);
        setMemoryEnabled(user.preferences.memoryEnabled ?? true);
        setTelemetryOptIn(user.preferences.telemetryOptIn ?? false);
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Name cannot be empty', 'Validation Error');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      await api.updateProfile({ name: name.trim(), avatarUrl: avatarUrl.trim() });
      addToast('success', 'Profile updated successfully.', 'Profile Saved');
      await refreshUser();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update profile', 'Update Error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('error', 'New password must be at least 8 characters.', 'Password Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Passwords do not match.', 'Password Error');
      return;
    }
    try {
      setIsChangingPassword(true);
      await api.changePassword({ currentPassword, newPassword });
      addToast('success', 'Password successfully updated.', 'Security');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to change password.', 'Password Error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPrefs(true);
      await api.updatePreferences({
        retentionDays,
        localOnly,
        memoryEnabled,
        telemetryOptIn,
      });
      addToast('success', 'Workspace preferences and retention policy saved.', 'Preferences Updated');
      await refreshUser();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save preferences', 'Preferences Error');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleExportData = async () => {
    try {
      addToast('info', 'Compiling user-owned records (chats, documents, meetings, memories)...', 'Export');
      await api.exportUserData();
      addToast('success', 'NEXUS data archive ready and downloaded.', 'Export Successful');
    } catch (err: any) {
      addToast('error', err.message || 'Export failed.', 'Export Error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      addToast('error', 'Please type DELETE exactly to confirm account removal.', 'Confirmation Error');
      return;
    }
    try {
      setIsDeleting(true);
      await api.deleteAccount('DELETE');
      setShowDeleteModal(false);
      addToast('info', 'Your account and all associated workspace records were purged.', 'Account Purged');
      await refreshUser();
    } catch (err: any) {
      addToast('error', err.message || 'Deletion failed', 'Deletion Error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCreationDate = (ts?: number) => {
    if (!ts) return 'September 2026';
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getInitials = (userName?: string) => {
    if (!userName) return 'NX';
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-b from-[#111522] to-[#0c0e17] border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/10 shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {user?.name || 'Local Workspace User'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Personal Workspace
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
              <span>{user?.email || 'local@nexus.edge'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                Created {formatCreationDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/[0.08] text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Data</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-xs font-medium text-rose-300 transition-all cursor-pointer"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Real Workspace Statistics (Sourced directly from DB) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0c101a] border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Conversations</span>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.conversations ?? 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Multi-turn AI sessions</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c101a] border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Documents</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.documents ?? 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Local embedded files</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c101a] border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Meetings</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.meetings ?? 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Logged session timelines</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c101a] border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Memories</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats?.memories ?? 0}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Persistent semantic units</div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <div className="p-5 rounded-2xl bg-[#0c101a] border border-white/[0.06] shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <User className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Profile Details</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'local@nexus.edge'}
                className="w-full px-3 py-2 bg-neutral-950/70 border border-white/[0.05] rounded-lg text-xs text-neutral-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Primary identifier for isolated workspace storage.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Avatar Image URL (Optional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="p-5 rounded-2xl bg-[#0c101a] border border-white/[0.06] shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <Key className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Security & Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-indigo-500 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        {/* Workspace Retention & Privacy Settings */}
        <div className="p-5 rounded-2xl bg-[#0c101a] border border-white/[0.06] shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Data Retention Policy</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                History & Record Retention Period
              </label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value={0}>Forever (Default - Never delete history)</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
                <option value={365}>1 Year (365 Days)</option>
              </select>
              <p className="text-[10px] text-neutral-500 mt-1">
                NEXUS never silently purges history. Automatic pruning only operates if you select a non-zero retention duration.
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-neutral-200">Semantic Memory Engine</div>
                  <div className="text-[10px] text-neutral-400">Remember user preferences and context across chats</div>
                </div>
                <input
                  type="checkbox"
                  checked={memoryEnabled}
                  onChange={(e) => setMemoryEnabled(e.target.checked)}
                  className="rounded border-white/20 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-neutral-200">Enforce Local-Only Isolation</div>
                  <div className="text-[10px] text-neutral-400">Reject any cloud model handoff regardless of pipeline</div>
                </div>
                <input
                  type="checkbox"
                  checked={localOnly}
                  onChange={(e) => setLocalOnly(e.target.checked)}
                  className="rounded border-white/20 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSavingPrefs}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavingPrefs ? 'Saving...' : 'Save Retention & Policies'}</span>
            </button>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-500/10">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-rose-300">Danger Zone</h2>
          </div>

          <div className="space-y-3 text-xs text-neutral-300">
            <p className="leading-relaxed">
              Deleting your account permanently purges all your private conversations, messages, uploaded documents, vector chunks, transcripts, and memories from the local database.
            </p>
            <p className="text-[11px] text-neutral-400">
              This action cannot be undone. We advise downloading your data first using <strong>Export Data</strong>.
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e121c] border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Account Purge</span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              This will permanently delete account <strong>{user?.email}</strong> and all associated SQLite database records (conversations, messages, memories, documents, meetings).
            </p>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">
                Type <span className="text-rose-400 font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-neutral-900 border border-white/[0.1] rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-xs font-bold text-white transition-colors"
              >
                {isDeleting ? 'Purging...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
