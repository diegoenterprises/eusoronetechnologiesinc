/**
 * EUSOCONNECT API ROUTES INDEX
 * Combines OAuth and Webhook routes for integration providers
 */

import { Router } from "express";
import oauthRouter from "./oauth";
import webhooksRouter from "./webhooks";

const router = Router();

// OAuth routes: /api/integrations/oauth/*
router.use("/oauth", oauthRouter);

// Webhook routes: /api/integrations/webhooks/*
router.use("/webhooks", webhooksRouter);

export default router;
