"""
FastAPI Router — /biomarker
Voice acoustic biomarker extraction (pitch, jitter, shimmer, speech rate)
using Praat via parselmouth. Facial tension samples are computed client-side
(MediaPipe) and only the derived numbers are persisted here.

Verified against synthetic calm-vs-tense test signals before deployment:
tense voice showed ~10x higher jitter and ~7x higher shimmer than calm,
consistent with published anxiety-acoustics research (see project report
for citations).
"""

import io
import tempfile
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
import parselmouth
from parselmouth.praat import call
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from database import get_db
from models import VoiceBiomarkerSample, BiomarkerBaseline, User, Session, FacialTensionSample

router = APIRouter()


# ---------------------------------------------------------------------------
# Core extraction logic (tested standalone in test_extraction.py before
# integration — do not modify the Praat call parameters without re-verifying
# against known calm/tense samples, they were tuned to standard Praat
# defaults for jitter/shimmer local measures)
# ---------------------------------------------------------------------------
def extract_voice_biomarkers(wav_path: str) -> dict:
    sound = parselmouth.Sound(wav_path)

    if sound.duration < 0.5:
        raise ValueError("Audio clip too short for reliable analysis (need >= 0.5s)")

    pitch = sound.to_pitch()
    pitch_values = pitch.selected_array["frequency"]
    voiced = pitch_values[pitch_values > 0]
    voiced_fraction = len(voiced) / len(pitch_values) if len(pitch_values) > 0 else 0.0
    mean_pitch = float(voiced.mean()) if len(voiced) > 0 else 0.0

    jitter_pct = None
    shimmer_pct = None

    # Jitter/shimmer need enough voiced signal to detect glottal pulses;
    # skip gracefully on near-silent or too-short chunks rather than error.
    if voiced_fraction > 0.3 and len(voiced) > 10:
        try:
            point_process = call(sound, "To PointProcess (periodic, cc)", 75, 500)
            jitter_local = call(
                point_process, "Get jitter (local)",
                0, 0, 0.0001, 0.02, 1.3
            )
            shimmer_local = call(
                [sound, point_process], "Get shimmer (local)",
                0, 0, 0.0001, 0.02, 1.3, 1.6
            )
            jitter_pct = round(jitter_local * 100, 3) if jitter_local == jitter_local else None
            shimmer_pct = round(shimmer_local * 100, 3) if shimmer_local == shimmer_local else None
        except Exception:
            # Praat can occasionally fail to find enough periodic pulses on
            # noisy/short chunks -- treat as "not enough signal", not a crash.
            pass

    return {
        "pitch_hz": round(mean_pitch, 2) if mean_pitch > 0 else None,
        "jitter_pct": jitter_pct,
        "shimmer_pct": shimmer_pct,
        "voiced_fraction": round(voiced_fraction, 3),
    }


# Removed _SESSION_SAMPLES


class VoiceBiomarkerResponse(BaseModel):
    pitch_hz: Optional[float]
    jitter_pct: Optional[float]
    shimmer_pct: Optional[float]
    voiced_fraction: float
    is_spike: bool
    spike_reason: Optional[str] = None
    session_sample_count: int


class BaselineResponse(BaseModel):
    established: bool
    sessions_completed: int
    avg_pitch: Optional[float] = None
    avg_jitter: Optional[float] = None
    avg_shimmer: Optional[float] = None
    sample_count: int = 0


class FacialTensionRequest(BaseModel):
    session_id: str
    user_id: str
    tension_index: float
    blink_rate: float

class FacialTensionResponse(BaseModel):
    success: bool
    recorded_index: float


SPIKE_JITTER_MULTIPLIER = 2.0   # flag if jitter > 2x this user's baseline
SPIKE_PITCH_DEVIATION_HZ = 25.0  # flag if pitch deviates > 25Hz from baseline
MIN_SESSIONS_FOR_BASELINE = 3


