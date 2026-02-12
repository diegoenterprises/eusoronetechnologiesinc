import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
// vite is imported dynamically below — only needed in dev mode
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

  // Cookie parser — required for session cookie auth (app_session_id)
  app.use(cookieParser());

  // =========================================================================
  // STRIPE WEBHOOK (must be before JSON body parser — needs raw body)
  // =========================================================================
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const { stripe } = await import("../stripe/service");
      let event;

      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // In test mode without webhook secret, parse directly
        event = JSON.parse(req.body.toString());
        console.warn("[Stripe Webhook] No webhook secret configured — accepting unverified event");
      }

      console.log(`[Stripe Webhook] ${event.type}`);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          console.log(`[Stripe Webhook] Checkout completed: ${session.id}, payment: ${session.payment_status}`);
          // Record payment in database
          const { getDb } = await import("../db");
          const db = await getDb();
          if (db && session.metadata?.loadId) {
            try {
              await db.execute(
                `INSERT INTO payments (payer_id, amount, currency, payment_type, status, stripe_payment_id, load_id, created_at)
                 VALUES (${session.metadata.userId || 0}, '${(session.amount_total || 0) / 100}', '${session.currency || "usd"}', 
                         '${session.metadata.paymentType || "load_payment"}', 'succeeded', '${session.payment_intent || session.id}', 
                         ${session.metadata.loadId}, NOW())`
              );
            } catch (e) {
              console.error("[Stripe Webhook] DB insert error:", e);
            }
          }
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object;
          console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          console.error(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`);
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          console.log(`[Stripe Webhook] Subscription ${event.type}: ${subscription.id}, status: ${subscription.status}`);
          break;
        }
        case "account.updated": {
          // Stripe Connect account updated
          const account = event.data.object;
          console.log(`[Stripe Webhook] Connect account updated: ${account.id}, charges_enabled: ${account.charges_enabled}`);
          break;
        }
        case "transfer.created": {
          const transfer = event.data.object;
          console.log(`[Stripe Webhook] Transfer created: ${transfer.id}, amount: ${transfer.amount}`);
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error(`[Stripe Webhook] Error: ${err.message}`);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  });

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

  // Direct binary file endpoint (bypasses tRPC JSON serialization for large files)
  app.get("/api/documents/:id/file", async (req, res) => {
    try {
      const { authService } = await import("./auth");
      const user = await authService.authenticateRequest(req);
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
      const { getDb } = await import("../db");
      const { documents } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }
      const numericId = parseInt(req.params.id.replace(/\D/g, ""), 10);
      if (!numericId) { res.status(400).json({ error: "Invalid ID" }); return; }
      const userId = typeof user.id === "string" ? parseInt(user.id, 10) || 0 : user.id;
      const [doc] = await db.select().from(documents).where(and(eq(documents.id, numericId), eq(documents.userId, userId))).limit(1);
      if (!doc || !doc.fileUrl?.startsWith("data:")) { res.status(404).json({ error: "Not found" }); return; }
      const match = doc.fileUrl.match(/^data:(.*?);base64,([\s\S]*)$/);
      if (!match) { res.status(500).json({ error: "Invalid file data" }); return; }
      const mime = match[1];
      const buffer = Buffer.from(match[2], "base64");
      const isDownload = req.query.download === "true";
      const ext: Record<string, string> = { "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg", "image/gif": ".gif", "application/msword": ".doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx" };
      const fileName = (doc.name || "document") + (doc.name?.includes(".") ? "" : (ext[mime] || ""));
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Length", buffer.length);
      if (isDownload) {
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      } else {
        res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      }
      res.send(buffer);
    } catch (err: any) {
      console.error("[Documents] file endpoint error:", err?.message);
      res.status(500).json({ error: "Server error" });
    }
  });

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
    // Variable import path prevents esbuild from bundling vite.ts (and its vite/tailwind deps)
    const vitePath = "./vite";
    const { setupVite } = await import(/* @vite-ignore */ vitePath);
    await setupVite(app, server);
  } else {
    // Inline serveStatic to avoid importing vite.ts (which depends on the vite package)
    const distPath = path.resolve(import.meta.dirname, "public");
    if (!fs.existsSync(distPath)) {
      console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  // In production (Azure), bind directly to PORT — skip availability check for fast startup
  const port = process.env.NODE_ENV === "production"
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Graceful shutdown: close DB pool + HTTP server on process exit
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Shutdown] ${signal} received. Closing connections...`);
    try {
      const { closeDb } = await import("../db");
      await closeDb();
    } catch {}
    server.close(() => {
      console.log("[Shutdown] Server closed cleanly");
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => { process.exit(1); }, 10000);
  };
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[SECURITY] TLS 1.3 enforcement: ${process.env.NODE_ENV === "production" ? "ACTIVE" : "DEV_MODE (handled by Azure in prod)"}`);
    console.log(`[SECURITY] AES-256-GCM encryption: ${encryptionOk ? "ACTIVE" : "FAILED"}`);
    console.log(`[SECURITY] RBAC role-based access: ACTIVE`);
    console.log(`[SECURITY] SOC 2 audit logging: ACTIVE`);
    console.log(`[SECURITY] PCI-DSS card data guard: ACTIVE`);
    console.log(`[SECURITY] Security headers (HSTS, CSP, XSS, Frame): ACTIVE`);

    // Defer RSS pre-warm until after server is listening (so health probe succeeds)
    setTimeout(async () => {
      try {
        const { preWarmCache } = await import("../services/rssService");
        preWarmCache();
      } catch {}
    }, 5000);

    // Start weekly mission generator scheduler
    setTimeout(async () => {
      try {
        const { startMissionScheduler } = await import("../services/missionGenerator");
        startMissionScheduler();
      } catch (err) {
        console.error("[MissionGenerator] Failed to start:", err);
      }
    }, 8000);
  });
}

startServer().catch(console.error);
