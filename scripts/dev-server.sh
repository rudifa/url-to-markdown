#!/bin/bash

# Development server with HMR-like functionality for LogSeq plugin visual testing
# Inspired by LogSeq's recommendation for iframe-based UI development

set -e

PORT=3003
SERVER_URL="http://127.0.0.1:${PORT}/visual-test.html"

echo "🧹 Cleaning up any existing server on port ${PORT}..."
pkill -f "python3 -m http.server ${PORT}" 2>/dev/null || true

echo "🔨 Building visual test..."
npm run build:visual-test

echo "🚀 Starting development server at ${SERVER_URL}"
echo "📝 Watching src/ and assets/ for changes..."
echo "💡 Tip: Keep your browser open and refresh after seeing rebuild messages"
echo ""

# Start HTTP server in background
(cd dist && python3 -m http.server ${PORT} --bind 127.0.0.1 >/dev/null 2>&1 &)

# Start file watcher with nodemon
npx nodemon \
  --watch src \
  --watch assets \
  --ext ts,html,svg \
  --exec 'npm run build:visual-test && echo "🔄 Rebuilt at $(date +%H:%M:%S) - refresh browser to see changes"'
