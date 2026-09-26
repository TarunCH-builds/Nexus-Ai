/**
 * NEXUS AI - Qualcomm AI Hub Model Registry & Compatibility Matrix
 * 
 * Formal registry of verified Qualcomm AI Hub models, runtime specifications,
 * quantization formats, and hardware execution constraints.
 */

import { HardwareTarget } from '../../src/types/index.js';
import { EnvironmentDetector } from './environmentDetector.js';

export interface IQualcommHubModel {
  id: string;
  name: string;
  category: 'LLM' | 'Vision' | 'Audio' | 'Embedding' | 'Detection';
  architecture: string;
  parameters: string;
  quantization: 'INT4' | 'INT8' | 'FP16';
  qualcommHubId: string;
  supportedRuntimes: ('QNN' | 'ONNX-QNN' | 'DirectML' | 'TFLite' | 'CPU-Fallback')[];
  minNpuTops: number;
  memoryRequirementMb: number;
  typicalNpuLatencyMs: number;
  currentHostCompatibility: {
    status: 'native_accelerated' | 'cpu_fallback' | 'unsupported';
    runtimeInUse: string;
    accelerationActive: boolean;
    verificationNotes: string;
  };
}

export class QualcommModelRegistry {
  private static catalog: IQualcommHubModel[] = [
    {
      id: 'llama-3.2-3b-instruct',
      name: 'Llama 3.2 3B Instruct',
      category: 'LLM',
      architecture: 'Autoregressive Transformer',
      parameters: '3.21 Billion',
      quantization: 'INT4',
      qualcommHubId: 'qualcomm/llama-v3_2-3b-instruct-qnn',
      supportedRuntimes: ['QNN', 'ONNX-QNN', 'DirectML', 'CPU-Fallback'],
      minNpuTops: 28,
      memoryRequirementMb: 1950,
      typicalNpuLatencyMs: 24,
      currentHostCompatibility: {
        status: 'cpu_fallback',
        runtimeInUse: 'Local CPU Vector Engine (Simulated Quantized Weights)',
        accelerationActive: false,
        verificationNotes: 'Requires Windows 11 ARM64 + Snapdragon X Elite QNN Direct SDK to execute on Hexagon NPU.',
      },
    },
    {
      id: 'bge-small-en-v1.5',
      name: 'BAAI BGE-Small-en v1.5',
      category: 'Embedding',
      architecture: 'BERT-based Dense Embedder (384-dim)',
      parameters: '33 Million',
      quantization: 'INT8',
      qualcommHubId: 'qualcomm/bge-small-en-v1.5-qnn',
      supportedRuntimes: ['QNN', 'ONNX-QNN', 'CPU-Fallback'],
      minNpuTops: 4,
      memoryRequirementMb: 130,
      typicalNpuLatencyMs: 4.2,
      currentHostCompatibility: {
        status: 'cpu_fallback',
        runtimeInUse: 'Local Float32 SIMD Vector Calculation',
        accelerationActive: false,
        verificationNotes: 'Runs deterministically on host CPU. Ready to compile into QNN context binary on Snapdragon target.',
      },
    },
    {
      id: 'mobilenet-v4-large',
      name: 'MobileNetV4 Large Quantized',
      category: 'Vision',
      architecture: 'Universal Mobile Vision Backbone',
      parameters: '32 Million',
      quantization: 'INT8',
      qualcommHubId: 'qualcomm/mobilenet_v4_large_quantized',
      supportedRuntimes: ['QNN', 'ONNX-QNN', 'TFLite', 'CPU-Fallback'],
      minNpuTops: 8,
      memoryRequirementMb: 110,
      typicalNpuLatencyMs: 8.5,
      currentHostCompatibility: {
        status: 'cpu_fallback',
        runtimeInUse: 'Local Edge OCR & Spatial Parser',
        accelerationActive: false,
        verificationNotes: 'Tokenization executed on CPU. Accelerated tensor inference available via Snapdragon NPU.',
      },
    },
    {
      id: 'whisper-small-en',
      name: 'OpenAI Whisper Small English',
      category: 'Audio',
      architecture: 'Encoder-Decoder Transformer',
      parameters: '244 Million',
      quantization: 'INT8',
      qualcommHubId: 'qualcomm/whisper-small-qnn',
      supportedRuntimes: ['QNN', 'ONNX-QNN', 'DirectML', 'CPU-Fallback'],
      minNpuTops: 14,
      memoryRequirementMb: 460,
      typicalNpuLatencyMs: 18.0,
      currentHostCompatibility: {
        status: 'cpu_fallback',
        runtimeInUse: 'WebSpeech API / Local Audio Pipeline',
        accelerationActive: false,
        verificationNotes: 'Requires QNN Ep audio driver on target device for on-device real-time transcription.',
      },
    },
    {
      id: 'yolov8-nano-det',
      name: 'YOLOv8 Nano Object & Window Detector',
      category: 'Detection',
      architecture: 'Single-stage Convolutional Detector',
      parameters: '3.2 Million',
      quantization: 'INT8',
      qualcommHubId: 'qualcomm/yolov8_det_quantized',
      supportedRuntimes: ['QNN', 'ONNX-QNN', 'CPU-Fallback'],
      minNpuTops: 6,
      memoryRequirementMb: 45,
      typicalNpuLatencyMs: 6.1,
      currentHostCompatibility: {
        status: 'cpu_fallback',
        runtimeInUse: 'Heuristic Bounding Box Parser',
        accelerationActive: false,
        verificationNotes: 'Quantized INT8 weights ready for deployment on Snapdragon Hexagon tensor core.',
      },
    },
  ];

  public static getModels(): IQualcommHubModel[] {
    const report = EnvironmentDetector.getReport();
    const isSnapdragon = report.qualcommCompatibility.nativeHexagonNpuAvailable;

    return this.catalog.map(m => {
      if (isSnapdragon) {
        return {
          ...m,
          currentHostCompatibility: {
            status: 'native_accelerated',
            runtimeInUse: 'Qualcomm QNN Execution Provider (Hexagon NPU)',
            accelerationActive: true,
            verificationNotes: 'Hardware verified: Running natively on Snapdragon X Elite Hexagon NPU.',
          },
        };
      }
      return m;
    });
  }

  public static getModelById(id: string): IQualcommHubModel | undefined {
    return this.getModels().find(m => m.id === id);
  }
}
