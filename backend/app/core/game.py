from app.core.word import get_word
from app.core.scoring import calculate_score
from app.ai.model import predict_sign

# fake memory (replace with DB later)
session = {
    "score": 0,
    "word": None,
    "streak": 0,
    "lives": 3
}

def start_game():
    session["score"] = 0
    session["streak"] = 0
    session["lives"] = 3
    session["word"] = get_word()
    
    return {
        "word": session["word"],
        "score": 0,
        "lives": 3
    }

def submit_answer(data):
    image = data["image"]
    
    predicted = predict_sign(image)
    correct = predicted == session["word"]
    
    score_gain = calculate_score(correct, session["streak"])
    session["score"] += score_gain
    
    if correct:
        session["streak"] += 1
        session["word"] = get_word()
    else:
        session["lives"] -= 1
        session["streak"] = 0
    
    return {
        "correct": correct,
        "predicted": predicted,
        "score": session["score"],
        "next_word": session["word"],
        "lives": session["lives"]
    }