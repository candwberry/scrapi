FROM oven/bun:debian

# Set non-interactive frontend flag
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \\
    && apt-get install -y wget gnupg \\
    && wget -q -O - <https://dl-ssl.google.com/linux/linux_signing_key.pub> | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \\
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] <https://dl-ssl.google.com/linux/chrome/deb/> stable main" > /etc/apt/sources.list.d/google.list \\
    && apt-get update \\
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \\
      --no-install-recommends \\
    && rm -rf /var/lib/apt/lists/* \\
    && groupadd -r apify && useradd -rm -g apify -G audio,video apify

# Determine the path of the installed Google Chrome
RUN which google-chrome-stable || true

# Copy project /home/app
COPY . /home/scrapi
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Go to copied directory
WORKDIR /home/scrapi

# Install node_modules, build project
RUN bun install
RUN bun --bun run build