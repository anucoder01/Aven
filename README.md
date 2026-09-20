# Aven: Clinical-Grade Social Anxiety CBT Simulator

Aven is a next-generation exposure therapy tool designed to help individuals with social anxiety practice difficult conversations in a safe, deeply realistic, and scientifically grounded environment.

By combining **graduated exposure therapy simulation** with a **fine-tuned RoBERTa cognitive distortion classifier** and **vocal biomarker analysis**, Aven offers a private, clinically rigorous space to overcome social fear.

---

## 🌟 Key Features

### 1. Graduated Exposure Therapy Engine
Practice 25 highly distinct, real-world scenarios across 6 core domains: *Authority, Strangers, Group Dynamics, Assertiveness, Workplace, and Intimacy*.
- **Escalating Difficulty:** Characters scale from Level 1 (Warm & Cooperative) to Level 5 (Hostile, Interrupting, and Dismissive).
- **Persistent Memory:** Characters remember your past interactions and organically bring up your previous failures or successes to maintain realism.
- **Human-like Latency:** The AI simulates human cognitive load, responding instantly when friendly (L1) but pausing deliberately to "judge" you before delivering hostile replies (L5).

### 2. Real-Time Cognitive Distortion Classification
Aven's core research contribution is a custom-trained RoBERTa model that operates asynchronously during your session.
- Analyzes **15 distinct cognitive distortions** (e.g., Catastrophizing, Mind Reading, All-or-Nothing).
- Features a **dual-head architecture** to provide multi-label classification and **severity scoring (1–5)** simultaneously for every message.
- **v1 Trained Checkpoint achieved Val Macro-F1 = 0.7029** over 6 epochs, after overcoming 4 documented training failures (silent fake data, label mismatch, class-weight collapse, threshold under-shooting). See [`ROBERTA_UPDATES.md`](ROBERTA_UPDATES.md) for the full empirical log.
- Inference threshold calibrated to **0.35** (empirically validated against the v1 checkpoint) across both `ml/model.py` and the `/classify/` API endpoint.

### 3. Avoidance, Vocal & Facial Emotion Biomarker Tracking
Aven listens to *how* you speak and observes your non-verbal cues in real time.
- **Avoidance Detection:** Flags hedging, deflection, topic changes, and message abandonment mid-session.
- **Vocal Baseline Analysis:** In Voice Mode, Aven measures your pitch elevation, jitter, filler word rate, and speech rate against your personal baseline with continuous mic hardware deconfliction.
- **Facial Emotion & Tension Tracking:** Uses on-device MediaPipe Face Landmarker to extract 52 facial blendshapes, computing a composite Facial Tension Index and real-time emotion breakdowns (Happiness, Sadness, Anger, Fear, Surprise, Disgust).

### 4. Interactive 3D AI Companion Orb & Landing Page Voice Agent
- **Procedural 3D Visualizer:** Driven by WebGL, React Three Fiber, and custom shaders with multi-light rigs and audio-reactive particle rings.
- **Dynamic State System:** Visualizes AI states (*Idle, Listening, Speaking, Thinking*) with state-aware glowing colors and physics distortion.
- **Interactive Voice Greetings:** Landing page orb features conversational intent handling and automatic audio greetings.

### 5. Surgical Post-Session Analysis & Clinician Dashboard
At the end of a session, Aven generates a beautiful, actionable CBT report:
- Color-coded annotated transcripts highlighting distortions and assertive moments.
- Specific, CBT-grounded reframes using your *exact words*.
- Assertiveness scoring (1–10) with breakdowns on directness and confidence markers.
- **Clinician Portal Sync & Fear Hierarchy Tracking:** Live synchronization of session analytics and automatic completion tracking across user fear hierarchies.

### 6. Deep Clinical Safety & Resilient Streaming Systems
Aven prioritizes user safety and seamless streaming performance above all else.
- **SUDS Tracking:** Mid-session Subjective Units of Distress Scale (SUDS) checks. If SUDS > 75, the app automatically triggers a pause protocol.
- **Crisis NLP Detector:** A separate, async NLP pipeline constantly monitors for crisis language, surfacing immediate helpline resources and safely terminating the session.
- **Integrated Breathing Tools & Ambient Soundscapes:** Procedural Web Audio API engine providing brown noise soundscapes and physiological sigh breathing guides.
- **Resilient SSE Streaming Engine & Roleplay Guardrails:** Stream buffering in React for fragmented JSON packets, combined with real-time `<think>` tag sanitization and zero-breakout prompt constraints to enforce 1–3 sentence spoken human realism.

---

## 🚀 Why Aven is Better Than Existing Systems

