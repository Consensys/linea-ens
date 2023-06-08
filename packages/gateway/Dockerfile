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

CMD yarn start --l2_resolver_address 0xCc6bBa9AFF0aC1e4755206A1D8cD8E63054141bF --l1_provider_url https://goerli.infura.io/v3/9ed1bd75f3d14307b365c2270d2ea66f --l2_provider_url https://linea-goerli.infura.io/v3/16fff764ff2145c2b137fbe8013730c6 --port 8080
