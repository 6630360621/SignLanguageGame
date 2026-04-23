from pydantic import BaseModel

class UserCreate(BaseModel):
    cognito_id: str
    username: str

class ScoreCreate(BaseModel):
    score: int