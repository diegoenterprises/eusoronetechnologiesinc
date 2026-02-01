#!/bin/bash
# EusoTrip Platform - Before Install Script

set -e

APP_DIR="/var/www/eusotrip"

# Stop existing application
if [ -f /var/run/eusotrip.pid ]; then
    kill $(cat /var/run/eusotrip.pid) 2>/dev/null || true
    rm -f /var/run/eusotrip.pid
fi

# Clean up old deployment
rm -rf $APP_DIR/*

echo "Pre-installation cleanup completed"
