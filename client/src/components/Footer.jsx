import React from 'react';

/**
 * Footer Component
 * Responsive footer displaying project information, quick navigation, and platform architecture.
 */
export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      marginTop: '60px',
      padding: '48px 0 24px'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '32px',
          marginBottom: '36px'
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '26px' }}>🍲</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>ShareBite</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '14px' }}>
              Connecting commercial surplus food donors with community shelters, reducing landfill methane emissions, and feeding families.
            </p>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
              🌱 Zero Food Waste Initiative
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Platform Navigation
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <a href="#donations" onClick={(e) => { e.preventDefault(); onNavigate('donations'); }} style={{ color: '#475569' }}>
                  🍲 Browse Active Food Listings
                </a>
              </li>
              <li>
                <a href="#donor" onClick={(e) => { e.preventDefault(); onNavigate('donor'); }} style={{ color: '#475569' }}>
                  👨‍🍳 Donor Management Portal
                </a>
              </li>
              <li>
                <a href="#receiver" onClick={(e) => { e.preventDefault(); onNavigate('receiver'); }} style={{ color: '#475569' }}>
                  🏢 Shelter & Receiver Portal
                </a>
              </li>
              <li>
                <a href="#matching" onClick={(e) => { e.preventDefault(); onNavigate('matching'); }} style={{ color: '#475569' }}>
                  📍 Haversine Proximity Matcher
                </a>
              </li>
              <li>
                <a href="#impact" onClick={(e) => { e.preventDefault(); onNavigate('impact'); }} style={{ color: '#475569' }}>
                  📊 Environmental Impact Calculator
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Architecture */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Platform Architecture
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569' }}>
              <div>&bull; Real-time Surplus Food Marketplace</div>
              <div>&bull; Automated Inventory & Portion Deduction</div>
              <div>&bull; Haversine NGO Proximity Matching</div>
              <div>&bull; EPA WARM Environmental Analytics</div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <div>&copy; {new Date().getFullYear()} ShareBite &bull; Full-Stack Food Waste Management System</div>
          <div>React 18 &bull; Vite &bull; Node.js &bull; Express &bull; Google Cloud Firestore</div>
        </div>
      </div>
    </footer>
  );
}
