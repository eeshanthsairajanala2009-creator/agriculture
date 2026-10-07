import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
  const { t } = useApp();

  const navItems = [
    { to: '/', label: t.home, icon: '🏠' },
    { to: '/consult', label: t.consult, icon: '🩺' },
    { to: '/store', label: t.store, icon: '🛒' },
    { to: '/schemes', label: t.schemes, icon: '📜' },
    { to: '/map', label: t.outbreakMap, icon: '🗺️' },
    { to: '/profile', label: t.profile, icon: '👨‍🌾' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      background: 'rgba(7, 15, 26, 0.95)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      padding: '0 8px',
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            color: isActive ? 'var(--green-400)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: isActive ? 600 : 400,
            transition: 'var(--transition)',
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
          })}
        >
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
