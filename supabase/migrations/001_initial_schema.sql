-- ============================================================================
-- KrishiSetu Nexus - Supabase PostgreSQL Initial Migration
-- Migration: 001_initial_schema.sql
-- Description: Core schema, tables, foreign keys, triggers, Row Level Security
--              (RLS) policies, and seed demonstration data.
-- ============================================================================

-- 1. PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. Utility Functions & Triggers
-- ============================================================================

-- Generic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if current authenticated user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Retrieve role for a user
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. Table Definitions (33 Entities)
-- ============================================================================

-- 3.1 User Profiles (Mirrors auth.users while supporting direct demo seeding)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    full_name text NOT NULL,
    phone text,
    role text NOT NULL CHECK (role IN ('farmer', 'agronomist', 'seller', 'service_provider', 'fpo_manager', 'admin')),
    preferred_language text DEFAULT 'en',
    is_verified boolean DEFAULT false,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger to keep auth.users and profiles in sync if auth schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $inner$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>''full_name'', split_part(COALESCE(new.email, ''user@krishisetu.io''), ''@'', 1)),
          COALESCE(new.raw_user_meta_data->>''role'', ''farmer''),
          COALESCE(new.raw_user_meta_data->>''preferred_language'', ''en'')
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role;
        RETURN NEW;
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    ';
  END IF;
END $$;

-- 3.2 Farmer Profile
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_language text NOT NULL DEFAULT 'en',
    experience_years integer DEFAULT 0,
    literacy_assistance_enabled boolean DEFAULT true,
    voice_guidance_enabled boolean DEFAULT true,
    fpo_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.3 Farms
CREATE TABLE IF NOT EXISTS public.farms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    total_acres numeric(6,2) NOT NULL CHECK (total_acres > 0),
    location_name text NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    soil_type text DEFAULT 'Red Sandy Loam',
    irrigation_source text DEFAULT 'Borewell',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.4 Crops
CREATE TABLE IF NOT EXISTS public.crops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    crop_name text NOT NULL,
    variety text,
    acreage numeric(6,2) NOT NULL CHECK (acreage > 0),
    sowing_date date NOT NULL,
    stage text NOT NULL CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'harvesting')),
    expected_harvest_date date,
    health_status text NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'attention_needed', 'critical', 'under_treatment')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.5 Crop Observations
CREATE TABLE IF NOT EXISTS public.crop_observations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symptoms text NOT NULL,
    voice_note_url text,
    voice_transcript text,
    image_url text,
    video_url text,
    sensor_readings jsonb DEFAULT '{}'::jsonb,
    urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'diagnosing', 'diagnosed', 'escalated', 'resolved')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.6 Livestock Profiles
CREATE TABLE IF NOT EXISTS public.livestock_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    animal_type text NOT NULL CHECK (animal_type IN ('cattle', 'buffalo', 'poultry', 'fisheries', 'goat_sheep', 'other')),
    breed text,
    herd_size integer NOT NULL DEFAULT 1 CHECK (herd_size > 0),
    age_months integer,
    health_status text DEFAULT 'healthy',
    vaccination_records jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.7 Diagnoses
CREATE TABLE IF NOT EXISTS public.diagnoses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id uuid NOT NULL REFERENCES public.crop_observations(id) ON DELETE CASCADE,
    disease_name text NOT NULL,
    scientific_name text,
    pathogen_type text NOT NULL CHECK (pathogen_type IN ('fungal', 'bacterial', 'viral', 'pest', 'deficiency', 'weed', 'environmental', 'other')),
    confidence_score numeric(4,3) NOT NULL CHECK (confidence_score >= 0.000 AND confidence_score <= 1.000),
    severity text NOT NULL CHECK (severity IN ('low', 'moderate', 'severe', 'critical')),
    visual_evidence text NOT NULL,
    recommended_next_observation text,
    requires_expert_review boolean DEFAULT false,
    is_verified_by_expert boolean DEFAULT false,
    verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.8 Pest Reports
CREATE TABLE IF NOT EXISTS public.pest_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pest_type text NOT NULL,
    crop_name text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'moderate', 'severe')),
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    location_name text NOT NULL,
    observation_date date NOT NULL DEFAULT CURRENT_DATE,
    evidence_image_url text,
    spread_warning_issued boolean DEFAULT false,
    reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 3.9 Weather Snapshots
CREATE TABLE IF NOT EXISTS public.weather_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name text NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    temperature_celsius numeric(4,1) NOT NULL,
    humidity_percentage numeric(4,1) NOT NULL,
    rainfall_probability numeric(4,1) NOT NULL,
    rainfall_expected_mm numeric(5,1) DEFAULT 0.0,
    wind_speed_kmh numeric(4,1) NOT NULL,
    rain_expected_in_hours integer DEFAULT 0,
    spray_window_recommendation text NOT NULL CHECK (spray_window_recommendation IN ('optimal', 'caution', 'delay_rain_expected', 'delay_wind_high', 'prohibited')),
    spray_window_explanation text NOT NULL,
    irrigation_recommendation text NOT NULL,
    data_source_type text NOT NULL DEFAULT 'simulated' CHECK (data_source_type IN ('live', 'cached', 'simulated', 'unavailable')),
    recorded_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 3.10 Soil Reports
CREATE TABLE IF NOT EXISTS public.soil_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    sample_date date NOT NULL,
    ph_level numeric(3,1) NOT NULL,
    nitrogen_level text NOT NULL CHECK (nitrogen_level IN ('very_low', 'low', 'medium', 'high', 'excessive')),
    nitrogen_kg_per_ha numeric(6,2),
    phosphorus_level text NOT NULL,
    phosphorus_kg_per_ha numeric(6,2),
    potassium_level text NOT NULL,
    potassium_kg_per_ha numeric(6,2),
    organic_carbon_percentage numeric(4,2),
    micronutrients jsonb DEFAULT '{}'::jsonb,
    laboratory_name text NOT NULL,
    lab_accreditation_number text,
    report_document_url text,
    is_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.11 Agricultural Documents
CREATE TABLE IF NOT EXISTS public.agricultural_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    document_type text NOT NULL CHECK (document_type IN ('pesticide_label', 'fertilizer_label', 'soil_report', 'crop_insurance', 'government_scheme', 'advisory', 'invoice', 'research_paper')),
    file_url text NOT NULL,
    source_authority text NOT NULL,
    publication_date date,
    extracted_metadata jsonb DEFAULT '{}'::jsonb,
    content_text text,
    chunk_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.12 Sellers
