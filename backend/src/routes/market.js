const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { marketAgent, schemeAgent } = require('../agents');

// ─── GET /api/market/prices?crop=Tomato&district=Kolar ───────────────────────
router.get('/prices', async (req, res) => {
  try {
    const { crop = 'Tomato', district = 'Kolar' } = req.query;

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('market_prices')
        .select('*')
        .ilike('crop_name', `%${crop}%`)
        .order('price_date', { ascending: false })
        .limit(10);
      if (!error && data?.length > 0) {
        return res.json({ success: true, data, source: 'database' });
      }
    }
    // Fallback to mock
    const result = marketAgent({ crop, district });
    res.json({ success: true, data: result, source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/market/schemes?crop=Tomato&district=Kolar&acres=1 ─────────────
router.get('/schemes', async (req, res) => {
  try {
    const { crop = 'Tomato', district = 'Kolar', acres = 1 } = req.query;

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('government_schemes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data?.length > 0) {
        return res.json({ success: true, data, source: 'database' });
      }
    }
    const result = schemeAgent({ crop, district, landHoldingAcres: parseFloat(acres) });
    res.json({ success: true, data: result, source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
