import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getWeather, getMarketPrices } from '../services/api';

export default function Home() {
  const { t, farmer } = useApp();
  const [weatherData, setWeatherData] = useState(null);
  const [marketData, setMarketData] = useState(null);

  useEffect(() => {
    // Fetch live weather advisory
    getWeather({ location: `${farmer.district}, ${farmer.state}` })
      .then((res) => {
        if (res.success) setWeatherData(res.data);
      })
      .catch((e) => console.log('Weather fallback active', e));

    // Fetch Mandi price
    getMarketPrices({ crop: 'Tomato', district: farmer.district })
      .then((res) => {
        if (res.success) setMarketData(res.data);
      })
      .catch((e) => console.log('Market fallback active', e));
  }, [farmer]);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Farmer Header Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(22,163,74,0.18) 0%, rgba(13,27,42,0.95) 100%)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{
              display: 'inline-block',
              background: 'rgba(34,197,94,0.15)',
              color: 'var(--green-400)',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              🌾 KrishiSetu Verified Farmer
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 6px 0' }}>
              {t.greeting}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              📍 {farmer.village}, {farmer.district} • {farmer.landHoldingAcres} Acres • {farmer.primaryCrop}
            </p>
          </div>
          <Link
            to="/consult"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
              textDecoration: 'none',
            }}
          >
            <span>🩺</span>
            <span>{t.diagnoseBtn}</span>
          </Link>
        </div>
      </div>

      {/* Critical Weather Spray Advisory Card */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}>
          🌧️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--red-400)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ⚠️ {weatherData?.sprayWindowRecommendation === 'delay_rain_expected' ? 'Spray Delay Advisory' : 'Weather Alert'}
            </span>
            <span style={{ fontSize: 11, background: 'rgba(239, 68, 68, 0.2)', color: 'var(--red-400)', padding: '2px 8px', borderRadius: 10 }}>
              Kolar District
            </span>
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 14, marginTop: 4, fontWeight: 500 }}>
            {weatherData?.weatherSummary || 'Heavy rain expected tomorrow (75% probability, 28mm). Avoid chemical or biological foliar spray for the next 18 hours to prevent chemical runoff.'}
          </div>
        </div>
      </div>

      {/* Quick Access Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Link to="/consult" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'var(--transition)',
        }}>
          <div style={{ fontSize: 28 }}>🤖</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>AI Crop Doctor</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Diagnose leaf spots, blight & pests in Kannada or English</div>
        </Link>

        <Link to="/store" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'var(--transition)',
        }}>
          <div style={{ fontSize: 28 }}>📦</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Agri-Input Store</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Direct Bio & Chemical fungicides with verified MRP & local stock</div>
        </Link>

        <Link to="/schemes" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'var(--transition)',
        }}>
          <div style={{ fontSize: 28 }}>🏛️</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Govt Subsidies</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>PMFBY Crop Insurance, PM-KISAN, and Sprayer Subsidies</div>
        </Link>

        <Link to="/map" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'var(--transition)',
        }}>
          <div style={{ fontSize: 28 }}>📍</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Outbreak Map</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Nearby Early Blight & Whitefly clusters in Kolar radius</div>
        </Link>
      </div>

      {/* Live Market Price & Crop Health Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Mandi Price Tracker */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>📊 APMC Mandi Realtime Prices</h3>
            <span style={{ fontSize: 11, color: 'var(--green-400)' }}>Kolar APMC</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tomato (Hybrid Sivam)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grade A Quality • 15 kg crate</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--green-400)' }}>₹1,850/qtl</div>
                <div style={{ fontSize: 11, color: 'var(--green-400)' }}>▲ +₹140 today</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Finger Millet (Ragi)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>MSP Rate 2026 • Per Quintal</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>₹4,290/qtl</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Stable</div>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Health Summary */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>🌿 Farm Condition Summary</h3>
            <span style={{ fontSize: 11, color: 'var(--amber-400)' }}>Needs Attention</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Plot 1: <strong style={{ color: '#fff' }}>Tomato Field (2.0 Acres)</strong>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-400)' }}>
                Target Alert: Early Blight (Alternaria solani)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Last evaluated 2 days ago. Suggested spray window: After rain cessation (Tomorrow post-4 PM).
              </div>
            </div>
            <Link to="/consult" style={{ color: 'var(--green-400)', fontSize: 13, fontWeight: 600, marginTop: 4, textDecoration: 'none' }}>
              View full AI diagnosis & verified treatment plan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
