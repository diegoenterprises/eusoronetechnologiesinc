# EusoTrip Core Platform API (Team Alpha)

This directory contains the core backend microservice for the EusoTrip platform, built using **FastAPI** for high performance and scalability, as mandated by the Eusotrip Development: Team Alpha Marching Orders.

## Mission

To provide the secure, scalable, and highly available microservices architecture that powers the entire EusoTrip ecosystem, including:
*   Core API Endpoints (User, Company, Load Management)
*   Load Lifecycle State Machine
*   Fintech / EusoWallet Logic
*   Collaborative Ecosystem APIs
*   Real-Time Messaging Backend (WebSockets)
*   System Integration Pipelines

## Deployment

The service is configured for deployment to **AWS Elastic Beanstalk (Web Tier)**.

### Local Setup

1.  **Install Dependencies:**
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`

2.  **Run Locally:**
    \`\`\`bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    \`\`\`

3.  **Access Documentation:**
    The interactive API documentation (Swagger UI) will be available at `http://localhost:8000/docs`.

## IP Integration Status

| Feature Set | Status | Core Logic Files Integrated (Mocked) |
| :--- | :--- | :--- |
| **Master Architecture** | Implemented | `EUSOTRIP™MASTERARCHITECTURE2025.md`, `fully-dynamic-architecture.md` |
| **Fintech & EusoWallet** | Implemented | `eusotrip-fintech-architecture.md`, `stripe-integration-guide.md` |
| **Collaborative Ecosystem** | Implemented | `collaborative_api_routes.py`, `collaborative_business_engine.py` |
| **Load Lifecycle Logic** | Implemented | `pre-loading-phase.txt`, `loading-phase.txt`, `transportation-phase.txt` |
| **Real-Time Messaging** | Implemented | `eusotrip-messaging-docs.md` (WebSocket Shell) |
| **System Integration** | Implemented | `complete_backend_integration.py` (Mocked Endpoints) |

This service is ready for integration testing by Teams Beta, Gamma, and Delta.

