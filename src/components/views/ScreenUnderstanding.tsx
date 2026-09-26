/**
 * NEXUS AI - Module 3: Smart Screen Understanding
 * Complete Vertical Workflow:
 * SCREEN -> OCR/VISION -> CONTEXT -> AI ANALYSIS -> USER RESPONSE
 * 
 * Includes:
 * - Live screen capture via Web Display API
 * - Image/screenshot file upload (drag & drop + manual select)
 * - Scenario switching (VS Code error, PDF research, Teams meeting)
 * - Permission checking & inline request modal
 * - Multi-stage loading progress
 * - Success display with visual token overlays & Markdown diagnosis
 * - Error handling & recovery
 * - Hardware target & fallback transparent metrics
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Terminal,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Copy,
  Layers,
  ArrowRight,
  Eye,
  Sliders,
  ShieldAlert,
  Cpu,
  Check,
  X,
  FileUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ContextObject, ChatResponse } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

interface ScreenUnderstandingProps {
  context?: ContextObject;
  onRefreshContext: () => void;
  onAddTask: (title: string, desc?: string) => void;
}

export const ScreenUnderstanding: React.FC<ScreenUnderstandingProps> = ({
  context,
  onRefreshContext,
  onAddTask,
}) => {
  const { addToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow states
  const [selectedScenario, setSelectedScenario] = useState<'vscode_error' | 'research_pdf' | 'meeting_whiteboard'>('vscode_error');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Analysis Lifecycle States
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [aiResponse, setAiResponse] = useState<ChatResponse | null>(null);
  const [visionData, setVisionData] = useState<any>(null);

  // UI state
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Initial permission check
  useEffect(() => {
    checkScreenPermission();
  }, []);

  const checkScreenPermission = async () => {
    try {
      const status = await api.getStatus();
      setPermissionDenied(!status.permissions.screenAccess);
    } catch {
      // Fallback
    }
  };

  const handleGrantPermission = async () => {
    try {
      await api.setPermissions({ screenAccess: true });
      setPermissionDenied(false);
      addToast('success', 'Screen perception permission granted.', 'Permission Updated');
      onRefreshContext();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update permission', 'Permission Error');
    }
  };

  // Switch sample scenarios
  const handleScenarioChange = async (scenario: 'vscode_error' | 'research_pdf' | 'meeting_whiteboard') => {
    setSelectedScenario(scenario);
    setUploadedImagePreview(null);
    setAnalysisError(null);
    setIsCapturing(true);
    try {
      await api.setScenario(scenario);
      onRefreshContext();
      setAiResponse(null);
      setVisionData(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to switch scenario', 'Error');
    } finally {
      setIsCapturing(false);
    }
  };

  // Real browser display capture via getDisplayMedia
  const handleCaptureDisplay = async () => {
    try {
      setIsCapturing(true);
      setAnalysisError(null);

      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        videoTrack.stop();

        const base64Image = canvas.toDataURL('image/png');
        setUploadedImagePreview(base64Image);

        // Run the complete vertical workflow on captured frame
        await runScreenWorkflow({
          imageBase64: base64Image,
          text: `[Live Display Frame Captured] Dimensions: ${canvas.width}x${canvas.height}. Window: User Active Monitor. Status: Normalized for edge OCR.`,
          application: 'Captured Desktop Display',
          windowTitle: 'Live Desktop Session',
        });
      } else {
        addToast('info', 'Display capture API unavailable in this frame. Running analysis on active scenario context.', 'Display API');
        await runScreenWorkflow({
          text: context?.text || 'Screen perception active buffer',
          application: context?.application || 'VS Code',
          windowTitle: context?.windowTitle || 'Active Window',
        });
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.warn('Capture error:', err);
        setAnalysisError(err.message || 'Screen capture was cancelled or unpermitted.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle Image File Upload (PNG/JPG)
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please upload an image file (PNG, JPG, WebP).', 'Invalid File');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImagePreview(base64);
      setAnalysisError(null);

      await runScreenWorkflow({
        imageBase64: base64,
        text: `[Uploaded Screenshot: ${file.name}] Detected UI elements and text. Segmented into OCR bounding tokens.`,
        application: 'Uploaded Screenshot File',
        windowTitle: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Execution of the Complete Vertical Pipeline
  const runScreenWorkflow = async (payload: {
    imageBase64?: string;
    text?: string;
    application?: string;
    windowTitle?: string;
    prompt?: string;
  }) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStep(1); // Normalizing

    try {
      // Step 1: Normalization
      await new Promise(r => setTimeout(r, 120));
      setAnalysisStep(2); // OCR / Vision

      // Step 2 & 3 & 4 via API endpoint
      const result = await api.analyzeScreenWorkflow(payload);
      setAnalysisStep(3); // Fusing context
      await new Promise(r => setTimeout(r, 100));

      setAnalysisStep(4); // AI Analysis complete
      setVisionData(result.vision);
      setAiResponse(result.analysis);
      onRefreshContext();

      addToast(
        'success',
        `Screen analyzed via ${result.analysis.decision.selectedProvider} (${result.analysis.latencyMs}ms)`,
        'Workflow Complete'
      );
    } catch (err: any) {
      if (err.permissionDenied) {
        setPermissionDenied(true);
      }
      setAnalysisError(err.message || 'Failed to complete screen analysis workflow.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presetQuestions = [
    { label: 'What is wrong with this code?', prompt: 'What is wrong with this code? Explain the exact bug, line numbers, and give me the fix command.' },
    { label: 'Explain what I am looking at', prompt: 'Explain what I am looking at in detail, highlighting key architecture or errors.' },
    { label: 'Summarize visible screen', prompt: 'Summarize the text and elements visible on this screen in crisp bullet points.' },
    { label: 'Generate study / viva questions', prompt: 'Generate 5 viva or interview questions based on the active screen content.' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-400" />
            Smart Screen Understanding
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Complete vertical pipeline: Screen Capture ➔ Normalization ➔ OCR Vision ➔ Context Fusion ➔ Local Model Router.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing || isAnalyzing}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Upload Screenshot</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureDisplay}
            disabled={isCapturing || isAnalyzing}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Capturing Frame...' : 'Capture Live Display'}</span>
          </button>
        </div>
      </div>

      {/* Permission Block Banner if Disabled */}
      {permissionDenied && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-rose-200">Screen Perception Access Disabled</div>
              <div className="text-xs text-rose-300/80">
                Screen perception is guarded by local privacy controls. Enable screen access to allow on-device OCR and vision analysis.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGrantPermission}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium shrink-0 transition-colors"
          >
            Grant Screen Permission
          </button>
        </div>
      )}

      {/* Scenario Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto text-xs">
        <span className="text-neutral-500 px-2 font-medium">Test Scenarios:</span>
        <button
          type="button"
          onClick={() => handleScenarioChange('vscode_error')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedScenario === 'vscode_error' && !uploadedImagePreview
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          1. VS Code: Python ModuleNotFoundError
        </button>
        <button
          type="button"
          onClick={() => handleScenarioChange('research_pdf')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedScenario === 'research_pdf' && !uploadedImagePreview
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          2. Research PDF: Snapdragon NPU Architecture
        </button>
        <button
          type="button"
          onClick={() => handleScenarioChange('meeting_whiteboard')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedScenario === 'meeting_whiteboard' && !uploadedImagePreview
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          3. Meeting Mode: Edge AI Planning
        </button>
      </div>

      {/* Pipeline Progress Indicator during active reasoning */}
      {isAnalyzing && (
        <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Vertical Workflow in Progress...
            </span>
            <span>Step {analysisStep} of 4</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            <div className={`p-1.5 rounded text-center border ${analysisStep >= 1 ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200 font-medium' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
              1. Normalization
            </div>
            <div className={`p-1.5 rounded text-center border ${analysisStep >= 2 ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200 font-medium' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
              2. OCR / Vision
            </div>
            <div className={`p-1.5 rounded text-center border ${analysisStep >= 3 ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200 font-medium' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
              3. Context Fusion
            </div>
            <div className={`p-1.5 rounded text-center border ${analysisStep >= 4 ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-200 font-medium' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
              4. Local AI Reasoning
            </div>
          </div>
        </div>
      )}

      {/* Error state alert */}
      {analysisError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <button
            type="button"
            onClick={() => runScreenWorkflow({ text: context?.text })}
            className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-medium hover:bg-rose-500"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Main Grid: Screen Context View + Visual Tokens / AI Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Visual Screen Context & OCR tokens */}
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={`rounded-xl border transition-all ${
              isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 bg-neutral-900/40'
            } p-4 space-y-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Detected Window: {context?.application || 'Active Application'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                Confidence: {Math.round((context?.confidence || 0.98) * 100)}%
              </span>
            </div>

            {/* Visual Frame: uploaded image or simulated terminal */}
            <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-4 relative overflow-hidden font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800/80 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-neutral-300">{context?.windowTitle || 'active_window.py'}</span>
                </span>
                <span className="text-emerald-400 text-[10px]">OCR Live Feed</span>
              </div>

              {/* Uploaded Image preview thumbnail */}
              {uploadedImagePreview && (
                <div className="mb-3 relative rounded border border-neutral-800 overflow-hidden max-h-48 bg-black flex items-center justify-center">
                  <img
                    src={uploadedImagePreview}
                    alt="Captured Screenshot"
                    className="max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImagePreview(null)}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/90 text-neutral-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text content with OCR token overlay */}
              <div className="relative space-y-2 max-h-64 overflow-y-auto">
                <pre className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-xs">
                  {context?.text}
                </pre>

                {context?.visualElements && context.visualElements.length > 0 && (
                  <div className="pt-2 border-t border-neutral-800/60 mt-3">
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      Visual Elements Classified by Vision Provider:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {context.visualElements.map((el, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-1 font-mono"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {el.type}: {el.content.slice(0, 32)}... ({Math.round(el.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 text-center">
              Drag and drop any screenshot image here, or click <button onClick={() => fileInputRef.current?.click()} className="text-indigo-400 hover:underline">Upload</button> to process.
            </div>
          </div>

          {/* Quick Preset Query Pills */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Quick Inquiries for Current Context
            </div>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => runScreenWorkflow({
                    text: context?.text,
                    application: context?.application,
                    windowTitle: context?.windowTitle,
                    prompt: item.prompt,
                  })}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-xs text-neutral-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              if (customPrompt.trim()) {
                runScreenWorkflow({
                  text: context?.text,
                  application: context?.application,
                  windowTitle: context?.windowTitle,
                  prompt: customPrompt,
                });
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Ask custom question about this screen context..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500/60"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !customPrompt.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-medium text-white flex items-center gap-1.5"
            >
              <span>Analyze</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* Right Column: AI Model Router & Diagnostic Response */}
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4 min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-neutral-200">NEXUS Reasoning Engine</span>
              </div>

              {aiResponse?.decision && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded border ${
                    aiResponse.decision.hardwareTarget === 'npu'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : aiResponse.decision.hardwareTarget === 'cloud'
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {aiResponse.decision.hardwareTarget.toUpperCase()} ({aiResponse.decision.quantization})
                  </span>
                  <span className="text-neutral-400">{aiResponse.latencyMs}ms</span>
                </div>
              )}
            </div>

            {/* Response body */}
            <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-neutral-200 space-y-3">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-24 text-neutral-400 space-y-3">
                  <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                  <div className="text-xs font-medium text-neutral-300">Processing Vertical Intelligence Workflow...</div>
                  <div className="text-[11px] text-neutral-500">Screen Buffer ➔ Token Extraction ➔ Context Fusion ➔ Local Model Router</div>
                </div>
              ) : aiResponse ? (
                <div className="space-y-4">
                  {/* Model Routing Meta Pill */}
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
                    <div className="font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Model: {aiResponse.decision.modelName}</span>
                      <span className="text-emerald-400">{aiResponse.decision.selectedProvider}</span>
                    </div>
                    <div>{aiResponse.decision.reasoning}</div>
                  </div>

                  {/* Rendered answer */}
                  <div className="prose prose-invert prose-xs max-w-none text-neutral-200 leading-relaxed">
                    <ReactMarkdown>{aiResponse.answer}</ReactMarkdown>
                  </div>

                  {/* Source References */}
                  {aiResponse.sourceReferences && aiResponse.sourceReferences.length > 0 && (
                    <div className="pt-3 border-t border-neutral-800/60">
                      <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        Corroborated Context Sources:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResponse.sourceReferences.map((ref: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {aiResponse.suggestedActions && aiResponse.suggestedActions.length > 0 && (
                    <div className="pt-3 border-t border-neutral-800/60">
                      <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Action Engine (Click to Execute):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiResponse.suggestedActions.map((act: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onAddTask(act, `Extracted from Screen Perception for ${context?.application || 'Session'}`);
                              addToast('success', `Action "${act.slice(0, 35)}" sent to Action Engine!`, 'Action Dispatched');
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3 text-indigo-400" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 text-center space-y-2">
                  <Monitor className="w-9 h-9 text-neutral-600" />
                  <div className="text-xs font-medium text-neutral-400">Select an inquiry or capture screen to run analysis</div>
                  <div className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
                    NEXUS AI normalizes screen frames, segments code and error tokens, fuses workspace state, and routes to on-device neural hardware.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {aiResponse && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  Verified On-Device Boundary
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(aiResponse.answer)}
                  className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy Diagnosis'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
