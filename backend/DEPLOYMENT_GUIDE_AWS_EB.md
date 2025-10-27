# EusoTrip Core Platform API: AWS Elastic Beanstalk Deployment Guide

**Team Alpha Final Deliverable for Production Deployment**

This guide details the steps required to deploy the **EusoTrip Core Platform API** (located in the `backend/` directory) to the AWS Elastic Beanstalk (EB) environment, fulfilling the final deployment mandate.

## I. Prerequisites

1.  **AWS Account:** With permissions to use EC2, Elastic Beanstalk, RDS, and IAM.
2.  **AWS CLI:** Configured locally.
3.  **EB CLI:** Installed and configured (`eb init`).
4.  **Database:** An Amazon RDS for PostgreSQL instance must be provisioned.

## II. Deployment Steps

### Step 1: Initialize Elastic Beanstalk Application

Navigate to the root of the `backend/` directory and initialize the EB application.

\`\`\`bash
cd backend/
eb init -p python-3.11 eusotrip-api-staging
\`\`\`

### Step 2: Configure Environment Variables (Database Connection)

The application requires the `DATABASE_URL` environment variable to connect to the production PostgreSQL instance. This must be set in the EB environment configuration.

**Production PostgreSQL Format:**
\`\`\`
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>:<port>/<dbname>
\`\`\`

**Set Environment Variables via EB CLI:**

\`\`\`bash
eb setenv DATABASE_URL=postgresql+psycopg2://eusotrip_user:eusotrip_password@eusotrip-rds.us-east-1.rds.amazonaws.com:5432/eusotrip_db
# Note: Replace with actual RDS endpoint and credentials
\`\`\`

### Step 3: Configure WSGI/Application Entry Point

The `Procfile` has already been created by Team Alpha, but for standard EB deployment, the `WSGIPath` must be explicitly set to point to the FastAPI application instance.

**Update EB Configuration:**

\`\`\`bash
eb config
\`\`\`

In the editor, ensure the following is set under `aws:elasticbeanstalk:container:python:`:

\`\`\`yaml
  option_settings:
    aws:elasticbeanstalk:container:python:
      WSGIPath: app.main:app
      # This tells EB to run uvicorn app.main:app
\`\`\`

### Step 4: Deploy the Application

Deploy the current version of the code to the EB environment.

\`\`\`bash
eb create eusotrip-staging-env
# Wait for the environment to be fully deployed and healthy.
eb deploy
\`\`\`

### Step 5: Final Check

Once deployed, the API documentation should be accessible via the EB environment URL:

*   **API Root:** `http://<your-eb-url>.elasticbeanstalk.com/`
*   **Swagger Docs:** `http://<your-eb-url>.elasticbeanstalk.com/docs`

## III. Final Integration Endpoints for Other Teams

The following endpoints are ready for consumption by Teams Beta, Gamma, and Delta:

| Team | Purpose | Endpoint | Method |
| :--- | :--- | :--- | :--- |
| **Beta (Frontend)** | User Creation | `/users/` | `POST` |
| **Beta (Frontend)** | Load Creation | `/loads/` | `POST` |
| **Delta (Mobile)** | Load Status Update | `/loads/{load_id}/update_status` | `POST` |
| **Delta (Mobile)** | EusoWallet Commission | `/fintech/calculate_commission` | `POST` |
| **Gamma (AI)** | AI/ERG Data Ingestion | `/integration/sync_external_data?source=AI_ERG` | `POST` |
| **All Teams** | Real-Time Messaging | `/ws/{user_id}` | `WebSocket` |

