import React, { useState } from 'react';
import FoodCard from '../components/FoodCard';
import { FOOD_CATEGORY } from '../contracts/models';

/**
 * DonationsPage Component
 * Marketplace to browse, filter, search, and claim surplus food donations.
 */
export default function DonationsPage({
  donations = [],
  loading = false,
  onRefresh,
  onRequestClick,
  onOpenDonationModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('AVAILABLE');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');

  // Filter donations based on search term and filters
  const filteredDonations = donations.filter((item) => {
    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchName = item.foodName?.toLowerCase().includes(query);
      const matchCity = item.location?.city?.toLowerCase().includes(query);
      const matchDonor = item.donorName?.toLowerCase().includes(query);
      if (!matchName && !matchCity && !matchDonor) return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
      return false;
    }

    // Urgency filter
    if (selectedUrgency !== 'ALL' && item.urgencyTier !== selectedUrgency) {
      return false;
    }

    return true;
  });

  const categories = ['ALL', ...Object.values(FOOD_CATEGORY)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            🍲 Available Food Donations Marketplace
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Real-time surplus listings from local kitchens, bakeries, and food suppliers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onRefresh}
            className="btn btn-outline"
            title="Refresh database listings"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onOpenDonationModal}
            className="btn btn-primary"
          >
            ➕ Post Food Listing
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Search input and status selectors */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="🔍 Search food by title, city, or donor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input"
              style={{ width: 'auto' }}
            >
              <option value="AVAILABLE">Status: Available</option>
              <option value="CLAIMED">Status: Claimed</option>
              <option value="ALL">Status: All Statuses</option>
            </select>

            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="form-input"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Urgency Windows</option>
              <option value="CRITICAL">🚨 Critical (&lt; 2h)</option>
              <option value="EXPIRING_SOON">⚡ Expiring Soon (&lt; 5h)</option>
              <option value="SAFE">🌱 Safe Window</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #059669' : '1px solid #e2e8f0',
                  background: isSelected ? '#ecfdf5' : '#ffffff',
                  color: isSelected ? '#059669' : '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat === 'ALL' ? '🍽️ All Categories' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Listings Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Loading surplus food listings from database...</p>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔎</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            No matching food listings found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px' }}>
            Try clearing filters or search term, or post a new food donation to make it available for local shelters.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); setSelectedStatus('ALL'); setSelectedUrgency('ALL'); }}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
            Showing {filteredDonations.length} surplus food {filteredDonations.length === 1 ? 'listing' : 'listings'}
          </div>
          <div className="grid grid-3">
            {filteredDonations.map((food) => (
              <FoodCard
                key={food.foodId}
                food={food}
                onRequestClick={onRequestClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
