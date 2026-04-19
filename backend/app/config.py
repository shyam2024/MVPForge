from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "genai_assistant"

    JWT_SECRET_KEY: str = "changeme-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    AI_PROVIDER: str = "openai"
    AI_MODEL: str = "gpt-4o"
    GROQ_API_KEY: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
