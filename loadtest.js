import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },   // ramp up to 50 users
    { duration: '30s', target: 50 },   // hold at 50 users
    { duration: '10s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // less than 1% errors
  },
};

const API_KEY = '317f13e11b42980f532df91683a237c30c8d61d1e44ab85eb0941d5d1b6f3bad';

export default function () {
  const res = http.post(
    'http://localhost:5000/events',
    JSON.stringify({
      event_type: 'payment.success',
      payload: { order_id: `order-${Date.now()}`, amount: 500 }
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      }
    }
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1);
}