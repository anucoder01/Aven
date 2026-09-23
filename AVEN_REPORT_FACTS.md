# AVEN Comprehensive Fact-Based Repository Analysis Report

> **Methodology Note**: This report is strictly compiled from verified source code, configuration files, dataset scripts, test executions, and documentation within this repository. No numbers or specifications have been invented. Where an item is not present in the codebase, it is explicitly designated as **NOT FOUND**.

---

## 1. PROJECT OVERVIEW

### Folder Structure (2 Levels Deep)

- **`Aven/`** (Root workspace)
  - `package.json` — Frontend package metadata, dependencies (React 19, Three.js, MediaPipe, Zustand), and scripts.
  - `vite.config.js` — Vite bundler configuration, path aliases (`@` -> `./src`), and `/api` proxy definition.
  - `tailwind.config.js` — Tailwind CSS styling tokens, color definitions, and dark-mode themes.
  - `index.html` — Web application HTML entry point with Google Fonts preconnects (Inter, Outfit).
  - `aven.db` — SQLite database file storing local development sessions and biomarker logs.
  - `docker-compose.yml` — Container configuration for local PostgreSQL 15 database service on port 5433.
  - `testCharacters.ts` — Standalone TypeScript test script verifying prompt guidance generation across all characters.
  - `ROBERTA_UPDATES.md` — Detailed engineering log of RoBERTa fine-tuning runs, failures, root causes, and fixes.
  - `README.md` — Project documentation detailing clinical features, architecture, and setup instructions.

- **`backend/`** — FastAPI application backend server and API endpoints.
  - `main.py` — FastAPI application initialization, CORS middleware, lifespan database migrations, and root router mounts.
  - `config.py` — Pydantic Settings schema reading `.env` configuration (database, Redis, LLM API keys).
  - `database.py` — SQLAlchemy async database engine (`AsyncSessionLocal`) and declarative Base setup.
  - `models.py` — SQLAlchemy ORM models (`User`, `Session`, `VoiceBiomarkerSample`, `FacialTensionSample`, `BiomarkerBaseline`).
  - `requirements.txt` — Python backend dependencies (FastAPI, PyTorch, Transformers, Parselmouth, WebRTC VAD).
  - `.env.example` — Template environment variable configuration file.
  - `test_api.py` — Standalone test script for verifying SSE streaming on the `/llm/character` endpoint.
  - **`backend/routers/`** — Sub-application route handlers:
    - `biomarker.py` — Acoustic biomarker processing (Praat/Parselmouth), baseline aggregation, and facial tension logging.
    - `classifier.py` — RoBERTa cognitive distortion classifier inference and rule-based fallback.
    - `llm.py` — Character roleplay streaming, CBT JSON report generation, and dynamic scenario builder.
    - `scenario.py` — Custom scenario endpoint handler.
    - `therapist.py` — Clinician portal endpoint providing patient summary lists.
  - **`backend/tests/`** — Backend test suites and audio assets:
    - `test_biomarker.py` — Pytest suite testing calm vs. tense voice acoustic extraction and facial tension endpoint.
    - `calm_voice.wav` — 264 KB WAV reference audio file for calm voice test assertions.
    - `tense_voice.wav` — 264 KB WAV reference audio file for tense voice test assertions.

- **`ml/`** — Machine learning training pipelines, dataset curation, and model architectures.
  - `model.py` — Dual-head RoBERTa neural network architecture (`AvenClassifier`, `AvenClassifierLoss`, `AvenInference`).
  - `train.py` — PyTorch training script with AdamW optimizer, warmup scheduler, and validation metric computation.
  - `dataset.py` — PyTorch Dataset implementation (`DistortionDataset`) for tokenizing and formatting multi-label + severity samples.
  - `prepare_dataset.py` — Dataset mapping script mapping Shreevastava & Foltz (2021) categories to 15 Aven categories with heuristic severity rating.
  - `MAPPING_AND_DATASET_NOTES.md` — Documentation on category mappings, dataset coverage gaps, and severity heuristic definitions.
  - `Aven_RoBERTa_Training.ipynb` — Google Colab Jupyter training notebook with selective layer freezing and validation loops.
  - **`ml/checkpoints/`** — Checkpoint directory (`v1/best_model.pt`, 500,318,112 bytes).
  - **`ml/data/`** — Dataset storage (`labeled_distortions_sample.jsonl`).

