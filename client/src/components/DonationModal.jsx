import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import API_ENDPOINTS from '../api/endpoints';
import { FOOD_CATEGORY, FOOD_STATUS } from '../contracts/models';

/**
 * DonationModal Component
 * Responsive modal allowing food donors to post surplus food into the live database.
 */
export default function DonationModal({
  onClose,
  onDonationCreated
}) {
  const [formData, setFormData] = useState({
    foodName: '',
    category: FOOD_CATEGORY.COOKED_MEALS,
    quantity: 25,
    pickupHours: 6,
    address: '100 University Ave, Community Kitchen',
    city: 'Metro City',
    allergens: 'None',
    storageInstructions: 'Keep in warm insulated thermal containers',
    donorId: 'usr_001',
    donorName: 'Downtown Community Kitchen'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.foodName.trim()) {
      setErrorMsg('Please enter a food name');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const preparedTime = new Date().toISOString();
      const pickupDeadline = new Date(Date.now() + Number(formData.pickupHours) * 3600 * 1000).toISOString();
      const allergenList = formData.allergens.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        foodName: formData.foodName.trim(),
        quantity: Number(formData.quantity) || 10,
        category: formData.category,
        donorId: formData.donorId,
        donorName: formData.donorName.trim(),
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          latitude: 12.9716,
          longitude: 77.5946
        },
        preparedTime,
        pickupDeadline,
        status: FOOD_STATUS.AVAILABLE,
        allergens: allergenList.length > 0 ? allergenList : ['None'],
        storageInstructions: formData.storageInstructions.trim()
      };

      const res = await apiClient.post(API_ENDPOINTS.DONATIONS.CREATE, payload);
      if (onDonationCreated) {
        onDonationCreated(res.data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create food donation listing');
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
              Post Surplus Food Donation
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
              Publish available portions for shelters and community kitchens
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
            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Food Title / Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Steamed Rice, Vegetable Curry & Fresh Fruit"
                value={formData.foodName}
                onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                >
                  {Object.values(FOOD_CATEGORY).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Available Portions *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Deadline Window *</label>
                <select
                  value={formData.pickupHours}
                  onChange={(e) => setFormData({ ...formData, pickupHours: e.target.value })}
                  className="form-input"
                >
                  <option value="2">2 Hours (Urgent)</option>
                  <option value="4">4 Hours</option>
                  <option value="6">6 Hours (Standard)</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (Next Day)</option>
                  <option value="48">48 Hours</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Known Allergens (comma-separated)</label>
              <input
                type="text"
                placeholder="None or Dairy, Gluten, Peanuts"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Donor Name / Kitchen</label>
              <input
                type="text"
                value={formData.donorName}
                onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                className="form-input"
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
              {submitting ? 'Publishing Listing...' : 'Publish Food Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
