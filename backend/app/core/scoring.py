def calculate_score(correct, streak):
    if not correct:
        return -2
    
    base = 10
    streak_bonus = streak * 2
    
    return base + streak_bonus