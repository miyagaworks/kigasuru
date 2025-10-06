/**
 * Weather utility functions using Open-Meteo API (free, no API key required)
 */

/**
 * Get current weather data for a location
 */
export const getWeather = async (latitude: number, longitude: number): Promise<{
  temperature: number;
  temperatureCategory: string;
}> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Asia/Tokyo`
    );

    if (!response.ok) {
      throw new Error('天気情報の取得に失敗しました');
    }

    const data = await response.json();
    const temperature = data.current_weather.temperature;

    // Categorize temperature
    let temperatureCategory: string;
    if (temperature >= 25) {
      temperatureCategory = 'summer';
    } else if (temperature >= 15) {
      temperatureCategory = 'mid-season';
    } else {
      temperatureCategory = 'winter';
    }

    return {
      temperature,
      temperatureCategory,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
};

/**
 * Get reverse geocoding (location name from coordinates)
 * Using Nominatim API (OpenStreetMap)
 */
export const getLocationName = async (latitude: number, longitude: number): Promise<{
  locationName: string;
  fullAddress: string;
  address: Record<string, unknown>;
}> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`,
      {
        headers: {
          'User-Agent': 'KigasuruApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('位置情報の取得に失敗しました');
    }

    const data = await response.json();

    // Try to extract meaningful location name
    const address = data.address || {};
    const locationName =
      address.leisure ||  // Golf course or sports facility
      address.tourism ||
      address.amenity ||
      address.suburb ||
      address.city ||
      address.town ||
      address.village ||
      'Unknown Location';

    return {
      locationName,
      fullAddress: data.display_name,
      address,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      locationName: 'Unknown Location',
      fullAddress: '',
      address: {},
    };
  }
};
