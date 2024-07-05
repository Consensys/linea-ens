FROM node:18

# Install system dependencies (if necessary)
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG NEXT_PUBLIC_ALCHEMY_KEY
ARG NEXT_PUBLIC_INFURA_KEY
ARG NEXT_PUBLIC_WC_PROJECT_ID
ENV NEXT_PUBLIC_ALCHEMY_KEY=$NEXT_PUBLIC_ALCHEMY_KEY
ENV NEXT_PUBLIC_INFURA_KEY=$NEXT_PUBLIC_INFURA_KEY
ENV NEXT_PUBLIC_WC_PROJECT_ID=$NEXT_PUBLIC_WC_PROJECT_ID

COPY . .

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN rm -rf node_modules
RUN pnpm config set store-dir ~/.local/share/pnpm/store


WORKDIR /app/packages/linea-ens-app

# Clear Next.js cache
RUN rm -rf .next
RUN pnpm install
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]