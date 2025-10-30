# 🚀 EUSOTRIP ULTIMATE DEVELOPMENT DIRECTIVE
## BY EUSORONE TECHNOLOGIES, INC | MIKE "DIEGO" USORO, CEO & FOUNDER

**CLASSIFICATION:** CRITICAL - IMMEDIATE EXECUTION REQUIRED  
**VERSION:** 3.0 ENHANCED  
**DATE:** October 29, 2025  
**AUTHORITY:** CEO Direct Command

---

## ⚠️ EXECUTIVE SUMMARY: ZERO TOLERANCE FOR PLACEHOLDER CODE

This document serves as the **ULTIMATE AUTHORITY** for all EusoTrip platform development. Every line of code submitted must meet the **TRILLION DOLLAR CODE STANDARD** defined herein.

### 🎯 Core Mandate

**NO PLACEHOLDER CODE. NO MOCK IMPLEMENTATIONS. NO SHORTCUTS.**

Every feature must be:
- ✅ Fully functional with complete business logic
- ✅ Production-ready with comprehensive error handling
- ✅ Compliant with all regulations (FMCSA, DOT, Hazmat)
- ✅ Integrated with actual external services (Stripe, Google Maps, OpenAI)
- ✅ Tested with minimum 80% code coverage
- ✅ Optimized for P99 latency < 50ms

---

## 📋 TABLE OF CONTENTS

