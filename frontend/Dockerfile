# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

#------------------------------------------------------------------------------
# Base
#------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

#------------------------------------------------------------------------------
# Dependencies: cached until package*.json change
#------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

#------------------------------------------------------------------------------
# Dev: sources are bind-mounted by docker-compose.dev.yml
#------------------------------------------------------------------------------
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

#------------------------------------------------------------------------------
# Build: NEXT_PUBLIC_* variables are inlined at build time
#------------------------------------------------------------------------------
FROM deps AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=${NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS}
COPY . .
RUN npm run build

#------------------------------------------------------------------------------
# Runtime: standalone server, non-root user
#------------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1:3000/ > /dev/null || exit 1

CMD ["node", "server.js"]
