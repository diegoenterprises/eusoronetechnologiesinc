#!/bin/bash
# EUSOTRIP Load Testing Runner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_DIR="$SCRIPT_DIR/k6"
RESULTS_DIR="$SCRIPT_DIR/results/$(date +%Y%m%d_%H%M%S)"
BASE_URL="${BASE_URL:-http://localhost:3007}"

mkdir -p "$RESULTS_DIR"

echo "=================================================="
echo "EUSOTRIP Load Testing Suite"
echo "Base URL: $BASE_URL"
echo "Results: $RESULTS_DIR"
echo "=================================================="

case "${1:-smoke}" in
  smoke)
    echo "Running Smoke Test (10 users, 1 min)..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/smoke.js" \
      --out json="$RESULTS_DIR/smoke.json"
    ;;
  1k)
    echo "Running 1K User Load Test..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/load-1k.js" \
      --out json="$RESULTS_DIR/load-1k.json"
    ;;
  10k)
    echo "Running 10K User Load Test..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/load-10k.js" \
      --out json="$RESULTS_DIR/load-10k.json"
    ;;
  100k)
    echo "Running 100K User Load Test..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/load-100k.js" \
      --out json="$RESULTS_DIR/load-100k.json"
    ;;
  stress)
    echo "Running Stress Test (find breaking point)..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/stress.js" \
      --out json="$RESULTS_DIR/stress.json"
    ;;
  spike)
    echo "Running Spike Test..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/spike.js" \
      --out json="$RESULTS_DIR/spike.json"
    ;;
  soak)
    echo "Running Soak Test (24hr)..."
    k6 run -e BASE_URL="$BASE_URL" "$K6_DIR/scenarios/soak.js" \
      --out json="$RESULTS_DIR/soak.json"
    ;;
  all)
    echo "Running All Tests..."
    $0 smoke && $0 1k && $0 10k
    ;;
  *)
    echo "Usage: $0 {smoke|1k|10k|100k|stress|spike|soak|all}"
    exit 1
    ;;
esac

echo ""
echo "Test complete! Results saved to: $RESULTS_DIR"
