#!/bin/bash
# Render Frontend Startup Script
# This script is called when the frontend is built

set -e  # Exit on error

echo "ðŸš€ MaatiTrace Frontend Building..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm ci  # Use ci instead of install for reproducible builds

# Build for production
echo "Building React app..."
npm run build

echo "âœ“ Build complete"
echo "Output directory: dist/"
