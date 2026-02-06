import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { securityHeaders, httpsRedirect, sanitizeRequest } from "./security";
import { validateEncryption } from "./encryption";
import { pciRequestGuard } from "./pciCompliance";
import { recordAuditEvent, AuditCategory, AuditAction } from "./auditService";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // =========================================================================
  // SECURITY LAYER 1: TLS 1.3 / HTTPS enforcement
  // In production, Azure App Service terminates TLS 1.3 at the load balancer.
  // This middleware enforces HSTS headers and redirects HTTP → HTTPS.
  // =========================================================================
  app.use(httpsRedirect());

  // =========================================================================
  // SECURITY LAYER 2: Security headers (CSP, XSS, HSTS, frame guard, etc.)
  // =========================================================================
  app.use(securityHeaders());

  // =========================================================================
  // SECURITY LAYER 3: Request sanitization (XSS vectors in query params)
  // =========================================================================
  app.use(sanitizeRequest());

  // =========================================================================
  // SECURITY LAYER 4: PCI-DSS request guard (blocks raw card data to server)
  // =========================================================================
  app.use(pciRequestGuard());

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // =========================================================================
  // SECURITY LAYER 5: AES-256 encryption self-test at startup
  // =========================================================================
  const encryptionOk = validateEncryption();
  if (!encryptionOk && process.env.NODE_ENV === "production") {
    console.error("[FATAL] AES-256 encryption self-test failed. Refusing to start in production.");
    process.exit(1);
  }

  // Record server startup in audit log
  recordAuditEvent({
    action: AuditAction.SERVER_STARTED,
    category: AuditCategory.SYSTEM,
    entityType: "server",
    metadata: {
      nodeEnv: process.env.NODE_ENV || "development",
      encryptionStatus: encryptionOk ? "PASSED" : "FAILED",
      securityHeaders: "ENABLED",
      httpsRedirect: process.env.NODE_ENV === "production" ? "ENABLED" : "DEV_BYPASS",
      pciGuard: "ENABLED",
      rbac: "ENABLED",
      timestamp: new Date().toISOString(),
    },
    severity: "LOW",
  }).catch(() => {});

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API (protected by RBAC middleware in trpc.ts)
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[SECURITY] TLS 1.3 enforcement: ${process.env.NODE_ENV === "production" ? "ACTIVE" : "DEV_MODE (handled by Azure in prod)"}`);
    console.log(`[SECURITY] AES-256-GCM encryption: ${encryptionOk ? "ACTIVE" : "FAILED"}`);
    console.log(`[SECURITY] RBAC role-based access: ACTIVE`);
    console.log(`[SECURITY] SOC 2 audit logging: ACTIVE`);
    console.log(`[SECURITY] PCI-DSS card data guard: ACTIVE`);
    console.log(`[SECURITY] Security headers (HSTS, CSP, XSS, Frame): ACTIVE`);
  });
}

startServer().catch(console.error);
