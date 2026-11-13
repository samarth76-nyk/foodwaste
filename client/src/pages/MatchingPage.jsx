import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import API_ENDPOINTS from '../api/endpoints';

/**
 * MatchingPage Component
 * Designed by Tanisha (Member 1 - Frontend & UI) with Member 4 Haversine matching
 * Real-time geospatial matching connecting donors with nearest recipient NGOs.
 */
export default function MatchingPage({
  donations = [],
  selectedFoodId,
  setSelectedFoodId,
  onRequestClick
}) {
  const [radius, setRadius] = useState(15);
  const [matchedData, setMatchedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeDonations = donations.filter((d) => d.status === 'AVAILABLE');

  const handleMatch = async (foodId = selectedFoodId, r = radius) => {
    if (!foodId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.MATCHING.NEARBY_NGOS(foodId, r));
      setMatchedData(res.data);
    } catch (err) {
      console.error('Proximity matching error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '24px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '26px' }}>📍</span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Geospatial NGO Proximity Matching (Haversine Geodesics)
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Matches donor kitchen coordinates with nearby registered community food banks, computing spherical distance in kilometers and estimated transit times.
        </p>
      </div>

      {/* Control Card */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
          Select Food Listing to Find Nearest Shelters
        </h3>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label">Active Food Donation:</label>
            <select
              value={selectedFoodId}
              onChange={(e) => setSelectedFoodId(e.target.value)}
              className="form-input"
            >
              {activeDonations.map((d) => (
                <option key={d.foodId} value={d.foodId}>
                  {d.foodName} ({d.quantity} portions) - {d.location?.city}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <label className="form-label">
              Search Radius: <strong>{radius} km</strong>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={() => handleMatch(selectedFoodId, radius)}
            disabled={loading || activeDonations.length === 0}
            className="btn btn-primary btn-lg"
          >
            {loading ? 'Calculating Geodesics...' : '⚡ Find Nearest Shelters'}
          </button>
        </div>
      </div>

      {/* Results */}
      {matchedData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Matched Shelters for "{matchedData.foodListing?.foodName}"
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Origin: {matchedData.foodListing?.location?.address}, {matchedData.foodListing?.location?.city}
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
              {matchedData.totalMatchesFound} Nearby Shelters Found
            </span>
          </div>

          <div className="grid grid-3">
            {matchedData.matches?.map((ngo, idx) => (
              <div
                key={ngo.ngoId}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                    Rank #{idx + 1} &bull; Score: {ngo.matchScore} pts
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>
                    {ngo.distanceKm} km
                  </span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {ngo.name}
                </h4>

                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  📍 {ngo.address}
                </p>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '11px', color: '#334155' }}>
                  <div><strong>Estimated Transit ETA:</strong> ~{ngo.estimatedTransitMinutes} mins</div>
                  <div><strong>Capacity:</strong> {ngo.capacityPortions} meal portions</div>
                  <div><strong>Phone:</strong> {ngo.phone}</div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    onClick={() => {
                      const targetFood = donations.find((d) => d.foodId === selectedFoodId);
                      if (targetFood && onRequestClick) {
                        onRequestClick(targetFood);
                      }
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    Direct Claim for this NGO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
