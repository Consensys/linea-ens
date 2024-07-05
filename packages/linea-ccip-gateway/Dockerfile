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

COPY packages/linea-ccip-gateway ./packages/linea-ccip-gateway
COPY packages/linea-state-verifier ./packages/linea-state-verifier
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN npm install -g pnpm

RUN pnpm install --filter ./packages/linea-state-verifier
RUN pnpm install --filter ./packages/linea-ccip-gateway

WORKDIR /app/packages/linea-ccip-gateway

RUN pnpm compile
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]