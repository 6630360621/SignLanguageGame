from fastapi import APIRouter
from pydantic import BaseModel

from app.core.game import start_game, submit_answer
from app.ai.model import predict_sign

router = APIRouter()


class ImageRequest(BaseModel):
    image: str


@router.post("/start")
def start():
    return start_game()


@router.post("/submit")
def submit(data: ImageRequest):
    return submit_answer({"image": data.image})


@router.post("/detect")
def detect(data: ImageRequest):
    """Run AI prediction only — no game state changes."""
    predicted = predict_sign(data.image)
    return {"predicted": predicted}