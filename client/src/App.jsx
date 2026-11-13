import React, { useState, useEffect } from 'react';
import apiClient from './api/apiClient';
import API_ENDPOINTS from './api/endpoints';
import DonationWorkflow from './components/DonationWorkflow';

/**
 * ==============================================================================
 * SHAREBITE - SYSTEM ARCHITECTURE & INTEGRATION CONSOLE
 * ==============================================================================
 * NOTE FOR TEAMMATE 1 (Frontend & UI):
 * This component verifies backend connectivity, data contracts, and API routes.
 * When you are ready to build the application UI:
 * 1. Create your pages inside src/pages/ (e.g., HomePage, DonationsPage, etc.)
 * 2. Mount your React Router / Navbar shell here in App.jsx or route into it.
 * ==============================================================================
 */

export default function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('donation-workflow');
  const [apiResult, setApiResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  // Probe server health on load to verify communication
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.HEALTH);
      setHealthStatus({ ok: true, data: response });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message || 'Cannot reach backend server' });
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (name, call) => {
    setTestingEndpoint(true);
    try {
      const res = await call();
      setApiResult({ name, status: 'success', data: res });
    } catch (err) {
      setApiResult({ name, status: 'error', data: err });
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>🍲</span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
              ShareBite <span style={{ fontSize: '14px', fontWeight: 500, color: '#10b981', background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>Core Architecture v1.0</span>
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Food Waste Management System – Integration Foundation & Service Bus
          </p>
        </div>

        {/* Server Status Badge */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: healthStatus?.ok ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 600, fontSize: '14px', color: healthStatus?.ok ? '#047857' : '#b91c1c' }}>
              {loading ? 'Checking server...' : healthStatus?.ok ? 'Backend Connected' : 'Server Disconnected'}
            </span>
          </div>
          <button
            onClick={checkHealth}
            style={{
              marginTop: '6px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Recheck /api/health
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'donation-workflow', label: '🍲 Donation Workflow (Member 3: Shreya)' },
          { id: 'overview', label: 'System Overview' },
          { id: 'endpoints-test', label: 'Endpoints Test' },
          { id: 'team-modules', label: 'Team Modules' },
          { id: 'data-contracts', label: 'Data Contracts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              backgroundColor: activeTab === tab.id ? '#10b981' : '#ffffff',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(16,185,129,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary Tab: Member 3 Donation Workflow */}
      {activeTab === 'donation-workflow' && <DonationWorkflow />}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#1e293b' }}>
              🔌 Health Check Status
            </h2>
            <pre style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto',
              maxHeight: '220px'
            }}>
              {JSON.stringify(healthStatus?.data || { status: 'Server offline or booting...' }, null, 2)}
            </pre>
          </div>

          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#1e293b' }}>
              🏗️ Architecture Topology
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><strong>Frontend:</strong> React 18 + Vite (Port 5173 with <code>/api</code> proxy)</li>
              <li><strong>Backend API:</strong> Express + Node.js (Port 5000)</li>
              <li><strong>Validation:</strong> Zod Runtime Contracts</li>
              <li><strong>Response Standard:</strong> Uniform <code>ApiResponse</code> & <code>ApiError</code> Envelope</li>
              <li><strong>Database Layer:</strong> Firebase Firestore Adapter Placeholder</li>
              <li><strong>Security:</strong> Helmet, CORS Whitelisting, Bearer RBAC Middleware</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Live Endpoint Test Suite */}
      {activeTab === 'endpoints-test' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
            🧪 Integration Endpoint Verifier
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Click any route below to test communication between Vite frontend and Express backend placeholders:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => testEndpoint('GET /api/health', () => apiClient.get(API_ENDPOINTS.HEALTH))}
              style={btnStyle}
            >
              GET /api/health
            </button>
            <button
              onClick={() => testEndpoint('GET /api/donations', () => apiClient.get(API_ENDPOINTS.DONATIONS.LIST))}
              style={btnStyle}
            >
              GET /api/donations
            </button>
            <button
              onClick={() => testEndpoint('GET /api/requests', () => apiClient.get(API_ENDPOINTS.REQUESTS.LIST))}
              style={btnStyle}
            >
              GET /api/requests
            </button>
            <button
              onClick={() => testEndpoint('GET /api/stats/overview', () => apiClient.get(API_ENDPOINTS.STATS.OVERVIEW))}
              style={btnStyle}
            >
              GET /api/stats/overview
            </button>
            <button
              onClick={() => testEndpoint('GET /api/stats/impact', () => apiClient.get(API_ENDPOINTS.STATS.IMPACT))}
              style={btnStyle}
            >
              GET /api/stats/impact
            </button>
          </div>

          {testingEndpoint && <p style={{ fontSize: '13px', color: '#6366f1' }}>Sending request...</p>}

          {apiResult && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Result for: <code>{apiResult.name}</code>
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: apiResult.status === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: apiResult.status === 'success' ? '#047857' : '#b91c1c'
                }}>
                  {apiResult.status.toUpperCase()}
                </span>
              </div>
              <pre style={{
                background: '#0f172a',
                color: '#4ade80',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(apiResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Team Responsibility Modules */}
      {activeTab === 'team-modules' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={moduleCardStyle}>
            <div style={{ ...pillStyle, background: '#eff6ff', color: '#1d4ed8' }}>Teammate 1</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0' }}>Frontend & UI</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Responsible for the application layout, navigation, forms, and pages.
            </p>
            <div style={{ fontSize: '12px', color: '#334155' }}>
              <strong>Work Area:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                <li><code>client/src/pages/</code></li>
                <li><code>client/src/components/</code></li>
                <li><code>client/src/App.jsx</code> (Mount Router)</li>
              </ul>
            </div>
          </div>

          <div style={moduleCardStyle}>
            <div style={{ ...pillStyle, background: '#fef3c7', color: '#b45309' }}>Teammate 2</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0' }}>Firebase & Database</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Responsible for Firestore collections, Firebase Auth, and credentials.
            </p>
            <div style={{ fontSize: '12px', color: '#334155' }}>
              <strong>Work Area:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                <li><code>server/src/config/firebase.js</code></li>
                <li><code>server/src/middleware/auth.middleware.js</code></li>
                <li><code>server/src/services/auth.service.js</code></li>
              </ul>
            </div>
          </div>

          <div style={moduleCardStyle}>
            <div style={{ ...pillStyle, background: '#f5f3ff', color: '#6d28d9' }}>Teammate 3</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0' }}>Donations, Requests & Admin</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Responsible for donation workflows, matching, approval rules, and admin tools.
            </p>
            <div style={{ fontSize: '12px', color: '#334155' }}>
              <strong>Work Area:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                <li><code>server/src/services/donation.service.js</code></li>
                <li><code>server/src/services/request.service.js</code></li>
                <li><code>server/src/services/admin.service.js</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Shared Data Contracts */}
      {activeTab === 'data-contracts' && (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#1e293b' }}>
            📋 Standardized Data Contracts
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={contractBoxStyle}>
              <h4 style={{ color: '#0f172a', marginBottom: '8px' }}>🍲 Food Entity</h4>
              <pre style={preContractStyle}>{`foodId: string
foodName: string
quantity: string | number
category: 'Cooked Meals' | 'Produce' | 'Bakery' | 'Dairy' | 'Packaged Goods' | 'Other'
donorId: string
location: { address, city, latitude, longitude }
preparedTime: ISO-Date
pickupDeadline: ISO-Date
status: 'AVAILABLE' | 'CLAIMED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'
allergens: string[]`}</pre>
            </div>

            <div style={contractBoxStyle}>
              <h4 style={{ color: '#0f172a', marginBottom: '8px' }}>📦 Food Request Entity</h4>
              <pre style={preContractStyle}>{`requestId: string
foodId: string
receiverId: string
requestedQuantity: number
requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COLLECTED' | 'CANCELLED'
createdAt: ISO-Date`}</pre>
            </div>

            <div style={contractBoxStyle}>
              <h4 style={{ color: '#0f172a', marginBottom: '8px' }}>👤 User Profile Entity</h4>
              <pre style={preContractStyle}>{`userId: string
name: string
email: string
role: 'DONOR' | 'RECEIVER' | 'VOLUNTEER' | 'ADMIN'`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Footer Instructions */}
      <footer style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
        ShareBite Foundation Architecture &bull; Full integration documentation in <code>/docs/INTEGRATION_GUIDE.md</code>
      </footer>
    </div>
  );
}

const btnStyle = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  padding: '8px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  color: '#334155'
};

const moduleCardStyle = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const pillStyle = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.5px'
};

const contractBoxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '14px'
};

const preContractStyle = {
  fontSize: '11px',
  color: '#0369a1',
  whiteSpace: 'pre-wrap',
  lineHeight: '1.4'
};
