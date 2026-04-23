from app.db.models import User


def get_or_create_user(db, payload) -> User:
    """Get existing user or create a new one from Cognito token payload."""
    cognito_id = payload.get("sub")
    username = (
        payload.get("cognito:username")
        or payload.get("username")
        or payload.get("email", "").split("@")[0]
        or "unknown"
    )

    user = db.query(User).filter(User.cognito_id == cognito_id).first()

    if not user:
        user = User(cognito_id=cognito_id, username=username)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.username != username:
        user.username = username
        db.commit()
        db.refresh(user)

    return user