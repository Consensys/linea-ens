FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build

WORKDIR /app

ARG L1_PROVIDER_URL
ARG L2_PROVIDER_URL
ARG L1_ROLLUP_ADDRESS
ARG L2_CHAIN_ID
ARG NODE_ENV

ENV L1_PROVIDER_URL=$L1_PROVIDER_URL
ENV L2_PROVIDER_URL=$L2_PROVIDER_URL
ENV L1_ROLLUP_ADDRESS=$L1_ROLLUP_ADDRESS
ENV L2_CHAIN_ID=$L2_CHAIN_ID
ENV NODE_ENV=$NODE_ENV

COPY packages/linea-ccip-gateway ./packages/linea-ccip-gateway
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline

RUN pnpm run --filter=./packages/linea-ccip-gateway compile
RUN pnpm run --filter=./packages/linea-ccip-gateway build

RUN pnpm deploy --filter=./packages/linea-ccip-gateway --prod /prod/linea-ccip-gateway

FROM node:20-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

USER node

COPY --from=build /prod/linea-ccip-gateway .

EXPOSE 3000

CMD [ "node", "./dist/server.js" ]