CREATE TABLE IF NOT EXISTS public.sellers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    license_number text NOT NULL,
    gst_number text,
    store_address text NOT NULL,
    district text NOT NULL,
    state text NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    rating numeric(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
    is_verified boolean DEFAULT false,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.13 Seller Verifications
CREATE TABLE IF NOT EXISTS public.seller_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    verification_type text NOT NULL CHECK (verification_type IN ('government_license', 'physical_inspection', 'document_kyc', 'fpo_endorsement')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes text,
    valid_until date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.14 Products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('chemical_fungicide', 'chemical_insecticide', 'bio_fungicide', 'bio_pesticide', 'organic_manure', 'fertilizer', 'seed', 'tool', 'protective_gear')),
    brand_manufacturer text NOT NULL,
    active_ingredient text NOT NULL,
    formulation text NOT NULL,
    compatible_crops text[] NOT NULL DEFAULT '{}',
    target_problems text[] NOT NULL DEFAULT '{}',
    pack_size text NOT NULL,
    price numeric(10,2) NOT NULL CHECK (price >= 0),
    mrp numeric(10,2) NOT NULL CHECK (mrp >= price),
    stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_organic boolean DEFAULT false,
    is_available boolean DEFAULT true,
    delivery_radius_km numeric(6,1) DEFAULT 25.0,
    estimated_delivery_days integer DEFAULT 2,
    return_policy_days integer DEFAULT 7,
    registration_cib_rc_no text,
    is_counterfeit_flagged boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.15 Product Labels
CREATE TABLE IF NOT EXISTS public.product_labels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    label_document_url text,
    dosage_per_acre text NOT NULL,
    water_volume_liters_per_acre text NOT NULL,
    application_method text NOT NULL,
    pre_harvest_interval_days integer DEFAULT 0 CHECK (pre_harvest_interval_days >= 0),
    protective_equipment text[] DEFAULT '{}',
    storage_instructions text NOT NULL,
    disposal_instructions text NOT NULL,
    toxicity_color_code text NOT NULL CHECK (toxicity_color_code IN ('green', 'blue', 'yellow', 'red')),
    verified_by_agronomist boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.16 Product Batches
CREATE TABLE IF NOT EXISTS public.product_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_number text NOT NULL,
    manufacturing_date date NOT NULL,
    expiry_date date NOT NULL,
    qr_code_hash text,
    barcode text,
    batch_stock integer NOT NULL DEFAULT 0 CHECK (batch_stock >= 0),
    is_expired boolean DEFAULT false,
    is_recalled boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.17 Service Providers
CREATE TABLE IF NOT EXISTS public.service_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    service_category text NOT NULL CHECK (service_category IN ('soil_testing', 'drone_spraying', 'equipment_rental', 'agronomist_consulting', 'transport_logistics', 'cold_storage', 'field_labor')),
    district text NOT NULL,
    service_radius_km numeric(6,1) DEFAULT 30.0,
    rating numeric(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
    is_verified boolean DEFAULT false,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.18 Service Listings
CREATE TABLE IF NOT EXISTS public.service_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    unit_type text NOT NULL CHECK (unit_type IN ('per_acre', 'per_hour', 'per_sample', 'per_day', 'per_km', 'flat_rate')),
    base_price numeric(10,2) NOT NULL CHECK (base_price >= 0),
    travel_charge_per_km numeric(8,2) DEFAULT 0.0 CHECK (travel_charge_per_km >= 0),
    estimated_duration_hours numeric(5,1) DEFAULT 2.0,
    equipment_specifications text,
    languages_supported text[] DEFAULT '{"en"}'::text[],
    farmer_preparation_requirements text,
    cancellation_policy text DEFAULT 'Free cancellation up to 4 hours before service.',
    is_available boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.19 Equipment
CREATE TABLE IF NOT EXISTS public.equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    name text NOT NULL,
    equipment_type text NOT NULL CHECK (equipment_type IN ('drone', 'tractor', 'rotavator', 'harvester', 'spray_pump', 'moisture_meter', 'other')),
    model_spec text NOT NULL,
    registration_number text,
    maintenance_due_date date,
    is_operational boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.20 Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
    discount_amount numeric(10,2) DEFAULT 0.0 CHECK (discount_amount >= 0),
    delivery_charge numeric(10,2) DEFAULT 0.0 CHECK (delivery_charge >= 0),
    final_amount numeric(10,2) NOT NULL CHECK (final_amount >= 0),
    is_fpo_group_order boolean DEFAULT false,
    order_status text NOT NULL DEFAULT 'pending_confirmation' CHECK (order_status IN ('pending_confirmation', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded')),
    delivery_address text NOT NULL,
    farmer_consent_recorded boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.21 Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    batch_id uuid REFERENCES public.product_batches(id) ON DELETE SET NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
    created_at timestamptz DEFAULT now()
);

-- 3.22 Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_listing_id uuid NOT NULL REFERENCES public.service_listings(id) ON DELETE RESTRICT,
    farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    scheduled_date date NOT NULL,
    scheduled_slot text NOT NULL,
    estimated_cost numeric(10,2) NOT NULL CHECK (estimated_cost >= 0),
    booking_status text NOT NULL DEFAULT 'requested' CHECK (booking_status IN ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    provider_notes text,
    proof_of_completion_url text,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    feedback text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.23 Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    payment_method text NOT NULL CHECK (payment_method IN ('upi_simulated', 'card_simulated', 'cash_on_delivery', 'fpo_credit', 'kisan_credit_card')),
    payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    transaction_reference text NOT NULL,
    payment_gateway_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT payment_target_check CHECK (order_id IS NOT NULL OR booking_id IS NOT NULL)
);

-- 3.24 Deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    carrier_name text NOT NULL,
    tracking_number text NOT NULL,
    dispatch_time timestamptz,
    estimated_delivery_time timestamptz,
    actual_delivery_time timestamptz,
    delivery_status text NOT NULL DEFAULT 'preparing' CHECK (delivery_status IN ('preparing', 'in_transit', 'out_for_delivery', 'delivered', 'failed_attempt', 'returned')),
    delivery_notes text,
    proof_of_delivery_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.25 Return Requests
CREATE TABLE IF NOT EXISTS public.return_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (reason IN ('counterfeit_suspected', 'damaged_seal', 'expired_product', 'wrong_item', 'mismatched_label', 'other')),
    explanation text NOT NULL,
    evidence_image_url text,
    status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'refund_processed')),
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.26 Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id uuid REFERENCES public.farms(id) ON DELETE SET NULL,
    crop_id uuid REFERENCES public.crops(id) ON DELETE SET NULL,
    task_type text NOT NULL CHECK (task_type IN ('irrigation', 'spraying', 'scouting', 'soil_testing', 'fertilizer_application', 'harvesting', 'equipment_rental', 'officer_visit', 'rescan_observation')),
    title text NOT NULL,
    description text NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time time,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'accepted', 'in_progress', 'completed', 'overdue', 'cancelled', 'verified')),
    is_offline_synced boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.27 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    category text NOT NULL CHECK (category IN ('weather_alert', 'spray_window', 'pest_hotspot', 'task_reminder', 'order_status', 'booking_status', 'expert_review', 'general')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_read boolean DEFAULT false,
    read_at timestamptz,
    action_link text,
    created_at timestamptz DEFAULT now()
);

-- 3.28 Market Prices
CREATE TABLE IF NOT EXISTS public.market_prices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name text NOT NULL,
    variety text,
    mandi_name text NOT NULL,
    district text NOT NULL,
    state text NOT NULL,
    modal_price_per_quintal numeric(10,2) NOT NULL CHECK (modal_price_per_quintal >= 0),
    min_price_per_quintal numeric(10,2) NOT NULL CHECK (min_price_per_quintal >= 0),
    max_price_per_quintal numeric(10,2) NOT NULL CHECK (max_price_per_quintal >= min_price_per_quintal),
    source_name text NOT NULL DEFAULT 'Agmarknet / e-NAM',
    is_simulated boolean DEFAULT false,
    price_date date NOT NULL DEFAULT CURRENT_DATE,
    recorded_at timestamptz NOT NULL DEFAULT now()
);

