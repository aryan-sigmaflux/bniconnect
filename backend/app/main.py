"""
FastAPI application entry point.
Mounts all routers, configures CORS, and manages startup/shutdown lifecycle.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import auth, users, swipes, admin
from app.services.cache_service import close_redis
from app.utils.helpers import ensure_upload_dirs

settings = get_settings()

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifecycle ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 BNI Sigmaconnect backend starting up")
    ensure_upload_dirs()
    yield
    logger.info("🛑 Shutting down — closing Redis pool")
    await close_redis()


# ── App ──
app = FastAPI(
    title="BNI Sigmaconnect API",
    description="Tinder-style networking API for BNI members",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
# Explicit origins are required when allow_credentials=True
allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.7:3000", # Local network IP for mobile testing
    "https://connect.sigmaflux.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploaded images) ──
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# ── Routers ──
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(swipes.router)
app.include_router(admin.router)


# ── Health check ──
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "sigmaconnect-api"}
