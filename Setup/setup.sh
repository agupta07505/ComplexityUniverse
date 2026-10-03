#!/usr/bin/env bash
# ComplexityUniverse — automatic setup (macOS / Linux)
set -e
cd "$(dirname "$0")/.."

echo "=========================================="
echo "  ComplexityUniverse - Aiven MySQL Setup"
echo "=========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed. Install it from https://nodejs.org (LTS), then rerun."
  exit 1
fi

echo "[1/3] Installing project dependencies..."
npm install --no-audit --no-fund

echo ""
echo "[2/3] Setting up Aiven MySQL database, tables, views and triggers..."
node scripts/setup-db.mjs

echo ""
echo "[3/3] Setup complete!"
echo ""
echo "=========================================="
echo "  Start the website with:  ./Setup/run.sh"
echo "=========================================="
