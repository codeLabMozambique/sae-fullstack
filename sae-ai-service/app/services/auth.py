from jose import jwt
from fastapi import Request, HTTPException

def _get_claims(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return {}
    token = auth[7:]
    try:
        return jwt.get_unverified_claims(token)
    except Exception:
        return {}

def get_username(request: Request) -> str:
    return _get_claims(request).get("sub", "anonymous")

def get_role(request: Request) -> str:
    claims = _get_claims(request)
    role = claims.get("role") or claims.get("roles", "GUEST")
    if isinstance(role, list):
        role = role[0] if role else "GUEST"
    return str(role).upper()

def require_role(request: Request, *allowed: str):
    role = get_role(request)
    if role not in [r.upper() for r in allowed]:
        raise HTTPException(status_code=403, detail="Acesso negado")
