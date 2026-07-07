import jwt
import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    FastAPI dependency to verify an Auth.js HS256 JWT and return the user_id.
    Requires AUTH_SECRET in the .env file.
    """
    token = credentials.credentials
    secret = os.getenv("AUTH_SECRET", "default_super_secret_for_local_dev_only")
    
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
