# KrishiSetu Nexus - Supabase Cloud PostgreSQL Schema & Migration Runner

> **Tagline:** *From farmer question to verified farm action.*  
> Production PostgreSQL schema, Row Level Security (RLS) policies, seed scenario data, and Node.js migration runner targeting **Supabase Cloud**.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Schema (33 Entities)](#database-schema-33-entities)
3. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
4. [Seed Demonstration Data](#seed-demonstration-data)
5. [Prerequisites & Setup](#prerequisites--setup)
6. [Migration Runner Usage](#migration-runner-usage)
7. [Validation & Testing](#validation--testing)

---

## 1. Overview

This directory provides the complete database foundation for **KrishiSetu Nexus**:
- **Migration Script:** [`/supabase/migrations/001_initial_schema.sql`](file:///c:/main/supabase/migrations/001_initial_schema.sql)
- **Node.js Migration Runner:** [`/scripts/migrate.js`](file:///c:/main/scripts/migrate.js)
- **Schema Validator:** [`/scripts/validate_schema.js`](file:///c:/main/scripts/validate_schema.js)
- **Environment Template:** [`.env.example`](file:///c:/main/.env.example)

The schema defines all 33 business and operational entities, enables Row Level Security (RLS) on each table with granular access rules, installs auto-updating timestamp triggers and query indexes, and loads complete seed data for the 1-acre tomato farm demonstration scenario.

---

## 2. Database Schema (33 Entities)

The schema is deployed in `public` schema and links seamlessly with Supabase Auth:

| # | Entity Table | Primary Responsibility |
|---|---|---|
| 1 | `public.profiles` | User identity linked to Supabase auth with roles (`farmer`, `agronomist`, `seller`, `service_provider`, `fpo_manager`, `admin`). |
| 2 | `public.farmer_profiles` | Farmer-specific preferences (language, literacy mode, voice guidance, FPO link). |
| 3 | `public.farms` | Farm parcel details (acreage, GPS location, soil category, irrigation source). |
| 4 | `public.crops` | Crop records (variety, sowing date, growth stage, health status). |
| 5 | `public.crop_observations` | Farmer questions, symptoms, audio voice notes, photo/video evidence, and sensor readings. |
| 6 | `public.livestock_profiles` | Animal profiles (cattle, buffalo, poultry, fisheries) and vaccination history. |
| 7 | `public.diagnoses` | AI & expert diagnoses with pathogen type, confidence score, and visual evidence. |
| 8 | `public.pest_reports` | Pest surveillance observations and geospatial hotspot coordinates. |
| 9 | `public.weather_snapshots` | Weather parameters, rain probabilities, spray window advisories, and irrigation suggestions. |
| 10 | `public.soil_reports` | Soil test lab records (pH, N-P-K, organic carbon, micronutrients, accreditation). |
| 11 | `public.agricultural_documents` | Official advisories, CIB-RC pesticide labels, and government policy PDFs. |
| 12 | `public.sellers` | Input seller store profiles, dealer licenses, GST, district, and ratings. |
| 13 | `public.seller_verifications` | Seller verification audit records (physical KYC, government license status). |
| 14 | `public.products` | Verified agrochemical, organic, seed, and equipment inventory. |
| 15 | `public.product_labels` | CIB-RC approved label guidelines (dosage/acre, dilution, PPE, pre-harvest interval). |
| 16 | `public.product_batches` | Batch records with manufacturing date, expiry date, QR codes, and authenticity tags. |
| 17 | `public.service_providers` | Custom hiring centers, drone spraying pilots, and soil test laboratories. |
| 18 | `public.service_listings` | Service offerings (per acre, per hour, per sample) with transparent pricing. |
| 19 | `public.equipment` | Drones, tractors, rotavators, and spray pumps with maintenance tracking. |
| 20 | `public.orders` | Farmer purchase orders with transparent itemized cost breakdown and consent. |
| 21 | `public.order_items` | Individual product lines tied to specific batches and unit prices. |
| 22 | `public.bookings` | Booked agricultural services with appointment schedules and completion proof. |
| 23 | `public.payments` | Payment transactions supporting simulated UPI, card, COD, and KCC credit. |
| 24 | `public.deliveries` | Courier dispatch, real-time logistics tracking, and proof-of-delivery URLs. |
| 25 | `public.return_requests` | Farmer return disputes (counterfeit alert, damaged seal, expired items). |
| 26 | `public.tasks` | Field action tasks (spray, scout, irrigate, rescan) with offline synchronization. |
| 27 | `public.notifications` | High-priority push notifications (weather alerts, spray delays, pest warnings). |
| 28 | `public.market_prices` | APMC mandi modal, minimum, and maximum prices with timestamped sources. |
| 29 | `public.government_schemes` | Crop insurance (PMFBY), mechanization subsidies (SMAM), and PKVY organic aids. |
| 30 | `public.expert_reviews` | Agronomist escalation reviews, diagnosis corrections, and risk certifications. |
| 31 | `public.follow_up_observations`| Before-and-after photo comparisons verifying treatment efficacy. |
| 32 | `public.audit_logs` | Immutable audit trail of diagnoses, orders, approvals, and data consents. |
| 33 | `public.consent_records` | Granular privacy consent records (GPS, media, audio, seller data sharing). |

---

## 3. Row Level Security (RLS) Policies

All 33 tables have **Row Level Security (RLS) enabled**. Security policies implement role-based access control (RBAC):

1. **Public / Anonymous Access:**
   - Read-only browsing for active verified products (`public.products`), product labels, batches, and seller stores.
   - Public service listings (`public.service_listings`) and operational equipment.
   - Public market prices (`public.market_prices`), government schemes, weather snapshots, and pest surveillance hotspots.
2. **Farmer Self-Management:**
   - Farmers can view and mutate only their own profile, farms, crops, observations, orders, bookings, tasks, and consent records.
3. **Sellers & Service Providers:**
   - Sellers can create, edit, and restock only their own products, labels, and batch entries.
   - Service providers can manage only their own equipment, service catalog, and assigned bookings.
4. **Agronomists & Agriculture Officers:**
   - Review escalated diagnoses, issue expert treatment approvals, and inspect product labels.
5. **System & Administrator Role:**
   - Service role keys and system administrators have unconstrained access for audits, verifications, and system jobs.

---

## 4. Seed Demonstration Data

The seed script loads a complete, end-to-end scenario based on the project specification:
- **Location:** Kolar District, Karnataka.
- **Farmer:** Ramesh Patel (Kannada & English preferred, 12 years farming experience).
- **Farm & Crop:** 1.0 Acre Tomato field, Arka Rakshak F1 hybrid, in flowering stage.
- **Problem Observation:** Fungal concentric target rings on lower foliage; audio inquiry: *"Can I spray today? Rain is expected tomorrow."*
- **AI Diagnosis:** Early Blight (*Alternaria solani*) with 88.5% confidence and visual evidence.
- **Weather Advisory:** Rain expected within 8–12 hours (78% probability) $\rightarrow$ **`delay_rain_expected`** advisory to prevent fungicide runoff.
- **Soil Report:** Kolar ICAR-KVK lab report indicating pH 5.8 (mildly acidic) and low nitrogen (142 kg/ha).
- **Marketplace Inputs:**
  - *Dithane M-45 (Mancozeb 75% WP)*: Verified chemical fungicide.
  - *Blitox 50 (Copper Oxychloride 50% WP)*: Verified contact fungicide.
  - *EcoShield Bio-Fungicide (Trichoderma viride)*: Verified organic biological alternative.
  - *Amistar Top*: Out-of-stock item (demonstrates inventory handling).
  - *Kisan Chlorpyrifos 20% EC*: **Expired stock (blocked by Trust & Safety agent)**.
  - *Super Growth Leaf Tonic*: **Unregistered product (flagged for missing label)**.
- **Service Listings:** DJI Agras T40 precision drone spraying, ICAR soil testing, agronomist field visit, and tractor hiring.
- **Mandi Prices:** Live tomato rates from Kolar APMC, Chikkaballapur APMC, and Bangalore APMC.
- **Government Schemes:** PMFBY Crop Insurance, SMAM 50% Drone Subsidy, and PKVY Organic Scheme.
- **Follow-up Verification:** Day 4 rescan showing fungal lesion arrest after post-rain spraying.

---

## 5. Prerequisites & Environment Setup

### Environment Files Structure
The project separates concerns between the server and client while defining a **single canonical public URL** for external farmer access:

```
├── .env.example             # Root migration runner credentials template
├── backend/
│   ├── .env                 # Backend active environment variables (server secrets, DB URI)
│   └── .env.example         # Backend template
└── frontend/
    ├── .env                 # Frontend active environment variables (public keys, app URLs)
    └── .env.example         # Frontend template
```

### URLs Architecture

| Scope | Environment Variable | Typical Value | Accessibility & Description |
|---|---|---|---|
| **Single Public URL** | `PUBLIC_URL` / `VITE_PUBLIC_URL` / `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (Dev) <br> `https://krishisetu.nexus.app` (Prod) | **Accessible to all:** The unified canonical URL through which farmers, officers, and mobile web clients reach the app. |
| **Backend Internal** | `BACKEND_URL` / `PORT` | `http://localhost:5000` (`PORT=5000`) | Server bind address for REST/WebSocket handlers. |
| **Backend Public API** | `PUBLIC_API_URL` / `VITE_API_BASE_URL` | `http://localhost:5000/api` (or `${PUBLIC_URL}/api`) | Endpoint for frontend HTTP requests with CORS configured. |
| **Database Connection** | `DATABASE_URL` | `postgresql://postgres:...@db...supabase.co:5432/postgres` | **Backend/Migration only:** Direct PostgreSQL connection. |
| **Supabase Client** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | `https://[ref].supabase.co` | **Public Safe:** Client browser Supabase instance using anon key. |
| **Supabase Admin** | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | **Strictly Confidential:** Server-only admin bypass key. |

### Install Dependencies
Dependencies are already configured in `package.json`:
```bash
npm install
```

### Configure Credentials
Copy the example templates:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Fill in your Supabase project credentials in `.env` and `backend/.env`. For raw DDL migrations and table creation, **`DATABASE_URL`** is the standard approach:

```env
# Direct PostgreSQL connection string from Supabase Dashboard:
# Dashboard -> Project Settings -> Database -> Connection string -> URI
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

*Alternatively, if your ISP has IPv4 restrictions, use the connection pooler URI (Port 6543):*
```env
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## 6. Migration Runner Usage

The migration runner ([`scripts/migrate.js`](file:///c:/main/scripts/migrate.js)) automatically:
1. Connects to Supabase PostgreSQL using SSL.
2. Initializes the `public._schema_migrations` tracking table.
3. Checks which migrations have already run.
4. Executes pending migrations idempotently.

### Run Migrations
```bash
npm run migrate
```

### Check Migration Status
```bash
npm run migrate:status
```

### Dry Run (Test without modifying database)
```bash
npm run migrate:dry-run
```

### Force Re-apply Migrations
```bash
npm run migrate:force
```

---

## 7. Validation & Testing

Run the automated schema and seed validation suite:
```bash
npm run test:schema
```

This verifies:
- Existence and integrity of [`supabase/migrations/001_initial_schema.sql`](file:///c:/main/supabase/migrations/001_initial_schema.sql)
- All 33 tables are defined
- All 33 tables have RLS enabled
- Custom security policies are active
- Indexes and timestamp triggers exist
- All seed demonstration records are included
