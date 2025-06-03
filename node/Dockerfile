# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist .

# Install curl for healthcheck and thttpd for serving static files
RUN apk add --no-cache curl thttpd

EXPOSE 8888

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["thttpd", "-D", "-h", "0.0.0.0", "-p", "8080", "-d", "/app", "-u", "nobody", "-l", "-"]
