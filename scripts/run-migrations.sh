#!/bin/bash
set -e

echo "🔄 Running database migrations..."
cd /app
alembic upgrade head
echo "✅ Migrations complete"

echo "🚀 Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 --log-level info
