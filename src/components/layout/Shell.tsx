/**
 * NEXUS AI - Application Workspace Shell
 * Production-quality desktop layout with frameless titlebar, toast notices,
 * AccountMenu top-right control, AuthModal, and Snapdragon indicators.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Monitor,
  FileText,
  Database,
  Share2,
  Users,
  CheckSquare,
  Cpu,
  ShieldCheck,
  Settings,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  User,
} from 'lucide-react';
import { SystemHardwareStatus, ProcessingMode, ContextObject } from '../../types/index.js';
import { DesktopTitlebar } from './DesktopTitlebar.js';
import { ToastContainer } from './ToastContainer.js';
import { AccountMenu } from './AccountMenu.js';
import { AuthModal } from './AuthModal.js';
import { VoiceOrb } from '../voice/VoiceOrb.js';
import { VoiceSettingsModal } from '../voice/VoiceSettingsModal.js';
import { NexusLogo } from '../brand/NexusLogo.js';

interface ShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCommandBar: () => void;
  onOpenDemo: () => void;
  hardware?: SystemHardwareStatus;
  processingMode: ProcessingMode;
  context?: ContextObject;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentView,
  onNavigate,
  onOpenCommandBar,
  onOpenDemo,
  hardware,
  processingMode,
  context,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'history', label: 'AI History', icon: History },
        { id: 'screen', label: 'Context', icon: Monitor },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'memory', label: 'Memory', icon: Database },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'performance', label: 'AI Lab', icon: Cpu },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
        { id: 'meeting', label: 'Meeting Intelligence', icon: Users },
        { id: 'tasks', label: 'Action Engine', icon: CheckSquare },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#080a0f] text-neutral-100 font-sans overflow-hidden nexus-spatial-bg">
      {/* Desktop Frameless Titlebar */}
      <DesktopTitlebar
        hardware={hardware}
        processingMode={processingMode}
        onOpenCommandBar={onOpenCommandBar}
      />

      {/* Main Workspace Grid */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Refined Collapsible Sidebar */}
        <aside
          role="navigation"
          aria-label="Workspace Sidebar"
          className={`${
            isSidebarCollapsed ? 'w-16' : 'w-60'
          } border-r border-white/[0.06] bg-[#0c0f17]/85 backdrop-blur-md flex flex-col shrink-0 select-none transition-all duration-200 z-20`}
        >
          {/* Brand header & Collapse Toggle */}
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <NexusLogo variant="compact" size="sm" subtitle="Spatial Intelligence" showSubtitle={true} />
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-indigo-500/10 text-cyan-400 border border-indigo-500/20 shrink-0 self-start mt-0.5">
                  Edge
                </span>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center">
                <NexusLogo variant="symbol" size="sm" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftClose className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Quick Demo Mode Trigger Button */}
          <div className="p-2">
            <button
              type="button"
              onClick={onOpenDemo}
              title="Launch Challenge Demo Mode Walkthrough"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
              } rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-medium transition-all group cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-subtle-pulse" />
                {!isSidebarCollapsed && <span className="text-[11px] truncate">Demo Mode</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-0.5">
                {!isSidebarCollapsed && (
                  <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? 'justify-center py-2' : 'gap-2.5 px-2.5 py-1.5'
                      } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800/90 text-white font-semibold shadow-sm border border-white/[0.1] text-cyan-300'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-cyan-400' : 'text-neutral-400'
                        }`}
                      />
                      {!isSidebarCollapsed && (
                        <span className="truncate text-[11px]">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Telemetry Card */}
          <div className="p-2.5 border-t border-white/[0.06] bg-[#090b10]">
            {!isSidebarCollapsed ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-subtle-pulse" />
                    Target Engine:
                  </span>
                  <span className="font-mono text-[9px] text-emerald-400 font-semibold uppercase">
                    {hardware?.isSnapdragon ? 'NPU 45 TOPS' : 'CPU Local'}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-300 truncate font-mono">
                  {hardware?.processorName || 'Snapdragon X Elite'}
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/[0.04]">
                  <span className="flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    Security:
                  </span>
                  <span className="font-medium text-neutral-300 uppercase text-[9px] font-mono">
                    {processingMode}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 py-1" title="Snapdragon Engine Active">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Sub Header */}
          <header className="h-11 border-b border-white/[0.06] bg-[#0b0e15]/70 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
            {/* Quick Context Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400 font-medium">NEXUS</span>
              <span className="text-neutral-600">/</span>
              <span className="text-neutral-200 font-semibold capitalize text-xs">
                {navSections
                  .flatMap((s) => s.items)
                  .find((n) => n.id === currentView)?.label || currentView}
              </span>
            </div>

            {/* Right status badges & Account Menu */}
            <div className="flex items-center gap-2.5">
              {/* Active Context Badge */}
              {context && (
                <button
                  type="button"
                  onClick={() => onNavigate('screen')}
                  className="cursor-pointer hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-850 border border-white/[0.08] text-[11px] text-neutral-300 transition-colors"
                  title={`Active context: ${context.application || 'System'}`}
                >
                  <Monitor className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[120px] font-medium">
                    {context.application || 'Active Screen'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>
              )}

              {/* Target Hardware Indicator */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-900 border border-white/[0.06] text-[10px] font-mono text-neutral-300">
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span>
                  {hardware?.isSnapdragon ? 'Snapdragon X Elite' : 'Qualcomm AI Hub'}
                </span>
              </div>

              {/* Privacy Level Badge */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>{processingMode.toUpperCase()}</span>
              </div>

              {/* Top-Right Account Menu */}
              <div className="pl-1 border-l border-white/[0.08]">
                <AccountMenu />
              </div>
            </div>
          </header>

          {/* Main View Port */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto p-4 sm:p-6 focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Auth Modal */}
      <AuthModal />

      {/* Hands-Free Voice Orb & HUD */}
      <VoiceOrb />

      {/* Voice Assistant Settings & Calibration Modal */}
      <VoiceSettingsModal />
    </div>
  );
};
