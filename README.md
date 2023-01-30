# Node.JS CloudFlare DNS record updater for dynamic IP addresses

This is a simple script that updates a CloudFlare DNS record with your current IP address. It is intended to be run periodically from a cron job.

## Installation
I run it in a Docker container, but you can run it however you like.

### Docker
1. Clone this repository
2. Cope .env.example to .env and fill in the values
3. Run `docker compose up -d`