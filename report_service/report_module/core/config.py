from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Farm Report Service"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/smart_farm"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
