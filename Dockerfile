FROM oven/bun:debian

# Set non-interactive frontend flag
ENV DEBIAN_FRONTEND=noninteractive


RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnss3-dev \
    libxss-dev \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*
    
    # Copy project /home/app
    COPY . /home/scrapi
    
    # Go to copied directory
    WORKDIR /home/scrapi
    
    # Install node_modules, build project
    RUN bun install
    
RUN chmod -R o+rx /root/.cache/puppeteer
RUN bun --bun run build