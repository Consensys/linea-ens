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
CMD yarn start --l2_resolver_address 0x756877316A15944cb5fE548318DaC094B7E216F2 --l1_provider_url https://goerli.infura.io/v3/dd1ad6c018ec409dabc0a2eb345555a5 --l2_provider_url https://consensys-zkevm-goerli-prealpha.infura.io/v3/dd1ad6c018ec409dabc0a2eb345555a5