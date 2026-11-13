import React from 'react';

/**
 * StatusBadge Component
 * Uniform color-coded pill for Food Status, Request Status, and Urgency Tiers
 */
export default function StatusBadge({ status, size = 'md' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      // Food & Request Success/Active
      case 'AVAILABLE':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', icon: '🟢', label: 'Available' };
      case 'APPROVED':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: '✅', label: 'Approved' };
      case 'COLLECTED':
      case 'COMPLETED':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', icon: '📦', label: 'Collected' };
      
      // Pending / Claimed
      case 'PENDING':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', icon: '⏳', label: 'Pending' };
      case 'CLAIMED':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', icon: '🤝', label: 'Claimed' };

      // Urgency Tiers
      case 'CRITICAL':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', icon: '🚨', label: 'Critical < 2h' };
      case 'EXPIRING_SOON':
        return { bg: '#fffbeb', text: '#b45309', border: '#fed7aa', icon: '⚡', label: 'Expiring Soon' };
      case 'SAFE':
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icon: '🌱', label: 'Safe Window' };

      // Expired / Rejected / Cancelled
      case 'EXPIRED':
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', icon: '⏰', label: 'Expired' };
      case 'REJECTED':
      case 'CANCELLED':
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5', icon: '✕', label: normalized === 'REJECTED' ? 'Rejected' : 'Cancelled' };

      default:
        return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', icon: '•', label: status };
    }
  };

  const styleConfig = getStyle();
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 700,
        borderRadius: '9999px',
        backgroundColor: styleConfig.bg,
        color: styleConfig.text,
        border: `1px solid ${styleConfig.border}`,
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ fontSize: isSmall ? '10px' : '11px' }}>{styleConfig.icon}</span>
      <span>{styleConfig.label}</span>
    </span>
  );
}
