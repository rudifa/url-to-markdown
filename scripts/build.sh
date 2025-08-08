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
  $SCRIPT_NAME main [--watch]         Build main plugin (index.ts -> dist/index.js)
  $SCRIPT_NAME visual-test [--watch]  Build visual test (visual-test-entry.ts -> dist/visual-test.js)

Options:
  --watch    Enable watch mode for development
EOF
}

build_main() {
  local watch_flag="$1"
  echo "Building main plugin..."

  esbuild src/index.ts \
    $COMMON_OPTS \
    --outfile=dist/index.js \
    --format=esm \
    --platform=browser \
    $watch_flag

  # Copy HTML files (only in non-watch mode to avoid repeated copying)
  if [[ "$watch_flag" != "--watch" ]]; then
    echo "Copying HTML files..."
    cp index.html dist/plugin.html
    cp index.html dist/index.html
  fi
}

build_visual_test() {
  local watch_flag="$1"
  echo "Building visual test..."

  esbuild src/visual-test-entry.ts \
    $COMMON_OPTS \
    --outfile=dist/visual-test.js \
    --format=iife \
    --platform=browser \
    $watch_flag

  # Copy test assets (only in non-watch mode)
  if [[ "$watch_flag" != "--watch" ]]; then
    echo "Copying visual test assets..."
    cp visual-test-template.html dist/visual-test.html
    cp assets/favicon.svg dist/favicon.svg
  fi
}

main() {
  if [[ $# -eq 0 ]]; then
    print_usage
    exit 1
  fi

  local target="$1"
  local watch_flag=""

  # Check for --watch flag
  if [[ $# -eq 2 && "$2" == "--watch" ]]; then
    watch_flag="--watch"
  elif [[ $# -gt 2 || ($# -eq 2 && "$2" != "--watch") ]]; then
    echo "Error: Invalid arguments" >&2
    print_usage
    exit 1
  fi

  case "$target" in
    main)
      build_main "$watch_flag"
      ;;
    visual-test)
      build_visual_test "$watch_flag"
      ;;
    *)
      echo "Error: Unknown target '$target'" >&2
      print_usage
      exit 1
      ;;
  esac
}

main "$@"
