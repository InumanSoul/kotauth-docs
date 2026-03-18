# =============================================================================
# Stage 1 — Build
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack so pnpm is available without a separate install step.
RUN corepack enable

# Install dependencies first — separate layer so Docker cache is reused
# when only source files change.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build the static site.
COPY . .
RUN pnpm run build

# =============================================================================
# Stage 2 — Runtime
# =============================================================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1
