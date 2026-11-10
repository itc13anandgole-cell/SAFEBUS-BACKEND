const axios = require('axios');

const ORS_API_KEY = process.env.ORS_API_KEY || '5b3ce3597851110001cf6248b9487c6999b1424e88383f7a1f599999';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

/**
 * Calculates driving route, distance, and estimated travel time between coordinates
 * @param {Array<Array<number>>} coordinates - Array of [longitude, latitude] pairs
 */
const getDrivingDirections = async (coordinates) => {
  try {
    if (!coordinates || coordinates.length < 2) {
      throw new Error('At least 2 coordinate pairs are required for routing');
    }

    const response = await axios.post(
      ORS_BASE_URL,
      { coordinates },
      {
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const summary = route.summary;

      return {
        success: true,
        distance_km: (summary.distance / 1000).toFixed(2),
        duration_minutes: Math.ceil(summary.duration / 60),
        geometry: route.geometry, // GeoJSON or Polyline string
        bbox: route.bbox
      };
    }

    throw new Error('No route returned from OpenRouteService');
  } catch (err) {
    console.warn(`⚠️ OpenRouteService API call fallback (${err.message}). Using calculated Haversine estimate.`);
    
    // Fallback: Haversine distance estimation if ORS API key is invalid/rate limited
    let totalDistKm = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistKm += R * c;
    }

    // Multiply by 1.3 to account for road curvature
    const estimatedDistanceKm = (totalDistKm * 1.3).toFixed(2);
    const estimatedMinutes = Math.ceil((estimatedDistanceKm / 30) * 60); // 30 km/h avg bus speed

    return {
      success: true,
      distance_km: estimatedDistanceKm,
      duration_minutes: estimatedMinutes,
      is_fallback: true
    };
  }
};

module.exports = {
  getDrivingDirections
};
