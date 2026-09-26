# NEXUS AI: Benchmark Methodology & Metric Transparency

## 1. Core Principle: Zero Number Fabrication

In strict compliance with Qualcomm Edge AI engineering standards, **NEXUS never fabricates benchmark or performance numbers**.

When a hardware metric can be directly queried or measured on the active host, the actual value is displayed. When a metric cannot be physically measured or the accelerator is not present in the current environment, the system displays:

> **"Unavailable"** (accompanied by an explanation of the missing hardware dependency).

---

## 2. Metric Measurement Breakdown

| Metric | How It Is Measured in NEXUS | Reported State in Container | Reported State on HP Snapdragon PC |
|---|---|---|---|
| **Process RSS Memory** | `process.memoryUsage().rss` in MB | Real Measured Value | Real Measured Value |
| **Heap Memory** | `process.memoryUsage().heapUsed` in MB | Real Measured Value | Real Measured Value |
| **CPU Utilization** | Sampled delta of `os.cpus()` user/sys ticks over an 80ms interval | Real Measured Value (%) | Real Measured Value (%) |
| **GPU Utilization** | Requires physical GPU driver (DirectX / Vulkan / Adreno) | `"Unavailable"` *(No GPU driver attached)* | Real Measured via WMI/DirectML |
| **NPU Status** | Probes Qualcomm QNN Driver (`QnnHtp.dll`) and host architecture | `"Unavailable in Container"` | `"Qualcomm Hexagon NPU 45 TOPS Active"` |
| **Model Cold-Load** | High-resolution timer (`performance.now()`) allocating tensor weights | Real Measured (ms) | Real Measured (ms) |
| **Vector Embedding Latency** | Iterative 384-dim calculation on sample text using high-res timer | Real Measured (ms) | Real Measured (ms via QNN INT8) |
| **OCR Tokenization Latency** | High-res timed parsing and bounding box boundary segmentation | Real Measured (ms) | Real Measured (ms) |
| **Document Processing Time** | Timed chunking (250 chars) and vector hashing of 10,000 characters | Real Measured (ms) | Real Measured (ms) |
| **Reasoning Latency** | End-to-end execution of diagnostic reasoning on context | Real Measured (ms) | Real Measured (ms) |

---

## 3. How to Trigger Live Benchmarks

1. Open the **AI Performance Lab** view in NEXUS.
2. Click **Run Measured Benchmarks**.
3. The server executes timed workloads across the vector engine, OCR parser, and document indexer.
4. Real-time latencies, throughputs, and memory deltas are recorded in the local SQLite database and displayed in the results table.
