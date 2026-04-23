from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.api.auth import verify_token
from app.db.database import get_db
from app.db.models import User, Score
from pydantic import BaseModel

router = APIRouter()


class ScoreSubmission(BaseModel):
    score: int


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    score: int


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    """Fetch top 10 scores from the leaderboard sorted by highest score"""
    # Get top 10 users by their max score
    top_scores = db.query(
        User.username,
        func.max(Score.score).label("max_score")
    ).join(
        Score, User.id == Score.user_id
    ).group_by(
        User.id, User.username
    ).order_by(
        desc(func.max(Score.score))
    ).limit(10).all()
    
    leaderboard = [
        LeaderboardEntry(
            rank=idx + 1,
            name=username,
            score=max_score
        )
        for idx, (username, max_score) in enumerate(top_scores)
    ]
    
    return leaderboard


@router.post("/score")
def save_score(
    score_data: ScoreSubmission,
    token_payload=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Save a score for the authenticated user"""
    cognito_id = token_payload.get("sub")
    username = token_payload.get("cognito:username") or token_payload.get("username") or "unknown"
    
    if not cognito_id:
        return {"error": "No user ID in token"}
    
    # Get or create user
    user = db.query(User).filter(User.cognito_id == cognito_id).first()
    if not user:
        user = User(cognito_id=cognito_id, username=username)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create score record
    new_score = Score(user_id=user.id, score=score_data.score)
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    
    return {
        "id": new_score.id,
        "score": new_score.score,
        "user_id": user.id,
        "username": user.username,
        "created_at": new_score.created_at
    }