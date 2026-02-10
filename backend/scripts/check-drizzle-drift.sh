#!/usr/bin/env bash
set -euo pipefail

if ! git diff --quiet -- drizzle; then
  echo "Detected schema/migration drift under backend/drizzle."
  echo "Regenerate and commit artifacts with:"
  echo "  cd backend && bun run db:drizzle:generate"
  echo
  git --no-pager diff --name-status -- drizzle
  exit 1
fi

echo "No schema/migration drift detected."
