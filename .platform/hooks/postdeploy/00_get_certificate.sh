#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh
sudo certbot -n -d aquatrack.is404.net --nginx --agree-tos --email john.everett32@gmail.com