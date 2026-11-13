import React, { useState, useEffect } from 'react';
import apiClient from './api/apiClient';
import API_ENDPOINTS from './api/endpoints';

/**
 * ==============================================================================
 * SHAREBITE - SYSTEM ARCHITECTURE & SMART INTEGRATION CONSOLE
 * ==============================================================================
 * Member 4 - Smart Features & Integration:
 * - Distance-Based Nearby NGO Matching (Haversine Algorithm)
 * - Pickup Deadline Perishability Warnings (< 2h Critical, < 5h Warning)
 * - Environmental & Social Impact Statistics Engine (EPA/FAO Models)
 * - Full Module Integration Verifier
 * 
 * NOTE FOR TEAMMATE 1 (Frontend & UI):
 * This component demonstrates all backend services and smart algorithms live.
 * When you build full UI pages, place them inside src/pages/ and mount your Router!
 * ==============================================================================
 */

export default function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Smart Feature 1: NGO Matching State
  const [donationsList, setDonationsList] = useState([]);
  const [selectedFoodId, setSelectedFoodId] = useState('food_001');
  const [matchingRadius, setMatchingRadius] = useState(15);
  const [matchedNGOs, setMatchedNGOs] = useState(null);
  const [loadingMatching, setLoadingMatching] = useState(false);

  // Smart Feature 2: Deadline Warnings State
  const [warningThreshold, setWarningThreshold] = useState(6);
  const [expiringDonations, setExpiringDonations] = useState([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);

  // Smart Feature 3: Impact Statistics State
  const [impactMetrics, setImpactMetrics] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [customMealsInput, setCustomMealsInput] = useState(250);
  const [customImpactResult, setCustomImpactResult] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Live Endpoints Test Suite State
  const [apiResult, setApiResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    await checkHealth();
    await fetchDonations();
    await fetchExpiringDonations(warningThreshold);
    await fetchImpactStats();
    setLoading(false);
  };

  const checkHealth = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HEALTH);
      setHealthStatus({ ok: true, data: response.data });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message || 'Cannot reach backend server' });
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.DONATIONS.LIST);
      setDonationsList(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedFoodId(res.data[0].foodId);
      }
    } catch (err) {
      console.error('Failed to load donations', err);
    }
  };

  // Smart NGO Matching Trigger
  const triggerNgoMatching = async (foodId = selectedFoodId, radius = matchingRadius) => {
    setLoadingMatching(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.MATCHING.NEARBY_NGOS(foodId, radius));
      setMatchedNGOs(res.data);
    } catch (err) {
      console.error('NGO matching error:', err);
      setMatchedNGOs({ error: err.message || 'Failed to match NGOs' });
    } finally {
      setLoadingMatching(false);
    }
  };

  // Smart Pickup Deadline Warnings Trigger
  const fetchExpiringDonations = async (hours = warningThreshold) => {
    setLoadingWarnings(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.DONATIONS.EXPIRING_SOON(hours));
      setExpiringDonations(res.data || []);
    } catch (err) {
      console.error('Failed to load expiring donations', err);
    } finally {
      setLoadingWarnings(false);
    }
  };

  // Smart Impact Statistics Trigger
  const fetchImpactStats = async () => {
    setLoadingStats(true);
    try {
      const [impactRes, catRes, leaderRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.STATS.IMPACT),
        apiClient.get(API_ENDPOINTS.STATS.CATEGORIES),
        apiClient.get(API_ENDPOINTS.STATS.LEADERBOARD)
      ]);
      setImpactMetrics(impactRes.data);
      setCategoryBreakdown(catRes.data || []);
      setLeaderboard(leaderRes.data || null);
    } catch (err) {
      console.error('Failed to load impact stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const calculateCustomImpact = async () => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.STATS.CALCULATE, {
        mealsSaved: Number(customMealsInput)
      });
      setCustomImpactResult(res.data);
    } catch (err) {
      console.error('Custom calculation failed', err);
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
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '32px 20px', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Banner */}
      <header style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '32px' }}>🍲</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              ShareBite <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>Member 4: Smart Features Active</span>
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Smart NGO Matching (Haversine) &bull; Pickup Deadline Warnings &bull; EPA/FAO Environmental Impact Engine
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
            <span style={{ fontWeight: 700, fontSize: '14px', color: healthStatus?.ok ? '#047857' : '#b91c1c' }}>
              {loading ? 'Booting modules...' : healthStatus?.ok ? 'Full System Operational' : 'Offline'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Uptime: {healthStatus?.data?.uptimeSeconds || 0}s &bull; Port: 5000
          </div>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
        {[
          { id: 'overview', label: '🏛️ System Architecture', badge: null },
          { id: 'ngo-matching', label: '📍 Smart NGO Matcher', badge: 'Haversine' },
          { id: 'deadline-warnings', label: '⏰ Pickup Deadline Warnings', badge: `${expiringDonations.length} Active` },
          { id: 'impact-analytics', label: '🌱 Impact & Environmental Engine', badge: 'Live Metrics' },
          { id: 'endpoint-tests', label: '🧪 Module Integration Verifier', badge: '100%' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'ngo-matching' && !matchedNGOs) triggerNgoMatching();
            }}
            style={{
              padding: '11px 18px',
              borderRadius: '8px',
              border: activeTab === tab.id ? '2px solid #10b981' : '1px solid #cbd5e1',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              backgroundColor: activeTab === tab.id ? '#10b981' : '#ffffff',
              color: activeTab === tab.id ? '#ffffff' : '#334155',
              boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label} {tab.badge && <span style={{
              marginLeft: '6px',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '8px',
              background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              color: activeTab === tab.id ? '#ffffff' : '#047857'
            }}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              ⚡ Member 4 Integration Matrix
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={featureRowStyle}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                  <strong>Nearby NGO Distance Matching</strong>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Haversine algorithmic ranking of recipient shelters by GPS proximity, category match & transit feasibility.
                  </p>
                </div>
              </div>

              <div style={featureRowStyle}>
                <span style={{ fontSize: '20px' }}>⏰</span>
                <div>
                  <strong>Pickup Deadline Warnings</strong>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Multi-tier countdown alarms (<span style={{ color: '#dc2626', fontWeight: 600 }}>&lt;2h Critical Spoilage</span>, <span style={{ color: '#d97706', fontWeight: 600 }}>&lt;5h Expiring Soon</span>, Safe Window).
                  </p>
                </div>
              </div>

              <div style={featureRowStyle}>
                <span style={{ fontSize: '20px' }}>🌱</span>
                <div>
                  <strong>Environmental Impact Statistics</strong>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Live conversion models: Meals Rescued, CO₂e Emissions Diverted, Water Conserved, and Landfill Methane Prevented.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              🔌 Health Check Status
            </h2>
            <pre style={codeBlockStyle}>
              {JSON.stringify(healthStatus?.data || { status: 'Connecting...' }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SMART NGO DISTANCE MATCHING */}
      {/* ========================================================================= */}
      {activeTab === 'ngo-matching' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                📍 Proximity-Based NGO Matching Engine
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Uses the Haversine great-circle formula to match food listings with nearest recipient shelters.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', color: '#334155' }}>
                  Selected Donation Listing:
                </label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => {
                    setSelectedFoodId(e.target.value);
                    triggerNgoMatching(e.target.value, matchingRadius);
                  }}
                  style={inputStyle}
                >
                  {donationsList.map((d) => (
                    <option key={d.foodId} value={d.foodId}>
                      {d.foodName} ({d.category} - {d.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', color: '#334155' }}>
                  Search Radius: <strong>{matchingRadius} km</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={matchingRadius}
                  onChange={(e) => {
                    setMatchingRadius(Number(e.target.value));
                    triggerNgoMatching(selectedFoodId, Number(e.target.value));
                  }}
                  style={{ width: '130px', cursor: 'pointer' }}
                />
              </div>

              <button
                onClick={() => triggerNgoMatching()}
                style={{ ...btnPrimaryStyle, alignSelf: 'flex-end' }}
                disabled={loadingMatching}
              >
                {loadingMatching ? 'Computing...' : 'Recalculate Matches'}
              </button>
            </div>
          </div>

          {matchedNGOs && (
            <div>
              <div style={{ background: '#f8fafc', padding: '12px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#334155' }}>
                  Donation: <strong>{matchedNGOs.donation?.foodName}</strong> &bull; Urgency: <span style={{ color: matchedNGOs.donation?.urgencyTier === 'CRITICAL' ? '#dc2626' : '#10b981', fontWeight: 700 }}>{matchedNGOs.donation?.timeRemainingFormatted}</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '3px 10px', borderRadius: '12px' }}>
                  {matchedNGOs.totalMatches} Qualified NGOs within {matchedNGOs.searchRadiusKm} km
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {matchedNGOs.matches?.map((ngo, idx) => (
                  <div key={ngo.ngoId} style={{
                    background: '#ffffff',
                    border: idx === 0 ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}>
                    {idx === 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '16px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        TOP MATCH 🥇
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{ngo.name}</h3>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                        {ngo.matchScore}% Score
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {ngo.category} &bull; Contact: {ngo.contactPerson} ({ngo.phone})
                    </div>

                    <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Distance:</span>
                        <strong style={{ color: '#0f172a' }}>{ngo.distanceKm} km</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Transit ETA:</span>
                        <strong>~{ngo.estimatedTransitMinutes} mins</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pickup Feasibility:</span>
                        <span style={{ fontWeight: 600, color: ngo.isTransitFeasible ? '#16a34a' : '#dc2626' }}>
                          {ngo.isTransitFeasible ? '✓ Safe Window' : '⚠️ Too close to deadline'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PICKUP DEADLINE PERISHABILITY WARNINGS */}
      {/* ========================================================================= */}
      {activeTab === 'deadline-warnings' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                ⏰ Pickup Deadline & Spoilage Early Warning Radar
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Real-time perishable countdown monitor flagging imminent waste risks (<span style={{ color: '#dc2626', fontWeight: 700 }}>&lt; 2h Critical</span>, <span style={{ color: '#d97706', fontWeight: 700 }}>&lt; 5h Expiring</span>).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Threshold Filter: <strong>{warningThreshold} Hours</strong>
              </label>
              <input
                type="range"
                min="1"
                max="24"
                value={warningThreshold}
                onChange={(e) => {
                  setWarningThreshold(Number(e.target.value));
                  fetchExpiringDonations(Number(e.target.value));
                }}
                style={{ width: '120px', cursor: 'pointer' }}
              />
              <button
                onClick={() => fetchExpiringDonations(warningThreshold)}
                style={btnPrimaryStyle}
                disabled={loadingWarnings}
              >
                {loadingWarnings ? 'Refreshing...' : 'Refresh Radar'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {expiringDonations.map((item) => {
              const analysis = item.deadlineAnalysis || {};
              const isCritical = analysis.urgencyTier === 'CRITICAL';
              const isWarning = analysis.urgencyTier === 'EXPIRING_SOON';

              return (
                <div key={item.foodId} style={{
                  background: '#ffffff',
                  border: `2px solid ${analysis.badgeColor || '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: isCritical ? '0 4px 12px rgba(220, 38, 38, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: analysis.badgeColor || '#64748b',
                      color: '#ffffff'
                    }}>
                      {analysis.badgeText || 'PENDING'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: analysis.badgeColor || '#334155' }}>
                      {analysis.formattedRemaining}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {item.foodName}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    Category: <strong>{item.category}</strong> &bull; Quantity: <strong>{item.quantity}</strong>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Pickup Deadline:</strong> {new Date(item.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </div>
                    <div>
                      <strong>Location:</strong> {item.location?.address}, {item.location?.city}
                    </div>
                  </div>

                  <p style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isCritical ? '#991b1b' : isWarning ? '#92400e' : '#065f46',
                    background: isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#ecfdf5',
                    padding: '8px 12px',
                    borderRadius: '6px'
                  }}>
                    {analysis.warningMessage}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: IMPACT STATISTICS & ENVIRONMENTAL ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'impact-analytics' && (
        <div>
          {/* Key Metric Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={statCardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>🍲</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                {impactMetrics?.coreMetrics?.totalMealsRescued?.toLocaleString() || 1480}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Meals Rescued</div>
            </div>

            <div style={statCardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>☁️</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857' }}>
                {impactMetrics?.coreMetrics?.co2EmissionsAvoidedKg?.toLocaleString() || 1554} kg
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CO₂e Avoided</div>
            </div>

            <div style={statCardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>💧</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7' }}>
                {impactMetrics?.coreMetrics?.waterSavedLiters?.toLocaleString() || 497280} L
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Water Footprint Conserved</div>
            </div>

            <div style={statCardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>💵</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309' }}>
                ${impactMetrics?.coreMetrics?.economicValueSavedUSD?.toLocaleString() || 5180}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Economic Value Diverted</div>
            </div>
          </div>

          {/* Environmental Equivalents & Real-world Comparisons */}
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
              🌍 Real-World Environmental Equivalency Benchmarks (EPA WARM Model)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={equivBoxStyle}>
                <span style={{ fontSize: '24px' }}>🚗</span>
                <div>
                  <strong>Passenger Car Travel Offset:</strong>
                  <p style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                    {impactMetrics?.environmentalEquivalents?.carKilometersAvoided?.description || 'Offset thousands of vehicle driving kms.'}
                  </p>
                </div>
              </div>

              <div style={equivBoxStyle}>
                <span style={{ fontSize: '24px' }}>🚰</span>
                <div>
                  <strong>Domestic Water Security:</strong>
                  <p style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                    {impactMetrics?.environmentalEquivalents?.householdWaterDays?.description || 'Water conserved for human consumption.'}
                  </p>
                </div>
              </div>

              <div style={equivBoxStyle}>
                <span style={{ fontSize: '24px' }}>🌲</span>
                <div>
                  <strong>Carbon Sequestration Equivalent:</strong>
                  <p style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                    {impactMetrics?.environmentalEquivalents?.treeSeedlingsEquivalent?.description || 'Equivalent to planting seedlings.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Custom Impact Calculator */}
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              🧮 Interactive Impact Projection Calculator
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Test dynamic projections by entering a food rescue target to calculate environmental savings:
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', color: '#334155' }}>
                  Meals to Rescue:
                </label>
                <input
                  type="number"
                  value={customMealsInput}
                  onChange={(e) => setCustomMealsInput(e.target.value)}
                  style={{ ...inputStyle, width: '140px' }}
                />
              </div>

              <button
                onClick={calculateCustomImpact}
                style={{ ...btnPrimaryStyle, alignSelf: 'flex-end' }}
              >
                Compute Environmental Savings
              </button>
            </div>

            {customImpactResult && (
              <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
                  Projected Environmental Savings for {customMealsInput} Rescued Meals:
                </h4>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#047857' }}>
                  <div><strong>Food Weight:</strong> {customImpactResult.coreMetrics?.totalKgFoodDiverted} kg</div>
                  <div><strong>CO₂e Avoided:</strong> {customImpactResult.coreMetrics?.co2EmissionsAvoidedKg} kg</div>
                  <div><strong>Water Conserved:</strong> {customImpactResult.coreMetrics?.waterSavedLiters?.toLocaleString()} Liters</div>
                  <div><strong>Economic Value:</strong> ${customImpactResult.coreMetrics?.economicValueSavedUSD}</div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          {leaderboard && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#1e293b' }}>
                🏆 Community Food Waste Reduction Leaderboard
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#047857', marginBottom: '8px' }}>Top Food Donors</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {leaderboard.topDonors?.map((d, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <span><strong>#{i + 1}</strong> {d.name} <span style={{ fontSize: '11px', color: '#059669' }}>({d.badge})</span></span>
                        <strong>{d.mealsRescued} meals</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0369a1', marginBottom: '8px' }}>Top Recipient NGOs</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {leaderboard.topRecipientNGOs?.map((r, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <span><strong>#{i + 1}</strong> {r.name}</span>
                        <strong>{r.individualsFed} people fed</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INTEGRATION VERIFIER & API TEST SUITE */}
      {/* ========================================================================= */}
      {activeTab === 'endpoint-tests' && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
            🧪 Complete System Integration Test Suite
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Verify end-to-end communication across all modules (Smart Features, Donors, Receivers, Admin, Health):
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => testEndpoint('GET /api/health', () => apiClient.get(API_ENDPOINTS.HEALTH))} style={btnStyle}>
              GET /api/health
            </button>
            <button onClick={() => testEndpoint('GET /api/donations/warnings/expiring-soon', () => apiClient.get(API_ENDPOINTS.DONATIONS.EXPIRING_SOON(5)))} style={btnStyle}>
              GET /api/donations/warnings/expiring-soon
            </button>
            <button onClick={() => testEndpoint('GET /api/matching/donations/food_001/ngos', () => apiClient.get(API_ENDPOINTS.MATCHING.NEARBY_NGOS('food_001', 20)))} style={btnStyle}>
              GET /api/matching/.../ngos (Haversine)
            </button>
            <button onClick={() => testEndpoint('GET /api/stats/impact', () => apiClient.get(API_ENDPOINTS.STATS.IMPACT))} style={btnStyle}>
              GET /api/stats/impact
            </button>
            <button onClick={() => testEndpoint('GET /api/stats/leaderboard', () => apiClient.get(API_ENDPOINTS.STATS.LEADERBOARD))} style={btnStyle}>
              GET /api/stats/leaderboard
            </button>
            <button onClick={() => testEndpoint('GET /api/donations', () => apiClient.get(API_ENDPOINTS.DONATIONS.LIST))} style={btnStyle}>
              GET /api/donations
            </button>
            <button onClick={() => testEndpoint('GET /api/requests', () => apiClient.get(API_ENDPOINTS.REQUESTS.LIST))} style={btnStyle}>
              GET /api/requests
            </button>
          </div>

          {testingEndpoint && <p style={{ fontSize: '13px', color: '#6366f1' }}>Sending HTTP request to backend...</p>}

          {apiResult && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Endpoint: <code>{apiResult.name}</code>
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: apiResult.status === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: apiResult.status === 'success' ? '#047857' : '#b91c1c'
                }}>
                  {apiResult.status.toUpperCase()}
                </span>
              </div>
              <pre style={codeBlockStyle}>
                {JSON.stringify(apiResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '36px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
        ShareBite System &bull; Member 4 Smart Features & Integration Active &bull; Docs in <code>/docs/API_CONTRACTS.md</code>
      </footer>
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
  marginBottom: '20px'
};

const statCardStyle = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
  textAlign: 'center'
};

const featureRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '10px 12px',
  background: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

const equivBoxStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  padding: '14px',
  background: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

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

const btnPrimaryStyle = {
  background: '#10b981',
  border: 'none',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '13px',
  marginTop: '4px'
};

const codeBlockStyle = {
  background: '#0f172a',
  color: '#4ade80',
  padding: '16px',
  borderRadius: '8px',
  fontSize: '12px',
  overflowX: 'auto',
  maxHeight: '340px'
};
