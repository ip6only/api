#!/bin/sh

export DEBIAN_FRONTEND=noninteractive

printf 'Condensing annoying motd... ';
chmod -x /etc/update-motd.d/50-motd-news
chmod -x /etc/update-motd.d/50-scw
chmod -x /etc/update-motd.d/60-unminimize
printf 'Done!\n'

printf 'Setting Cloudflare DNS... '
printf '[Resolve]\nDNS=2606:4700:4700::1111' > /etc/systemd/resolved.conf
service systemd-resolved restart
printf 'Done!\n'

if test -e /etc/apt/sources.list.d/scaleway*; then
	printf 'Removing scaleway repository... '
	rm /etc/apt/sources.list.d/scaleway*
	printf 'Done!\n'
fi

printf 'Removing cloud-init... '
apt purge -y cloud-init >/dev/null 2>&1
apt autoremove --purge -y >/dev/null 2>&1
printf 'Done!\n'

printf 'Updating packages... '
apt update >/dev/null 2>&1
apt dist-upgrade -y >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing basic sysadmin tools... '
apt install -y curl inetutils-traceroute inetutils-ping nano vim wget >/dev/null 2>&1
printf 'Done!\n'

printf 'Setting up nodesource repo... '
curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - >/dev/null 2>&1
echo 'deb https://deb.nodesource.com/node_12.x bionic main' > /etc/apt/sources.list.d/nodesource.list
apt update >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing packages... '
apt install -y git nginx nodejs squid ufw >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing Chrome dependencies... '
apt install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget >/dev/null 2>&1
printf 'Done!\n'

printf 'Configuring firewall... '
ufw default allow outgoing >/dev/null 2>&1
ufw default deny incoming >/dev/null 2>&1
ufw allow 22 >/dev/null 2>&1
ufw allow 80 >/dev/null 2>&1
ufw allow 443 >/dev/null 2>&1
ufw allow from 2a02:8010:6452::/48 >/dev/null 2>&1
ufw --force enable >/dev/null 2>&1
printf 'Done!\n'

printf 'Configuring squid... '
sed -i '1s/^/http_port 8080\nvisible_hostname proxy.localhost\n\n/' /etc/squid/squid.conf
printf '::1\t\tproxy.localhost\n' >> /etc/hosts
systemctl restart squid
printf 'Done!\n'

printf 'Installing pm2 via npm... '
printf 'proxy=http://proxy.localhost:8080/\nhttps-proxy=http://proxy.localhost:8080\n' > /root/.npmrc
npm install --silent --no-progress --global pm2@latest >/dev/null 2>&1
printf 'Done!\n'

printf 'Creating ip6only user... '
mkdir /home/ip6only
useradd -s /bin/bash ip6only
chown -R ip6only:ip6only /home/ip6only
printf 'Done!\n'

printf 'Setting npm proxies for ip6only user... '
printf 'proxy=http://proxy.localhost:8080/\nhttps-proxy=http://proxy.localhost:8080\n' > /home/ip6only/.npmrc
chown ip6only:ip6only /home/ip6only/.npmrc
printf 'Done!\n'
