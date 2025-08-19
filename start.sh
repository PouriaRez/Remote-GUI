#!/bin/bash

# Set default API URL
export REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:8000}

# Inject runtime API URL into config.js (only if you really need to do this at runtime)
CONFIG_PATH="/app/CLI/local-cli-fe-full/public/config.js"
TEMPLATE_PATH="/app/CLI/local-cli-fe-full/public/config.template.js"
sed "s|__REACT_APP_API_URL__|$REACT_APP_API_URL|g" "$TEMPLATE_PATH" > "$CONFIG_PATH"

# Don't build frontend here — frontend is already built in the image!

# Start backend
$VIRTUAL_ENV/bin/uvicorn CLI.local-cli-backend.main:app --host 0.0.0.0 --port 8000 &

# Serve the frontend build folder using python's simple HTTP server on port 3001
cd /app/CLI/local-cli-fe-full/build
python3 -m http.server 3001
