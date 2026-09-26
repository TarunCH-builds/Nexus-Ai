/**
 * NEXUS AI - Phase 2 & Account: Central Application State & User Context
 * Manages view routing, user session state, workspace stats, hardware telemetry,
 * global notifications/toasts, and modals.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SystemHardwareStatus, ProcessingMode, ContextObject, UserProfile, WorkspaceStats } from '../types/index.js';
import { api, AIHealthResponse } from '../services/api.js';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  timestamp: number;
}

interface AppContextValue {
  currentView: string;
  setCurrentView: (view: string) => void;
  // Auth & Profile
  user: UserProfile | null;
  stats: WorkspaceStats | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  // System & Context
  hardware?: SystemHardwareStatus;
  processingMode: ProcessingMode;
  setProcessingMode: (mode: ProcessingMode) => void;
  context?: ContextObject;
  refreshContext: () => Promise<void>;
  aiHealth: AIHealthResponse | null;
  refreshAiHealth: () => Promise<void>;
  // UI & Modals
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
  removeToast: (id: string) => void;
  isCommandBarOpen: boolean;
  setIsCommandBarOpen: (open: boolean) => void;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const [hardware, setHardware] = useState<SystemHardwareStatus | undefined>(undefined);
  const [processingMode, setProcessingModeState] = useState<ProcessingMode>('local');
  const [context, setContext] = useState<ContextObject | undefined>(undefined);
  const [aiHealth, setAiHealth] = useState<AIHealthResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setStats(res.stats);
      }
    } catch (err: any) {
      console.warn('Failed to load user profile:', err);
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
      setUser(null);
      setStats(null);
      addToast('info', 'You have been signed out from NEXUS.', 'Signed Out');
      // Reload user data as guest/default
      await refreshUser();
      setCurrentView('home');
    } catch (err: any) {
      addToast('error', err.message || 'Error signing out', 'Sign Out Error');
    }
  };

  const refreshAiHealth = async () => {
    try {
      const health = await api.getAiHealth();
      setAiHealth(health);
    } catch (err: any) {
      setAiHealth({
        provider: 'gemini',
        configured: false,
        available: false,
        model: 'gemini-3.8-flash',
        last_error: err?.message || 'AI service unreachable',
        processing: 'cloud',
      });
    }
  };

  const refreshContext = async () => {
    try {
      const status = await api.getStatus();
      setHardware(status.hardware);
      setProcessingModeState(status.processingMode);

      const ctxData = await api.getContext();
      setContext(ctxData.context);
    } catch (err: any) {
      console.warn('System status refresh warning:', err);
    }
  };

  const setProcessingMode = async (mode: ProcessingMode) => {
    setProcessingModeState(mode);
    try {
      await api.setPrivacyMode(mode);
      addToast('info', `Switched execution pipeline to ${mode.toUpperCase()} mode.`, 'Pipeline Updated');
      await refreshContext();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update processing mode.', 'Mode Error');
    }
  };

  useEffect(() => {
    refreshUser();
    refreshContext();
    refreshAiHealth();
    const interval = setInterval(() => {
      refreshContext();
      refreshAiHealth();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        user,
        stats,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        refreshUser,
        signOut,
        hardware,
        processingMode,
        setProcessingMode,
        context,
        refreshContext,
        aiHealth,
        refreshAiHealth,
        toasts,
        addToast,
        removeToast,
        isCommandBarOpen,
        setIsCommandBarOpen,
        isDemoModalOpen,
        setIsDemoModalOpen,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
