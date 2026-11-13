import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import API_ENDPOINTS from '../api/endpoints';

/**
 * RequestModal Component
 * Designed by Tanisha (Member 1 - Frontend & UI)
 * Modal popup allowing receivers to select portion quantities, add pickup notes, and submit claims.
 */
export default function RequestModal({
  food,
  onClose,
  onRequestSubmitted
}) {
  const maxPortions = typeof food.quantity === 'number' ? food.quantity : (parseFloat(food.quantity) || 1);
  const [requestedQuantity, setRequestedQuantity] = useState(Math.min(5, maxPortions));
  const [receiverName, setReceiverName] = useState('Hope Community Shelter');
  const [notes, setNotes] = useState('Meals for evening resident community service');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requestedQuantity <= 0 || requestedQuantity > maxPortions) {
      setErrorMsg(`Portions must be between 1 and ${maxPortions}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        foodId: food.foodId,
        receiverId: 'usr_002',
        receiverName: receiverName.trim(),
        requestedQuantity: Number(requestedQuantity),
        notes: notes.trim()
      };

      const res = await apiClient.post(API_ENDPOINTS.REQUESTS.CREATE, payload);
      if (onRequestSubmitted) {
        onRequestSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Request Food Donation
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
              Claim portions for your shelter or food distribution drive
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Target Food summary card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{food.foodName}</strong>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>
                  {food.category}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Donor: {food.donorName || 'Community Kitchen'} &bull; Max Available: <strong>{maxPortions} portions</strong>
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Portions Requested (Max {maxPortions}): *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRequestedQuantity(Math.max(1, requestedQuantity - 1))}
                  style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxPortions}
                  required
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(Math.max(1, Math.min(maxPortions, Number(e.target.value))))}
                  className="form-input"
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: '15px' }}
                />
                <button
                  type="button"
                  onClick={() => setRequestedQuantity(Math.min(maxPortions, requestedQuantity + 1))}
                  style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Organization / Shelter Name: *</label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pickup & Transport Notes:</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Will pick up by 4:00 PM with insulated food boxes"
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting Claim...' : 'Confirm Food Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
