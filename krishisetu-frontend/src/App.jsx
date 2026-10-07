import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ConsultAI from './pages/ConsultAI';
import Marketplace from './pages/Marketplace';
import Schemes from './pages/Schemes';
import PestMap from './pages/PestMap';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/consult" element={<ConsultAI />} />
              <Route path="/store" element={<Marketplace />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/map" element={<PestMap />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AppProvider>
  );
}