- **`src/`** — React frontend source code.
  - `App.jsx` — React Router route declarations and global Sidebar layout wrapper.
  - `main.jsx` — React DOM entry point rendering `<App />` inside `BrowserRouter`.
  - `index.css` — Global CSS styling, glassmorphism design tokens, and chat bubble styles.
  - `config.js` — Client API base URL configuration (`API_BASE_URL`).
  - **`src/pages/`** — Top-level screen components:
    - `LandingPage.jsx` — Main portal, 3D AvenOrb hero visualizer, domain selector, scenario picker, and start session modal.
    - `SessionPage.jsx` — Live exposure therapy session interface (Chat, Orb, Web Speech recognition, TTS, MediaPipe face tracking, Live Signals).
    - `ReportPage.jsx` — Post-session CBT analysis report (Assertiveness score ring, XP, distortion cards with reframes, full annotated transcript).
    - `DashboardPage.jsx` — Historical progress metrics, distortion frequency trends, assertiveness trajectories, and streaks.
    - `SafetyPage.jsx` — Crisis hotlines, interactive Box Breathing orb, 5-4-3-2-1 grounding, and self-compassion tools.
    - `TherapyPage.jsx` — Comprehensive CBT toolbox (Thought Records, Fear Hierarchy ladder, Behavioral Experiments, Socratic Questioning, Imagery Rescripting).
    - `BodyPage.jsx` — Pre/post session somatic check-ins, physical symptom radar charts, and acoustic baseline tracking.
    - `CustomScenarioBuilder.jsx` — Custom AI scenario generation interface.
    - `TherapistDashboardPage.jsx` — Clinician collaboration view tracking patient SUDS and session progress.
  - **`src/components/`** — Reusable UI components:
    - `3d/` (`AvenOrb.jsx`, `AuroraBackground.jsx`) — WebGL 3D visualizers via React Three Fiber.
    - `body/` (`BodyComponents.jsx`) — Body check-in modals, somatic radar charts, and symptom logs.
    - `chat/` (`DistortionBadge.jsx`, `WaveformVisualizer.jsx`) — Live chat badges and audio visualizer.
    - `layout/` (`Sidebar.jsx`) — Global navigation bar.
    - `progress/` (`ProgressComponents.jsx`, `SkillTree.jsx`) — Recharts analytics, fear hierarchy widgets, and gamified skill trees.
    - `therapy/` (`TherapyTools.jsx`, `BiomarkerConsentModal.jsx`, `PatientList.jsx`, `PatientDetailModal.jsx`) — Clinical interactive tools.
  - **`src/services/`** — Frontend utility engines:
    - `faceTensionEngine.js` — MediaPipe FaceLandmarker client-side vision pipeline for 52 blendshapes and emotion scoring.
    - `sessionEngine.ts` — System prompt builder, trigger-guidance response mapping, and cosine similarity validator.
    - `soundscapeEngine.js` — Procedural Web Audio API brown noise synthesizer with lowpass filter (400 Hz).
    - `ttsEngine.js` — Browser-native `SpeechSynthesis` text-to-speech wrapper with voice filtering and queue cancellation.
  - **`src/store/`** — Zustand state management stores:
    - `sessionStore.js` — Active session state, message history, live distortion counts, avoidance tallies.
    - `characterMemoryStore.js` — Per-scenario persistent memory tracking (fumbled topics, avoidance signatures, strong moments).
    - `therapyStore.js` — Thought records, 10-tier fear hierarchy, behavioral experiments, imagery rescripting sessions.
    - `bodyStore.js` — Pre/post somatic check-in scores, physiological spike events, clinical scales (LSAS, PHQ-4, SUDS).
    - `userStore.js` — User profile, streak counters, earned XP, stored session reports, custom scenarios.
  - **`src/data/`** — Static datasets:
    - `characterLibrary.ts` — 29 character scenario definitions, domain tags, 5-level difficulty descriptions, response maps, system prompts.
    - `scenarios.js` — 15 UI distortion category metadata entries (colors, emojis, abbreviations).
    - `mockData.js` — Rule-based distortion keywords, mock CBT reports, and mock progress timeseries.
  - **`src/hooks/`** (`useVoiceBiomarkers.js`) — Audio recording hook transmitting 6-second WebM audio slices to `/biomarker/voice`.
  - **`src/lib/`** (`adaptiveDifficulty.js`) — Competency evaluation functions computing difficulty progression.

- **`paper-materials/`** — Academic paper documentation:
  - `architecture-notes.md` — Route flows, LLM fallback order notes, and voice pipeline steps.
  - `results.md` — Recorded empirical acoustic test values, baseline statistics, latency numbers, and facial tension indices.
  - `status.md` — Feature status log across 8 system components.
  - `deviations.md` — Implementation deviations from initial plan (mic lock, all levels unlocked, browser speech vs whisper).

- **`reference-code/`** — Reference implementations and historical verified code snapshots.

---

### LLM Providers and Exact Model Names

#### Roleplay Streaming (`POST /llm/character`)
The backend (`backend/routers/llm.py`) auto-selects providers in the following exact fallback order based on environment keys:
1. **Ollama (Local)**: Model specified by `OLLAMA_MODEL` (code default: `llama3.1:8b`, `.env.example` default: `qwen2.5:3b`), base URL: `http://localhost:11434`.
2. **Groq**: Primary model `GROQ_MODEL` (default: `openai/gpt-oss-20b`). On model errors, falls back through `GROQ_FALLBACK_MODELS`:
   - `openai/gpt-oss-20b`
   - `openai/gpt-oss-120b`
   - `qwen/qwen3.8-27b`
   - `groq/compound`
   - `groq/compound-mini`
3. **Gemini (Google AI)**: Model specified by `GEMINI_MODEL` (default: `gemini-2.0-flash` in `get_model_name`, `gemini-1.5-flash` in streaming generator).
4. **OpenAI**: Model specified by `OPENAI_MODEL` (default: `gpt-4o-mini`).
5. **Anthropic**: Model specified by `ANTHROPIC_MODEL` (default: `claude-3-5-haiku-20241022`, fallback: `claude-3-haiku-20240307`).
6. **Rule-Based Mock**: Streams `"[SYSTEM: No API Key detected...]"` if no provider is configured.

#### CBT Report Generation (`POST /llm/report`)
- **Gemini**: `gemini-1.5-flash` (with `response_mime_type: "application/json"`, `temperature: 0.3`).
- **Groq / OpenAI / Anthropic / Ollama**: Uses candidate models from provider list with `temperature: 0.3` and `response_format={"type": "json_object"}`.
- **Mock Fallback**: `generate_mock_report()` computes summary aggregates directly from `distortion_events`.

---

## 2. COGNITIVE DISTORTION CLASSIFIER (RoBERTa)

- **Base Checkpoint**: `roberta-base` (125M parameters, hidden size = 768).
- **Framework**: PyTorch (`torch`, `torch.nn`), Hugging Face `transformers` (`RobertaModel`, `RobertaTokenizer`), `scikit-learn` for evaluation metrics.
- **Execution Location & Call Pattern**: Runs on the backend server (`ml.model.AvenInference` loaded in `backend/routers/classifier.py`). The frontend calls it via `POST /classify/` in `SessionPage.jsx` as an asynchronous, non-blocking fetch on each user turn.
- **The Exact 15 Distortion Labels (`DISTORTION_LABELS` in `ml/model.py`)**:
  1. `catastrophizing`
  2. `mind_reading`
  3. `fortune_telling`
  4. `all_or_nothing`
  5. `personalization`
  6. `should_statements`
  7. `emotional_reasoning`
  8. `labeling`
  9. `magnification`
  10. `minimization`
  11. `mental_filtering`
  12. `disqualifying_positive`
  13. `jumping_to_conclusions`
  14. `blame`
  15. `overgeneralization`
  *(Note: Frontend UI `scenarios.js` maps 15 labels with `comparison_thinking` in place of `blame`).*

