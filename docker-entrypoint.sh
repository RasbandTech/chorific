#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until pnpm --filter @workspace/db run push 2>&1; do
  echo "Database migration failed — retrying in 3s..."
  sleep 3
done

echo "Database ready. Starting API server..."
exec "$@"
