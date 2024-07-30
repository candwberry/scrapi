FROM ubuntu:22.04

# Install curl and other dependencies
RUN apt-get update && apt-get install -y curl unzip

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:${PATH}"

# Install Chromium and its dependencies
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository universe && \
    apt-get update && \
    apt-get install -y chromium-browser

# Set the Chrome executable path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy project to /home/scrapi
COPY . /home/scrapi

# Go to copied directory
WORKDIR /home/scrapi

# Install node_modules, build project
RUN bun install
RUN bun --bun run build