### Dataset Details
- **Name & Sources**:
  - Primary Clinical Source: **Therapist Q&A Dataset (Shreevastava & Foltz, 2021)** (*Detecting Cognitive Distortions in Online Mental Health Forums / Therapist Q&A*).
  - Synthetic Source: `synthetic_distortion_dataset.csv` (340 curated samples covering all 15 distortion categories and 5 severity levels).
- **Size**:
  - Shreevastava & Foltz (2021): ~2,530 patient-therapist forum exchanges.
  - Synthetic training dataset: 340 samples.
- **Label Mapping**:
  - Source dataset's 10 categories mapped to Aven's 15 categories via `prepare_dataset.py`:
    - `all-or-nothing thinking` / `splitting` -> `all_or_nothing`
    - `overgeneralization` -> `overgeneralization`
    - `mental filter` -> `mental_filtering`
    - `disqualifying the positive` -> `disqualifying_positive`
    - `jumping to conclusions` -> `jumping_to_conclusions`
    - `magnification` / `catastrophizing` / `magnification/catastrophizing` -> `catastrophizing`
    - `emotional reasoning` -> `emotional_reasoning`
    - `should statements` -> `should_statements`
    - `labeling and mislabeling` / `labeling` -> `labeling`
    - `personalization` -> `personalization`
  - **Untrained / 0-Coverage Categories in v1**: `blame` and `minimization` had 0 source training samples.
- **Severity Labeling Method**: Heuristic-derived linguistic proxy (Option B):
  - Base score: `2`
  - `+1` point if text contains extreme words (`always`, `never`, `ruined`, `disaster`, `worst`, `impossible`, `completely`, `horrible`, `terrible`, `hate`, `nobody`, `everyone`, `every single`, `hopeless`, `worthless`, `failed`).
  - `+1` point if `extreme_count >= 3`.
  - `+1` point if text contains `!` or `text.isupper()`.
  - `-1` point if text contains hedge words (`maybe`, `kind of`, `sort of`, `a bit`, `sometimes`, `slightly`).
  - Clamped to $[1, 5]$.
- **Splits**:
  - `ml/train.py`: 85% train, 15% validation via PyTorch `random_split`.
  - `ml/Aven_RoBERTa_Training.ipynb`: 85% train (289 rows), 15% validation (51 rows) via `train_test_split`.
  - Standalone held-out test split: **NOT FOUND** (evaluated on validation split).
- **Augmentation**: Heuristic sub-cue keyword seeding from `jumping_to_conclusions` for interpersonal thoughts (`"he thinks"`, `"she knows"` -> `mind_reading`) and future markers (`"will never"`, `"going to fail"` -> `fortune_telling`).

### Training Specifications
- **Epochs**: 5 (default in `train.py`) / 6 (best run in `ROBERTA_UPDATES.md`) / max 15 with patience 4 early stopping (`Aven_RoBERTa_Training.ipynb`).
- **Batch Size**: 16 (train loader), 32 (val loader).
- **Learning Rate & Optimizer**: AdamW, `lr = 2e-5` (or `1e-4` in `ROBERTA_UPDATES.md`), `weight_decay = 0.01`, linear warmup over 6% of total training steps (`get_linear_schedule_with_warmup`), gradient clipping norm = 1.0.
- **Max Sequence Length**: 128 tokens.
- **Dual-Head Architecture**:
  - `label_head`: `Sequential(Dropout(0.1), Linear(768, 256), GELU(), Dropout(0.1), Linear(256, 15))` -> returns binary logits for multi-label presence.
  - `severity_head`: `Sequential(Dropout(0.1), Linear(768, 256), GELU(), Dropout(0.1), Linear(256, 75))` -> reshaped to `(batch, 15, 5)` representing 5-class discrete softmax classification per distortion.
  - **Severity Type**: **5-class classification** (classes 0-4 mapped to 1-5 severity), **NOT** continuous regression.
- **Loss Function (`AvenClassifierLoss`)**:
  $$\text{Loss} = 1.0 \times \text{BCEWithLogitsLoss}(\text{label\_logits}, \text{label\_targets}) + 0.5 \times \text{CrossEntropyLoss}(\text{severity\_logits}, \text{severity\_targets})$$
  *(Severity CrossEntropy is masked exclusively to active ground-truth labels).*
- **Decision Threshold**: `0.35` (calibrated in `ml/model.py` and `backend/routers/classifier.py`).

### Saved Evaluation Results
- **From `ROBERTA_UPDATES.md` (Run 5 Best Checkpoint)**:
  - Epoch 1: Train Loss: 1.5612 | Val Macro-F1: 0.0150
  - Epoch 2: Train Loss: 1.4108 | Val Macro-F1: 0.0000
  - Epoch 3: Train Loss: 1.2788 | Val Macro-F1: 0.5546
  - Epoch 4: Train Loss: 1.0132 | Val Macro-F1: 0.6469
  - Epoch 5: Train Loss: 0.8595 | Val Macro-F1: 0.6975
  - **Epoch 6: Train Loss: 0.6768 | Val Macro-F1: 0.7029 (Best Checkpoint saved to `best_model.pt`)**
- **Documented Training Failures (`ROBERTA_UPDATES.md`)**:
  - *Fail 2 (Label casing bug)*: Precision = 0.0000, Recall = 0.0000, F1 = 0.0000.
  - *Fail 3 (`pos_weight = 10.0`)*: Precision = 0.0588, Recall = 1.0000, Macro-F1 = 0.1041.
  - *Fail 4 (`threshold = 0.50`)*: Macro-F1 = 0.0370.
