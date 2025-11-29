#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm exec react-scripts build

echo "Installing backend dependencies..."
cd ../backend
npm install

echo "Build complete!"

