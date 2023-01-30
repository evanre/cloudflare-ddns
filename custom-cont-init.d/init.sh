#!/usr/bin/with-contenv bash
# Alpine Linux starting script

echo "**** install build packages ****" && \
apk add --no-cache --upgrade \
  nodejs \
  npm \

echo "**** install node_modules ****" && \
cd /config || exit && \
npm i && \

# Run DNS updater every 10 minutes
printf '*/15\t*\t*\t*\t*\t/usr/bin/node /config/index.js\n' > /config/crontabs/root

echo '**** custom init finished ****'