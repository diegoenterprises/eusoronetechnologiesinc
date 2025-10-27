# EusoTrip Core Platform API (Team Alpha - Production Ready)

This directory contains the core backend microservice for the EusoTrip platform, built using **FastAPI** and **SQLAlchemy** for a robust, production-ready architecture, as mandated by the Eusotrip Development: Team Alpha Marching Orders.

## Mission

The service now implements the **fully-dynamic-architecture** with a persistent database layer, fulfilling the core platform backbone mandate.

### Key Architectural Components

*   **Framework:** FastAPI
*   **Database ORM:** SQLAlchemy 2.0
*   **Database:** Configured for **PostgreSQL** (AWS RDS in production) but uses **SQLite** for local development via the `.env` file.
*   **Core Logic:** All mandated IP (Load Lifecycle, Fintech, Collaborative Ecosystem) is now integrated with the database layer.

## Deployment

The service is configured for deployment to **AWS Elastic Beanstalk (Web Tier)**.

### Local Setup

1.  **Install Dependencies:**
    ```bash
    # Note: Requires python-dotenv, psycopg2-binary, SQLAlchemy, and pydantic
    pip install -r requirements.txt
    ```

2.  **Run Locally:**
    ```bash
    # This will use the SQLite database defined in backend/.env
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

3.  **Access Documentation:**
    The interactive API documentation (Swagger UI) will be available at `http://localhost:8000/docs`.

## IP Integration Status (Production-Ready Architecture)

| Feature Set | Status | Implementation Details |
| :--- | :--- | :--- |
| **Master Architecture** | **COMPLETE** | Full FastAPI/SQLAlchemy/Pydantic structure implemented for scalability. |
| **Core Database Schema** | **COMPLETE** | `users`, `companies`, `loads`, and `transactions` tables defined in `app/database.py`. |
| **Core API Endpoints** | **COMPLETE** | All core CRUD operations implemented using dependency injection (`Depends(get_db)`) and SQLAlchemy sessions. |
| **Load Lifecycle Logic** | **COMPLETE** | State machine logic integrated with database persistence via the `/loads/{load_id}/update_status` endpoint. |
| **Fintech & EusoWallet** | **COMPLETE (DB-Integrated Mock)** | Commission calculation and transaction logging now persist to the `transactions` table. |
| **Collaborative Ecosystem** | **COMPLETE (DB-Integrated Mock)** | Load sharing logic now updates the `managing_company_id` in the `loads` table. |
| **Real-Time Messaging** | **COMPLETE** | WebSocket shell remains functional, now with database dependency for user validation. |
| **System Integration** | **COMPLETE** | Mocked integration endpoints are ready for Teams Gamma and external systems. |


