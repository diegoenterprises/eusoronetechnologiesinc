# EusoTrip Platform - Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [x] TypeScript compilation passes with no errors
- [x] Production build completes successfully
- [x] All tRPC routers properly defined and exported
- [x] All frontend pages use dynamic data (no mock data)
- [x] No console errors in development mode

### Security
- [ ] Environment variables configured (copy `.env.example` to `.env`)
- [ ] JWT_SECRET is a strong, unique value
- [ ] Database credentials are secure
- [ ] API keys are properly secured
- [ ] CORS origins are properly configured for production

### Database
- [ ] MySQL database provisioned and accessible
- [ ] Database migrations applied (`npx drizzle-kit push:mysql`)
- [ ] Initial seed data loaded if required
- [ ] Database backups configured

### Infrastructure
- [ ] Node.js 20+ available on server
- [ ] PM2 or similar process manager installed
- [ ] Redis instance available (for session/cache)
- [ ] SSL certificates configured
- [ ] Domain DNS configured

---

## Deployment Steps

### Option 1: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

### Option 2: AWS Deployment

1. **Configure AWS CLI**
   ```bash
   aws configure
   ```

2. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name eusotrip
   ```

3. **Build and Push Docker Image**
   ```bash
   docker build -t eusotrip .
   docker tag eusotrip:latest <account-id>.dkr.ecr.<region>.amazonaws.com/eusotrip:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/eusotrip:latest
   ```

4. **Deploy to ECS/EKS or EC2**
   - Use `deploy/aws/appspec.yml` for CodeDeploy
   - Use `deploy/aws/buildspec.yml` for CodeBuild

### Option 3: Azure Deployment

1. **Configure Azure CLI**
   ```bash
   az login
   ```

2. **Create Azure Container Registry**
   ```bash
   az acr create --name eusotrip --resource-group <rg> --sku Basic
   ```

3. **Deploy using Azure Pipelines**
   - Use `deploy/azure/azure-pipelines.yml`

---

## Post-Deployment Verification

### Health Checks
- [ ] `/api/health` endpoint returns 200
- [ ] Frontend loads without errors
- [ ] User authentication works
- [ ] Database queries execute successfully

### Functional Testing
- [ ] User registration works
- [ ] User login/logout works
- [ ] Load board displays data
- [ ] Wallet transactions process
- [ ] Messaging system functions
- [ ] Document uploads work
- [ ] Notifications deliver

### Performance
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] No memory leaks observed
- [ ] WebSocket connections stable

---

## Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | MySQL connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| GEMINI_API_KEY | Gemini AI API key | Yes |
| STRIPE_SECRET_KEY | Stripe secret key | Yes |
| STRIPE_PUBLISHABLE_KEY | Stripe public key | Yes |
| NODE_ENV | Environment (production) | Yes |
| PORT | Server port (default: 3000) | No |
| REDIS_URL | Redis connection string | No |

---

## Rollback Procedure

1. **Identify issue** - Check logs and monitoring
2. **Stop current deployment** - `pm2 stop eusotrip` or `docker-compose down`
3. **Restore previous version** - Use git revert or previous Docker image
4. **Restart services** - `pm2 start eusotrip` or `docker-compose up -d`
5. **Verify rollback** - Run health checks

---

## Support Contacts

- **Technical Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **On-Call**: [Contact Info]

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-24 | 1.0.0 | Initial production deployment |

