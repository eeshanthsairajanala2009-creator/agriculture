import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { lang, setLang, t, cart, toastMessage } = useApp();

  const totalCartItems = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(7, 15, 26, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '12px 18px',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo & Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(34, 197, 94, 0.35)',
            fontSize: 20,
          }}>
            🌱
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              {t.appName}
            </div>
            <div style={{
              fontSize: 10,
              color: 'var(--text-green)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
                display: 'inline-block',
              }} />
              <span>AI Active • Supabase Live</span>
            </div>
          </div>
        </Link>

        {/* Actions: Language & Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language Selector */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              background: 'var(--bg-card2)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>

          {/* Cart Icon */}
          <Link
            to="/store"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 18,
            }}
            title={t.cart}
          >
            🛒
            {totalCartItems > 0 && (
              <span className="cart-badge">
                {totalCartItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 75,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #15803d, #16a34a)',
          color: '#ffffff',
          padding: '10px 22px',
          borderRadius: 24,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(34, 197, 94, 0.4)',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-in',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </header>
  );
}
