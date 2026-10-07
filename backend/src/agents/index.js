/**
 * Mock AI Agents for KrishiSetu Nexus
 * Returns realistic mock responses when live AI APIs are unavailable.
 * Each agent is isolated and can be replaced with a real AI provider.
 */

// ─── Agent 1: Farmer Intake Agent ────────────────────────────────────────────
function farmerIntakeAgent({ text, transcript, cropName = 'Tomato' }) {
  const input = (text || transcript || '').toLowerCase();
  let intent = 'crop_disease_inquiry';
  let urgency = 'medium';
  if (input.includes('spray') || input.includes('rain')) urgency = 'high';
  if (input.includes('emergency') || input.includes('dying')) urgency = 'high';
  if (input.includes('market') || input.includes('price')) intent = 'market_price_inquiry';
  if (input.includes('insurance') || input.includes('scheme')) intent = 'government_scheme_inquiry';
  if (input.includes('book') || input.includes('drone')) intent = 'service_booking';
  return {
    intent,
    crop: cropName,
    urgency,
    language: 'kn',
    budget: 'low',
    extractedSymptoms: 'Concentric brown rings with yellow halos on lower foliage',
    voiceTranscript: transcript || text || 'Can I spray today? Rain is expected tomorrow.',
    caseCreated: true,
  };
}

// ─── Agent 2: Crop Doctor Agent ──────────────────────────────────────────────
function cropDoctorAgent({ imageBase64, cropName = 'Tomato', symptoms }) {
  const hasSomething = imageBase64 || symptoms;
  const confidence = hasSomething ? 0.885 : 0.520;
  return {
    disease: 'Early Blight',
    scientificName: 'Alternaria solani',
    pathogenType: 'fungal',
    confidence,
    severity: 'moderate',
    visualEvidence: 'Concentric target-like rings with chlorotic halos observed on 15% of lower canopy leaves.',
    affectedArea: '15%',
    recommendedNextObservation: 'Inspect lower canopy after 48 hours for lesion expansion.',
    requiresExpertReview: confidence < 0.70,
    aiDisclaimer: 'This is a preliminary AI estimate. Consult a certified agronomist for confirmation before any chemical application.',
    topConditions: [
      { name: 'Early Blight (Alternaria solani)', confidence },
      { name: 'Leaf Spot (Cercospora)', confidence: 0.12 },
      { name: 'Nutrient Deficiency (Magnesium)', confidence: 0.05 },
    ],
  };
}

// ─── Agent 3: Weather & Irrigation Agent ─────────────────────────────────────
function weatherAgent({ location = 'Kolar District, Karnataka' }) {
  return {
    location,
    temperatureCelsius: 26.4,
    humidityPct: 84.5,
    rainfallProbability: 78.0,
    rainfallExpectedMm: 18.5,
    windSpeedKmh: 14.2,
    rainExpectedInHours: 8,
    sprayWindowRecommendation: 'delay_rain_expected',
    sprayWindowExplanation:
      'Rain expected within 8–12 hours (78% probability). Fungicide wash-off will nullify efficacy and contaminate waterways. Postpone spraying until canopy is dry after rainfall — estimated safe window: day-after-tomorrow morning (05:00–09:00).',
    irrigationRecommendation:
      'Hold drip irrigation for 24 hours. Incoming rainfall will satisfy soil moisture requirements.',
    dataSourceType: 'simulated',
    safeSprayWindowDate: 'Day after tomorrow, 05:00 – 09:00 AM',
  };
}

// ─── Agent 4: Treatment Agent ─────────────────────────────────────────────────
function treatmentAgent({ disease = 'Early Blight', cropName = 'Tomato', budget = 'low', weather }) {
  const delayWarning = weather?.sprayWindowRecommendation === 'delay_rain_expected';
  return {
    disease,
    cropName,
    sprayDelayWarning: delayWarning,
    sprayDelayMessage: delayWarning
      ? '⚠️ Do NOT spray today. Rain is expected. Wait for the safe spray window.'
      : null,
    options: [
      {
        type: 'chemical',
        name: 'Mancozeb 75% WP (Dithane M-45)',
        dosage: '2.5 g per litre of water',
        waterVolume: '200 L per acre',
        applicationMethod: 'Foliar knapsack spray with hollow cone nozzle',
        preHarvestIntervalDays: 7,
        estimatedCostPerAcre: 340,
        ppe: ['Gloves', 'Safety Goggles', 'N95 Mask', 'Full Sleeve Boots'],
        pros: ['Fast acting', 'Cost-effective', 'Proven efficacy'],
        cons: ['Chemical residue', 'Must wait for safe spray window'],
        safetyWarning: 'Avoid spraying within 6 hours of expected rain or when wind > 15 km/h.',
        registrationNo: 'CIR-1823/2004-Mancozeb(WP)-112',
      },
      {
        type: 'organic',
        name: 'Trichoderma viride 1.5% WP (EcoShield Bio-Fungicide)',
        dosage: '5 g per litre of water',
        waterVolume: '200 L per acre',
        applicationMethod: 'Foliar spray in late afternoon or evening',
        preHarvestIntervalDays: 0,
        estimatedCostPerAcre: 220,
        ppe: ['Dust Mask', 'Gloves'],
        pros: ['Zero chemical residue', 'Safe pre-harvest', 'Soil health benefit'],
        cons: ['Slower acting', 'Requires 2+ applications'],
        safetyWarning: 'Avoid co-application with chemical fungicides. Apply after sunset.',
        registrationNo: 'CIB-BIO-2019-Trichoderma-019',
      },
      {
        type: 'manual',
        name: 'Remove Affected Leaves',
        description: 'Hand-remove severely affected lower leaves and dispose away from field.',
        estimatedCostPerAcre: 50,
        pros: ['Immediate reduction in spore load', 'No chemicals'],
        cons: ['Labor intensive', 'Incomplete control'],
      },
      {
        type: 'monitoring',
        name: 'Wait and Monitor (48h)',
        description: 'Mark 10 leaves. Re-scan after 48 hours to assess progression before intervention.',
        estimatedCostPerAcre: 0,
        pros: ['No unnecessary chemical use', 'Better diagnosis accuracy'],
        cons: ['Risk of spread if disease is aggressive'],
      },
    ],
    expertConfirmationRequired: false,
  };
}

