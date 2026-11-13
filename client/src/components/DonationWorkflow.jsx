import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import API_ENDPOINTS from '../api/endpoints';
import { FOOD_CATEGORY, FOOD_STATUS, REQUEST_STATUS } from '../contracts/models';

/**
 * ==============================================================================
 * SHAREBITE - COMPLETE DONATION WORKFLOW COMPONENT
 * ==============================================================================
 * Core Functionality:
 * 1. Food Upload (Listing creation with validation)
 * 2. Request Food (Portion checks & status transitions)
 * 3. Accept / Reject Functionality (Donor approvals/rejections with portion deduction)
 * 4. Update Food Status (Available / Requested / Collected)
 * ==============================================================================
 */

export default function DonationWorkflow() {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePersona, setActivePersona] = useState('DONOR'); // 'DONOR' or 'RECEIVER'
  const [notification, setNotification] = useState(null);

  // Upload Form State
  const defaultPrep = new Date().toISOString().slice(0, 16);
  const defaultDeadline = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16);

  const [uploadForm, setUploadForm] = useState({
    foodName: '',
    quantity: '20 portions',
    category: FOOD_CATEGORY.COOKED_MEALS,
    donorId: 'usr_donor_kitchen',
    donorName: 'Community Kitchen & Cafe',
    address: '12 Brigade Road',
    city: 'Bangalore',
    preparedTime: defaultPrep,
    pickupDeadline: defaultDeadline,
    allergens: ['None'],
    storageInstructions: 'Keep warm above 60°C or refrigerate under 4°C'
  });

  // Request Form Modal / Inline State
  const [requestTargetFood, setRequestTargetFood] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState(5);
  const [requestNotes, setRequestNotes] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsRes, requestsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.DONATIONS.LIST),
        apiClient.get(API_ENDPOINTS.REQUESTS.LIST)
      ]);
      setDonations(donationsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      showNotification(err.message || 'Error fetching workflow data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1. UPLOAD FOOD HANDLER
  const handleFoodUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.foodName.trim()) {
      showNotification('Food name is required', 'error');
      return;
    }

    const prepIso = new Date(uploadForm.preparedTime).toISOString();
    const deadIso = new Date(uploadForm.pickupDeadline).toISOString();

    if (new Date(deadIso) <= new Date(prepIso)) {
      showNotification('Pickup deadline must be after prepared time', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        foodName: uploadForm.foodName.trim(),
        quantity: uploadForm.quantity,
        category: uploadForm.category,
        donorId: uploadForm.donorId,
        donorName: uploadForm.donorName,
        location: {
          address: uploadForm.address,
          city: uploadForm.city
        },
        preparedTime: prepIso,
        pickupDeadline: deadIso,
        status: FOOD_STATUS.AVAILABLE,
        allergens: uploadForm.allergens,
        storageInstructions: uploadForm.storageInstructions
      };

      const res = await apiClient.post(API_ENDPOINTS.DONATIONS.CREATE, payload);
      showNotification(`🎉 Food listing "${res.data.foodName}" uploaded successfully! Status: AVAILABLE`);
      setUploadForm({
        ...uploadForm,
        foodName: '',
        quantity: '20 portions'
      });
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to upload food listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. REQUEST FOOD HANDLER
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestTargetFood) return;

    setSubmitting(true);
    try {
      const payload = {
        foodId: requestTargetFood.foodId,
        receiverId: 'usr_shelter_hope',
        receiverName: 'Hope Haven Community Shelter',
        requestedQuantity: Number(requestQuantity),
        notes: requestNotes || 'Standard temperature-controlled pickup.'
      };

      const res = await apiClient.post(API_ENDPOINTS.REQUESTS.CREATE, payload);
      showNotification(`✅ Food request submitted for "${requestTargetFood.foodName}"! Status updated to REQUESTED`);
      setRequestTargetFood(null);
      setRequestNotes('');
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. ACCEPT / REJECT HANDLERS
  const handleAcceptRequest = async (requestId, foodName) => {
    setSubmitting(true);
    try {
      await apiClient.post(`/requests/${requestId}/accept`, {});
      showNotification(`✅ Request for "${foodName}" approved! Portions deducted and status updated.`);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to approve request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async (requestId, foodName) => {
    const reason = window.prompt(`Reason for rejecting request for "${foodName}":`, 'Unavailable at requested time');
    if (reason === null) return; // user cancelled

    setSubmitting(true);
    try {
      await apiClient.post(`/requests/${requestId}/reject`, { rejectionReason: reason });
      showNotification(`❌ Request for "${foodName}" rejected.`);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to reject request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. UPDATE STATUS TO COLLECTED / CUSTOM STATUS
  const handleMarkCollected = async (requestId, foodId, foodName) => {
    setSubmitting(true);
    try {
      await apiClient.patch(`/requests/${requestId}/status`, { requestStatus: 'COLLECTED' });
      showNotification(`🌟 Food "${foodName}" marked as COLLECTED! Workflow complete.`);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to mark collected', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFoodStatus = async (foodId, newStatus) => {
    try {
      await apiClient.patch(`/donations/${foodId}/status`, { status: newStatus });
      showNotification(`Food status changed to ${newStatus}`);
      await fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Failed to update food status', 'error');
    }
  };

  // Filtered listings
  const filteredDonations = donations.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return (d.status || '').toUpperCase() === statusFilter.toUpperCase();
  });

  // Calculate live summary stats
  const totalPortionsAvailable = donations
    .filter((d) => d.status === 'AVAILABLE' || d.status === 'REQUESTED')
    .reduce((sum, d) => sum + (Number(d.availableQuantity) || 0), 0);
  const pendingRequestsCount = requests.filter((r) => r.requestStatus === 'PENDING').length;
  const approvedRequestsCount = requests.filter((r) => r.requestStatus === 'APPROVED').length;
  const collectedRequestsCount = requests.filter((r) => r.requestStatus === 'COLLECTED').length;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Banner / Header */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🍲</span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                Complete Donation Workflow
              </h2>
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Lifecycle Pipeline
              </span>
            </div>
            <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '14px' }}>
              Upload Food &bull; Request Food &bull; Accept / Reject Requests &bull; Status Pipeline (Available &rarr; Requested &rarr; Collected)
            </p>
          </div>

          {/* Persona Switcher */}
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Active Role:</span>
            <button
              onClick={() => setActivePersona('DONOR')}
              style={{
                ...personaBtnStyle,
                background: activePersona === 'DONOR' ? '#ffffff' : 'transparent',
                color: activePersona === 'DONOR' ? '#047857' : '#ffffff'
              }}
            >
              👨‍🍳 Food Donor
            </button>
            <button
              onClick={() => setActivePersona('RECEIVER')}
              style={{
                ...personaBtnStyle,
                background: activePersona === 'RECEIVER' ? '#ffffff' : 'transparent',
                color: activePersona === 'RECEIVER' ? '#047857' : '#ffffff'
              }}
            >
              🏢 Food Receiver / Shelter
            </button>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          background: 'rgba(0,0,0,0.12)',
          padding: '12px 16px',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>Total Listings</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{donations.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>Available Portions</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalPortionsAvailable}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>Pending Requests</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{pendingRequestsCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>Approved (To Collect)</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{approvedRequestsCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>Collected & Completed</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{collectedRequestsCount}</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 600,
          backgroundColor: notification.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: notification.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#6ee7b7'}`
        }}>
          {notification.message}
        </div>
      )}

      {/* Grid Layout: Left Column = Action Forms, Right Column = Live Data & Workflow Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* LEFT COLUMN */}
        <div>
          {/* 1. FOOD UPLOAD FORM (DONOR) */}
          {activePersona === 'DONOR' ? (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>📤</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  1. Upload Food Donation (Donor)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Post surplus food available for rescue with category, quantity, and pickup deadline.
              </p>

              <form onSubmit={handleFoodUpload}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Food Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Vegetable Biryani, 30 Bread Loaves"
                    value={uploadForm.foodName}
                    onChange={(e) => setUploadForm({ ...uploadForm, foodName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      style={inputStyle}
                    >
                      {Object.values(FOOD_CATEGORY).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Quantity / Portions *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25 portions or 10 kg"
                      value={uploadForm.quantity}
                      onChange={(e) => setUploadForm({ ...uploadForm, quantity: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Pickup Address</label>
                    <input
                      type="text"
                      value={uploadForm.address}
                      onChange={(e) => setUploadForm({ ...uploadForm, address: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      value={uploadForm.city}
                      onChange={(e) => setUploadForm({ ...uploadForm, city: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Prepared Time</label>
                    <input
                      type="datetime-local"
                      value={uploadForm.preparedTime}
                      onChange={(e) => setUploadForm({ ...uploadForm, preparedTime: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Pickup Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={uploadForm.pickupDeadline}
                      onChange={(e) => setUploadForm({ ...uploadForm, pickupDeadline: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...primaryBtnStyle,
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                >
                  {submitting ? 'Uploading Food Listing...' : '🚀 Post Food Donation Listing'}
                </button>
              </form>
            </div>
          ) : (
            /* RECEIVER ROLE INFO BOX */
            <div style={{ ...cardStyle, background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🏢</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                  Receiver / Shelter Mode Active
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                You are currently viewing as a <strong>Food Recipient (Hope Haven Shelter)</strong>. 
                Browse active donations in the list on the right and click <strong>"Request Food"</strong> to claim available portions.
              </p>
              <button
                onClick={() => setActivePersona('DONOR')}
                style={{ ...secondaryBtnStyle, marginTop: '8px' }}
              >
                Switch to Donor Mode to upload food
              </button>
            </div>
          )}

          {/* 3. ACCEPT / REJECT INCOMING REQUESTS (DONOR VIEW) */}
          <div style={{ ...cardStyle, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚖️</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  3. Accept / Reject Food Requests
                </h3>
              </div>
              <button onClick={fetchData} style={secondaryBtnStyle}>🔄 Refresh</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Review incoming requests from shelters and community pantries. Accept to reserve portions, or reject with a reason.
            </p>

            {requests.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                No food requests yet. Submit a request from the listings on the right!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                {requests.map((r) => (
                  <div
                    key={r.requestId}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{r.foodName}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Requester: <strong>{r.receiverName || r.receiverId}</strong>
                        </div>
                      </div>
                      {renderRequestBadge(r.requestStatus)}
                    </div>

                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                      Requested: <strong>{r.requestedQuantity} portions</strong>
                      {r.notes && <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>"{r.notes}"</div>}
                      {r.rejectionReason && (
                        <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>
                          Reason: {r.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Action buttons depending on state */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {r.requestStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(r.requestId, r.foodName)}
                            disabled={submitting}
                            style={{
                              ...primaryBtnStyle,
                              backgroundColor: '#059669',
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            ✅ Accept Request
                          </button>
                          <button
                            onClick={() => handleRejectRequest(r.requestId, r.foodName)}
                            disabled={submitting}
                            style={{
                              ...primaryBtnStyle,
                              backgroundColor: '#dc2626',
                              padding: '6px 12px',
                              fontSize: '12px'
                            }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {r.requestStatus === 'APPROVED' && (
                        <button
                          onClick={() => handleMarkCollected(r.requestId, r.foodId, r.foodName)}
                          disabled={submitting}
                          style={{
                            ...primaryBtnStyle,
                            backgroundColor: '#2563eb',
                            padding: '6px 14px',
                            fontSize: '12px'
                          }}
                        >
                          📦 Handover & Mark as Collected
                        </button>
                      )}

                      {r.requestStatus === 'COLLECTED' && (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                          🎉 Successfully Collected on {new Date(r.collectedAt || r.updatedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FOOD LISTINGS & STATUS WORKFLOW TRACKER */}
        <div>
          <div style={cardStyle}>
            {/* Header & Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📋</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  2. Food Listings & Status Progression
                </h3>
              </div>
              <button onClick={fetchData} style={secondaryBtnStyle}>🔄 Refresh</button>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['ALL', 'AVAILABLE', 'REQUESTED', 'COLLECTED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: statusFilter === filter ? '#0f172a' : '#ffffff',
                    color: statusFilter === filter ? '#ffffff' : '#475569'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Request Submission Modal / Form */}
            {requestTargetFood && (
              <div style={{
                background: '#eff6ff',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#1e3a8a' }}>
                    Requesting Food: <strong>{requestTargetFood.foodName}</strong>
                  </h4>
                  <button
                    onClick={() => setRequestTargetFood(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}
                  >
                    ✕
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#1e40af', marginBottom: '12px' }}>
                  Available Portions: <strong>{requestTargetFood.availableQuantity}</strong>
                </p>

                <form onSubmit={handleRequestSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={labelStyle}>Requested Portions *</label>
                    <input
                      type="number"
                      min="1"
                      max={requestTargetFood.availableQuantity || 999}
                      value={requestQuantity}
                      onChange={(e) => setRequestQuantity(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Pickup / Transport Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Arriving by 3 PM with insulated van"
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ ...primaryBtnStyle, backgroundColor: '#2563eb', padding: '8px 16px' }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Food Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestTargetFood(null)}
                      style={secondaryBtnStyle}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '24px' }}>Loading food listings...</p>
            ) : filteredDonations.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
                No food donations found for status '{statusFilter}'. Upload a new listing above!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '580px', overflowY: 'auto' }}>
                {filteredDonations.map((d) => (
                  <div
                    key={d.foodId}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>{d.foodName}</h4>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Category: <strong>{d.category}</strong> &bull; {d.location?.city || 'City'}
                        </div>
                      </div>
                      {renderFoodStatusBadge(d.status)}
                    </div>

                    {/* Status Stepper Progression Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      margin: '10px 0',
                      background: '#f1f5f9',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      <span style={{ color: '#059669' }}>● Available</span>
                      <span style={{ color: '#94a3b8' }}>&rarr;</span>
                      <span style={{ color: d.status === 'REQUESTED' || d.status === 'COLLECTED' || d.status === 'CLAIMED' ? '#d97706' : '#94a3b8' }}>
                        ● Requested
                      </span>
                      <span style={{ color: '#94a3b8' }}>&rarr;</span>
                      <span style={{ color: d.status === 'COLLECTED' ? '#2563eb' : '#94a3b8' }}>
                        ● Collected
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
                      <span>Portions Remaining: <strong>{d.availableQuantity !== undefined ? d.availableQuantity : d.quantity}</strong></span>
                      <span>Deadline: <strong>{new Date(d.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>

                    {/* Listing Action Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      {/* Request Button */}
                      {(d.status === 'AVAILABLE' || d.status === 'REQUESTED') && (d.availableQuantity > 0 || d.availableQuantity === undefined) ? (
                        <button
                          onClick={() => {
                            setRequestTargetFood(d);
                            setRequestQuantity(Math.min(5, d.availableQuantity || 5));
                          }}
                          style={{
                            ...primaryBtnStyle,
                            backgroundColor: '#2563eb',
                            padding: '6px 12px',
                            fontSize: '12px'
                          }}
                        >
                          🙋 Request Food
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                          {d.status === 'COLLECTED' ? 'Fully Collected' : 'Not Available'}
                        </span>
                      )}

                      {/* Manual Status Transition Dropdown (Update status feature) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Change Status:</span>
                        <select
                          value={d.status}
                          onChange={(e) => handleUpdateFoodStatus(d.foodId, e.target.value)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff'
                          }}
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="REQUESTED">REQUESTED</option>
                          <option value="COLLECTED">COLLECTED</option>
                          <option value="CLAIMED">CLAIMED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Helpers for badges
function renderFoodStatusBadge(status) {
  const s = (status || '').toUpperCase();
  let bg = '#ecfdf5';
  let color = '#047857';
  let border = '#a7f3d0';

  if (s === 'REQUESTED') {
    bg = '#fffbeb';
    color = '#b45309';
    border = '#fde68a';
  } else if (s === 'COLLECTED') {
    bg = '#eff6ff';
    color = '#1d4ed8';
    border = '#bfdbfe';
  } else if (s === 'CLAIMED') {
    bg = '#f5f3ff';
    color = '#6d28d9';
    border = '#ddd6fe';
  } else if (s === 'CANCELLED' || s === 'EXPIRED') {
    bg = '#fef2f2';
    color = '#b91c1c';
    border = '#fecaca';
  }

  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: '12px',
      backgroundColor: bg,
      color,
      border: `1px solid ${border}`
    }}>
      {s}
    </span>
  );
}

function renderRequestBadge(status) {
  const s = (status || '').toUpperCase();
  let bg = '#fffbeb';
  let color = '#b45309';
  let border = '#fde68a';

  if (s === 'APPROVED') {
    bg = '#ecfdf5';
    color = '#047857';
    border = '#a7f3d0';
  } else if (s === 'REJECTED') {
    bg = '#fef2f2';
    color = '#b91c1c';
    border = '#fecaca';
  } else if (s === 'COLLECTED') {
    bg = '#eff6ff';
    color = '#1d4ed8';
    border = '#bfdbfe';
  }

  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: '12px',
      backgroundColor: bg,
      color,
      border: `1px solid ${border}`
    }}>
      {s}
    </span>
  );
}

// Common styles
const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '22px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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

const primaryBtnStyle = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 14px',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer'
};

const secondaryBtnStyle = {
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  color: '#334155'
};

const personaBtnStyle = {
  border: 'none',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
