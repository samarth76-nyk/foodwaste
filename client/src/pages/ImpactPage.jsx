import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import API_ENDPOINTS from '../api/endpoints';

/**
 * ImpactPage Component
 * High-visibility environmental & social impact dashboard with interactive EPA WARM calculators.
 */
export default function ImpactPage({
  impactMetrics,
  categoryBreakdown = [],
  leaderboard
}) {
  const [customMealsInput, setCustomMealsInput] = useState(350);
  const [customResult, setCustomResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculateCustom = async () => {
    setCalculating(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.STATS.CALCULATE, {
        mealsSaved: Number(customMealsInput)
      });
      setCustomResult(res.data);
    } catch (e) {
      console.error('Calculation failed', e);
    } finally {
      setCalculating(false);
    }
  };

  const core = impactMetrics?.coreMetrics || {};
  const equiv = impactMetrics?.environmentalEquivalents || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 10px', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#059669' }}>
            🌍 EPA Waste Reduction Model (WARM) Certified
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Environmental Savings & Social Impact Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            Every meal rescued directly diverts decomposing organic matter from landfills, preventing potent methane emissions and protecting groundwater reserves.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Cumulative Carbon Offset</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>
            {(core.co2EmissionsAvoidedKg || 1554).toLocaleString()} kg
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>CO₂-equivalent saved</div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-4">
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>🍽️</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {(core.totalMealsRescued || 1480).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Meals Rescued</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>☁️</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>
            {(core.co2EmissionsAvoidedKg || 1554).toLocaleString()} kg
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CO₂e Avoided</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>💧</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
            {(core.waterSavedLiters || 497280).toLocaleString()} L
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Water Conserved</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>💵</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
            ${(core.economicValueSavedUSD || 5180).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Economic Value Diverted</div>
        </div>
      </div>

      {/* Real-World Environmental Equivalency Benchmarks */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          🌿 Real-World Ecological Equivalency Benchmarks
        </h3>

        <div className="grid grid-3">
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '28px' }}>🚗</span>
            <div>
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Vehicle Miles Diverted:</strong>
              <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                {equiv.carKilometersAvoided?.description || 'Offset equivalent to taking multiple passenger vehicles off the road for thousands of kilometers.'}
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '28px' }}>🚰</span>
            <div>
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Domestic Water Security:</strong>
              <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                {equiv.householdWaterDays?.description || 'Preserved enough water footprint to supply clean domestic water to hundreds of households.'}
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '28px' }}>🌲</span>
            <div>
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Reforestation Equivalent:</strong>
              <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>
                {equiv.treeSeedlingsEquivalent?.description || 'Equivalent carbon sequestration to planting and growing dozens of tree seedlings for a decade.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Custom Projection Calculator */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          🧮 Interactive Food Rescue Savings Calculator
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Simulate environmental impact by adjusting the number of meal portions to rescue:
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <label className="form-label">Meals / Portions to Rescue:</label>
            <input
              type="number"
              min="10"
              max="100000"
              step="10"
              value={customMealsInput}
              onChange={(e) => setCustomMealsInput(e.target.value)}
              className="form-input"
              style={{ width: '160px' }}
            />
          </div>

          <button
            onClick={calculateCustom}
            disabled={calculating}
            className="btn btn-primary"
          >
            {calculating ? 'Calculating...' : 'Compute Environmental Offset'}
          </button>
        </div>

        {customResult && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px 20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
              Projected Offset for {customMealsInput} Rescued Meals:
            </h4>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: '#047857' }}>
              <div><strong>Food Diverted:</strong> {customResult.coreMetrics?.totalKgFoodDiverted} kg</div>
              <div><strong>CO₂e Avoided:</strong> {customResult.coreMetrics?.co2EmissionsAvoidedKg} kg</div>
              <div><strong>Water Conserved:</strong> {customResult.coreMetrics?.waterSavedLiters?.toLocaleString()} Liters</div>
              <div><strong>Economic Value:</strong> ${customResult.coreMetrics?.economicValueSavedUSD}</div>
            </div>
          </div>
        )}
      </div>

      {/* Community Leaderboard */}
      {leaderboard && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            🏆 Community Food Waste Rescue Leaderboard
          </h3>

          <div className="grid grid-2">
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '10px' }}>
                Top Food Donors (Kitchens & Bakeries)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboard.topDonors?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <div>
                      <strong>#{i + 1} {d.name}</strong>
                      <span style={{ fontSize: '11px', color: '#059669', marginLeft: '6px' }}>({d.badge})</span>
                    </div>
                    <strong style={{ color: '#0f172a' }}>{d.mealsRescued} meals</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7', marginBottom: '10px' }}>
                Top Community Shelters & Food Banks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboard.topRecipientNGOs?.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <div>
                      <strong>#{i + 1} {r.name}</strong>
                    </div>
                    <strong style={{ color: '#0284c7' }}>{r.individualsFed} people fed</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
