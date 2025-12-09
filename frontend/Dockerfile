# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install additional dependencies for SWC
RUN apk add --no-cache libc6-compat python3 make g++

# Declare build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_SECRET
ARG VITE_API_BASE_URL

# Set environment variables for build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_SECRET=$VITE_GOOGLE_CLIENT_SECRET
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built assets from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]