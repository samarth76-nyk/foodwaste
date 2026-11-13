import React, { useState, useEffect } from 'react';
import apiClient from './api/apiClient';
import API_ENDPOINTS from './api/endpoints';
import { FOOD_CATEGORY, FOOD_STATUS, REQUEST_STATUS } from './contracts/models';

export default function App() {
  const [activeTab, setActiveTab] = useState('donations');
  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Donations state
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New Donation form state
  const [donationForm, setDonationForm] = useState({
    foodName: '',
    category: FOOD_CATEGORY.COOKED_MEALS,
    quantity: 20,
    address: '100 University Ave, Community Kitchen',
    city: 'Metro City',
    pickupHours: 6,
    allergens: 'None',
    storageInstructions: 'Keep in warm insulated container',
    donorId: 'usr_001',
    donorName: 'Downtown Community Kitchen'
  });
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [donationSuccessMsg, setDonationSuccessMsg] = useState('');

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // New Request form state
  const [requestForm, setRequestForm] = useState({
    foodId: '',
    requestedQuantity: 5,
    receiverId: 'usr_002',
    receiverName: 'Hope Community Shelter',
    notes: 'Meals for evening shelter distribution'
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Raw Database Inspector
  const [showDbInspector, setShowDbInspector] = useState(false);
  const [dbDataPreview, setDbDataPreview] = useState(null);

  // Endpoint verifier state
  const [apiResult, setApiResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  // Initial load
  useEffect(() => {
    checkHealth();
    fetchDonations();
    fetchRequests();
  }, []);

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.HEALTH);
      setHealthStatus({ ok: true, data: res.data || res });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message || 'Cannot reach backend server' });
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST, { params });
      setDonations(res.data || []);
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.REQUESTS.LIST);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    setSubmittingDonation(true);
    setDonationSuccessMsg('');

    try {
      const preparedTime = new Date().toISOString();
      const pickupDeadline = new Date(Date.now() + donationForm.pickupHours * 3600 * 1000).toISOString();
      const allergenList = donationForm.allergens.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        foodName: donationForm.foodName.trim(),
        quantity: Number(donationForm.quantity) || donationForm.quantity,
        category: donationForm.category,
        donorId: donationForm.donorId,
        donorName: donationForm.donorName,
        location: {
          address: donationForm.address.trim(),
          city: donationForm.city.trim()
        },
        preparedTime,
        pickupDeadline,
        status: FOOD_STATUS.AVAILABLE,
        allergens: allergenList.length > 0 ? allergenList : ['None'],
        storageInstructions: donationForm.storageInstructions
      };

      const res = await apiClient.post(API_ENDPOINTS.DONATIONS.CREATE, payload);
      setDonationSuccessMsg(`Success! Stored donation "${res.data.foodName}" with ID ${res.data.foodId} in database.`);
      setDonationForm((prev) => ({
        ...prev,
        foodName: '',
        quantity: 15
      }));
      await fetchDonations();
      await checkHealth();
    } catch (err) {
      alert(`Error saving donation: ${err.message || 'Validation failed'}`);
    } finally {
      setSubmittingDonation(false);
    }
  };

  const handleDeleteDonation = async (foodId) => {
    if (!window.confirm('Delete this food donation from the database?')) return;
    try {
      await apiClient.delete(API_ENDPOINTS.DONATIONS.DELETE(foodId));
      await fetchDonations();
      await checkHealth();
    } catch (err) {
      alert(`Error deleting donation: ${err.message}`);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.foodId) {
      alert('Please select an available food donation');
      return;
    }
    setSubmittingRequest(true);
    setRequestSuccessMsg('');

    try {
      const payload = {
        foodId: requestForm.foodId,
        receiverId: requestForm.receiverId,
        receiverName: requestForm.receiverName,
        requestedQuantity: Number(requestForm.requestedQuantity),
        notes: requestForm.notes
      };

      const res = await apiClient.post(API_ENDPOINTS.REQUESTS.CREATE, payload);
      setRequestSuccessMsg(`Success! Stored request for "${res.data.foodName}" in database.`);
      await fetchRequests();
      await fetchDonations();
      await checkHealth();
    } catch (err) {
      alert(`Error submitting request: ${err.message}`);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await apiClient.patch(API_ENDPOINTS.REQUESTS.UPDATE_STATUS(requestId), {
        requestStatus: newStatus
      });
      await fetchRequests();
      await fetchDonations();
      await checkHealth();
    } catch (err) {
      alert(`Error updating request status: ${err.message}`);
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '24px 28px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '30px' }}>🍲</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              ShareBite
            </h1>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #a7f3d0'
            }}>
              Member 2 – Backend & Database
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Food Donation & Receiver Request Storage & Retrieval Engine &bull; Built by Samarth
          </p>
        </div>

        {/* Database Status Widget */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          padding: '12px 18px',
          borderRadius: '10px',
          textAlign: 'right'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: healthStatus?.ok ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 700, fontSize: '13px', color: healthStatus?.ok ? '#047857' : '#b91c1c' }}>
              {loadingHealth ? 'Checking Database...' : healthStatus?.ok ? 'Database Connected & Persistent' : 'Database Offline'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
            {healthStatus?.data?.services?.database || 'Local Firestore Persistent Storage'}
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { checkHealth(); fetchDonations(); fetchRequests(); }}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={loadDatabasePreview}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔍 Inspect Database
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'donations', label: '🥘 Food Donations (Store & List)', count: donations.length },
          { id: 'requests', label: '📦 Receiver Requests (Store & Manage)', count: requests.length },
          { id: 'diagnostic', label: '🔌 System Health & Endpoints' }
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeTab === tab.id ? '#059669' : '#ffffff',
              color: activeTab === tab.id ? '#ffffff' : '#475569',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(5,150,105,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{
                background: activeTab === tab.id ? '#047857' : '#e2e8f0',
                color: activeTab === tab.id ? '#ffffff' : '#334155',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* TAB 1: FOOD DONATIONS */}
      {activeTab === 'donations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', alignItems: 'start' }}>
          {/* Create Food Donation Form */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>➕</span>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Store Food Donation Details
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Writes directly to the persistent Firestore database
                </p>
              </div>
            </div>

            {donationSuccessMsg && (
              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px'
              }}>
                {donationSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateDonation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Food Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooked Rice, Mixed Dal & Veggies"
                  value={donationForm.foodName}
                  onChange={(e) => setDonationForm({ ...donationForm, foodName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    value={donationForm.category}
                    onChange={(e) => setDonationForm({ ...donationForm, category: e.target.value })}
                    style={inputStyle}
                  >
                    {Object.values(FOOD_CATEGORY).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity (Portions) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={donationForm.quantity}
                    onChange={(e) => setDonationForm({ ...donationForm, quantity: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    type="text"
                    required
                    value={donationForm.city}
                    onChange={(e) => setDonationForm({ ...donationForm, city: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pickup Deadline (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    required
                    value={donationForm.pickupHours}
                    onChange={(e) => setDonationForm({ ...donationForm, pickupHours: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Pickup Address *</label>
                <input
                  type="text"
                  required
                  value={donationForm.address}
                  onChange={(e) => setDonationForm({ ...donationForm, address: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Allergens (comma separated)</label>
                <input
                  type="text"
                  placeholder="None or Dairy, Gluten"
                  value={donationForm.allergens}
                  onChange={(e) => setDonationForm({ ...donationForm, allergens: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Donor Organization / Name</label>
                <input
                  type="text"
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={submittingDonation}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '6px'
                }}
              >
                {submittingDonation ? 'Saving to Database...' : '💾 Save Food Donation to Database'}
              </button>
            </form>
          </div>

          {/* Retrieved Food Donations List */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Live Food Donations in Database
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {donations.length} records retrieved from Firestore
                </span>
              </div>

              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); }}
                  style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                >
                  <option value="">All Categories</option>
                  {Object.values(FOOD_CATEGORY).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={fetchDonations}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Apply Filter
                </button>
              </div>
            </div>

            {loadingDonations ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>Loading donations from database...</p>
            ) : donations.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                No food donations found. Create one using the form on the left!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {donations.map((food) => (
                  <div
                    key={food.foodId}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          marginBottom: '4px'
                        }}>
                          {food.category}
                        </span>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                          {food.foodName}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                          Donor: <strong>{food.donorName || food.donorId}</strong> &bull; Location: {food.location?.address}, {food.location?.city}
                        </p>
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '12px',
                        backgroundColor: food.status === 'AVAILABLE' ? '#dcfce7' : food.status === 'CLAIMED' ? '#fef3c7' : '#fee2e2',
                        color: food.status === 'AVAILABLE' ? '#166534' : food.status === 'CLAIMED' ? '#92400e' : '#991b1b'
                      }}>
                        {food.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                      <div>
                        <strong>Available:</strong> {food.quantity} portions &bull; <strong>Allergens:</strong> {Array.isArray(food.allergens) ? food.allergens.join(', ') : food.allergens}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {food.status === 'AVAILABLE' && (
                          <button
                            onClick={() => {
                              setRequestForm((prev) => ({ ...prev, foodId: food.foodId }));
                              setActiveTab('requests');
                            }}
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Request Food
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDonation(food.foodId)}
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECEIVER REQUESTS */}
      {activeTab === 'requests' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', alignItems: 'start' }}>
          {/* Create Receiver Request Form */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>📥</span>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Store Receiver Request Details
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Links receiver claim with food inventory in database
                </p>
              </div>
            </div>

            {requestSuccessMsg && (
              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px'
              }}>
                {requestSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Select Available Food Listing *</label>
                <select
                  required
                  value={requestForm.foodId}
                  onChange={(e) => setRequestForm({ ...requestForm, foodId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">-- Choose Food Donation --</option>
                  {donations
                    .filter((d) => d.status === 'AVAILABLE')
                    .map((d) => (
                      <option key={d.foodId} value={d.foodId}>
                        {d.foodName} ({d.quantity} portions available) - {d.location?.city}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Requested Portions *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestForm.requestedQuantity}
                    onChange={(e) => setRequestForm({ ...requestForm, requestedQuantity: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Receiver ID</label>
                  <input
                    type="text"
                    value={requestForm.receiverId}
                    onChange={(e) => setRequestForm({ ...requestForm, receiverId: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Receiver / Organization Name</label>
                <input
                  type="text"
                  value={requestForm.receiverName}
                  onChange={(e) => setRequestForm({ ...requestForm, receiverName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Pickup / Transport Notes</label>
                <textarea
                  rows="3"
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  placeholder="e.g. Will arrive with insulated vehicle at 5 PM"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingRequest}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '6px'
                }}
              >
                {submittingRequest ? 'Submitting to Database...' : '📥 Submit Receiver Request to Database'}
              </button>
            </form>
          </div>

          {/* Retrieved Requests List */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Live Receiver Requests in Database
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {requests.length} request records retrieved
                </span>
              </div>
              <button
                onClick={fetchRequests}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            </div>

            {loadingRequests ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>Loading requests from database...</p>
            ) : requests.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                No requests submitted yet. Use the form on the left to request food!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {requests.map((req) => (
                  <div
                    key={req.requestId}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                          Request ID: <code>{req.requestId}</code>
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                          {req.foodName || 'Food Item #' + req.foodId}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                          Receiver: <strong>{req.receiverName || req.receiverId}</strong> &bull; Requested: <strong>{req.requestedQuantity} portions</strong>
                        </p>
                        {req.notes && (
                          <p style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', margin: '4px 0 0' }}>
                            "{req.notes}"
                          </p>
                        )}
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '12px',
                        backgroundColor:
                          req.requestStatus === 'APPROVED' ? '#dcfce7' :
                          req.requestStatus === 'PENDING' ? '#fef3c7' :
                          req.requestStatus === 'COLLECTED' ? '#e0e7ff' : '#fee2e2',
                        color:
                          req.requestStatus === 'APPROVED' ? '#166534' :
                          req.requestStatus === 'PENDING' ? '#92400e' :
                          req.requestStatus === 'COLLECTED' ? '#3730a3' : '#991b1b'
                      }}>
                        {req.requestStatus}
                      </span>
                    </div>

                    {/* Action buttons to update status */}
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
                      {req.requestStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.requestId, 'APPROVED')}
                            style={{
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Approve (Auto-deducts Food Inventory)
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.requestId, 'REJECTED')}
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      {req.requestStatus === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateRequestStatus(req.requestId, 'COLLECTED')}
                          style={{
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          📦 Mark as Collected
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM HEALTH & INTEGRATION DIAGNOSTICS */}
      {activeTab === 'diagnostic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              🔌 Health Check & Database Status
            </h2>
            <pre style={codeBlockStyle}>
              {JSON.stringify(healthStatus?.data || { status: 'Connecting...' }, null, 2)}
            </pre>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              🧪 Live API Route Verifier
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <button onClick={() => testEndpoint('GET /api/health', () => apiClient.get(API_ENDPOINTS.HEALTH))} style={btnStyle}>
                GET /api/health
              </button>
              <button onClick={() => testEndpoint('GET /api/donations', () => apiClient.get(API_ENDPOINTS.DONATIONS.LIST))} style={btnStyle}>
                GET /api/donations
              </button>
              <button onClick={() => testEndpoint('GET /api/requests', () => apiClient.get(API_ENDPOINTS.REQUESTS.LIST))} style={btnStyle}>
                GET /api/requests
              </button>
              <button onClick={() => testEndpoint('GET /api/stats/overview', () => apiClient.get(API_ENDPOINTS.STATS.OVERVIEW))} style={btnStyle}>
                GET /api/stats/overview
              </button>
            </div>

            {testingEndpoint && <p style={{ fontSize: '12px', color: '#0284c7' }}>Sending API call...</p>}

            {apiResult && (
              <pre style={{ ...codeBlockStyle, color: apiResult.status === 'success' ? '#4ade80' : '#f87171' }}>
                {JSON.stringify(apiResult.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Raw Database Inspector Modal */}
      {showDbInspector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                🔍 Persistent Database State Inspector (Member 2 Deliverable)
              </h3>
              <button
                onClick={() => setShowDbInspector(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <pre style={codeBlockStyle}>
                {JSON.stringify(dbDataPreview, null, 2)}
              </pre>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setShowDbInspector(false)}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
        ShareBite Food Waste Management &bull; Member 2 Deliverable: Working Data Storage & Retrieval &bull; Connected to Express + Firestore Architecture
      </footer>
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  padding: '22px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '4px'
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '13px',
  boxSizing: 'border-box'
};

const btnStyle = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  color: '#334155'
};

const codeBlockStyle = {
  background: '#0f172a',
  color: '#38bdf8',
  padding: '14px',
  borderRadius: '8px',
  fontSize: '11px',
  overflowX: 'auto',
  maxHeight: '350px'
};
