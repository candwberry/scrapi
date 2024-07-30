FROM oven/bun:debian

# Set non-interactive frontend flag
ENV DEBIAN_FRONTEND=noninteractive

# Install Chromium and its dependencies
RUN add-apt-repository universe
RUN apt-get update && apt-get install -y \
    chromium-browser \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set the Chrome executable path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy project to /home/scrapi
COPY . /home/scrapi

# Go to copied directory
WORKDIR /home/scrapi

# Install node_modules, build project
RUN bun install
RUN bun --bun run build