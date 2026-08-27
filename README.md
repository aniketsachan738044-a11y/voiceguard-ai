# 🛡️ VoiceGuard AI — Real-Time Voice Cloning & AI-Generated Speech Detection

> **SIH Problem Statement SIH26104**: Real-time detection and risk-mitigation platform for synthetic voice clones, AI-generated speech deepfakes, and audio spoofing attacks.

---

## 📌 Overview

**VoiceGuard AI** is a full-stack, deployable security prototype developed for **Smart India Hackathon (SIH26104)**. It analyzes short audio clips (5–15 seconds)—either recorded live via the browser microphone or uploaded as WAV/MP3/WebM/OGG files—and evaluates them using deep anti-spoofing neural models (`lab260/AASIST3` & spectro-temporal feature extraction). 

The system computes a **Risk Score (0–100)** with color-coded risk labels (**Low / Medium / High**), presents acoustic feature diagnostic breakdowns, triggers real-time **Twilio SMS alerts** when threshold limits are breached, and maintains a persistent audit log in **MongoDB**.

---

## 🏗️ Architecture & Tech Stack

```
                        ┌──────────────────────────────────────────┐
                        │      React (Vite) + Tailwind CSS         │
                        │    Browser Mic & Drag-and-Drop Upload    │
                        └────────────────────┬─────────────────────┘
                                             │ HTTP REST / API
                                             ▼
                        ┌──────────────────────────────────────────┐
                        │         Node.js / Express Backend        │
                        │   (Orchestrator, Twilio SMS & MongoDB)   │
                        └─────────────┬────────────────┬───────────┘
                                      │                │
            ┌─────────────────────────┘                └─────────────────────────┐
            ▼                                                                    ▼
┌───────────────────────┐                                            ┌───────────────────────┐
│  FastAPI ML Service   │                                            │    MongoDB Database   │
│ PyTorch, Torchaudio,  │                                            │ (Analysis Log History │
│   Librosa, AASIST3    │                                            │  & Threshold Settings)│
└───────────────────────┘                                            └───────────────────────┘
```

### Stack Components:
- **ML Microservice (`/ml-service`)**: Python 3.11, FastAPI, PyTorch, Torchaudio, Librosa, SoundFile, Transformers (`lab260/AASIST3`).
- **App Backend (`/server`)**: Node.js, Express, Mongoose (MongoDB), Multer (Audio streaming), Twilio SDK (SMS Alerting).
- **Client Frontend (`/client`)**: React 18 (Vite), Tailwind CSS, Lucide Icons, HTML5 MediaRecorder API & Web Audio API Visualizer.
- **Containerization**: `docker-compose.yml` multi-container setup for one-command execution.

---

## 🚀 Key Features

1. **Dual Audio Input**:
   - **Live Microphone Recording**: 5–15 second capture with a live Web Audio API frequency visualizer and countdown timer.
   - **Drag-and-Drop Upload**: Supports WAV, MP3, OGG, WebM, M4A up to 15 MB.
2. **AASIST3 + Spectro-Temporal Anti-Spoofing Engine**:
   - Evaluates **Spectral Flatness Smoothness** (detects neural vocoder artifacts).
   - Measures **Pitch Jitter & Phase Coherence** (detects synthetic vocal tract rigidity).
   - Computes **High-Frequency Artifact Ratio** (>6 kHz phase ringing and energy cutoffs).
3. **Interactive Risk Gauge & Diagnostics**:
   - SVG semi-circle gauge displaying risk score (0-100), confidence level, and verdict.
   - Color-coded badges: **Low Risk (Green: 0-39)**, **Medium Risk (Amber: 40-69)**, **High Risk (Red: 70-100)**.
4. **Twilio SMS Alerting**:
   - Dispatches real-time SMS alerts when risk score crosses configurable threshold (Default: `70/100`).
   - Supports **Mock Sandbox Mode** when live API credentials are omitted so the demo never fails.
5. **Persistent Audit History**:
   - Filterable, searchable table displaying past voice analyses stored in MongoDB (with automatic in-memory fallback).

---

## 🛠️ Quickstart Guide

### Option 1: Run with Docker Compose (Recommended)

Ensure Docker Desktop is installed and running, then execute:

```bash
docker-compose up --build
```

Access the services:
- **Frontend Dashboard**: `http://localhost:3000`
- **Express Backend API**: `http://localhost:5000/api/health`
- **FastAPI ML Service**: `http://localhost:8000/health`
- **FastAPI OpenAPI Specs**: `http://localhost:8000/docs`

---

### Option 2: Run Services Locally (Development Mode)

#### 1. Start ML Microservice (`/ml-service`)
```bash
cd ml-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start Express Backend (`/server`)
```bash
cd server
npm install
npm run dev
```

#### 3. Start React Client (`/client`)
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔑 Environment Variables Reference

Copy `.env.example` files to `.env` in the root and respective subdirectories:

```env
# General
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voiceguard
ML_SERVICE_URL=http://localhost:8000
MODEL_NAME=lab260/AASIST3

# Twilio SMS Credentials (Optional - omit for Mock Sandbox Mode)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+15005550006
ALERT_PHONE_NUMBER=+15005550006
```

---

## 🌐 Deployment to Free-Tier Hosting

| Component | Platform | Deployment Instructions |
|---|---|---|
| **`/client`** | Vercel / Netlify | Connect GitHub repo, set root directory to `client`, build command `npm run build`, output dir `dist`. |
| **`/server`** | Render / Railway | Deploy Web Service from `server` directory. Set `ML_SERVICE_URL` & `MONGODB_URI`. |
| **`/ml-service`** | Render / Railway | Deploy Docker container from `ml-service` directory. Free-tier CPU mode is supported. |
| **Database** | MongoDB Atlas | Create free M0 cluster and set `MONGODB_URI` connection string in Express server settings. |

---

## 💡 Simplifications & Future Scope (SIH Presentation Notes)

During your Smart India Hackathon presentation, highlight these technical simplifications and how they roadmap to production:

1. **Lightweight CPU Ensemble Model Strategy**:
   - *Current Implementation*: Combines `lab260/AASIST3` neural embeddings with high-speed spectro-temporal feature extraction for sub-second CPU inference on free-tier hosting.
   - *Future Scope*: GPU acceleration (CUDA) and fine-tuning on large multi-dialect datasets (ASVspoof 2024, MLAAD, SEA-Spoof).
2. **Alerting System**:
   - *Current Implementation*: Twilio SMS integration with Sandbox/Mock mode fallback.
   - *Future Scope*: Multi-channel incident routing (WhatsApp Business API, PagerDuty, Webhooks, Telegram bot).
3. **Edge / On-Device Inference**:
   - *Current Implementation*: Centralized microservice architecture.
   - *Future Scope*: Export model to ONNX / TensorFlow Lite for real-time client-side WebAssembly inference inside mobile banking apps.
4. **Live Telephony & Stream Interception**:
   - *Current Implementation*: Clip-based analysis (5–15 seconds).
   - *Future Scope*: Real-time WebRTC / SIP VoIP stream packet interception for mid-call voice cloning defense.
