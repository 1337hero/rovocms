# RovoCMS - Lightweight Bun-based Docker image
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb* ./
RUN bun install --production

# Copy application files (server and assets)
COPY server.ts ./
COPY pages ./pages
COPY assets ./assets

# Create directory for SQLite database
RUN mkdir -p /data

# Expose port
EXPOSE 3000

# Set database path to volume
ENV DATABASE_PATH=/data/cms.db

# Run the server
CMD ["bun", "run", "server.ts"]