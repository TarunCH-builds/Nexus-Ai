# NEXUS AI: System Architecture & Runtime Detection

## 1. High-Level Pipeline Architecture

NEXUS implements a hardware-aware architecture designed to prioritize on-device execution on Qualcomm Snapdragon X Elite processors while maintaining fallback operation on standard x86_64 and ARM64 hosts.

```
+-------------------------------------------------------------------------+
|                              NEXUS INPUT                                |
|    [Screen Stream]    [Voice Stream]    [Documents]    [User Query]     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         CONTEXT FUSION ENGINE                           |
|       - Multimodal Normalization                                        |
|       - Privacy Policy Enforcement (Local / Hybrid / Cloud)             |
|       - Active Workspace & Entity Resolution                            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           AI MODEL ROUTER                               |
|       - Task Type Classification (reasoning, vision, embedding, etc.)   |
|       - Capability Matching & Routing Matrix                            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    RUNTIME CAPABILITY DETECTION                         |
|   EnvironmentDetector queries:                                          |
|   - Host Architecture (ARM64 vs. x86_64)                                |
|   - Operating System (Windows 11 vs. Linux / Darwin)                    |
|   - Processor Model (Snapdragon X Elite, Oryon, Hexagon NPU)            |
|   - Native QNN Execution Provider Driver (QnnHtp.dll / libQnnHtp.so)     |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------------------+   +---------------------------------+
|  QUALCOMM RUNTIME (HP Snapdragon) |   |  SUPPORTED FALLBACK RUNTIME     |
|  - Qualcomm AI Engine Direct SDK  |   |  - Local CPU Vector Engine      |
|  - ONNX Runtime with QNN Ep       |   |  - SIMD Float32Array Operations |
|  - INT4 / INT8 Quantized Binaries |   |  - In-Memory LRU Cache Engine   |
+-----------------------------------+   +---------------------------------+
          |                                                   |
          v                                                   v
+-----------------------------------+   +---------------------------------+
|   HEXAGON NPU ACCELERATION        |   |   CPU VECTOR ACCELERATION       |
|   - 45 TOPS Tensor Core           |   |   - Memory-bus optimized math   |
|   - 4-8W Thermal Envelope         |   |   - Multi-core thread execution |
|   - Zero Host Battery Drain       |   |   - Uncompromised privacy       |
+-----------------------------------+   +---------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           RESULT / ACTION                               |
|   [Context-Aware Answer]  [Task Extraction]  [Audit Record Logged]      |
+-------------------------------------------------------------------------+
```

---

## 2. Runtime Capability Detection Mechanism

Located in `server/ai/environmentDetector.ts`:
1. **OS & Host Probe**: Inspects `os.platform()`, `os.arch()`, `os.cpus()`, and `/proc/cpuinfo` flags.
2. **Snapdragon Signature Check**: Matches CPU model strings against Qualcomm identifiers (`snapdragon`, `qualcomm`, `oryon`, `sc8380`, `x1e`).
3. **QNN Driver Verification**: Verifies presence of Windows ARM64 `QNN_SDK_ROOT` and `QnnHtp.dll`.
4. **Active Tier Decision**:
   - If Windows 11 ARM64 + Snapdragon verified: Selects **Qualcomm Hexagon NPU (QNN)**.
   - If in Linux/Docker/Cloud container: Selects **Local CPU Vector Engine** with an explicit reason logged in telemetry.

---

## 3. Asynchronous & Cached Processing

- **Embedding LRU Cache (`ModelCacheEngine`)**: Stores pre-computed vector projections for frequent document tokens and prompt queries, yielding a 90%+ latency drop for cached lookups.
- **Background Worker Queue**: Heavy document indexing and vector hash generation are decoupled from the main HTTP thread using a non-blocking asynchronous FIFO queue.
