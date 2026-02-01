#!/bin/bash
# EusoTrip Platform - Stop Server Script

set -e

if command -v pm2 &> /dev/null; then
    pm2 stop eusotrip 2>/dev/null || true
    pm2 delete eusotrip 2>/dev/null || true
else
    if [ -f /var/run/eusotrip.pid ]; then
        kill $(cat /var/run/eusotrip.pid) 2>/dev/null || true
        rm -f /var/run/eusotrip.pid
    fi
fi

echo "EusoTrip server stopped"
