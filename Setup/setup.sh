#!/usr/bin/env bash
# ComplexityUniverse — automatic setup (macOS / Linux)
set -e
cd "$(dirname "$0")"

echo "=========================================="
echo "  ComplexityUniverse - Automatic Setup"
echo "=========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed. Install it from https://nodejs.org (LTS), then rerun."
  exit 1
fi

echo "[1/3] Installing project dependencies..."
npm install --no-audit --no-fund

echo ""
echo "[2/3] Creating the MySQL database, tables, views and triggers..."
echo "      (Local MySQL: make sure it is running)"
echo "      (Aiven / online MySQL: fill in .env.local first - see README)"
node scripts/setup-db.mjs

echo ""
echo "[3/3] Setup complete!"
echo ""
echo "=========================================="
echo "  Start the website with:  ./run.sh"
echo "=========================================="
