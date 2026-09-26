/**
 * NEXUS AI - Desktop Titlebar & Frameless Window Controls
 * Native Windows ARM64 / Tauri desktop frame styling with Snapdragon telemetry.
 */

import React from 'react';
import { Minus, Square, X, Cpu, ShieldCheck, Command } from 'lucide-react';
import { DesktopBridge } from '../../services/desktopBridge.js';
import { SystemHardwareStatus, ProcessingMode } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';
import { GlobalVoiceIndicator } from '../voice/GlobalVoiceIndicator.js';
import { NexusLogo } from '../brand/NexusLogo.js';

interface DesktopTitlebarProps {
  hardware?: SystemHardwareStatus;
  processingMode: ProcessingMode;
  onOpenCommandBar: () => void;
}

export const DesktopTitlebar: React.FC<DesktopTitlebarProps> = ({
  hardware,
  processingMode,
  onOpenCommandBar,
}) => {
  const { aiHealth } = useApp();
  return (
    <header
      id="desktop-titlebar"
      role="banner"
      aria-label="Desktop application window title bar"
      className="h-9 w-full bg-neutral-950 border-b border-neutral-850 flex items-center justify-between px-3 select-none z-40 text-xs text-neutral-400"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: App Identity */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <NexusLogo variant="compact" size="xs" showSubtitle={false} />
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-850 text-neutral-400 border border-neutral-800">
            v2.0
          </span>
        </div>

        {/* Real AI Health Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] border-l border-neutral-800 pl-2.5 font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              aiHealth === null
                ? 'bg-amber-400 animate-ping'
                : aiHealth.available
                ? 'bg-emerald-400 animate-pulse'
                : aiHealth.configured
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          <span
            className={
              aiHealth === null
                ? 'text-amber-400 font-medium'
                : aiHealth.available
                ? 'text-emerald-400 font-semibold'
                : aiHealth.configured
                ? 'text-amber-400 font-medium'
                : 'text-rose-400 font-medium'
            }
            title={aiHealth?.last_error || undefined}
          >
            {aiHealth === null
              ? '● AI CONNECTING'
              : aiHealth.available
              ? '● AI ONLINE'
              : aiHealth.configured
              ? '● AI ERROR'
              : '● AI OFFLINE'}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-neutral-500 border-l border-neutral-800 pl-2.5 font-mono">
          <Cpu className="w-3 h-3 text-neutral-400" />
          <span>
            {hardware?.isSnapdragon
              ? 'Snapdragon X Elite · Hexagon NPU'
              : 'Linux x86_64 · CPU Vector Engine'}
          </span>
        </div>
      </div>

      {/* Center: Universal Command Trigger Button */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          type="button"
          onClick={onOpenCommandBar}
          aria-label="Search or enter prompt (Ctrl+K)"
          className="flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors cursor-pointer group"
        >
          <Command className="w-3 h-3 text-neutral-400 group-hover:text-indigo-400" />
          <span className="hidden md:inline text-neutral-400">Search commands, memory, or ask AI...</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[9px] font-mono rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Voice Status, Mode Badge & Window Controls */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {/* Global Voice Assistant Status Indicator */}
        <GlobalVoiceIndicator />

        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
          <span className="uppercase text-[9px] font-semibold">{processingMode}</span>
        </div>

        {/* Standard Window Actions */}
        <div className="flex items-center -mr-1">
          <button
            type="button"
            onClick={() => DesktopBridge.minimizeWindow()}
            aria-label="Minimize Window"
            className="w-7 h-6 flex items-center justify-center hover:bg-neutral-850 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => DesktopBridge.toggleMaximize()}
            aria-label="Maximize Window"
            className="w-7 h-6 flex items-center justify-center hover:bg-neutral-850 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={() => DesktopBridge.closeWindow()}
            aria-label="Close Window"
            className="w-7 h-6 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 rounded text-neutral-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
