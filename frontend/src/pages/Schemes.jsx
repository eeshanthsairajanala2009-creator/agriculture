import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Schemes() {
  const { t, farmer, showToast } = useApp();
  const [appliedSchemes, setAppliedSchemes] = useState({});

  const schemesList = [
    {
      id: 'pmfby-tomato',
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      category: 'Crop Insurance',
      badge: 'High Priority',
      description: 'Covers tomato yield loss caused by non-preventable risks including localized pest outbreaks (Early Blight) and unseasonal heavy rain.',
      benefit: 'Sum Insured up to ₹85,000 / Acre (Farmer premium only 5%)',
      eligibility: 'All farmers cultivating notified horticultural crops in Kolar.',
      documents: 'Aadhaar, RTC (Pahani), Bank Passbook, Sowing Certificate',
      deadline: '15 Nov 2026',
    },
    {
      id: 'pm-kisan',
      title: 'PM-KISAN Samman Nidhi',
      category: 'Income Support',
      badge: 'Active Beneficiary',
      description: 'Direct financial assistance of ₹6,000 per year paid in three equal 4-monthly installments of ₹2,000 directly into Aadhaar-linked bank accounts.',
      benefit: '₹6,000 / Year DBT Direct Transfer',
      eligibility: 'Small & marginal landholder farmer families with cultivable land.',
      documents: 'Aadhaar Card, Land ownership papers (RTC)',
      deadline: 'Ongoing enrollment',
    },
    {
      id: 'karnataka-sprayer-subsidy',
      title: 'Krishi Yantra Dhare (Sprayer Subsidy)',
      category: 'Farm Mechanization',
      badge: '50% Subsidy',
      description: 'Department of Agriculture Karnataka financial assistance on purchase of battery knapsack sprayers, power sprayers, and weeders.',
      benefit: '50% to 90% direct subsidy on retail price',
      eligibility: 'Farmers with verified landholding (SC/ST 90%, General/OBC 50%)',
      documents: 'RTC, Caste Certificate (if applicable), Quotation from authorized dealer',
      deadline: '31 Dec 2026',
    },
    {
      id: 'soil-health-card',
      title: 'National Soil Health Card Scheme',
      category: 'Soil Testing',
      badge: 'Free Service',
      description: 'Comprehensive 12-parameter soil testing (pH, EC, Organic Carbon, Nitrogen, Phosphorus, Potassium, Zinc, Boron) with customized fertilizer dosage advisory.',
      benefit: '100% Free Soil Testing & Diagnostic Card',
      eligibility: 'All active agricultural landholders in Karnataka',
      documents: 'Farm GPS coordinates, RTC copy',
      deadline: 'Year-round',
    },
  ];

  const handleApply = (schemeId, title) => {
    setAppliedSchemes((prev) => ({ ...prev, [schemeId]: true }));
    showToast(`Application submitted for ${title}!`);
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.12)', color: 'var(--blue-400)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
          <span>🏛️</span>
          <span>Karnataka & Central Government Portal</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
          ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು (Government Agricultural Schemes)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>
          Pre-qualified subsidies, crop insurance, and financial support automatically matched for {farmer.name} ({farmer.landHoldingAcres} Acres).
        </p>
      </div>

      {/* Pre-qualification banner */}
      <div style={{
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--green-400)' }}>
              Pre-Qualified for 3 Active Schemes
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Based on your Kolar land record (3.5 Acres, Tomato & Ragi). No paper forms required.
            </div>
          </div>
        </div>
      </div>

      {/* Schemes Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {schemesList.map((scheme) => (
          <div
            key={scheme.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.15)', color: 'var(--blue-400)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    {scheme.category}
                  </span>
                  <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: 'var(--green-400)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    {scheme.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0 2px 0' }}>
                  {scheme.title}
                </h3>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Deadline: <strong style={{ color: 'var(--amber-400)' }}>{scheme.deadline}</strong>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {scheme.description}
            </p>

            <div style={{ background: 'var(--bg-card2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>💰 ಲಾಭ (Benefit): </span>
                <strong style={{ color: 'var(--green-400)' }}>{scheme.benefit}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>📄 ದಾಖಲೆಗಳು: </span>
                <span style={{ color: 'var(--text-primary)' }}>{scheme.documents}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => handleApply(scheme.id, scheme.title)}
                disabled={appliedSchemes[scheme.id]}
                style={{
                  background: appliedSchemes[scheme.id]
                    ? 'rgba(34,197,94,0.2)'
                    : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color: appliedSchemes[scheme.id] ? 'var(--green-400)' : '#fff',
                  border: appliedSchemes[scheme.id] ? '1px solid var(--green-600)' : 'none',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: appliedSchemes[scheme.id] ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{appliedSchemes[scheme.id] ? '✓ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Applied)' : '📝 1-Click Apply with KYC'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