- **Individual Per-Label F1 Numbers for Final Checkpoint**: **NOT FOUND** in repo files (persisted in uncommitted `training_history.json`).
- **Confusion Matrices**: **NOT FOUND** in repo files.
- **Severity MAE**: **NOT FOUND** (severity loss evaluated via masked CrossEntropy).

---

## 3. HOW THE KEY FEATURES ARE COMPUTED

### Facial Tension Index & Emotion Extraction (`src/services/faceTensionEngine.js`)
- **Blendshapes Selected (from 52 MediaPipe categories)**:
  - Left/Right Brow Lowering: `browDownLeft`, `browDownRight` -> `avgBrowLower = (browDownLeft + browDownRight) / 2`
  - Left/Right Lip Pressing: `mouthPressLeft`, `mouthPressRight` -> `avgLipPress = (mouthPressLeft + mouthPressRight) / 2`
  - Left/Right Squinting: `eyeSquintLeft`, `eyeSquintRight` -> `avgSquint = (eyeSquintLeft + eyeSquintRight) / 2`
  - Left/Right Blinking: `eyeBlinkLeft`, `eyeBlinkRight` -> `avgBlink = (eyeBlinkLeft + eyeBlinkRight) / 2`
- **Tension Formula**:
  $$\text{tensionIndex} = (\text{avgBrowLower} \times 0.4) + (\text{avgLipPress} \times 0.3) + (\text{avgSquint} \times 0.3)$$
- **6 Emotion Formulas**:
  - `happy = (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2`
  - `sad = (getScore("browDownLeft") + getScore("browDownRight") + getScore("mouthFrownLeft") + getScore("mouthFrownRight") + getScore("browInnerUp")) / 5`
  - `angry = (getScore("browDownLeft") + getScore("browDownRight") + getScore("mouthPressLeft") + getScore("mouthPressRight") + getScore("eyeSquintLeft") + getScore("eyeSquintRight")) / 6`
  - `surprise = (getScore("browInnerUp") + getScore("browOuterUpLeft") + getScore("browOuterUpRight") + getScore("jawOpen")) / 4`
  - `fear = (getScore("browInnerUp") + getScore("eyeWideLeft") + getScore("eyeWideRight") + getScore("mouthStretchLeft") + getScore("mouthStretchRight")) / 5`
  - `disgust = (getScore("noseSneerLeft") + getScore("noseSneerRight") + getScore("mouthUpperUpLeft") + getScore("mouthUpperUpRight")) / 4`
- **Dominant Emotion**: $\text{argmax}(\text{happy}, \text{sad}, \text{angry}, \text{surprise}, \text{fear}, \text{disgust}, \text{neutral}=0.1)$

### Vocal Acoustic Analysis (`backend/routers/biomarker.py`)
- **Praat DSP Parameters**: Sound converted to PointProcess via `To PointProcess (periodic, cc)` between 75 Hz and 500 Hz. Jitter computed via `Get jitter (local)` and Shimmer via `Get shimmer (local)`.
- **Baseline Computation**: Requires at least 3 completed sessions (`MIN_SESSIONS_FOR_BASELINE = 3`). Aggregates all non-null historical samples for `user_id` from the SQL database to compute `avg_pitch`, `avg_jitter`, `avg_shimmer`.
- **Spike Thresholds**:
  - Jitter Spike: `jitter_pct > baseline["avg_jitter"] * 2.0` (`SPIKE_JITTER_MULTIPLIER = 2.0`)
  - Pitch Deviation Spike: `abs(pitch_hz - baseline["avg_pitch"]) > 25.0 Hz` (`SPIKE_PITCH_DEVIATION_HZ = 25.0`)
- **Filler Word List**: **NOT FOUND** in runtime code.
- **VAD Settings**: `webrtcvad>=2.0.10` specified in `requirements.txt`; explicit threshold tuning parameters in Python: **NOT FOUND**.
- **Mic Deconfliction**: "Walkie-talkie" concurrency lock in `useVoiceBiomarkers.js` and `SessionPage.jsx`. `MediaRecorder` runs only when `isVoiceMode && !isRecording`. During active SpeechRecognition or speech send, the recorder and stream tracks are stopped to prevent audio contention and duplicate network requests.

### Avoidance Detection Rules (`backend/routers/classifier.py` & `src/data/mockData.js`)
- **Deflection**: Triggered if text contains `"i don't know"`, `"maybe"`, or `"i'm not sure"`.
- **Over-Apologizing**: Triggered if `count("sorry") >= 2`.
- **Minimal Response / Abandonment**: Triggered if `len(text.strip()) < 12` characters (or `< 15` in frontend mock).
- **Topic Change**: **NOT FOUND** as an explicit regex/rule in code (handled via general LLM session insights).

### Assertiveness Score (1–10 Scale)
- **Prompt Definition (`CBT_REPORT_PROMPT` in `backend/routers/llm.py`)**:
  - Output field: `"assertiveness_score": <1-10>`
  - Guideline: *"Assertiveness score reflects how directly and clearly the user communicated, not confidence. Be honest but never harsh."*
- **Mock Rule Fallback**: `assertiveness_score = 6 if total_distortions < 3 else 4`.
- **Competency Progression Threshold (`src/lib/adaptiveDifficulty.js`)**: `assertiveness_score >= 6` is required to pass a level.

### SUDS Logic & Pause Protocol
- **Scale**: Subjective Units of Distress Scale (1–10 in `useBodyStore.js`, 0–100 in clinical literature).
- **Check-in Triggers**: Pre-session and post-session check-in modals in `src/components/body/BodyComponents.jsx`.
- **Physiological Mismatch Alert (`SessionPage.jsx`)**: If physiological tremor/voice spikes are present but self-reported SUDS < 4, surfaces: *"Mismatch: You reported low distress, but your body shows tension."*
- **Automated Mid-Session Interrupt Pause Modal**: **NOT FOUND** in active session code (safety tools and grounding exercises are located on `SafetyPage.jsx`).

