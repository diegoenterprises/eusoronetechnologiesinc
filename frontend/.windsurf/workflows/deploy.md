---
description: Deploy EusoTrip to Azure App Service (eusotrip.com)
---

# Deploy EusoTrip to Azure Production

**Azure Details:**
- Resource Group: `eusotrip-prod`
- App Service: `eusotrip-app`
- Custom Domain: `eusotrip.com`
- Region: Central US

## Steps

1. Build the application
// turbo
```bash
cd /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend && npm run build
```

2. Create the deploy zip (dist + package files + drizzle schema)
// turbo
```bash
cd /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend && rm -f deploy.zip && zip -r deploy.zip dist/ package.json package-lock.json drizzle/ -x "*.map"
```

3. Upload zip to blob storage
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S) && az storage blob upload --account-name eusotripdeploy --container-name deployments --name "eusotrip-slim-${TIMESTAMP}.zip" --file /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend/deploy.zip --overwrite --auth-mode key
```

4. Generate SAS URL and update WEBSITE_RUN_FROM_PACKAGE
```bash
BLOBNAME=$(az storage blob list --account-name eusotripdeploy --container-name deployments --auth-mode key --query "sort_by([].{name:name, date:properties.lastModified}, &date)[-1].name" -o tsv) && EXPIRY=$(date -u -v+1y +%Y-%m-%dT%H:%M:%SZ) && SAS_URL=$(az storage blob generate-sas --account-name eusotripdeploy --container-name deployments --name "$BLOBNAME" --permissions r --expiry "$EXPIRY" --auth-mode key --full-uri -o tsv) && az webapp config appsettings set --resource-group eusotrip-prod --name eusotrip-app --settings "WEBSITE_RUN_FROM_PACKAGE=$SAS_URL" -o table
```

5. Restart the app
```bash
az webapp restart --resource-group eusotrip-prod --name eusotrip-app
```

6. Verify (wait ~60s then check)
```bash
sleep 60 && curl -s -o /dev/null -w "HTTP: %{http_code}\n" https://eusotrip.com
```

## Notes
- **Deployment model:** `WEBSITE_RUN_FROM_PACKAGE` (run-from-zip via blob storage `eusotripdeploy/deployments`)
- **Do NOT use** `az webapp deploy` — it conflicts with the run-from-zip configuration
- Start command: `NODE_ENV=production node dist/index.js`
- Build output: `dist/` (server: `dist/index.js`, client: `dist/public/`)
- Ensure `az login` is active before deploying
