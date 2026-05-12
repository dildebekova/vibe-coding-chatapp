from datetime import datetime, timedelta

from fastapi import Response

from src.config import settings


def _cookie_secure() -> bool:
    return settings.ENVIRONMENT == "production"


def _cookie_samesite() -> str:
    return "none" if _cookie_secure() else "lax"


def set_auth_cookies(response: Response, *, access_token: str, refresh_token: str) -> None:
    common = {
        "httponly": True,
        "secure": _cookie_secure(),
        "samesite": _cookie_samesite(),
    }
    response.set_cookie(key="access_token", value=access_token, **common)
    response.set_cookie(key="refresh_token", value=refresh_token, **common)


def clear_auth_cookies(response: Response) -> None:
    expires = datetime.utcnow() + timedelta(seconds=1)
    exp = expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
    common = {"secure": _cookie_secure(), "httponly": True, "samesite": _cookie_samesite(), "expires": exp}
    response.set_cookie(key="access_token", value="", **common)
    response.set_cookie(key="refresh_token", value="", **common)
