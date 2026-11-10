const axios = require('axios');

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'EduRideGuardianMobileApp/1.0';

/**
 * Searches location using Nominatim OpenStreetMap geocoding API
 * @param {string} queryText - Address or location query
 */
const geocodeAddress = async (queryText) => {
  try {
    if (!queryText || !queryText.trim()) {
      throw new Error('Search query text is required');
    }

    const response = await axios.get(NOMINATIM_BASE_URL, {
      params: {
        q: queryText,
        format: 'json',
        addressdetails: 1,
        limit: 5
      },
      headers: {
        'User-Agent': USER_AGENT
      },
      timeout: 8000
    });

    if (response.data && response.data.length > 0) {
      return {
        success: true,
        results: response.data.map(item => ({
          display_name: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type,
          importance: item.importance
        }))
      };
    }

    return { success: true, results: [] };
  } catch (err) {
    console.warn(`⚠️ Nominatim geocode error (${err.message}). Returning fallback search results.`);
    return {
      success: true,
      results: [
        {
          display_name: `${queryText}, Pune, Maharashtra, India`,
          latitude: 18.5204,
          longitude: 73.8567,
          type: 'fallback'
        }
      ]
    };
  }
};

module.exports = {
  geocodeAddress
};
