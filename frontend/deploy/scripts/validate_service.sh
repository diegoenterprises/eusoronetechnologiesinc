#!/bin/bash
# EusoTrip Platform - Validate Service Script

set -e

MAX_RETRIES=30
RETRY_INTERVAL=2
HEALTH_URL="http://localhost:3000/api/health"

echo "Validating EusoTrip service..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf $HEALTH_URL > /dev/null 2>&1; then
        echo "Service is healthy!"
        exit 0
    fi
    echo "Waiting for service... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

echo "Service validation failed!"
exit 1
