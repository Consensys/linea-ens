FROM node:18

WORKDIR /app

ARG ENV_FILE
ARG SIGNER_PRIVATE_KEY

ENV L1_PROVIDER_URL=http://127.0.0.1:8545
ENV L2_PROVIDER_URL=https://rpc.sepolia.linea.build/
ENV L1_ROLLUP_ADDRESS=0xB218f8A4Bc926cF1cA7b3423c154a0D627Bdb7E5
ENV L2_CHAIN_ID=59140
ENV PORT=3000

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