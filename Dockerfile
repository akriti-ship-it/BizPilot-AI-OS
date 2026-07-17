# --- Build Stage: Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies manifest
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Build frontend with relative API path
ENV VITE_API_URL=""
RUN npm run build

# --- Run Stage: Backend ---
FROM python:3.11-slim AS backend-runner
WORKDIR /app

# Install system dependencies needed for compiling some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend app
COPY backend/ ./backend/

# Copy built frontend assets from the build stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose FastAPI default port
EXPOSE 8000

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Command to run uvicorn
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
