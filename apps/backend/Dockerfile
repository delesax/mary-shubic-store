FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ENV NODE_OPTIONS="--max-old-space-size=3072"
RUN npm run build

# --- Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.medusa/server ./

RUN npm install --omit=dev

EXPOSE 9000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]