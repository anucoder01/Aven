import os
import wave
import struct
import math
import tempfile
import pytest
from fastapi.testclient import TestClient

# Create a minimal app mock or import main
from main import app

client = TestClient(app)

def generate_mock_wav(filename, freq=200.0, duration=2.0, sample_rate=44100):
    """Generate a simple sine wave to mimic a vocal pitch for testing."""
    obj = wave.open(filename, 'w')
    obj.setnchannels(1) # mono
    obj.setsampwidth(2)
    obj.setframerate(sample_rate)
    
    for i in range(int(duration * sample_rate)):
        value = int(32767.0 * math.sin(2.0 * math.pi * freq * i / sample_rate))
        data = struct.pack('<h', value)
        obj.writeframesraw(data)
    obj.close()

@pytest.fixture
def mock_audio_file():
    fd, path = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    generate_mock_wav(path, freq=150.0) # 150 Hz
    yield path
    os.unlink(path)

def test_voice_biomarker_endpoint(mock_audio_file):
    with open(mock_audio_file, 'rb') as f:
        response = client.post(
            "/biomarker/voice",
            data={"session_id": "test_session_1"},
            files={"audio": ("test.wav", f, "audio/wav")}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "pitch_hz" in data["data"]
    assert "jitter_pct" in data["data"]
    
    # Check plausible range for the synthetic 150Hz tone
    pitch = data["data"]["pitch_hz"]
    assert 140.0 < pitch < 160.0

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
