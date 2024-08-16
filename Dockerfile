FROM oven/bun:debian

ARG EBAY_CERT_ID
ARG OPENAI_API_KEY

ENV EBAY_CERT_ID=$EBAY_CERT_ID
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Set non-interactive frontend flag
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV DEBIAN_FRONTEND=noninteractive

# Install Chromium and its dependencies
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
    && rm -rf /src/*.deb \
    && echo 'export CHROME_DEVEL_SANDBOX=/usr/bin/chrome-devel-sandbox' >> /etc/environment

# Copy project to /home/scrapi
COPY . /home/scrapi

# Copy sqlite database to /home/scrapi
COPY /home/mydb.sqlite /home/scrapi/mydb.sqlite

# Go to copied directory
WORKDIR /home/scrapi

# Install node_modules, build project
RUN bun install
RUN bun --bun run build