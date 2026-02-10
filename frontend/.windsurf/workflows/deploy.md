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

3. Deploy to Azure App Service
```bash
az webapp deploy --resource-group eusotrip-prod --name eusotrip-app --src-path /Users/diegousoro/Desktop/eusoronetechnologiesinc/frontend/deploy.zip --type zip --async true
```

4. Verify the deployment at https://eusotrip.com

## Notes
- The start command is `NODE_ENV=production node dist/index.js`
- Build output goes to `dist/` (server: `dist/index.js`, client: `dist/public/`)
- Azure runs `npm install` automatically via Oryx build system
- Deployment takes ~3-4 minutes (build ~20s, site start ~200s)
- Ensure `az login` is active before deploying