-- 3.29 Government Schemes
CREATE TABLE IF NOT EXISTS public.government_schemes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_name text NOT NULL,
    scheme_code text UNIQUE NOT NULL,
    administering_body text NOT NULL,
    category text NOT NULL CHECK (category IN ('crop_insurance', 'machinery_subsidy', 'organic_farming', 'soil_health', 'irrigation', 'credit_subsidy')),
    eligibility_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
    benefits_summary text NOT NULL,
    subsidy_percentage numeric(5,2),
    max_subsidy_amount numeric(10,2),
    required_documents text[] DEFAULT '{}',
    official_portal_url text,
    active_till_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.30 Expert Reviews
CREATE TABLE IF NOT EXISTS public.expert_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id uuid NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
    expert_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
    expert_diagnosis text NOT NULL,
    confidence_score numeric(4,3) CHECK (confidence_score >= 0.000 AND confidence_score <= 1.000),
    verified_treatment_instructions text NOT NULL,
    risk_assessment text NOT NULL CHECK (risk_assessment IN ('low', 'medium', 'high_chemical_risk', 'emergency_quarantine')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3.31 Follow-up Observations
CREATE TABLE IF NOT EXISTS public.follow_up_observations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    initial_observation_id uuid NOT NULL REFERENCES public.crop_observations(id) ON DELETE CASCADE,
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    follow_up_image_url text NOT NULL,
    days_after_initial integer NOT NULL CHECK (days_after_initial >= 0),
    treatment_applied text,
    outcome_status text NOT NULL CHECK (outcome_status IN ('improved', 'unchanged', 'worsened', 'uncertain')),
    visual_evidence_comparison text NOT NULL,
    ai_confidence_score numeric(4,3) CHECK (ai_confidence_score >= 0.000 AND ai_confidence_score <= 1.000),
    recommended_next_step text NOT NULL,
    needs_expert_escalation boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 3.32 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- 3.33 Consent Records
CREATE TABLE IF NOT EXISTS public.consent_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type text NOT NULL CHECK (consent_type IN ('data_processing', 'gps_location', 'camera_images', 'voice_audio', 'seller_data_sharing')),
    is_granted boolean NOT NULL DEFAULT true,
    policy_version text NOT NULL DEFAULT 'v1.0',
    granted_at timestamptz DEFAULT now(),
    revoked_at timestamptz
);

