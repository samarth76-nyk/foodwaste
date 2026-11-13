import React from 'react';
import StatusBadge from '../components/StatusBadge';
import FoodCard from '../components/FoodCard';

/**
 * ReceiverDashboard Component
 * Designed by Tanisha (Member 1 - Frontend & UI)
 * Dedicated portal for community shelters, NGOs, and food banks to track submitted claims,
 * confirm collections, and rapidly request available surplus food.
 */
export default function ReceiverDashboard({
  requests = [],
  donations = [],
  onRequestClick,
  onCollectRequest
}) {
  // Compute receiver statistics
  const totalClaims = requests.length;
  const pendingCount = requests.filter((r) => r.requestStatus === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.requestStatus === 'APPROVED').length;
  const collectedCount = requests.filter((r) => r.requestStatus === 'COLLECTED').length;

  const totalMealsClaimed = requests
    .filter((r) => r.requestStatus === 'APPROVED' || r.requestStatus === 'COLLECTED')
    .reduce((sum, r) => sum + (Number(r.requestedQuantity) || 0), 0);

  const availableDonations = donations.filter((d) => d.status === 'AVAILABLE').slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        border: '1px solid #bae6fd',
        borderRadius: '14px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>🏢</span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Shelter & Receiver Portal
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Track food claims, coordinate volunteer pickups, and feed local communities
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #bae6fd',
          borderRadius: '10px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>🍲</span>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Total Rescued Meals</div>
            <strong style={{ fontSize: '16px', color: '#0284c7' }}>{totalMealsClaimed} portions</strong>
          </div>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-4">
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Total Claims Placed
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {totalClaims}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Submitted to donors
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Pending Approval
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>
            Waiting on donor kitchen
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Ready for Pickup
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
            Approved hand-offs
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Completed Collections
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
            {collectedCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Distributed to residents
          </div>
        </div>
      </div>

      {/* My Claim Requests Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Track My Food Claims & Delivery Status
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
              Real-time synchronization with donors and Firestore database
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            You haven't requested any food yet. Browse available food below to claim portions!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 18px' }}>Food Requested</th>
                  <th style={{ padding: '12px 18px' }}>Claimed Quantity</th>
                  <th style={{ padding: '12px 18px' }}>Pickup Instructions</th>
                  <th style={{ padding: '12px 18px' }}>Submitted</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.requestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0f172a' }}>
                      <div>{req.foodName || 'Food Item #' + req.foodId}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Req: {req.requestId}</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0284c7' }}>
                      {req.requestedQuantity} portions
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12px' }}>
                      {req.notes || 'Standard pickup'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '12px' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <StatusBadge status={req.requestStatus} size="sm" />
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {req.requestStatus === 'APPROVED' && (
                        <button
                          onClick={() => onCollectRequest(req.requestId)}
                          className="btn btn-primary btn-sm"
                        >
                          📦 Mark Collected
                        </button>
                      )}
                      {req.requestStatus === 'COLLECTED' && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                          Food Received ✓
                        </span>
                      )}
                      {req.requestStatus === 'PENDING' && (
                        <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>
                          Awaiting Donor
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommended Available Food Nearby */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
          🍲 Recommended Surplus Food Ready for Claim
        </h3>
        {availableDonations.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '13px' }}>No new available food right now.</p>
        ) : (
          <div className="grid grid-3">
            {availableDonations.map((food) => (
              <FoodCard
                key={food.foodId}
                food={food}
                onRequestClick={onRequestClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
