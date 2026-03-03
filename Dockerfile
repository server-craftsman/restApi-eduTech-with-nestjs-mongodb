# =============================================================================
# EduTech Backend — Multi-stage Dockerfile
# =============================================================================
# Stage 1 (deps)    : Install production-only node_modules via Bun
# Stage 2 (builder) : Install all deps + compile TypeScript → dist/
# Stage 3 (prod)    : Lean Node.js Alpine image — only what runtime needs
# =============================================================================

# ── Stage 1: Production dependencies ─────────────────────────────────────────
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Install ALL dependencies (including devDependencies for NestJS CLI + TypeScript)
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source files and compile
COPY . .
RUN bun run build

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules (from stage 1) and compiled output (from stage 2)
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./package.json

# Expose application port (configurable via PORT env var, defaults to 3000)
EXPOSE 3000

# Healthcheck — adjust path if you add a dedicated /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-3000}/api/v1 || exit 1

CMD ["node", "dist/main"]