-- ============================================================================
-- 4. Triggers for Auto-updating updated_at Timestamps
-- ============================================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'farmer_profiles', 'farms', 'crops', 'crop_observations',
    'livestock_profiles', 'diagnoses', 'soil_reports', 'agricultural_documents',
    'sellers', 'seller_verifications', 'products', 'product_labels',
    'product_batches', 'service_providers', 'service_listings', 'equipment',
    'orders', 'bookings', 'payments', 'deliveries', 'return_requests',
    'tasks', 'government_schemes', 'expert_reviews'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%I_timestamp ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER set_%I_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- 5. Indexes for High Performance & Search
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON public.farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farms_coords ON public.farms(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON public.crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_stage ON public.crops(stage);
CREATE INDEX IF NOT EXISTS idx_crop_obs_crop_farmer ON public.crop_observations(crop_id, farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_obs_status ON public.crop_observations(status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_obs_id ON public.diagnoses(observation_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_disease ON public.diagnoses(disease_name);
CREATE INDEX IF NOT EXISTS idx_pest_reports_coords ON public.pest_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pest_reports_date ON public.pest_reports(observation_date);
CREATE INDEX IF NOT EXISTS idx_weather_location ON public.weather_snapshots(location_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_product_batches_exp ON public.product_batches(product_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_labels_product ON public.product_labels(product_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_provider ON public.service_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON public.orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON public.bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_tasks_farmer_date ON public.tasks(farmer_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_mandi ON public.market_prices(crop_name, mandi_name, price_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_consent_farmer ON public.consent_records(farmer_id);

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS across ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pest_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultural_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6.1 Public & Authenticated Read Access for Shared Catalog / Community Data
-- ----------------------------------------------------------------------------

-- Products catalog (Verified, non-counterfeit products visible to all)
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_available = true AND is_counterfeit_flagged = false);

-- Product Labels (Public read for transparency and safety)
DROP POLICY IF EXISTS "Public can view product labels" ON public.product_labels;
CREATE POLICY "Public can view product labels" ON public.product_labels
  FOR SELECT USING (true);

-- Product Batches (Public read for authenticity verification)
DROP POLICY IF EXISTS "Public can view batches" ON public.product_batches;
CREATE POLICY "Public can view batches" ON public.product_batches
  FOR SELECT USING (true);

-- Sellers (Public view of verified seller profiles)
DROP POLICY IF EXISTS "Public can view sellers" ON public.sellers;
CREATE POLICY "Public can view sellers" ON public.sellers
  FOR SELECT USING (true);

-- Service Listings & Equipment (Public browse)
DROP POLICY IF EXISTS "Public can view active services" ON public.service_listings;
CREATE POLICY "Public can view active services" ON public.service_listings
  FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public can view service providers" ON public.service_providers;
CREATE POLICY "Public can view service providers" ON public.service_providers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view equipment" ON public.equipment;
CREATE POLICY "Public can view equipment" ON public.equipment
  FOR SELECT USING (is_operational = true);

-- Mandi Prices & Government Schemes (Public)
DROP POLICY IF EXISTS "Public can view market prices" ON public.market_prices;
CREATE POLICY "Public can view market prices" ON public.market_prices
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view government schemes" ON public.government_schemes;
CREATE POLICY "Public can view government schemes" ON public.government_schemes
  FOR SELECT USING (true);

-- Weather snapshots & Pest surveillance (Public for regional safety alerts)
DROP POLICY IF EXISTS "Public can view weather snapshots" ON public.weather_snapshots;
CREATE POLICY "Public can view weather snapshots" ON public.weather_snapshots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view pest reports" ON public.pest_reports;
CREATE POLICY "Public can view pest reports" ON public.pest_reports
  FOR SELECT USING (true);

-- Agricultural Documents (Public read)
DROP POLICY IF EXISTS "Public can view ag documents" ON public.agricultural_documents;
CREATE POLICY "Public can view ag documents" ON public.agricultural_documents
  FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- 6.2 User Profiles & Farmer Self-Management
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Farmers can view own farmer profile" ON public.farmer_profiles;
CREATE POLICY "Farmers can view own farmer profile" ON public.farmer_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Farmers can manage own farmer profile" ON public.farmer_profiles;
CREATE POLICY "Farmers can manage own farmer profile" ON public.farmer_profiles
  FOR ALL USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Farms & Crops
DROP POLICY IF EXISTS "Farmers manage their own farms" ON public.farms;
CREATE POLICY "Farmers manage their own farms" ON public.farms
  FOR ALL USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Farmers manage their crops" ON public.crops;
CREATE POLICY "Farmers manage their crops" ON public.crops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = crops.farm_id AND (f.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
  );

-- Observations & Diagnoses
DROP POLICY IF EXISTS "Farmers view and create their observations" ON public.crop_observations;
CREATE POLICY "Farmers view and create their observations" ON public.crop_observations
  FOR ALL USING (auth.uid() = farmer_id OR public.get_user_role(auth.uid()) IN ('agronomist', 'admin') OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Read diagnoses for observation owner and agronomists" ON public.diagnoses;
CREATE POLICY "Read diagnoses for observation owner and agronomists" ON public.diagnoses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.crop_observations o WHERE o.id = diagnoses.observation_id AND (o.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.get_user_role(auth.uid()) IN ('agronomist', 'admin')
  );

DROP POLICY IF EXISTS "Agronomists and system can insert/update diagnoses" ON public.diagnoses;
CREATE POLICY "Agronomists and system can insert/update diagnoses" ON public.diagnoses
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('agronomist', 'admin') OR auth.uid() IS NULL);

-- Livestock Profiles
DROP POLICY IF EXISTS "Farmers manage livestock profiles" ON public.livestock_profiles;
CREATE POLICY "Farmers manage livestock profiles" ON public.livestock_profiles
  FOR ALL USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

-- Soil Reports
DROP POLICY IF EXISTS "Farmers manage own soil reports" ON public.soil_reports;
CREATE POLICY "Farmers manage own soil reports" ON public.soil_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = soil_reports.farm_id AND (f.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.get_user_role(auth.uid()) IN ('agronomist', 'admin')
  );

-- ----------------------------------------------------------------------------
-- 6.3 Orders, Bookings, Payments & Deliveries
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Farmers view and manage their orders" ON public.orders;
CREATE POLICY "Farmers view and manage their orders" ON public.orders
  FOR ALL USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Farmers manage their bookings" ON public.bookings;
CREATE POLICY "Farmers manage their bookings" ON public.bookings
  FOR ALL USING (
    auth.uid() = farmer_id
    OR EXISTS (SELECT 1 FROM public.service_listings l JOIN public.service_providers p ON l.provider_id = p.id WHERE l.id = bookings.service_listing_id AND p.user_id = auth.uid())
    OR public.is_admin(auth.uid())
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Users view their payments" ON public.payments;
CREATE POLICY "Users view their payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND (o.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = payments.booking_id AND (b.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Deliveries visible to order farmers and admins" ON public.deliveries;
CREATE POLICY "Deliveries visible to order farmers and admins" ON public.deliveries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = deliveries.order_id AND (o.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Return requests visible to order owners and admins" ON public.return_requests;
CREATE POLICY "Return requests visible to order owners and admins" ON public.return_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = return_requests.order_id AND (o.farmer_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
    OR auth.uid() IS NULL
  );

-- ----------------------------------------------------------------------------
-- 6.4 Field Operations (Tasks, Notifications, Follow-ups, Consent, Audits)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Farmers manage their tasks" ON public.tasks;
CREATE POLICY "Farmers manage their tasks" ON public.tasks
  FOR ALL USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users manage their notifications" ON public.notifications;
CREATE POLICY "Users manage their notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Follow-ups viewable by farmer and agronomists" ON public.follow_up_observations;
CREATE POLICY "Follow-ups viewable by farmer and agronomists" ON public.follow_up_observations
  FOR ALL USING (auth.uid() = farmer_id OR public.get_user_role(auth.uid()) IN ('agronomist', 'admin') OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Expert reviews viewable by observation owner and experts" ON public.expert_reviews;
CREATE POLICY "Expert reviews viewable by observation owner and experts" ON public.expert_reviews
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('agronomist', 'admin')
    OR EXISTS (
      SELECT 1 FROM public.diagnoses d
      JOIN public.crop_observations o ON d.observation_id = o.id
      WHERE d.id = expert_reviews.diagnosis_id AND (o.farmer_id = auth.uid() OR auth.uid() IS NULL)
    )
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Farmers manage their consent records" ON public.consent_records;
CREATE POLICY "Farmers manage their consent records" ON public.consent_records
  FOR ALL USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6.5 Seller & Service Provider Management Policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Sellers manage their own store" ON public.sellers;
CREATE POLICY "Sellers manage their own store" ON public.sellers
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Sellers manage their products" ON public.products;
CREATE POLICY "Sellers manage their products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = products.seller_id AND (s.user_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Sellers manage product batches" ON public.product_batches;
CREATE POLICY "Sellers manage product batches" ON public.product_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products p JOIN public.sellers s ON p.seller_id = s.id WHERE p.id = product_batches.product_id AND (s.user_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Service providers manage their profile" ON public.service_providers;
CREATE POLICY "Service providers manage their profile" ON public.service_providers
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Service providers manage their listings" ON public.service_listings;
CREATE POLICY "Service providers manage their listings" ON public.service_listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = service_listings.provider_id AND (p.user_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Service providers manage equipment" ON public.equipment;
CREATE POLICY "Service providers manage equipment" ON public.equipment
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = equipment.provider_id AND (p.user_id = auth.uid() OR auth.uid() IS NULL))
    OR public.is_admin(auth.uid())
  );

-- ============================================================================
-- 7. Seed Demonstration Data
-- Scenario: 1-acre Tomato Farm in Kolar District, Flowering Stage,
--           Suspected Early Blight Fungal Infection, Rain Expected within 12h.
-- ============================================================================

-- 7.0 Sync auth.users if auth schema is present (prevents foreign key errors)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
      ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer.ramesh@krishisetu.io', crypt('DemoFarmPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ramesh Patel","role":"farmer"}', now(), now()),
      ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agronomist.ananya@krishisetu.io', crypt('DemoFarmPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Ananya Sharma","role":"agronomist"}', now(), now()),
      ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller.mohan@krishisetu.io', crypt('DemoFarmPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mohan Lal","role":"seller"}', now(), now()),
      ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'provider.rajesh@krishisetu.io', crypt('DemoFarmPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Verma","role":"service_provider"}', now(), now()),
      ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fpo.suresh@krishisetu.io', crypt('DemoFarmPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Suresh Rao","role":"fpo_manager"}', now(), now()),
      ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.priya@krishisetu.io', crypt('DemoFarmPass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Deshmukh","role":"admin"}', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 7.1 Profiles
INSERT INTO public.profiles (id, email, full_name, phone, role, preferred_language, is_verified)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'farmer.ramesh@krishisetu.io', 'Ramesh Patel', '+919876543210', 'farmer', 'kn', true),
  ('00000000-0000-0000-0000-000000000002', 'agronomist.ananya@krishisetu.io', 'Dr. Ananya Sharma', '+919876543211', 'agronomist', 'en', true),
  ('00000000-0000-0000-0000-000000000003', 'seller.mohan@krishisetu.io', 'Mohan Lal', '+919876543212', 'seller', 'en', true),
  ('00000000-0000-0000-0000-000000000004', 'provider.rajesh@krishisetu.io', 'Rajesh Verma', '+919876543213', 'service_provider', 'en', true),
  ('00000000-0000-0000-0000-000000000005', 'fpo.suresh@krishisetu.io', 'Suresh Rao', '+919876543214', 'fpo_manager', 'kn', true),
  ('00000000-0000-0000-0000-000000000006', 'admin.priya@krishisetu.io', 'Priya Deshmukh', '+919876543215', 'admin', 'en', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 7.2 Farmer Profile
INSERT INTO public.farmer_profiles (id, preferred_language, experience_years, literacy_assistance_enabled, voice_guidance_enabled)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'kn', 12, true, true)
ON CONFLICT (id) DO NOTHING;

-- 7.3 Farm (1-Acre Tomato Farm in Kolar)
INSERT INTO public.farms (id, farmer_id, name, total_acres, location_name, latitude, longitude, soil_type, irrigation_source)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ramesh Tomato Farm - Plot 1', 1.00, 'Kolar District, Karnataka', 13.1378000, 78.1348000, 'Red Sandy Loam', 'Drip Irrigation')
ON CONFLICT (id) DO NOTHING;

-- 7.4 Crop (Flowering Tomato)
INSERT INTO public.crops (id, farm_id, crop_name, variety, acreage, sowing_date, stage, expected_harvest_date, health_status)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tomato', 'Arka Rakshak (F1 Hybrid)', 1.00, CURRENT_DATE - INTERVAL '45 days', 'flowering', CURRENT_DATE + INTERVAL '35 days', 'attention_needed')
ON CONFLICT (id) DO NOTHING;

-- 7.5 Crop Observation (Farmer Voice Question & Leaf Symptoms)
INSERT INTO public.crop_observations (id, crop_id, farmer_id, symptoms, voice_note_url, voice_transcript, image_url, sensor_readings, urgency, status)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Concentric dark brown rings with chlorotic yellow halos observed on lower foliage leaves. Moderate leaf drop.',
   'https://storage.krishisetu.io/audio/ramesh_voice_question_001.mp3',
   'Can I spray today? Rain is expected tomorrow.',
   'https://storage.krishisetu.io/images/tomato_leaf_early_blight_kolar.jpg',
   '{"soil_moisture_pct": 34, "ambient_temp_c": 27.5, "leaf_wetness_sensor": "high"}'::jsonb,
   'high', 'diagnosed')
ON CONFLICT (id) DO NOTHING;

-- 7.6 Diagnosis (Early Blight / Alternaria solani)
INSERT INTO public.diagnoses (id, observation_id, disease_name, scientific_name, pathogen_type, confidence_score, severity, visual_evidence, recommended_next_observation, requires_expert_review, is_verified_by_expert, verified_by, verified_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'Early Blight of Tomato', 'Alternaria solani', 'fungal', 0.885, 'moderate',
   'Target-like concentric rings visible on 15% of lower foliage leaves with yellow margins.',
   'Inspect lower canopy after 48 hours for lesion expansion; avoid overhead watering.',
   false, true, '00000000-0000-0000-0000-000000000002', now() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- 7.7 Weather Snapshot (Rain expected in 8-12 hours -> Delay Spraying)
INSERT INTO public.weather_snapshots (id, location_name, latitude, longitude, temperature_celsius, humidity_percentage, rainfall_probability, rainfall_expected_mm, wind_speed_kmh, rain_expected_in_hours, spray_window_recommendation, spray_window_explanation, irrigation_recommendation, data_source_type, recorded_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'Kolar District, Karnataka', 13.1378000, 78.1348000, 26.4, 84.5, 78.0, 18.5, 14.2, 8,
   'delay_rain_expected',
   'Rain expected within 8-12 hours with 78% probability. Rain wash-off will neutralize foliar fungicides. Postpone spraying until canopy dries after rain.',
   'Hold irrigation for 24 hours. Pre-monsoon shower will satisfy moisture demand.',
   'simulated', now())
ON CONFLICT (id) DO NOTHING;

-- 7.8 Soil Report (Mildly Acidic & Low Nitrogen)
INSERT INTO public.soil_reports (id, farm_id, sample_date, ph_level, nitrogen_level, nitrogen_kg_per_ha, phosphorus_level, phosphorus_kg_per_ha, potassium_level, potassium_kg_per_ha, organic_carbon_percentage, micronutrients, laboratory_name, lab_accreditation_number, is_verified)
VALUES
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '15 days',
   5.8, 'low', 142.50, 'medium', 28.40, 'high', 285.00, 0.42,
   '{"zinc_ppm": 0.58, "boron_ppm": 0.35, "iron_ppm": 4.20}'::jsonb,
   'Kolar District Soil Health Laboratory (ICAR-KVK)', 'NABL-AGRI-KA-2024-88', true)
ON CONFLICT (id) DO NOTHING;

-- 7.9 Livestock Profile
INSERT INTO public.livestock_profiles (id, farmer_id, animal_type, breed, herd_size, age_months, health_status, vaccination_records)
VALUES
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'cattle', 'Gir Cow', 2, 36, 'healthy',
   '[{"vaccine": "FMD", "date": "2026-05-10", "next_due": "2026-11-10"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7.10 Pest Report (Pest Hotspot)
INSERT INTO public.pest_reports (id, pest_type, crop_name, severity, latitude, longitude, location_name, observation_date, spread_warning_issued, reported_by)
VALUES
  ('80000000-0000-0000-0000-000000000001', 'Tomato Fruit Borer (Helicoverpa armigera)', 'Tomato', 'moderate', 13.1420000, 78.1400000, 'Kolar Cluster North', CURRENT_DATE - INTERVAL '2 days', true, '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 7.11 Agricultural Documents
INSERT INTO public.agricultural_documents (id, title, document_type, file_url, source_authority, publication_date, extracted_metadata, content_text)
VALUES
  ('90000000-0000-0000-0000-000000000001', 'Tomato Early Blight Management Advisory 2026', 'advisory', 'https://storage.krishisetu.io/docs/tomato_blight_icar_advisory.pdf', 'ICAR - Indian Institute of Horticultural Research', '2026-01-15', '{"crop": "Tomato", "disease": "Early Blight", "chemical_options": ["Mancozeb 75 WP", "Copper Oxychloride 50 WP"], "organic_options": ["Trichoderma viride 1.5% WP"]}'::jsonb,
   'Foliar spray of Mancozeb 75% WP @ 2.5 g/L or Copper Oxychloride 50% WP @ 3.0 g/L is recommended at early symptom onset. In organic regimens, apply Trichoderma viride @ 5g/L. Do not spray during windy conditions or within 6 hours of expected precipitation.'),
  ('90000000-0000-0000-0000-000000000002', 'Pradhan Mantri Fasal Bima Yojana (PMFBY) Guidelines', 'crop_insurance', 'https://storage.krishisetu.io/docs/pmfby_farmer_guidelines.pdf', 'Ministry of Agriculture & Farmers Welfare, GoI', '2026-02-01', '{"scheme": "PMFBY", "horticulture_premium": "5%", "claims_turnaround_days": 21}'::jsonb,
   'Horticultural crops including tomato are covered under localized calamity and post-harvest loss indemnity with 5% farmer premium share.')
ON CONFLICT (id) DO NOTHING;

-- 7.12 Seller
INSERT INTO public.sellers (id, user_id, business_name, license_number, gst_number, store_address, district, state, latitude, longitude, rating, is_verified, verified_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Kisan Krishi Kendra (Mohan Lal)', 'LIC-KA-KOLAR-2023-412', '29ABCDE1234F1Z5', 'APMC Market Road, Kolar', 'Kolar', 'Karnataka', 13.1360000, 78.1320000, 4.90, true, now() - INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

-- 7.13 Seller Verification
INSERT INTO public.seller_verifications (id, seller_id, verification_type, status, verified_by, notes, valid_until)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'government_license', 'approved', '00000000-0000-0000-0000-000000000002', 'Insecticide license and physical seed dealership verified.', CURRENT_DATE + INTERVAL '365 days')
ON CONFLICT (id) DO NOTHING;

-- 7.14 Products (Marketplace Scenario with Verified Chemical, Organic, Unavailable & Blocked Expired)
INSERT INTO public.products (id, seller_id, name, category, brand_manufacturer, active_ingredient, formulation, compatible_crops, target_problems, pack_size, price, mrp, stock_quantity, is_organic, is_available, delivery_radius_km, estimated_delivery_days, return_policy_days, registration_cib_rc_no, is_counterfeit_flagged)
VALUES
  -- 1) Verified Chemical Fungicide
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Dithane M-45 (Mancozeb 75% WP)', 'chemical_fungicide', 'Indofil Industries', 'Mancozeb 75% WP', 'Wettable Powder (WP)',
   ARRAY['Tomato', 'Potato', 'Chilli', 'Grapes'], ARRAY['Early Blight', 'Late Blight', 'Leaf Spot'],
   '500g', 340.00, 390.00, 45, false, true, 30.0, 1, 7, 'CIR-1823/2004-Mancozeb(WP)-112', false),

  -- 2) Verified Contact Fungicide Alternative
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Blitox 50 (Copper Oxychloride 50% WP)', 'chemical_fungicide', 'Rallis India', 'Copper Oxychloride 50% WP', 'Wettable Powder (WP)',
   ARRAY['Tomato', 'Potato', 'Cardamom'], ARRAY['Early Blight', 'Late Blight', 'Damping Off'],
   '500g', 380.00, 420.00, 30, false, true, 30.0, 1, 7, 'CIR-4512/2008-COC(WP)-90', false),

  -- 3) Verified Organic Bio-fungicide
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'EcoShield Bio-Fungicide (Trichoderma viride 1.5% WP)', 'bio_fungicide', 'BioAgri Tech India', 'Trichoderma viride 1.5% WP (2x10^6 CFU/g)', 'Bio-formulation WP',
   ARRAY['Tomato', 'Chilli', 'Brinjal', 'Legumes'], ARRAY['Early Blight', 'Root Rot', 'Fusarium Wilt'],
   '1kg', 220.00, 260.00, 60, true, true, 40.0, 2, 7, 'CIB-BIO-2019-Trichoderma-019', false),

  -- 4) Unavailable Product (Out of Stock Demo)
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Amistar Top (Azoxystrobin + Difenoconazole)', 'chemical_fungicide', 'Syngenta', 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC', 'Suspension Concentrate',
   ARRAY['Tomato', 'Rice'], ARRAY['Early Blight', 'Anthracnose'],
   '200ml', 890.00, 950.00, 0, false, false, 25.0, 3, 7, 'CIR-9923/2014-Azoxy(SC)-22', false),

  -- 5) Expired Product (For Trust & Safety Agent Blocking Test)
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Kisan Chlorpyrifos 20% EC [EXPIRED STOCK TEST]', 'chemical_insecticide', 'Generic Chem', 'Chlorpyrifos 20% EC', 'Emulsifiable Concentrate',
   ARRAY['Cotton', 'Paddy'], ARRAY['Stem Borer', 'Termites'],
   '1L', 410.00, 480.00, 10, false, false, 15.0, 2, 0, 'CIR-OLD-EXPIRED-991', false),

  -- 6) Unverified Label Product (Flags missing/incomplete label warning)
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'Super Growth Leaf Tonic (Unregistered Formula)', 'fertilizer', 'Local Blend Labs', 'Unknown Amino Chelate', 'Liquid',
   ARRAY['Tomato'], ARRAY['Yellowing Leaves'],
   '500ml', 150.00, 200.00, 20, false, true, 20.0, 1, 0, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- 7.15 Product Labels
