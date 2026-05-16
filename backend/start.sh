#!/bin/bash
# Render Backend Startup Script
# This script is called when the backend service starts

set -e  # Exit on error

echo "🚀 BhoomiAI Backend Starting..."

# Check environment
echo "Checking environment variables..."
if [ -z "$DB_HOST" ]; then
    echo "❌ DB_HOST not set"
    exit 1
fi

echo "✓ Environment OK"

# Install/upgrade Python dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✓ Dependencies installed"

# Start Uvicorn server
echo "Starting Uvicorn server on port $PORT..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port $PORT \
    --workers 1 \
    --log-level info
