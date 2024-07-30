FROM node:16-bullseye-slim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -qq \
    && apt install -qq -y --no-install-recommends \
      curl \
      git \
      unzip \
      gnupg \
      libgconf-2-4 \
      libxss1 \
      libxtst6 \
      python \
      g++ \
      build-essential \
      chromium \
      chromium-sandbox \
      dumb-init \
      fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb


# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:${PATH}"

# Copy project to /home/scrapi
COPY . /home/scrapi

# Go to copied directory
WORKDIR /home/scrapi

# Install node_modules, build project
RUN bun install
RUN bun --bun run build