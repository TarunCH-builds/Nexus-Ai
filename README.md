# NEXUS AI: On-Device Multimodal AI Workspace for Snapdragon PCs

**NEXUS AI** is an on-device, privacy-first multimodal intelligence workspace optimized for next-generation AI PCs powered by **Qualcomm Snapdragon X Elite** and **Hexagon NPU** (such as the HP OmniBook X).

Unlike cloud-dependent assistants, NEXUS processes screen context, vector search, document intelligence, meeting transcription, and reasoning on-device, backed by deterministic hardware capability detection and a zero-leak privacy boundary.

---

## ⚡ Architecture Flow

```
NEXUS
  ↓
AI MODEL ROUTER
  ↓
RUNTIME CAPABILITY DETECTION
  ↓
QUALCOMM / SUPPORTED RUNTIME
  ↓
HARDWARE ACCELERATION
  ↓
RESULT
```

### Detailed Pipeline Stages:
1. **NEXUS (Multimodal Ingestion)**: Screen frames, audio streams, document chunks, active window title & application metadata.
2. **AI MODEL ROUTER (Task Decomposition & Policy Gatekeeper)**: Evaluates task type (Reasoning, Vision, Embeddings, Summarization) and enforces active privacy policy (Local-Only, Hybrid, Cloud).
3. **RUNTIME CAPABILITY DETECTION**: Probes host architecture, OS platform, CPU model (Qualcomm Oryon/Snapdragon signature), Hexagon NPU status, and QNN execution provider driver (`QnnHtp.dll` / `libQnnHtp.so`).
4. **QUALCOMM / SUPPORTED RUNTIME**:
   - On Snapdragon PC: `Qualcomm AI Engine Direct (QNN)` / `ONNX-QNN Execution Provider`.
   - On Fallback Host: `Local CPU Vector Engine` with SIMD `Float32Array` operations.
5. **HARDWARE ACCELERATION**:
   - On Snapdragon PC: `Qualcomm Hexagon 45 TOPS NPU` executing INT4/INT8 quantized context binaries.
   - On Fallback Host: Memory-bus optimized CPU vector mathematics with in-memory LRU caching.
6. **RESULT**: Immediate, deterministic response, local context synthesis, zero-leak privacy boundary preserved, metric logged to local audit database.

---

## 🚀 Key Modules & Capabilities

1. **Context Fusion Engine**
   - Continuously normalizes screen context, open application titles, active projects, voice queries, and local clipboard state into unified context vectors.
2. **Smart Screen Understanding**
   - Live browser window/tab capture with local OCR tokenization, error code diagnosis, and bounding box spatial segmentation.
3. **Document Intelligence & Local RAG**
   - Ingests text, Markdown, code, and PDFs. Chunks documents into 250-character segments with 384-dimensional dense semantic embeddings generated and searched 100% on-device.
4. **Local AI Memory & Knowledge Graph**
   - Structured node-and-edge associative graph tracking project entities, meeting action items, and cross-document concepts without external cloud telemetry.
5. **AI Performance Lab & Snapdragon Edge Optimization**
   - Real, un-falsified system telemetry (RSS process memory, heap usage, CPU load sampling, micro-benchmark latencies).
   - Truthful reporting: displays `"Unavailable"` for GPU/NPU metrics when running in environments without physical accelerator drivers.
   - Comprehensive model compatibility matrix for Qualcomm AI Hub models (`llama-3.2-3b-instruct`, `bge-small-en-v1.5`, `mobilenet-v4-large`, `whisper-small-en`, `yolov8-nano-det`).
6. **Zero-Leak Privacy Center**
   - Granular hardware switches for Local Only (100% on-device NPU/CPU), Hybrid (local first with explicit user-granted cloud fallback), and Cloud-enabled modes, with an immutable audit log.

---

## 🛠️ Tech Stack & Runtime Rationale

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide icons, Motion
- **Backend**: Node.js, Express, Vite middleware
- **Local AI Engine**: Deterministic Float32Array SIMD semantic vector embeddings, Cosine search index, heuristic OCR boundary segmenter
- **Hardware Integration**: Qualcomm QNN Execution Provider (ONNX Runtime) driver detection, Windows 11 ARM64 target binding, graceful CPU fallback
- **Data Persistence**: Local-first relational document & context store with automated audit logging

---

## 💻 Quick Start & Development

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Port 3000)
npm run dev

# 3. Compile for production
npm run build

# 4. Run production server
npm start
```

---

## 📖 In-Depth Documentation

- [System Architecture & Runtime Detection](docs/ARCHITECTURE.md)
- [Snapdragon & Qualcomm AI Hub Optimization Guide](docs/SNAPDRAGON_OPTIMIZATION.md)
- [Benchmark Methodology (Real vs. Unavailable Metrics)](docs/BENCHMARK_METHODOLOGY.md)
- [HP Snapdragon PC Deployment & Verification Guide](docs/DEPLOYMENT_GUIDE.md)
