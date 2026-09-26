/**
 * NEXUS AI - Top Right Account Control & Popover Menu
 * Premium spatial UI matching NEXUS visual design language.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  History,
  Database,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  Download,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

export const AccountMenu: React.FC = () => {
  const { user, stats, signOut, setCurrentView, setIsAuthModalOpen, setAuthModalMode, addToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    try {
      addToast('info', 'Preparing encrypted workspace backup...', 'Exporting Data');
      await api.exportUserData();
      addToast('success', 'Your NEXUS workspace archive has been downloaded.', 'Export Complete');
    } catch (err: any) {
      addToast('error', err.message || 'Export failed', 'Export Error');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'NX';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-white/[0.08] hover:border-cyan-500/30 text-xs text-neutral-200 transition-all cursor-pointer group"
      >
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-[10px] shadow-sm">
          {getInitials(user?.name)}
        </div>
        <span className="font-medium text-[11px] truncate max-w-[100px] text-neutral-200 group-hover:text-cyan-300">
          {user ? user.name : 'Account'}
        </span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 group-hover:text-neutral-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0d111a]/95 backdrop-blur-xl border border-white/[0.12] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header section */}
          <div className="p-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md ring-1 ring-white/20">
                {getInitials(user?.name)}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                  <span>{user?.name || 'Local Workspace User'}</span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Active
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate">{user?.email || 'local@nexus.edge'}</div>
                <div className="text-[9px] text-cyan-400/80 font-mono mt-0.5">
                  Personal Workspace
                </div>
              </div>
            </div>

            {/* Quick mini-counters */}
            {stats && (
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-white/[0.05] text-center">
                <div className="bg-neutral-900/60 rounded p-1 border border-white/[0.04]">
                  <div className="text-[11px] font-semibold text-neutral-200">{stats.conversations}</div>
                  <div className="text-[8px] text-neutral-400 uppercase font-mono">Chats</div>
                </div>
                <div className="bg-neutral-900/60 rounded p-1 border border-white/[0.04]">
                  <div className="text-[11px] font-semibold text-neutral-200">{stats.documents}</div>
                  <div className="text-[8px] text-neutral-400 uppercase font-mono">Docs</div>
                </div>
                <div className="bg-neutral-900/60 rounded p-1 border border-white/[0.04]">
                  <div className="text-[11px] font-semibold text-neutral-200">{stats.meetings}</div>
                  <div className="text-[8px] text-neutral-400 uppercase font-mono">Meets</div>
                </div>
                <div className="bg-neutral-900/60 rounded p-1 border border-white/[0.04]">
                  <div className="text-[11px] font-semibold text-neutral-200">{stats.memories}</div>
                  <div className="text-[8px] text-neutral-400 uppercase font-mono">Mem</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setCurrentView('profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>NEXUS Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('history');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>✦ AI History Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('memory');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>◈ Memory Store</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('documents');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>▣ My Documents</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('meeting');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>◉ Meeting Intelligence</span>
            </button>

            <div className="h-px bg-white/[0.06] my-1" />

            <button
              type="button"
              onClick={() => {
                setCurrentView('settings');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>⚙ Workspace Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('privacy');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>🔒 Privacy & Security Audit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleExport();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>↓ Export My NEXUS Data</span>
            </button>
          </div>

          {/* Account Actions Footer */}
          <div className="p-1.5 border-t border-white/[0.08] bg-white/[0.01]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('signin');
                  setIsAuthModalOpen(true);
                  setIsOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Switch / Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