INSERT INTO public.product_labels (id, product_id, label_document_url, dosage_per_acre, water_volume_liters_per_acre, application_method, pre_harvest_interval_days, protective_equipment, storage_instructions, disposal_instructions, toxicity_color_code, verified_by_agronomist)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'https://storage.krishisetu.io/labels/dithane_m45_cib_label.pdf',
   '600g - 800g per acre', '200 Liters', 'Foliar knapsack spray with hollow cone nozzle', 7,
   ARRAY['Gloves', 'Safety Goggles', 'N95 Respirator Mask', 'Full Sleeve Boots'],
   'Store in original airtight container in a dry, well-ventilated storeroom away from children and livestock.',
   'Rinse empty container 3 times into spray tank. Puncture container and dispose at authorized collection points.',
   'blue', true),

  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002',
   'https://storage.krishisetu.io/labels/blitox_50_label.pdf',
   '1000g per acre', '250 Liters', 'Foliar spray with uniform canopy coverage', 10,
   ARRAY['Gloves', 'Face Shield', 'Protective Apron'],
   'Keep away from heat and direct sunlight. Keep dry.',
   'Dispose in designated pesticide disposal pit.',
   'blue', true),

  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   'https://storage.krishisetu.io/labels/ecoshield_trichoderma_label.pdf',
   '1000g per acre', '200 Liters', 'Foliar spray or soil drenching in late afternoon', 0,
   ARRAY['Dust Mask', 'Gloves'],
   'Store in cool shade below 30°C to preserve viable spore count.',
   'Compostable or standard municipal dry waste.',
   'green', true)
