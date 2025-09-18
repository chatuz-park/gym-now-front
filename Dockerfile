# --- Base build stage ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# --- Dev stage (optional): run Vite dev server ---
FROM base AS dev
ENV HOST=0.0.0.0
# Default dev port; can be overridden by PORT env
ENV PORT=5173
EXPOSE 5173
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port ${PORT:-5173}"]

# --- Build stage ---
FROM base AS build
ENV NODE_ENV=production
RUN npm run build

# --- Production stage: Nginx to serve static files ---
FROM nginx:1.27-alpine AS prod
# SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
