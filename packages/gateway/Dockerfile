FROM node:18

WORKDIR /app

ARG L1_PROVIDER_URL
ARG L2_PROVIDER_URL
ARG L1_ROLLUP_ADDRESS
ARG L2_CHAIN_ID

ENV L1_PROVIDER_URL=$L1_PROVIDER_URL
ENV L2_PROVIDER_URL=$L2_PROVIDER_URL
ENV L1_ROLLUP_ADDRESS=$L1_ROLLUP_ADDRESS
ENV L2_CHAIN_ID=$L2_CHAIN_ID

COPY packages/gateway ./packages/gateway
COPY packages/linea-verifier ./packages/linea-verifier
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN npm install -g pnpm

RUN pnpm install --filter ./packages/linea-verifier
RUN pnpm install --filter ./packages/gateway

WORKDIR /app/packages/gateway

RUN pnpm compile
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]