### Crisis Detector
- **Crisis Hotlines Configured (`src/pages/SafetyPage.jsx`)**:
  - 988 Suicide & Crisis Lifeline: `988` (Call/Text, 24/7, US)
  - Crisis Text Line: `Text HOME to 741741` (Free, 24/7, US)
  - NAMI HelpLine: `1-800-950-6264` (Mon–Fri 10am–10pm ET, US)
  - International Association for Suicide Prevention: `iasp.info/resources/Crisis_Centres/` (Global)
- **Async Background NLP Crisis Classifier**: **NOT FOUND** in Python codebase.

### Human-Like Latency & Stream Sanitization
- **Exact Pacing Delays (`backend/routers/llm.py` line 287)**:
  - Level 1 & 2: `1.0` second sleep
  - Level 3: `3.0` seconds sleep
  - Level 4 & 5: `4.5` seconds sleep
- **`<think>` Sanitizer**:
  - Backend streaming generator buffers tokens inside `<think>...</think>` tags and suppresses output.
  - Frontend regex sanitizer (`SessionPage.jsx`):
    ```javascript
    cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*/gi, '').trim()
    ```
- **SSE Buffering**: `SessionPage.jsx` handles partial Server-Sent Events by splitting on `\n`, buffering incomplete trailing strings with `lines.pop()`, and decoding JSON delta packets.

### Persistent Memory (`src/store/characterMemoryStore.js`)
- **Stored Data**: Object keyed by `scenarioId` holding `sessions` (integer count), `lastFumbled` (string), `avoidanceSignature` (string), `strongMoments` (array of up to 4 strings), `lastAssertiveness` (float).
- **Prompt Injection Format**:
  ```
  [MEMORY_CONTEXT — N previous session(s)]
  Last time, the user struggled with: "<lastFumbled>". You can reference this subtly.
  Their avoidance pattern: <avoidanceSignature>. Notice if they use it again.
  Their strongest moment last session: "<strongMoment>". You remember this.
  ```

### Post-Session Report Schema (`CBT_REPORT_PROMPT`)
- **Fields**:
  1. `assertiveness_score` (integer 1–10)
  2. `assertiveness_rationale` (string)
  3. `session_insights` (string)
  4. `growth_note` (string)
  5. `top_distortions` (array of objects: `key`, `label`, `count`, `avg_severity`, `quotes` containing `text`, `severity`, `reframe`)
  6. `avoidance_summary` (string)
  7. `three_action_steps` (array of 3 strings)

### Fear Hierarchy Tracking and Clinician Portal Sync
- **Fear Hierarchy Data Model (`src/store/therapyStore.js`)**: 10 preset exposure tiers (SUDS 20 to 90) linked to scenario IDs (`stranger`, `customer_service`, `study_circle`, `tanya`, `rohit`, `rahul`, `kavitha`, `sunita`).
- **Clinician Portal Endpoint (`backend/routers/therapist.py`)**: `GET /therapist/patients` returns static list `MOCK_PATIENTS` (`Alex Johnson`, `Sam Smith`, `Jordan Lee`).
- **Authentication Method**: **NOT FOUND** (no OAuth/JWT authentication middleware active).

---

## 4. SCENARIOS (All Scenarios in `characterLibrary.ts`)

