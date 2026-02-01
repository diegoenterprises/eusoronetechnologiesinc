/**
 * EUSOTRIP Load Testing - 1,000 Users
 * Tier 1: Startup Phase Load Test
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const successfulRequests = new Counter('successful_requests');

export const options = {
  scenarios: {
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 250 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '10m', target: 1000 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<300', 'p(99)<500'],
    'http_req_failed': ['rate<0.001'],
    'errors': ['rate<0.001'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3007';

const USER_ACTIONS = [
  { name: 'view_dashboard', endpoint: '/api/trpc/dashboard.getStats', weight: 15 },
  { name: 'search_loads', endpoint: '/api/trpc/loads.list', weight: 20 },
  { name: 'view_wallet', endpoint: '/api/trpc/wallet.getBalance', weight: 10 },
  { name: 'check_messages', endpoint: '/api/trpc/messages.list', weight: 10 },
  { name: 'view_notifications', endpoint: '/api/trpc/notifications.list', weight: 15 },
  { name: 'view_gamification', endpoint: '/api/trpc/gamification.getStats', weight: 5 },
  { name: 'view_compliance', endpoint: '/api/trpc/compliance.getDashboardStats', weight: 5 },
];

function selectAction() {
  const totalWeight = USER_ACTIONS.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;
  for (const action of USER_ACTIONS) {
    random -= action.weight;
    if (random <= 0) return action;
  }
  return USER_ACTIONS[0];
}

export default function () {
  group('User Session', function () {
    // Simulate user actions
    for (let i = 0; i < 5; i++) {
      const action = selectAction();
      
      const res = http.get(`${BASE_URL}${action.endpoint}`);
      
      const success = check(res, {
        [`${action.name} successful`]: (r) => r.status === 200 || r.status === 401,
        [`${action.name} fast`]: (r) => r.timings.duration < 500,
      });
      
      if (success) {
        successfulRequests.add(1);
      } else {
        errorRate.add(1);
      }
      
      apiLatency.add(res.timings.duration);
      
      sleep(Math.random() * 3 + 1);
    }
  });
}

export function handleSummary(data) {
  return {
    'load-testing/results/load-1k-summary.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  return `
=== EUSOTRIP 1K User Load Test Results ===
Duration: ${data.state.testRunDurationMs / 1000}s
Total Requests: ${metrics.http_reqs?.values?.count || 0}
Success Rate: ${((1 - (metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(2)}%
P95 Latency: ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms
P99 Latency: ${metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0}ms
Error Rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(4)}%
`;
}
