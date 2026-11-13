import React from 'react';
import FoodCard from '../components/FoodCard';

/**
 * HomePage Component
 * Designed by Tanisha (Member 1 - Frontend & UI)
 * Features Hero section, live impact metrics ticker, how it works, and urgent listings preview.
 */
export default function HomePage({
  donations = [],
  stats = {},
  onNavigate,
  onRequestClick,
  onOpenDonationModal
}) {
  // Urgent food listings expiring soonest
  const urgentListings = donations
    .filter((d) => d.status === 'AVAILABLE')
    .slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #e0f2fe 100%)',
          borderRadius: '20px',
          padding: '60px 36px',
          border: '1px solid #a7f3d0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 14px', borderRadius: '20px', border: '1px solid #a7f3d0', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '14px' }}>🌱</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
              Zero Food Waste Initiative &bull; Community Driven
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Rescue Surplus Food. Feed Communities. <span style={{ color: '#059669' }}>Eliminate Waste.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: '#475569', lineHeight: 1.6, marginBottom: '28px' }}>
            ShareBite seamlessly bridges restaurants, bakeries, and supermarkets with verified local shelters and community kitchens to redistribute edible food before it expires.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('donations')}
              className="btn btn-primary btn-lg"
            >
              🍲 Browse Available Food
            </button>
            <button
              onClick={onOpenDonationModal}
              className="btn btn-secondary btn-lg"
            >
              ➕ Donate Surplus Food
            </button>
            <button
              onClick={() => onNavigate('donor')}
              className="btn btn-outline btn-lg"
            >
              👨‍🍳 Donor Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Live Impact Counters Ticker */}
      <section className="grid grid-4">
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>🍽️</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {(stats.totalMealsSaved || 1480).toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Meals Rescued & Served</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>☁️</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>
            {(stats.co2EmissionsAvoidedKg || 1554).toLocaleString()} kg
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>CO₂ Emissions Avoided</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>🏢</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
            {(stats.registeredReceiversCount || 52).toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Verified Recipient Shelters</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>⚡</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
            {stats.successRatePercentage || 92.4}%
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Rescue Success Rate</div>
        </div>
      </section>

      {/* Urgent Food Rescues Showcase */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#b91c1c', background: '#fef2f2', padding: '2px 8px', borderRadius: '10px', marginBottom: '4px' }}>
              🚨 Urgent Action Required
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Expiring Food Listings Needing Immediate Rescue
            </h2>
          </div>
          <button
            onClick={() => onNavigate('donations')}
            className="btn btn-outline"
          >
            View All ({donations.length}) &rarr;
          </button>
        </div>

        {urgentListings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              No urgent food listings right now. Post surplus food to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-3">
            {urgentListings.map((food) => (
              <FoodCard
                key={food.foodId}
                food={food}
                onRequestClick={onRequestClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* How It Works 3-Step Walkthrough */}
      <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            How ShareBite Works
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Simple, streamlined workflow connecting surplus donors with local shelters in under 30 minutes.
          </p>
        </div>

        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', fontWeight: 800, border: '1px solid #a7f3d0' }}>
              1
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Donors Post Surplus Food
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Commercial kitchens, bakeries, or supermarkets enter portions, dietary details, and pickup safety deadline.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', fontWeight: 800, border: '1px solid #bae6fd' }}>
              2
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Smart Matching & Claiming
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Nearby shelters are matched via proximity algorithms. Receivers submit request portions for their community.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', fontWeight: 800, border: '1px solid #fde68a' }}>
              3
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Pickup & Impact Tracking
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Donors approve hand-offs, food is collected, and environmental CO₂ / water conservation metrics update live.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
