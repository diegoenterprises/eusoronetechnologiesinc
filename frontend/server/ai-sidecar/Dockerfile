FROM python:3.11-slim AS builder

WORKDIR /app

# System deps for PaddleOCR + OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps in a separate layer for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Remove test files from production image
RUN rm -rf tests/ __pycache__/ .pytest_cache/

# Non-root user for security
RUN useradd --create-home --shell /bin/bash sidecar
USER sidecar

# Environment defaults — override via docker run -e or compose
ENV AI_SIDECAR_PORT=8091
ENV OSRM_URL=https://router.project-osrm.org
ENV DUCKDB_PATH=:memory:
ENV PYTHONUNBUFFERED=1

EXPOSE 8091

# Docker-level health check (container orchestrator can use this)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8091/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8091", "--workers", "1"]
