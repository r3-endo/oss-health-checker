#!/usr/bin/env bash
set -euo pipefail

if ! git diff --quiet -- db/drizzle; then
  echo "Detected schema/migration drift under db/drizzle."
  echo "Regenerate and commit artifacts with:"
  echo "  bun run db:drizzle:generate"
  echo
  git --no-pager diff --name-status -- db/drizzle
  exit 1
fi

echo "No schema/migration drift detected."