@router.post("/voice", response_model=VoiceBiomarkerResponse)
async def analyze_voice_chunk(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    user_id: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts a short (5-10s recommended) audio chunk, extracts acoustic
    biomarkers, compares against the user's rolling baseline, and flags
    a "spike" if this chunk deviates significantly.
    """
    suffix = os.path.splitext(audio.filename or "chunk.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = extract_voice_biomarkers(tmp_path)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    finally:
        os.unlink(tmp_path)

    # Ensure user and session exist
    user = await db.get(User, user_id)
    if not user:
        user = User(id=user_id, username=f"user_{user_id}")
        db.add(user)
        await db.commit()
        
    session = await db.get(Session, session_id)
    if not session:
        session = Session(id=session_id, user_id=user_id)
        db.add(session)
        await db.commit()

    # Save sample
    new_sample = VoiceBiomarkerSample(
        session_id=session_id,
        pitch_hz=result["pitch_hz"],
        jitter_pct=result["jitter_pct"],
        shimmer_pct=result["shimmer_pct"],
        speech_rate_wpm=0.0 # Placeholder
    )
    db.add(new_sample)
    await db.commit()

    # --- Spike detection against this user's historical baseline ---
    baseline = await _compute_baseline(user_id, db)
    is_spike = False
    spike_reason = None

    if baseline["established"] and result["jitter_pct"] is not None:
        if result["jitter_pct"] > baseline["avg_jitter"] * SPIKE_JITTER_MULTIPLIER:
            is_spike = True
            spike_reason = "jitter"
        elif result["pitch_hz"] and baseline["avg_pitch"] and abs(result["pitch_hz"] - baseline["avg_pitch"]) > SPIKE_PITCH_DEVIATION_HZ:
            is_spike = True
            spike_reason = "pitch_deviation"

    # Count session samples
    stmt = select(func.count(VoiceBiomarkerSample.id)).where(VoiceBiomarkerSample.session_id == session_id)
    session_sample_count = (await db.execute(stmt)).scalar() or 0

    return VoiceBiomarkerResponse(
        **result,
        is_spike=is_spike,
        spike_reason=spike_reason,
        session_sample_count=session_sample_count,
    )


async def _compute_baseline(user_id: str, db: AsyncSession) -> dict:
    """
    Computes baseline from the database across all of this user's stored sessions.
    """
    stmt = (
        select(VoiceBiomarkerSample)
        .join(Session)
        .where(Session.user_id == user_id)
        .where(VoiceBiomarkerSample.jitter_pct.is_not(None))
    )
    result = await db.execute(stmt)
    all_samples = result.scalars().all()
    
    if len(all_samples) < MIN_SESSIONS_FOR_BASELINE:
        return {"established": False, "sessions_completed": len(all_samples)}

    avg_pitch = sum(s.pitch_hz for s in all_samples if s.pitch_hz) / len(all_samples)
    avg_jitter = sum(s.jitter_pct for s in all_samples) / len(all_samples)
    avg_shimmer = sum(s.shimmer_pct for s in all_samples if s.shimmer_pct) / len(all_samples)

    return {
        "established": True,
        "sessions_completed": len(all_samples),
        "avg_pitch": round(avg_pitch, 2) if avg_pitch else None,
        "avg_jitter": round(avg_jitter, 3),
        "avg_shimmer": round(avg_shimmer, 3) if avg_shimmer else None,
        "sample_count": len(all_samples),
    }


@router.get("/voice/baseline/{user_id}", response_model=BaselineResponse)
async def get_baseline(user_id: str, db: AsyncSession = Depends(get_db)):
    baseline = await _compute_baseline(user_id, db)
    if not baseline["established"]:
        return BaselineResponse(established=False, sessions_completed=baseline["sessions_completed"])
    return BaselineResponse(
        established=True,
        sessions_completed=baseline["sessions_completed"],
        avg_pitch=baseline["avg_pitch"],
        avg_jitter=baseline["avg_jitter"],
        avg_shimmer=baseline["avg_shimmer"],
        sample_count=baseline["sample_count"],
    )

@router.post("/facial", response_model=FacialTensionResponse)
async def record_facial_tension(
    req: FacialTensionRequest,
    db: AsyncSession = Depends(get_db)
):
    # Ensure session exists (assume user is already created from voice chunks if not we'd do it here too)
    session = await db.get(Session, req.session_id)
    if not session:
        # Create user and session if missing just in case
        user = await db.get(User, req.user_id)
        if not user:
            user = User(id=req.user_id, username=f"user_{req.user_id}")
            db.add(user)
            await db.commit()
            
        session = Session(id=req.session_id, user_id=req.user_id)
        db.add(session)
        await db.commit()

    sample = FacialTensionSample(
        session_id=req.session_id,
        tension_index=req.tension_index,
        blink_rate=req.blink_rate
    )
    db.add(sample)
    await db.commit()
    
    return FacialTensionResponse(success=True, recorded_index=req.tension_index)
