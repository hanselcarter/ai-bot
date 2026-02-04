# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy knowledge files for RAG
COPY --from=builder /app/src/llm/knowledge ./dist/llm/knowledge

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/chat.db

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
