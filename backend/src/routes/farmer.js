const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// ─── GET /api/farmer/profile/:id ──────────────────────────────────────────────
router.get('/profile/:id', async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*, farmer_profiles(*)')
        .eq('id', req.params.id)
        .single();
      if (!error && data) return res.json({ success: true, data });
    }
    res.json({ success: true, data: mockFarmerProfile(), source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/farmer/farms/:farmerId ──────────────────────────────────────────
router.get('/farms/:farmerId', async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('farms')
        .select('*, crops(*)')
        .eq('farmer_id', req.params.farmerId);
      if (!error) return res.json({ success: true, data: data || [] });
    }
    res.json({ success: true, data: [mockFarm()], source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/farmer/dashboard/:farmerId ──────────────────────────────────────
router.get('/dashboard/:farmerId', async (req, res) => {
  try {
    const farmerId = req.params.farmerId;
    let farms = [mockFarm()];
    let tasks = [mockTask()];
    let notifications = [mockNotification()];
    let orders = [];
    let bookings = [];

    if (supabaseAdmin) {
      const [farmsRes, tasksRes, notifRes, ordersRes, bookingsRes] = await Promise.all([
        supabaseAdmin.from('farms').select('*, crops(*)').eq('farmer_id', farmerId),
        supabaseAdmin.from('tasks').select('*').eq('farmer_id', farmerId).order('scheduled_date').limit(10),
        supabaseAdmin.from('notifications').select('*').eq('user_id', farmerId).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('orders').select('*, order_items(*, products(*))').eq('farmer_id', farmerId).limit(5),
        supabaseAdmin.from('bookings').select('*, service_listings(*, service_providers(*))').eq('farmer_id', farmerId).limit(5),
      ]);
      if (!farmsRes.error && farmsRes.data?.length) farms = farmsRes.data;
      if (!tasksRes.error) tasks = tasksRes.data || tasks;
      if (!notifRes.error) notifications = notifRes.data || notifications;
      if (!ordersRes.error) orders = ordersRes.data || [];
      if (!bookingsRes.error) bookings = bookingsRes.data || [];
    }

    res.json({
      success: true,
      data: {
        farms,
        activeCrops: farms.flatMap(f => f.crops || []),
        pendingTasks: tasks.filter(t => t.status === 'planned' || t.status === 'in_progress'),
        notifications,
        recentOrders: orders,
        upcomingBookings: bookings,
        farmHealthSummary: {
          healthy: farms.flatMap(f => f.crops || []).filter(c => c.health_status === 'healthy').length,
          attentionNeeded: farms.flatMap(f => f.crops || []).filter(c => c.health_status === 'attention_needed').length,
          critical: farms.flatMap(f => f.crops || []).filter(c => c.health_status === 'critical').length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/farmer/observations/:farmerId ───────────────────────────────────
router.get('/observations/:farmerId', async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('crop_observations')
        .select('*, crops(*), diagnoses(*, expert_reviews(*)), follow_up_observations(*)')
        .eq('farmer_id', req.params.farmerId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) return res.json({ success: true, data: data || [] });
    }
    res.json({ success: true, data: [mockObservation()], source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/farmer/observations ───────────────────────────────────────────
router.post('/observations', async (req, res) => {
  try {
    const { farmerId, cropId, symptoms, urgency = 'medium', imageUrl, voiceTranscript } = req.body;
    if (supabaseAdmin && farmerId && cropId) {
      const { data, error } = await supabaseAdmin
        .from('crop_observations')
        .insert({ farmer_id: farmerId, crop_id: cropId, symptoms, urgency, image_url: imageUrl, voice_transcript: voiceTranscript, status: 'submitted' })
        .select()
        .single();
      if (!error) return res.json({ success: true, data });
    }
    res.json({ success: true, data: { id: `mock-obs-${Date.now()}`, symptoms, urgency, status: 'submitted', created_at: new Date().toISOString() }, source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/farmer/tasks/:farmerId ─────────────────────────────────────────
router.get('/tasks/:farmerId', async (req, res) => {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('farmer_id', req.params.farmerId)
        .order('scheduled_date');
      if (!error) return res.json({ success: true, data: data || [] });
    }
    res.json({ success: true, data: [mockTask()], source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mockFarmerProfile() {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Ramesh Patel',
    email: 'farmer.ramesh@krishisetu.io',
    phone: '+919876543210',
    role: 'farmer',
    preferred_language: 'kn',
    is_verified: true,
    farmer_profiles: { experience_years: 12, literacy_assistance_enabled: true, voice_guidance_enabled: true },
  };
}

function mockFarm() {
  const today = new Date();
  return {
    id: '10000000-0000-0000-0000-000000000001',
    farmer_id: '00000000-0000-0000-0000-000000000001',
    name: 'Ramesh Tomato Farm – Plot 1',
    total_acres: 1.00,
    location_name: 'Kolar District, Karnataka',
    latitude: 13.1378,
    longitude: 78.1348,
    soil_type: 'Red Sandy Loam',
    irrigation_source: 'Drip Irrigation',
    crops: [{
      id: '20000000-0000-0000-0000-000000000001',
      crop_name: 'Tomato',
      variety: 'Arka Rakshak (F1 Hybrid)',
      acreage: 1.00,
      stage: 'flowering',
      health_status: 'attention_needed',
      sowing_date: new Date(today.getTime() - 45 * 86400000).toISOString().split('T')[0],
      expected_harvest_date: new Date(today.getTime() + 35 * 86400000).toISOString().split('T')[0],
    }],
  };
}

function mockObservation() {
  return {
    id: '30000000-0000-0000-0000-000000000001',
    symptoms: 'Concentric dark brown rings with chlorotic yellow halos on lower foliage.',
    voice_transcript: 'Can I spray today? Rain is expected tomorrow.',
    urgency: 'high',
    status: 'diagnosed',
    created_at: new Date().toISOString(),
    diagnoses: [{ disease_name: 'Early Blight', confidence_score: 0.885, severity: 'moderate', pathogen_type: 'fungal', is_verified_by_expert: true }],
  };
}

function mockTask() {
  const d = new Date(); d.setDate(d.getDate() + 2);
  return { id: 'task-1', task_type: 'spraying', title: 'Post-Rain Foliar Spray (Mancozeb 75% WP)', description: 'Apply 24h after rain once foliage is completely dry.', scheduled_date: d.toISOString().split('T')[0], status: 'planned' };
}

function mockNotification() {
  return { id: 'notif-1', title: '⚠️ Spray Window Alert: Postpone Spraying', message: 'Rain expected in Kolar within 8 hours. Do not spray today.', category: 'spray_window', priority: 'critical', is_read: false, created_at: new Date().toISOString() };
}

module.exports = router;
