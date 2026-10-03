#!/usr/bin/env bash
# ComplexityUniverse — start the dev server (macOS / Linux)
set -e
cd "$(dirname "$0")"

echo "Starting ComplexityUniverse..."
echo "(Local MySQL: make sure it is running)"
echo "(Aiven: nothing to do - the site connects to the cloud automatically)"
echo ""
echo "Open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop the server."
echo ""

npm run dev
