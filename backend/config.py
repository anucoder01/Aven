"""
Aven Config — Environment variables and settings
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/aven"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # LLM APIs
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    elevenlabs_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""

    # Model
    model_checkpoint_path: str = "./ml/checkpoints/roberta_distortion_v1"
    model_device: str = "cpu"  # or "cuda"

    # App
    secret_key: str = "change-me-in-production"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
