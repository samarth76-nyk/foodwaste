import React, { useState, useEffect } from 'react';
import apiClient from './api/apiClient';
import API_ENDPOINTS from './api/endpoints';
import { USER_ROLE, FOOD_CATEGORY, FOOD_STATUS, REQUEST_STATUS } from './contracts/models';

// Component imports (Member 1 - Tanisha)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequestModal from './components/RequestModal';
import DonationModal from './components/DonationModal';

// Workflow import (Member 3 - Shreya)
import DonationWorkflow from './components/DonationWorkflow';

// Page imports (Member 1 - Tanisha)
import HomePage from './pages/HomePage';
import DonationsPage from './pages/DonationsPage';
import DonorDashboard from './pages/DonorDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import MatchingPage from './pages/MatchingPage';
import ImpactPage from './pages/ImpactPage';

/**
 * ==============================================================================
 * SHAREBITE - MAIN FRONTEND APPLICATION
 * ==============================================================================
 * Designed & Built by: Tanisha (Member 1 – Frontend & UI)
 * Integrated Features:
 * - Member 1 (Tanisha): Responsive Navigation, Homepage, Food Cards, Donor & Receiver Dashboards.
 * - Member 2 (Samarth): Persistent Firebase/Firestore Database Storage & Retrieval, Food Donation CRUD.
 * - Member 3 (Shreya): Complete Donation Workflow (Food Upload, Request Food, Accept/Reject, Lifecycle).
 * - Member 4 (Thanush): Proximity Matching (Haversine Algorithm), Pickup Deadline Warnings & Impact Analytics.
 * ==============================================================================
 */
