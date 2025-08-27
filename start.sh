# #!/bin/bash
# set -euo pipefail

# # Set default API URL
# export REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:8000}

# # # Inject runtime API URL into config.js (only if you really need to do this at runtime)
# # CONFIG_PATH="/app/CLI/local-cli-fe-full/public/config.js"
# # TEMPLATE_PATH="/app/CLI/local-cli-fe-full/public/config.template.js"
# # sed "s|__REACT_APP_API_URL__|$REACT_APP_API_URL|g" "$TEMPLATE_PATH" > "$CONFIG_PATH"

# # write config.js into the build dir that’s actually being served
# BUILD_DIR="/app/CLI/local-cli-fe-full/build"
# cat > "$BUILD_DIR/config.js" <<EOF
# window._env_ = {
#   REACT_APP_API_URL: "${REACT_APP_API_URL}"
# };
# EOF

# # Don't build frontend here — frontend is already built in the image!

# # Start backend
# $VIRTUAL_ENV/bin/uvicorn CLI.local-cli-backend.main:app --host 0.0.0.0 --port 8000 &

# # Serve the frontend build folder using python's simple HTTP server on port 3001
# cd /app/CLI/local-cli-fe-full/build
# python3 -m http.server 3001


#!/bin/bash
set -euo pipefail

# ---------- Config ----------
export REACT_APP_API_URL="${REACT_APP_API_URL:-http://localhost:8000}"
BUILD_DIR="/app/CLI/local-cli-fe-full/build"
BACKEND_HOST="0.0.0.0"
BACKEND_PORT="8000"
FRONTEND_PORT="3001"

# ---------- Runtime env injection ----------
# Write config.js into the *built* app that is actually served
mkdir -p "$BUILD_DIR"
cat > "${BUILD_DIR}/config.js" <<EOF
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}"
};
EOF

# ---------- Graceful shutdown ----------
UVICORN_PID=""
SERVE_PID=""

cleanup() {
  # kill remaining children if still running
  for pid in "$UVICORN_PID" "$SERVE_PID"; do
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      kill "${pid}" 2>/dev/null || true
      # give them a moment to exit gracefully
      sleep 1
      kill -9 "${pid}" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

# ---------- Start backend ----------
$VIRTUAL_ENV/bin/uvicorn CLI.local-cli-backend.main:app \
  --host "${BACKEND_HOST}" \
  --port "${BACKEND_PORT}" &
UVICORN_PID=$!
echo "[start.sh] uvicorn started (pid=${UVICORN_PID}) on ${BACKEND_HOST}:${BACKEND_PORT}"

# ---------- Start frontend (SPA fallback) ----------
serve -s "${BUILD_DIR}" -l "${FRONTEND_PORT}" &
SERVE_PID=$!
echo "[start.sh] serve started (pid=${SERVE_PID}) on 0.0.0.0:${FRONTEND_PORT}"

# ---------- Wait for either to exit, then cleanup ----------
# If one process crashes, we exit the container (after cleanup trap runs)
wait -n "${UVICORN_PID}" "${SERVE_PID}"