| # | ID | Character Name | Domain | Scenario Name | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `arthur` | Arthur Mehta | `family` | The Difficult Parent | Tense but listening | Dismissive of feelings | Uses guilt overtly | Unfavorable comparisons | Contemptuous verdict |
| 2 | `sunita` | Sunita/Anita | `family` | Setting Limits with an Overbearing Parent | Caring & anxious | Repeats concerns | Introduces guilt | Focuses on her hurt | Tears or withdrawal |
| 3 | `riya` | Riya/Rohan | `family` | Confronting a Difficult Sibling | Loving but overbearing | Unsolicited advice | Dismissive | Weaponizes past | Martyrdom / sacrifice |
| 4 | `kavitha` | Dr. Kavitha Menon | `authority` | The Dismissive Professor | Busy & distracted | Impatient & interrupting | Dismissive of vagueness | Publicly unimpressed | Contemptuous walkout |
| 5 | `rohit` | Rohit Sharma | `authority` | The Impossible Manager | Professional & cool | Pointed metric probes | Questions judgment | Focuses on bad optics | Reconsidering your role |
| 6 | `verma` | Constable Verma | `authority` | The Intimidating Official | Disinterested & slow | Questions documents | Implies wrongdoing | Refuses to proceed | Threatens escalation |
| 7 | `priya` | Dr. Priya Nair | `authority` | The Rushed Doctor | Distracted & typing | Interrupts descriptions | Criticizes waiting | Dismisses self-diagnosis | Tells what you should've done |
| 8 | `suresh` | Prof. Suresh | `authority` | Asking a Senior for Mentorship | Open & curious | Probes past attempts | Time-pressured (10 min) | Skeptical of worth | Redirects elsewhere |
| 9 | `study_circle` | Group — The Study Circle | `peer` | Disagreeing With The Group | Mildly puzzled | Gently persistent | Social pressure | Starts excluding | Complete dismissal |
| 10 | `maya` | Maya | `peer` | The Flaky Friend | Warm & apologetic | Minimizes flakiness | Defensive about busyness | Flips blame | Passive-aggressive exit |
| 11 | `group_chat` | WhatsApp Group | `peer` | The Group Chat That Went Quiet | Warm & responsive | One person responds | Read receipts, no reply | Changes subject | Complete ghosting |
| 12 | `anand` | Anand | `peer` | Saying No to an Aggressive Pitcher | Casual & friendly | Assumes yes | Social leverage | Guilt trip | High-pressure ultimatum |
| 13 | `rahul` | Former Friend Rahul | `peer` | Reconciling with a Distant Friend | Politely awkward | Guarded / one-word | References time gap | Recalls letdowns | States moved on |
| 14 | `tanya` | Colleague Tanya | `peer` | Pushing Back on Unfair Treatment | Slightly awkward | Defensive apology | Claims miscommunication | Flips victim role | CCs manager |
| 15 | `meera_arjun` | Meera/Arjun | `romantic` | Telling Someone You Like Them | Warm & surprised | Uncertain | Deflects with humor | Values friendship only | Uncomfortable exit |
| 16 | `date` | Date — Priya/Karan | `romantic` | First Date Conversation | Engaged & warm | Waiting for user effort | Checks phone | Politely concluding | Abrupt exit |
| 17 | `partner` | Partner — Sneha/Dev | `romantic` | Bringing Up a Relationship Problem | Slightly defensive | Accusatory | Shuts down | Brings up past | Threatens breakup |
| 18 | `ex` | Ex — Ananya/Nikhil | `romantic` | Running into Your Ex | Politely warm | Cordial & brief | Oblique past references | Reveals new partner | Abrupt departure |
| 19 | `audience_20` | Audience — 20 people | `performance` | Presenting to a Critical Audience | Engaged & supportive | Neutral & polite | Skeptical questioner | Hostile questioner | Multiple critics |
| 20 | `lakshmi` | Ms. Lakshmi | `performance` | Job Interview | Warm & encouraging | Professional & probing | Challenges vagueness | Challenges credentials | Demands restart on failure |
| 21 | `vikram` | Vikram | `performance` | Technical Interview Under Pressure | Collaborative | Quiet & brief | Blunt "Try again" | Hard edge-case grill | Long silence / restart |
| 22 | `event_audience` | Event Audience | `performance` | Public Speaking — Open Mic | Warm & receptive | Attentive & quiet | Phone distractions | Heavy silence | Side conversations |
| 23 | `stranger` | Stranger on the Street | `stranger` | Asking a Stranger for Help | Warm & helpful | Helpful while walking | Minimal info | Dismissive refusal | Ignores completely |
| 24 | `customer_service`| Customer Service Rep | `stranger` | Complaining to Customer Service | Genuinely helpful | Policy-bound help | Scripted refusal | Defensive confrontation | Escalation threat |
| 25 | `landlord` | Landlord — Mr. D'Souza | `stranger` | Negotiating with a Difficult Landlord | Firm but reasonable | Businesslike | Deflects concerns | Quotes lease terms | Eviction threat |
| 26 | `rude_commuter` | Rude Commuter | `stranger` | Standing Up to Rudeness in Public | Apologizes & moves | Defensive move | Stands ground | Confrontational | Refuses to budge |
| 27 | `group_dinner` | Group Dinner | `peer` | Speaking Up at a Group Dinner | Friendly & inclusive | Slightly exclusive | Talks over user | One person dominates | Mocking & dismissive |
| 28 | `toxic_coworker`| Coworker — Sameer | `workplace` | Addressing Credit-Stealing at Work | Backs down | Defensive | Gaslights credit | Attacks teamwork | Threatens promotion |
| 29 | `noisy_neighbor`| Neighbor — Mrs. Gupta | `community` | Asking a Neighbor to Turn Down Noise | Apologetic | Dismissive compliance | Defends rights | Counter-attacks user | Slams door |

---

## 5. BACKEND

### All API Endpoints

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/` | Returns service status and documentation URLs |
| `GET` | `/health` | Healthcheck endpoint (`{"status": "ok", "version": "1.0.0"}`) |
| `POST` | `/classify/` | Classifies cognitive distortions and avoidance signals |
| `POST` | `/llm/character` | Streams real-time character roleplay dialogue via Server-Sent Events |
| `POST` | `/llm/report` | Generates structured post-session CBT JSON report |
| `POST` | `/llm/generate-scenario` | Synthesizes custom character persona from prompt |
| `POST` | `/biomarker/voice` | Analyzes WebM audio chunk with Praat, logs acoustic samples, detects spikes |
| `GET` | `/biomarker/voice/baseline/{user_id}` | Computes and returns historical voice baseline |
| `POST` | `/biomarker/facial` | Persists client-side MediaPipe facial tension and emotion scores |
| `POST` | `/scenario/create` | Logs custom scenario creation |
| `GET` | `/therapist/patients` | Returns patient list for clinician portal |

### Database Tables & Schema (`backend/models.py`)

1. **`users`**
   - `id`: `String` (Primary Key, Indexed)
   - `username`: `String` (Unique, Indexed)
2. **`sessions`**
   - `id`: `String` (Primary Key, Indexed)
   - `user_id`: `String` (Foreign Key -> `users.id`)
   - `created_at`: `DateTime` (Default `datetime.utcnow`)
3. **`voice_biomarker_samples`**
   - `id`: `Integer` (Primary Key, Indexed)
   - `session_id`: `String` (Foreign Key -> `sessions.id`)
   - `timestamp`: `DateTime` (Default `datetime.utcnow`)
   - `pitch_hz`: `Float` (Nullable)
   - `jitter_pct`: `Float` (Nullable)
   - `shimmer_pct`: `Float` (Nullable)
   - `speech_rate_wpm`: `Float` (Nullable)
4. **`facial_tension_samples`**
   - `id`: `Integer` (Primary Key, Indexed)
   - `session_id`: `String` (Foreign Key -> `sessions.id`)
   - `timestamp`: `DateTime` (Default `datetime.utcnow`)
   - `tension_index`: `Float` (Nullable)
   - `blink_rate`: `Float` (Nullable)
   - `emotion_happy`: `Float` (Nullable)
   - `emotion_sad`: `Float` (Nullable)
   - `emotion_angry`: `Float` (Nullable)
   - `emotion_fear`: `Float` (Nullable)
   - `emotion_surprise`: `Float` (Nullable)
   - `emotion_disgust`: `Float` (Nullable)
   - `dominant_emotion`: `String` (Nullable)
5. **`biomarker_baselines`**
   - `id`: `Integer` (Primary Key, Indexed)
   - `user_id`: `String` (Foreign Key -> `users.id`, Unique)
   - `avg_pitch`: `Float` (Nullable)
   - `avg_jitter`: `Float` (Nullable)
   - `avg_shimmer`: `Float` (Nullable)
   - `avg_speech_rate`: `Float` (Nullable)
   - `sample_count`: `Integer` (Default 0)
   - `established_at`: `DateTime` (Default `datetime.utcnow`)

### Security, Auth, & Rate Limiting
- **Authentication**: **NOT FOUND** (endpoints do not require JWT/session tokens; user IDs default to `"test_user"`).
- **CORS Configuration**: Explicitly allows origins `http://localhost:5173` and `http://localhost:3000`.
- **Rate Limiting**: **NOT FOUND** (no rate-limiting middleware configured).
- **Error Handling**: Standard FastAPI `HTTPException` (422 for invalid audio, 500 for internal processing failures) and try/catch fallback cascades across LLMs and classifiers.

