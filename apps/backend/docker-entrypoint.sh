#!/bin/sh
set -e

echo "Running database migrations..."
npx medusa db:migrate

echo "Starting Medusa server..."
exec node index.js