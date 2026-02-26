"""
EusoTrip AI Sidecar — FastAPI service bundling open-source AI tools.
Runs alongside the Node.js backend at port 8091.

Capabilities:
  /ocr/*       — Docling + PaddleOCR document processing
  /route/*     — OSRM routing + OR-Tools VRP optimization
  /nlp/*       — spaCy NER + text classification
  /forecast/*  — Darts/Prophet demand & rate forecasting
  /analytics/* — DuckDB fast OLAP queries
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ocr, route, nlp, forecast, analytics

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("ai-sidecar")

# ---------------------------------------------------------------------------
# Lazy model loading on startup
# ---------------------------------------------------------------------------
models: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy models once at startup, release on shutdown."""
    logger.info("AI Sidecar starting — loading models...")

    # spaCy (lightweight, load eagerly)
    try:
        import spacy
        models["spacy"] = spacy.load("en_core_web_sm")
        logger.info("spaCy en_core_web_sm loaded")
    except Exception as e:
        logger.warning(f"spaCy not available: {e}")
        models["spacy"] = None

    # PaddleOCR (lazy — first request triggers load)
    models["paddle_ocr"] = None  # loaded on first /ocr/ call

    # Docling converter (lazy)
    models["docling"] = None

    app.state.models = models
    logger.info("AI Sidecar ready on port %s", os.getenv("AI_SIDECAR_PORT", "8091"))
    yield
    logger.info("AI Sidecar shutting down")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="EusoTrip AI Sidecar",
    version="1.0.0",
    description="Open-source AI tools for logistics platform enhancement",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ocr.router, prefix="/ocr", tags=["Document Processing"])
app.include_router(route.router, prefix="/route", tags=["Route Optimization"])
app.include_router(nlp.router, prefix="/nlp", tags=["NLP"])
app.include_router(forecast.router, prefix="/forecast", tags=["Forecasting"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])


@app.get("/health")
async def health():
    available = {k: v is not None for k, v in models.items()}
    return {"status": "ok", "service": "eusotrip-ai-sidecar", "models": available}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SIDECAR_PORT", "8091"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, workers=1)
