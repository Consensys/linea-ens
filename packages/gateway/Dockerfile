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
CMD yarn start