#!/usr/bin/env bash
# Bundle linux/arm64 Python deps for AgentCore direct code deploy (no Docker).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/cdk/agents/agentcore"
OUT="$ROOT/cdk/agents/agentcore-bundle"

echo "==> Bundling AgentCore code for linux/arm64 into $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"

export PYTHONDONTWRITEBYTECODE=1

pip3 install \
  --platform manylinux2014_aarch64 \
  --python-version 3.12 \
  --implementation cp \
  --only-binary=:all: \
  --upgrade \
  -r "$SRC/requirements.txt" \
  -t "$OUT"

cp "$SRC/main.py" "$OUT/"

# Remove bytecode/cache created during local pip (breaks AgentCore arm64 runtime).
find "$OUT" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find "$OUT" -type f -name '*.pyc' -delete 2>/dev/null || true
find "$OUT" -type f -name '*.pyo' -delete 2>/dev/null || true

echo "==> Bundle ready ($(du -sh "$OUT" | cut -f1))"
