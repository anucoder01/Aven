from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    
    sessions = relationship("Session", back_populates="user")
    baseline = relationship("BiomarkerBaseline", back_populates="user", uselist=False)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True) # UUID string
    user_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
    voice_samples = relationship("VoiceBiomarkerSample", back_populates="session")
    facial_samples = relationship("FacialTensionSample", back_populates="session")

class VoiceBiomarkerSample(Base):
    __tablename__ = "voice_biomarker_samples"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    pitch_hz = Column(Float, nullable=True)
    jitter_pct = Column(Float, nullable=True)
    shimmer_pct = Column(Float, nullable=True)
    speech_rate_wpm = Column(Float, nullable=True)
    
    session = relationship("Session", back_populates="voice_samples")

class FacialTensionSample(Base):
    __tablename__ = "facial_tension_samples"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    tension_index = Column(Float, nullable=True)
    blink_rate = Column(Float, nullable=True)
    
    session = relationship("Session", back_populates="facial_samples")

class BiomarkerBaseline(Base):
    __tablename__ = "biomarker_baselines"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    avg_pitch = Column(Float, nullable=True)
    avg_jitter = Column(Float, nullable=True)
    avg_shimmer = Column(Float, nullable=True)
    avg_speech_rate = Column(Float, nullable=True)
    sample_count = Column(Integer, default=0)
    established_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="baseline")
