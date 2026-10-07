const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const {
  farmerIntakeAgent, cropDoctorAgent, weatherAgent,
  treatmentAgent, financeAgent, verificationAgent,
} = require('../agents');

// ─── POST /api/ai/intake ──────────────────────────────────────────────────────
router.post('/intake', async (req, res) => {
  try {
    const { text, transcript, cropName } = req.body;
    const result = farmerIntakeAgent({ text, transcript, cropName });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/diagnose ────────────────────────────────────────────────────
router.post('/diagnose', async (req, res) => {
  try {
    const { imageBase64, cropName, symptoms, observationId } = req.body;
    const diagnosis = cropDoctorAgent({ imageBase64, cropName, symptoms });

    // Persist to Supabase if connected and observationId provided
    if (supabaseAdmin && observationId) {
      await supabaseAdmin.from('diagnoses').upsert({
        observation_id: observationId,
        disease_name: diagnosis.disease,
        scientific_name: diagnosis.scientificName,
        pathogen_type: diagnosis.pathogenType,
        confidence_score: diagnosis.confidence,
        severity: diagnosis.severity,
        visual_evidence: diagnosis.visualEvidence,
        recommended_next_observation: diagnosis.recommendedNextObservation,
        requires_expert_review: diagnosis.requiresExpertReview,
      });
    }

    res.json({ success: true, data: diagnosis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/weather ─────────────────────────────────────────────────────
router.post('/weather', async (req, res) => {
  try {
    const { location, latitude, longitude } = req.body;
    const result = weatherAgent({ location, latitude, longitude });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/treatment ───────────────────────────────────────────────────
router.post('/treatment', async (req, res) => {
  try {
    const { disease, cropName, budget, weatherData } = req.body;
    const weather = weatherData || weatherAgent({ location: 'Kolar' });
    const result = treatmentAgent({ disease, cropName, budget, weather });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/cost ────────────────────────────────────────────────────────
router.post('/cost', async (req, res) => {
  try {
    const { farmSizeAcres, treatmentOption } = req.body;
    const result = financeAgent({ farmSizeAcres, treatmentOption });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/verify ──────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { daysSinceInitial, treatmentApplied, imageBase64 } = req.body;
    const result = verificationAgent({ daysSinceInitial, treatmentApplied });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/full-workflow ───────────────────────────────────────────────
// Runs the complete demo pipeline in one call
router.post('/full-workflow', async (req, res) => {
  try {
    const {
      text = 'Can I spray today? Rain is expected tomorrow.',
      cropName = 'Tomato',
      location = 'Kolar District, Karnataka',
      farmSizeAcres = 1,
      budget = 'low',
      symptoms = 'Concentric brown rings with yellow halos on lower leaves',
    } = req.body;

    const intake = farmerIntakeAgent({ text, cropName });
    const diagnosis = cropDoctorAgent({ symptoms, cropName });
    const weather = weatherAgent({ location });
    const treatment = treatmentAgent({ disease: diagnosis.disease, cropName, budget, weather });
    const selectedOption = treatment.options[0];
    const cost = financeAgent({ farmSizeAcres, treatmentOption: selectedOption });

    res.json({
      success: true,
      workflow: {
        step1_intake: intake,
        step2_diagnosis: diagnosis,
        step3_weather: weather,
        step4_treatment: treatment,
        step5_cost: cost,
        summary: {
          disease: diagnosis.disease,
          confidence: diagnosis.confidence,
          sprayToday: weather.sprayWindowRecommendation !== 'delay_rain_expected',
          sprayWarning: treatment.sprayDelayMessage,
          recommendedProduct: selectedOption.name,
          estimatedCost: `₹${cost.costBreakdown.totalMid}`,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
