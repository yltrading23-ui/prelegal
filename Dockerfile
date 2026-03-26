# ── Stage 1: Build Next.js static export ─────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output is in /build/frontend/out

# ── Stage 2: Python backend + serve static files ──────────────────────────────
FROM python:3.12-slim AS backend

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy backend source and install dependencies
COPY backend/pyproject.toml ./
RUN uv pip install --system -r pyproject.toml 2>/dev/null || \
    uv pip install --system \
        "fastapi>=0.115.0" \
        "uvicorn[standard]>=0.30.0" \
        "bcrypt>=4.0.0" \
        "python-jose[cryptography]>=3.3.0" \
        "python-multipart>=0.0.9" \
        "aiofiles>=23.0.0"

COPY backend/ ./

# Copy built frontend static files
COPY --from=frontend-builder /build/frontend/out /app/static

# Data directory for SQLite
RUN mkdir -p /data

EXPOSE 8000

ENV STATIC_DIR=/app/static
ENV DB_PATH=/data/prelegal.db

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
