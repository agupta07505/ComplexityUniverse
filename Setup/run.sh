#!/usr/bin/env bash
# ComplexityUniverse — start the dev server (macOS / Linux)
set -e
cd "$(dirname "$0")/.."

echo "Starting ComplexityUniverse..."
echo "Connected to Aiven MySQL cloud database"
echo ""
echo "Open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop the server."
echo ""

npm run dev
