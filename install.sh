##!/bin/sh

export DEBIAN_FRONTEND=noninteractive

# NOTE: change the below as required
printf 'Setting /etc/network/interfaces... '
cat <<EOF > /etc/network/interfaces
auto eth0
allow-hotplug eth0
iface eth0 inet dhcp
    post-up /sbin/route delete default gw 192.168.6.1 eth0
iface eth0 inet6 auto
    pre-up /sbin/ip token set ::6a00 dev eth0
EOF
printf 'Done!\n'

printf 'Setting custom config.txt parameters... '
cat <<EOF >> /boot/config.txt
dtoverlay=pi3-disable-wifi
dtoverlay=pi3-disable-bt
dtparam=poe_fan_temp0=65000,poe_fan_temp0_hyst=10000,poe_fan_temp1=70000
EOF
printf 'Done!\n'

printf 'Setting CleanBrowsing DNS... '
printf 'nameserver 2a0d:2a00:1::1\nnameserver 2a0d:2a00:2::1' > /etc/resolve.conf
chmod -w /etc/resolv.conf
printf 'Done!\n'

printf 'Setting apt mirror... '
printf 'deb http://mirrorservice.org/sites/archive.raspbian.org/raspbian/ buster main contrib non-free rpi' > /etc/apt/sources.list
printf 'Done!\n'

printf 'Updating packages... '
apt update >/dev/null 2>&1
apt upgrade -y >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing basic sysadmin tools... '
apt install -y curl dnsutils inetutils-traceroute inetutils-ping nano vim wget >/dev/null 2>&1
printf 'Done!\n'

printf 'Setting up nodesource repo... '
curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - >/dev/null 2>&1
echo 'deb https://deb.nodesource.com/node_12.x buster main' > /etc/apt/sources.list.d/nodesource.list
apt update >/dev/null 2>&1
printf 'Done!\n'

printf 'Installing packages... '
echo iptables-persistent iptables-persistent/autosave_v4 boolean false | debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean false | debconf-set-selections
apt install -y chromium-browser git iptables iptables-persistent nginx nodejs squid >/dev/null 2>&1
printf 'Done!\n'

printf 'Configuring firewall... '
cat <<EOF > /etc/iptables/rules.v6
*filter
:INPUT DROP [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -i lo -j ACCEPT
-A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A INPUT -p ipv6-icmp -j ACCEPT
-A INPUT -s 2a02:8010:6452::/48 -j ACCEPT
-A INPUT -p tcp -m tcp --dport 80 -j ACCEPT
-A INPUT -p tcp -m tcp --dport 443 -j ACCEPT
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

printf 'Setup complete! The system will now reboot to apply the configuration changes...\n'
reboot
