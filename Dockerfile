# =============================================================================
# Flowgate Automation — Dockerfile (Multi-stage Build)
# =============================================================================
# Stage 1: Build
# Stage 2: Production (minimal, no dev deps)
# =============================================================================

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including dev deps for build)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --omit=dev

# --- Stage 2: Production ---
FROM node:20-alpine AS production

LABEL org.opencontainers.image.title="Flowgate Automation"
LABEL org.opencontainers.image.description="Resilient order processing library"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/lucasdaniel2201/flowgate-automation"

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S flowgate && \
    adduser -u 1001 -S flowgate -G flowgate

# Copy only production artifacts
COPY --from=builder --chown=flowgate:flowgate /app/package.json ./
COPY --from=builder --chown=flowgate:flowgate /app/node_modules ./node_modules
COPY --from=builder --chown=flowgate:flowgate /app/dist ./dist

USER flowgate

# Run the CLI with sample data by default
CMD ["node", "dist/cli/processOrders.cli.js"]
