from dotenv import load_dotenv
from pathlib import Path

# Load .env FIRST before any other app imports
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import user, leaderboard, game
from app.db.database import Base, engine
from app.db import models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_origin_regex=r"https://.*\.amplifyapp\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/user")
app.include_router(leaderboard.router, prefix="/leaderboard")
app.include_router(game.router, prefix="/game")

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"⚠️ Could not connect to database: {e}")