# Update package list and upgrade packages.
sudo apt update
sudo apt upgrade

# You will need to download ExpressVPN, instructions here: https://www.expressvpn.com/setup#linux
# Then a file with the name "expressvpn_x.xx.x.x-x_armhf.deb" will be added to your Downloads folder (where x.xx.x.x is the version number).

cd Downloads
sudo dpkg -i expressvpn_x.xx.x.x-x_armhf.deb
expressvpn activate # Enter the code on the prompt
expressvpn preferences set block_all true # (ads, adult sites etc)
expressvpn connect 

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Docker
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/raspbian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Set up Docker's APT repository:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/raspbian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo docker run hello-world


# GitHub Actions Setup
cd ~
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-arm-2.317.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-arm-2.317.0.tar.gz
echo "8a767b09300472bbac8e1c27c9b2a1460640206d03ca469efd4ce1d49333a5a3  actions-runner-linux-arm-2.317.0.tar.gz" | shasum -a 256 -c
tar xzf ./actions-runner-linux-arm-2.317.0.tar.gz

./config.sh --url https://github.com/candwberry --token AZTBMBZXFAECWTOO7GKNGATGTZIBE
./run.sh &

#ffs default oven:bun image is ONLY arm64.. WHY! i cannot figure out for the life of me how to build my own.