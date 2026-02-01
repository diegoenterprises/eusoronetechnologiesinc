#!/bin/bash
# EusoTrip Platform - Start Server Script

set -e

APP_DIR="/var/www/eusotrip"
LOG_DIR="/var/log/eusotrip"

mkdir -p $LOG_DIR

cd $APP_DIR

# Install production dependencies
npm install -g pnpm
pnpm install --prod --frozen-lockfile

# Start application with PM2
if command -v pm2 &> /dev/null; then
    pm2 delete eusotrip 2>/dev/null || true
    pm2 start dist/index.js --name eusotrip --log $LOG_DIR/app.log
    pm2 save
else
    # Fallback to direct node start
    nohup node dist/index.js > $LOG_DIR/app.log 2>&1 &
    echo $! > /var/run/eusotrip.pid
fi

echo "EusoTrip server started successfully"
