---
description: Deploy EusoTrip to Azure App Service (eusotrip.com & eusorone.com)
---

## Prerequisites
- Azure CLI logged in (`az login`)
- Build completed successfully (`npm run build` in frontend/)

## Steps

1. Build the frontend
// turbo
```bash
cd /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend && npm run build
```

2. Rebuild src-snapshot (MCP server reads from this — MUST stay current)
// turbo
```bash
cd /Users/diegousoro/Desktop/eusoronetechnologiesinc && rm -rf frontend/dist/src-snapshot && mkdir -p frontend/dist/src-snapshot && rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='venv' --exclude='__pycache__' --exclude='.DS_Store' --exclude='*.zip' frontend/ frontend/dist/src-snapshot/frontend/ && rsync -a --exclude='node_modules' --exclude='.git' --exclude='venv' --exclude='__pycache__' --exclude='.DS_Store' backend/ frontend/dist/src-snapshot/backend/ && rsync -a --exclude='.DS_Store' docs/ frontend/dist/src-snapshot/docs/ && rsync -a --exclude='node_modules' --exclude='.git' --exclude='venv' --exclude='__pycache__' --exclude='.DS_Store' services/ frontend/dist/src-snapshot/services/ && cp README.md .gitignore AZURE_INFRASTRUCTURE_SETUP.md AWS_INFRASTRUCTURE_SETUP.md EUSOTRIPDEVELOPMENT_TEAMDELTAMARCHINGORDERS_SUMMARY.md EUSOTRIP_V9_REVENUE_STREAMS.md REPO_STRUCTURE_ARCHIVE.md frontend/dist/src-snapshot/ 2>/dev/null; echo "src-snapshot rebuilt from current source"
```

3. Create the deployment zip
// turbo
```bash
rm -f /tmp/eusotrip-slim.zip && cd /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend && zip -r /tmp/eusotrip-slim.zip dist/ package.json
```

4. Upload zip to Azure Blob Storage
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S) && az storage blob upload --account-name eusotripdeploy --container-name deployments --name "eusotrip-slim-${TIMESTAMP}.zip" --file /tmp/eusotrip-slim.zip --overwrite
```

5. Generate SAS URL (1 year expiry)
```bash
BLOB_NAME="eusotrip-slim-${TIMESTAMP}.zip" && EXPIRY=$(date -u -v+1y +"%Y-%m-%dT%H:%M:%SZ") && SAS_URL=$(az storage blob generate-sas --account-name eusotripdeploy --container-name deployments --name "$BLOB_NAME" --permissions r --expiry "$EXPIRY" --full-uri --output tsv) && echo "$SAS_URL"
```

6. Update WEBSITE_RUN_FROM_PACKAGE app setting with the new SAS URL
```bash
az webapp config appsettings set --resource-group eusotrip-prod --name eusotrip-app --settings "WEBSITE_RUN_FROM_PACKAGE=$SAS_URL" --output table
```

7. Restart the app
```bash
az webapp restart --resource-group eusotrip-prod --name eusotrip-app
```

8. Verify deployment on both domains (wait ~20s for cold start)
// turbo
```bash
sleep 20 && echo "eusotrip.com: $(curl -s -o /dev/null -w '%{http_code}' https://eusotrip.com/)" && echo "eusorone.com (redirect): $(curl -s -o /dev/null -w '%{http_code}' https://eusorone.com/)" && echo "eusorone.com (final): $(curl -s -o /dev/null -w '%{http_code}' --resolve eusorone.com:443:20.42.128.96 -L https://eusorone.com/)"
```

## Key Details
- **Resource Group:** `eusotrip-prod`
- **App Name:** `eusotrip-app`
- **Storage Account:** `eusotripdeploy`
- **Container:** `deployments`
- **Custom Domains:** `eusotrip.com` (primary), `eusorone.com` (redirects to eusotrip.com via 301)
- **Deploy Method:** `WEBSITE_RUN_FROM_PACKAGE` pointing to blob SAS URL
