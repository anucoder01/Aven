# Deviations from Original Plan

## Final Models Used
- **LLM**: The environment defaults to the Groq API using `llama-3.3-70b-versatile` because a local Ollama daemon (`qwen2.5:3b`) proved too slow or inconsistent on typical testing hardware, or simply wasn't booted up in time.

## Bugs Found and Fixed
1. **The Mic Crash**: Originally, concurrent voice events fired duplicate LLM requests, breaking the conversation state. This was fixed by implementing a "walkie-talkie" concurrency lock on the frontend state.
2. **Missing `scenario_id` in ReportPage**: The fear hierarchy wasn't tracking because the `scenario_id` was hardcoded. This was dynamically mapped in `ReportPage.jsx`.
3. **ESLint Chaos**: A slew of React dependency array and unused variable warnings were squashed to stabilize the dev build.

## Descoped or Simplified
- **Local Transcriptions (Whisper)**: Audio transcripts were shifted to simpler Browser APIs rather than a robust server-side Whisper pipeline due to complexity and processing time.
- **Biomarker Database Structure**: The system successfully uses PostgreSQL via Docker (as originally designed) for persistence, rather than a more complex distributed setup.
- **All Levels Unlocked**: Initially, difficulty levels required progressive unlocking. Based on feedback, we opted to unlock all levels so users can pick and choose scenarios immediately.

## Target Conference
**Reminders**: This project is targeting an IEEE Symposium/Conference. The standard IEEE template is 6-8 pages, 2-column format. Since you mentioned "survey paper", ensure the literature review incorporates the facial/vocal biomarker validity.
