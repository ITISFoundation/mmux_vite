# Build stage
FROM node:24-alpine AS builder
ARG APP_UID=1000
ARG APP_GID=1000
RUN apk --no-cache --update add openjdk21
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN chown "$APP_UID":"$APP_GID" /app/node_modules /app/node_modules/.vite-temp

# Production stage
FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist .

# Install curl for healthcheck and thttpd for serving static files
RUN apk add --no-cache curl thttpd

EXPOSE 8080

# Add healthcheck
HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["thttpd", "-D", "-h", "0.0.0.0", "-p", "8080", "-d", "/app", "-u", "nobody", "-l", "-"]
