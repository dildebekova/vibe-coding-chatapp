import logging

import redis.asyncio as aioredis
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_swagger_ui_oauth2_redirect_html
from fastapi.staticfiles import StaticFiles
from fastapi_limiter import FastAPILimiter
from fastapi_pagination import add_pagination
from starlette.requests import Request
from starlette.responses import RedirectResponse

from src.config import LOGGING_CONFIG, settings
from src.database import redis_pool
from src.routers import routers

# from sentry_sdk.integrations.asyncpg import AsyncPGIntegration

if not settings.ENVIRONMENT == "test":
    logging.config.dictConfig(LOGGING_CONFIG)
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        # integrations=[
        #     AsyncPGIntegration(),
        # ],
        enable_tracing=True,
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        traces_sample_rate=1.0,
        # Set profiles_sample_rate to 1.0 to profile 100%
        # of sampled transactions.
        # We recommend adjusting this value in production.
        profiles_sample_rate=1.0,
    )

logger = logging.getLogger(__name__)

# Swagger UI грузится с CDN; jsdelivr иногда недоступен — используем unpkg и свои маршруты /docs.
_SWAGGER_UI_JS = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
_SWAGGER_UI_CSS = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"

app = FastAPI(
    docs_url=None,
    title="Chat Backend",
    version="0.1.0",
)
app.mount("/static", StaticFiles(directory="src/static"), name="static")

for router in routers:
    app.include_router(router)


@app.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/docs", include_in_schema=False)
async def swagger_ui(request: Request):
    root_path = request.scope.get("root_path", "").rstrip("/")
    openapi_url = root_path + app.openapi_url
    oauth2_redirect_url = root_path + "/docs/oauth2-redirect"
    return get_swagger_ui_html(
        openapi_url=openapi_url,
        title=f"{app.title} - Swagger UI",
        oauth2_redirect_url=oauth2_redirect_url,
        swagger_js_url=_SWAGGER_UI_JS,
        swagger_css_url=_SWAGGER_UI_CSS,
        swagger_ui_parameters=app.swagger_ui_parameters,
        init_oauth=app.swagger_ui_init_oauth,
    )


@app.get("/docs/oauth2-redirect", include_in_schema=False)
async def swagger_ui_redirect():
    return get_swagger_ui_oauth2_redirect_html()


allowed_origins = settings.ALLOWED_ORIGINS.split(",")


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_pagination(app)


@app.on_event("startup")
async def startup():
    logger.info("Application is started")
    redis = aioredis.Redis(connection_pool=redis_pool)
    await FastAPILimiter.init(redis)


# Error displayed on shutdown (will be fixed in later versions): https://github.com/python/cpython/issues/109538
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application is closed")
