#!/usr/bin/env bash
# build.sh — KrishiSetu Nexus Root Build Script for Render
# Usage: bash build.sh
set -e

echo "==> Installing backend dependencies..."
npm install --prefix backend

echo "==> Installing frontend dependencies..."
npm install --prefix krishisetu-frontend

echo "==> Building frontend (Vite)..."
npm run build --prefix krishisetu-frontend

echo "==> Build complete!"
