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
- Analyzes 15 distinct cognitive distortions (e.g., Catastrophizing, Mind Reading, All-or-Nothing).
- Features a dual-head architecture to provide **multi-label classification** and **severity scoring (1–5)** simultaneously for every message.

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
  - **RoBERTa (Transformer):** Fine-tuned for multi-label cognitive distortion classification.
  - **MediaPipe Face Landmarker (CNNs):** On-device WebAssembly BlazeFace & Mesh model for extracting 52 facial blendshapes (Facial Tension Index & 6 emotion metrics).
  - **WebRTC VAD (Gaussian Mixture Models):** Voice Activity Detection for speech rate estimation.
  - **Parselmouth/Praat (DSP):** Acoustic signal processing for extracting physiological voice tremors (F0 Pitch, Jitter, Shimmer).
  - **Generative LLMs & SSE Sanitizer:** Dynamic CBT roleplay generation with stream chunk buffering and reasoning tag stripping.

## 🚀 How to Run the Project

### 1. Start the Backend (FastAPI)
Open a terminal, navigate to the `backend` folder, and start the Python server:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will run on `http://localhost:8080`.*

### 2. Start the Frontend (React + Vite)
Open a second terminal in the root project folder (`Aven`), install dependencies, and start the development server:
```bash
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173` (or similar).*

---

*Disclaimer: Aven is a training tool and CBT simulator. It is not a replacement for professional psychiatric care or human therapists. For the therapist collaboration portal, please ensure your provider is registered.*

---

## Security
If you are deploying this project or pushing it to a public GitHub repository, make sure **NOT** to commit your `.env` files. The included `.gitignore` file is configured to exclude `.env` files and `__pycache__` to prevent accidental leakage of your Groq or OpenAI API keys. A template `.env.example` has been provided for reference.

## Copyright & License
Copyright &copy; 2026 Aven Social Anxiety CBT Simulator. All rights reserved.
This project is licensed under the MIT License - see the `LICENSE` file for details.
