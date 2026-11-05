import logging
import secrets

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.v1.admin import router as admin_router
from app.api.v1.media import admin_router as admin_media_router
from app.api.v1.media import public_router as public_media_router
from app.api.v1.routes import router
from app.core.config import Settings, get_settings
from app.core.errors import AppError

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger("devfolio")


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or get_settings()
    app = FastAPI(
        title="DEVFOLIO API",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    if settings is not None:
        app.dependency_overrides[get_settings] = lambda: settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(dict.fromkeys([config.frontend_origin, *config.cors_origins])),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Idempotency-Key"],
    )

    @app.middleware("http")
    async def request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
        request.state.request_id = secrets.token_hex(12)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        logger.info(
            "request %s %s %s",
            request.method,
            request.url.path,
            response.status_code,
            extra={"request_id": request.state.request_id},
        )
        return response

    def error_response(request: Request, status: int, code: str, message: str) -> JSONResponse:
        return JSONResponse(
            status_code=status,
            content={
                "error": {"code": code, "message": message, "request_id": request.state.request_id}
            },
        )

    @app.exception_handler(AppError)
    async def app_error(request: Request, exc: AppError) -> JSONResponse:
        return error_response(request, exc.status, exc.code, exc.message)

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        return error_response(request, exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return error_response(request, 422, "validation_error", "Invalid request data.")

    @app.exception_handler(SQLAlchemyError)
    async def database_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.error("database failure %s", type(exc).__name__)
        return error_response(
            request, 503, "database_unavailable", "Service temporarily unavailable."
        )

    @app.exception_handler(IntegrityError)
    async def constraint_error(request: Request, exc: IntegrityError) -> JSONResponse:
        return error_response(request, 409, "conflict", "Resource conflicts with existing data.")

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unexpected failure %s", type(exc).__name__)
        return error_response(request, 500, "internal_error", "Internal server error.")

    app.include_router(router)
    app.include_router(public_media_router)
    app.include_router(admin_router)
    app.include_router(admin_media_router)
    return app


app = create_app()
