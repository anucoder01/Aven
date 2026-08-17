# Current Architecture & Routes

## Backend Routes Implemented

### **LLM & Character (/llm)**
- `POST /llm/character`: Streams AI responses for the roleplay. Implements the fallback chain and respects the concurrency lock pattern.
- `POST /llm/report`: Generates the structured CBT JSON report using the session transcript and detected cognitive distortions.
- `POST /llm/generate-scenario`: Creates a dynamic custom character persona based on a prompt.

### **Biomarkers (/biomarker)**
- `POST /biomarker/voice`: Accepts webm audio, converts to wav via ffmpeg, and processes it using Praat (Parselmouth) to extract jitter, shimmer, and pitch. Flags spikes based on rolling baselines.
- `GET /biomarker/voice/baseline/{user_id}`: Computes and returns the historical vocal baseline if >= 3 sessions are completed.
- `POST /biomarker/facial`: Accepts client-side MediaPipe emotion/tension indices and persists them to the database.

### **Other**
- `GET /health`: Healthcheck.

## Request Flow for a Voice Message
1. User speaks -> Frontend `MediaRecorder` captures audio.
2. The user's audio is transcribed locally (using Web Speech API or similar).
3. The transcription is sent to `POST /llm/character` along with the conversation history.
4. Concurrently, the raw audio chunk is POSTed to `/biomarker/voice` for acoustic analysis.
5. The `llm` route streams back character dialogue.
6. The character dialogue is spoken aloud via browser `SpeechSynthesis`.

## LLM Provider Fallback Chain
**Status**: The chain is designed as `Ollama -> Groq -> Gemini -> OpenAI`.
**Reality**: It was tested primarily on Groq (using `llama-3.3-70b-versatile`). Ollama is configured for `qwen2.5:3b` but requires a running daemon. Gemini throws deprecation warnings regarding the `google.generativeai` package.
