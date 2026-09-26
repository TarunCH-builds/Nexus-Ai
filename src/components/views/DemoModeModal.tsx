/**
 * NEXUS AI - Module 16: Competition Demo Mode
 * Interactive 12-step guided walkthrough for Snapdragon AI Lab judges and presenters.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  CheckCircle,
  Monitor,
  FileText,
  Database,
  Users,
  Cpu,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onSetScenario: (scenario: 'vscode_error' | 'research_pdf' | 'meeting_whiteboard') => void;
  onExecutePrompt: (prompt: string) => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSetScenario,
  onExecutePrompt,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      step: 1,
      title: 'Welcome & Workspace Initialization',
      view: 'home',
      icon: Sparkles,
      actionDesc: 'Navigate to Overview and observe real-time hardware status and active context.',
      talkingPoint: 'Notice the top bar: NEXUS AI boots instantly into local-first mode on Snapdragon X Elite with Qualcomm Hexagon NPU ready.',
      action: () => onNavigate('home'),
    },
    {
      step: 2,
      title: 'Screen Perception & Error Detection',
      view: 'screen',
      icon: Monitor,
      actionDesc: 'Mount the VS Code error scenario (ModuleNotFoundError in Flask backend).',
      talkingPoint: 'NEXUS automatically perceives active window text and code blocks on-device using quantized MobileNet OCR.',
      action: () => {
        onNavigate('screen');
        onSetScenario('vscode_error');
      },
    },
    {
      step: 3,
      title: 'Contextual AI Diagnosis',
      view: 'screen',
      icon: Sparkles,
      actionDesc: 'Execute "What is wrong with this code?" diagnosis.',
      talkingPoint: 'In sub-40ms, the on-device Llama-3.2-3B model identifies the missing flask_cors package and references your local project notes.',
      action: () => {
        onNavigate('screen');
        onExecutePrompt('What is wrong with this code? Explain the exact bug and give me the fix.');
      },
    },
    {
      step: 4,
      title: 'Execute Remediation Action',
      view: 'tasks',
      icon: CheckSquare,
      actionDesc: 'Review the auto-generated fix in the Action Engine.',
      talkingPoint: 'Instead of just talking, NEXUS extracts actionable terminal commands (`pip install flask-cors`) directly into your task pipeline.',
      action: () => onNavigate('tasks'),
    },
    {
      step: 5,
      title: 'Switch Context to Technical Whitepaper',
      view: 'screen',
      icon: FileText,
      actionDesc: 'Load the Qualcomm Hexagon NPU Architecture research PDF.',
      talkingPoint: 'Demonstrates multimodal context fusion: switching from code debugging to research reading with zero manual copy-pasting.',
      action: () => {
        onNavigate('screen');
        onSetScenario('research_pdf');
      },
    },
    {
      step: 6,
      title: 'Local Semantic RAG Query',
      view: 'documents',
      icon: Database,
      actionDesc: 'Open Document Intelligence & inspect 384-dimensional vector chunks.',
      talkingPoint: 'The entire document is embedded and indexed in local SQLite. Queries run on-device without sending documents to third-party clouds.',
      action: () => onNavigate('documents'),
    },
    {
      step: 7,
      title: 'Zero-Network Guarantee',
      view: 'privacy',
      icon: ShieldCheck,
      actionDesc: 'Inspect the Privacy Center & verify 100% on-device mode.',
      talkingPoint: 'NEXUS operates flawlessly offline in airplanes, secure corporate environments, and edge field deployments.',
      action: () => onNavigate('privacy'),
    },
    {
      step: 8,
      title: 'Live Meeting Mode & Voice Stream',
      view: 'meeting',
      icon: Users,
      actionDesc: 'Open Meeting Mode with local Whisper speech-to-text.',
      talkingPoint: 'Transcribes discussions in real-time, tags speakers, and extracts decisions and action items automatically.',
      action: () => onNavigate('meeting'),
    },
    {
      step: 9,
      title: 'Knowledge Graph Visualization',
      view: 'graph',
      icon: Sparkles,
      actionDesc: 'Explore relationships between projects, concepts, documents, and tasks.',
      talkingPoint: 'Visualizes how the Flask bug connects to the Collaborative Whiteboard project, NPU hardware, and meeting decisions.',
      action: () => onNavigate('graph'),
    },
    {
      step: 10,
      title: 'AI Performance Lab Benchmarking',
      view: 'performance',
      icon: Cpu,
      actionDesc: 'Run live measured performance benchmarks on host hardware.',
      talkingPoint: 'Real numbers from performance.now(): sub-40ms INT8 tensor latency and 45 TOPS efficiency versus cloud roundtrips.',
      action: () => onNavigate('performance'),
    },
    {
      step: 11,
      title: 'Privacy Audit Trail Inspection',
      view: 'privacy',
      icon: ShieldCheck,
      actionDesc: 'Review the tamper-evident audit log of all system actions.',
      talkingPoint: 'Every query, screen capture, and document chunk is logged with destination and privacy score. Total accountability.',
      action: () => onNavigate('privacy'),
    },
    {
      step: 12,
      title: 'Summary & Snapdragon AI Lab Vision',
      view: 'home',
      icon: Sparkles,
      actionDesc: 'Return to Overview with ready workspace.',
      talkingPoint: 'NEXUS AI proves that a PC shouldn\'t just run AI—it should understand your context natively on Snapdragon.',
      action: () => onNavigate('home'),
    },
  ];

  const currentStep = demoSteps[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < demoSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      demoSteps[nextIdx].action();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      demoSteps[prevIdx].action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                Competition Presenter Script
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300">
                  Step {currentStep.step} of {demoSteps.length}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400">Snapdragon AI Lab Build & Present Challenge</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-neutral-800 text-indigo-400 border border-neutral-700">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-100">{currentStep.title}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{currentStep.actionDesc}</div>
            </div>
          </div>

          {/* Presenter Talking Point */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Presenter Pitch & Talking Point:
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed font-sans">
              "{currentStep.talkingPoint}"
            </p>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={currentStep.action}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Apply This Step To Workspace</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs text-neutral-300 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex gap-1">
            {demoSteps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStepIndex ? 'bg-indigo-400 w-4' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIndex === demoSteps.length - 1}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1"
          >
            <span>Next Step</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
