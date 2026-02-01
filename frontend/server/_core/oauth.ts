import type { Express } from "express";

// OAuth routes are no longer needed - using standalone auth
// This file is kept for backwards compatibility but routes are disabled
export function registerOAuthRoutes(app: Express) {
  // No external OAuth routes - using internal auth system
  // Login is handled via /login page and trpc.auth.login mutation
}
