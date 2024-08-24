# scrapi
Scrapi is a homemade web scraper for C&W Berry LTD - Builders' Merchant.

![C&W Berry Ltd](https://github.com/user-attachments/assets/f377e89c-ecf2-4e59-a4df-bcbf3e20ef3c)

## Features
- **Websites:** Scrapes from ebay, amazon, and manomano.
- **Cheapest 3 Google Results:** Scrapes the cheapest 3 results from Google Search.
- **Determined:** Scrapi tries very hard to find a price on the website using structured data, common regex's and on failure of these, it uses OpenAI's GPT-4 model to find a price.
- **Database:** Fast SQLite database for storing prices and products, keeping old prices for comparison.
- **Shell:** A web shell for running commands on the server.
- **Browser:** A page that finds the price and takes a screenshot of any URL it is given. 


# Technical Details
### Built With
- SvelteKit - Web Framework
- TypeScript - Programming Language
- Puppeteer - Web Scraping Library
- Vite - Build Tool and Dev Server
- Tailwind CSS - CSS Framework
- Bun - JavaScript Runtime and Package Manager
- bun:sqlite - SQLite Database Library
- GitHub Actions & Dockerfile - Auto build and deploy upon push to main branch
- OpenAI API - gpt-4o-mini as a fallback if standard methods cannot find a price
- ebay-api - Node eBay API wrapper

# Installation
### For Production on Ubuntu (Linux)
1. Install `git`, `unzip`, `bun`.
```bash
sudo apt update
sudo apt install -y git unzip
curl -fsSL https://bun.sh/install | bash # for macOS, Linux, and WSL
```

2. Download [ExpressVPN](https://www.expressvpn.com/latest#linux) and [Google Chrome](https://www.google.com/chrome/?platform=linux) from the web and install them using the following command.
```bash
cd Downloads
sudo dpkg -i expressvpn*.deb
sudo dpkg -i google-chrome*.deb
```

3. Install the [GitHub Actions Runner script](https://github.com/organizations/candwberry/settings/actions/runners). <- Click this link. Then `New Runner` > `Self-Hosted` > `Linux x64`, and follow those instructions. I'll give you them here, but you will need to get the private token from the GitHub page.

**GitHub Action Download**
```bash
# Create a folder
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.319.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-x64-2.319.1.tar.gz

# Optional: Validate the hash
echo "3f6efb7488a183e291fc2c62876e14c9ee732864173734facc85a1bfb1744464  actions-runner-linux-x64-2.319.1.tar.gz" | shasum -a 256 -c

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.319.1.tar.gz
```

**GitHub Action Configuration**
```bash
# Create the runner and start the configuration experience
./config.sh --url https://github.com/candwberry --token {FIND THE PRIVATE TOKEN ON THAT PAGE}

# Last step, run it!
./run.sh
```

4. Open a new terminal window at ~, and clone the git repository, change directory into the repository, create the database files, and create the .env file.
```bash
cd ~
git clone https://www.github.com/candwberry/scrapi.git
cd scrapi
touch mydb.sqlite
touch mydb.sqlite-wal
touch mydb.sqlite-shm
nano .env
```

5. Then to leave the text editor, type `CTRL+X`, then `ENTER`. And finally, run the auto-updater.
```bash
bun runner.ts
```

**and that's it!**

### For Production (for C&W Berry Ltd IT staff on Windows)
1. Install [Ubuntu](https://www.microsoft.com/store/productId/9PDXGNCFSCZV?ocid=pdpshare) from the Windows Store
2. Launch it, and call the user `scrapi`. (You can call it anything but I will have to change settings if you do)
3. Create our database files.
```bash 
touch mydb.sqlite
touch mydb.sqlite-wal
touch mydb.sqlite-shm
```
4. Install [Docker](https://docs.docker.com/engine/install/ubuntu/) on the Ubuntu terminal, using these commands:

**Docker Download**
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin 
docker-compose-plugin

# Verify Docker works (You should see 'Hello from Docker!')
sudo docker run hello-world
```

**Docker Permissions** 
```bash
sudo usermod -aG docker $USER
newgrp docker
```

5. Now install the [GitHub Actions Runner script](https://github.com/organizations/candwberry/settings/actions/runners). <- Click this link. Then `New Runner` > `Self-Hosted` > `Linux x64`, and follow those instructions. I'll give you them here, but you will need to get the private token from the GitHub page.

**GitHub Action Download**
```bash
# Create a folder
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.319.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-x64-2.319.1.tar.gz

# Optional: Validate the hash
echo "3f6efb7488a183e291fc2c62876e14c9ee732864173734facc85a1bfb1744464  actions-runner-linux-x64-2.319.1.tar.gz" | shasum -a 256 -c

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.319.1.tar.gz
```

**GitHub Action Configuration**
```bash
# Create the runner and start the configuration experience
./config.sh --url https://github.com/candwberry --token {FIND THE PRIVATE TOKEN ON THAT PAGE}

# Last step, run it!
./run.sh
```

**That is the setup completed.**
Now, whenever someone pushes to main branch, the application will automatically be built and deployed. To set it up for the first time now our action runner is installed, go to the [Scrapi repository](https://github.com/candwberry). You should see this:
![Scrapi Repo Page](https://github.com/user-attachments/assets/1b4af854-689b-4ff8-b1f8-5164b6d16da9)

Click that `tick`, click `See Details`, then `Re-run all jobs` to set-off the initial build. Follow these steps also, should the server ever go down or the application crash. 

6. Oh and don't forget to install and run [Express VPN](https://www.expressvpn.com/vpn-download/vpn-windows) on Windows, this way you can use the GUI and things will be easier.
**:)**

## For Development
1. Ensure you have **bun** and **git** installed
2. Clone the repository: `git clone https://www.github.com/candwberry/scrapi`
3. Change directory: `cd scrapi`
4. Install dependencies: `bun install`
5. Create the `mydb.sqlite` file, otherwise the database will not persist between runs
6. Run the development server: `bun --bun run dev`. The `--bun` flag makes sure the `bun` runtime is used, and so `bun:sqlite` exists
7. Go to [localhost](http://localhost) to view the project
