# Build from repository root: docker build -f apps/worker/Dockerfile -t namaste-worker .
FROM node:24.21.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates tini libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 \
    libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 \
    libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --include=dev --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY scripts/render-v2-job.ts ./scripts/render-v2-job.ts
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/src ./apps/web/src
COPY apps/web/scripts/storyboards-worker.ts apps/web/scripts/generations-worker.ts apps/web/scripts/cloud-job.ts ./apps/web/scripts/
COPY apps/worker ./apps/worker
RUN chown -R node:node /app
USER node
RUN ./node_modules/.bin/remotion browser ensure
# Fail the image build before credentials or queued jobs are involved.
RUN node --import tsx apps/worker/smoke.ts
ENV NODE_ENV=production
# Forward shutdown to the entire process group, including renderer/Chromium children.
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "node", "apps/worker/start.mjs"]
# An unconfigured Cloud Run execution must exit, never start an endless poller.
CMD ["generation", "--job", "required"]
