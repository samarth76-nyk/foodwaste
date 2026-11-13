/**
 * ==============================================================================
 * SHAREBITE - GEOGRAPHIC & DISTANCE UTILITIES
 * ==============================================================================
 * Member 4 - Smart Features & Integration
 * 
 * Provides Haversine great-circle distance calculations and transit estimations
 * between GPS coordinates (latitude, longitude).
 * ==============================================================================
 */

const EARTH_RADIUS_KM = 6371; // Earth's mean radius in kilometers

/**
 * Converts degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
export const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculates distance between two GPS coordinates using the Haversine Formula
 * 
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    lat1 === null || lon1 === null ||
    lat2 === null || lon2 === null
  ) {
    return null;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
};

/**
 * Estimates driving/delivery transit time based on urban road conditions
 * Assuming average urban speed of 25 km/h + 5 mins handling buffer
 * 
 * @param {number} distanceKm
 * @returns {number} Estimated minutes
 */
export const estimateTransitMinutes = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return null;
  const averageUrbanSpeedKmH = 25;
  const bufferMinutes = 5;
  const transitMinutes = Math.round((distanceKm / averageUrbanSpeedKmH) * 60) + bufferMinutes;
  return transitMinutes;
};

/**
 * Checks if coordinates are valid latitude and longitude numbers
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
export const isValidCoordinate = (lat, lon) => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

export default {
  toRadians,
  calculateDistanceKm,
  estimateTransitMinutes,
  isValidCoordinate
};
