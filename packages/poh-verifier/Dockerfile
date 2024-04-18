FROM node:18

WORKDIR /app

ARG ENV_FILE

COPY . .

COPY $ENV_FILE .env

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]