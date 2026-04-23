import os
from typing import Optional

import requests
from fastapi import Header, HTTPException
from jose import jwt

COGNITO_REGION = os.getenv("COGNITO_REGION", "ap-southeast-1")
USER_POOL_ID = os.getenv("USER_POOL_ID")
APP_CLIENT_ID = os.getenv("APP_CLIENT_ID")

_jwks_cache: Optional[dict] = None


def get_jwks() -> dict:
    """Fetch Cognito JWKS (cached after first call)."""
    global _jwks_cache

    if _jwks_cache is not None:
        return _jwks_cache

    if not USER_POOL_ID:
        print("⚠️  USER_POOL_ID not set — falling back to mock mode.")
        _jwks_cache = {"keys": []}
        return _jwks_cache

    url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
    except Exception as e:
        print(f"⚠️  Failed to fetch JWKS: {e}")
        _jwks_cache = {"keys": []}

    return _jwks_cache


def verify_token(authorization: str = Header(...)) -> dict:
    """Verify Cognito JWT and return the decoded payload."""
    try:
        token = authorization.split(" ")[1]
        kid = jwt.get_unverified_header(token)["kid"]
        jwks = get_jwks()
        key = next((k for k in jwks.get("keys", []) if k["kid"] == kid), None)

        if not key:
            if not jwks.get("keys"):
                # Mock mode — no Cognito keys available
                return {
                    "sub": "mock-user-id",
                    "cognito:username": os.getenv("MOCK_USERNAME", "TestUser"),
                    "email": os.getenv("MOCK_EMAIL", "test@example.com"),
                }
            raise HTTPException(status_code=401, detail="Key not found")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=APP_CLIENT_ID,
            issuer=f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}",
        )
        username = payload.get("cognito:username") or payload.get("username", "unknown")
        print(f"✅ Authenticated: {username} ({payload.get('sub')})")
        return payload

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")