export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [currentRole, setCurrentRole] = useState(USER_ROLE.RECEIVER);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Core Data Collections
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [overviewStats, setOverviewStats] = useState({});
  const [impactMetrics, setImpactMetrics] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);

  // Modals & Interactivity State
  const [requestModalFood, setRequestModalFood] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedMatchingFoodId, setSelectedMatchingFoodId] = useState('');
  const [showDbInspector, setShowDbInspector] = useState(false);
  const [dbDataPreview, setDbDataPreview] = useState(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  useEffect(() => {
    initAppData();
  }, []);

  const initAppData = async () => {
    setLoading(true);
    await Promise.all([
      checkHealth(),
      fetchDonations(),
      fetchRequests(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const checkHealth = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.HEALTH);
      setHealthStatus({ ok: true, data: res.data || res });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message || 'Cannot reach backend' });
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST);
      const list = res.data || [];
      setDonations(list);
      if (list.length > 0 && !selectedMatchingFoodId) {
        setSelectedMatchingFoodId(list[0].foodId);
      }
    } catch (err) {
      console.error('Failed to load food listings:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.REQUESTS.LIST);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load food requests:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const [overviewRes, impactRes, catRes, leaderRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.STATS.OVERVIEW),
        apiClient.get(API_ENDPOINTS.STATS.IMPACT),
        apiClient.get(API_ENDPOINTS.STATS.CATEGORIES),
        apiClient.get(API_ENDPOINTS.STATS.LEADERBOARD)
      ]);
      setOverviewStats(overviewRes.data || {});
      setImpactMetrics(impactRes.data || null);
      setCategoryBreakdown(catRes.data || []);
      setLeaderboard(leaderRes.data || null);
    } catch (err) {
      console.error('Failed to load impact stats:', err);
    }
  };

  // Donor Handlers
  const handleDonationCreated = (newDonation) => {
    showToast(`🎉 Food listing "${newDonation.foodName}" successfully published!`);
    fetchDonations();
    fetchStats();
    checkHealth();
  };

  const handleDeleteDonation = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this listing from the database?')) return;
    try {
      await apiClient.delete(API_ENDPOINTS.DONATIONS.DELETE(foodId));
      showToast('Food listing deleted from database.');
      fetchDonations();
      fetchStats();
      checkHealth();
    } catch (err) {
      alert(`Error deleting listing: ${err.message}`);
    }
  };

  // Receiver Handlers
  const handleRequestSubmitted = (newRequest) => {
    showToast(`✅ Claim submitted for "${newRequest.foodName}"! Check Receiver Portal.`);
    fetchRequests();
    fetchDonations();
    fetchStats();
    checkHealth();
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await apiClient.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), {
        requestStatus: 'APPROVED'
      });
      showToast('✓ Request approved! Available portion inventory auto-deducted in database.');
      fetchRequests();
      fetchDonations();
      fetchStats();
      checkHealth();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await apiClient.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), {
        requestStatus: 'REJECTED'
      });
      showToast('Request rejected.');
      fetchRequests();
      fetchDonations();
      checkHealth();
    } catch (err) {
      alert(`Reject error: ${err.message}`);
    }
  };

  const handleCollectRequest = async (requestId) => {
    try {
      await apiClient.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), {
        requestStatus: 'COLLECTED'
      });
      showToast('📦 Hand-off marked as collected & distributed!');
      fetchRequests();
      fetchDonations();
      fetchStats();
      checkHealth();
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    }
  };

  const loadDatabasePreview = async () => {
    try {
      const [health, dons, reqs] = await Promise.all([
        apiClient.get(API_ENDPOINTS.HEALTH),
        apiClient.get(API_ENDPOINTS.DONATIONS.LIST),
        apiClient.get(API_ENDPOINTS.REQUESTS.LIST)
      ]);
      setDbDataPreview({
        databaseEngine: health.data?.services?.database,
        statusDetails: health.data?.databaseStatus,
        totalDonationsStored: dons.data?.length || 0,
        totalRequestsStored: reqs.data?.length || 0,
        sampleStoredDonations: dons.data?.slice(0, 3),
        sampleStoredRequests: reqs.data?.slice(0, 3)
      });
      setShowDbInspector(true);
    } catch (e) {
      alert('Failed to preview database: ' + e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#065f46',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          fontSize: '13px',
          fontWeight: 700,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isServerOnline={healthStatus?.ok}
      />

      {/* Subheader info bar */}
      <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '8px 0', fontSize: '12px', color: '#64748b' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            Active Persona: <strong style={{ color: '#0f172a' }}>{currentRole}</strong> &bull; UI Designer: <strong style={{ color: '#059669' }}>Tanisha (Member 1)</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>Database: <strong style={{ color: healthStatus?.ok ? '#059669' : '#dc2626' }}>{healthStatus?.data?.services?.database || 'Persistent Local Firestore'}</strong></span>
            <button
              onClick={loadDatabasePreview}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              🔍 Inspect Database
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, padding: '32px 20px' }}>
        {activePage === 'home' && (
          <HomePage
            donations={donations}
            stats={overviewStats}
            onNavigate={setActivePage}
            onRequestClick={(food) => setRequestModalFood(food)}
            onOpenDonationModal={() => setShowDonationModal(true)}
          />
        )}

        {activePage === 'donations' && (
          <DonationsPage
            donations={donations}
            loading={loading}
            onRefresh={() => { fetchDonations(); fetchStats(); }}
            onRequestClick={(food) => setRequestModalFood(food)}
            onOpenDonationModal={() => setShowDonationModal(true)}
          />
        )}

        {activePage === 'workflow' && (
          <div style={{ marginTop: '10px' }}>
            <DonationWorkflow />
          </div>
        )}

        {activePage === 'donor' && (
          <DonorDashboard
            donations={donations}
            requests={requests}
            onOpenDonationModal={() => setShowDonationModal(true)}
            onDeleteDonation={handleDeleteDonation}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onCollectRequest={handleCollectRequest}
          />
        )}

        {activePage === 'receiver' && (
          <ReceiverDashboard
            requests={requests}
            donations={donations}
            onRequestClick={(food) => setRequestModalFood(food)}
            onCollectRequest={handleCollectRequest}
          />
        )}

        {activePage === 'matching' && (
          <MatchingPage
            donations={donations}
            selectedFoodId={selectedMatchingFoodId}
            setSelectedFoodId={setSelectedMatchingFoodId}
            onRequestClick={(food) => setRequestModalFood(food)}
          />
        )}

        {activePage === 'impact' && (
          <ImpactPage
            impactMetrics={impactMetrics}
            categoryBreakdown={categoryBreakdown}
            leaderboard={leaderboard}
          />
        )}
      </main>

      {/* Request Food Modal */}
      {requestModalFood && (
        <RequestModal
          food={requestModalFood}
          onClose={() => setRequestModalFood(null)}
          onRequestSubmitted={handleRequestSubmitted}
        />
      )}

      {/* Create Food Donation Modal */}
      {showDonationModal && (
        <DonationModal
          onClose={() => setShowDonationModal(false)}
          onDonationCreated={handleDonationCreated}
        />
      )}

      {/* Persistent Database Inspector Modal */}
      {showDbInspector && (
        <div className="modal-overlay" onClick={() => setShowDbInspector(false)}>
          <div className="modal-dialog" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                🔍 Persistent Database State Inspector
              </h3>
              <button
                onClick={() => setShowDbInspector(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre style={{
                background: '#0f172a',
                color: '#38bdf8',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                maxHeight: '380px'
              }}>
                {JSON.stringify(dbDataPreview, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDbInspector(false)}
                className="btn btn-primary"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onNavigate={setActivePage} />
    </div>
  );
}
