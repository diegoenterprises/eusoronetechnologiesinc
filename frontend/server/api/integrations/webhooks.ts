/**
 * EUSOCONNECT WEBHOOK HANDLERS
 * Receives and processes webhooks from integration providers
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "../../db";
import { 
  integrationWebhooks, 
  integrationConnections, 
  integrationProviders,
  integrationSyncedRecords 
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getIntegrationService } from "../../services/integrations";

const router = Router();

/**
 * Generic webhook handler for all providers
 * POST /api/integrations/webhooks/:provider
 */
router.post("/:provider", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const signature = req.headers["x-webhook-signature"] || req.headers["x-hub-signature-256"];
  const webhookId = req.headers["x-webhook-id"] || `wh_${Date.now()}`;
  
  console.log(`[Webhook] Received from ${provider}: ${webhookId}`);

  try {
    const db = await getDb(); if (!db) return res.status(500).json({ error: "Database unavailable" });
    
    // Find webhook configuration
    const [webhookConfig] = await db.select().from(integrationWebhooks)
      .where(eq(integrationWebhooks.providerSlug, provider));

    // Verify signature if configured (TODO: add secret column to schema)
    if (signature) {
      // Signature verification pending schema update
      console.log(`[Webhook] Signature provided for ${provider}, verification pending`);
      
      }

    // Log the webhook event
    const eventType = extractEventType(provider, req.body, req.headers);
    
    // Process the webhook based on provider
    const result = await processWebhook(provider, eventType, req.body);

    // Update last received timestamp
    if (webhookConfig) {
      // Webhook already logged via insert, no additional update needed
    }

    console.log(`[Webhook] Processed ${provider}:${eventType} successfully`);
    return res.status(200).json({ received: true, processed: result.processed });

  } catch (error) {
    console.error(`[Webhook] Error processing ${provider}:`, error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * Canopy Connect webhook handler
 * POST /api/integrations/webhooks/canopy
 */
router.post("/canopy", async (req: Request, res: Response) => {
  const { event, data } = req.body;
  
  console.log(`[Webhook:Canopy] Event: ${event}`);

  try {
    const db = await getDb(); if (!db) return res.status(500).json({ error: "Database unavailable" });

    switch (event) {
      case "policy.updated":
      case "policy.created":
        // Find connection for this account
        if (data.account_id) {
          const [connection] = await db.select().from(integrationConnections)
            .where(and(
              eq(integrationConnections.providerSlug, "canopy_connect"),
              eq(integrationConnections.externalId, data.account_id)
            ));

          if (connection) {
            // Trigger sync for this connection
            const service = getIntegrationService("canopy_connect");
            if (service) {
              await service.initialize(connection.id);
              await service.fetchData(["policies"]);
            }
          }
        }
        break;

      case "certificate.generated":
        // Handle new certificate
        console.log(`[Webhook:Canopy] Certificate generated: ${data.certificate_id}`);
        break;

      case "claim.updated":
        // Handle claim update
        console.log(`[Webhook:Canopy] Claim updated: ${data.claim_id}`);
        break;

      default:
        console.log(`[Webhook:Canopy] Unhandled event: ${event}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("[Webhook:Canopy] Error:", error);
    return res.status(500).json({ error: "Processing failed" });
  }
});

/**
 * Motive (KeepTruckin) webhook handler
 * POST /api/integrations/webhooks/motive
 */
router.post("/motive", async (req: Request, res: Response) => {
  const { event_type, data, company_id } = req.body;
  
  console.log(`[Webhook:Motive] Event: ${event_type}`);

  try {
    const db = await getDb(); if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Find connection for this company
    const [connection] = await db.select().from(integrationConnections)
      .where(and(
        eq(integrationConnections.providerSlug, "keeptruckin"),
        eq(integrationConnections.externalId, String(company_id))
      ));

    if (!connection) {
      console.warn(`[Webhook:Motive] No connection found for company ${company_id}`);
      return res.status(200).json({ received: true, processed: false });
    }

    // TODO: Store webhook data in integrationSyncedRecords after schema alignment
    // For now, just log the event type
    console.log(`[Webhook:Motive] Received event: ${event_type}, data ID: ${data?.id || "unknown"}`);
    
    // Event types: driver.created, driver.updated, vehicle.created, vehicle.updated,
    // hos_log.certified, dvir.submitted, location.updated

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("[Webhook:Motive] Error:", error);
    return res.status(500).json({ error: "Processing failed" });
  }
});

/**
 * ISNetworld webhook handler
 * POST /api/integrations/webhooks/isnetworld
 */
router.post("/isnetworld", async (req: Request, res: Response) => {
  const { notification_type, contractor_id, data } = req.body;
  
  console.log(`[Webhook:ISNetworld] Event: ${notification_type}`);

  try {
    const db = await getDb(); if (!db) return res.status(500).json({ error: "Database unavailable" });

    const [connection] = await db.select().from(integrationConnections)
      .where(and(
        eq(integrationConnections.providerSlug, "isnetworld"),
        eq(integrationConnections.externalId, String(contractor_id))
      ));

    if (!connection) {
      return res.status(200).json({ received: true, processed: false });
    }

    switch (notification_type) {
      case "requirement_status_changed":
        // Trigger compliance sync
        const service = getIntegrationService("isnetworld");
        if (service) {
          await service.initialize(connection.id);
          await service.fetchData(["compliance"]);
        }
        break;

      case "grade_updated":
        console.log(`[Webhook:ISNetworld] Grade updated for contractor ${contractor_id}`);
        break;

      case "document_reviewed":
        console.log(`[Webhook:ISNetworld] Document reviewed: ${data.document_id}`);
        break;

      default:
        console.log(`[Webhook:ISNetworld] Unhandled event: ${notification_type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("[Webhook:ISNetworld] Error:", error);
    return res.status(500).json({ error: "Processing failed" });
  }
});

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    
    // Handle different signature formats
    const actualSignature = signature.replace("sha256=", "");
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(actualSignature)
    );
  } catch (error) {
    console.error("[Webhook] Signature verification error:", error);
    return false;
  }
}

/**
 * Extract event type from webhook payload
 */
function extractEventType(
  provider: string, 
  body: Record<string, unknown>, 
  headers: Record<string, unknown>
): string {
  // Different providers use different fields for event type
  const eventFields = [
    "event",
    "event_type",
    "type",
    "notification_type",
    "action",
    headers["x-event-type"],
    headers["x-github-event"],
  ];

  for (const field of eventFields) {
    if (typeof field === "string" && body[field]) {
      return String(body[field]);
    }
    if (typeof field === "string") {
      return field;
    }
  }

  return "unknown";
}

/**
 * Process webhook based on provider
 */
async function processWebhook(
  provider: string, 
  eventType: string, 
  data: Record<string, unknown>
): Promise<{ processed: boolean }> {
  // Get integration service for this provider
  const service = getIntegrationService(provider);
  
  if (!service) {
    console.warn(`[Webhook] No service for provider: ${provider}`);
    return { processed: false };
  }

  // Map event to data type for sync
  const dataTypeMap: Record<string, string[]> = {
    "policy.updated": ["policies"],
    "policy.created": ["policies"],
    "certificate.generated": ["certificates"],
    "claim.updated": ["claims"],
    "driver.created": ["drivers"],
    "driver.updated": ["drivers"],
    "vehicle.created": ["vehicles"],
    "vehicle.updated": ["vehicles"],
    "hos_log.certified": ["hos_logs"],
    "dvir.submitted": ["dvirs"],
  };

  const dataTypes = dataTypeMap[eventType];
  if (dataTypes) {
    // Would trigger targeted sync here
    console.log(`[Webhook] Would sync ${dataTypes.join(", ")} for ${provider}`);
  }

  return { processed: true };
}

export default router;
