#!/usr/bin/env node
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;

const JWT_SECRET = "eusotrip-dev-secret-key";
const COOKIE_NAME = "eusotrip_session";
const MASTER_PASSWORD = "Vision2026!";

const TEST_USERS = {
  "diego": { id: "admin-diego", email: "diego@eusotrip.com", role: "SUPER_ADMIN", name: "Diego" },
  "diego@eusotrip.com": { id: "admin-diego", email: "diego@eusotrip.com", role: "SUPER_ADMIN", name: "Diego" },
  "shipper@eusotrip.com": { id: "shipper-1", email: "shipper@eusotrip.com", role: "SHIPPER", name: "Test Shipper" },
  "carrier@eusotrip.com": { id: "carrier-1", email: "carrier@eusotrip.com", role: "CARRIER", name: "Test Carrier" },
  "broker@eusotrip.com": { id: "broker-1", email: "broker@eusotrip.com", role: "BROKER", name: "Test Broker" },
  "driver@eusotrip.com": { id: "driver-1", email: "driver@eusotrip.com", role: "DRIVER", name: "Test Driver" },
  "admin@eusotrip.com": { id: "admin-1", email: "admin@eusotrip.com", role: "ADMIN", name: "Test Admin" },
};

app.use(express.json());

// Simple cookie parser middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) req.cookies[name] = value;
    });
  }
  next();
});

// tRPC-style response helper
const trpcResponse = (data, isBatch = false) => {
  const response = { result: { data: { json: data } } };
  return isBatch ? [response] : response;
};

// Auth endpoints
app.get('/api/trpc/auth.me', (req, res) => {
  const isBatch = req.query.batch === '1';
  const token = req.cookies[COOKIE_NAME];
  
  if (!token) {
    return res.json(trpcResponse(null, isBatch));
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = { id: payload.userId, email: payload.email, role: payload.role, name: payload.name };
    res.json(trpcResponse(user, isBatch));
  } catch {
    res.json(trpcResponse(null, isBatch));
  }
});

app.post('/api/trpc/auth.login', (req, res) => {
  const isBatch = req.query.batch === '1' || req.body['0'];
  const jsonData = req.body['0']?.json || req.body.json || {};
  const email = (jsonData.email || '').toLowerCase();
  const password = jsonData.password;
  
  const user = TEST_USERS[email];
  if (!user || password !== MASTER_PASSWORD) {
    return res.status(400).json(trpcResponse({ error: "Invalid credentials" }, isBatch));
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  
  res.json(trpcResponse({ success: true, user }, isBatch));
});

app.post('/api/trpc/auth.logout', (req, res) => {
  const isBatch = req.query.batch === '1';
  res.clearCookie(COOKIE_NAME);
  res.json(trpcResponse({ success: true }, isBatch));
});

// List endpoints - return empty arrays
app.all('/api/trpc/loads.*', (req, res) => {
  const isBatch = req.query.batch === '1' || (req.body && req.body['0']);
  res.json(trpcResponse([], isBatch));
});

app.all('/api/trpc/payments.*', (req, res) => {
  const isBatch = req.query.batch === '1' || (req.body && req.body['0']);
  res.json(trpcResponse([], isBatch));
});

// Catch-all for other API routes
app.all('/api/trpc/*', (req, res) => {
  const isBatch = req.query.batch === '1' || (req.body && req.body['0']);
  res.json(trpcResponse({}, isBatch));
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log('Login: Diego / Vision2026!');
  console.log('='.repeat(50));
});
