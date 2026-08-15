import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

from main import app
from database import get_db

async def override_get_db():
    mock_session = AsyncMock()
    # Mock return values for db.get and db.execute
    mock_session.get.return_value = True # mock user/session existence
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute.return_value = mock_result
    
    yield mock_session

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_voice_biomarker_calm_vs_tense():
    # Use real audio files instead of synthetic waves
    tests_dir = os.path.dirname(__file__)
    calm_file = os.path.join(tests_dir, "calm_voice.wav")
    tense_file = os.path.join(tests_dir, "tense_voice.wav")
    
    # 1. Test calm voice
    with open(calm_file, 'rb') as f:
        calm_resp = client.post(
            "/biomarker/voice",
            data={"session_id": "test_session_calm", "user_id": "test_user"},
            files={"audio": ("calm.wav", f, "audio/wav")}
        )
    assert calm_resp.status_code == 200
    calm_data = calm_resp.json()
    
    # 2. Test tense voice
    with open(tense_file, 'rb') as f:
        tense_resp = client.post(
            "/biomarker/voice",
            data={"session_id": "test_session_tense", "user_id": "test_user"},
            files={"audio": ("tense.wav", f, "audio/wav")}
        )
    assert tense_resp.status_code == 200
    tense_data = tense_resp.json()

    # Assert that tense voice shows higher jitter and shimmer
    # as described in integration notes: "10x higher jitter" and "7x higher shimmer"
    assert tense_data["jitter_pct"] > calm_data["jitter_pct"]
    assert tense_data["shimmer_pct"] > calm_data["shimmer_pct"]

def test_facial_tension_endpoint():
    response = client.post(
        "/biomarker/facial",
        json={
            "session_id": "test_session_1",
            "tension_index": 45.5,
            "blink_rate": 0.5,
            "timestamp": 123456789.0
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"
