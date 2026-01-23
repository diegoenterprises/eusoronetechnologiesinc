# Azure Infrastructure Setup Guide for EusoTrip Frontend

**Complete guide for deploying and managing EusoTrip Frontend on Microsoft Azure**

---

## Table of Contents

1. [Azure Account & Subscription Setup](#azure-account--subscription-setup)
2. [Resource Group & Organization](#resource-group--organization)
3. [Azure SQL Database Setup](#azure-sql-database-setup)
4. [Azure App Service (Web App)](#azure-app-service-web-app)
5. [Azure Storage Account (Blob Storage)](#azure-storage-account-blob-storage)
6. [Azure CDN](#azure-cdn)
7. [Azure DNS & Custom Domains](#azure-dns--custom-domains)
8. [Azure Key Vault (Secrets Management)](#azure-key-vault-secrets-management)
9. [Azure Monitor & Alerts](#azure-monitor--alerts)
10. [Azure DevOps CI/CD Pipeline](#azure-devops-cicd-pipeline)
11. [Azure Virtual Network & Security](#azure-virtual-network--security)
12. [Backup & Disaster Recovery](#backup--disaster-recovery)
13. [Cost Optimization](#cost-optimization)
14. [Azure RBAC Permissions](#azure-rbac-permissions)
15. [Troubleshooting Guide](#troubleshooting-guide)
16. [Quick Reference](#quick-reference)

---

## Azure Account & Subscription Setup

### Prerequisites

- Microsoft Azure account (create at https://azure.microsoft.com)
- Azure CLI installed (`az` command)
- Visual Studio Code with Azure extensions (optional)
- Node.js 18+ installed locally

### Initial Setup

```bash
# Login to Azure
az login

# List available subscriptions
az account list --output table

# Set active subscription
az account set --subscription "<SUBSCRIPTION_ID>"

# Verify subscription
az account show

# Install Azure CLI extensions
az extension add --name containerapp
az extension add --name storage-preview
```

### Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="eusotrip-rg"
LOCATION="eastus"  # or your preferred region

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Verify creation
az group show --name $RESOURCE_GROUP
```

---

## Resource Group & Organization

### Naming Convention

```
Resource Type | Naming Pattern | Example
---|---|---
Resource Group | {app}-{env}-rg | eusotrip-prod-rg
SQL Database | {app}-{env}-db | eusotrip-prod-db
App Service | {app}-{env}-app | eusotrip-prod-app
Storage Account | {app}{env}sa | eusotripsa
Key Vault | {app}-{env}-kv | eusotrip-prod-kv
CDN Profile | {app}-{env}-cdn | eusotrip-prod-cdn
Virtual Network | {app}-{env}-vnet | eusotrip-prod-vnet
```

### Create Resource Group Structure

```bash
# Production resource group
az group create --name eusotrip-prod-rg --location eastus

# Staging resource group
az group create --name eusotrip-staging-rg --location eastus

# Development resource group
az group create --name eusotrip-dev-rg --location eastus

# List all resource groups
az group list --output table
```

---

## Azure SQL Database Setup

### Create SQL Server

```bash
# Set variables
SQL_SERVER="eusotrip-prod-server"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="<STRONG_PASSWORD_HERE>"  # Min 8 chars, uppercase, lowercase, numbers, special chars
RESOURCE_GROUP="eusotrip-prod-rg"
LOCATION="eastus"

# Create SQL Server
az sql server create \
  --name $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $SQL_ADMIN_USER \
  --admin-password $SQL_ADMIN_PASSWORD \
  --enable-ad-only-auth false

# Verify server creation
az sql server show --name $SQL_SERVER --resource-group $RESOURCE_GROUP
```

### Create SQL Database

```bash
# Set variables
SQL_DATABASE="eusotrip-prod"
SQL_EDITION="Standard"  # Basic, Standard, Premium
SQL_CAPACITY="S1"  # DTU capacity

# Create database
az sql db create \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --edition $SQL_EDITION \
  --capacity $SQL_CAPACITY \
  --backup-storage-redundancy Geo

# Verify database creation
az sql db show --name $SQL_DATABASE --server $SQL_SERVER --resource-group $RESOURCE_GROUP
```

### Configure Firewall Rules

```bash
# Allow Azure services
az sql server firewall-rule create \
  --name AllowAzureServices \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your office IP
az sql server firewall-rule create \
  --name AllowOfficeIP \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --start-ip-address <YOUR_IP> \
  --end-ip-address <YOUR_IP>

# List firewall rules
az sql server firewall-rule list --server $SQL_SERVER --resource-group $RESOURCE_GROUP
```

### Get Connection String

```bash
# Get connection string
az sql db show-connection-string \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --client sqlcmd

# Format for Node.js (mssql or tedious driver):
# Server=tcp:eusotrip-prod-server.database.windows.net,1433;Initial Catalog=eusotrip-prod;Persist Security Info=False;User ID=sqladmin;Password=<PASSWORD>;Encrypt=True;Connection Timeout=30;
```

### Enable Transparent Data Encryption (TDE)

```bash
# Enable TDE
az sql db tde set \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --status Enabled

# Verify TDE status
az sql db tde show \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP
```

### Configure Backup Retention

```bash
# Set short-term retention (7-35 days)
az sql db short-term-retention-policy set \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --retention-days 30

# Set long-term retention (1-10 years)
az sql db ltr-backup-set \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --weekly-retention P4W \
  --monthly-retention P12M \
  --yearly-retention P5Y \
  --week-of-year 1
```

### Database Migration from Manus Sandbox

```bash
# 1. Export from Manus Sandbox (using mysqldump)
mysqldump -h <MANUS_HOST> -u <MANUS_USER> -p<MANUS_PASSWORD> \
  --all-databases > eusotrip_backup.sql

# 2. Convert MySQL to SQL Server (if needed)
# Use Azure Database Migration Service or manual conversion

# 3. Import to Azure SQL
sqlcmd -S eusotrip-prod-server.database.windows.net \
  -U sqladmin \
  -P <PASSWORD> \
  -i eusotrip_backup.sql

# 4. Verify data
sqlcmd -S eusotrip-prod-server.database.windows.net \
  -U sqladmin \
  -P <PASSWORD> \
  -Q "SELECT COUNT(*) FROM users;"
```

---

## Azure App Service (Web App)

### Create App Service Plan

```bash
# Set variables
APP_SERVICE_PLAN="eusotrip-prod-plan"
SKU="B2"  # B1, B2, B3 for Basic; S1, S2, S3 for Standard; P1V2, P2V2 for Premium

# Create App Service Plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku $SKU \
  --is-linux

# Verify plan
az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP
```

### Create Web App

```bash
# Set variables
WEB_APP_NAME="eusotrip-prod-app"
RUNTIME="node|18-lts"  # Node.js 18 LTS

# Create web app
az webapp create \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime $RUNTIME

# Get default URL
az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName
```

### Configure Application Settings

```bash
# Set environment variables
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://eusotrip-prod-kv.vault.azure.net/secrets/database-url/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://eusotrip-prod-kv.vault.azure.net/secrets/jwt-secret/)" \
    VITE_APP_ID="<YOUR_APP_ID>" \
    VITE_APP_TITLE="EusoTrip" \
    VITE_APP_LOGO="https://eusotrip-prod-cdn.azureedge.net/logo.png"

# Verify settings
az webapp config appsettings list --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

### Enable Managed Identity

```bash
# Assign system-managed identity
az webapp identity assign \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get identity object ID
IDENTITY_ID=$(az webapp identity show \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

echo "Identity ID: $IDENTITY_ID"
```

### Deploy Application

```bash
# Option 1: Deploy from GitHub using GitHub Actions
# (Configure in Azure Portal → Deployment Center)

# Option 2: Deploy using Azure CLI
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --src app.zip

# Option 3: Deploy using Git
git remote add azure https://$WEB_APP_NAME.scm.azurewebsites.net:443/$WEB_APP_NAME.git
git push azure main

# Check deployment status
az webapp deployment list --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

### Configure Continuous Deployment

```bash
# Enable App Service build
az webapp config set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm start"

# Enable logging
az webapp log config \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --web-server-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true
```

---

## Azure Storage Account (Blob Storage)

### Create Storage Account

```bash
# Set variables
STORAGE_ACCOUNT="eusotripsa"  # Must be globally unique, lowercase
STORAGE_SKU="Standard_LRS"  # Standard_LRS, Standard_GRS, Premium_LRS

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku $STORAGE_SKU \
  --kind StorageV2 \
  --access-tier Hot \
  --https-only true \
  --min-tls-version TLS1_2

# Verify creation
az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP
```

### Create Blob Containers

```bash
# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query [0].value -o tsv)

# Create main container for application files
az storage container create \
  --name app-files \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access off

# Create container for user uploads
az storage container create \
  --name user-uploads \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access off

# Create container for logs
az storage container create \
  --name logs \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access off

# List containers
az storage container list --account-name $STORAGE_ACCOUNT --account-key $STORAGE_KEY
```

### Configure CORS

```bash
# Enable CORS for web app
az storage cors add \
  --services b \
  --methods GET HEAD PUT POST DELETE \
  --origins "https://eusotrip-prod-app.azurewebsites.net" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY
```

### Enable Lifecycle Management

```bash
# Create lifecycle policy JSON
cat > lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "name": "DeleteOldLogs",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["logs/"]
        },
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        }
      }
    },
    {
      "name": "ArchiveOldFiles",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["app-files/"]
        },
        "actions": {
          "baseBlob": {
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 180
            }
          }
        }
      }
    }
  ]
}
EOF

# Apply lifecycle policy
az storage account management-policy create \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --policy @lifecycle-policy.json
```

### Configure Blob Storage Connection

```bash
# Get connection string
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString -o tsv)

echo "Connection String: $STORAGE_CONNECTION"

# Store in Key Vault
az keyvault secret set \
  --vault-name eusotrip-prod-kv \
  --name storage-connection-string \
  --value "$STORAGE_CONNECTION"
```

### Upload Initial Files

```bash
# Upload logo
az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name app-files \
  --name logo.png \
  --file ./logo.png \
  --account-key $STORAGE_KEY

# Generate SAS URL for file
EXPIRY=$(date -u -d "+1 year" +%Y-%m-%dT%H:%M:%SZ)
SAS_URL=$(az storage blob generate-sas \
  --account-name $STORAGE_ACCOUNT \
  --container-name app-files \
  --name logo.png \
  --permissions r \
  --expiry $EXPIRY \
  --account-key $STORAGE_KEY \
  --full-uri)

echo "SAS URL: $SAS_URL"
```

---

## Azure CDN

### Create CDN Profile

```bash
# Set variables
CDN_PROFILE="eusotrip-prod-cdn"
CDN_ENDPOINT="eusotrip-prod"

# Create CDN profile
az cdn profile create \
  --name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_Microsoft

# Verify creation
az cdn profile show --name $CDN_PROFILE --resource-group $RESOURCE_GROUP
```

### Create CDN Endpoint

```bash
# Create endpoint for storage account
az cdn endpoint create \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --origin eusotripsa.blob.core.windows.net \
  --origin-host-header eusotripsa.blob.core.windows.net \
  --enable-https true

# Verify endpoint
az cdn endpoint show \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP
```

### Configure Caching Rules

```bash
# Create caching rules
az cdn endpoint rule add \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --order 1 \
  --action ModifyResponseHeader \
  --header-action Append \
  --header-name Cache-Control \
  --header-value "public, max-age=31536000"

# Query string caching
az cdn endpoint rule add \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --order 2 \
  --action ModifyResponseHeader \
  --header-action Append \
  --header-name Cache-Control \
  --header-value "public, max-age=3600"
```

### Purge Cache

```bash
# Purge all content
az cdn endpoint purge \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --content-paths "/*"

# Purge specific path
az cdn endpoint purge \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --content-paths "/images/*" "/css/*"
```

---

## Azure DNS & Custom Domains

### Create DNS Zone

```bash
# Set variables
DNS_ZONE="eusotrip.com"

# Create DNS zone
az network dns zone create \
  --name $DNS_ZONE \
  --resource-group $RESOURCE_GROUP

# Verify creation
az network dns zone show --name $DNS_ZONE --resource-group $RESOURCE_GROUP

# Get nameservers
az network dns zone show \
  --name $DNS_ZONE \
  --resource-group $RESOURCE_GROUP \
  --query nameServers
```

### Configure DNS Records

```bash
# Create A record for web app
az network dns record-set a add-record \
  --zone-name $DNS_ZONE \
  --resource-group $RESOURCE_GROUP \
  --name www \
  --ipv4-address <APP_SERVICE_IP>

# Create CNAME record for CDN
az network dns record-set cname set-record \
  --zone-name $DNS_ZONE \
  --resource-group $RESOURCE_GROUP \
  --name cdn \
  --cname eusotrip-prod.azureedge.net

# Create MX record for email
az network dns record-set mx add-record \
  --zone-name $DNS_ZONE \
  --resource-group $RESOURCE_GROUP \
  --exchange mail.eusotrip.com \
  --preference 10

# Create TXT record for SPF
az network dns record-set txt add-record \
  --zone-name $DNS_ZONE \
  --resource-group $RESOURCE_GROUP \
  --name "@" \
  --value "v=spf1 include:_spf.google.com ~all"

# List all records
az network dns record-set list --zone-name $DNS_ZONE --resource-group $RESOURCE_GROUP
```

### Add Custom Domain to App Service

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname www.eusotrip.com

# Verify hostname
az webapp config hostname list \
  --webapp-name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Add Custom Domain to CDN

```bash
# Add custom domain to CDN endpoint
az cdn custom-domain create \
  --endpoint-name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --name eusotrip-cdn \
  --hostname cdn.eusotrip.com
```

---

## Azure Key Vault (Secrets Management)

### Create Key Vault

```bash
# Set variables
KEY_VAULT="eusotrip-prod-kv"

# Create Key Vault
az keyvault create \
  --name $KEY_VAULT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-soft-delete true \
  --soft-delete-retention-days 90 \
  --enable-purge-protection false

# Verify creation
az keyvault show --name $KEY_VAULT --resource-group $RESOURCE_GROUP
```

### Store Secrets

```bash
# Store database connection string
az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name database-url \
  --value "Server=tcp:eusotrip-prod-server.database.windows.net,1433;Initial Catalog=eusotrip-prod;Persist Security Info=False;User ID=sqladmin;Password=<PASSWORD>;Encrypt=True;Connection Timeout=30;"

# Store JWT secret
az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name jwt-secret \
  --value "<RANDOM_JWT_SECRET_HERE>"

# Store OAuth credentials
az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name oauth-client-id \
  --value "<OAUTH_CLIENT_ID>"

az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name oauth-client-secret \
  --value "<OAUTH_CLIENT_SECRET>"

# Store Stripe keys
az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name stripe-secret-key \
  --value "<STRIPE_SECRET_KEY>"

az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name stripe-publishable-key \
  --value "<STRIPE_PUBLISHABLE_KEY>"

# List all secrets
az keyvault secret list --vault-name $KEY_VAULT
```

### Grant App Service Access to Key Vault

```bash
# Get App Service managed identity
IDENTITY_ID=$(az webapp identity show \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

# Grant access to Key Vault
az keyvault set-policy \
  --name $KEY_VAULT \
  --object-id $IDENTITY_ID \
  --secret-permissions get list \
  --certificate-permissions get list

# Verify policy
az keyvault show --name $KEY_VAULT --resource-group $RESOURCE_GROUP
```

### Reference Secrets in App Service

```bash
# Update app settings to reference Key Vault
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT.vault.azure.net/secrets/database-url/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT.vault.azure.net/secrets/jwt-secret/)" \
    OAUTH_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT.vault.azure.net/secrets/oauth-client-id/)" \
    STRIPE_SECRET_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT.vault.azure.net/secrets/stripe-secret-key/)"
```

---

## Azure Monitor & Alerts

### Enable Application Insights

```bash
# Set variables
APP_INSIGHTS="eusotrip-prod-insights"

# Create Application Insights
az monitor app-insights component create \
  --app $APP_INSIGHTS \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $APP_INSIGHTS \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

echo "Instrumentation Key: $INSTRUMENTATION_KEY"
```

### Link Application Insights to App Service

```bash
# Link to web app
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY \
    ApplicationInsightsAgent_EXTENSION_VERSION="~3"
```

### Create Action Group for Alerts

```bash
# Create action group
az monitor action-group create \
  --name eusotrip-alerts \
  --resource-group $RESOURCE_GROUP \
  --short-name eusotrip

# Add email notification
az monitor action-group update \
  --name eusotrip-alerts \
  --resource-group $RESOURCE_GROUP \
  --add-action email admin-email --email-receiver admin@eusotrip.com
```

### Create Metric Alerts

```bash
# CPU utilization alert
az monitor metrics alert create \
  --name "High CPU Usage" \
  --resource-group $RESOURCE_GROUP \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/serverfarms/$APP_SERVICE_PLAN \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action eusotrip-alerts

# Database DTU alert
az monitor metrics alert create \
  --name "High Database DTU" \
  --resource-group $RESOURCE_GROUP \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER/databases/$SQL_DATABASE \
  --condition "avg dtu_consumption_percent > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action eusotrip-alerts

# Storage account alert
az monitor metrics alert create \
  --name "High Storage Usage" \
  --resource-group $RESOURCE_GROUP \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT \
  --condition "avg UsedCapacity > 800000000000" \
  --window-size 1h \
  --evaluation-frequency 30m \
  --action eusotrip-alerts
```

### Create Log Alerts

```bash
# Create log alert for application errors
az monitor log-analytics query \
  --workspace /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP/providers/microsoft.operationalinsights/workspaces/eusotrip-logs \
  --analytics-query "traces | where severityLevel >= 2 | summarize count() by bin(timestamp, 5m)"
```

---

## Azure DevOps CI/CD Pipeline

### Create Azure DevOps Project

```bash
# Set variables
DEVOPS_ORG="https://dev.azure.com/your-org"
DEVOPS_PROJECT="eusotrip"

# Create project (via Azure Portal or CLI)
# Navigate to https://dev.azure.com and create new project

# Clone repository
git clone https://dev.azure.com/your-org/eusotrip/_git/eusotrip-frontend
cd eusotrip-frontend
```

### Create CI/CD Pipeline YAML

```yaml
# File: azure-pipelines.yml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  buildConfiguration: 'Release'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npm run lint
            displayName: 'Run Linter'

          - script: npm run build
            displayName: 'Build Application'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'
            displayName: 'Publish Artifacts'

  - stage: Test
    displayName: 'Test Stage'
    dependsOn: Build
    jobs:
      - job: TestJob
        displayName: 'Run Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install Dependencies'

          - script: npm run test
            displayName: 'Run Unit Tests'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/junit.xml'
            displayName: 'Publish Test Results'

  - stage: Deploy_Staging
    displayName: 'Deploy to Staging'
    dependsOn: Test
    condition: succeeded()
    jobs:
      - deployment: DeployStaging
        displayName: 'Deploy to Staging Environment'
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure Subscription'
                    appType: 'webAppLinux'
                    appName: 'eusotrip-staging-app'
                    package: '$(Pipeline.Workspace)/drop'
                    startupCommand: 'npm start'
                  displayName: 'Deploy to Staging'

  - stage: Deploy_Production
    displayName: 'Deploy to Production'
    dependsOn: Deploy_Staging
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProduction
        displayName: 'Deploy to Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure Subscription'
                    appType: 'webAppLinux'
                    appName: 'eusotrip-prod-app'
                    package: '$(Pipeline.Workspace)/drop'
                    startupCommand: 'npm start'
                  displayName: 'Deploy to Production'

                - task: AzureCLI@2
                  inputs:
                    azureSubscription: 'Azure Subscription'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      az cdn endpoint purge \
                        --name eusotrip-prod \
                        --profile-name eusotrip-prod-cdn \
                        --resource-group eusotrip-prod-rg \
                        --content-paths "/*"
                  displayName: 'Purge CDN Cache'
```

### Create Pipeline in Azure DevOps

```bash
# Create pipeline from YAML
az pipelines create \
  --name eusotrip-pipeline \
  --repository eusotrip-frontend \
  --repository-type tfsgit \
  --branch main \
  --yaml-path azure-pipelines.yml \
  --project $DEVOPS_PROJECT \
  --organization $DEVOPS_ORG
```

---

## Azure Virtual Network & Security

### Create Virtual Network

```bash
# Set variables
VNET="eusotrip-prod-vnet"
SUBNET="eusotrip-prod-subnet"
VNET_PREFIX="10.0.0.0/16"
SUBNET_PREFIX="10.0.1.0/24"

# Create virtual network
az network vnet create \
  --name $VNET \
  --resource-group $RESOURCE_GROUP \
  --address-prefix $VNET_PREFIX \
  --subnet-name $SUBNET \
  --subnet-prefix $SUBNET_PREFIX

# Verify creation
az network vnet show --name $VNET --resource-group $RESOURCE_GROUP
```

### Create Network Security Group

```bash
# Set variables
NSG="eusotrip-prod-nsg"

# Create NSG
az network nsg create \
  --name $NSG \
  --resource-group $RESOURCE_GROUP

# Allow HTTP
az network nsg rule create \
  --name AllowHTTP \
  --nsg-name $NSG \
  --resource-group $RESOURCE_GROUP \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes "*" \
  --destination-port-ranges 80

# Allow HTTPS
az network nsg rule create \
  --name AllowHTTPS \
  --nsg-name $NSG \
  --resource-group $RESOURCE_GROUP \
  --priority 101 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes "*" \
  --destination-port-ranges 443

# Allow SSH (restricted to admin IPs)
az network nsg rule create \
  --name AllowSSH \
  --nsg-name $NSG \
  --resource-group $RESOURCE_GROUP \
  --priority 102 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes "<ADMIN_IP>/32" \
  --destination-port-ranges 22

# Deny all other inbound
az network nsg rule create \
  --name DenyAllInbound \
  --nsg-name $NSG \
  --resource-group $RESOURCE_GROUP \
  --priority 4096 \
  --direction Inbound \
  --access Deny \
  --protocol "*" \
  --source-address-prefixes "*" \
  --destination-address-prefixes "*" \
  --destination-port-ranges "*"

# List rules
az network nsg rule list --nsg-name $NSG --resource-group $RESOURCE_GROUP
```

### Associate NSG with Subnet

```bash
# Associate NSG with subnet
az network vnet subnet update \
  --name $SUBNET \
  --vnet-name $VNET \
  --resource-group $RESOURCE_GROUP \
  --network-security-group $NSG
```

### Enable DDoS Protection

```bash
# Create DDoS protection plan
az network ddos-protection create \
  --name eusotrip-ddos-plan \
  --resource-group $RESOURCE_GROUP

# Enable on virtual network
az network vnet update \
  --name $VNET \
  --resource-group $RESOURCE_GROUP \
  --ddos-protection-plan eusotrip-ddos-plan
```

---

## Backup & Disaster Recovery

### SQL Database Backups

```bash
# View backup retention policy
az sql db short-term-retention-policy show \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP

# Create manual backup
az sql db copy \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --dest-name eusotrip-prod-backup-$(date +%Y%m%d) \
  --dest-server $SQL_SERVER

# List backups
az sql db list-backups \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP

# Restore from backup
az sql db restore \
  --name $SQL_DATABASE \
  --server $SQL_SERVER \
  --resource-group $RESOURCE_GROUP \
  --backup-name <BACKUP_NAME> \
  --time <RESTORE_TIME>
```

### Blob Storage Backups

```bash
# Enable versioning
az storage account blob-service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --enable-change-feed true \
  --enable-versioning true

# Enable soft delete
az storage account blob-service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --enable-delete-retention true \
  --delete-retention-days 30
```

### Disaster Recovery Plan

```
RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 15 minutes

1. Database Failover
   - Azure SQL Database automatic failover group
   - Geo-replicated backups
   - Recovery procedures documented

2. Application Failover
   - Traffic Manager for multi-region failover
   - App Service deployment slots
   - Automated failover testing monthly

3. Data Recovery
   - Point-in-time restore (35 days)
   - Blob versioning and soft delete
   - Cross-region replication

4. Communication Plan
   - Notify stakeholders
   - Update status page
   - Post-incident review
```

---

## Cost Optimization

### Resource Sizing Recommendations

```
Service | Current | Recommended | Monthly Savings
---|---|---|---
App Service Plan | B2 | B1 | $30
SQL Database | S1 | Basic | $50
Storage Account | Standard_GRS | Standard_LRS | $20
CDN | Standard_Microsoft | Standard_Akamai | $15
Total Monthly Savings: ~$115
```

### Reserved Instances

```bash
# Purchase 1-year reserved instance for App Service Plan
az reservations purchase \
  --sku "B1" \
  --scope Shared \
  --term P1Y \
  --billing-scope /subscriptions/<SUBSCRIPTION_ID>

# View reserved instances
az reservations list --subscription <SUBSCRIPTION_ID>
```

### Cost Analysis

```bash
# Get cost breakdown by service
az costmanagement query \
  --timeframe MonthToDate \
  --type Usage \
  --dataset granularity=Daily \
  --aggregation totalCost

# Set budget alert
az costmanagement budget create \
  --name eusotrip-monthly-budget \
  --amount 500 \
  --category Cost \
  --time-period start=2024-01-01 end=2024-12-31
```

---

## Azure RBAC Permissions

### Create Custom Role for Development Team

```json
{
  "Name": "EusoTrip Developer",
  "IsCustom": true,
  "Description": "Custom role for EusoTrip development team",
  "Actions": [
    "Microsoft.Web/sites/*",
    "Microsoft.Web/serverfarms/*",
    "Microsoft.Sql/servers/databases/*",
    "Microsoft.Storage/storageAccounts/blobServices/containers/*",
    "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action",
    "Microsoft.Cdn/profiles/endpoints/*",
    "Microsoft.Network/dnsZones/*",
    "Microsoft.KeyVault/vaults/secrets/read",
    "Microsoft.KeyVault/vaults/secrets/list",
    "Microsoft.Monitor/actionGroups/*",
    "Microsoft.Insights/components/*",
    "Microsoft.DevOps/pipelines/*"
  ],
  "NotActions": [
    "Microsoft.Authorization/*/Delete",
    "Microsoft.Authorization/*/Write",
    "Microsoft.Sql/servers/delete",
    "Microsoft.Storage/storageAccounts/delete"
  ],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/eusotrip-prod-rg"
  ]
}
```

### Assign Role to Development Team

```bash
# Create resource group for dev team
az group create --name eusotrip-dev-team --location eastus

# Assign custom role to user
az role assignment create \
  --role "EusoTrip Developer" \
  --assignee <USER_EMAIL> \
  --resource-group eusotrip-prod-rg

# Assign built-in roles
az role assignment create \
  --role "Contributor" \
  --assignee <USER_EMAIL> \
  --resource-group eusotrip-dev-rg

# List role assignments
az role assignment list --resource-group eusotrip-prod-rg
```

### Service Principal for CI/CD

```bash
# Create service principal
az ad sp create-for-rbac \
  --name eusotrip-cicd-sp \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/eusotrip-prod-rg

# Output will include:
# {
#   "appId": "...",
#   "displayName": "eusotrip-cicd-sp",
#   "password": "...",
#   "tenant": "..."
# }

# Store in Azure DevOps secrets
# Use in CI/CD pipeline for authentication
```

---

## Troubleshooting Guide

### App Service Issues

```bash
# Check app service status
az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# View recent logs
az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# Restart app service
az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# Check deployment status
az webapp deployment list --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# View application settings
az webapp config appsettings list --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

### Database Connection Issues

```bash
# Check SQL Server firewall rules
az sql server firewall-rule list --server $SQL_SERVER --resource-group $RESOURCE_GROUP

# Test connection string
sqlcmd -S eusotrip-prod-server.database.windows.net \
  -U sqladmin \
  -P <PASSWORD> \
  -Q "SELECT @@VERSION;"

# Check database status
az sql db show --name $SQL_DATABASE --server $SQL_SERVER --resource-group $RESOURCE_GROUP

# View database metrics
az monitor metrics list \
  --resource /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Sql/servers/$SQL_SERVER/databases/$SQL_DATABASE \
  --metric dtu_consumption_percent
```

### Storage Account Issues

```bash
# Check storage account status
az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP

# View storage account keys
az storage account keys list --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP

# Check CORS configuration
az storage cors list --account-name $STORAGE_ACCOUNT

# Test blob upload
az storage blob upload \
  --account-name $STORAGE_ACCOUNT \
  --container-name app-files \
  --name test.txt \
  --file test.txt
```

### CDN Issues

```bash
# Check CDN endpoint status
az cdn endpoint show --name $CDN_ENDPOINT --profile-name $CDN_PROFILE --resource-group $RESOURCE_GROUP

# Purge CDN cache
az cdn endpoint purge \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --content-paths "/*"

# Check CDN origin
az cdn endpoint origin list \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP
```

### Key Vault Access Issues

```bash
# Check Key Vault access policies
az keyvault show --name $KEY_VAULT --resource-group $RESOURCE_GROUP

# Grant access to user
az keyvault set-policy \
  --name $KEY_VAULT \
  --object-id <USER_OBJECT_ID> \
  --secret-permissions get list set delete

# Test secret retrieval
az keyvault secret show \
  --vault-name $KEY_VAULT \
  --name database-url
```

---

## Quick Reference

### Essential Azure CLI Commands

```bash
# Authentication
az login
az account list
az account set --subscription "<SUBSCRIPTION_ID>"

# Resource Groups
az group list
az group create --name <RG_NAME> --location <LOCATION>
az group delete --name <RG_NAME>

# App Service
az webapp create --name <APP_NAME> --resource-group <RG> --plan <PLAN>
az webapp config appsettings set --name <APP_NAME> --resource-group <RG> --settings KEY=VALUE
az webapp deployment source config-zip --resource-group <RG> --name <APP_NAME> --src app.zip
az webapp log tail --name <APP_NAME> --resource-group <RG>

# SQL Database
az sql server create --name <SERVER> --resource-group <RG> --admin-user <USER> --admin-password <PASS>
az sql db create --name <DB> --server <SERVER> --resource-group <RG>
az sql server firewall-rule create --name <RULE> --server <SERVER> --resource-group <RG> --start-ip <IP> --end-ip <IP>

# Storage Account
az storage account create --name <ACCOUNT> --resource-group <RG> --sku Standard_LRS
az storage container create --name <CONTAINER> --account-name <ACCOUNT>
az storage blob upload --account-name <ACCOUNT> --container-name <CONTAINER> --name <NAME> --file <FILE>

# CDN
az cdn profile create --name <PROFILE> --resource-group <RG> --sku Standard_Microsoft
az cdn endpoint create --name <ENDPOINT> --profile-name <PROFILE> --resource-group <RG> --origin <ORIGIN>

# DNS
az network dns zone create --name <ZONE> --resource-group <RG>
az network dns record-set a add-record --zone-name <ZONE> --resource-group <RG> --name <NAME> --ipv4-address <IP>

# Key Vault
az keyvault create --name <VAULT> --resource-group <RG> --location <LOCATION>
az keyvault secret set --vault-name <VAULT> --name <NAME> --value <VALUE>
az keyvault secret show --vault-name <VAULT> --name <NAME>

# Monitoring
az monitor metrics alert create --name <ALERT> --resource-group <RG> --scopes <RESOURCE> --condition <CONDITION>
az monitor action-group create --name <GROUP> --resource-group <RG>
```

### Environment Variables for Application

```bash
# Database
DATABASE_URL="Server=tcp:eusotrip-prod-server.database.windows.net,1433;Initial Catalog=eusotrip-prod;Persist Security Info=False;User ID=sqladmin;Password=<PASSWORD>;Encrypt=True;Connection Timeout=30;"

# Storage
AZURE_STORAGE_ACCOUNT_NAME="eusotripsa"
AZURE_STORAGE_ACCOUNT_KEY="<STORAGE_KEY>"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=eusotripsa;AccountKey=<KEY>;EndpointSuffix=core.windows.net"

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY="<INSTRUMENTATION_KEY>"

# Application Settings
NODE_ENV="production"
VITE_APP_ID="<APP_ID>"
VITE_APP_TITLE="EusoTrip"
VITE_APP_LOGO="https://eusotrip-prod-cdn.azureedge.net/logo.png"

# OAuth
OAUTH_CLIENT_ID="<CLIENT_ID>"
OAUTH_CLIENT_SECRET="<CLIENT_SECRET>"

# JWT
JWT_SECRET="<JWT_SECRET>"

# Stripe
STRIPE_SECRET_KEY="<STRIPE_SECRET>"
STRIPE_PUBLISHABLE_KEY="<STRIPE_PUBLIC>"
```

---

## Summary

This guide provides everything your development team needs to set up, deploy, and manage the EusoTrip Frontend application on Microsoft Azure. All services are configured for production use with security, monitoring, and disaster recovery in place.

**Key Takeaways:**
- ✅ Fully automated infrastructure setup
- ✅ Production-grade security and compliance
- ✅ Comprehensive monitoring and alerting
- ✅ Disaster recovery and backup procedures
- ✅ Cost optimization strategies
- ✅ CI/CD pipeline automation
- ✅ Complete troubleshooting guide

For questions or issues, refer to the troubleshooting section or contact your Azure support team.
