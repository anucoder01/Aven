# Current Feature Status

## 1. Character Roleplay
**PARTIALLY WORKING**
- **LLM in use**: The backend is configured to use Groq API (`llama-3.3-70b-versatile`) as the primary working provider. Although `OLLAMA_MODEL=qwen2.5:3b` is configured, it falls back to Groq if the local Ollama daemon isn't running or times out.
- **Responsiveness**: The LLM correctly responds to actual conversation content with specific character traits and dynamically scales with difficulty settings. It does not output the generic fallback response.

## 2. CBT Report Generation
**WORKING**
- The CBT report properly triggers after ending a session. It dynamically reads the session transcript and generates structured metrics (Assertiveness Score, Action Steps, Top Distortions) using the LLM.

## 3. Voice Biomarker Pipeline
**PARTIALLY WORKING**
- Audio capture via frontend works.
- Submitting to `/biomarker/voice` relies on `ffmpeg` being in the PATH to convert webm to wav before Praat analysis. 
- *Caveat*: If `ffmpeg` is not installed on the host machine, the backend handles this gracefully by flagging a warning, but the biomarker extraction fails.

## 4. Baseline Establishment
**WORKING**
- Yes, it still requires 3 sessions (`MIN_SESSIONS_FOR_BASELINE = 3`).
- Since the database (`aven.db` / PostgreSQL via SQLAlchemy) is fully wired up, this baseline survives a backend restart and properly queries all past sessions for a given user.

## 5. Facial Tension Detection
**WORKING**
- The MediaPipe face tracking is implemented client-side in `faceTensionEngine.js`.
- It visibly responds to facial states in the frontend and computes a live tension index. This data is successfully persisted to the database via the `/biomarker/facial` route.

## 6. Browser Text-to-Speech
**WORKING**
- Character voice utilizes the browser's built-in `SpeechSynthesis` API.

## 7. Mic Crash Issue
**WORKING**
- The previous race condition / crash where simultaneous voice inputs caused overlapping requests has been fixed via the "walkie-talkie" concurrency lock pattern.

## 8. Database Persistence
**WORKING**
- The PostgreSQL database (running via Docker on port 5433) is properly capturing and persisting User, Session, VoiceBiomarkerSample, and FacialTensionSample models. Sessions survive a backend restart.
