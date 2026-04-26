"""
Configuration settings for MVPForge Backend
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"

    @property
    def DEBUG(self) -> bool:
        return self.ENVIRONMENT == "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://mvpforge-backend.onrender.com",
        "https://mvpforge2.vercel.app"
    ]

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "mvpforge"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # AI
    AI_PROVIDER: str = "groq"
    GROQ_API_KEY: str
    AI_MODEL: str = "llama-3.1-8b-instant"

    # App
    MAX_PROJECT_SIZE: int = 100
    SESSION_TIMEOUT: int = 3600
    READINESS_SCORE_THRESHOLD: float = 0.85

    class Config:
        env_file = "config/.env"
        case_sensitive = True


settings = Settings()
