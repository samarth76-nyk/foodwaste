import React from 'react';
import StatusBadge from './StatusBadge';

const CATEGORY_ICONS = {
  'Cooked Meals': '🍲',
  'Produce': '🥦',
  'Bakery': '🥖',
  'Dairy': '🥛',
  'Packaged Goods': '🥫',
  'Beverages': '🧃',
  'Other': '🍱'
};

const CATEGORY_COLORS = {
  'Cooked Meals': '#fef3c7',
  'Produce': '#dcfce7',
  'Bakery': '#ffedd5',
  'Dairy': '#e0f2fe',
  'Packaged Goods': '#f3e8ff',
  'Beverages': '#cffafe',
  'Other': '#f1f5f9'
};

/**
 * FoodCard Component
 * Designed by Tanisha (Member 1 - Frontend & UI)
 * Responsive card displaying food details, deadline urgency, allergens, and claim trigger.
 */
export default function FoodCard({
  food,
  onRequestClick,
  onDeleteClick,
  showManageActions = false,
  userRole = 'RECEIVER'
}) {
  const icon = CATEGORY_ICONS[food.category] || '🍲';
  const bannerColor = CATEGORY_COLORS[food.category] || '#f1f5f9';

  // Format pickup deadline nicely
  const formatDeadline = (isoString) => {
    if (!isoString) return 'Not specified';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch (e) {
      return isoString;
    }
  };

  const isAvailable = food.status === 'AVAILABLE';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      className="card-hover"
    >
      {/* Top Banner / Illustration Bar */}
      <div
        style={{
          background: bannerColor,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
            {food.category}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {food.urgencyTier && food.urgencyTier !== 'SAFE' && (
            <StatusBadge status={food.urgencyTier} size="sm" />
          )}
          <StatusBadge status={food.status} size="sm" />
        </div>
      </div>

      {/* Card Content Body */}
      <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
            {food.foodName}
          </h3>
          <span
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
              whiteSpace: 'nowrap'
            }}
          >
            {String(food.quantity || 0).toLowerCase().includes('portion') 
              ? food.quantity 
              : `${food.quantity || 0} portions`}
          </span>
        </div>

        {/* Donor and Location info */}
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🏢</span>
          <span>{food.donorName || 'Community Food Donor'}</span>
          <span>&bull;</span>
          <span>📍 {food.location?.city || 'Local'}</span>
        </p>

        {food.location?.address && (
          <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px' }}>
            {food.location.address}
          </p>
        )}

        {/* Warning Banner if Urgent */}
        {food.deadlineAnalysis?.warningMessage && (
          <div
            style={{
              background: food.urgencyTier === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
              border: `1px solid ${food.urgencyTier === 'CRITICAL' ? '#fecaca' : '#fed7aa'}`,
              color: food.urgencyTier === 'CRITICAL' ? '#991b1b' : '#92400e',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⏰</span>
            <span>{food.deadlineAnalysis.warningMessage}</span>
          </div>
        )}

        {/* Pickup Time Window */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '14px',
            fontSize: '12px',
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Pickup Deadline:</span>
            <strong style={{ color: '#0f172a' }}>{formatDeadline(food.pickupDeadline)}</strong>
          </div>
          {food.allergens && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Allergens:</span>
              <span>{Array.isArray(food.allergens) ? food.allergens.join(', ') : food.allergens}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          {isAvailable && onRequestClick && (
            <button
              onClick={() => onRequestClick(food)}
              className="btn btn-primary"
              style={{ flex: 1, padding: '9px 12px' }}
            >
              📥 Request Portions
            </button>
          )}

          {showManageActions && onDeleteClick && (
            <button
              onClick={() => onDeleteClick(food.foodId)}
              className="btn btn-danger btn-sm"
              title="Delete food listing"
            >
              🗑️ Delete
            </button>
          )}

          {!isAvailable && (
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f8fafc', borderRadius: '6px' }}>
              Listing Claimed or Expired
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
