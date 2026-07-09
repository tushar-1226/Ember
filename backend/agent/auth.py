import jwt
import os
import bcrypt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_auth_secret() -> str:
    secret = os.getenv("AUTH_SECRET")
    if not secret:
        raise RuntimeError(
            "AUTH_SECRET is not set. Refusing to start with a guessable default — "
            "set AUTH_SECRET in backend/.env (must match the frontend's AUTH_SECRET)."
        )
    return secret


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    FastAPI dependency to verify an Auth.js HS256 JWT and return the user_id.
    Requires AUTH_SECRET in the .env file.
    """
    token = credentials.credentials
    secret = get_auth_secret()

    try:
        data = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return data["sub"] # user_id
    except jwt.PyJWTError as e:
        print(f"JWT Verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