1. [Team Structure & Responsibilities](#team-structure)
2. [Database Architecture (35+ Tables)](#database-architecture)
3. [Team Alpha - Backend Core](#team-alpha)
4. [Team Beta - Frontend & UX](#team-beta)
5. [Team Gamma - AI & Specialized Systems](#team-gamma)
6. [Team Delta - Mobile Development](#team-delta)
7. [AWS Deployment Architecture](#aws-deployment)
8. [Quality Standards & Enforcement](#quality-standards)
9. [API Documentation](#api-documentation)
10. [Testing Requirements](#testing-requirements)

---

## 🏗️ TEAM STRUCTURE & RESPONSIBILITIES {#team-structure}

### Team Alpha - Core Platform & Backend
**Mission:** Build the secure, scalable microservices architecture

**Core Responsibilities:**
- Complete database schema (35+ tables)
- Authentication & authorization (JWT, RBAC)
- Load lifecycle state machine
- Stripe payment integration
- WebSocket server for real-time updates
- RESTful API (200+ endpoints)

**Tech Stack:**
- Python 3.11+ (FastAPI)
- PostgreSQL 15+
- Redis (ElastiCache)
- SQLAlchemy 2.0
- Alembic (migrations)
- Celery (background tasks)

**Key Deliverables:**
```
backend/
├── app/
│   ├── main.py (FastAPI app)
│   ├── models/ (35+ SQLAlchemy models)
│   ├── schemas/ (Pydantic validation)
│   ├── repositories/ (Data access layer)
│   ├── services/ (Business logic)
│   ├── api/ (200+ endpoints)
│   ├── websocket/ (Real-time communication)
│   └── middleware/ (Auth, logging, rate limiting)
├── tests/ (80%+ coverage)
└── alembic/ (Database migrations)
```

---

### Team Beta - Frontend & User Experience
**Mission:** Deliver intuitive, responsive web applications

**Core Responsibilities:**
- Admin dashboard (React/TypeScript)
- Shipper portal
- Carrier portal
- Driver management interface
- Real-time WebSocket integration
- Form validation & error handling

**Tech Stack:**
- React 18+
- TypeScript 5+
- Tailwind CSS
- React Query (data fetching)
- Socket.io-client
- React Hook Form

**Key Deliverables:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Loads/
│   │   ├── Fleet/
│   │   └── Settings/
│   ├── services/
│   │   ├── APIClient.ts
│   │   └── WebSocketManager.ts
│   ├── hooks/
│   ├── types/
│   └── utils/
```

---

### Team Gamma - AI & Specialized Systems
**Mission:** Develop proprietary AI and compliance systems

**Core Responsibilities:**
- ESANG AI (GPT-4 + Gemini integration)
- ERG emergency response system
- Spectra-Match™ oil identification
- Gamification engine
- Real-time compliance monitoring

**Tech Stack:**
- Python 3.11+
- OpenAI API (GPT-4)
- Google Gemini API
- LangChain
- TensorFlow 2.15+
- Pinecone (vector database)

**Key Deliverables:**
```
ai/
├── esang_core/
│   ├── multi_model_orchestrator.py
│   ├── conversation_manager.py
│   └── tools/
├── erg_system/
│   ├── erg_intelligence.py
│   └── emergency_response.py
├── spectra_match/
│   ├── oil_identifier.py
│   ├── models/ (CNN models)
│   └── database/
└── gamification/
    ├── performance_engine.py
    └── achievement_system.py
```

---

### Team Delta - Mobile Development
**Mission:** Build native, high-performance mobile apps

**Core Responsibilities:**
- iOS app (SwiftUI)
- Android app (Kotlin/Jetpack Compose)
- Zeun Mechanics™ edge computing
- Real-time GPS tracking
- Offline-first architecture

**Tech Stack:**
- Swift 5.9+ (iOS)
- SwiftUI
- Combine
- CoreLocation
- Kotlin (Android)
- Jetpack Compose

**Key Deliverables:**
```
EusoTrip-iOS/
├── App/
├── Core/
│   ├── Network/
│   ├── Storage/
│   └── Location/
├── Models/
├── ViewModels/
├── Views/
└── Services/
    ├── ZeunMechanicsService.swift
    ├── TrackingService.swift
    └── EusoWalletService.swift
```

---

## 🗄️ DATABASE ARCHITECTURE (35+ TABLES) {#database-architecture}

### Complete PostgreSQL Schema

```sql
-- ============================================
-- USERS & AUTHENTICATION (6 TABLES)
-- ============================================

CREATE TYPE user_role AS ENUM (
    'SHIPPER',
    'CARRIER',
    'BROKER',
    'DRIVER',
    'CATALYST',
    'ESCORT',
    'TERMINAL_MANAGER',
    'ADMIN',
    'SUPER_ADMIN'
);

CREATE TYPE user_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'PENDING',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    profile_image_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_id ON users(company_id);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================
-- COMPANIES (5 TABLES)
-- ============================================

CREATE TYPE company_type AS ENUM ('SHIPPER', 'CARRIER', 'BROKER', 'DUAL');

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    dba_name VARCHAR(255),
    company_type company_type NOT NULL,
    dot_number VARCHAR(50) UNIQUE,
    mc_number VARCHAR(50) UNIQUE,
    ein VARCHAR(20),
    usdot_verification_status VARCHAR(20) DEFAULT 'UNVERIFIED',
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'US',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    stripe_connect_id VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    safety_rating VARCHAR(50),
    safety_rating_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_dot_number ON companies(dot_number);
CREATE INDEX idx_companies_mc_number ON companies(mc_number);

-- ============================================
-- DRIVERS & FLEET (8 TABLES)
-- ============================================

CREATE TYPE driver_employment_type AS ENUM (
    'COMPANY_DRIVER',
    'OWNER_OPERATOR',
    'LEASE_OPERATOR'
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    employment_type driver_employment_type NOT NULL,
    cdl_number VARCHAR(50) UNIQUE NOT NULL,
    cdl_state VARCHAR(2) NOT NULL,
    cdl_expiry_date DATE NOT NULL,
    cdl_class VARCHAR(10) NOT NULL,
    medical_certificate_expiry DATE NOT NULL,
    hazmat_endorsement BOOLEAN DEFAULT FALSE,
    tanker_endorsement BOOLEAN DEFAULT FALSE,
    doubles_triples_endorsement BOOLEAN DEFAULT FALSE,
    twic_card BOOLEAN DEFAULT FALSE,
    years_of_experience INTEGER,
    safety_score DECIMAL(5,2) DEFAULT 100.00,
    compliance_score DECIMAL(5,2) DEFAULT 100.00,
    gamification_score DECIMAL(8,2) DEFAULT 0.00,
    total_miles_driven BIGINT DEFAULT 0,
    total_loads_completed INTEGER DEFAULT 0,
    current_hos_status VARCHAR(50),
    current_location_lat DECIMAL(10,8),
    current_location_lng DECIMAL(11,8),
    current_location_updated_at TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_company_id ON drivers(company_id);
CREATE INDEX idx_drivers_cdl_number ON drivers(cdl_number);

CREATE TYPE vehicle_type AS ENUM (
    'DRY_VAN',
    'FLATBED',
    'REEFER',
    'TANKER',
    'DUMP_TRUCK',
    'LOWBOY',
    'STEP_DECK',
    'SPECIALIZED'
);

CREATE TYPE vehicle_status AS ENUM (
    'ACTIVE',
    'MAINTENANCE',
    'OUT_OF_SERVICE',
    'RETIRED'
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    vehicle_type vehicle_type NOT NULL,
    status vehicle_status DEFAULT 'ACTIVE',
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    registration_expiry_date DATE NOT NULL,
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    last_inspection_date DATE,
    next_inspection_date DATE,
    gvwr INTEGER,
    cargo_capacity_lbs INTEGER,
    cargo_capacity_cubic_ft DECIMAL(10,2),
    fuel_type VARCHAR(50),
    current_odometer INTEGER,
    eld_device_id VARCHAR(100),
    gps_device_id VARCHAR(100),
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);

-- ============================================
-- LOADS & SHIPMENTS (12 TABLES)
-- ============================================

CREATE TYPE load_status AS ENUM (
    'DRAFT',
    'POSTED',
    'ASSIGNED',
    'PRE_LOADING',
    'LOADING',
    'IN_TRANSIT',
    'UNLOADING',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'DELAYED',
    'DISPUTED'
);

CREATE TYPE cargo_type AS ENUM (
    'GENERAL_FREIGHT',
    'HAZMAT',
    'REFRIGERATED',
    'OVERSIZED',
    'HEAVY_HAUL',
    'LIQUID_BULK',
    'DRY_BULK',
    'INTERMODAL',
    'AUTO_TRANSPORT',
    'LIVESTOCK'
);

CREATE TABLE loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_number VARCHAR(50) UNIQUE NOT NULL,
    shipper_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    shipper_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    carrier_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    carrier_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    broker_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    status load_status DEFAULT 'DRAFT',
    cargo_type cargo_type NOT NULL,
    
    -- Origin
    origin_name VARCHAR(255),
    origin_address_line1 VARCHAR(255) NOT NULL,
    origin_address_line2 VARCHAR(255),
    origin_city VARCHAR(100) NOT NULL,
    origin_state VARCHAR(2) NOT NULL,
    origin_zip VARCHAR(10) NOT NULL,
    origin_lat DECIMAL(10,8),
    origin_lng DECIMAL(11,8),
    origin_contact_name VARCHAR(100),
    origin_contact_phone VARCHAR(20),
    
    -- Destination
    destination_name VARCHAR(255),
    destination_address_line1 VARCHAR(255) NOT NULL,
    destination_address_line2 VARCHAR(255),
    destination_city VARCHAR(100) NOT NULL,
    destination_state VARCHAR(2) NOT NULL,
    destination_zip VARCHAR(10) NOT NULL,
    destination_lat DECIMAL(10,8),
    destination_lng DECIMAL(11,8),
    destination_contact_name VARCHAR(100),
    destination_contact_phone VARCHAR(20),
    
    -- Cargo Details
    cargo_description TEXT,
    cargo_weight_lbs DECIMAL(10,2),
    cargo_value DECIMAL(12,2),
    piece_count INTEGER,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    
    -- HazMat
    hazmat_class VARCHAR(10),
    un_number VARCHAR(10),
    proper_shipping_name VARCHAR(255),
    packing_group VARCHAR(5),
    erg_guide_number VARCHAR(10),
    placard_required BOOLEAN DEFAULT FALSE,
    
    -- Scheduling
    pickup_date_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_date_end TIMESTAMP WITH TIME ZONE,
    delivery_date_start TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_date_end TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    
    -- Financial
    posted_rate DECIMAL(10,2),
    agreed_rate DECIMAL(10,2),
    platform_fee_percentage DECIMAL(5,2) DEFAULT 8.00,
    platform_fee_amount DECIMAL(10,2),
    driver_commission_percentage DECIMAL(5,2),
    driver_commission_amount DECIMAL(10,2),
    fuel_surcharge DECIMAL(10,2),
    
    -- Distance & Route
    estimated_distance_miles DECIMAL(10,2),
    actual_distance_miles DECIMAL(10,2),
    estimated_duration_hours DECIMAL(5,2),
    polyline_encoded TEXT,
    
    -- Additional Services
    tracking_enabled BOOLEAN DEFAULT TRUE,
    insurance_required BOOLEAN DEFAULT FALSE,
    insurance_amount DECIMAL(12,2),
    escort_required BOOLEAN DEFAULT FALSE,
    
    -- Documents
    bill_of_lading_url TEXT,
    pod_signature_url TEXT,
    pod_photos JSONB,
    
    -- Ratings
    shipper_rating INTEGER CHECK (shipper_rating BETWEEN 1 AND 5),
    carrier_rating INTEGER CHECK (carrier_rating BETWEEN 1 AND 5),
    shipper_review TEXT,
    carrier_review TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

CREATE INDEX idx_loads_load_number ON loads(load_number);
CREATE INDEX idx_loads_shipper ON loads(shipper_user_id, shipper_company_id);
CREATE INDEX idx_loads_carrier ON loads(carrier_user_id, carrier_company_id);
CREATE INDEX idx_loads_driver ON loads(assigned_driver_id);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_pickup_date ON loads(pickup_date_start);

CREATE TABLE load_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    old_status load_status,
    new_status load_status,
    event_data JSONB,
    triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_load_events_load_id ON load_events(load_id);
CREATE INDEX idx_load_events_timestamp ON load_events(timestamp);

-- ============================================
-- FINANCIAL & TRANSACTIONS (6 TABLES)
-- ============================================

CREATE TYPE transaction_type AS ENUM (
    'LOAD_PAYMENT',
    'PLATFORM_FEE',
    'DRIVER_COMMISSION',
    'INSTANT_PAY',
    'REFUND',
    'BONUS',
    'REFERRAL_REWARD',
    'PENALTY',
    'ESCROW_HOLD',
    'ESCROW_RELEASE'
);

CREATE TYPE transaction_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REVERSED'
);

CREATE TYPE pay_schedule AS ENUM (
    'QUICK_PAY',
    'WEEKLY',
    'MONTHLY'
);

CREATE TABLE wallet_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    available_balance DECIMAL(12,2) DEFAULT 0.00,
    pending_escrow DECIMAL(12,2) DEFAULT 0.00,
    stripe_account_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    bank_account_last4 VARCHAR(4),
    bank_account_verified BOOLEAN DEFAULT FALSE,
    instant_pay_enabled BOOLEAN DEFAULT FALSE,
    pay_schedule pay_schedule DEFAULT 'WEEKLY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_user_id ON wallet_accounts(user_id);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_account_id UUID REFERENCES wallet_accounts(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'PENDING',
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
    stripe_transaction_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_account_id, created_at DESC);
CREATE INDEX idx_transactions_load ON transactions(load_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================
-- MESSAGING (3 TABLES)
-- ============================================

CREATE TYPE conversation_type AS ENUM (
    'DIRECT',
    'GROUP',
    'LOAD_THREAD',
    'COMPANY_CHANNEL'
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type conversation_type NOT NULL,
    name VARCHAR(255),
    participants JSONB NOT NULL,
    load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN (participants);
CREATE INDEX idx_conversations_load ON conversations(load_id);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    content_encrypted BOOLEAN DEFAULT TRUE,
    attachments JSONB,
    read_by JSONB DEFAULT '[]'::jsonb,
    is_priority BOOLEAN DEFAULT FALSE,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);

-- ============================================
-- GAMIFICATION (4 TABLES)
-- ============================================

CREATE TYPE achievement_category AS ENUM (
    'SAFETY',
    'EFFICIENCY',
    'RELIABILITY',
    'COMPLIANCE',
    'MILES',
    'LOADS',
    'EARNINGS',
    'SOCIAL'
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category achievement_category NOT NULL,
    points INTEGER NOT NULL,
    badge_icon_url TEXT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    safety_score DECIMAL(5,2) DEFAULT 100.00,
    efficiency_score DECIMAL(5,2) DEFAULT 0.00,
    reliability_score DECIMAL(5,2) DEFAULT 100.00,
    total_miles BIGINT DEFAULT 0,
    total_loads_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    rank INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI & COMPLIANCE (5+ TABLES)
-- ============================================

CREATE TABLE ai_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    model_used VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    rationale_json JSONB,
    suggested_action_json JSONB,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    compliance_type VARCHAR(100) NOT NULL,
    is_violation BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20),
    details_json JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE spectra_match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    bol_data_json JSONB,
    spectral_data_base64 TEXT,
    analysis_report_json JSONB,
    match_confidence DECIMAL(5,4),
    identified_material VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE erg_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    un_number VARCHAR(10) UNIQUE NOT NULL,
    proper_shipping_name VARCHAR(255) NOT NULL,
    hazard_class VARCHAR(10) NOT NULL,
    guide_number VARCHAR(10) NOT NULL,
    emergency_procedures JSONB NOT NULL,
    isolation_distances JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_erg_un_number ON erg_guidelines(un_number);
```

---

## 💻 TEAM ALPHA - BACKEND CORE PLATFORM {#team-alpha}

### Critical Implementation Requirements

#### 1. Dynamic Commission Engine

**File:** `backend/app/services/commission_service.py`

```python
from decimal import Decimal, getcontext
from typing import Dict
from uuid import UUID
import logging

getcontext().prec = 50
logger = logging.getLogger(__name__)

class CommissionService:
    """
    CRITICAL: Dynamic platform fee calculation
    NO HARDCODED RATES - All rates must be calculated dynamically
    """
    
    BASE_PLATFORM_FEE = Decimal('0.08')  # 8% base
    MAX_PLATFORM_FEE = Decimal('0.15')   # 15% max
    MIN_PLATFORM_FEE = Decimal('0.05')   # 5% min
    
    def __init__(
        self,
        transaction_repo,
        commodity_api,
        gamification_svc
    ):
        self.transaction_repo = transaction_repo
        self.commodity_api = commodity_api
        self.gamification_svc = gamification_svc
    
    async def calculate_split(self, load) -> Dict[str, Decimal]:
        """
        Calculate financial split with dynamic factors:
        - Commodity market volatility
        - Driver gamification score
        - Load risk factors
        - Distance and cargo type
        """
        
        gross_rate = Decimal(str(load.agreed_rate))
        
        # Get real-time driver score (0.0 - 1.0)
        driver_score = await self.gamification_svc.get_driver_score(
            load.assigned_driver_id
        )
        
        # Calculate dynamic platform fee
        platform_fee_rate = await self._calculate_dynamic_fee(
            load,
            driver_score
        )
        
        platform_fee_amount = (gross_rate * platform_fee_rate).quantize(
            Decimal('0.01')
        )
        
        # Driver commission (25% of gross)
        driver_commission_rate = Decimal('0.25')
        driver_commission_amount = (
            gross_rate * driver_commission_rate
        ).quantize(Decimal('0.01'))
        
        # Net to carrier
        net_to_carrier = gross_rate - platform_fee_amount - driver_commission_amount
        
        if net_to_carrier < 0:
            raise ValueError("Negative net amount calculated")
        
        logger.info(
            f"Commission calculated for load {load.id}: "
            f"Gross={gross_rate}, Fee={platform_fee_amount}, "
            f"Commission={driver_commission_amount}, Net={net_to_carrier}"
        )
        
        return {
            "gross_rate": gross_rate,
            "platform_fee_rate": platform_fee_rate,
            "platform_fee_amount": platform_fee_amount,
            "driver_commission_amount": driver_commission_amount,
            "net_to_carrier": net_to_carrier
        }
    
    async def _calculate_dynamic_fee(
        self,
        load,
        driver_score: float
    ) -> Decimal:
        """
        Dynamic fee formula:
        BASE_FEE * (1 + RISK - BONUS) * COMMODITY_FACTOR
        """
        
        # Risk premium
        risk_factor = Decimal('0.0')
        if load.cargo_type in ['HAZMAT', 'LIQUID_BULK']:
            risk_factor += Decimal('0.02')  # +2%
        if load.distance_miles > 1500:
            risk_factor += Decimal('0.01')  # +1%
        
        # Gamification bonus (up to 3% reduction)
        gamification_bonus = Decimal(str(driver_score)) * Decimal('0.03')
        
        # Commodity volatility factor
        commodity_factor = await self._get_commodity_factor(load.cargo_type)
        
        # Apply formula
        dynamic_rate = (
            self.BASE_PLATFORM_FEE *
            (Decimal('1.0') + risk_factor - gamification_bonus) *
            commodity_factor
        )
        
        # Enforce limits
        return max(
            self.MIN_PLATFORM_FEE,
            min(self.MAX_PLATFORM_FEE, dynamic_rate)
        ).quantize(Decimal('0.0001'))
    
    async def _get_commodity_factor(self, cargo_type: str) -> Decimal:
        """
        Fetch real-time commodity index for volatility adjustment
        """
        if cargo_type in ['LIQUID_BULK', 'DRY_BULK', 'HAZMAT']:
            # Get WTI or BDI index
            index_name = 'WTI' if cargo_type == 'LIQUID_BULK' else 'BDI'
            index_value = await self.commodity_api.get_index_value(index_name)
            return (index_value / Decimal('50.0')).quantize(Decimal('0.0001'))
        return Decimal('1.0')
```

#### 2. Load Lifecycle State Machine

**File:** `backend/app/services/load_lifecycle_service.py`

```python
from enum import Enum
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class LoadStatus(str, Enum):
    DRAFT = "DRAFT"
    POSTED = "POSTED"
    ASSIGNED = "ASSIGNED"
    PRE_LOADING = "PRE_LOADING"
    LOADING = "LOADING"
    IN_TRANSIT = "IN_TRANSIT"
    UNLOADING = "UNLOADING"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    DELAYED = "DELAYED"
    DISPUTED = "DISPUTED"

class LoadLifecycleService:
    """
    CRITICAL: Complete state machine with compliance validation
    EVERY transition must validate business rules and compliance
    """
    
    VALID_TRANSITIONS = {
        LoadStatus.DRAFT: [LoadStatus.POSTED, LoadStatus.CANCELLED],
        LoadStatus.POSTED: [LoadStatus.ASSIGNED, LoadStatus.CANCELLED],
        LoadStatus.ASSIGNED: [LoadStatus.PRE_LOADING, LoadStatus.CANCELLED],
        LoadStatus.PRE_LOADING: [LoadStatus.LOADING, LoadStatus.CANCELLED],
        LoadStatus.LOADING: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
        LoadStatus.IN_TRANSIT: [LoadStatus.UNLOADING, LoadStatus.DELAYED],
        LoadStatus.UNLOADING: [LoadStatus.DELIVERED],
        LoadStatus.DELIVERED: [LoadStatus.COMPLETED, LoadStatus.DISPUTED],
        LoadStatus.DELAYED: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
        LoadStatus.DISPUTED: [LoadStatus.COMPLETED, LoadStatus.CANCELLED],
    }
    
    def __init__(
        self,
        load_repo,
        geofence_svc,
        compliance_svc,
        payment_svc,
        document_svc,
        tracking_svc,
        notification_svc,
        gamification_svc
    ):
        self.load_repo = load_repo
        self.geofence_svc = geofence_svc
        self.compliance_svc = compliance_svc
        self.payment_svc = payment_svc
        self.document_svc = document_svc
        self.tracking_svc = tracking_svc
        self.notification_svc = notification_svc
        self.gamification_svc = gamification_svc
    
    async def transition_state(
        self,
        load_id: UUID,
        new_status: LoadStatus,
        user_id: UUID,
        location: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        CRITICAL: Single authority for all load state changes
        
        Steps:
        1. Validate state transition is allowed
        2. Enforce business rules and compliance
        3. Update load status
        4. Create audit event
        5. Trigger downstream actions
        6. Broadcast real-time update
        """
        
        # Get load
        load = await self.load_repo.get_by_id(load_id)
        if not load:
            raise LoadNotFoundException(f"Load {load_id} not found")
        
        current_status = LoadStatus(load.status)
        
        # Validate transition
        if new_status not in self.VALID_TRANSITIONS.get(current_status, []):
            raise InvalidStateTransitionException(
                f"Cannot transition from {current_status} to {new_status}"
            )
        
        # Validate business rules
        await self._validate_business_rules(
            load, new_status, location, metadata
        )
        
        # Update status
        old_status = load.status
        load.status = new_status.value
        load.updated_at = datetime.utcnow()
        
        # Save to database
        await self.load_repo.update(load)
        
        # Create audit event
        await self._create_audit_event(
            load_id, old_status, new_status, user_id, location, metadata
        )
        
        # Trigger downstream actions
        await self._trigger_downstream_actions(load, new_status)
        
        # Broadcast update
        await self.notification_svc.broadcast_load_update(
            load_id,
            {
                'type': 'STATUS_CHANGE',
                'old_status': old_status,
                'new_status': new_status.value,
                'load': load.to_dict()
            }
        )
        
        logger.info(
            f"Load {load_id} transitioned from {old_status} to {new_status.value}"
        )
        
        return load.to_dict()
    
    async def _validate_business_rules(
        self,
        load,
        new_status: LoadStatus,
        location: Optional[Dict],
        metadata: Optional[Dict]
    ):
        """
        CRITICAL: Enforce all compliance and business rules
        """
        
        # Rule 1: Location-based transitions require geofence
        if new_status in [LoadStatus.LOADING, LoadStatus.UNLOADING]:
            if not location:
                raise ValidationException(
                    "Location required for loading/unloading"
                )
            
            target_location = (
                {'lat': load.origin_lat, 'lng': load.origin_lng}
                if new_status == LoadStatus.LOADING
                else {'lat': load.destination_lat, 'lng': load.destination_lng}
            )
            
            distance_miles = await self.geofence_svc.calculate_distance(
                location, target_location
            )
            
            if distance_miles > 0.25:  # 1/4 mile geofence
                raise GeofenceViolationException(
                    f"Must be within 0.25 miles to {new_status.value}"
                )
        
        # Rule 2: IN_TRANSIT requires BOL
        if new_status == LoadStatus.IN_TRANSIT:
            has_bol = await self.document_svc.has_document(
                load.id, 'BILL_OF_LADING'
            )
            if not has_bol:
                raise ValidationException(
                    "Bill of Lading required before departure"
                )
            
            # HOS compliance check
            is_hos_compliant = await self.compliance_svc.check_hos_compliance(
                load.assigned_driver_id
            )
            if not is_hos_compliant:
                raise ComplianceViolationException(
                    "Driver not HOS compliant"
                )
        
        # Rule 3: HazMat loads require special checks
        if load.cargo_type == 'HAZMAT' and new_status == LoadStatus.LOADING:
            # Check endorsement
            has_endorsement = await self.compliance_svc.check_hazmat_endorsement(
                load.assigned_driver_id
            )
            if not has_endorsement:
                raise ComplianceViolationException(
                    "Driver lacks HazMat endorsement"
                )
            
            # Check vehicle inspection
            inspection_current = await self.compliance_svc.check_vehicle_inspection(
                load.assigned_vehicle_id
            )
            if not inspection_current:
                raise ComplianceViolationException(
                    "Vehicle inspection not current (must be within 30 days)"
                )
        
        # Rule 4: DELIVERED requires POD
        if new_status == LoadStatus.DELIVERED:
            if not metadata or not metadata.get('pod_signature_url'):
                raise ValidationException(
                    "Proof of delivery signature required"
                )
    
    async def _trigger_downstream_actions(
        self,
        load,
        new_status: LoadStatus
    ):
        """
        CRITICAL: Trigger all financial and operational actions
        """
        
        if new_status == LoadStatus.IN_TRANSIT:
            # Start GPS tracking
            await self.tracking_svc.start_tracking(
                load.id, load.assigned_driver_id
            )
            
            # Notify shipper
            await self.notification_svc.send_departure_notification(
                load.shipper_user_id, load
            )
        
        elif new_status == LoadStatus.DELIVERED:
            # Capture escrow payment
            await self.payment_svc.capture_escrow_payment(load.id)
            
            # Update gamification score
            await self.gamification_svc.update_score_on_delivery(
                load.assigned_driver_id, load.id
            )
            
            # Notify shipper
            await self.notification_svc.send_delivery_notification(
                load.shipper_user_id, load
            )
        
        elif new_status == LoadStatus.COMPLETED:
            # Process final settlement
            await self.payment_svc.process_final_settlement(load.id)
        
        elif new_status == LoadStatus.CANCELLED:
            # Release escrow and apply penalty
            await self.payment_svc.release_escrow_hold(load.id)
            await self.payment_svc.apply_cancellation_penalty(load)
```

#### 3. Stripe Payment Integration

**File:** `backend/app/services/payment_service.py`

```python
import stripe
from stripe.error import StripeError, CardError
from decimal import Decimal
import logging
import os

logger = logging.getLogger(__name__)

class PaymentService:
    """
    CRITICAL: Complete Stripe Connect integration
    NO MOCKS - All payment operations must use actual Stripe API
    """
    
    def __init__(self):
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        if not stripe.api_key:
            raise ValueError("STRIPE_SECRET_KEY environment variable required")
    
    async def create_carrier_connect_account(self, carrier) -> str:
        """
        Create Stripe Express Connect account for carrier
        """
        try:
            account = stripe.Account.create(
                type="express",
                country=carrier.country,
                email=carrier.email,
                business_type="company",
                company={
                    "name": carrier.legal_name,
                    "tax_id": carrier.ein,
                    "address": {
                        "line1": carrier.address_line1,
                        "city": carrier.city,
                        "state": carrier.state,
                        "postal_code": carrier.zip_code,
                        "country": carrier.country
                    }
                },
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True}
                },
                settings={
                    "payouts": {
                        "schedule": {"interval": "daily"}
                    }
                },
                metadata={
                    "company_id": str(carrier.id),
                    "dot_number": carrier.dot_number,
                    "mc_number": carrier.mc_number
                }
            )
            
            logger.info(
                f"Created Stripe Connect account for carrier {carrier.id}: "
                f"{account.id}"
            )
            
            return account.id
            
        except StripeError as e:
            logger.error(f"Stripe account creation failed: {e}")
            raise PaymentServiceException(
                f"Failed to create payment account: {str(e)}"
            )
    
    async def process_load_payment(self, load, split_data) -> Dict:
        """
        CRITICAL: Process payment with automatic split
        
        Steps:
        1. Charge shipper's payment method
        2. Calculate platform fee
        3. Calculate driver commission
        4. Transfer net amount to carrier
        5. Create transaction records
        6. Send payment confirmations
        """
        
        if load.status != 'DELIVERED':
            raise PaymentServiceException(
                "Cannot process payment for non-delivered load"
            )
        
        # Get Stripe accounts
        shipper = await self.user_repo.get_by_id(load.shipper_user_id)
        carrier = await self.company_repo.get_by_id(load.carrier_company_id)
        
        if not shipper.stripe_customer_id:
            raise PaymentServiceException(
                "Shipper does not have payment method on file"
            )
        
        if not carrier.stripe_account_id:
            raise PaymentServiceException(
                "Carrier has not completed payment onboarding"
            )
        
        # Calculate amounts (in cents)
        gross_cents = int(split_data['gross_rate'] * 100)
        platform_fee_cents = int(split_data['platform_fee_amount'] * 100)
        
        try:
            # Create payment intent with application fee
            payment_intent = stripe.PaymentIntent.create(
                amount=gross_cents,
                currency='usd',
                customer=shipper.stripe_customer_id,
                off_session=True,
                confirm=True,
                application_fee_amount=platform_fee_cents,
                transfer_data={
                    "destination": carrier.stripe_account_id
                },
                metadata={
                    "load_id": str(load.id),
                    "load_number": load.load_number,
                    "shipper_id": str(load.shipper_user_id),
                    "carrier_id": str(load.carrier_company_id)
                },
                description=f"Payment for load {load.load_number}"
            )
            
            # Create transaction records
            await self._create_transaction_records(
                load, payment_intent, split_data
            )
            
            # Update load status
            load.status = 'COMPLETED'
            load.completed_at = datetime.utcnow()
            await self.load_repo.update(load)
            
            # Send notifications
            await self.notification_svc.send_payment_confirmation(
                load.shipper_user_id, load, split_data['gross_rate']
            )
            await self.notification_svc.send_payment_received(
                load.carrier_user_id, load, split_data['net_to_carrier']
            )
            
            logger.info(f"Payment processed for load {load.id}")
            
            return {
                'status': 'success',
                'payment_intent_id': payment_intent.id,
                'amount': split_data['gross_rate']
            }
            
        except CardError as e:
            logger.error(f"Card declined: {e.user_message}")
            raise PaymentServiceException(f"Payment failed: {e.user_message}")
        
        except StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise PaymentServiceException(f"Payment processing failed: {str(e)}")
```

---

## 🎨 TEAM BETA - FRONTEND & USER EXPERIENCE {#team-beta}

### Critical Implementation Requirements

#### 1. Real-Time WebSocket Integration

**File:** `frontend/src/services/WebSocketManager.ts`

```typescript
import { io, Socket } from 'socket.io-client';

interface LoadUpdate {
    type: 'STATUS_CHANGE' | 'LOCATION_UPDATE' | 'NEW_BID' | 'NEW_MESSAGE';
    data: any;
}

class WebSocketManager {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    
    connect(token: string): void {
        this.socket = io('wss://api.eusotrip.eusorone.com', {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay
        });
        
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.subscribeToUpdates();
        });
        
        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });
        
        this.socket.on('load_update', (update: LoadUpdate) => {
            this.handleLoadUpdate(update);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.attemptReconnect();
        });
    }
    
    private subscribeToUpdates(): void {
        if (this.socket) {
            this.socket.emit('subscribe', {
                channels: ['loads', 'messages', 'bids']
            });
        }
    }
    
    private handleLoadUpdate(update: LoadUpdate): void {
        // Dispatch custom event for components to listen
        window.dispatchEvent(
            new CustomEvent('load-update', { detail: update })
        );
        
        switch (update.type) {
            case 'STATUS_CHANGE':
                this.showToast(
                    `Load ${update.data.load_number} status updated to ${update.data.new_status}`
                );
                break;
            case 'NEW_BID':
                this.showToast(`New bid received on load ${update.data.load_number}`);
                this.playNotificationSound();
                break;
            case 'NEW_MESSAGE':
                this.showToast('New message received');
                break;
        }
    }
    
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.showError('Lost connection to server. Please refresh.');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            this.socket?.connect();
        }, delay);
    }
    
    private showToast(message: string): void {
        // Implementation of toast notification
        const event = new CustomEvent('show-toast', {
            detail: { message, type: 'info' }
        });
        window.dispatchEvent(event);
    }
    
    private showError(message: string): void {
        const event = new CustomEvent('show-toast', {
            detail: { message, type: 'error' }
        });
        window.dispatchEvent(event);
    }
    
    private playNotificationSound(): void {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.error('Failed to play sound:', e));
    }
    
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const websocketManager = new WebSocketManager();
```

#### 2. Complete API Client with Error Handling

**File:** `frontend/src/services/APIClient.ts`

```typescript
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

class APIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public errors?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

class APIClient {
    private client: AxiosInstance;
    private refreshPromise: Promise<string> | null = null;
    
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.eusotrip.eusorone.com/api/v1',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        this.setupInterceptors();
    }
    
    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as AxiosRequestConfig & {
                    _retry?: boolean;
                };
                
                // Handle 401 (token expired)
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        const newToken = await this.refreshToken();
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed - redirect to login
                        localStorage.clear();
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }
                
                return Promise.reject(this.handleError(error));
            }
        );
    }
    
    private async refreshToken(): Promise<string> {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        
        this.refreshPromise = (async () => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await axios.post(
                'https://api.eusotrip.eusorone.com/api/v1/auth/refresh',
                { refresh_token: refreshToken }
            );
            
            const { token, refresh_token: newRefreshToken } = response.data;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('refresh_token', newRefreshToken);
            
            this.refreshPromise = null;
            return token;
        })();
        
        return this.refreshPromise;
    }
    
    private handleError(error: AxiosError): APIError {
        if (error.response) {
            const { status, data } = error.response;
            
            switch (status) {
                case 400:
                    return new APIError(
                        'Bad request',
                        400,
                        (data as any).errors
                    );
                case 401:
                    return new APIError('Unauthorized', 401);
                case 403:
                    return new APIError('Permission denied', 403);
                case 404:
                    return new APIError('Resource not found', 404);
                case 422:
                    return new APIError(
                        'Validation failed',
                        422,
                        (data as any).errors
                    );
                case 429:
                    return new APIError('Too many requests', 429);
                case 500:
                case 502:
                case 503:
                    return new APIError('Server error. Please try again.', status);
                default:
                    return new APIError(
                        (data as any).message || 'Request failed',
                        status
                    );
            }
        } else if (error.request) {
            return new APIError('Network error. Please check your connection.');
        }
        
        return new APIError(error.message || 'Unknown error occurred');
    }
    
    // API Methods
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }
    
    async post<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }
    
    async put<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }
    
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}

export const apiClient = new APIClient();
export { APIError };
```

---

## 🤖 TEAM GAMMA - AI & SPECIALIZED SYSTEMS {#team-gamma}

### Critical Implementation Requirements

#### 1. ESANG AI Multi-Model Orchestrator

**File:** `backend/app/ai/esang_core/multi_model_orchestrator.py`

```python
import os
from typing import Dict, List, Optional
from uuid import UUID
import logging
import openai
import google.generativeai as genai
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.chat_models import ChatOpenAI
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

logger = logging.getLogger(__name__)

class ESANGMultiModelOrchestrator:
    """
    CRITICAL: Multi-model AI ecosystem
    - OpenAI GPT-4 for structured logic and commands
    - Google Gemini for creative content and summaries
    - LangChain for agent orchestration
    """
    
    def __init__(self, tools: List[Tool]):
        # Initialize OpenAI
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.logic_llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1
        )
        
        # Initialize Gemini
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.creative_llm = genai.GenerativeModel('gemini-pro')
        
        self.tools = tools
        self.agent = self._create_logic_agent()
    
    def _create_logic_agent(self) -> AgentExecutor:
        """Create LangChain agent for command execution"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_functions_agent(
            llm=self.logic_llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5
        )
    
    def _get_system_prompt(self) -> str:
        return """You are ESANG AI, the intelligent logistics assistant for EusoTrip.

**Capabilities:**
- Execute commands (assign loads, update status, create shipments)
- Query real-time data (load status, driver location, compliance)
- Provide regulatory guidance (DOT, FMCSA, HazMat/ERG)
- Assist with rate negotiations
- Generate emergency response plans

**Instructions:**
- Be professional and concise
- Use available tools to execute commands
- Cite regulations when providing compliance guidance
- If uncertain, admit it and suggest alternatives
- For emergencies, prioritize safety and immediate action

**Emergency Protocol:**
If user mentions accident, breakdown, or hazmat incident:
1. Get location and UN number (if hazmat)
2. Use ERG lookup tool for immediate guidance
3. Notify emergency services if needed
4. Document all actions for compliance"""
    
    async def process_user_request(
        self,
        user_id: UUID,
        message: str,
        context: Dict
    ) -> Dict:
        """
        CRITICAL: Main routing function for ESANG AI
        
        Steps:
        1. Classify intent
        2. Route to appropriate model/agent
        3. Execute action if needed
        4. Return response with metadata
        """
        
        # Classify intent
        intent = await self._classify_intent(message)
        logger.info(f"ESANG AI Intent: {intent} for user {user_id}")
        
        # Route based on intent
        if intent in ['COMMAND', 'NEGOTIATION', 'COMPLIANCE_QUERY']:
            # Use logic agent for structured tasks
            response = await self.agent.ainvoke({
                "input": message,
                "chat_history": await self._get_chat_history(user_id),
                "context": context
            })
            
            return {
                "message": response['output'],
                "intent": intent,
                "tool_calls": response.get('intermediate_steps', []),
                "model": "gpt-4-turbo"
            }
        
        elif intent in ['GENERAL_QUESTION', 'NEWS_SUMMARY']:
            # Use creative model for natural responses
            augmented_prompt = self._build_context_prompt(message, context)
            response = self.creative_llm.generate_content(augmented_prompt)
            
            return {
                "message": response.text,
                "intent": intent,
                "model": "gemini-pro"
            }
        
        else:
            # Fallback to logic agent
            response = await self.agent.ainvoke({
                "input": message,
                "chat_history": [],
                "context": context
            })
            
            return {
                "message": response['output'],
                "intent": "UNKNOWN",
                "model": "gpt-4-turbo"
            }
    
    async def _classify_intent(self, message: str) -> str:
        """Classify user intent using GPT-4"""
        
        classification_prompt = f"""Classify this message into one intent:
- COMMAND: User wants action (assign load, start tracking)
- NEGOTIATION: User proposing rate change
- COMPLIANCE_QUERY: Regulatory/safety question
- GENERAL_QUESTION: Non-transactional question
- NEWS_SUMMARY: Asking for news/updates
- EMERGENCY: Accident/breakdown/hazmat incident

Message: "{message}"

Intent (one word only):"""
        
        response = await self.logic_llm.ainvoke(classification_prompt)
        return response.content.strip().upper()
    
    def _build_context_prompt(self, message: str, context: Dict) -> str:
        """Build context-aware prompt for Gemini"""
        
        return f"""You are ESANG AI assisting a logistics professional.

User Context:
- Role: {context.get('role')}
- Company: {context.get('company_name')}
- Active Loads: {len(context.get('active_loads', []))}

User Query: {message}

Provide a helpful, professional response. Be concise but comprehensive."""
    
    async def _get_chat_history(self, user_id: UUID) -> List:
        """Retrieve recent chat history for context"""
        # Implementation to fetch from database
        return []
```

#### 2. ERG Emergency Response System

**File:** `backend/app/ai/erg_system/erg_intelligence.py`

```python
import json
from typing import Dict, Optional
import logging
from uuid import UUID

logger = logging.getLogger(__name__)

class ERGIntelligenceSystem:
    """
    CRITICAL: Emergency Response Guidebook AI System
    Based on ERG 2024 guidebook
    
    Must provide:
    - UN number lookup
    - Emergency procedures
    - Isolation distances
    - First aid guidance
    """
    
    def __init__(self):
        self.erg_database = self._load_erg_database()
        self.un_number_index = self._build_un_index()
    
    def _load_erg_database(self) -> Dict:
        """
        Load complete ERG 2024 guidebook
        Structure:
        - Yellow pages: UN number → Guide page
        - Blue pages: Material name → Guide page  
        - Orange pages: Emergency procedures
        - Green pages: Isolation distances
        """
        with open('data/erg_2024_database.json', 'r') as f:
            return json.load(f)
    
    def _build_un_index(self) -> Dict:
        """Build searchable index by UN number"""
        index = {}
        for entry in self.erg_database.get('yellow_pages', []):
            index[entry['un_number']] = entry
        return index
    
    async def identify_hazmat(self, un_number: str) -> Dict:
        """
        CRITICAL: Get complete hazmat information
        
        Returns:
        - Proper shipping name
        - Hazard class
        - Guide page number
        - Emergency procedures
        - Isolation distances
        - Required placards
        """
        
        # Normalize UN number
        un_number = un_number.upper()
        if not un_number.startswith('UN'):
            un_number = f"UN{un_number}"
        
        # Look up in yellow pages
        entry = self.un_number_index.get(un_number)
        if not entry:
            raise HazmatNotFoundException(
                f"UN number {un_number} not found in ERG database"
            )
        
        # Get guide page details
        guide_number = entry['guide_number']
        guide_page = self.erg_database['orange_pages'].get(guide_number, {})
        
        # Get isolation distances if required
        isolation = None
        if entry.get('isolation_required'):
            isolation = self._get_isolation_distances(un_number)
        
        return {
            "un_number": un_number,
            "proper_shipping_name": entry['proper_shipping_name'],
            "hazard_class": entry['hazard_class'],
            "packing_group": entry.get('packing_group'),
            "guide_number": guide_number,
            "emergency_procedures": {
                "potential_hazards": guide_page.get('potential_hazards', []),
                "public_safety": guide_page.get('public_safety', []),
                "emergency_response": guide_page.get('emergency_response', []),
                "fire": guide_page.get('fire_procedures', []),
                "spill_leak": guide_page.get('spill_procedures', []),
                "first_aid": guide_page.get('first_aid', [])
            },
            "isolation_distances": isolation,
            "placard_required": entry.get('placard_required', True),
            "special_provisions": entry.get('special_provisions', [])
        }
    
    def _get_isolation_distances(self, un_number: str) -> Optional[Dict]:
        """Get isolation and evacuation distances from green pages"""
        
        green_page = self.erg_database['green_pages'].get(un_number)
        if not green_page:
            return None
        
        return {
            "small_spill": {
                "initial_isolation_feet": green_page['small_spill']['isolation_distance'],
                "protective_action_distance_feet": green_page['small_spill']['protective_distance']
            },
            "large_spill": {
                "day": {
                    "initial_isolation_feet": green_page['large_spill']['day']['isolation_distance'],
                    "protective_action_distance_miles": green_page['large_spill']['day']['protective_distance']
                },
                "night": {
                    "initial_isolation_feet": green_page['large_spill']['night']['isolation_distance'],
                    "protective_action_distance_miles": green_page['large_spill']['night']['protective_distance']
                }
            }
        }
    
    async def generate_emergency_response_plan(
        self,
        load: Dict,
        incident_type: str = "spill"
    ) -> str:
        """
        CRITICAL: Generate comprehensive emergency response plan PDF
        
        Must include:
        - Material identification
        - Potential hazards
        - Public safety measures
        - Emergency response actions
        - Fire-fighting procedures
        - Spill/leak procedures
        - First aid measures
        - Isolation distances
        - Emergency contacts
        """
        
        hazmat_info = await self.identify_hazmat(load['un_number'])
        
        plan_text = f"""
EMERGENCY RESPONSE PLAN
Generated: {datetime.utcnow().isoformat()}
Load ID: {load['load_number']}

═══════════════════════════════════════════════════════════
MATERIAL IDENTIFICATION
═══════════════════════════════════════════════════════════
UN Number: {hazmat_info['un_number']}
Proper Shipping Name: {hazmat_info['proper_shipping_name']}
Hazard Class: {hazmat_info['hazard_class']}
Packing Group: {hazmat_info.get('packing_group', 'N/A')}
Guide Number: {hazmat_info['guide_number']}

═══════════════════════════════════════════════════════════
LOAD INFORMATION
═══════════════════════════════════════════════════════════
Origin: {load['origin_city']}, {load['origin_state']}
Destination: {load['destination_city']}, {load['destination_state']}
Quantity: {load['cargo_weight_lbs']} lbs
Driver: {load.get('driver_name', 'N/A')}
Vehicle: {load.get('vehicle_info', 'N/A')}

═══════════════════════════════════════════════════════════
POTENTIAL HAZARDS
═══════════════════════════════════════════════════════════
{self._format_list(hazmat_info['emergency_procedures']['potential_hazards'])}

═══════════════════════════════════════════════════════════
PUBLIC SAFETY
═══════════════════════════════════════════════════════════
{self._format_list(hazmat_info['emergency_procedures']['public_safety'])}

═══════════════════════════════════════════════════════════
EMERGENCY RESPONSE
═══════════════════════════════════════════════════════════
{self._format_list(hazmat_info['emergency_procedures']['emergency_response'])}

═══════════════════════════════════════════════════════════
FIRE
═══════════════════════════════════════════════════════════
{self._format_list(hazmat_info['emergency_procedures']['fire'])}

═══════════════════════════════════════════════════════════
SPILL OR LEAK
═══════════════════════════════════════════════════════════
{self._format_list(hazmat_info['emergency_procedures']['spill_leak'])}

═══════════════════════════════════════════════════════════
FIRST AID
═══════════════════════════════════════════════════════════
{self._format_list(hazmat_info['emergency_procedures']['first_aid'])}

═══════════════════════════════════════════════════════════
ISOLATION DISTANCES
═══════════════════════════════════════════════════════════
{json.dumps(hazmat_info['isolation_distances'], indent=2)}

═══════════════════════════════════════════════════════════
EMERGENCY CONTACTS
═══════════════════════════════════════════════════════════
CHEMTREC: 1-800-424-9300
National Response Center: 1-800-424-8802
Local Emergency Services: 911
EusoTrip Emergency Support: 1-844-EUSOTRIP
"""
        
        # Convert to PDF and upload to S3
        pdf_url = await self._generate_pdf(plan_text, load['id'])
        
        logger.info(f"Emergency response plan generated for load {load['id']}")
        
        return pdf_url
    
    def _format_list(self, items: list) -> str:
        """Format list items with bullet points"""
        if not items:
            return "No information available"
        return "\n".join([f"• {item}" for item in items])
```

#### 3. Spectra-Match™ Oil Identification System

**File:** `backend/app/ai/spectra_match/oil_identifier.py`

```python
import tensorflow as tf
import numpy as np
import pandas as pd
from typing import Dict, List
import logging
import base64

logger = logging.getLogger(__name__)

class SpectraMatchSystem:
    """
    CRITICAL: Spectra-Match™ Oil Identification AI
    CNN-based spectral analysis for crude oil identification
    
    Must provide:
    - Spectral data analysis
    - Oil grade identification
    - API gravity prediction
    - Sulfur content prediction
    - BOL verification
    """
    
    def __init__(self):
        self.model = self._load_model()
        self.oil_database = self._load_oil_database()
        self.wavelength_range = (200, 2500)  # nanometers
    
    def _load_model(self) -> tf.keras.Model:
        """Load pre-trained CNN model from S3"""
        
        model_path = 's3://eusotrip-models/spectra_match_v2.h5'
        local_path = self._download_from_s3(model_path)
        
        model = tf.keras.models.load_model(local_path)
        
        logger.info(f"Loaded Spectra-Match model: {model.summary()}")
        
        return model
    
    def _load_oil_database(self) -> pd.DataFrame:
        """
        Load crude oil specifications database
        Based on ultimate-crude-oil-spec-guide.md
        """
        
        # Load from database or CSV
        return pd.DataFrame([
            {
                "oil_name": "West Texas Intermediate (WTI)",
                "api_gravity": 39.6,
                "sulfur_content": 0.24,
                "pour_point": -25,
                "viscosity_cst": 7.5,
                "spectral_signature": self._load_spectral_signature("wti")
            },
            {
                "oil_name": "Brent Crude",
                "api_gravity": 38.3,
                "sulfur_content": 0.37,
                "pour_point": -22,
                "viscosity_cst": 8.2,
                "spectral_signature": self._load_spectral_signature("brent")
            },
            {
                "oil_name": "Dubai Crude",
                "api_gravity": 31.0,
                "sulfur_content": 2.04,
                "pour_point": -5,
                "viscosity_cst": 18.5,
                "spectral_signature": self._load_spectral_signature("dubai")
            }
            # ... Add all oils from database
        ])
    
    async def analyze_sample(
        self,
        spectral_data_base64: str,
        load_id: str
    ) -> Dict:
        """
        CRITICAL: Analyze oil sample from spectral data
        
        Steps:
        1. Decode and preprocess spectral data
        2. Run through CNN model
        3. Match prediction to database
        4. Calculate confidence score
        5. Return identification results
        """
        
        try:
            # Decode base64 spectral data
            spectral_bytes = base64.b64decode(spectral_data_base64)
            spectral_array = np.frombuffer(spectral_bytes, dtype=np.float32)
            
            # Preprocess
            processed_spectrum = self._preprocess_spectrum(spectral_array)
            
            # Predict
            prediction = self.model.predict(
                np.expand_dims(processed_spectrum, axis=0)
            )
            
            # Match to database
            matches = self._match_to_database(prediction[0])
            
            # Get top match
            primary_match = matches[0]
            
            # Verify against BOL
            bol_verification = await self._verify_against_bol(
                load_id,
                primary_match
            )
            
            # Determine verification status
            verification_status = self._determine_verification_status(
                primary_match['confidence'],
                bol_verification
            )
            
            report = {
                "primary_match": {
                    "oil_name": primary_match['oil_name'],
                    "confidence": float(primary_match['confidence']),
                    "api_gravity": float(primary_match['api_gravity']),
                    "sulfur_content": float(primary_match['sulfur_content']),
                    "viscosity_cst": float(primary_match['viscosity_cst'])
                },
                "alternative_matches": [
                    {
                        "oil_name": m['oil_name'],
                        "confidence": float(m['confidence'])
                    }
                    for m in matches[1:4]
                ],
                "bol_verification": bol_verification,
                "verification_status": verification_status,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(
                f"Spectra-Match analysis complete for load {load_id}: "
                f"{primary_match['oil_name']} ({primary_match['confidence']:.2%} confidence)"
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Spectra-Match analysis failed: {e}")
            raise SpectraMatchException(str(e))
    
    def _preprocess_spectrum(self, spectrum: np.ndarray) -> np.ndarray:
        """
        Preprocess spectral data for CNN
        
        Steps:
        1. Normalize wavelengths to standard range
        2. Apply Savitzky-Golay filter for smoothing
        3. Baseline correction
        4. Normalize intensity
        """
        
        # Normalize to wavelength range
        if len(spectrum) != 2301:  # Expected length for 200-2500nm range
            spectrum = self._interpolate_spectrum(spectrum)
        
        # Savitzky-Golay smoothing
        from scipy.signal import savgol_filter
        spectrum_smoothed = savgol_filter(
            spectrum,
            window_length=11,
            polyorder=2
        )
        
        # Baseline correction
        spectrum_corrected = self._baseline_correction(spectrum_smoothed)
        
        # Normalize intensity
        spectrum_normalized = (
            spectrum_corrected - np.mean(spectrum_corrected)
        ) / np.std(spectrum_corrected)
        
        return spectrum_normalized
    
    def _match_to_database(
        self,
        prediction: np.ndarray
    ) -> List[Dict]:
        """
        Match CNN output to oil database using cosine similarity
        """
        
        similarities = []
        
        for idx, row in self.oil_database.iterrows():
            # Calculate cosine similarity
            similarity = np.dot(
                prediction,
                row['spectral_signature']
            ) / (
                np.linalg.norm(prediction) *
                np.linalg.norm(row['spectral_signature'])
            )
            
            similarities.append({
                'oil_name': row['oil_name'],
                'api_gravity': row['api_gravity'],
                'sulfur_content': row['sulfur_content'],
                'viscosity_cst': row['viscosity_cst'],
                'confidence': similarity
            })
        
        # Sort by confidence
        similarities.sort(key=lambda x: x['confidence'], reverse=True)
        
        return similarities
    
    async def _verify_against_bol(
        self,
        load_id: str,
        match: Dict
    ) -> Dict:
        """
        Verify Spectra-Match result against Bill of Lading
        """
        
        # Get BOL from database
        bol = await self.bol_repo.get_latest_for_load(load_id)
        
        if not bol:
            return {
                "matches": False,
                "reason": "No BOL found for load"
            }
        
        # Compare material names
        bol_material = bol['cargo_name'].lower()
        match_material = match['oil_name'].lower()
        
        matches = (
            bol_material in match_material or
            match_material in bol_material
        )
        
        return {
            "matches": matches,
            "bol_material": bol['cargo_name'],
            "identified_material": match['oil_name'],
            "reason": "Materials match" if matches else "Material mismatch detected"
        }
    
    def _determine_verification_status(
        self,
        confidence: float,
        bol_verification: Dict
    ) -> str:
        """
        Determine final verification status
        """
        
        if confidence >= 0.95 and bol_verification['matches']:
            return "VERIFIED"
        elif confidence >= 0.85 and bol_verification['matches']:
            return "VERIFIED_WITH_REVIEW"
        elif not bol_verification['matches']:
            return "FAILED_BOL_MISMATCH"
        else:
            return "REVIEW_REQUIRED"
```

---

## 📱 TEAM DELTA - MOBILE DEVELOPMENT {#team-delta}

### Critical Implementation Requirements

#### 1. Zeun Mechanics™ Edge Computing Service

**File:** `EusoTrip-iOS/Services/ZeunMechanicsService.swift`

```swift
import Foundation
import CoreLocation
import Combine

class ZeunMechanicsService: NSObject, ObservableObject, CLLocationManagerDelegate {
    
    static let shared = ZeunMechanicsService()
    
    private let locationManager = CLLocationManager()
    private let geofenceManager = GeofenceManager()
    private let localNotificationService = LocalNotificationService()
    private var currentLoadId: String?
    private var currentVehicle: Vehicle?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 50  // Update every 50 meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }
    
    // MARK: - Tracking Control
    
    func startTracking(for loadId: String, vehicle: Vehicle) {
        self.currentLoadId = loadId
        self.currentVehicle = vehicle
        locationManager.startUpdatingLocation()
        print("Zeun Mechanics: Tracking started for load \(loadId)")
    }
    
    func stopTracking() {
        locationManager.stopUpdatingLocation()
        self.currentLoadId = nil
        self.currentVehicle = nil
        print("Zeun Mechanics: Tracking stopped")
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        guard let location = locations.last,
              let loadId = currentLoadId,
              let vehicle = currentVehicle else {
            return
        }
        
        // Send location update to server
        Task {
            try await APIClient.shared.sendLocationUpdate(
                loadId: loadId,
                location: location
            )
        }
        
        // Run edge-computing diagnostics
        processRealTimeDiagnostics(location: location, vehicle: vehicle)
    }
    
    // MARK: - Edge-Computing Diagnostics (CRITICAL)
    
    func processRealTimeDiagnostics(location: CLLocation, vehicle: Vehicle) {
        
        // 1. HOS Compliance Check
        let hosStatus = checkLocalHOSCompliance(vehicle.driverId)
        
        switch hosStatus {
        case .VIOLATION_IMMINENT:
            localNotificationService.sendAlert(
                title: "HOS Warning",
                body: "15 minutes until HOS violation. Find safe parking immediately."
            )
            
        case .VIOLATION:
            localNotificationService.sendAlert(
                title: "HOS VIOLATION",
                body: "Immediate stop required. Reporting to compliance."
            )
            Task {
                try await APIClient.shared.sendCriticalComplianceAlert(
                    alertType: "HOS_VIOLATION",
                    location: location
                )
            }
            
        case .COMPLIANT:
            break
        }
        
        // 2. Geofence Compliance (Restricted Routes)
        if geofenceManager.isLocationOnRestrictedRoute(location) {
            localNotificationService.sendAlert(
                title: "RESTRICTED ROUTE",
                body: "You are on a restricted route for your cargo. Rerouting."
            )
            Task {
                try await APIClient.shared.sendCriticalComplianceAlert(
                    alertType: "RESTRICTED_ROUTE_VIOLATION",
                    location: location
                )
            }
        }
        
        // 3. Vehicle Health Check
        if !isEngineHealthy(vehicle) {
            localNotificationService.sendAlert(
                title: "VEHICLE WARNING",
                body: "Engine health critical. Contact maintenance immediately."
            )
            Task {
                try await APIClient.shared.sendMaintenanceAlert(vehicle.id)
            }
        }
        
        // 4. Speed Compliance
        let speed = location.speed * 2.23694  // Convert m/s to mph
        if speed > 75.0 {  // Over speed limit
            localNotificationService.sendAlert(
                title: "SPEED WARNING",
                body: "Speed limit exceeded. Reduce speed immediately."
            )
        }
    }
    
    func checkLocalHOSCompliance(_ driverId: String) -> HOSStatus {
        // Query local ELD database for HOS data
        let eldData = ELDManager.shared.getCurrentHOSData(for: driverId)
        
        let hoursDriven = eldData.hoursOnDuty
        let requiredBreak = eldData.requiresBreak
        
        if requiredBreak || hoursDriven >= 10.0 {
            return .VIOLATION
        } else if hoursDriven >= 9.5 {
            return .VIOLATION_IMMINENT
        }
        
        return .COMPLIANT
    }
    
    func isEngineHealthy(_ vehicle: Vehicle) -> Bool {
        return vehicle.engineTemp < 250.0 && vehicle.oilPressure > 20.0
    }
}

enum HOSStatus {
    case COMPLIANT
    case VIOLATION_IMMINENT
    case VIOLATION
}
```

#### 2. EusoWallet Service

**File:** `EusoTrip-iOS/Services/EusoWalletService.swift`

```swift
import Foundation
import Combine

class EusoWalletService: ObservableObject {
    
    @Published var balance: WalletBalance?
    @Published var transactions: [Transaction] = []
    @Published var isLoading = false
    @Published var error: APIError?
    
    private let apiClient = APIClient.shared
    
    // MARK: - Data Fetching
    
    func fetchWalletData() async {
        isLoading = true
        error = nil
        
        do {
            async let balanceTask = fetchBalance()
            async let transactionsTask = fetchTransactions()
            
            let (fetchedBalance, fetchedTransactions) = try await (
                balanceTask,
                transactionsTask
            )
            
            DispatchQueue.main.async {
                self.balance = fetchedBalance
                self.transactions = fetchedTransactions
                self.isLoading = false
            }
            
        } catch let apiError as APIError {
            DispatchQueue.main.async {
                self.error = apiError
                self.isLoading = false
            }
        }
    }
    
    private func fetchBalance() async throws -> WalletBalance {
        return try await apiClient.get("/wallet/balance")
    }
    
    private func fetchTransactions() async throws -> [Transaction] {
        return try await apiClient.get("/wallet/transactions")
    }
    
    // MARK: - Quick Pay
    
    func requestQuickPay(loadId: String) async throws -> Transaction {
        let payload: [String: Any] = ["load_id": loadId]
        
        let transaction: Transaction = try await apiClient.post(
            "/wallet/quick-pay",
            body: payload
        )
        
        // Update local state
        DispatchQueue.main.async {
            self.transactions.insert(transaction, at: 0)
            if let currentBalance = self.balance {
                self.balance = WalletBalance(
                    currentBalance: currentBalance.currentBalance + transaction.amount,
                    pendingEscrow: currentBalance.pendingEscrow,
                    paySchedule: currentBalance.paySchedule
                )
            }
        }
        
        return transaction
    }
    
    // MARK: - Payout Schedule
    
    func updatePayoutSchedule(schedule: PaySchedule) async throws {
        let payload: [String: String] = ["schedule": schedule.rawValue]
        
        let updatedBalance: WalletBalance = try await apiClient.put(
            "/wallet/payout-schedule",
            body: payload
        )
        
        DispatchQueue.main.async {
            self.balance = updatedBalance
        }
    }
}

// MARK: - Models

struct WalletBalance: Codable {
    let currentBalance: Double
    let pendingEscrow: Double
    let paySchedule: PaySchedule
}

struct Transaction: Codable, Identifiable {
    let id: String
    let amount: Double
    let type: String
    let loadId: String?
    let timestamp: Date
    let description: String
}

enum PaySchedule: String, Codable, CaseIterable {
    case quickPay = "QUICK_PAY"
    case weekly = "WEEKLY"
    case monthly = "MONTHLY"
    
    var displayName: String {
        switch self {
        case .quickPay: return "Quick Pay (3% fee)"
        case .weekly: return "Weekly"
        case .monthly: return "Monthly"
        }
    }
}
```

---

## ☁️ AWS DEPLOYMENT ARCHITECTURE {#aws-deployment}

### Complete Infrastructure as Code

#### 1. Elastic Beanstalk Configuration

**File:** `infrastructure/.ebextensions/01_environment.config`

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    PYTHON_VERSION: "3.11"
    DATABASE_URL: "postgresql://user:pass@rds-endpoint:5432/eusotrip"
    REDIS_URL: "redis://elasticache-endpoint:6379/0"
    STRIPE_SECRET_KEY: "sk_live_xxxxx"
    OPENAI_API_KEY: "sk-xxxxx"
    GOOGLE_API_KEY: "xxxxx"
    JWT_SECRET_KEY: "xxxxx"
    
  aws:elasticbeanstalk:container:python:
    WSGIPath: "app.main:app"
    
  aws:elasticbeanstalk:environment:process:default:
    HealthCheckPath: "/health"
    HealthCheckInterval: 30
    HealthCheckTimeout: 5
    UnhealthyThresholdCount: 3
    HealthyThresholdCount: 3
    
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
    
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 20
```

#### 2. RDS Database Configuration

**File:** `infrastructure/terraform/rds.tf`

```hcl
resource "aws_db_instance" "eusotrip_db" {
  identifier        = "eusotrip-production"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.r6g.xlarge"
  allocated_storage = 500
  storage_type      = "gp3"
  
  db_name  = "eusotrip"
  username = "eusotrip_admin"
  password = var.db_password
  
  multi_az               = true
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  
  tags = {
    Name        = "EusoTrip Production DB"
    Environment = "production"
  }
}

resource "aws_db_instance" "eusotrip_replica" {
  count = 2
  
  identifier          = "eusotrip-replica-${count.index + 1}"
  replicate_source_db = aws_db_instance.eusotrip_db.identifier
  instance_class      = "db.r6g.large"
  
  tags = {
    Name        = "EusoTrip Read Replica ${count.index + 1}"
    Environment = "production"
  }
}
```

---

## ✅ QUALITY STANDARDS & ENFORCEMENT {#quality-standards}

### Definition of DONE

A feature is considered DONE when ALL of the following are met:

1. ✅ **Complete Business Logic**
   - No TODO comments
   - No placeholder functions
   - All edge cases handled

2. ✅ **80%+ Test Coverage**
   - Unit tests for all business logic
   - Integration tests for API endpoints
   - E2E tests for critical workflows

3. ✅ **Performance Requirements Met**
   - P99 latency < 50ms for critical endpoints
   - All database queries indexed
   - Load testing passed (10,000+ concurrent users)

4. ✅ **Security Audit Passed**
   - No SQL injection vulnerabilities
   - All inputs validated
   - Authentication on all protected routes
   - Rate limiting implemented

5. ✅ **Documentation Complete**
   - API documentation (OpenAPI/Swagger)
   - Code comments for complex logic
   - README with setup instructions

6. ✅ **Code Review Approved**
   - At least 2 team members reviewed
   - All comments addressed
   - No merge conflicts

7. ✅ **Deployed to Staging**
   - Successfully deployed without errors
   - Smoke tests passed
   - Monitoring configured

### Code Quality Enforcement

**Automated Quality Gates:**

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Tests
        run: |
          pytest tests/ --cov=app --cov-report=xml
          
      - name: Check Coverage
        run: |
          coverage report --fail-under=80
          
      - name: Lint Code
        run: |
          flake8 app/ --max-line-length=100
          pylint app/ --fail-under=8.0
          
      - name: Type Check
        run: |
          mypy app/ --strict
          
      - name: Security Scan
        run: |
          bandit -r app/ -ll
          
      - name: Performance Test
        run: |
          locust -f tests/load_tests.py --headless -u 1000 -r 100 -t 5m
```

---

## 📚 API DOCUMENTATION {#api-documentation}

### Complete API Specification

**File:** `backend/openapi.yaml`

```yaml
openapi: 3.0.0
info:
  title: EusoTrip Platform API
  version: 1.0.0
  description: |
    Complete API for the EusoTrip logistics platform.
    
    **Authentication:** All endpoints require JWT Bearer token unless marked as public.
    
    **Rate Limiting:** 1000 requests per hour per user.
    
    **Errors:** Standard HTTP status codes with detailed error messages.

servers:
  - url: https://api.eusotrip.eusorone.com/api/v1
    description: Production server
  - url: https://staging-api.eusotrip.eusorone.com/api/v1
    description: Staging server

security:
  - bearerAuth: []

paths:
  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  format: password
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  refresh_token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Invalid credentials
        '429':
          description: Too many login attempts

  /loads:
    get:
      summary: List loads
      tags: [Loads]
      parameters:
        - in: query
          name: status
          schema:
            type: string
            enum: [DRAFT, POSTED, ASSIGNED, IN_TRANSIT, DELIVERED, COMPLETED]
        - in: query
          name: page
          schema:
            type: integer
            default: 1
        - in: query
          name: per_page
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: List of loads
          content:
            application/json:
              schema:
                type: object
                properties:
                  loads:
                    type: array
                    items:
                      $ref: '#/components/schemas/Load'
                  total:
                    type: integer
                  page:
                    type: integer
                  per_page:
                    type: integer

    post:
      summary: Create load
      tags: [Loads]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoadCreate'
      responses:
        '201':
          description: Load created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Load'
        '422':
          description: Validation error

  /loads/{load_id}/transition:
    post:
      summary: Transition load state
      tags: [Loads]
      parameters:
        - in: path
          name: load_id
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [new_status]
              properties:
                new_status:
                  type: string
                  enum: [POSTED, ASSIGNED, PRE_LOADING, LOADING, IN_TRANSIT, UNLOADING, DELIVERED, COMPLETED, CANCELLED]
                location:
                  type: object
                  properties:
                    lat:
                      type: number
                    lng:
                      type: number
                metadata:
                  type: object
      responses:
        '200':
          description: State transitioned successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Load'
        '400':
          description: Invalid state transition
        '403':
          description: Permission denied

  /wallet/balance:
    get:
      summary: Get wallet balance
      tags: [Wallet]
      responses:
        '200':
          description: Wallet balance
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletBalance'

  /wallet/quick-pay:
    post:
      summary: Request quick pay
      tags: [Wallet]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [load_id]
              properties:
                load_id:
                  type: string
                  format: uuid
      responses:
        '200':
          description: Quick pay processed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Transaction'
        '400':
          description: Load not eligible for quick pay

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        first_name:
          type: string
        last_name:
          type: string
        role:
          type: string
          enum: [SHIPPER, CARRIER, DRIVER, BROKER, ADMIN]
        created_at:
          type: string
          format: date-time

    Load:
      type: object
      properties:
        id:
          type: string
          format: uuid
        load_number:
          type: string
        status:
          type: string
        cargo_type:
          type: string
        origin_city:
          type: string
        origin_state:
          type: string
        destination_city:
          type: string
        destination_state:
          type: string
        agreed_rate:
          type: number
          format: decimal
        distance_miles:
          type: number
        pickup_date_start:
          type: string
          format: date-time
        delivery_date_start:
          type: string
          format: date-time

    LoadCreate:
      type: object
      required:
        - cargo_type
        - origin_address
        - destination_address
        - pickup_date_start
        - delivery_date_start
      properties:
        cargo_type:
          type: string
          enum: [GENERAL_FREIGHT, HAZMAT, REFRIGERATED, OVERSIZED, LIQUID_BULK, DRY_BULK]
        origin_address:
          type: string
        destination_address:
          type: string
        pickup_date_start:
          type: string
          format: date-time
        delivery_date_start:
          type: string
          format: date-time
        cargo_weight_lbs:
          type: number
        cargo_description:
          type: string

    WalletBalance:
      type: object
      properties:
        current_balance:
          type: number
          format: decimal
        pending_escrow:
          type: number
          format: decimal
        pay_schedule:
          type: string
          enum: [QUICK_PAY, WEEKLY, MONTHLY]

    Transaction:
      type: object
      properties:
        id:
          type: string
          format: uuid
        amount:
          type: number
          format: decimal
        type:
          type: string
        load_id:
          type: string
          format: uuid
        timestamp:
          type: string
          format: date-time
```

---

## 🧪 TESTING REQUIREMENTS {#testing-requirements}

### Comprehensive Test Suite

#### 1. Unit Tests

**File:** `backend/tests/services/test_commission_service.py`

```python
import pytest
from decimal import Decimal
from uuid import uuid4
from app.services.commission_service import CommissionService
from app.models import Load

@pytest.fixture
def mock_load():
    return Load(
        id=uuid4(),
        agreed_rate=Decimal('1000.00'),
        cargo_type='GENERAL_FREIGHT',
        distance_miles=500,
        assigned_driver_id=uuid4(),
        carrier_company_id=uuid4()
    )

@pytest.fixture
def commission_service(mocker):
    transaction_repo = mocker.Mock()
    commodity_api = mocker.Mock()
    gamification_svc = mocker.Mock()
    
    return CommissionService(
        transaction_repo,
        commodity_api,
        gamification_svc
    )

@pytest.mark.asyncio
async def test_calculate_split_basic(commission_service, mock_load, mocker):
    """Test basic commission split calculation"""
    
    # Mock gamification score
    mocker.patch.object(
        commission_service.gamification_svc,
        'get_driver_score',
        return_value=0.85
    )
    
    # Mock commodity factor
    mocker.patch.object(
        commission_service,
        '_get_commodity_factor',
        return_value=Decimal('1.0')
    )
    
    result = await commission_service.calculate_split(mock_load)
    
    assert result['gross_rate'] == Decimal('1000.00')
    assert result['platform_fee_amount'] > 0
    assert result['driver_commission_amount'] == Decimal('250.00')
    assert result['net_to_carrier'] > 0
    assert (
        result['gross_rate'] ==
        result['platform_fee_amount'] +
        result['driver_commission_amount'] +
        result['net_to_carrier']
    )

@pytest.mark.asyncio
async def test_calculate_split_hazmat_premium(commission_service, mocker):
    """Test that hazmat cargo increases platform fee"""
    
    hazmat_load = Load(
        id=uuid4(),
        agreed_rate=Decimal('1000.00'),
        cargo_type='HAZMAT',
        distance_miles=500,
        assigned_driver_id=uuid4(),
        carrier_company_id=uuid4()
    )
    
    mocker.patch.object(
        commission_service.gamification_svc,
        'get_driver_score',
        return_value=0.85
    )
    
    mocker.patch.object(
        commission_service,
        '_get_commodity_factor',
        return_value=Decimal('1.0')
    )
    
    result = await commission_service.calculate_split(hazmat_load)
    
    # Hazmat should have higher platform fee
    assert result['platform_fee_rate'] > commission_service.BASE_PLATFORM_FEE

@pytest.mark.asyncio
async def test_gamification_bonus_reduces_fee(commission_service, mocker):
    """Test that high gamification score reduces platform fee"""
    
    mock_load = Load(
        id=uuid4(),
        agreed_rate=Decimal('1000.00'),
        cargo_type='GENERAL_FREIGHT',
        distance_miles=500,
        assigned_driver_id=uuid4(),
        carrier_company_id=uuid4()
    )
    
    # High score
    mocker.patch.object(
        commission_service.gamification_svc,
        'get_driver_score',
        return_value=0.95
    )
    
    mocker.patch.object(
        commission_service,
        '_get_commodity_factor',
        return_value=Decimal('1.0')
    )
    
    result_high_score = await commission_service.calculate_split(mock_load)
    
    # Low score
    mocker.patch.object(
        commission_service.gamification_svc,
        'get_driver_score',
        return_value=0.50
    )
    
    result_low_score = await commission_service.calculate_split(mock_load)
    
    # High score should have lower platform fee
    assert result_high_score['platform_fee_rate'] < result_low_score['platform_fee_rate']
```

#### 2. Integration Tests

**File:** `backend/tests/integration/test_load_lifecycle.py`

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_complete_load_lifecycle():
    """Test complete load lifecycle from creation to completion"""
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 1. Login as shipper
        login_response = await client.post("/api/v1/auth/login", json={
            "email": "shipper@test.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create load
        load_data = {
            "cargo_type": "GENERAL_FREIGHT",
            "origin_address": "123 Main St, Houston, TX",
            "destination_address": "456 Oak Ave, Dallas, TX",
            "pickup_date_start": "2025-11-01T08:00:00Z",
            "delivery_date_start": "2025-11-02T08:00:00Z",
            "cargo_weight_lbs": 10000
        }
        create_response = await client.post(
            "/api/v1/loads",
            json=load_data,
            headers=headers
        )
        assert create_response.status_code == 201
        load_id = create_response.json()["id"]
        
        # 3. Transition to POSTED
        transition_response = await client.post(
            f"/api/v1/loads/{load_id}/transition",
            json={"new_status": "POSTED"},
            headers=headers
        )
        assert transition_response.status_code == 200
        assert transition_response.json()["status"] == "POSTED"
        
        # 4. Login as carrier and accept load
        carrier_login = await client.post("/api/v1/auth/login", json={
            "email": "carrier@test.com",
            "password": "test123"
        })
        carrier_token = carrier_login.json()["token"]
        carrier_headers = {"Authorization": f"Bearer {carrier_token}"}
        
        # 5. Assign load
        assign_response = await client.post(
            f"/api/v1/loads/{load_id}/transition",
            json={"new_status": "ASSIGNED"},
            headers=carrier_headers
        )
        assert assign_response.status_code == 200
        
        # 6. Start loading (requires location)
        loading_response = await client.post(
            f"/api/v1/loads/{load_id}/transition",
            json={
                "new_status": "LOADING",
                "location": {"lat": 29.7604, "lng": -95.3698}
            },
            headers=carrier_headers
        )
        assert loading_response.status_code == 200
        
        # 7. In transit
        transit_response = await client.post(
            f"/api/v1/loads/{load_id}/transition",
            json={"new_status": "IN_TRANSIT"},
            headers=carrier_headers
        )
        assert transit_response.status_code == 200
        
        # 8. Delivered (requires POD)
        delivery_response = await client.post(
            f"/api/v1/loads/{load_id}/transition",
            json={
                "new_status": "DELIVERED",
                "metadata": {
                    "pod_signature_url": "https://s3.aws/pod/12345.png"
                }
            },
            headers=carrier_headers
        )
        assert delivery_response.status_code == 200
        
        # 9. Verify payment processed
        wallet_response = await client.get(
            "/api/v1/wallet/balance",
            headers=carrier_headers
        )
        assert wallet_response.status_code == 200
        # Verify balance increased
```

#### 3. Load Testing

**File:** `backend/tests/load_tests.py`

```python
from locust import HttpUser, task, between

class EusoTripUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks"""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "load_test@test.com",
            "password": "test123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def view_loads(self):
        """Most common operation: View loads"""
        self.client.get(
            "/api/v1/loads?status=POSTED",
            headers=self.headers
        )
    
    @task(2)
    def view_dashboard(self):
        """View dashboard stats"""
        self.client.get(
            "/api/v1/dashboard/stats",
            headers=self.headers
        )
    
    @task(1)
    def create_load(self):
        """Create new load"""
        self.client.post(
            "/api/v1/loads",
            json={
                "cargo_type": "GENERAL_FREIGHT",
                "origin_address": "Test Origin",
                "destination_address": "Test Destination",
                "pickup_date_start": "2025-11-01T08:00:00Z",
                "delivery_date_start": "2025-11-02T08:00:00Z"
            },
            headers=self.headers
        )
```

---

## 🚨 FINAL WARNING & CONSEQUENCES

### Rejection Criteria

Your code will be **IMMEDIATELY REJECTED** if it contains:

1. ❌ **Placeholder comments**
   - "TODO: Implement this later"
   - "FIXME: This is a temporary solution"
   - "// This would do X in production"

2. ❌ **Hardcoded values**
   - `commission_rate = 0.15`
   - `platform_fee = 0.08`
   - Mock API responses

3. ❌ **Missing error handling**
   - No try-catch blocks
   - No input validation
   - No rollback logic

4. ❌ **Incomplete implementations**
   - Functions that return empty objects
   - Endpoints that always return 200 OK
   - Services that don't integrate with external APIs

5. ❌ **Poor performance**
   - Unindexed database queries
   - N+1 query problems
   - P99 latency > 50ms

### Enforcement Actions

**First Offense:**
- Code rejected
- 500-word written explanation required
- Re-implementation within 48 hours

**Second Offense:**
- Code rejected
- Team lead removed from project
- Full code review of all previous submissions

**Third Offense:**
- Team disbanded
- All code rewritten by new team
- Leadership team replaced

---

## 📞 SUPPORT & ESCALATION

### Emergency Contacts

**Technical Blockers:**
- Slack: #eusotrip-dev-emergency
- Email: dev-support@eusorone.com

**Architecture Questions:**
- Lead Architect: architect@eusorone.com

**CEO Direct Line (Critical Issues Only):**
- Mike "Diego" Usoro: diego@eusorone.com
- Use only for: Production outages, security breaches, legal issues

### Daily Standup Format

**Every Day at 9:00 AM CT:**

```
Team: [Alpha/Beta/Gamma/Delta]
Date: [YYYY-MM-DD]
Progress: [X]%

✅ Completed Yesterday:
- [Feature 1]
- [Feature 2]

🚧 In Progress Today:
- [Feature 3]
- [Feature 4]

🚫 Blockers:
- [Blocker 1] - Need [Resource/Decision]

📊 Metrics:
- Lines of Code: [X,XXX]
- Test Coverage: [XX]%
- P99 Latency: [XX]ms
```

---

## ✅ SUCCESS METRICS

### Platform Launch Readiness Checklist

- [ ] All 35+ database tables created and indexed
- [ ] All 200+ API endpoints functional
- [ ] Real-time WebSocket communication operational
- [ ] Stripe payments processing successfully (test mode)
- [ ] GPS tracking functional
- [ ] ESANG AI responding with <2s latency
- [ ] ERG system providing hazmat guidance
- [ ] Spectra-Match™ analyzing samples with 95%+ confidence
- [ ] Mobile apps (iOS/Android) submitted to app stores
- [ ] Web application deployed to production
- [ ] Load testing passed (10,000+ concurrent users)
- [ ] Security audit completed (no critical vulnerabilities)
- [ ] All documentation complete
- [ ] Customer support team trained
- [ ] Monitoring and alerting configured
- [ ] Disaster recovery plan tested
- [ ] Legal compliance verified (FMCSA, DOT, GDPR)

---

## 🎯 FINAL MANDATE

This document represents the **ULTIMATE AUTHORITY** for EusoTrip platform development. Every line of code must meet these standards. No exceptions. No shortcuts. No excuses.

**The future of Eusorone Technologies depends on execution with precision.**

**Build it right the first time.**

---

**END OF EUSOTRIP ULTIMATE DEVELOPMENT DIRECTIVE**

**Document Version:** 3.0 Enhanced  
**Authority:** Mike "Diego" Usoro, CEO & Founder  
**Classification:** CRITICAL - IMMEDIATE EXECUTION REQUIRED  
**Date:** October 29, 2025

---

*"Excellence is not an act, but a habit. We are what we repeatedly do."*  
*— Aristotle*