ON CONFLICT (id) DO NOTHING;

-- 7.16 Product Batches
INSERT INTO public.product_batches (id, product_id, batch_number, manufacturing_date, expiry_date, qr_code_hash, barcode, batch_stock, is_expired, is_recalled)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'IND-M45-2026-08A', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '500 days',
   'QR-HASH-IND-M45-9812-VERIFIED', '8901234567890', 45, false, false),

  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002',
   'RAL-BLX-2026-02K', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '400 days',
   'QR-HASH-RAL-BLX-4411-VERIFIED', '8901234567891', 30, false, false),

  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   'BIO-TRI-2026-03F', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '330 days',
   'QR-HASH-BIO-TRI-1102-VERIFIED', '8901234567892', 60, false, false),

  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005',
   'GEN-CHL-2023-99Z', CURRENT_DATE - INTERVAL '800 days', CURRENT_DATE - INTERVAL '60 days',
   'QR-HASH-EXPIRED-CHL-0000', '8901234567895', 10, true, false)
ON CONFLICT (id) DO NOTHING;

-- 7.17 Service Providers
INSERT INTO public.service_providers (id, user_id, business_name, service_category, district, service_radius_km, rating, is_verified, verified_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'AgriDrone AeroTech & Precision Services', 'drone_spraying', 'Kolar', 45.0, 4.95, true, now() - INTERVAL '120 days'),
  ('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Kisan Mechanization & Soil Hub', 'equipment_rental', 'Kolar', 30.0, 4.80, true, now() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- 7.18 Service Listings
INSERT INTO public.service_listings (id, provider_id, title, description, unit_type, base_price, travel_charge_per_km, estimated_duration_hours, equipment_specifications, languages_supported, farmer_preparation_requirements, cancellation_policy, is_available)
VALUES
  ('11000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
   'Precision Agricultural Drone Spraying', 'DGCA-certified drone pilot precision foliar spraying for tomato crop. Uniform micron droplet coverage with 90% water savings.',
   'per_acre', 450.00, 10.00, 0.5, 'DJI Agras T40 with centrifugal atomizers and RTK centimetric positioning.',
   ARRAY['kn', 'te', 'en'], 'Keep clean water (20L per acre) ready at the field border. Keep bystanders clear during flight.',
   'Free cancellation up to 6 hours before scheduled flight.', true),

  ('11000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002',
   'Comprehensive Soil Health Test & Analysis', 'Standard 12-parameter soil testing including NPK, pH, EC, Organic Carbon, and micronutrients with digital lab report.',
   'per_sample', 350.00, 0.00, 24.0, 'GPS-tagged sample collection and spectrophotometer assay.',
   ARRAY['kn', 'en'], 'Collect 5 sub-samples from V-shaped cuts at 0-15cm depth.',
   'Full refund if cancelled before courier sample pickup.', true),

  ('11000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
   'Certified Agronomist On-Field Diagnostic Visit', 'In-person field scouting and diagnosis by certified university agronomist with personalized prescription.',
   'flat_rate', 250.00, 5.00, 1.5, 'Portable digital leaf scanner and pH meter.',
   ARRAY['kn', 'te', 'en'], 'Have recent spray receipts and irrigation log accessible.',
   'Free cancellation up to 2 hours before visit.', true),

  ('11000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002',
   'Mahindra 575 DI Tractor with Rotavator Rental', '45 HP tractor with rotavator attachment including experienced operator and fuel for inter-row tillage.',
   'per_hour', 800.00, 15.00, 2.0, 'Mahindra 575 DI (45 HP) with 48-blade Shaktiman rotavator.',
   ARRAY['kn', 'en'], 'Ensure field boundaries are marked and boulders removed.',
   'Free cancellation 12 hours prior.', true)
ON CONFLICT (id) DO NOTHING;

-- 7.19 Equipment
INSERT INTO public.equipment (id, provider_id, name, equipment_type, model_spec, registration_number, maintenance_due_date, is_operational)
VALUES
  ('12000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
   'DJI Agras T40 Drone', 'drone', '40L spray tank capacity, dual atomized centrifugal spray disks', 'UIN-AGRI-2024-KA-0091', CURRENT_DATE + INTERVAL '90 days', true),
  ('12000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002',
   'Mahindra 575 DI Tractor', 'tractor', '45 HP, 4-cylinder diesel with power steering', 'KA-07-TR-4912', CURRENT_DATE + INTERVAL '120 days', true)
ON CONFLICT (id) DO NOTHING;

-- 7.20 Orders (Demo Purchase of Mancozeb + Bio-fungicide)
INSERT INTO public.orders (id, farmer_id, total_amount, discount_amount, delivery_charge, final_amount, is_fpo_group_order, order_status, delivery_address, farmer_consent_recorded)
VALUES
  ('13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   560.00, 50.00, 40.00, 550.00, false, 'confirmed', 'Ramesh Patel Farm, Near Drip Well #2, Kolar Rural, Karnataka - 563101', true)
ON CONFLICT (id) DO NOTHING;

-- 7.21 Order Items
INSERT INTO public.order_items (id, order_id, product_id, batch_id, quantity, unit_price, total_price)
VALUES
  ('14000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   1, 340.00, 340.00),
  ('14000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003',
   1, 220.00, 220.00)
ON CONFLICT (id) DO NOTHING;

-- 7.22 Bookings (Drone Spraying Service Request)
INSERT INTO public.bookings (id, farmer_id, service_listing_id, farm_id, scheduled_date, scheduled_slot, estimated_cost, booking_status, provider_notes)
VALUES
  ('15000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   CURRENT_DATE + INTERVAL '2 days', '07:00 AM - 09:00 AM', 490.00, 'confirmed',
   'Scheduled after forecasted rain window passes. Pilot allocated: Rajesh V.')
ON CONFLICT (id) DO NOTHING;

-- 7.23 Payments (Simulated UPI)
INSERT INTO public.payments (id, order_id, booking_id, amount, payment_method, payment_status, transaction_reference, payment_gateway_metadata)
VALUES
  ('16000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', NULL,
   550.00, 'upi_simulated', 'captured', 'UPI-REF-KRN-20261007-99182',
   '{"gateway": "Simulated KrishiPay", "payer_vpa": "ramesh@oksbi", "bank": "State Bank of India"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7.24 Deliveries
INSERT INTO public.deliveries (id, order_id, carrier_name, tracking_number, dispatch_time, estimated_delivery_time, delivery_status, delivery_notes)
VALUES
  ('17000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001',
   'Kolar Kisan Express Logistics', 'EXP-KA-KOL-8849', now() - INTERVAL '1 hour', now() + INTERVAL '23 hours',
   'in_transit', 'Dispatched from Kisan Krishi Kendra store. Contact delivery partner: +919876543299')
ON CONFLICT (id) DO NOTHING;

-- 7.25 Return Requests (Simulated sample)
INSERT INTO public.return_requests (id, order_id, order_item_id, reason, explanation, status)
VALUES
  ('18000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001',
   '14000000-0000-0000-0000-000000000002', 'damaged_seal', 'Outer bio-fungicide pack seal arrived pierced during courier transit.', 'requested')
ON CONFLICT (id) DO NOTHING;

-- 7.26 Tasks (Field Operations)
INSERT INTO public.tasks (id, farmer_id, farm_id, crop_id, task_type, title, description, scheduled_date, scheduled_time, status)
VALUES
  ('19000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'spraying', 'Post-Rain Foliar Spray (Mancozeb 75% WP)', 'Apply foliar spray 24 hours after rain once tomato foliage is completely dry.', CURRENT_DATE + INTERVAL '2 days', '07:30:00', 'planned'),

  ('19000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'rescan_observation', 'Follow-up Leaf Scan Verification', 'Capture high-resolution scan of marked lower tomato leaf to verify blight arrest.', CURRENT_DATE + INTERVAL '5 days', '10:00:00', 'planned'),

  ('19000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'irrigation', 'Soil Moisture Check & Drip Pause', 'Keep drip system off due to sufficient rainfall accumulation.', CURRENT_DATE + INTERVAL '1 day', '06:00:00', 'planned')
ON CONFLICT (id) DO NOTHING;

-- 7.27 Notifications
INSERT INTO public.notifications (id, user_id, title, message, category, priority, is_read, action_link)
VALUES
  ('1a000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '⚠️ Spray Window Alert: Postpone Spraying',
   'Heavy rain (18mm) expected in Kolar within 8-12 hours. Spraying now will wash away fungicide. Wait until day after tomorrow.',
   'spray_window', 'critical', false, '/weather/spray-window'),

  ('1a000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Order Confirmed #13000000',
   'Your order for Dithane M-45 and EcoShield Bio-Fungicide has been confirmed and dispatched.',
   'order_status', 'medium', false, '/orders/13000000-0000-0000-0000-000000000001'),

  ('1a000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   'Pest Hotspot Warning in Kolar District',
   'Fruit borer detected 4.2 km from your farm in tomato fields. Monitor flowering trusses closely.',
   'pest_hotspot', 'high', false, '/pest-map')
ON CONFLICT (id) DO NOTHING;

-- 7.28 Market Prices (APMC Tomato Prices)
INSERT INTO public.market_prices (id, crop_name, variety, mandi_name, district, state, modal_price_per_quintal, min_price_per_quintal, max_price_per_quintal, source_name, is_simulated, price_date)
VALUES
  ('1b000000-0000-0000-0000-000000000001', 'Tomato', 'Hybrid Tomato (Arka Rakshak)', 'Kolar APMC Mandi', 'Kolar', 'Karnataka', 1850.00, 1400.00, 2200.00, 'Agmarknet / e-NAM Live', false, CURRENT_DATE),
  ('1b000000-0000-0000-0000-000000000002', 'Tomato', 'Local Variety', 'Chikkaballapur APMC', 'Chikkaballapur', 'Karnataka', 1720.00, 1300.00, 2050.00, 'Agmarknet / e-NAM Live', false, CURRENT_DATE),
  ('1b000000-0000-0000-0000-000000000003', 'Tomato', 'Hybrid Red', 'Yeshwanthpur APMC Bangalore', 'Bengaluru Urban', 'Karnataka', 2100.00, 1600.00, 2450.00, 'Agmarknet / e-NAM Live', false, CURRENT_DATE),
  ('1b000000-0000-0000-0000-000000000004', 'Tomato', 'Hybrid Red', 'Nashik Mandi', 'Nashik', 'Maharashtra', 1900.00, 1500.00, 2300.00, 'Agmarknet / e-NAM Live', false, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- 7.29 Government Schemes & Subsidies
INSERT INTO public.government_schemes (id, scheme_name, scheme_code, administering_body, category, eligibility_criteria, benefits_summary, subsidy_percentage, max_subsidy_amount, required_documents, official_portal_url, active_till_date)
VALUES
  ('1c000000-0000-0000-0000-000000000001',
   'Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'PMFBY-HORT-2026', 'Ministry of Agriculture, GoI', 'crop_insurance',
   '{"crop": "Tomato", "max_land_holding_acres": 25, "sowing_deadline_days": 15}'::jsonb,
   'Comprehensive risk insurance covering yield losses due to non-preventable natural risks, pests, and localized diseases with only 5% farmer premium.',
   95.00, 50000.00, ARRAY['Aadhaar Card', 'Land Record (RTC / Pahani)', 'Bank Passbook Copy', 'Sowing Certificate'],
   'https://pmfby.gov.in', CURRENT_DATE + INTERVAL '180 days'),

  ('1c000000-0000-0000-0000-000000000002',
   'Sub-Mission on Agricultural Mechanization (SMAM - Kisan Drone Subsidy)', 'SMAM-DRONE-2026', 'Department of Agriculture & Farmers Welfare', 'machinery_subsidy',
   '{"target_groups": ["Smallholder farmers", "Women farmers", "FPOs"], "land_acres_max": 5.0}'::jsonb,
   '50% financial assistance up to Rs. 5,00,000 for procurement or hiring of agricultural drones for precision nutrient and pesticide application.',
   50.00, 500000.00, ARRAY['Aadhaar Card', 'Caste/Farmer Category Certificate', 'FPO Registration (if group)'],
   'https://agrimachinery.nic.in', CURRENT_DATE + INTERVAL '240 days'),

  ('1c000000-0000-0000-0000-000000000003',
   'Paramparagat Krishi Vikas Yojana (PKVY - Organic Farming)', 'PKVY-ORG-KA-2026', 'National Centre of Organic Farming', 'organic_farming',
   '{"cluster_size_acres": 50, "individual_share_acres": 1.0, "organic_conversion_period_months": 36}'::jsonb,
   'Rs. 50,000 per hectare assistance for organic inputs, certification, bio-fungicides, and direct marketing assistance.',
   100.00, 50000.00, ARRAY['Pahani Record', 'Aadhaar Card', 'Soil Test Report', 'FPO Membership'],
   'https://pgsindia-ncof.gov.in', CURRENT_DATE + INTERVAL '300 days')
ON CONFLICT (id) DO NOTHING;

-- 7.30 Expert Reviews
INSERT INTO public.expert_reviews (id, diagnosis_id, expert_id, status, expert_diagnosis, confidence_score, verified_treatment_instructions, risk_assessment, notes)
VALUES
  ('1d000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   'approved', 'Early Blight (Alternaria solani) confirmed on Arka Rakshak tomato.', 0.940,
   'Approved for Mancozeb 75% WP @ 2.5g/L foliar spray. CRITICAL: Rain is anticipated within 8-12 hours. Do NOT spray today. Delay until 24-36h post rainfall once foliage is completely dry to prevent chemical runoff and watershed pollution.',
   'medium', 'Reviewed high-definition leaf photograph and weather forecast radar. Farmer voice question answered with postponement caution.')
ON CONFLICT (id) DO NOTHING;

-- 7.31 Follow-up Observations
INSERT INTO public.follow_up_observations (id, initial_observation_id, farmer_id, follow_up_image_url, days_after_initial, treatment_applied, outcome_status, visual_evidence_comparison, ai_confidence_score, recommended_next_step, needs_expert_escalation)
VALUES
  ('1e000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'https://storage.krishisetu.io/images/tomato_leaf_followup_day4.jpg', 4,
   'Dithane M-45 foliar spray applied 36h post-rain at 2.5g/L with knapsack sprayer.',
   'improved',
   'Concentric lesion margins have ceased expanding. Chlorotic yellow halos reduced from 15% to under 4% of total leaf surface. No fresh lesions observed on upper new growth.',
   0.910, 'Continue routine bi-weekly field monitoring. Maintain drip irrigation schedule.', false)
ON CONFLICT (id) DO NOTHING;

-- 7.32 Audit Logs
INSERT INTO public.audit_logs (id, actor_id, action, entity_type, entity_id, details)
VALUES
  ('1f000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'CROP_OBSERVATION_SUBMITTED', 'crop_observations', '30000000-0000-0000-0000-000000000001',
   '{"crop": "Tomato", "input_types": ["image", "voice"], "urgency": "high"}'::jsonb),

  ('1f000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'AI_DIAGNOSIS_GENERATED', 'diagnoses', '40000000-0000-0000-0000-000000000001',
   '{"ai_agent": "Crop Doctor Agent", "condition": "Alternaria solani", "confidence": 0.885}'::jsonb),

  ('1f000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'WEATHER_SPRAY_CHECK', 'weather_snapshots', '50000000-0000-0000-0000-000000000001',
   '{"agent": "Weather & Irrigation Agent", "recommendation": "delay_rain_expected", "rain_hours": 8}'::jsonb),

  ('1f000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'EXPERT_REVIEW_SUBMITTED', 'expert_reviews', '1d000000-0000-0000-0000-000000000001',
   '{"agronomist": "Dr. Ananya Sharma", "status": "approved", "rain_warning_reinforced": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7.33 Consent Records
INSERT INTO public.consent_records (id, farmer_id, consent_type, is_granted, policy_version)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'data_processing', true, 'v1.0'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'gps_location', true, 'v1.0'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'camera_images', true, 'v1.0'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'voice_audio', true, 'v1.0')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Migration Complete: All 33 tables, indexes, RLS, and seed data initialized.
-- ============================================================================
