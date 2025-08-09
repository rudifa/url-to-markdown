#!/usr/bin/env bash

# Build script for url-to-markdown project
# Consolidates esbuild configuration and file copying logic

set -e

SCRIPT_NAME=$(basename "$0")

# Common esbuild options
COMMON_OPTS="--bundle --define:__PKG_VERSION__=\"$npm_package_version\""

print_usage() {
  cat <<EOF
Usage:
  $SCRIPT_NAME main         Build main plugin (index.ts -> dist/index.js)
  $SCRIPT_NAME visual-test  Build visual test (assets/visual-test.ts -> dist/visual-test.js)
EOF
}

build_main() {
  echo "Building main plugin..."

  esbuild src/index.ts \
    $COMMON_OPTS \
    --outfile=dist/index.js \
    --format=esm \
    --platform=browser

  echo "Copying HTML files..."
  cp index.html dist/index.html
}

build_visual_test() {
  echo "Building visual test..."

  esbuild assets/visual-test.ts \
    $COMMON_OPTS \
    --outfile=dist/visual-test.js \
    --format=iife \
    --platform=browser

  echo "Copying visual test assets..."
  cp assets/visual-test.html dist/visual-test.html
  cp assets/favicon.svg dist/favicon.svg
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
