# NEXUS AI: Deployment & Target HP PC Verification Guide

This guide describes how to deploy NEXUS AI on the target **HP OmniBook X (Qualcomm Snapdragon X Elite, Windows 11 ARM64)** and verify native Hexagon NPU hardware acceleration.

---

## 1. Prerequisites on the Target Machine

- **Hardware**: HP OmniBook X or Snapdragon X Elite / Plus PC
- **OS**: Windows 11 ARM64 (Build 26100+ recommended)
- **Node.js**: Node.js v20.x+ (Windows ARM64 native binary)
- **Qualcomm Drivers**: Qualcomm AI Engine Direct SDK v2.24+ (QNN)

---

## 2. Setting Up the Qualcomm QNN Environment

1. Download the Qualcomm AI Engine Direct SDK from the Qualcomm Developer Network or Qualcomm AI Hub.
2. Extract the SDK to `C:\Qualcomm\QNN` and set system environment variables:
   ```cmd
   setx QNN_SDK_ROOT "C:\Qualcomm\QNN"
   setx PATH "%PATH%;C:\Qualcomm\QNN\lib\aarch64-windows-msvc"
   ```
3. Verify that `QnnHtp.dll` (Hexagon Tensor Processor driver) is accessible:
   ```cmd
   where QnnHtp.dll
   ```

---

## 3. Cloning and Building NEXUS

```cmd
git clone <nexus-repo-url>
cd nexus-ai

REM Install Node.js dependencies
npm install

REM Compile frontend and backend bundle
npm run build

REM Launch the production server
npm start
```

---

## 4. Verifying Hardware NPU Acceleration

1. Open your browser and navigate to `http://localhost:3000`.
2. Navigate to the **AI Performance Lab** tab.
3. Observe the **Runtime Environment Audit** card:
   - Architecture should display `ARM64`.
   - Hexagon NPU Status should transition from `Unavailable in Container` to:
     `Qualcomm Hexagon NPU 45 TOPS Active (QNN Ep)`.
4. Open **Windows Task Manager**:
   - Go to **Performance** > **NPU**.
   - In NEXUS, click **Run Measured Benchmarks** or upload a document to trigger local embedding generation.
   - Observe the NPU activity spike while CPU utilization stays flat (< 8%).
