export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  azureEmailConnectionString: process.env.AZURE_EMAIL_CONNECTION_STRING ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "DoNotReply@eusotrip.com",
  embeddingServiceUrl: process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8090", // Legacy TEI — deprecated, Gemini Embedding now primary
  embeddingModel: process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
  embeddingDimensions: parseInt(process.env.EMBEDDING_DIMS ?? "1536", 10),
};
