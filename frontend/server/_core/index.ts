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
import { apiRateLimiter, authRateLimiter } from "./rateLimiting";

// FMCSA risk level calculator for AccessValidation carrier safety
function getRiskLevel(cached: any): "low" | "moderate" | "elevated" | "high" | "unknown" {
  const scores = [
    cached.unsafeDrivingScore, cached.hosComplianceScore, cached.driverFitnessScore,
    cached.controlledSubstancesScore, cached.vehicleMaintenanceScore,
    cached.hazmatComplianceScore, cached.crashIndicatorScore,
  ].filter(Boolean).map(Number);
  if (scores.length === 0) return "unknown";
  const max = Math.max(...scores);
  if (max >= 80) return "high";
  if (max >= 60) return "elevated";
  if (max >= 40) return "moderate";
  return "low";
}

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
  // SOCKET.IO — Real-time state change broadcasting (attaches to HTTP server)
  // =========================================================================
  const { initializeSocketIO } = await import("../services/socketService");
  initializeSocketIO(server);

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

  // =========================================================================
  // SECURITY LAYER 5: Rate limiting (DDoS / brute-force protection)
  // =========================================================================
  app.use("/api/trpc", apiRateLimiter);
  app.use("/api/auth", authRateLimiter);

  // =========================================================================
  // DOMAIN REDIRECT: eusorone.com → eusotrip.com (301 permanent)
  // =========================================================================
  app.use((req, res, next) => {
    const host = (req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
    if (host === "eusorone.com" || host === "www.eusorone.com") {
      return res.redirect(301, `https://eusotrip.com${req.originalUrl}`);
    }
    next();
  });

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

      // ── Wallet balance helpers ──
      const { getDb: _getDb } = await import("../db");
      const { wallets: _walletsT, walletTransactions: _wtT, users: _usersT } = await import("../../drizzle/schema");
      const { eq: _eq, sql: _sql } = await import("drizzle-orm");

      /** Credit a wallet by stripeConnectId — adds to availableBalance & totalReceived, records transaction */
      const creditWalletByConnect = async (connectId: string, amountCents: number, desc: string, stripeId: string, type: "earnings" | "deposit" | "bonus" = "earnings") => {
        const _db = await _getDb();
        if (!_db || !connectId || amountCents <= 0) return;
        const amt = (amountCents / 100).toFixed(2);
        const [wallet] = await _db.select().from(_walletsT).where(_eq(_walletsT.stripeConnectId, connectId)).limit(1);
        if (!wallet) { console.warn(`[Wallet] No wallet for Connect ${connectId}`); return; }
        await _db.execute(_sql`UPDATE wallets SET availableBalance = availableBalance + ${amt}, totalReceived = totalReceived + ${amt} WHERE id = ${wallet.id}`);
        await _db.insert(_wtT).values({ walletId: wallet.id, type, amount: amt, fee: "0", netAmount: amt, currency: "USD", status: "completed", description: desc, stripeTransferId: stripeId, completedAt: new Date() });
        console.log(`[Wallet] Credited $${amt} to wallet ${wallet.id} (${connectId})`);
      };

      /** Credit a wallet by userId */
      const creditWalletByUser = async (userId: number, amountCents: number, desc: string, stripeId: string, type: "earnings" | "deposit" | "bonus" = "earnings", loadId?: number, loadNumber?: string) => {
        const _db = await _getDb();
        if (!_db || !userId || amountCents <= 0) return;
        const amt = (amountCents / 100).toFixed(2);
        let [wallet] = await _db.select().from(_walletsT).where(_eq(_walletsT.userId, userId)).limit(1);
        if (!wallet) {
          try { await _db.insert(_walletsT).values({ userId, availableBalance: "0", pendingBalance: "0", reservedBalance: "0", currency: "USD" }); } catch {}
          [wallet] = await _db.select().from(_walletsT).where(_eq(_walletsT.userId, userId)).limit(1);
        }
        if (!wallet) return;
        await _db.execute(_sql`UPDATE wallets SET availableBalance = availableBalance + ${amt}, totalReceived = totalReceived + ${amt} WHERE id = ${wallet.id}`);
        await _db.insert(_wtT).values({ walletId: wallet.id, type, amount: amt, fee: "0", netAmount: amt, currency: "USD", status: "completed", description: desc, stripePaymentId: stripeId, loadId: loadId || null, loadNumber: loadNumber || null, completedAt: new Date() });
        console.log(`[Wallet] Credited $${amt} to wallet ${wallet.id} (user ${userId})`);
      };

      /** Debit a wallet by stripeConnectId — subtracts from availableBalance, increases totalSpent, records payout transaction */
      const debitWalletByConnect = async (connectId: string, amountCents: number, desc: string, stripeId: string) => {
        const _db = await _getDb();
        if (!_db || !connectId || amountCents <= 0) return;
        const amt = (amountCents / 100).toFixed(2);
        const [wallet] = await _db.select().from(_walletsT).where(_eq(_walletsT.stripeConnectId, connectId)).limit(1);
        if (!wallet) return;
        await _db.execute(_sql`UPDATE wallets SET availableBalance = GREATEST(availableBalance - ${amt}, 0), totalSpent = totalSpent + ${amt}, lastWithdrawalAt = NOW() WHERE id = ${wallet.id}`);
        await _db.insert(_wtT).values({ walletId: wallet.id, type: "payout", amount: amt, fee: "0", netAmount: amt, currency: "USD", status: "completed", description: desc, stripeTransferId: stripeId, completedAt: new Date() });
        console.log(`[Wallet] Debited $${amt} from wallet ${wallet.id} (${connectId})`);
      };

      /** Reverse a failed debit — re-credit the wallet */
      const reverseDebitByConnect = async (connectId: string, amountCents: number, desc: string) => {
        const _db = await _getDb();
        if (!_db || !connectId || amountCents <= 0) return;
        const amt = (amountCents / 100).toFixed(2);
        const [wallet] = await _db.select().from(_walletsT).where(_eq(_walletsT.stripeConnectId, connectId)).limit(1);
        if (!wallet) return;
        await _db.execute(_sql`UPDATE wallets SET availableBalance = availableBalance + ${amt}, totalSpent = GREATEST(totalSpent - ${amt}, 0) WHERE id = ${wallet.id}`);
        console.log(`[Wallet] Reversed debit $${amt} on wallet ${wallet.id} (${connectId})`);
      };

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const amountCents = session.amount_total || 0;
          console.log(`[Stripe Webhook] Checkout completed: ${session.id}, payment: ${session.payment_status}, amount: $${amountCents / 100}`);
          const _db1 = await _getDb();
          if (_db1 && session.metadata?.loadId) {
            try {
              await _db1.execute(
                `INSERT INTO payments (payer_id, amount, currency, payment_type, status, stripe_payment_id, load_id, created_at)
                 VALUES (${session.metadata.userId || 0}, '${amountCents / 100}', '${session.currency || "usd"}', 
                         '${session.metadata.paymentType || "load_payment"}', 'succeeded', '${session.payment_intent || session.id}', 
                         ${session.metadata.loadId}, NOW())`
              );
            } catch (e) { console.error("[Stripe Webhook] DB insert error:", e); }
          }
          // Credit recipient wallet if metadata contains recipientUserId
          if (session.metadata?.recipientUserId && amountCents > 0) {
            try {
              await creditWalletByUser(
                Number(session.metadata.recipientUserId), amountCents,
                `Payment received — Load #${session.metadata.loadNumber || session.metadata.loadId || "N/A"}`,
                session.payment_intent || session.id, "earnings",
                session.metadata.loadId ? Number(session.metadata.loadId) : undefined,
                session.metadata.loadNumber || undefined
              );
            } catch (e) { console.warn("[Stripe Webhook] Checkout wallet credit error:", e); }
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
          // Stripe Connect account updated — sync status to wallets table + notify user
          const account = event.data.object;
          console.log(`[Stripe Webhook] Connect account updated: ${account.id}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);
          try {
            const db2 = await _getDb();
            if (db2) {
              const status = account.charges_enabled ? "active" : "pending";
              await db2.update(_walletsT).set({ stripeAccountStatus: status }).where(_eq(_walletsT.stripeConnectId, account.id));
              console.log(`[Stripe Webhook] Synced Connect status '${status}' for ${account.id}`);

              // Notify user when their account becomes fully active
              if (account.charges_enabled && account.payouts_enabled) {
                try {
                  const [connUser] = await db2.select({ id: _usersT.id }).from(_usersT).where(_eq(_usersT.stripeConnectId, account.id)).limit(1);
                  if (connUser) {
                    const { lookupAndNotify } = await import("../services/notifications");
                    try { lookupAndNotify(connUser.id, { type: "payment_received", amount: 0, loadNumber: "Stripe Connect activated" } as any); } catch {}
                    console.log(`[Stripe Webhook] Notified user ${connUser.id} — Connect account active`);
                  }
                } catch {}
              }
            }
          } catch (e) { console.warn("[Stripe Webhook] Connect sync error:", e); }
          break;
        }
        case "transfer.created": {
          // Money transferred to a connected account — credit their wallet
          const transfer = event.data.object;
          const transferAmt = transfer.amount || 0;
          console.log(`[Stripe Webhook] Transfer created: ${transfer.id}, amount: $${transferAmt / 100}, destination: ${transfer.destination}`);
          if (transfer.destination && transferAmt > 0) {
            try {
              const desc = transfer.description || `Platform transfer ${transfer.id}`;
              await creditWalletByConnect(transfer.destination, transferAmt, desc, transfer.id, "earnings");
            } catch (e) { console.warn("[Stripe Webhook] Transfer wallet credit error:", e); }
          }
          break;
        }
        case "payout.paid": {
          // Money paid out from connected account to their bank — debit wallet
          const payout = event.data.object;
          const payoutAmt = payout.amount || 0;
          const payoutAccount = payout.destination?.account || event.account || "";
          console.log(`[Stripe Webhook] Payout completed: ${payout.id}, amount: $${payoutAmt / 100}, account: ${payoutAccount}`);
          try {
            const db3 = await _getDb();
            if (db3 && payout.id) {
              await db3.execute(_sql`UPDATE wallet_transactions SET status = 'completed', completed_at = NOW() WHERE description LIKE ${'%' + payout.id + '%'} AND status = 'processing'`);
            }
          } catch (e) { console.warn("[Stripe Webhook] Payout tx sync error:", e); }
          // Debit wallet balance
          if (payoutAccount && payoutAmt > 0) {
            try { await debitWalletByConnect(payoutAccount, payoutAmt, `Bank payout — ${payout.id}`, payout.id); } catch (e) { console.warn("[Stripe Webhook] Payout wallet debit error:", e); }
          }
          break;
        }
        case "payout.failed": {
          const payout = event.data.object;
          const failedAmt = payout.amount || 0;
          const failedAccount = payout.destination?.account || event.account || "";
          console.error(`[Stripe Webhook] Payout failed: ${payout.id}, reason: ${payout.failure_message}`);
          try {
            const db4 = await _getDb();
            if (db4 && payout.id) {
              await db4.execute(_sql`UPDATE wallet_transactions SET status = 'failed' WHERE description LIKE ${'%' + payout.id + '%'} AND status = 'processing'`);
            }
          } catch (e) { console.warn("[Stripe Webhook] Payout fail sync error:", e); }
          // Reverse the debit — money stays in the connected account
          if (failedAccount && failedAmt > 0) {
            try { await reverseDebitByConnect(failedAccount, failedAmt, `Payout reversed — ${payout.id}`); } catch (e) { console.warn("[Stripe Webhook] Payout reversal error:", e); }
          }
          break;
        }
        case "issuing_card.created":
        case "issuing_card.updated": {
          const card = event.data.object;
          console.log(`[Stripe Webhook] Issuing card ${event.type}: ${card.id}, last4: ${card.last4}, status: ${card.status}`);
          break;
        }
        case "issuing_authorization.request": {
          const auth = event.data.object;
          console.log(`[Stripe Webhook] Issuing auth request: ${auth.id}, amount: $${(auth.amount || 0) / 100}, merchant: ${auth.merchant_data?.name}`);
          break;
        }
        case "financial_connections.account.created": {
          const fcAccount = event.data.object;
          console.log(`[Stripe Webhook] Financial Connections account linked: ${fcAccount.id}, institution: ${fcAccount.institution_name}`);
          break;
        }
        // Treasury events — escrow fund movements
        case "treasury.inbound_transfer.succeeded": {
          const inbound = event.data.object;
          const inboundAmt = inbound.amount || 0;
          console.log(`[Stripe Webhook] Treasury inbound transfer succeeded: ${inbound.id}, amount: $${inboundAmt / 100}, FA: ${inbound.financial_account}`);
          // Credit the wallet associated with this financial account
          if (inbound.financial_account && inboundAmt > 0) {
            try { await creditWalletByConnect(inbound.financial_account, inboundAmt, `Bank deposit — ${inbound.id}`, inbound.id, "deposit"); } catch (e) { console.warn("[Stripe Webhook] Treasury inbound wallet credit error:", e); }
          }
          break;
        }
        case "treasury.inbound_transfer.failed": {
          const inbound = event.data.object;
          console.error(`[Stripe Webhook] Treasury inbound transfer failed: ${inbound.id}, reason: ${inbound.failure_details?.code}`);
          try {
            const dbTi = await _getDb();
            if (dbTi && inbound.id) {
              await dbTi.execute(_sql`UPDATE wallet_transactions SET status = 'failed' WHERE description LIKE ${'%' + inbound.id + '%'} AND status = 'pending'`);
            }
          } catch (e) { console.warn("[Stripe Webhook] Treasury inbound fail sync error:", e); }
          break;
        }
        case "treasury.outbound_transfer.posted": {
          const outbound = event.data.object;
          const outAmt = outbound.amount || 0;
          console.log(`[Stripe Webhook] Treasury outbound transfer posted: ${outbound.id}, amount: $${outAmt / 100}`);
          try {
            const dbTo = await _getDb();
            if (dbTo && outbound.id) {
              await dbTo.execute(_sql`UPDATE wallet_transactions SET status = 'completed', completed_at = NOW() WHERE description LIKE ${'%' + outbound.id + '%'} AND status = 'pending'`);
            }
          } catch (e) { console.warn("[Stripe Webhook] Treasury outbound sync error:", e); }
          // Debit wallet — money left the platform to bank
          if (outbound.financial_account && outAmt > 0) {
            try { await debitWalletByConnect(outbound.financial_account, outAmt, `Bank withdrawal — ${outbound.id}`, outbound.id); } catch (e) { console.warn("[Stripe Webhook] Treasury outbound wallet debit error:", e); }
          }
          break;
        }
        case "treasury.outbound_transfer.failed":
        case "treasury.outbound_transfer.returned": {
          const outbound = event.data.object;
          const failAmt = outbound.amount || 0;
          console.error(`[Stripe Webhook] Treasury outbound transfer ${event.type}: ${outbound.id}, amount: $${failAmt / 100}`);
          try {
            const dbTof = await _getDb();
            if (dbTof && outbound.id) {
              await dbTof.execute(_sql`UPDATE wallet_transactions SET status = 'failed' WHERE description LIKE ${'%' + outbound.id + '%'} AND status IN ('pending', 'processing')`);
            }
          } catch (e) { console.warn("[Stripe Webhook] Treasury outbound fail sync error:", e); }
          // Reverse the debit — money stays in the account
          if (outbound.financial_account && failAmt > 0) {
            try { await reverseDebitByConnect(outbound.financial_account, failAmt, `Withdrawal reversed — ${outbound.id}`); } catch (e) { console.warn("[Stripe Webhook] Treasury outbound reversal error:", e); }
          }
          break;
        }
        case "treasury.financial_account.features_status_updated": {
          const fa = event.data.object;
          console.log(`[Stripe Webhook] Treasury FA features updated: ${fa.id}, active: ${JSON.stringify(fa.active_features)}`);
          break;
        }
        case "treasury.received_credit.succeeded": {
          const credit = event.data.object;
          const creditAmt = credit.amount || 0;
          console.log(`[Stripe Webhook] Treasury received credit: ${credit.id}, amount: $${creditAmt / 100}, FA: ${credit.financial_account}`);
          // Credit wallet — external funds received
          if (credit.financial_account && creditAmt > 0) {
            try { await creditWalletByConnect(credit.financial_account, creditAmt, `Received credit — ${credit.id}`, credit.id, "deposit"); } catch (e) { console.warn("[Stripe Webhook] Treasury credit wallet error:", e); }
          }
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
  // PUBLIC ACCESS VALIDATION API — Lightweight 24h token-based endpoints
  // Staff access controllers use these via their validation link (no login).
  // The token in the URL is the authentication mechanism.
  // =========================================================================

  // Step 1: Validate token exists + check if code is already verified
  app.get("/api/access/validate/:token", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Service unavailable" });

      const { staffAccessTokens, terminalStaff, terminals } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const now = new Date();

      const [tokenRow] = await db.select({
        tokenId: staffAccessTokens.id,
        staffId: staffAccessTokens.staffId,
        expiresAt: staffAccessTokens.expiresAt,
        isRevoked: staffAccessTokens.isRevoked,
        codeVerifiedAt: staffAccessTokens.codeVerifiedAt,
        codeAttempts: staffAccessTokens.codeAttempts,
      }).from(staffAccessTokens)
        .where(and(eq(staffAccessTokens.token, req.params.token), eq(staffAccessTokens.isRevoked, false)))
        .limit(1);

      if (!tokenRow) return res.status(404).json({ error: "Invalid or expired link" });
      if (tokenRow.expiresAt && tokenRow.expiresAt < now) return res.status(410).json({ error: "Link expired" });
      if ((tokenRow.codeAttempts || 0) >= 5) return res.status(423).json({ error: "Too many code attempts. Link locked." });

      const staffRows = await db.select().from(terminalStaff).where(eq(terminalStaff.id, tokenRow.staffId)).limit(1);
      const staff = staffRows[0];

      if (!staff) return res.status(404).json({ error: "Staff member not found" });

      // Resolve geofence location — either from terminal (oil) or from staff's own location (shipper/marketer)
      let terminalName: string | null = null;
      let terminalLat: number | null = null;
      let terminalLng: number | null = null;

      if (staff.terminalId) {
        // Terminal-based staff (oil products)
        const [t] = await db.select({ name: terminals.name, code: terminals.code, lat: terminals.latitude, lng: terminals.longitude })
          .from(terminals).where(eq(terminals.id, staff.terminalId)).limit(1);
        if (t) {
          terminalName = `${t.name} (${t.code || ""})`;
          terminalLat = t.lat ? Number(t.lat) : null;
          terminalLng = t.lng ? Number(t.lng) : null;
        }
      } else {
        // Shipper/Marketer location-based staff (all other product types)
        const sAny = staff as any;
        terminalName = sAny.locationName || null;
        terminalLat = sAny.locationLat ? Number(sAny.locationLat) : null;
        terminalLng = sAny.locationLng ? Number(sAny.locationLng) : null;
      }

      res.json({
        valid: true,
        requiresCode: !tokenRow.codeVerifiedAt,
        codeVerified: !!tokenRow.codeVerifiedAt,
        staff: {
          id: staff.id,
          name: staff.name,
          staffRole: staff.staffRole,
          assignedZone: staff.assignedZone,
          canApproveAccess: staff.canApproveAccess,
          canDispenseProduct: staff.canDispenseProduct,
          terminalName,
          terminalLat,
          terminalLng,
          locationType: (staff as any).locationType || "terminal",
          locationName: (staff as any).locationName || null,
        },
        expiresAt: tokenRow.expiresAt?.toISOString(),
      });
    } catch (err: any) {
      console.error("[AccessValidation] validate error:", err);
      res.status(500).json({ error: "Validation failed" });
    }
  });

  // Step 2: Verify the 6-digit access code (must pass before any other action)
  app.post("/api/access/verify-code/:token", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Service unavailable" });

      const { staffAccessTokens } = await import("../../drizzle/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const [tokenRow] = await db.select({
        id: staffAccessTokens.id,
        accessCode: staffAccessTokens.accessCode,
        codeAttempts: staffAccessTokens.codeAttempts,
        codeVerifiedAt: staffAccessTokens.codeVerifiedAt,
        expiresAt: staffAccessTokens.expiresAt,
      }).from(staffAccessTokens)
        .where(and(eq(staffAccessTokens.token, req.params.token), eq(staffAccessTokens.isRevoked, false)))
        .limit(1);

      if (!tokenRow) return res.status(404).json({ error: "Invalid link" });
      if (tokenRow.expiresAt && tokenRow.expiresAt < new Date()) return res.status(410).json({ error: "Link expired" });
      if ((tokenRow.codeAttempts || 0) >= 5) return res.status(423).json({ error: "Too many attempts. Link locked. Contact your manager." });

      const { code } = req.body || {};
      if (!code || typeof code !== "string" || code.length !== 6) {
        return res.status(400).json({ error: "Enter a 6-digit code" });
      }

      // Increment attempts
      await db.update(staffAccessTokens)
        .set({ codeAttempts: (tokenRow.codeAttempts || 0) + 1 })
        .where(eq(staffAccessTokens.id, tokenRow.id));

      if (code !== tokenRow.accessCode) {
        const remaining = 4 - (tokenRow.codeAttempts || 0);
        return res.status(401).json({ error: `Incorrect code. ${remaining > 0 ? remaining : 0} attempts remaining.` });
      }

      // Code correct — mark as verified with timestamp
      const now = new Date();
      await db.update(staffAccessTokens)
        .set({ codeVerifiedAt: now })
        .where(eq(staffAccessTokens.id, tokenRow.id));

      res.json({ success: true, codeVerifiedAt: now.toISOString() });
    } catch (err: any) {
      console.error("[AccessValidation] verify-code error:", err);
      res.status(500).json({ error: "Code verification failed" });
    }
  });

  // Step 3: Look up a load by ID (requires verified code)
  app.get("/api/access/lookup/:token/:loadId", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Service unavailable" });

      const { staffAccessTokens, loads, users, companies } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [tokenRow] = await db.select({
        staffId: staffAccessTokens.staffId,
        expiresAt: staffAccessTokens.expiresAt,
        codeVerifiedAt: staffAccessTokens.codeVerifiedAt,
      }).from(staffAccessTokens)
        .where(and(eq(staffAccessTokens.token, req.params.token), eq(staffAccessTokens.isRevoked, false)))
        .limit(1);

      if (!tokenRow || (tokenRow.expiresAt && tokenRow.expiresAt < new Date())) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      if (!tokenRow.codeVerifiedAt) {
        return res.status(403).json({ error: "Access code not verified" });
      }

      const loadId = parseInt(req.params.loadId, 10);
      if (isNaN(loadId)) return res.status(400).json({ error: "Invalid load ID" });

      const [load] = await db.select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        status: loads.status,
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        cargoType: loads.cargoType,
        weight: loads.weight,
        driverId: loads.driverId,
        shipperId: loads.shipperId,
        catalystId: loads.catalystId,
      }).from(loads).where(eq(loads.id, loadId)).limit(1);

      if (!load) return res.status(404).json({ error: "Load not found" });

      let driverInfo = null;
      if (load.driverId) {
        const [driver] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, load.driverId)).limit(1);
        driverInfo = driver || null;
      }

      let shipperInfo = null;
      if (load.shipperId) {
        const [shipper] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, load.shipperId)).limit(1);
        shipperInfo = shipper || null;
      }

      // ═══ FMCSA Carrier Safety Intelligence ═══
      // Resolve the carrier company via catalystId → user → company → dotNumber
      // Then look up cached FMCSA safety data for real-time gate vetting
      let carrierSafety: any = null;
      try {
        let carrierDot: string | null = null;
        let carrierCompanyName: string | null = null;

        if (load.catalystId) {
          const [catalystUser] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, load.catalystId)).limit(1);
          if (catalystUser?.companyId) {
            const [company] = await db.select({
              name: companies.name,
              dotNumber: companies.dotNumber,
              mcNumber: companies.mcNumber,
            }).from(companies).where(eq(companies.id, catalystUser.companyId)).limit(1);
            carrierDot = company?.dotNumber || null;
            carrierCompanyName = company?.name || null;

            // Check hzCarrierSafety cache first (fastest)
            if (carrierDot) {
              try {
                const { hzCarrierSafety } = await import("../../drizzle/schema");
                const [cached] = await db.select().from(hzCarrierSafety).where(eq(hzCarrierSafety.dotNumber, carrierDot)).limit(1);
                if (cached) {
                  carrierSafety = {
                    source: "FMCSA",
                    dotNumber: carrierDot,
                    mcNumber: company?.mcNumber || null,
                    carrierName: cached.legalName || carrierCompanyName,
                    safetyRating: cached.safetyRating || null,
                    riskLevel: getRiskLevel(cached),
                    basics: {
                      unsafeDriving: cached.unsafeDrivingScore ? Number(cached.unsafeDrivingScore) : null,
                      hoursOfService: cached.hosComplianceScore ? Number(cached.hosComplianceScore) : null,
                      driverFitness: cached.driverFitnessScore ? Number(cached.driverFitnessScore) : null,
                      controlledSubstances: cached.controlledSubstancesScore ? Number(cached.controlledSubstancesScore) : null,
                      vehicleMaintenance: cached.vehicleMaintenanceScore ? Number(cached.vehicleMaintenanceScore) : null,
                      hazmatCompliance: cached.hazmatComplianceScore ? Number(cached.hazmatComplianceScore) : null,
                      crashIndicator: cached.crashIndicatorScore ? Number(cached.crashIndicatorScore) : null,
                    },
                    lastUpdated: cached.lastUpdate?.toISOString() || null,
                  };
                }
              } catch (safetyErr) {
                console.warn("[AccessValidation] FMCSA cache lookup failed:", (safetyErr as any)?.message?.substring(0, 80));
              }
            }

            // If no cached data, return minimal carrier info so UI can still show it
            if (!carrierSafety && carrierDot) {
              carrierSafety = {
                source: "FMCSA",
                dotNumber: carrierDot,
                mcNumber: company?.mcNumber || null,
                carrierName: carrierCompanyName,
                safetyRating: null,
                riskLevel: "unknown",
                basics: null,
                lastUpdated: null,
              };
            }
          }
        }
      } catch (carrierErr) {
        console.warn("[AccessValidation] Carrier safety enrichment failed:", (carrierErr as any)?.message?.substring(0, 80));
      }

      res.json({ load, driver: driverInfo, shipper: shipperInfo, carrierSafety });
    } catch (err: any) {
      console.error("[AccessValidation] lookup error:", err);
      res.status(500).json({ error: "Lookup failed" });
    }
  });

  // Step 4: Record an access decision with full audit trail (location + timestamps)
  app.post("/api/access/decide/:token", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Service unavailable" });

      const { staffAccessTokens, accessValidations } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [tokenRow] = await db.select({
        id: staffAccessTokens.id,
        staffId: staffAccessTokens.staffId,
        expiresAt: staffAccessTokens.expiresAt,
        codeVerifiedAt: staffAccessTokens.codeVerifiedAt,
      }).from(staffAccessTokens)
        .where(and(eq(staffAccessTokens.token, req.params.token), eq(staffAccessTokens.isRevoked, false)))
        .limit(1);

      if (!tokenRow || (tokenRow.expiresAt && tokenRow.expiresAt < new Date())) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      if (!tokenRow.codeVerifiedAt) {
        return res.status(403).json({ error: "Access code not verified" });
      }

      const { loadId, driverId, decision, denyReason, staffLat, staffLng, geofenceDistanceMeters, locationVerifiedAt } = req.body || {};
      if (!decision || !["approved", "denied"].includes(decision)) {
        return res.status(400).json({ error: "Invalid decision" });
      }

      const now = new Date();
      const [result] = await db.insert(accessValidations).values({
        staffId: tokenRow.staffId,
        tokenId: tokenRow.id,
        loadId: loadId ? parseInt(String(loadId), 10) : null,
        driverId: driverId ? parseInt(String(driverId), 10) : null,
        decision,
        denyReason: decision === "denied" ? (denyReason || null) : null,
        staffLat: staffLat ? String(staffLat) : null,
        staffLng: staffLng ? String(staffLng) : null,
        geofenceDistanceMeters: geofenceDistanceMeters ? parseInt(String(geofenceDistanceMeters), 10) : null,
        locationVerifiedAt: locationVerifiedAt ? new Date(locationVerifiedAt) : null,
        codeVerifiedAt: tokenRow.codeVerifiedAt,
        scannedData: { ...req.body, decidedAt: now.toISOString(), ip: req.ip },
        validatedAt: now,
      }).$returningId();

      res.json({ success: true, validationId: result.id, decision, timestamp: now.toISOString() });
    } catch (err: any) {
      console.error("[AccessValidation] decide error:", err);
      res.status(500).json({ error: "Decision recording failed" });
    }
  });

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
    app.use("/assets", express.static(path.resolve(distPath, "assets"), { maxAge: "1y", immutable: true }));
    app.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res: any, filePath: string) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }));
    app.use("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
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

    // ML Engine — self-training models (rate prediction, carrier match, ETA, demand, anomaly, etc.)
    setTimeout(async () => {
      try {
        const { mlEngine } = await import("../services/mlEngine");
        await mlEngine.initialize();
        console.log("[MLEngine] Self-training ML engine initialized");
      } catch (e) { console.warn("[MLEngine] Init deferred:", (e as any)?.message); }
    }, 15000);

    // Auto-seed Document Center types & requirements on startup
    setTimeout(async () => {
      try {
        const { getDb } = await import("../db");
        const db = await getDb();
        if (db) {
          const { documentTypes, documentRequirements } = await import("../../drizzle/schema");
          const { documentTypesSeed } = await import("../seeds/documentTypesSeed");
          const { documentRequirementsSeed } = await import("../seeds/documentRequirementsSeed");

          // Always upsert document types so download/source URLs stay current
          console.log("[DocumentCenter] Upserting document types...");
          let tc = 0;
          for (const seed of documentTypesSeed) {
            try {
              await db.insert(documentTypes).values({
                id: seed.id, category: seed.category, name: seed.name,
                shortName: seed.shortName || null, description: seed.description || null,
                formNumber: seed.formNumber || null, issuingAuthority: seed.issuingAuthority || null,
                regulatoryReference: seed.regulatoryReference || null,
                sourceUrl: seed.sourceUrl || null, downloadUrl: seed.downloadUrl || null,
                instructionsUrl: (seed as any).instructionsUrl || null,
                hasExpiration: seed.hasExpiration ?? false,
                typicalValidityDays: seed.typicalValidityDays || null,
                expirationWarningDays: seed.expirationWarningDays || 30,
                verificationLevel: seed.verificationLevel || "L1_SYSTEM",
                requiresSignature: seed.requiresSignature ?? false,
                ocrEnabled: seed.ocrEnabled ?? true,
                ocrFieldMappings: seed.ocrFieldMappings || null,
                isStateSpecific: seed.isStateSpecific ?? false,
                applicableStates: (seed as any).applicableStates || null,
                sortOrder: seed.sortOrder || 100, isActive: true,
              }).onDuplicateKeyUpdate({ set: { downloadUrl: seed.downloadUrl || null, sourceUrl: seed.sourceUrl || null, instructionsUrl: (seed as any).instructionsUrl || null, name: seed.name, isActive: true } });
              tc++;
            } catch {}
          }
          console.log(`[DocumentCenter] Upserted ${tc} document types`);

          // Truncate and re-seed requirements (idempotent: clean slate every startup)
          const { sql: rawSql } = await import("drizzle-orm");
          try { await db.execute(rawSql`DELETE FROM document_requirements`); } catch {}
          console.log("[DocumentCenter] Seeding document requirements...");
          let rc = 0;
          for (const seed of documentRequirementsSeed) {
            try {
              await db.insert(documentRequirements).values({
                documentTypeId: seed.documentTypeId,
                requiredForRole: seed.requiredForRole as any,
                requiredForEmploymentType: (seed as any).requiredForEmploymentType || null,
                isRequired: seed.isRequired ?? true,
                isBlocking: seed.isBlocking ?? true,
                priority: seed.priority || 1,
                conditionType: (seed as any).conditionType || null,
                conditionValue: (seed as any).conditionValue != null ? (seed as any).conditionValue : null,
                requiredAtOnboarding: (seed as any).requiredAtOnboarding ?? true,
                gracePeriodDays: (seed as any).gracePeriodDays || 0,
              });
              rc++;
            } catch {}
          }
          console.log(`[DocumentCenter] Seeded ${rc} document requirements`);

          // Auto-seed state-specific requirements (CDL portals, IFTA, weight-distance, CARB, oversize)
          const { stateDocRequirements } = await import("../../drizzle/schema");
          const { stateRequirementsSeed } = await import("../seeds/stateRequirementsSeed");
          console.log("[DocumentCenter] Seeding state requirements...");
          let sc = 0;
          for (const seed of stateRequirementsSeed) {
            try {
              await db.insert(stateDocRequirements).values({
                stateCode: seed.stateCode,
                stateName: seed.stateName,
                documentTypeId: seed.documentTypeId,
                stateFormNumber: seed.stateFormNumber || null,
                stateFormName: seed.stateFormName || null,
                stateIssuingAgency: seed.stateIssuingAgency,
                statePortalUrl: seed.statePortalUrl || null,
                stateFormUrl: seed.stateFormUrl || null,
                stateInstructionsUrl: seed.stateInstructionsUrl || null,
                isRequired: seed.isRequired ?? true,
                requiredForRoles: seed.requiredForRoles || null,
                conditions: seed.conditions || null,
                filingFee: seed.filingFee || null,
                renewalFee: seed.renewalFee || null,
                lateFee: seed.lateFee || null,
                validityPeriod: seed.validityPeriod || null,
                renewalWindow: seed.renewalWindow || null,
                notes: seed.notes || null,
              }).onDuplicateKeyUpdate({
                set: {
                  stateIssuingAgency: seed.stateIssuingAgency,
                  statePortalUrl: seed.statePortalUrl || null,
                  stateFormUrl: seed.stateFormUrl || null,
                  requiredForRoles: seed.requiredForRoles || null,
                  conditions: seed.conditions || null,
                  validityPeriod: seed.validityPeriod || null,
                  notes: seed.notes || null,
                },
              });
              sc++;
            } catch {}
          }
          console.log(`[DocumentCenter] Seeded ${sc} state requirements`);
        }
      } catch (err) {
        console.error("[DocumentCenter] Auto-seed failed:", err);
      }
    }, 3000);

    // Start weekly mission generator scheduler
    setTimeout(async () => {
      try {
        const { startMissionScheduler } = await import("../services/missionGenerator");
        startMissionScheduler();
      } catch (err) {
        console.error("[MissionGenerator] Failed to start:", err);
      }
    }, 8000);

    // Start gamification sync scheduler (prune orphaned data, cap missions, backfill profiles)
    setTimeout(async () => {
      try {
        const { startGamificationSync } = await import("../services/gamificationDispatcher");
        startGamificationSync();
      } catch (err) {
        console.error("[GamificationSync] Failed to start:", err);
      }
    }, 12000);

    // Auto-seed facility database from EIA if empty (terminals + refineries)
    setTimeout(async () => {
      try {
        const { autoSeedIfEmpty } = await import("../services/facilities/facilityService");
        await autoSeedIfEmpty();
      } catch (err) {
        console.error("[FacilityService] Auto-seed startup error:", err);
      }
    }, 20000);

    // AI TURBOCHARGE — Seed knowledge base for RAG + warm embedding candidate cache
    setTimeout(async () => {
      try {
        const { seedKnowledgeBase } = await import("../services/embeddings/ragRetriever");
        const result = await seedKnowledgeBase();
        console.log(`[AITurbo] Knowledge base seeded: ${result.indexed} indexed, ${result.errors} errors`);
      } catch (err) { console.warn("[AITurbo] Knowledge seeding deferred:", (err as any)?.message?.slice(0, 80)); }
    }, 25000);

    // Start Hot Zones data sync v5.0 — orchestrator + scheduler (22+ data sources)
    setTimeout(async () => {
      try {
        if (process.env.SYNC_ENABLED !== "false") {
          const { warmCache } = await import("../services/cache/hotZonesCache");
          await warmCache();

          // Register all jobs with the sync orchestrator (admin controls, failure tracking)
          const { registerAllSyncJobs } = await import("../services/sync/registerJobs");
          const { syncOrchestrator } = await import("../services/sync/syncOrchestrator");
          registerAllSyncJobs();
          syncOrchestrator.initialize();
          console.log("[HotZones] Sync orchestrator v5.0 initialized (22 jobs)");

          // Also start the legacy scheduler for backward compatibility
          const { initializeDataSyncScheduler, runInitialSync } = await import("../services/dataSync/scheduler");
          initializeDataSyncScheduler();

          // Non-blocking initial sync
          runInitialSync().catch((err) => console.error("[HotZones] Initial sync error:", err));
        } else {
          console.log("[HotZones] Data sync disabled (SYNC_ENABLED=false)");
        }
      } catch (err) {
        console.error("[HotZones] Failed to start data sync:", err);
      }
    }, 15000);
  });
}

startServer().catch(console.error);
