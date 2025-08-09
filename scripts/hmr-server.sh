#!/bin/bash

# LogSeq Plugin HMR Development Server
# Serves the plugin with hot module replacement for development in LogSeq

set -e

PORT=5173
DEV_SERVER_URL="http://localhost:${PORT}"
PLUGIN_DIR="$(pwd)"

# Extract version from package.json safely with validation
PKG_VERSION=$(node -e "
  try {
    const pkg = JSON.parse(require('fs').readFileSync('./package.json', 'utf8'));
    if (typeof pkg.version !== 'string' || !pkg.version.match(/^[0-9]+\.[0-9]+\.[0-9]+/)) {
      throw new Error('Invalid version format');
    }
    console.log(pkg.version);
  } catch (error) {
    console.error('Error reading package.json version:', error.message);
    process.exit(1);
  }
")

echo "🔥 Starting LogSeq Plugin HMR Development Server..."
echo "📦 Setting up development environment..."

# Create development folder separate from production dist
mkdir -p dist-dev
cp manifest.dev.json dist-dev/manifest.json
cp index.dev.html dist-dev/index.html

# LogSeq also expects package.json in the plugin folder
# Create a simplified package.json for the plugin
cat > dist-dev/package.json << 'EOF'
{
    "name": "url-to-markdown-dev",
    "version": "0.9.0-dev",
    "description": "A Logseq plugin that automatically converts URLs to markdown with titles and favicons - Development Version",
    "main": "index.html",
    "author": "rudifa",
    "license": "MIT"
}
EOF

# Copy any other assets that might be needed
cp -r assets/* dist-dev/ 2>/dev/null || true

echo "🚀 Starting esbuild dev server with watch at ${DEV_SERVER_URL}"
echo "📝 Plugin will rebuild automatically on file changes!"
echo "🔄 Click 'Reload' in LogSeq after rebuild to see changes"
echo ""
echo "🔧 To use with LogSeq:"
echo "   1. In LogSeq, go to Settings → Advanced → Developer mode"
echo "   2. Click 'Load Unpacked Plugin'"
echo "   3. Select this folder: ${PLUGIN_DIR}/dist-dev"
echo "   4. The plugin will load from the HMR server automatically"
echo ""
echo "💡 When done developing:"
echo "   - Stop this server (Ctrl+C)"
echo "   - Run 'npm run build' for production"
echo ""

# Start esbuild with serve and watch (live-reload not available in this version)
npx esbuild src/index.ts \
  --bundle \
  --define:__PKG_VERSION__=\"$PKG_VERSION\" \
  --outfile=dist-dev/index.js \
  --format=esm \
  --platform=browser \
  --serve=${PORT} \
  --servedir=dist-dev \
  --watch
