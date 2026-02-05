/**
 * EUSOCONNECT OAUTH CALLBACK ROUTES
 * Handles OAuth2 callbacks from integration providers
 */

import { Router, Request, Response } from "express";
import { getDb } from "../../db";
import { integrationProviders, integrationConnections } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

interface OAuthState {
  userId: number;
  companyId: number;
  providerSlug: string;
  returnUrl: string;
}

/**
 * OAuth callback handler for integration providers
 * GET /api/integrations/oauth/callback/:provider
 */
router.get("/callback/:provider", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, state, error, error_description } = req.query;

  console.log(`[OAuth] Callback received for provider: ${provider}`);

  // Handle OAuth errors
  if (error) {
    console.error(`[OAuth] Error from provider: ${error} - ${error_description}`);
    return res.redirect(`/settings/integrations?error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code || !state) {
    console.error("[OAuth] Missing code or state parameter");
    return res.redirect("/settings/integrations?error=missing_parameters");
  }

  try {
    // Decode state
    const stateData: OAuthState = JSON.parse(Buffer.from(String(state), "base64").toString("utf-8"));
    const { userId, companyId, providerSlug, returnUrl } = stateData;

    // Get provider configuration
    const db = await getDb(); if (!db) return res.status(500).json({ error: "Database unavailable" });
    const [providerConfig] = await db.select().from(integrationProviders)
      .where(eq(integrationProviders.slug, providerSlug));

    if (!providerConfig) {
      console.error(`[OAuth] Provider not found: ${providerSlug}`);
      return res.redirect("/settings/integrations?error=provider_not_found");
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(providerConfig, String(code));

    if (!tokenResponse.access_token) {
      console.error("[OAuth] Failed to get access token");
      return res.redirect("/settings/integrations?error=token_exchange_failed");
    }

    // Check for existing connection
    const [existingConnection] = await db.select().from(integrationConnections)
      .where(and(
        eq(integrationConnections.companyId, companyId),
        eq(integrationConnections.providerSlug, providerSlug)
      ));

    const tokenExpiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : null;

    if (existingConnection) {
      // Update existing connection
      await db.update(integrationConnections)
        .set({
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiresAt,
          status: "connected",
          lastError: null,
          errorCount: 0,
        })
        .where(eq(integrationConnections.id, existingConnection.id));
    } else {
      // Create new connection
      await db.insert(integrationConnections).values({
        companyId,
        userId,
        providerId: providerConfig.id,
        providerSlug,
        displayName: providerConfig.displayName,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt,
        status: "connected",
        connectedAt: new Date(),
      } as any);
    }

    console.log(`[OAuth] Successfully connected ${providerSlug} for company ${companyId}`);
    return res.redirect(returnUrl || "/settings/integrations?success=connected");

  } catch (error) {
    console.error("[OAuth] Callback error:", error);
    return res.redirect("/settings/integrations?error=callback_failed");
  }
});

/**
 * Initiate OAuth flow
 * GET /api/integrations/oauth/initiate/:provider
 */
router.get("/initiate/:provider", async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { userId, companyId, returnUrl } = req.query;

  if (!userId || !companyId) {
    return res.status(400).json({ error: "Missing userId or companyId" });
  }

  try {
    const db = await getDb(); if (!db) return res.status(500).json({ error: "Database unavailable" });
    const [providerConfig] = await db.select().from(integrationProviders)
      .where(eq(integrationProviders.slug, provider));

    if (!providerConfig) {
      return res.status(404).json({ error: "Provider not found" });
    }

    if (!providerConfig.authType?.includes("oauth")) {
      return res.status(400).json({ error: "Provider does not support OAuth" });
    }

    // Build state parameter
    const state: OAuthState = {
      userId: Number(userId),
      companyId: Number(companyId),
      providerSlug: provider,
      returnUrl: String(returnUrl || "/settings/integrations"),
    };
    const encodedState = Buffer.from(JSON.stringify(state)).toString("base64");

    // Build OAuth URL
    const authUrl = buildOAuthUrl(providerConfig, encodedState);

    console.log(`[OAuth] Initiating flow for ${provider}`);
    return res.redirect(authUrl);

  } catch (error) {
    console.error("[OAuth] Initiate error:", error);
    return res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
});

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  provider: typeof integrationProviders.$inferSelect,
  code: string
): Promise<{ access_token?: string; refresh_token?: string; expires_in?: number }> {
  const tokenUrl = (provider as any).tokenUrl || provider.apiBaseUrl;
  if (!tokenUrl) {
    throw new Error("Provider does not have token URL configured");
  }

  const callbackUrl = `${process.env.APP_URL || "http://localhost:3007"}/api/integrations/oauth/callback/${provider.slug}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: process.env[`${provider.slug.toUpperCase()}_CLIENT_ID`] || "",
      client_secret: process.env[`${provider.slug.toUpperCase()}_CLIENT_SECRET`] || "",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OAuth] Token exchange failed: ${errorText}`);
    throw new Error("Token exchange failed");
  }

  return response.json();
}

/**
 * Build OAuth authorization URL
 */
function buildOAuthUrl(
  provider: typeof integrationProviders.$inferSelect,
  state: string
): string {
  const authUrl = (provider as any).authUrl || provider.websiteUrl;
  if (!authUrl) {
    throw new Error("Provider does not have auth URL configured");
  }

  const callbackUrl = `${process.env.APP_URL || "http://localhost:3007"}/api/integrations/oauth/callback/${provider.slug}`;
  const scopes = Array.isArray((provider as any).scopes) ? ((provider as any).scopes as string[]).join(" ") : "";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env[`${provider.slug.toUpperCase()}_CLIENT_ID`] || "",
    redirect_uri: callbackUrl,
    scope: scopes,
    state,
  });

  return `${authUrl}?${params.toString()}`;
}

export default router;