---

## 6. FRONTEND

### Routes and Screen Breakdown

| Route | Page Component | Screen Content & Matching Features |
| :--- | :--- | :--- |
| `/` | `LandingPage.jsx` | Hero section, animated 3D `AvenOrb`, interactive voice agent, 6-domain filter tabs (Authority, Family, Peer, Romantic, Performance, Stranger, Workplace, Community), 29 scenario cards, start session modal with 5-level difficulty slider. |
| `/session/:scenarioId/:levelNum` | `SessionPage.jsx` | Full-screen simulation interface, 3D character orb (idle/listening/speaking/distortion states), chat transcript with distortion badges, Web Speech mic input, browser TTS, Web Audio brown noise soundscape toggle, live MediaPipe camera tracking, right-hand Live Signals sidebar (distortion counts, SUDS, tremors, primary emotion). |
| `/report` | `ReportPage.jsx` | Post-session CBT summary, radial SVG Assertiveness Score meter (1–10), gamified XP panel, Growth Note card, collapsible Annotated Distortion Cards with exact quotes and CBT reframes, Avoidance Signal timeline, full color-coded conversation transcript. |
| `/dashboard` | `DashboardPage.jsx` | Analytics hub, Recharts weekly distortion frequency charts, assertiveness progression curves, streak counter, total exposure minutes, domain competency breakdown. |
| `/safety` | `SafetyPage.jsx` | Clinical distress tools, emergency crisis lines (988, Crisis Text Line), animated interactive Box Breathing orb (4-4-4-4 phase timer), 5-4-3-2-1 sensory grounding, Self-Compassion pause guide. |
| `/therapy` | `TherapyPage.jsx` | 5 interactive CBT tools: 7-column Thought Records, 10-step Fear Hierarchy ladder, Behavioral Experiments tracker with prediction accuracy, Socratic Questioning dialogue, and 3-phase Imagery Rescripting. |
| `/body` | `BodyPage.jsx` | Somatic tracking dashboard, 7-point physical symptom body scan (heart rate, muscle tension, breathing, trembling), physiological symptom radar chart, vocal acoustic baseline cards (pitch, jitter, shimmer), historical tremor spike logs. |
| `/scenario-builder` | `CustomScenarioBuilder.jsx` | AI-assisted custom persona generator prompt box, relationship & difficulty tuning, JSON persona preview. |
| `/therapist-portal` | `TherapistDashboardPage.jsx` | Clinician monitoring interface, patient roster cards (`Alex Johnson`, `Sam Smith`, `Jordan Lee`), average SUDS indicators, completed scenario counts, patient detail drill-down modal. |

---

## 7. TESTING AND PERFORMANCE

### Test Execution Results

#### 1. Backend Pytest (`backend/tests/test_biomarker.py`)
- Command executed: `python -m pytest tests` (inside `backend/` directory)
- **Actual Terminal Output**:
  ```
  ============================= test session starts =============================
  platform win32 -- Python 3.13.3, pytest-9.1.1, pluggy-1.6.0
  rootdir: C:\Users\anuvu\Desktop\FLAGSHIP PROJECTS\Aven\backend
  plugins: anyio-4.10.0
  collected 2 items

  tests\test_biomarker.py ..                                               [100%]

  ============================== 2 passed in 4.41s ==============================
  ```
  - `test_voice_biomarker_calm_vs_tense`: **PASSED** (asserted `tense_data["jitter_pct"] > calm_data["jitter_pct"]` and `tense_data["shimmer_pct"] > calm_data["shimmer_pct"]`).
  - `test_facial_tension_endpoint`: **PASSED** (asserted status code 200 and `"status": "success"`).

#### 2. TypeScript Scenario Integrity Test (`testCharacters.ts`)
- Command executed: `npx tsx testCharacters.ts`
- **Actual Terminal Output**:
  ```
  All 29 characters successfully map triggers to context-aware guidance!
  ```

#### 3. NPM Test Script
- `npm test` script in `package.json`: **NOT FOUND** (package.json defines `"dev"`, `"build"`, `"lint"`, `"preview"`).

### Empirical Performance Benchmarks (from `paper-materials/results.md`)
- **LLM Character Response Latency (Groq API fallback + difficulty pacing delay)**:
  - Turn 1: `4.74s`
  - Turn 2: `5.10s`
  - Turn 3: `4.85s`
- **Voice Acoustic Measurements**:
  - Turn 1 (Neutral): Pitch = `125 Hz` | Jitter = `~0.8%` | Shimmer = `~3.5%`
  - Turn 2 (Slightly Stressed): Pitch = `132 Hz` | Jitter = `~1.2%` | Shimmer = `~4.1%`
  - Turn 3 (Deliberately Tense): Pitch = `148 Hz` | Jitter = `~2.4%` | Shimmer = `~7.2%`
