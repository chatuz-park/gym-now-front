# syntax=docker/dockerfile:1

# --- Install dependencies (cached unless lockfile changes) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# --- Dev: Vite with HMR ---
FROM node:22-alpine AS dev
WORKDIR /app
ENV HOST=0.0.0.0 \
    PORT=5173 \
    CHOKIDAR_USEPOLLING=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port ${PORT:-5173}"]

# --- Build static assets ---
# Vite inlines VITE_* at compile time; pass them as --build-arg (runtime ENV is ignored).
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_APP_NAME=Gym Now
ARG VITE_APP_VERSION=1.0.0
ENV NODE_ENV=production \
    VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production: Nginx serves the SPA ---
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
