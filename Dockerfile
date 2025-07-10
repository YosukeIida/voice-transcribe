# Node.js 20 with pnpm
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install basic tools
RUN apk add --no-cache \
    git \
    bash \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set pnpm store directory
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile || true

# Copy the rest of the application
COPY . .

# Expose port for development server
EXPOSE 5173

# Default command
CMD ["pnpm", "dev"]