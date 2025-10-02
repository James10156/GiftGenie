# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci
RUN cd client && npm ci
RUN cd server && npm ci

# Copy source code
COPY . .

# Build the application
RUN cd client && npm run build
RUN cd server && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --only=production
RUN cd server && npm ci --only=production

# Copy built application
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server/dist/index.js"]