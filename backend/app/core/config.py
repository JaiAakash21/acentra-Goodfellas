from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FraudLens API"
    app_version: str = "1.0.0"
    debug: bool = True

    # --- Database ---
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/fraudlens"

    # --- CORS (React dev servers) ---
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # --- Fraud engine ---
    use_mock_engine: bool = False      # force the built-in mock engine
    history_limit: int = 500           # max previous transactions given to the engine
    simulation_max_scan: int = 5000    # max transactions scanned by rule simulation

    # --- Notifications ---
    notification_provider: str = "mock"          # mock | sns | ses
    notify_levels: list[str] = ["HIGH", "CRITICAL"]
    aws_region: str = "ap-south-1"
    sns_topic_arn: str = ""
    ses_sender: str = ""
    ses_recipients: list[str] = []

    # --- Demo ---
    auto_seed: bool = False

    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore")


settings = Settings()
