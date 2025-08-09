#!/bin/bash

# Enhanced development server with browser auto-refresh
# Uses a timestamp file to trigger browser reloads

set -e

PORT=3003
SERVER_URL="http://127.0.0.1:${PORT}/visual-test.html"
RELOAD_SCRIPT="auto-reload.js"

echo "🧹 Cleaning up any existing server on port ${PORT}..."
pkill -f "python3 -m http.server ${PORT}" 2>/dev/null || true

echo "🔨 Building visual test..."
npm run build:visual-test

# Create auto-reload script
echo "📡 Setting up auto-reload mechanism..."
cat > "dist/${RELOAD_SCRIPT}" << 'EOF'
// Auto-reload mechanism - checks for file changes
(function() {
    let lastTimestamp = null;

    function checkForUpdates() {
        fetch('/build-timestamp.txt?' + Date.now())
            .then(response => response.text())
            .then(timestamp => {
                if (lastTimestamp === null) {
                    lastTimestamp = timestamp;
                    console.log('🔄 Auto-reload enabled');
                } else if (timestamp !== lastTimestamp) {
                    console.log('🔄 Changes detected, reloading...');
                    window.location.reload();
                }
            })
            .catch(() => {
                // Ignore errors (server might be restarting)
            });
    }

    // Check every 1 second
    setInterval(checkForUpdates, 1000);
    checkForUpdates();
})();
EOF

echo "🚀 Starting development server at ${SERVER_URL}"
echo "📝 Watching src/ and assets/ for changes..."
echo "🔄 Browser will auto-refresh on changes!"
echo ""

# Start HTTP server in background
(cd dist && python3 -m http.server ${PORT} --bind 127.0.0.1 >/dev/null 2>&1 &)

# Start file watcher with timestamp creation
npx nodemon \
  --watch src \
  --watch assets \
  --ext ts,html,svg \
  --exec 'npm run build:visual-test && echo "$(date +%s)" > dist/build-timestamp.txt && echo "🔄 Auto-rebuilt at $(date +%H:%M:%S) - browser will refresh automatically"'