| Feature | Generic AI Chatbots (ChatGPT/Claude) | Traditional VR Exposure Therapy | **Aven** |
| :--- | :--- | :--- | :--- |
| **Realism** | Often break character, use overly helpful "therapy speak", or apologize unprompted. | Scripts are pre-recorded and rigid. You cannot have an organic conversation. | **Strictly enforced human realism**. Characters never break role, use therapy language, or act like an AI. |
| **Analysis Depth** | Provide generic, high-level summaries after you ask for them. | Require a human therapist to review recordings later. | **Real-time, multi-label distortion detection**, facial emotion tracking, and exact-quote reframing. |
| **Progression** | No structured fear hierarchy or graduated difficulty. | Difficult to tune precisely to the patient's exact breaking point. | **5 precise difficulty levels** per scenario, from cooperative to deliberately hostile and gaslighting. |
| **Safety Guardrails** | Lack physiological monitoring; will continue roleplay even if you are spiraling. | Expensive biometric hardware required. | Built-in SUDS tracking, **vocal & facial biomarker stress detection**, and crisis termination protocols. |
| **Modality** | Primarily text-based; voice mode is not optimized for therapeutic latency. | Visual-heavy, but conversation branching is limited. | **Voice + Text** with <1.2s round-trip latency and mid-session modality switch detection. |

---

## 🛠 Tech Stack
- **Frontend:** React + Vite, TailwindCSS, Framer Motion, Three.js / React Three Fiber, Web Audio API
- **Backend:** FastAPI, Python, SQLite (local fallback) / PostgreSQL, SQLAlchemy, Pydantic v2
- **Machine Learning & Signal Processing:**
  - **RoBERTa (Transformer):** Fine-tuned for multi-label cognitive distortion classification. v1 checkpoint achieves **Val Macro-F1 = 0.7029**.
  - **MediaPipe Face Landmarker (CNNs):** On-device WebAssembly BlazeFace & Mesh model for extracting 52 facial blendshapes (Facial Tension Index & 6 emotion metrics).
  - **WebRTC VAD (Gaussian Mixture Models):** Voice Activity Detection for speech rate estimation.
  - **Parselmouth/Praat (DSP):** Acoustic signal processing for extracting physiological voice tremors (F0 Pitch, Jitter, Shimmer).
  - **Generative LLMs & SSE Sanitizer:** Dynamic CBT roleplay generation with stream chunk buffering and reasoning tag stripping.

---

## 🤖 LLM Provider Support

Aven supports multiple LLM backends with automatic provider detection and fallback chaining. Configure any one (or more) of the following in `backend/.env`:

| Priority | Provider | Env Key | Default Model | Notes |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Ollama** (local) | *(no key needed)* | `qwen2.5:3b` | Zero-cost, fully private |
| 2 | **Groq** | `GROQ_API_KEY` | `openai/gpt-oss-20b` | Ultra-fast; free tier available ✅ |
| 3 | **Gemini** | `GEMINI_API_KEY` | `gemini-2.0-flash` | Google AI |
| 4 | **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` | GPT-4o series |
| 5 | **Anthropic** | `ANTHROPIC_API_KEY` | `claude-3-5-haiku-20241022` | Claude series |

**Groq fallback chain** (tried in order on rate-limit/error):
`openai/gpt-oss-20b` → `openai/gpt-oss-120b` → `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` → `groq/compound-mini`

> **Deprecated models removed:** `qwen/qwen3.6-27b`, `Mixtral 8x7B`, `Gemma 2 9B IT`, `QwQ-32B`, `llama3-groq-*-tool-use-preview`. Do NOT use these IDs — they cause decommission crashes.

---

## 🚀 How to Run the Project

### 1. Configure Environment Variables
Copy the template and fill in at least one LLM provider key:
```bash
cp backend/.env.example backend/.env
# Then edit backend/.env with your keys
```

### 2. Start the Backend (FastAPI)
Open a terminal, navigate to the `backend` folder, and start the Python server:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will run on `http://localhost:8080`.*

### 3. Start the Frontend (React + Vite)
Open a second terminal in the root project folder (`Aven`), install dependencies, and start the development server:
```bash
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173` (or similar).*

### 4. RoBERTa Model Checkpoint (Optional)
The v1 fine-tuned checkpoint (`best_model.pt`, ~477 MB) is not tracked in Git due to GitHub's file size limit. To enable live RoBERTa inference:
1. Download or train `best_model.pt` via the Colab notebook in `ml/`.
2. Place it at `backend/ml/checkpoints/v1/best_model.pt`.
3. The backend will auto-detect and load it on startup. The `/classify/` endpoint will return `"model_used": "roberta-base-finetuned"`.

Without the checkpoint, Aven falls back to keyword-based heuristic classification.

---

*Disclaimer: Aven is a training tool and CBT simulator. It is not a replacement for professional psychiatric care or human therapists. For the therapist collaboration portal, please ensure your provider is registered.*

---

## Security
If you are deploying this project or pushing it to a public GitHub repository, make sure **NOT** to commit your `.env` files. The included `.gitignore` file is configured to exclude `.env` files, `__pycache__`, ML model checkpoints (`*.pt`, `*.bin`, `*.safetensors`), and the local SQLite database to prevent accidental leakage of API keys or large binary files. A template `.env.example` has been provided for reference.

## Copyright & License
Copyright &copy; 2026 Aven Social Anxiety CBT Simulator. All rights reserved.
This project is licensed under the MIT License - see the `LICENSE` file for details.
