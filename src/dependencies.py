from typing import Annotated

import jwt
import redis.asyncio as aioredis
from fastapi import Cookie, Depends, HTTPException, WebSocket, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.authentication.services import get_user_by_login_identifier
from src.config import settings
from src.database import get_async_session, redis_pool
from src.models import User

bearer_scheme = HTTPBearer(auto_error=False)


async def _user_from_access_jwt(access_token: str | None, db_session: AsyncSession) -> User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(access_token, settings.JWT_ACCESS_SECRET_KEY, algorithms=[settings.ENCRYPTION_ALGORITHM])
        login_identifier: str | None = payload.get("sub")
        if not login_identifier:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Access Token")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user: User | None = await get_user_by_login_identifier(db_session, login_identifier=login_identifier)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not active",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user(
    bearer: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    access_token: Annotated[str | None, Cookie()] = None,
    db_session: AsyncSession = Depends(get_async_session),
) -> User:
    token = bearer.credentials if bearer else None
    if not token:
        token = access_token
    return await _user_from_access_jwt(token, db_session)


async def get_current_user_websocket(
    websocket: WebSocket,
    db_session: AsyncSession = Depends(get_async_session),
) -> User:
    token = websocket.query_params.get("access_token") or websocket.cookies.get("access_token")
    return await _user_from_access_jwt(token, db_session)


async def get_cache_setting():
    return settings.REDIS_CACHE_ENABLED


async def get_cache() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=redis_pool)
