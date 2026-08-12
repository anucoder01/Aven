"""
Quick verification script for the parselmouth jitter/shimmer/pitch extraction
logic before it goes into the real FastAPI router.
"""
import parselmouth
from parselmouth.praat import call


def extract_voice_biomarkers(wav_path: str) -> dict:
    """
    Extracts mean pitch (F0), local jitter (%), and local shimmer (%)
    from a WAV file using Praat via parselmouth.

    Returns a dict with pitch_hz, jitter_pct, shimmer_pct, and voiced_fraction
    (fraction of the clip that had detectable voicing -- useful to flag
    unreliable readings on very short or silent clips).
    """
    sound = parselmouth.Sound(wav_path)

    # --- Pitch (F0) ---
    pitch = sound.to_pitch()
    pitch_values = pitch.selected_array["frequency"]
    voiced = pitch_values[pitch_values > 0]
    voiced_fraction = len(voiced) / len(pitch_values) if len(pitch_values) > 0 else 0.0
    mean_pitch = float(voiced.mean()) if len(voiced) > 0 else 0.0

    # --- Jitter & Shimmer require a PointProcess (glottal pulse detection) ---
    point_process = call(sound, "To PointProcess (periodic, cc)", 75, 500)

    # Local jitter (%): average absolute difference between consecutive
    # periods, divided by the average period. Standard Praat parameters.
    jitter_local = call(
        point_process, "Get jitter (local)",
        0, 0,       # time range: 0,0 = whole sound
        0.0001,     # shortest period (s)
        0.02,       # longest period (s)
        1.3         # maximum period factor
    )

    # Local shimmer (%): needs both the sound and the point process.
    shimmer_local = call(
        [sound, point_process], "Get shimmer (local)",
        0, 0,
        0.0001, 0.02, 1.3, 1.6
    )

    return {
        "pitch_hz": round(mean_pitch, 2),
        "jitter_pct": round(jitter_local * 100, 3) if jitter_local == jitter_local else None,  # NaN check
        "shimmer_pct": round(shimmer_local * 100, 3) if shimmer_local == shimmer_local else None,
        "voiced_fraction": round(voiced_fraction, 3),
    }


if __name__ == "__main__":
    for label, path in [("CALM", "calm_voice.wav"), ("TENSE", "tense_voice.wav")]:
        result = extract_voice_biomarkers(path)
        print(f"{label}: {result}")
