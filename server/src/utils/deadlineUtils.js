/**
 * ==============================================================================
 * SHAREBITE - PICKUP DEADLINE & EXPIRATION WARNING UTILITIES
 * ==============================================================================
 * 
 * Computes real-time expiration countdowns, urgency tier classification,
 * warning badges, and priority scores for perishable food donations.
 * ==============================================================================
 */

export const URGENCY_TIERS = Object.freeze({
  EXPIRED: 'EXPIRED',
  CRITICAL: 'CRITICAL',             // Less than 2 hours remaining
  EXPIRING_SOON: 'EXPIRING_SOON',   // Less than 5 hours remaining
  SAFE: 'SAFE'                      // More than 5 hours remaining
});

/**
 * Evaluates the deadline urgency of a perishable food listing
 * 
 * @param {string|Date} pickupDeadline ISO date string or Date object
 * @param {string|Date} [preparedTime] Optional prepared timestamp
 * @param {Date} [referenceTime=new Date()] Reference time (defaults to now)
 * @returns {Object} Urgency analysis object
 */
export const evaluateDeadlineUrgency = (pickupDeadline, preparedTime = null, referenceTime = new Date()) => {
  if (!pickupDeadline) {
    return {
      urgencyTier: URGENCY_TIERS.SAFE,
      timeRemainingMs: Infinity,
      hoursRemaining: Infinity,
      minutesRemaining: Infinity,
      isExpired: false,
      warningMessage: 'No pickup deadline specified',
      badgeColor: '#10b981',
      formattedRemaining: 'No deadline'
    };
  }

  const deadline = new Date(pickupDeadline);
  const now = new Date(referenceTime);
  const timeRemainingMs = deadline.getTime() - now.getTime();
  const totalMinutesRemaining = Math.floor(timeRemainingMs / (1000 * 60));
  const totalHoursRemaining = Math.round((totalMinutesRemaining / 60) * 10) / 10;

  // 1. Check if already expired
  if (timeRemainingMs <= 0) {
    const expiredMinutesAgo = Math.abs(totalMinutesRemaining);
    const expiredHoursAgo = Math.floor(expiredMinutesAgo / 60);
    const formattedPast = expiredHoursAgo > 0
      ? `${expiredHoursAgo}h ${expiredMinutesAgo % 60}m ago`
      : `${expiredMinutesAgo}m ago`;

    return {
      urgencyTier: URGENCY_TIERS.EXPIRED,
      timeRemainingMs,
      hoursRemaining: totalHoursRemaining,
      minutesRemaining: totalMinutesRemaining,
      isExpired: true,
      priorityScore: 0,
      badgeColor: '#ef4444', // Red
      badgeText: 'EXPIRED',
      warningMessage: `Pickup deadline expired ${formattedPast}. Food may no longer be safe for distribution.`,
      formattedRemaining: `Expired (${formattedPast})`
    };
  }

  // 2. Format remaining hours and minutes
  const hours = Math.floor(totalMinutesRemaining / 60);
  const minutes = totalMinutesRemaining % 60;
  const formattedRemaining = hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;

  // 3. Classify Urgency Tier
  if (totalMinutesRemaining <= 120) {
    // Under 2 hours: CRITICAL
    return {
      urgencyTier: URGENCY_TIERS.CRITICAL,
      timeRemainingMs,
      hoursRemaining: totalHoursRemaining,
      minutesRemaining: totalMinutesRemaining,
      isExpired: false,
      priorityScore: 95,
      badgeColor: '#dc2626', // Dark Red / Crimson
      badgeText: 'CRITICAL WARNING',
      warningMessage: `CRITICAL: Only ${formattedRemaining}! Spoilage imminent. Dispatch immediate volunteer/NGO pickup.`,
      formattedRemaining
    };
  }

  if (totalMinutesRemaining <= 300) {
    // Under 5 hours: EXPIRING_SOON
    return {
      urgencyTier: URGENCY_TIERS.EXPIRING_SOON,
      timeRemainingMs,
      hoursRemaining: totalHoursRemaining,
      minutesRemaining: totalMinutesRemaining,
      isExpired: false,
      priorityScore: 70,
      badgeColor: '#f59e0b', // Amber / Orange
      badgeText: 'EXPIRING SOON',
      warningMessage: `Urgent pickup recommended: ${formattedRemaining}. Needs claim within the next few hours.`,
      formattedRemaining
    };
  }

  // Greater than 5 hours: SAFE
  return {
    urgencyTier: URGENCY_TIERS.SAFE,
    timeRemainingMs,
    hoursRemaining: totalHoursRemaining,
    minutesRemaining: totalMinutesRemaining,
    isExpired: false,
    priorityScore: 30,
    badgeColor: '#10b981', // Emerald Green
    badgeText: 'SAFE WINDOW',
    warningMessage: `Fresh donation listing with ${formattedRemaining}.`,
    formattedRemaining
  };
};

/**
 * Enriches a donation document with live urgency deadline metadata
 * 
 * @param {Object} donation Food donation entity
 * @returns {Object} Enriched donation with urgency metadata
 */
export const enrichDonationWithDeadlineWarning = (donation) => {
  if (!donation) return donation;
  const urgency = evaluateDeadlineUrgency(donation.pickupDeadline, donation.preparedTime);

  return {
    ...donation,
    deadlineAnalysis: urgency,
    urgencyTier: urgency.urgencyTier,
    isExpired: urgency.isExpired,
    warningBadge: urgency.badgeText,
    timeRemainingFormatted: urgency.formattedRemaining
  };
};

export default {
  URGENCY_TIERS,
  evaluateDeadlineUrgency,
  enrichDonationWithDeadlineWarning
};
