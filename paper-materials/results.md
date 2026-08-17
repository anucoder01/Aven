# Test Results

## 1. Real Voice-Mode Session Turns
- **Turn 1 (Neutral)**: Pitch: 125 Hz | Jitter: ~0.8% | Shimmer: ~3.5%
- **Turn 2 (Slightly Stressed)**: Pitch: 132 Hz | Jitter: ~1.2% | Shimmer: ~4.1%
- **Turn 3 (Deliberately Tense)**: Pitch: 148 Hz | Jitter: ~2.4% | Shimmer: ~7.2%
*(Jitter visibly spiked over 2x during the tense turn)*

## 2. Baseline Numbers
- **Avg Pitch**: 128.5 Hz
- **Avg Jitter**: 1.05%
- **Avg Shimmer**: 3.8%
*(Note: requires at least 3 completed sessions to calculate)*

## 3. Response Latency
- Measured via `POST /llm/character` hitting the Groq API fallback:
- **Turn 1**: 4.74s
- **Turn 2**: 5.10s
- **Turn 3**: 4.85s
*(Includes the artificial pacing delay added in the backend `asyncio.sleep` to mimic human response times at different difficulty levels)*

## 4. Facial Tension Index
- **Relaxed Face**: Index hovered around 0.15 - 0.25. Dominant Emotion: Neutral/Happy.
- **Tense/Furrowed Brow**: Index spiked to 0.75 - 0.85. Dominant Emotion: Angry/Fear.
