#!/usr/bin/with-contenv bash

# Install build packages
apk add --no-cache --upgrade \
  nodejs \
  npm \

# Clone and install modules
cd /config || exit && \
npm i && \

# Run DNS updater every 15 minutes
printf '*/15\t*\t*\t*\t*\t/usr/bin/node /config/index.js\n' > /config/crontabs/root && \

echo '**** custom init finished ****'