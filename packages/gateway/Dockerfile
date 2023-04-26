FROM node:16.14.2-alpine as build
WORKDIR /gateway
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM node:16.14.2-alpine
WORKDIR /gateway
COPY --from=build /gateway .
ARG L1_PROVIDER_URL
ARG L2_PROVIDER_URL
ARG L2_RESOLVER_ADDRESS
CMD yarn start --l2_resolver_address 0x117F113aEFb9AeD23d901C1fa02fDdaA1d20cCaB --l1_provider_url https://goerli.infura.io/v3/9ed1bd75f3d14307b365c2270d2ea66f --l2_provider_url https://consensys-zkevm-goerli-prealpha.infura.io/v3/16fff764ff2145c2b137fbe8013730c6