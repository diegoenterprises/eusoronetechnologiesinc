/**
 * EUSOTRIP Load Testing - Smoke Test
 * Quick validation with 10 virtual users
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3007';

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Dashboard endpoint
  const dashRes = http.get(`${BASE_URL}/api/trpc/dashboard.getStats`);
  check(dashRes, {
    'dashboard returns data': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);

  // Loads endpoint
  const loadsRes = http.get(`${BASE_URL}/api/trpc/loads.list`);
  check(loadsRes, {
    'loads returns data': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
