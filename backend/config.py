"""
Aven Config — Environment variables and settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite+aiosqlite:///./aven.db"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # LLM APIs
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    elevenlabs_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"
    ollama_model: str = "llama3.1:8b"
    ollama_base_url: str = "http://localhost:11434"

    # Model
    model_checkpoint_path: str = "./ml/checkpoints/roberta_distortion_v1"
    model_device: str = "cpu"  # or "cuda"

    # App
    secret_key: str = "change-me-in-production"
    debug: bool = True

    model_config = SettingsConfigDict(env_file=str(env_path), extra="ignore")


settings = Settings()


