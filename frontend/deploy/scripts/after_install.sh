#!/bin/bash
# EusoTrip Platform - After Install Script

set -e

APP_DIR="/var/www/eusotrip"

cd $APP_DIR

# Set correct permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

echo "Post-installation setup completed"
