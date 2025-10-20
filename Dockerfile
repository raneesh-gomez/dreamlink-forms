# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Build the app WITHOUT injecting secrets
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine

# Copy built app to NGINX html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy env template for runtime injection
COPY env.template.js /usr/share/nginx/html/env.template.js

# Copy NGINX config (SPA routing support)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
CMD ["/entrypoint.sh"]