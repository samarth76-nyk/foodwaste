import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

/**
 * DonorDashboard Component
 * Designed by Tanisha (Member 1 - Frontend & UI)
 * Dedicated portal for commercial donors (restaurants, bakeries, caterers) to manage
 * listings, review incoming receiver claims, and approve hand-offs.
 */
export default function DonorDashboard({
  donations = [],
  requests = [],
  onOpenDonationModal,
  onDeleteDonation,
  onApproveRequest,
  onRejectRequest,
  onCollectRequest
}) {
  const [activeSubTab, setActiveSubTab] = useState('listings');

  // Compute donor statistics
  const totalDonationsCount = donations.length;
  const activeDonationsCount = donations.filter((d) => d.status === 'AVAILABLE').length;
  const totalPortions = donations.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const pendingRequests = requests.filter((r) => r.requestStatus === 'PENDING');
  const approvedRequests = requests.filter((r) => r.requestStatus === 'APPROVED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
        border: '1px solid #a7f3d0',
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
            <span style={{ fontSize: '24px' }}>👨‍🍳</span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Food Donor Management Portal
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Manage commercial surplus food listings and approve incoming shelter requests
          </p>
        </div>

        <button
          onClick={onOpenDonationModal}
          className="btn btn-primary btn-lg"
        >
          ➕ Post New Surplus Food
        </button>
      </div>

      {/* Metric Overview Tiles */}
      <div className="grid grid-4">
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Total Listings Posted
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {totalDonationsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
            Permanent database records
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Active Available
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>
            {activeDonationsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Ready for shelter requests
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Pending Requests
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
            {pendingRequests.length}
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>
            Awaiting your approval
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
            Approved Hand-offs
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
            {approvedRequests.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Scheduled for pickup
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('listings')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'listings' ? '#059669' : '#ffffff',
            color: activeSubTab === 'listings' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          📋 My Food Listings ({donations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'requests' ? '#059669' : '#ffffff',
            color: activeSubTab === 'requests' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📥 Incoming Shelter Claims</span>
          {pendingRequests.length > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '11px'
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB TAB 1: LISTINGS MANAGEMENT */}
      {activeSubTab === 'listings' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Posted Food Listings
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Stored in Firestore `food_donations` collection
            </span>
          </div>

          {donations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No food listings posted yet. Click <strong>+ Post New Surplus Food</strong> to publish your first donation!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 18px' }}>Food Title</th>
                    <th style={{ padding: '12px 18px' }}>Category</th>
                    <th style={{ padding: '12px 18px' }}>Available Portions</th>
                    <th style={{ padding: '12px 18px' }}>Location</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((food) => (
                    <tr key={food.foodId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0f172a' }}>
                        <div>{food.foodName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {food.foodId}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>
                        {food.category}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#059669' }}>
                        {food.quantity} portions
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12px' }}>
                        {food.location?.city || 'Local'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={food.status} size="sm" />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => onDeleteDonation(food.foodId)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: INCOMING REQUESTS & APPROVAL */}
      {activeSubTab === 'requests' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Shelter & Community Claim Requests
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Approving a claim automatically decrements your food listing's available portion inventory!
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No incoming claim requests yet. When shelters request your food, they will appear here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 18px' }}>Food Requested</th>
                    <th style={{ padding: '12px 18px' }}>Recipient Shelter</th>
                    <th style={{ padding: '12px 18px' }}>Quantity</th>
                    <th style={{ padding: '12px 18px' }}>Pickup Notes</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.requestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0f172a' }}>
                        <div>{req.foodName || 'Food Item #' + req.foodId}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Req: {req.requestId}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#334155' }}>
                        {req.receiverName || req.receiverId}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0284c7' }}>
                        {req.requestedQuantity} portions
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12px', fontStyle: req.notes ? 'italic' : 'normal' }}>
                        {req.notes || 'No special notes'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={req.requestStatus} size="sm" />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {req.requestStatus === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => onApproveRequest(req.requestId)}
                              className="btn btn-primary btn-sm"
                              title="Approve and deduct food portion inventory"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => onRejectRequest(req.requestId)}
                              className="btn btn-danger btn-sm"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}

                        {req.requestStatus === 'APPROVED' && (
                          <button
                            onClick={() => onCollectRequest(req.requestId)}
                            className="btn btn-secondary btn-sm"
                          >
                            📦 Mark Collected
                          </button>
                        )}

                        {req.requestStatus === 'COLLECTED' && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>
                            Completed 🎉
                          </span>
                        )}

                        {req.requestStatus === 'REJECTED' && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#991b1b' }}>
                            Declined
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
      )}
    </div>
  );
}
