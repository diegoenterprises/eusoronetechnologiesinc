# EusoTrip — Microsoft Azure Production Deployment Guide

> **Eusorone Technologies Inc.** | EusoTrip Freight & Energy Logistics Platform
> 
> This guide covers the complete Azure infrastructure setup: App Service, DNS, Database, AI (Gemini), Key Vault, security, monitoring, and CI/CD.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Azure Resource Group & Naming](#2-azure-resource-group--naming)
3. [Azure App Service (Web Hosting)](#3-azure-app-service-web-hosting)
4. [TLS 1.3 & Custom Domain (DNS)](#4-tls-13--custom-domain-dns)
5. [Azure Database for MySQL](#5-azure-database-for-mysql)
6. [Azure Key Vault (Secrets Management)](#6-azure-key-vault-secrets-management)
7. [Gemini AI Integration (Google AI)](#7-gemini-ai-integration-google-ai)
8. [Azure Blob Storage (File Uploads)](#8-azure-blob-storage-file-uploads)
9. [Azure Application Insights (Monitoring)](#9-azure-application-insights-monitoring)
10. [Azure Front Door + WAF (CDN & Protection)](#10-azure-front-door--waf-cdn--protection)
11. [CI/CD with GitHub Actions](#11-cicd-with-github-actions)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [SOC 2 Compliance Checklist](#13-soc-2-compliance-checklist)
14. [PCI-DSS Compliance Checklist](#14-pci-dss-compliance-checklist)
15. [Cost Estimate](#15-cost-estimate)

---

## 1. Prerequisites

### Tools to Install

```bash
# Azure CLI
brew install azure-cli        # macOS
# or: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux

# Login to Azure
az login

# Set default subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Node.js 20+ (already installed)
node --version  # Should be 20.x+
```

### Azure Account Requirements

- **Azure subscription** (Pay-As-You-Go or Enterprise Agreement)
- **Owner** or **Contributor** role on the subscription
- **Domain name** registered (e.g., `eusotrip.com` or `eusotrip.com`)
- **GitHub repository** access for CI/CD

---

## 2. Azure Resource Group & Naming

All resources go into a single resource group for management.

```bash
# Variables - SET THESE FIRST
RESOURCE_GROUP="rg-eusotrip-prod"
LOCATION="southcentralus"       # Texas region (closest to Harris County)
APP_NAME="eusotrip-app"
DB_SERVER="eusotrip-mysql"
KEYVAULT_NAME="kv-eusotrip-prod"
STORAGE_NAME="steusotripprod"    # No hyphens allowed in storage names
APPINSIGHTS_NAME="ai-eusotrip-prod"

# Create Resource Group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=Production Project=EusoTrip Owner="Eusorone Technologies"
```

---

## 3. Azure App Service (Web Hosting)

### Create App Service Plan + Web App

```bash
# Create App Service Plan (P1v3 = Production tier with TLS 1.3, auto-scale)
az appservice plan create \
  --name "asp-eusotrip-prod" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku P1V3 \
  --is-linux

# Create Web App (Node.js 20)
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "asp-eusotrip-prod" \
  --runtime "NODE:20-lts"

# Enable HTTPS-only (force TLS)
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# Set minimum TLS version to 1.3
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --min-tls-version "1.3"

# Set startup command
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm run start"

# Enable WebSockets (needed for real-time tracking)
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --web-sockets-enabled true

# Set Node.js environment
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=~20 \
    PORT=8080
```

### Configure Auto-Scaling

```bash
# Auto-scale: 1-5 instances based on CPU
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource "asp-eusotrip-prod" \
  --resource-type "Microsoft.Web/serverfarms" \
  --name "autoscale-eusotrip" \
  --min-count 1 \
  --max-count 5 \
  --count 1

# Scale up rule: CPU > 70% for 5 min → add 1 instance
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "autoscale-eusotrip" \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1

# Scale down rule: CPU < 30% for 10 min → remove 1 instance
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "autoscale-eusotrip" \
  --condition "CpuPercentage < 30 avg 10m" \
  --scale in 1
```

### Staging Slot (for zero-downtime deploys)

```bash
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging
```

---

## 4. TLS 1.3 & Custom Domain (DNS)

### Step 1: Create Azure DNS Zone

```bash
# Create DNS zone for your domain
az network dns zone create \
  --resource-group $RESOURCE_GROUP \
  --name eusotrip.com

# Get the Azure nameservers (you'll point your domain registrar to these)
az network dns zone show \
  --resource-group $RESOURCE_GROUP \
  --name eusotrip.com \
  --query nameServers \
  --output tsv
```

**At your domain registrar** (GoDaddy, Namecheap, Google Domains, etc.):
- Replace the existing nameservers with the 4 Azure nameservers from the output above.
- Example: `ns1-03.azure-dns.com`, `ns2-03.azure-dns.net`, `ns3-03.azure-dns.org`, `ns4-03.azure-dns.info`

### Step 2: Add DNS Records

```bash
# A record for root domain → App Service IP
az network dns record-set a create \
  --resource-group $RESOURCE_GROUP \
  --zone-name eusotrip.com \
  --name "@" \
  --ttl 300

# Get App Service IP
APP_IP=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "inboundIpAddress" -o tsv)

az network dns record-set a add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name eusotrip.com \
  --record-set-name "@" \
  --ipv4-address $APP_IP

# CNAME for www → App Service
az network dns record-set cname set-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name eusotrip.com \
  --record-set-name "www" \
  --cname "${APP_NAME}.azurewebsites.net"

# CNAME for app subdomain (if using app.eusotrip.com)
az network dns record-set cname set-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name eusotrip.com \
  --record-set-name "app" \
  --cname "${APP_NAME}.azurewebsites.net"

# TXT record for domain verification
az network dns record-set txt add-record \
  --resource-group $RESOURCE_GROUP \
  --zone-name eusotrip.com \
  --record-set-name "asuid" \
  --value $(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "customDomainVerificationId" -o tsv)

# MX records for email (if using Microsoft 365 / Google Workspace)
# az network dns record-set mx add-record \
#   --resource-group $RESOURCE_GROUP \
#   --zone-name eusotrip.com \
#   --record-set-name "@" \
#   --exchange "aspmx.l.google.com" \
#   --preference 1
```

### Step 3: Bind Custom Domain + TLS Certificate

```bash
# Map custom domain to App Service
az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname eusotrip.com

az webapp config hostname add \
  --webapp-name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname www.eusotrip.com

# Create FREE Azure managed TLS certificate (auto-renews, supports TLS 1.3)
az webapp config ssl create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname eusotrip.com

az webapp config ssl create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname www.eusotrip.com

# Bind the certificates
THUMBPRINT=$(az webapp config ssl list --resource-group $RESOURCE_GROUP --query "[?subjectName=='eusotrip.com'].thumbprint" -o tsv)

az webapp config ssl bind \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --certificate-thumbprint $THUMBPRINT \
  --ssl-type SNI
```

**Result:** `https://eusotrip.com` with TLS 1.3, HSTS preload, auto-renewing cert.

---

## 5. Azure Database for MySQL

### Create MySQL Flexible Server

```bash
# Create MySQL 8.0 Flexible Server
az mysql flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --location $LOCATION \
  --admin-user eusotrip_admin \
  --admin-password 'GENERATE_A_STRONG_PASSWORD_HERE' \
  --sku-name Standard_D2ads_v5 \
  --tier GeneralPurpose \
  --storage-size 128 \
  --version 8.0.21 \
  --high-availability ZoneRedundant \
  --backup-retention 35 \
  --geo-redundant-backup Enabled

# Create the database
az mysql flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --database-name eusotrip_prod

# Enable SSL enforcement
az mysql flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name require_secure_transport \
  --value ON

# Set TLS version to 1.2+ (MySQL handles TLS separately from App Service)
az mysql flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name tls_version \
  --value TLSv1.2,TLSv1.3

# Enable audit logging for SOC 2
az mysql flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name audit_log_enabled \
  --value ON

az mysql flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name audit_log_events \
  --value "CONNECTION,QUERY_DML,QUERY_DDL,QUERY_DCL"

# Enable slow query log
az mysql flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name slow_query_log \
  --value ON

az mysql flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name long_query_time \
  --value 2

# Allow App Service to connect (use Private Endpoint in production)
az mysql flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Enable Encryption at Rest (AES-256)

Azure Database for MySQL encrypts all data at rest by default using AES-256. For customer-managed keys:

```bash
# Create a Key Vault key for MySQL encryption (optional: customer-managed key)
az keyvault key create \
  --vault-name $KEYVAULT_NAME \
  --name mysql-encryption-key \
  --kty RSA \
  --size 2048

# Enable data encryption with customer-managed key
az mysql flexible-server update \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --key "https://${KEYVAULT_NAME}.vault.azure.net/keys/mysql-encryption-key" \
  --identity "system"
```

### Connection String

```
DATABASE_URL=mysql://eusotrip_admin:PASSWORD@eusotrip-mysql.mysql.database.azure.com:3306/eusotrip_prod?ssl={"rejectUnauthorized":true}
```

---

## 6. Azure Key Vault (Secrets Management)

**All secrets (DB passwords, API keys, encryption keys) go in Key Vault — never in code or env files.**

```bash
# Create Key Vault
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku premium \
  --enable-soft-delete true \
  --retention-days 90 \
  --enable-purge-protection true

# Grant App Service access to Key Vault
# First, enable system-assigned managed identity on App Service
az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get the App Service identity
APP_IDENTITY=$(az webapp identity show --name $APP_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)

# Grant Key Vault access
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $APP_IDENTITY \
  --secret-permissions get list

# Store all secrets in Key Vault
az keyvault secret set --vault-name $KEYVAULT_NAME --name "DatabaseUrl" \
  --value "mysql://eusotrip_admin:PASSWORD@eusotrip-mysql.mysql.database.azure.com:3306/eusotrip_prod?ssl={\"rejectUnauthorized\":true}"

az keyvault secret set --vault-name $KEYVAULT_NAME --name "JwtSecret" \
  --value "$(openssl rand -base64 64)"

az keyvault secret set --vault-name $KEYVAULT_NAME --name "EncryptionKey" \
  --value "$(openssl rand -base64 32)"

az keyvault secret set --vault-name $KEYVAULT_NAME --name "GeminiApiKey" \
  --value "YOUR_GEMINI_API_KEY"

az keyvault secret set --vault-name $KEYVAULT_NAME --name "StripeSecretKey" \
  --value "YOUR_STRIPE_SECRET_KEY"

az keyvault secret set --vault-name $KEYVAULT_NAME --name "StripePublishableKey" \
  --value "YOUR_STRIPE_PUBLISHABLE_KEY"

# Reference Key Vault secrets in App Service (auto-resolves at runtime)
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/DatabaseUrl/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/JwtSecret/)" \
    ENCRYPTION_KEY="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/EncryptionKey/)" \
    GEMINI_API_KEY="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/GeminiApiKey/)" \
    STRIPE_SECRET_KEY="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/StripeSecretKey/)" \
    VITE_STRIPE_PUBLISHABLE_KEY="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/StripePublishableKey/)"
```

---

## 7. Gemini AI Integration (Google AI)

EusoTrip uses **Google Gemini 2.0 Flash** for ESANG AI, SpectraMatch, ERG, and chat. No Azure OpenAI needed.

### Setup

1. **Get API Key** from [Google AI Studio](https://aistudio.google.com/apikey)
2. Store in Key Vault (done in Step 6 above)
3. The app's `esangAI.ts` already uses the Gemini API directly

### AI Data Retention Policy

Add to your App Service settings:

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    GEMINI_API_KEY="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/GeminiApiKey/)" \
    GEMINI_MODEL="gemini-2.0-flash" \
    AI_CONVERSATION_RETENTION_DAYS=90 \
    AI_LEARNING_DATA_RETENTION_DAYS=365 \
    AI_AUDIT_LOG_RETENTION_DAYS=2555
```

### AI Data Retention Implementation

The app already stores AI conversations in the database. Configure retention:

```sql
-- Run on your MySQL database after deployment

-- Auto-purge AI conversations older than retention period
CREATE EVENT IF NOT EXISTS purge_ai_conversations
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM ai_conversations
  WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND archived = 0;

-- Auto-purge learning data older than retention period
CREATE EVENT IF NOT EXISTS purge_ai_learning
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM spectra_match_results
  WHERE createdAt < DATE_SUB(NOW(), INTERVAL 365 DAY);

-- Keep audit logs for 7 years (SOC 2 + regulatory compliance)
-- Do NOT auto-purge audit_logs — they are retained per data retention policy
```

### Gemini API Architecture

```
Client → tRPC → esangAI.ts → Google Gemini API (gemini-2.0-flash)
                    ↓
         MySQL (conversation history, learning data)
                    ↓
         auditService.ts (SOC 2 logging of AI queries)
```

**No data leaves your control** — Gemini processes queries stateless. Conversation history is stored in YOUR MySQL database, not Google's.

---

## 8. Azure Blob Storage (File Uploads)

For BOLs, PODs, insurance docs, compliance documents, etc.

```bash
# Create storage account
az storage account create \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_ZRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --https-only true

# Create containers
az storage container create --account-name $STORAGE_NAME --name documents --auth-mode login
az storage container create --account-name $STORAGE_NAME --name insurance --auth-mode login
az storage container create --account-name $STORAGE_NAME --name compliance --auth-mode login
az storage container create --account-name $STORAGE_NAME --name bol --auth-mode login
az storage container create --account-name $STORAGE_NAME --name pod --auth-mode login
az storage container create --account-name $STORAGE_NAME --name profile-photos --auth-mode login

# Enable soft delete for data recovery
az storage blob service-properties delete-policy update \
  --account-name $STORAGE_NAME \
  --days-retained 30 \
  --enable true

# Enable versioning
az storage account blob-service-properties update \
  --account-name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --enable-versioning true

# Get connection string and store in Key Vault
STORAGE_CONN=$(az storage account show-connection-string --name $STORAGE_NAME --resource-group $RESOURCE_GROUP -o tsv)

az keyvault secret set --vault-name $KEYVAULT_NAME --name "StorageConnectionString" \
  --value "$STORAGE_CONN"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/StorageConnectionString/)"
```

---

## 9. Azure Application Insights (Monitoring)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app $APPINSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind web \
  --application-type Node.JS \
  --retention-in-days 90

# Get instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show --app $APPINSIGHTS_NAME --resource-group $RESOURCE_GROUP --query instrumentationKey -o tsv)
APPINSIGHTS_CONN=$(az monitor app-insights component show --app $APPINSIGHTS_NAME --resource-group $RESOURCE_GROUP --query connectionString -o tsv)

# Set in App Service
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONN" \
    ApplicationInsightsAgent_EXTENSION_VERSION="~3"

# Create alerts
# Alert: High error rate (>5% of requests return 5xx)
az monitor metrics alert create \
  --name "eusotrip-high-error-rate" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
  --condition "avg Http5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "EusoTrip: High 5xx error rate detected"

# Alert: High response time (>3 seconds average)
az monitor metrics alert create \
  --name "eusotrip-high-latency" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
  --condition "avg HttpResponseTime > 3" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 3 \
  --description "EusoTrip: High response time detected"
```

---

## 10. Azure Front Door + WAF (CDN & Protection)

For DDoS protection, global CDN, and Web Application Firewall:

```bash
# Create Front Door profile
az afd profile create \
  --profile-name "fd-eusotrip" \
  --resource-group $RESOURCE_GROUP \
  --sku Premium_AzureFrontDoor

# Create endpoint
az afd endpoint create \
  --endpoint-name "eusotrip" \
  --profile-name "fd-eusotrip" \
  --resource-group $RESOURCE_GROUP

# Create origin group (points to App Service)
az afd origin-group create \
  --origin-group-name "eusotrip-origin" \
  --profile-name "fd-eusotrip" \
  --resource-group $RESOURCE_GROUP \
  --probe-request-type GET \
  --probe-protocol Https \
  --probe-path "/api/trpc/health" \
  --probe-interval-in-seconds 30

# Create origin
az afd origin create \
  --origin-name "eusotrip-app" \
  --origin-group-name "eusotrip-origin" \
  --profile-name "fd-eusotrip" \
  --resource-group $RESOURCE_GROUP \
  --host-name "${APP_NAME}.azurewebsites.net" \
  --origin-host-header "${APP_NAME}.azurewebsites.net" \
  --http-port 80 \
  --https-port 443 \
  --priority 1

# Create WAF policy (OWASP 3.2 rules + bot protection)
az network front-door waf-policy create \
  --name "wafEusotrip" \
  --resource-group $RESOURCE_GROUP \
  --sku Premium_AzureFrontDoor \
  --mode Prevention

# Enable managed rule sets
az network front-door waf-policy managed-rules add \
  --policy-name "wafEusotrip" \
  --resource-group $RESOURCE_GROUP \
  --type Microsoft_DefaultRuleSet \
  --version 2.1 \
  --action Block

az network front-door waf-policy managed-rules add \
  --policy-name "wafEusotrip" \
  --resource-group $RESOURCE_GROUP \
  --type Microsoft_BotManagerRuleSet \
  --version 1.0 \
  --action Block

# Rate limiting rule (prevent abuse)
az network front-door waf-policy rule create \
  --name "RateLimit" \
  --policy-name "wafEusotrip" \
  --resource-group $RESOURCE_GROUP \
  --rule-type RateLimitRule \
  --rate-limit-threshold 1000 \
  --rate-limit-duration-in-minutes 1 \
  --action Block \
  --priority 100 \
  --match-condition variable=RequestUri operator=Any
```

---

## 11. CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: eusotrip-app
  NODE_VERSION: '20.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      working-directory: frontend
      run: npm ci

    - name: Build application
      working-directory: frontend
      run: npm run build
      env:
        NODE_ENV: production

    - name: Run TypeScript check
      working-directory: frontend
      run: npx tsc --noEmit --skipLibCheck

    - name: Deploy to staging slot
      uses: azure/webapps-deploy@v3
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        slot-name: staging
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
        package: frontend

    - name: Health check staging
      run: |
        sleep 30
        curl -f https://${{ env.AZURE_WEBAPP_NAME }}-staging.azurewebsites.net/ || exit 1

    - name: Swap staging to production
      uses: azure/cli@v2
      with:
        inlineScript: |
          az webapp deployment slot swap \
            --name ${{ env.AZURE_WEBAPP_NAME }} \
            --resource-group rg-eusotrip-prod \
            --slot staging \
            --target-slot production
```

### GitHub Secrets to Configure

In your GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` | Download from Azure Portal → App Service → Deployment slots → staging → Get publish profile |

---

## 12. Environment Variables Reference

All production env vars — stored in Azure Key Vault and referenced from App Service:

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | App Setting | `production` |
| `PORT` | App Setting | `8080` |
| `DATABASE_URL` | Key Vault | MySQL connection string with SSL |
| `JWT_SECRET` | Key Vault | 64-byte random string for JWT signing |
| `ENCRYPTION_KEY` | Key Vault | 32-byte random string for AES-256-GCM |
| `GEMINI_API_KEY` | Key Vault | Google Gemini API key |
| `GEMINI_MODEL` | App Setting | `gemini-2.0-flash` |
| `STRIPE_SECRET_KEY` | Key Vault | Stripe secret key (`sk_live_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Key Vault | Stripe publishable key (`pk_live_...`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Key Vault | Blob storage connection |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Setting | Application Insights |
| `CORS_ORIGIN` | App Setting | `https://eusotrip.com,https://www.eusotrip.com` |
| `AI_CONVERSATION_RETENTION_DAYS` | App Setting | `90` |
| `AI_LEARNING_DATA_RETENTION_DAYS` | App Setting | `365` |
| `AI_AUDIT_LOG_RETENTION_DAYS` | App Setting | `2555` (7 years) |

---

## 13. SOC 2 Compliance Checklist

The app now implements the following SOC 2 controls:

| Control | Implementation | File |
|---------|---------------|------|
| **CC6.1** Logical Access | JWT auth + RBAC middleware (11 roles + hierarchy) | `trpc.ts`, `auth.ts` |
| **CC6.1** Access Logging | Every auth event recorded (login, logout, failures) | `auditService.ts` |
| **CC6.2** System Monitoring | All API calls logged with user, IP, action | `auditService.ts` |
| **CC6.3** Change Management | Data changes recorded with before/after | `auditService.ts` |
| **CC7.1** System Operations | Server startup, encryption status, health checks | `index.ts` |
| **CC7.2** Incident Response | Security events (RBAC violations, brute force, PCI) | `auditService.ts` |
| **CC8.1** Data Integrity | AES-256-GCM encryption with PBKDF2 key derivation | `encryption.ts` |
| **CC8.1** Encryption Validation | Self-test at startup, production fails if broken | `index.ts` |
| Azure Audit Logs | MySQL audit logging enabled | MySQL config |
| Key Management | Secrets in Azure Key Vault with HSM | Key Vault |
| Backup & Recovery | 35-day DB backup + geo-redundant | MySQL config |
| Network Security | WAF + DDoS + rate limiting | Front Door |

---

## 14. PCI-DSS Compliance Checklist

| Requirement | Implementation | File |
|-------------|---------------|------|
| **Req 1** Network security | Azure Front Door WAF, NSGs, Private Endpoints | Azure config |
| **Req 2** Secure defaults | Security headers, HSTS, CSP, X-Frame | `security.ts` |
| **Req 3** Protect stored data | **No card data stored** — Stripe handles all card storage | `pciCompliance.ts` |
| **Req 3** Data scrubbing | PCI request guard blocks card numbers in API requests | `pciCompliance.ts` |
| **Req 4** Encrypt transmission | TLS 1.3 enforced on App Service + MySQL SSL | `index.ts`, Azure config |
| **Req 5** Malware protection | Azure Defender for App Service | Azure config |
| **Req 6** Secure development | Input sanitization, XSS protection, CSP | `security.ts` |
| **Req 7** Restrict access | RBAC with 11 roles + hierarchy + admin segregation | `trpc.ts` |
| **Req 8** Authentication | JWT tokens, bcrypt password hashing, MFA-ready | `auth.ts` |
| **Req 9** Physical security | Azure data center physical controls (SOC 1/2/3) | Azure |
| **Req 10** Logging & monitoring | Full audit trail, security events, payment events | `auditService.ts` |
| **Req 11** Security testing | Startup self-test, WAF rules, penetration testing | `encryption.ts` |
| **Req 12** Security policy | Terms of Service, Privacy Policy, this document | Legal pages |

---

## 15. Cost Estimate

Monthly cost estimate for production infrastructure:

| Resource | SKU | Est. Monthly Cost |
|----------|-----|-------------------|
| App Service Plan | P1v3 (1 core, 8GB) | ~$138 |
| MySQL Flexible Server | D2ads_v5 + HA | ~$200 |
| Azure DNS Zone | Per zone + queries | ~$1 |
| Key Vault Premium | Per operation | ~$5 |
| Blob Storage (100GB) | Standard ZRS | ~$5 |
| Application Insights | 5GB/month | ~$12 |
| Front Door Premium + WAF | Per request | ~$46 |
| Managed SSL Certificate | Free | $0 |
| **Total** | | **~$407/month** |

Costs scale with usage. Start with these tiers and adjust based on actual traffic.

---

## Quick Start Checklist

1. [ ] `az login` and set subscription
2. [ ] Create resource group in `southcentralus`
3. [ ] Create App Service Plan + Web App (P1v3, Node 20, TLS 1.3)
4. [ ] Create MySQL Flexible Server (HA, SSL enforced, audit logging)
5. [ ] Create Key Vault and store all secrets
6. [ ] Create DNS zone and update domain registrar nameservers
7. [ ] Add custom domain + managed TLS cert to App Service
8. [ ] Create Blob Storage for document uploads
9. [ ] Create Application Insights for monitoring
10. [ ] Create Front Door + WAF for CDN and DDoS protection
11. [ ] Set up GitHub Actions for CI/CD
12. [ ] Run `npm run build` and deploy to staging
13. [ ] Verify staging, swap to production
14. [ ] Run Drizzle migrations against production MySQL
15. [ ] Verify all security layers in production logs

---

*Document Version: 1.0 | Created: February 2025 | Eusorone Technologies Inc.*
