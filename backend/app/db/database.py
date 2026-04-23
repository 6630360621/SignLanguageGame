import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    db_engine = os.getenv("DB_ENGINE", "postgres").lower()

    if db_engine == "sqlite":
        DATABASE_URL = "sqlite:///./app.db"
    else:
        db_user = os.getenv("DB_USER", "")
        db_password = os.getenv("DB_PASSWORD", "")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432" if db_engine in {"postgres", "postgresql"} else "3306")
        db_name = os.getenv("DB_NAME", "app")
        db_user_q = quote_plus(db_user)
        db_password_q = quote_plus(db_password)

        if db_engine in {"postgres", "postgresql"}:
            DATABASE_URL = f"postgresql://{db_user_q}:{db_password_q}@{db_host}:{db_port}/{db_name}"
        elif db_engine in {"mysql", "mariadb"}:
            DATABASE_URL = f"mysql+pymysql://{db_user_q}:{db_password_q}@{db_host}:{db_port}/{db_name}"
        else:
            raise ValueError(f"Unsupported DB_ENGINE: {db_engine}")

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE", "1800"))
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "5"))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "10"))

    if DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres"):
        engine_kwargs["connect_args"] = {"sslmode": os.getenv("DB_SSLMODE", "require")}
    elif DATABASE_URL.startswith("mysql"):
        mysql_connect_args = {"charset": "utf8mb4"}

        if os.getenv("DB_SSL", "true").lower() in {"1", "true", "yes"}:
            ssl_args = {}
            ssl_ca = os.getenv("DB_SSL_CA")
            if ssl_ca:
                ssl_args["ca"] = ssl_ca
            mysql_connect_args["ssl"] = ssl_args

        engine_kwargs["connect_args"] = mysql_connect_args

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()