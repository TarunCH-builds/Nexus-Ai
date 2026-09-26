/**
 * NEXUS AI - Qualcomm / Snapdragon AI Layer
 * Hardware acceleration abstraction layer for Windows on Snapdragon HP PCs.
 * 
 * Target hardware:
 * - Qualcomm Snapdragon X Elite (X1E-84-100, X1E-80-100, X1E-78-100) & X Plus
 * - Qualcomm Hexagon NPU (up to 45 TOPS INT8 / FP16)
 * - Qualcomm Adreno GPU (DirectML / OpenCL)
 * - Qualcomm Oryon CPU (12 cores / 10 cores ARM64)
 * 
 * Runtime Targets:
 * - ONNX Runtime with QNN Execution Provider (QNNExecutionProvider)
 * - Qualcomm AI Hub (Direct QNN / DLC model artifacts)
 * - Microsoft DirectML Execution Provider
 * - Fallback: ARM64 CPU / NEON / Wasm / x64 Fallback
 */

import os from 'os';
import { SystemHardwareStatus, HardwareTarget, ModelRoutingDecision, TaskType } from '../../src/types/index.js';
import { EnvironmentDetector } from './environmentDetector.js';

export interface IRuntimeAdapter {
  isHardwareSupported(): boolean;
  getHardwareStatus(): SystemHardwareStatus;
  executeInference(task: TaskType, modelName: string, input: any): Promise<{
    output: any;
    latencyMs: number;
    tokensPerSecond?: number;
    provider: string;
    hardware: HardwareTarget;
  }>;
}

export class QualcommRuntimeAdapter implements IRuntimeAdapter {
  public isHardwareSupported(): boolean {
    const report = EnvironmentDetector.getReport();
    return report.qualcommCompatibility.nativeHexagonNpuAvailable;
  }

  public getHardwareStatus(): SystemHardwareStatus {
    return EnvironmentDetector.toHardwareStatus();
  }

  public async executeInference(task: TaskType, modelName: string, input: any): Promise<{
    output: any;
    latencyMs: number;
    tokensPerSecond?: number;
    provider: string;
    hardware: HardwareTarget;
  }> {
    const start = performance.now();
    // Simulate real Hexagon NPU execution characteristics: 45 TOPS INT8 execution
    // Very low latency, high token rate (~40-60 tok/s for 3B quantized models)
    await new Promise(res => setTimeout(res, 35));
    const duration = Math.round(performance.now() - start);

    return {
      output: `[QNN Hexagon NPU Output for ${task}]`,
      latencyMs: duration,
      tokensPerSecond: 52.4,
      provider: 'QNNExecutionProvider (Hexagon NPU INT8)',
      hardware: 'npu'
    };
  }
}

export class FallbackRuntimeAdapter implements IRuntimeAdapter {
  public isHardwareSupported(): boolean {
    return true; // Local CPU fallback always supported
  }

  public getHardwareStatus(): SystemHardwareStatus {
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Standard CPU';
    const totalMem = Math.round(os.totalmem() / (1024 * 1024));
    const freeMem = Math.round(os.freemem() / (1024 * 1024));

    return {
      platform: `${platform} (${os.release()})`,
      architecture: arch,
      isSnapdragon: false,
      processorName: cpuModel,
      npuAvailable: false,
      onnxQnnEpAvailable: false,
      directMLAvailable: false,
      totalMemoryMb: totalMem,
      availableMemoryMb: freeMem,
      activeProvider: 'cpu',
      fallbackReason: 'Local CPU Fallback (Clean Abstraction Layer)'
    };
  }

  public async executeInference(task: TaskType, modelName: string, input: any): Promise<{
    output: any;
    latencyMs: number;
    tokensPerSecond?: number;
    provider: string;
    hardware: HardwareTarget;
  }> {
    const start = performance.now();
    // Real CPU latency simulation
    await new Promise(res => setTimeout(res, 80));
    const duration = Math.round(performance.now() - start);

    return {
      output: `[Local CPU Execution for ${task}]`,
      latencyMs: duration,
      tokensPerSecond: 18.2,
      provider: 'CPUExecutionProvider (Local Fallback)',
      hardware: 'cpu'
    };
  }
}
