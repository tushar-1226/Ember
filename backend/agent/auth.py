import jwt
from jwt import PyJWKClient
import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    FastAPI dependency to verify a Clerk JWT and return the user_id.
    Requires CLERK_JWKS_URL in the .env file.
    Example: CLERK_JWKS_URL=https://your-domain.clerk.accounts.dev/.well-known/jwks.json
    """
    token = credentials.credentials
    jwks_url = os.getenv("CLERK_JWKS_URL")
    
    if not jwks_url:
        # Fallback for local development if needed, or enforce it
        raise HTTPException(status_code=500, detail="CLERK_JWKS_URL is not configured in backend environment")
        
    try:
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False} # Alternatively, set audience to your frontend URL
        )
        return data["sub"] # This is the Clerk user ID
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
