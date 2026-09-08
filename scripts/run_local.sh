#!/usr/bin/env bash
# Local dev: cp .env.example .env, fill GOOGLE_API_KEY and PARALLEL_API_KEY, then ./scripts/run_local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --port 8080
