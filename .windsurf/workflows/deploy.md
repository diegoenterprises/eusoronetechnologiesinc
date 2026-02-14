---
description: Deploy EusoTrip to Azure App Service (eusotrip.com)
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

2. Create the deployment zip
// turbo
```bash
rm -f /tmp/eusotrip-slim.zip && cd /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend && zip -r /tmp/eusotrip-slim.zip dist/ package.json
```

3. Upload zip to Azure Blob Storage
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S) && az storage blob upload --account-name eusotripdeploy --container-name deployments --name "eusotrip-slim-${TIMESTAMP}.zip" --file /tmp/eusotrip-slim.zip --overwrite
```

4. Generate SAS URL (1 year expiry)
```bash
BLOB_NAME="eusotrip-slim-${TIMESTAMP}.zip" && EXPIRY=$(date -u -v+1y +"%Y-%m-%dT%H:%M:%SZ") && SAS_URL=$(az storage blob generate-sas --account-name eusotripdeploy --container-name deployments --name "$BLOB_NAME" --permissions r --expiry "$EXPIRY" --full-uri --output tsv) && echo "$SAS_URL"
```

5. Update WEBSITE_RUN_FROM_PACKAGE app setting with the new SAS URL
```bash
az webapp config appsettings set --resource-group eusotrip-prod --name eusotrip-app --settings "WEBSITE_RUN_FROM_PACKAGE=$SAS_URL" --output table
```

6. Restart the app
```bash
az webapp restart --resource-group eusotrip-prod --name eusotrip-app
```

7. Verify deployment (wait ~20s for cold start)
// turbo
```bash
sleep 20 && curl -s -o /dev/null -w "HTTP %{http_code}" https://eusotrip.com/
```

## Key Details
- **Resource Group:** `eusotrip-prod`
- **App Name:** `eusotrip-app`
- **Storage Account:** `eusotripdeploy`
- **Container:** `deployments`
- **Custom Domain:** `eusotrip.com`
- **Deploy Method:** `WEBSITE_RUN_FROM_PACKAGE` pointing to blob SAS URL
