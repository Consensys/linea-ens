FROM node:18

WORKDIR /app

RUN echo "Directory structure of /app:" && ls -alh /app

ARG ENV_FILE
ARG SIGNER_PRIVATE_KEY

ENV L1_PROVIDER_URL=http://127.0.0.1:8545
ENV L2_PROVIDER_URL=https://rpc.sepolia.linea.build/
ENV L1_ROLLUP_ADDRESS=0xB218f8A4Bc926cF1cA7b3423c154a0D627Bdb7E5
ENV L2_CHAIN_ID=59140

COPY . .

RUN npm install -g pnpm

RUN pnpm install
RUN pnpm build

EXPOSE 3000

RUN pnpm start