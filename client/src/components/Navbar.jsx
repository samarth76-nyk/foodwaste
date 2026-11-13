import React, { useState } from 'react';
import { USER_ROLE } from '../contracts/models';

/**
 * Navbar Component
 * Designed by Tanisha (Member 1 - Frontend & UI)
 * Responsive top navigation bar with brand identity, page links, mobile menu, and user role switcher.
 */
export default function Navbar({
  activePage,
  setActivePage,
  currentRole,
  setCurrentRole,
  isServerOnline = true
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: '🏠 Home' },
    { id: 'donations', label: '🍲 Browse Food' },
    { id: 'donor', label: '👨‍🍳 Donor Portal' },
    { id: 'receiver', label: '📦 Receiver Portal' },
    { id: 'matching', label: '📍 NGO Matching' },
    { id: 'impact', label: '📊 Impact & Stats' },
    { id: 'workflow', label: '⚡ Workflow' }
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px'
      }}>
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '28px' }}>🍲</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                ShareBite
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#059669',
                background: '#ecfdf5',
                padding: '2px 6px',
                borderRadius: '10px',
                border: '1px solid #a7f3d0'
              }}>
                v1.0
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Food Waste Rescue Platform
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hide-mobile" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  background: isActive ? '#ecfdf5' : 'transparent',
                  color: isActive ? '#059669' : '#475569',
                  border: isActive ? '1px solid #a7f3d0' : '1px solid transparent',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Role Switcher & Server Status */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active Persona Pill / Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '12px',
                color: currentRole === USER_ROLE.DONOR ? '#059669' : '#0284c7',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value={USER_ROLE.DONOR}>👨‍🍳 Food Donor (Kitchen)</option>
              <option value={USER_ROLE.RECEIVER}>🏢 Receiver (NGO/Shelter)</option>
              <option value={USER_ROLE.ADMIN}>🛡️ Platform Admin</option>
            </select>
          </div>

          {/* Connection Dot */}
          <div
            title={isServerOnline ? 'Backend Online & Persistent' : 'Backend Disconnected'}
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: isServerOnline ? '#10b981' : '#ef4444'
            }}
          />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          className="mobile-toggle-btn"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activePage === link.id ? '#ecfdf5' : 'transparent',
                color: activePage === link.id ? '#059669' : '#334155',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {link.label}
            </button>
          ))}

          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Switch Demo Persona:
            </label>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="form-input"
            >
              <option value={USER_ROLE.DONOR}>👨‍🍳 Food Donor (Kitchen)</option>
              <option value={USER_ROLE.RECEIVER}>🏢 Receiver (Shelter)</option>
              <option value={USER_ROLE.ADMIN}>🛡️ Administrator</option>
            </select>
          </div>
        </div>
      )}

      {/* Style block for responsive hamburger */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle-btn {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
