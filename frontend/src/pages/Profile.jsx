import React from 'react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { farmer, lang, setLang } = useApp();

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Profile Header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          boxShadow: '0 0 20px rgba(34,197,94,0.35)',
        }}>
          👨‍🌾
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
              {farmer.name}
            </h1>
            <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: 'var(--green-400)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              ✓ KYC Verified
            </span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            📞 {farmer.phone} • 📍 {farmer.village}, {farmer.district}, {farmer.state}
          </div>
        </div>
      </div>

      {/* Farm Land & Crop Information */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 800 }}>🌱 Farm Holding & Cropping Pattern</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ background: 'var(--bg-card2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL CULTIVABLE AREA</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-400)', marginTop: 2 }}>
              {farmer.landHoldingAcres} Acres
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Survey No. 142/2A, Vokkaleri</div>
          </div>
          <div style={{ background: 'var(--bg-card2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PRIMARY HORTICULTURAL CROP</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>
              {farmer.primaryCrop}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>2.0 Acres under drip irrigation</div>
          </div>
          <div style={{ background: 'var(--bg-card2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SECONDARY ROTATION CROP</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 2 }}>
              {farmer.secondaryCrop}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>1.5 Acres rainfed</div>
          </div>
        </div>
      </div>

      {/* Soil Health Diagnostic Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>🧪 Official Soil Health Report (SHC)</h3>
          <span style={{ fontSize: 11, color: 'var(--green-400)' }}>Tested: Nov 2025</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <div style={{ background: 'var(--bg-card2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>pH Value</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-400)', marginTop: 2 }}>6.4</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Normal (Slightly acidic)</div>
          </div>
          <div style={{ background: 'var(--bg-card2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nitrogen (N)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber-400)', marginTop: 2 }}>Medium</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>290 kg/ha</div>
          </div>
          <div style={{ background: 'var(--bg-card2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phosphorus (P)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-400)', marginTop: 2 }}>High</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>28 kg/ha</div>
          </div>
          <div style={{ background: 'var(--bg-card2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Potassium (K)</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-400)', marginTop: 2 }}>High</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>340 kg/ha</div>
          </div>
          <div style={{ background: 'var(--bg-card2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Organic Carbon</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber-400)', marginTop: 2 }}>0.52%</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Low (Add FYM)</div>
          </div>
        </div>
      </div>

      {/* Language Preferences */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 800 }}>🌐 ಭಾಷಾ ಆದ್ಯತೆ (Preferred App Language)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { id: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
            { id: 'en', name: 'English', label: 'English' },
            { id: 'hi', name: 'हिंदी', label: 'Hindi' },
            { id: 'te', name: 'తెలుగు', label: 'Telugu' },
            { id: 'ta', name: 'தமிழ்', label: 'Tamil' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: lang === item.id ? 'rgba(34,197,94,0.15)' : 'var(--bg-card2)',
                border: lang === item.id ? '1px solid var(--green-600)' : '1px solid var(--border)',
                color: lang === item.id ? 'var(--green-400)' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
