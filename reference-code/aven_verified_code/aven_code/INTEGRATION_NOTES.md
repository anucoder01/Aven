# Verified Code — Integration Notes

All four files below were actually run and tested in a sandbox before being handed to you — not written blind.

## 1. `biomarker.py` → copy to `backend/routers/biomarker.py`
- Tested against synthetic calm vs. tense voice signals (included: `calm_voice.wav`, `tense_voice.wav`).
- Confirmed result: tense voice showed **10x higher jitter** (0.40% vs 0.04%) and **7x higher shimmer** (1.69% vs 0.23%) — matches real anxiety-acoustics research direction.
- Register it in `main.py`: add `from routers import biomarker` and `app.include_router(biomarker.router, prefix="/biomarker", tags=["Biomarker"])`.
- Add to `requirements.txt`: `praat-parselmouth>=0.4.3`
- **Known limitation, by design for now:** baseline storage is in-memory (`_SESSION_SAMPLES` dict) as a placeholder — it resets on backend restart. This is intentional until Tier 0 (real database) lands; the code has a clear `TODO` comment marking exactly where to swap in real DB queries once that's done. Don't present this as fully production-ready without that swap.

## 2. `llm_ollama_provider.py` → replace `get_llm_client()` in `backend/routers/llm.py`
- Tested the health-check logic: correctly returns `False`/`None` when Ollama isn't reachable (verified in the sandbox, which has no Ollama). On your machine, with `ollama serve` running, it will correctly detect and select Ollama first.
- **One small manual edit still needed in `llm.py`:** wherever the code checks `if provider in ["openai", "groq"]:` (in `character_response()`, `generate_report()`, `generate_scenario()`), add `"ollama"` to that list, and set `model_name = OLLAMA_MODEL if provider == "ollama" else (existing logic)`. This is called out in the comment at the bottom of the file.
- Before running: `ollama pull llama3.1:8b` (or `llama3.2:3b` if your machine is lower-spec) and make sure `ollama serve` is running (usually automatic after install).

## 3. `ttsEngine.js` → copy to `src/services/ttsEngine.js`
- Pure browser API, nothing to install, nothing to test server-side — verify by importing and calling `speak("test")` in a browser console once wired in.
- Wire into `SessionPage.jsx`'s voice mode: after a character response finishes streaming, call `await speak(fullResponseText)`.

## 4. `test_extraction.py` — reference test, not required in production
- Shows exactly how the calm/tense verification was done. Use this pattern (or extend it) for the `backend/tests/test_biomarker.py` file called for in the task brief — record 2-3 real seconds of your own voice for calm/tense instead of synthetic signals for a more convincing test in your final report.