// ─── Agent 5: Finance Agent ───────────────────────────────────────────────────
function financeAgent({ farmSizeAcres = 1, treatmentOption }) {
  const base = treatmentOption?.estimatedCostPerAcre || 340;
  return {
    farmSizeAcres,
    costBreakdown: {
      productCost: base * farmSizeAcres,
      laborCost: 80 * farmSizeAcres,
      deliveryCharge: 40,
      totalLow: (base * 0.8 * farmSizeAcres + 40),
      totalMid: (base * farmSizeAcres + 80 * farmSizeAcres + 40),
      totalHigh: (base * 1.2 * farmSizeAcres + 80 * farmSizeAcres + 40),
    },
    yieldLossIfUntreated: '25–40%',
    yieldLossReductionEstimate: '70–85%',
    estimateDisclaimer: 'Cost estimates are approximate. Actual prices vary by retailer and season.',
    scenarios: ['Low Budget (organic only)', 'Medium Budget (chemical + PPE)', 'High Budget (drone spray + lab test)'],
  };
}

// ─── Agent 6: Market Agent ────────────────────────────────────────────────────
function marketAgent({ crop = 'Tomato', district = 'Kolar' }) {
  return {
    crop,
    district,
    prices: [
      { mandi: 'Kolar APMC', modalPrice: 1850, minPrice: 1400, maxPrice: 2200, date: new Date().toISOString().split('T')[0] },
      { mandi: 'Chikkaballapur APMC', modalPrice: 1720, minPrice: 1300, maxPrice: 2050, date: new Date().toISOString().split('T')[0] },
      { mandi: 'Bangalore Yeshwanthpur APMC', modalPrice: 2100, minPrice: 1600, maxPrice: 2450, date: new Date().toISOString().split('T')[0] },
    ],
    recommendation: 'sell_wait',
    analysis: 'Bangalore Yeshwanthpur APMC is currently offering ₹2100/quintal modal price. Consider transporting if you have >10 quintals ready. Local Kolar APMC acceptable for smaller lots.',
    transportCostEstimate: '₹150–200 per quintal to Bangalore',
    dataSourceType: 'simulated',
    dataTimestamp: new Date().toISOString(),
    disclaimer: 'Prices are simulated/illustrative. Verify at official Agmarknet before transport.',
  };
}

// ─── Agent 7: Government Scheme Agent ────────────────────────────────────────
function schemeAgent({ crop = 'Tomato', district = 'Kolar', landHoldingAcres = 1 }) {
  return {
    eligibleSchemes: [
      {
        name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        code: 'PMFBY-HORT-2026',
        benefit: '95% premium subsidy — only 5% paid by farmer',
        maxAmount: 50000,
        eligibilityStatus: 'eligible',
        requiredDocs: ['Aadhaar', 'Land Record (RTC/Pahani)', 'Bank Passbook', 'Sowing Certificate'],
        portal: 'https://pmfby.gov.in',
        deadline: 'Within 15 days of sowing',
      },
      {
        name: 'SMAM — Agricultural Drone Subsidy',
        code: 'SMAM-DRONE-2026',
        benefit: '50% subsidy up to ₹5,00,000 for drone hiring',
        eligibilityStatus: 'eligible',
        requiredDocs: ['Aadhaar', 'Farmer Category Certificate'],
        portal: 'https://agrimachinery.nic.in',
        deadline: 'Open enrollment',
      },
      {
        name: 'PKVY — Organic Farming Scheme',
        code: 'PKVY-ORG-KA-2026',
        benefit: '₹50,000/hectare assistance for organic inputs and certification',
        eligibilityStatus: landHoldingAcres >= 1 ? 'eligible' : 'not_eligible',
        requiredDocs: ['Pahani Record', 'Aadhaar', 'Soil Test Report', 'FPO Membership'],
        portal: 'https://pgsindia-ncof.gov.in',
        deadline: 'Open enrollment',
      },
    ],
    disclaimer: 'Eligibility is indicative. Official confirmation required from respective government portals.',
  };
}

// ─── Agent 8: Verification Agent ─────────────────────────────────────────────
function verificationAgent({ daysSinceInitial = 4, treatmentApplied }) {
  const improved = daysSinceInitial >= 3 && treatmentApplied;
  return {
    outcomeStatus: improved ? 'improved' : 'unchanged',
    visualEvidenceComparison: improved
      ? 'Concentric lesion margins have ceased expanding. Chlorotic yellow halos reduced from 15% to under 4% of total leaf surface. No fresh lesions on upper new growth.'
      : 'No significant change in lesion size. Consider escalation to agronomist.',
    aiConfidenceScore: improved ? 0.91 : 0.74,
    recommendedNextStep: improved
      ? 'Continue bi-weekly field monitoring. Maintain drip irrigation schedule.'
      : 'Book an agronomist consultation for on-field verification.',
    needsExpertEscalation: !improved,
    sustainabilityImpact: improved ? 'Estimated 12% reduction in fungicide usage vs standard protocol.' : null,
  };
}

module.exports = {
  farmerIntakeAgent,
  cropDoctorAgent,
  weatherAgent,
  treatmentAgent,
  financeAgent,
  marketAgent,
  schemeAgent,
  verificationAgent,
};
