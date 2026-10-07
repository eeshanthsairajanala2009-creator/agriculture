import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function PestMap() {
  const { farmer, showToast } = useApp();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const outbreaks = [
    {
      id: 'ob-1',
      crop: 'Tomato',
      pestName: 'Early Blight (Alternaria solani)',
      severity: 'high',
      locationName: 'Vokkaleri Village, Kolar',
      distanceKm: 2.4,
      casesReported: 14,
      firstReported: 'Yesterday',
      recommendation: 'Inspect lower foliage. Do not spray during upcoming rain. Spray Mancozeb 75% WP post-rain.',
      lat: 13.136,
      lng: 78.134,
    },
    {
      id: 'ob-2',
      crop: 'Tomato',
      pestName: 'Fruit Borer (Helicoverpa armigera)',
      severity: 'medium',
      locationName: 'Malur Taluk, Kolar',
      distanceKm: 8.5,
      casesReported: 8,
      firstReported: '3 days ago',
      recommendation: 'Install pheromone traps (5 traps/acre). Apply NPV or Bt formulation if egg masses observed.',
      lat: 13.003,
      lng: 77.939,
    },
    {
      id: 'ob-3',
      crop: 'Tomato',
      pestName: 'Whitefly (Bemisia tabaci - Vector for TYLCV)',
      severity: 'low',
      locationName: 'Srinivaspur Taluk',
      distanceKm: 16.2,
      casesReported: 5,
      firstReported: '5 days ago',
      recommendation: 'Erect yellow sticky traps (15 traps/acre). Spray 5% neem seed kernel extract (NSKE).',
      lat: 13.342,
      lng: 78.212,
    },
  ];

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setShowReportModal(false);
    setReportSuccess(true);
    showToast('Pest report submitted to Kolar Agri Dept & community network!');
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px 90px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', color: 'var(--red-400)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            <span>📡</span>
            <span>Real-Time Community Outbreak Surveillance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
            ಕೀಟ & ರೋಗ ಹರಡುವಿಕೆ ನಕ್ಷೆ (Pest Outbreak Map)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>
            Live pathogen alerts reported within 20km radius of your farm in {farmer.village}, {farmer.district}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
          }}
        >
          <span>📢</span>
          <span>Report Outbreak</span>
        </button>
      </div>

      {reportSuccess && (
        <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-md)', padding: '14px', color: 'var(--green-400)', fontSize: 13 }}>
          ✅ Your observation has been verified and added to the regional epidemiological radar. Nearby farmers have received prevention alerts!
        </div>
      )}

      {/* Simulated Interactive Radar Map Box */}
      <div style={{
        background: 'radial-gradient(ellipse at center, rgba(17,31,51,0.95) 0%, rgba(7,15,26,1) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        position: 'relative',
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Radar Rings Graphic Background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 240,
          height: 240,
          borderRadius: '50%',
          border: '1px dashed rgba(34,197,94,0.2)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 140,
          height: 140,
          borderRadius: '50%',
          border: '1px solid rgba(34,197,94,0.3)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            📍 Central Pin: <strong style={{ color: 'var(--green-400)' }}>Ramesh Gowda's Farm ({farmer.village})</strong>
          </div>
          <span style={{ fontSize: 12, background: 'rgba(34,197,94,0.15)', color: 'var(--green-400)', padding: '3px 8px', borderRadius: 10 }}>
            Live Radar (20 km Radius)
          </span>
        </div>

        {/* Map Markers representation */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '30px 0', flexWrap: 'wrap', gap: 16 }}>
          {outbreaks.map((ob) => (
            <div
              key={ob.id}
              onClick={() => setSelectedAlert(ob)}
              style={{
                cursor: 'pointer',
                background: selectedAlert?.id === ob.id ? 'rgba(239,68,68,0.25)' : 'var(--bg-card2)',
                border: selectedAlert?.id === ob.id ? '2px solid var(--red-400)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                textAlign: 'center',
                transition: 'var(--transition)',
                boxShadow: ob.severity === 'high' ? '0 0 16px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              <div style={{ fontSize: 24 }}>
                {ob.severity === 'high' ? '🔴' : ob.severity === 'medium' ? '🟡' : '🟢'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{ob.pestName.split('(')[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ob.distanceKm} km away</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Tap any marker above to view quarantine precautions and localized treatment recommendations.
        </div>
      </div>

      {/* Selected Outbreak Detail Banner */}
      {selectedAlert && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--red-400)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, background: 'rgba(239,68,68,0.2)', color: 'var(--red-400)', padding: '2px 8px', borderRadius: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {selectedAlert.severity} Risk Outbreak
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0 2px 0' }}>
                {selectedAlert.pestName}
              </h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                📍 {selectedAlert.locationName} • {selectedAlert.distanceKm} km from your farm • {selectedAlert.casesReported} farmers reported
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <div style={{ background: 'var(--bg-card2)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 12, color: 'var(--green-400)', fontWeight: 700, marginBottom: 4 }}>
              🛡️ Preventive Field Action for Your Tomato Farm:
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {selectedAlert.recommendation}
            </div>
          </div>
        </div>
      )}

      {/* Outbreak list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>📋 Detailed Regional Outbreak Reports</h3>
        {outbreaks.map((ob) => (
          <div
            key={ob.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: ob.severity === 'high' ? '#ef4444' : ob.severity === 'medium' ? '#f59e0b' : '#22c55e',
                }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{ob.pestName}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({ob.crop})</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                📍 {ob.locationName} • {ob.distanceKm} km away • {ob.casesReported} farms affected
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAlert(ob)}
              style={{
                background: 'var(--bg-card2)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              View Advisory
            </button>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
            maxWidth: 480,
            width: '100%',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>📢 Report New Pest Outbreak</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Your report alerts neighboring farms and agricultural extension officers in Kolar.
            </p>
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ಬೆಳೆ (Crop):</label>
                <input
                  type="text"
                  defaultValue="Tomato"
                  style={{ width: '100%', background: 'var(--bg-card2)', color: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ರೋಗ / ಕೀಟ (Observed Symptoms / Pest):</label>
                <input
                  type="text"
                  placeholder="e.g., Concentric black spots, leaf curl, borer"
                  required
                  style={{ width: '100%', background: 'var(--bg-card2)', color: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ಸ್ಥಳ (Village/Location):</label>
                <input
                  type="text"
                  defaultValue={`${farmer.village}, ${farmer.district}`}
                  style={{ width: '100%', background: 'var(--bg-card2)', color: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{ flex: 1, background: 'var(--bg-card2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: 10, borderRadius: 8, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', padding: 10, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Submit Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
