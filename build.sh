#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing root dependencies..."
npm install --prefix "$ROOT_DIR"

echo "Installing frontend dependencies..."
npm install --prefix "$ROOT_DIR/frontend"

echo "Building frontend with Vite..."
npm run build --prefix "$ROOT_DIR/frontend"

echo "Installing backend dependencies..."
npm install --prefix "$ROOT_DIR/backend"

echo "Build complete!"
