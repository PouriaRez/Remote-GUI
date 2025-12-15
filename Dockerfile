# =====================
# Frontend build stage
# =====================
FROM node:18-slim AS frontend
WORKDIR /app

# Install system deps for native npm packages
RUN apt-get -y update && apt-get install -y --no-install-recommends \
    build-essential python3 git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install deps
COPY CLI/local-cli-fe-full/package*.json ./
RUN npm install --legacy-peer-deps --no-audit --progress=false

# Copy rest of the frontend source
COPY CLI/local-cli-fe-full ./

# Build-time API URL (can be overridden at build time)
ARG REACT_APP_API_URL=http://127.0.0.1:8000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Prevent OOM in big builds
ENV NODE_OPTIONS=--max_old_space_size=4096

# Install mongoose (since frontend code uses it) and build production frontend
RUN npm install mongoose && npm run build

# =====================
# Python backend build stage
# =====================
FROM python:3.11-slim AS backend
WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages including python3-venv for virtualenv creation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git curl gnupg xsel npm python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment and activate PATH
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV VIRTUAL_ENV=/opt/venv

# Copy and install Python backend dependencies into virtualenv
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip wheel \
    && pip install --no-cache-dir -r requirements.txt

# Clone and install AnyLog-API into the virtualenv
RUN git clone --branch main --depth 1 https://github.com/AnyLog-co/AnyLog-API /tmp/AnyLog-API \
    && cd /tmp/AnyLog-API \
    && python setup.py sdist bdist_wheel \
    && pip install --no-cache-dir dist/*.whl

# Copy backend source code and start script
COPY templates/ templates/
COPY CLI/ CLI/
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# =====================
# Final minimal runtime image
# =====================
FROM python:3.11-slim AS final
WORKDIR /app

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV CLI_IP=0.0.0.0
ENV CLI_PORT=8000

# Copy virtualenv from backend build stage
COPY --from=backend /opt/venv /opt/venv

# Copy backend source + start script
COPY --from=backend /app/templates templates/
COPY --from=backend /app/CLI CLI/
COPY --from=backend /app/start.sh /app/start.sh
# Copy built frontend from frontend stage
COPY --from=frontend /app/build /app/CLI/local-cli-fe-full/build


# # Install runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends npm xsel && \
#     sed -i 's/\r$//' /app/start.sh && \
#     chmod +x /app/start.sh && \
#     rm -rf /var/lib/apt/lists/*

# Install runtime dependencies (npm is already installed, add serve)
RUN apt-get update && apt-get install -y --no-install-recommends npm xsel && \
    npm install -g serve && \
    sed -i 's/\r$//' /app/start.sh && \
    chmod +x /app/start.sh && \
    rm -rf /var/lib/apt/lists/*

    
EXPOSE 8000 3001

ENTRYPOINT ["/app/start.sh"]
#ENTRYPOINT ["/bin/sh"]