- **Baseline Averages ($\ge 3$ sessions)**:
  - Average Pitch = `128.5 Hz`
  - Average Jitter = `1.05%`
  - Average Shimmer = `3.8%`
- **Facial Tension Index Readings**:
  - Relaxed Face: `0.15 - 0.25` (Dominant Emotion: Neutral/Happy)
  - Tense / Furrowed Brow: `0.75 - 0.85` (Dominant Emotion: Angry/Fear)

### Manual Test Checklist (`paper-materials/status.md`)
- Character Roleplay: Verified with dynamic difficulty prompts.
- CBT Report Generation: Verified generating structured JSON reports from transcripts.
- Voice Biomarker Pipeline: Verified with Praat Parselmouth. Requires `ffmpeg` in PATH.
- Baseline Establishment: Verified requiring `MIN_SESSIONS_FOR_BASELINE = 3`.
- Facial Tension Detection: Verified MediaPipe client-side tracking with `/biomarker/facial` persistence.
- Browser TTS: Verified using Web SpeechSynthesis API.
- Mic Crash Fix: Verified walkie-talkie concurrency lock.
- Database Persistence: Verified across SQLite / PostgreSQL models.

---

## 8. ENVIRONMENT

### Software & Library Versions

#### Python Environment (`backend/requirements.txt` & system info)
- **Python Version**: `3.13.3`
- `fastapi`: `>=0.110.0`
- `uvicorn[standard]`: `>=0.29.0`
- `pydantic`: `>=2.6.0`
- `pydantic-settings`: `>=2.2.0`
- `sqlalchemy`: `>=2.0.0`
- `asyncpg`: `>=0.29.0`
- `aioredis`: `>=2.0.0`
- `openai`: `>=1.23.0`
- `anthropic`: `>=0.25.0`
- `httpx`: `>=0.27.0`
- `torch`: `>=2.2.0`
- `transformers`: `>=4.39.0` (notebook uses `4.38.2`)
- `scikit-learn`: `>=1.4.0` (notebook uses `1.4.1.post1`)
- `numpy`: `>=1.26.0`
- `tqdm`: `>=4.66.0`
- `praat-parselmouth`: `>=0.4.3`
- `webrtcvad`: `>=2.0.10`
- `python-multipart`: `>=0.0.9`

#### Node Environment (`package.json` & system info)
- **Node.js Version**: `v22.15.0`
- `react`: `^19.2.6`
- `react-dom`: `^19.2.6`
- `react-router-dom`: `^7.17.0`
- `@mediapipe/tasks-vision`: `^0.10.35`
- `three`: `^0.184.0`
- `@react-three/fiber`: `^9.6.1`
- `@react-three/drei`: `^10.7.7`
- `framer-motion`: `^12.40.0`
- `recharts`: `^3.8.1`
- `zustand`: `^5.0.14`
- `vite`: `^8.0.12`
- `tailwindcss`: `^3.4.19`

### Hardware & OS Notes
- **Operating System**: Windows (`win32`).
- **Inference Hardware**: CPU (`model_device: "cpu"` in backend config; checkpoint explicitly saved with CPU `map_location`).
- **Training Hardware**: Configured for CUDA GPU acceleration in `ml/Aven_RoBERTa_Training.ipynb` with automatic CPU fallback.

### Deployment & Environment Variables (Names Only)
- **Docker**: `docker-compose.yml` runs PostgreSQL 15 (`postgres:15-alpine`) on host port `5433` mapping to container port `5432`.
- **Environment Variable Names Found Across Configs**:
  - `DATABASE_URL`
  - `GROQ_API_KEY`
  - `GROQ_MODEL`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `ANTHROPIC_API_KEY`
  - `ANTHROPIC_MODEL`
  - `ELEVENLABS_API_KEY`
  - `OLLAMA_MODEL`
  - `OLLAMA_BASE_URL`
  - `MODEL_CHECKPOINT`
  - `REDIS_URL`
  - `SECRET_KEY`
  - `DEBUG`
  - `VITE_API_BASE_URL`

---

## 9. LIMITATIONS AND FUTURE WORK

### Identified in Code, Notes, & Markdown

1. **Dataset Coverage Disparities (v1 Checkpoint)**:
   - As documented in `ml/MAPPING_AND_DATASET_NOTES.md`, the categories **`blame`** and **`minimization`** had zero training instances in the source dataset and will predict `0.0` neural confidence.
   - `mind_reading` and `fortune_telling` relied on weak keyword sub-cue seeding from `jumping_to_conclusions`.
2. **Synthetic Dataset Generalization Warning**:
   - `ml/Aven_RoBERTa_Training.ipynb` explicitly notes that the 340-sample dataset consists of templated synthetic sentences. It warns that high validation scores measure pattern matching rather than validated clinical psychiatric efficacy.
3. **FFmpeg System Dependency**:
   - `backend/routers/biomarker.py` requires `ffmpeg` installed in the operating system PATH. If missing, audio WebM-to-WAV conversion throws a `ValueError` and bypasses acoustic feature extraction.
4. **Speech-to-Text & TTS Modality Constraints**:
   - Transcriptions rely on browser-native Web Speech API rather than an on-premise Whisper pipeline (`paper-materials/deviations.md`).
   - Character speech relies on browser `SpeechSynthesis` rather than zero-latency neural voice synthesis.
5. **Authentication & Multi-Tenancy**:
   - User identity is unauthenticated; sessions use placeholder IDs (`"test_user"`).
6. **Difficulty Level Locking**:
   - Progressive difficulty locking was descoped (`src/lib/adaptiveDifficulty.js` returns `5` for `getMaxUnlockedLevel()`), unlocking all levels by default.
7. **Therapist Portal Sync**:
   - `GET /therapist/patients` serves mock clinical records without live database aggregation across external clinical EHR systems.
