# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (includes both client and server)
RUN npm run build:railway

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start:railway"]