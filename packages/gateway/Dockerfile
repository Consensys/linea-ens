FROM node:16.14.2-alpine as build
WORKDIR /gateway
COPY ./package.json ./
RUN pnpm
COPY . .
RUN pnpm build

FROM node:16.14.2-alpine
WORKDIR /gateway
COPY --from=build /gateway .

CMD pnpm start --l2_resolver_address $L2_RESOLVER_ADDRESS --l1_provider_url $L1_PROVIDER_URL --l2_provider_url $L2_PROVIDER_URL --port 8080
