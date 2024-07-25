FROM oven/bun:debian

# Set non-interactive frontend flag
ENV DEBIAN_FRONTEND=noninteractive
RUN apk add --no-cache \ chromium

# Copy project /home/app
COPY . /home/scrapi

# Go to copied directory
WORKDIR /home/scrapi

# Install node_modules, build project
RUN bun install
RUN bun --bun run build