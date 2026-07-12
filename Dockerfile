# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# package-lock.json is currently out of sync with package.json in this project.
# Use npm install so EasyPanel can build from the repository state.
RUN npm install

COPY . .

# Vite exposes only VITE_* variables to the browser bundle at build time.
# In EasyPanel, set this build arg if the backend is not served behind /api.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.mjs ./docker-entrypoint.mjs

USER appuser

EXPOSE 3000

CMD ["node", "docker-entrypoint.mjs"]
