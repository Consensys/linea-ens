FROM node:22.21.1-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apk add --no-cache libc6-compat python3 make g++ git \
    cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_ALCHEMY_KEY
ARG NEXT_PUBLIC_INFURA_KEY
ARG NEXT_PUBLIC_WC_PROJECT_ID
ARG NEXT_PUBLIC_THE_GRAPH_MAINNET_API_KEY
ARG NEXT_PUBLIC_THE_GRAPH_SEPOLIA_API_KEY

ENV NEXT_PUBLIC_ALCHEMY_KEY=$NEXT_PUBLIC_ALCHEMY_KEY
ENV NEXT_PUBLIC_INFURA_KEY=$NEXT_PUBLIC_INFURA_KEY
ENV NEXT_PUBLIC_WC_PROJECT_ID=$NEXT_PUBLIC_WC_PROJECT_ID
ENV NEXT_PUBLIC_THE_GRAPH_MAINNET_API_KEY=$NEXT_PUBLIC_THE_GRAPH_MAINNET_API_KEY
ENV NEXT_PUBLIC_THE_GRAPH_SEPOLIA_API_KEY=$NEXT_PUBLIC_THE_GRAPH_SEPOLIA_API_KEY

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY packages/linea-ens-app/package.json ./packages/linea-ens-app/
COPY packages/linea-ens-contracts/package.json ./packages/linea-ens-contracts/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline

COPY .git ./.git

COPY packages/linea-ens-app/ ./packages/linea-ens-app/
COPY packages/linea-ens-contracts/ ./packages/linea-ens-contracts/

WORKDIR /app/packages/linea-ens-app
RUN pnpm build

FROM node:22.21.1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/linea-ens-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/linea-ens-app/.next/static ./packages/linea-ens-app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/linea-ens-app/public ./packages/linea-ens-app/public

EXPOSE 3000

USER nextjs

CMD ["node", "packages/linea-ens-app/server.js"]
