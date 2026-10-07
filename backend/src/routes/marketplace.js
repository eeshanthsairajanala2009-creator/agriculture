const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// ─── GET /api/marketplace/products ───────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { crop, problem, category, organic, q } = req.query;

    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('products')
        .select(`
          *,
          sellers (id, business_name, district, rating, is_verified),
          product_labels (dosage_per_acre, pre_harvest_interval_days, toxicity_color_code, protective_equipment, verified_by_agronomist),
          product_batches (batch_number, expiry_date, is_expired, is_recalled)
        `)
        .eq('is_counterfeit_flagged', false)
        .order('created_at', { ascending: false });

      if (organic === 'true') query = query.eq('is_organic', true);
      if (category) query = query.eq('category', category);

      const { data, error } = await query.limit(20);
      if (!error && data?.length > 0) {
        const enriched = data.map(p => ({
          ...p,
          isExpiredBatch: p.product_batches?.some(b => b.is_expired),
          isAvailableForSale: p.is_available && p.stock_quantity > 0 && !p.product_batches?.some(b => b.is_expired),
          compatibilityScore: computeCompatibilityScore(p, { crop, problem }),
          trustFlag: !p.registration_cib_rc_no ? 'unregistered_product' : p.sellers?.is_verified ? 'verified' : 'unverified_seller',
        }));
        return res.json({ success: true, data: enriched, source: 'database' });
      }
    }

    // Mock fallback
    res.json({ success: true, data: mockProducts(), source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/marketplace/products/:id ───────────────────────────────────────
router.get('/products/:id', async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select(`*, sellers(*), product_labels(*), product_batches(*)`)
        .eq('id', req.params.id)
        .single();
      if (!error && data) return res.json({ success: true, data, source: 'database' });
    }
    res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/marketplace/services ───────────────────────────────────────────
router.get('/services', async (req, res) => {
  try {
    const { category, district } = req.query;

    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('service_listings')
        .select(`*, service_providers (business_name, rating, is_verified, district), equipment (name, equipment_type)`)
        .eq('is_available', true);
      if (category) query = query.eq('service_providers.service_category', category);
      const { data, error } = await query.limit(20);
      if (!error && data?.length > 0) return res.json({ success: true, data, source: 'database' });
    }

    res.json({ success: true, data: mockServices(), source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/marketplace/orders ────────────────────────────────────────────
router.post('/orders', async (req, res) => {
  try {
    const { farmerId, items, deliveryAddress } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });

    const totalAmount = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const finalAmount = totalAmount + 40; // delivery charge

    if (supabaseAdmin && farmerId) {
      const { data: order, error: oErr } = await supabaseAdmin
        .from('orders')
        .insert({
          farmer_id: farmerId,
          total_amount: totalAmount,
          delivery_charge: 40,
          final_amount: finalAmount,
          delivery_address: deliveryAddress || 'Demo Farm, Kolar',
          order_status: 'confirmed',
          farmer_consent_recorded: true,
        })
        .select()
        .single();

      if (!oErr && order) {
        await supabaseAdmin.from('order_items').insert(
          items.map(i => ({
            order_id: order.id,
            product_id: i.productId,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            total_price: i.quantity * i.unitPrice,
          }))
        );
        await supabaseAdmin.from('audit_logs').insert({
          actor_id: farmerId,
          action: 'ORDER_PLACED',
          entity_type: 'orders',
          entity_id: order.id,
          details: { item_count: items.length, total: finalAmount },
        });
        return res.json({ success: true, data: order, transactionRef: `KRN-${Date.now()}` });
      }
    }

    // Mock order response
    res.json({
      success: true,
      data: {
        id: `mock-order-${Date.now()}`,
        order_status: 'confirmed',
        final_amount: finalAmount,
        created_at: new Date().toISOString(),
      },
      transactionRef: `KRN-MOCK-${Date.now()}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/marketplace/bookings ──────────────────────────────────────────
router.post('/bookings', async (req, res) => {
  try {
    const { farmerId, serviceListingId, farmId, scheduledDate, scheduledSlot, estimatedCost } = req.body;

    if (supabaseAdmin && farmerId) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          farmer_id: farmerId,
          service_listing_id: serviceListingId,
          farm_id: farmId,
          scheduled_date: scheduledDate,
          scheduled_slot: scheduledSlot || '07:00 AM - 09:00 AM',
          estimated_cost: estimatedCost || 490,
          booking_status: 'confirmed',
        })
        .select()
        .single();
      if (!error && data) return res.json({ success: true, data });
    }

    res.json({
      success: true,
      data: {
        id: `mock-booking-${Date.now()}`,
        booking_status: 'confirmed',
        scheduled_date: scheduledDate,
        estimated_cost: estimatedCost || 490,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/marketplace/pest-reports ───────────────────────────────────────
router.get('/pest-reports', async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('pest_reports')
        .select('*')
        .order('observation_date', { ascending: false })
        .limit(20);
      if (!error && data?.length > 0) return res.json({ success: true, data, source: 'database' });
    }
    res.json({
      success: true,
      data: [
        { id: 'pr1', pest_type: 'Tomato Fruit Borer (Helicoverpa armigera)', crop_name: 'Tomato', severity: 'moderate', latitude: 13.1420, longitude: 78.1400, location_name: 'Kolar Cluster North', observation_date: new Date().toISOString().split('T')[0], spread_warning_issued: true },
      ],
      source: 'mock',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeCompatibilityScore(product, { crop, problem }) {
  let score = 0.50;
  if (crop && product.compatible_crops?.some(c => c.toLowerCase().includes(crop.toLowerCase()))) score += 0.30;
  if (problem && product.target_problems?.some(p => p.toLowerCase().includes(problem?.toLowerCase()))) score += 0.15;
  if (product.sellers?.is_verified) score += 0.05;
  return Math.min(score, 1.0).toFixed(2);
}

function mockProducts() {
  return [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Dithane M-45 (Mancozeb 75% WP)', category: 'chemical_fungicide', brand_manufacturer: 'Indofil Industries', active_ingredient: 'Mancozeb 75% WP', price: 340, mrp: 390, stock_quantity: 45, is_organic: false, is_available: true, compatible_crops: ['Tomato', 'Potato'], target_problems: ['Early Blight', 'Late Blight'], registration_cib_rc_no: 'CIR-1823/2004', sellers: { business_name: 'Kisan Krishi Kendra', is_verified: true, rating: 4.9, district: 'Kolar' }, product_batches: [{ expiry_date: '2028-06-01', is_expired: false }], trustFlag: 'verified', isAvailableForSale: true, compatibilityScore: '0.95' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'EcoShield Bio-Fungicide (Trichoderma viride)', category: 'bio_fungicide', brand_manufacturer: 'BioAgri Tech India', active_ingredient: 'Trichoderma viride 1.5% WP', price: 220, mrp: 260, stock_quantity: 60, is_organic: true, is_available: true, compatible_crops: ['Tomato', 'Chilli'], target_problems: ['Early Blight', 'Root Rot'], registration_cib_rc_no: 'CIB-BIO-2019', sellers: { business_name: 'Kisan Krishi Kendra', is_verified: true, rating: 4.9, district: 'Kolar' }, product_batches: [{ expiry_date: '2027-09-01', is_expired: false }], trustFlag: 'verified', isAvailableForSale: true, compatibilityScore: '0.88' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Blitox 50 (Copper Oxychloride 50% WP)', category: 'chemical_fungicide', brand_manufacturer: 'Rallis India', active_ingredient: 'Copper Oxychloride 50% WP', price: 380, mrp: 420, stock_quantity: 30, is_organic: false, is_available: true, compatible_crops: ['Tomato', 'Potato'], target_problems: ['Early Blight', 'Damping Off'], registration_cib_rc_no: 'CIR-4512/2008', sellers: { business_name: 'Kisan Krishi Kendra', is_verified: true, rating: 4.9, district: 'Kolar' }, product_batches: [{ expiry_date: '2027-07-01', is_expired: false }], trustFlag: 'verified', isAvailableForSale: true, compatibilityScore: '0.90' },
    { id: 'c0000000-0000-0000-0000-000000000004', name: 'Amistar Top (Azoxystrobin + Difenoconazole)', category: 'chemical_fungicide', brand_manufacturer: 'Syngenta', active_ingredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC', price: 890, mrp: 950, stock_quantity: 0, is_organic: false, is_available: false, compatible_crops: ['Tomato', 'Rice'], target_problems: ['Early Blight', 'Anthracnose'], registration_cib_rc_no: 'CIR-9923/2014', sellers: { business_name: 'Kisan Krishi Kendra', is_verified: true, rating: 4.9, district: 'Kolar' }, product_batches: [{ expiry_date: '2027-03-01', is_expired: false }], trustFlag: 'verified', isAvailableForSale: false, compatibilityScore: '0.85', unavailableReason: 'Out of stock' },
    { id: 'c0000000-0000-0000-0000-000000000005', name: 'Kisan Chlorpyrifos 20% EC [EXPIRED - BLOCKED]', category: 'chemical_insecticide', brand_manufacturer: 'Generic Chem', active_ingredient: 'Chlorpyrifos 20% EC', price: 410, mrp: 480, stock_quantity: 10, is_organic: false, is_available: false, compatible_crops: ['Cotton'], target_problems: ['Stem Borer'], registration_cib_rc_no: null, sellers: { business_name: 'Kisan Krishi Kendra', is_verified: true, rating: 4.9, district: 'Kolar' }, product_batches: [{ expiry_date: '2024-01-01', is_expired: true }], trustFlag: 'expired', isAvailableForSale: false, blockReason: 'EXPIRED: Batch expired. Blocked by Trust & Safety Agent. Do not purchase.' },
  ];
}

function mockServices() {
  return [
    { id: 's1', title: 'Precision Agricultural Drone Spraying', unit_type: 'per_acre', base_price: 450, travel_charge_per_km: 10, estimated_duration_hours: 0.5, is_available: true, languages_supported: ['kn', 'en'], cancellation_policy: 'Free cancellation up to 6 hours before flight.', equipment_specifications: 'DJI Agras T40', service_providers: { business_name: 'AgriDrone AeroTech', rating: 4.95, is_verified: true, district: 'Kolar' } },
    { id: 's2', title: 'Comprehensive Soil Health Test & Analysis (12 Parameters)', unit_type: 'per_sample', base_price: 350, estimated_duration_hours: 24, is_available: true, languages_supported: ['kn', 'en'], service_providers: { business_name: 'Kisan Mechanization & Soil Hub', rating: 4.80, is_verified: true, district: 'Kolar' } },
    { id: 's3', title: 'Certified Agronomist On-Field Diagnostic Visit', unit_type: 'flat_rate', base_price: 250, travel_charge_per_km: 5, is_available: true, languages_supported: ['kn', 'te', 'en'], service_providers: { business_name: 'AgriDrone AeroTech', rating: 4.95, is_verified: true, district: 'Kolar' } },
    { id: 's4', title: 'Mahindra 575 DI Tractor with Rotavator Rental', unit_type: 'per_hour', base_price: 800, travel_charge_per_km: 15, is_available: true, languages_supported: ['kn', 'en'], equipment_specifications: 'Mahindra 575 DI 45HP', service_providers: { business_name: 'Kisan Mechanization & Soil Hub', rating: 4.80, is_verified: true, district: 'Kolar' } },
  ];
}

module.exports = router;
