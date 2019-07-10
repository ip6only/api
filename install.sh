#!/bin/sh

export DEBIAN_FRONTEND=noninteractive

printf 'Setting Cloudflare DNS... '
printf 'nameserver 2606:4700:4700::1111\nnameserver 2606:4700:4700::1001' > /etc/resolve.conf
printf 'Done!\n'

printf 'Removing IPv4 default route... '
cat <<EOF > /etc/rc.local
#!/bin/sh
# remove IPv4 default route
sleep 1
interface=\$(ifconfig | sed -En 's/^(e[[:alnum:]]+):.+$/\1/p')
gateway=\$(route -4n | sed -En 's/^0\.0\.0\.0[[:space:]]+(10\.[0-9]+\.[0-9]+\.[0-9]+).+/\1/p')
route add -net 10.0.0.0 netmask 255.0.0.0 gw \$gateway dev \$interface
route delete default dev \$interface
exit 0
EOF
chmod +x /etc/rc.local
/etc/rc.local >/dev/null 2>&1
printf 'Done!\n'

printf 'Updating packages... '
apt update >/dev/null 2>&1
apt dist-upgrade -y >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing basic sysadmin tools... '
apt install -y curl dnsutils inetutils-traceroute inetutils-ping nano vim wget >/dev/null 2>&1
printf 'Done!\n'

printf 'Setting up nodesource repo... '
curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - >/dev/null 2>&1
echo 'deb https://deb.nodesource.com/node_12.x bionic main' > /etc/apt/sources.list.d/nodesource.list
apt update >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing packages... '
echo iptables-persistent iptables-persistent/autosave_v4 boolean false | debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean false | debconf-set-selections
apt install -y git iptables iptables-persistent nginx nodejs squid >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing Chrome dependencies... '
apt install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget >/dev/null 2>&1
printf 'Done!\n'

printf 'Configuring firewall... '
cat <<EOF > /etc/iptables/rules.v6
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [696:87186]
-A INPUT -i lo -j ACCEPT
-A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A INPUT -p ipv6-icmp -j ACCEPT
-A INPUT -s 2a02:8010:6452::/48 -j ACCEPT
COMMIT
EOF
netfilter-persistent reload >/dev/null 2>&1
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
