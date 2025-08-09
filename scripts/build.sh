#!/usr/bin/env bash

# Build script for url-to-markdown project
# Consolidates esbuild configuration and file copying logic

set -e

SCRIPT_NAME=$(basename "$0")

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

# Common esbuild options
COMMON_OPTS="--bundle --define:__PKG_VERSION__=\"$PKG_VERSION\""

print_usage() {
  cat <<EOF
Usage:
  $SCRIPT_NAME main         Build main plugin (index.ts -> dist/index.js)
  $SCRIPT_NAME visual-test  Build visual test (assets/visual-test.ts -> dist-dev/visual-test.js)
EOF
}

build_main() {
  echo "Building main plugin..."

  esbuild src/index.ts \
    $COMMON_OPTS \
    --outfile=dist/index.js \
    --format=esm \
    --platform=browser

  echo "Copying HTML files and assets..."

  # Copy HTML file with error checking
  if [[ ! -f index.html ]]; then
    echo "Error: Source file index.html not found." >&2
    exit 1
  fi
  cp index.html dist/index.html

  # Copy favicon with error checking
  if [[ ! -f assets/favicon.svg ]]; then
    echo "Error: Source file assets/favicon.svg not found." >&2
    exit 1
  fi
  cp assets/favicon.svg dist/favicon.svg
}

build_visual_test() {
  echo "Building visual test..."

  # Create dist-dev for development builds
  mkdir -p dist-dev

  esbuild assets/visual-test.ts \
    $COMMON_OPTS \
    --outfile=dist-dev/visual-test.js \
    --format=iife \
    --platform=browser

  echo "Copying visual test assets..."
  cp assets/visual-test.html dist-dev/visual-test.html
  cp assets/favicon.svg dist-dev/favicon.svg
}

main() {
  if [[ $# -ne 1 ]]; then
    print_usage
    exit 1
  fi

  local target="$1"

  case "$target" in
    main)
      build_main
      ;;
    visual-test)
      build_visual_test
      ;;
    *)
      echo "Error: Unknown target '$target'" >&2
      print_usage
      exit 1
      ;;
  esac
}

main "$@"
