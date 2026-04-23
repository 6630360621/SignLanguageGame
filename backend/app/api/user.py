from fastapi import APIRouter, Depends
from app.api.auth import verify_token
from datetime import datetime

router = APIRouter()

def _get_username(payload: dict) -> str:
    return (
        payload.get("cognito:username") or
        payload.get("username") or
        payload.get("email", "").split("@")[0] or
        "unknown"
    )

@router.get("/me")
def get_me(payload=Depends(verify_token)):
    username = _get_username(payload)
    return {
        "id": payload.get("sub", "mock-id"),
        "username": username
    }

@router.post("/login-log")
def login_log(payload=Depends(verify_token)):
    username = _get_username(payload)
    user_id = payload.get("sub", "-")
    email = payload.get("email", "-")
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*50}")
    print(f"[AUTH] LOGIN SUCCESS")
    print(f"[AUTH] Username : {username}")
    print(f"[AUTH] User ID  : {user_id}")
    print(f"[AUTH] Email    : {email}")
    print(f"[AUTH] Time     : {now}")
    print(f"{'='*50}\n")
    return {"status": "logged"}

@router.post("/logout-log")
def logout_log(payload=Depends(verify_token)):
    username = _get_username(payload)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*50}")
    print(f"[AUTH] LOGOUT")
    print(f"[AUTH] Username : {username}")
    print(f"[AUTH] Time     : {now}")
    print(f"{'='*50}\n")
    return {"status": "logged"}

@router.get("/session-check")
def session_check(payload=Depends(verify_token)):
    username = _get_username(payload)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[SESSION] {now} | Active user: {username}")
    return {"username": username, "status": "active"}