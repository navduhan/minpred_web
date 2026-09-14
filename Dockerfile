FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG NEXT_PUBLIC_BASE_PATH=/minpred
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git python3 python3-venv tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs

COPY deploy/install-s4pred.sh /tmp/install-s4pred.sh
RUN bash /tmp/install-s4pred.sh \
    && rm -f /tmp/install-s4pred.sh \
    && chown -R root:root /opt/s4pred /opt/s4pred-venv \
    && chmod -R a-w /opt/s4pred /opt/s4pred-venv

COPY deploy/package-standalone.sh /tmp/package-standalone.sh
RUN bash /tmp/package-standalone.sh /opt/minpred-downloads

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3365
ENV HOSTNAME=0.0.0.0
ENV S4PRED_SCRIPT=/opt/s4pred/run_model.py
ENV S4PRED_PYTHON=/opt/s4pred-venv/bin/python

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/public/download /app/data/jobs \
    && cp /opt/minpred-downloads/* /app/public/download/ \
    && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3365
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
