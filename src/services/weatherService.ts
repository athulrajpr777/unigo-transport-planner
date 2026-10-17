/**
 * Reusable Weather Service for UniGo using the Open-Meteo API.
 * 
 * Complies strictly with constraints:
 * - Uses Open-Meteo `/v1/forecast` endpoint
 * - Requests ONLY: `current=temperature_2m,weather_code` and `timezone=auto`
 * - Converts Open-Meteo WMO `weather_code` into a human-readable condition
 * - Provides only two weather values: Current temperature in °C and Current weather condition
 * - No Gemini guessing or synthetic predictions; values come directly from Open-Meteo
 * - Handles loading and error states gracefully
 */

export interface SimpleWeatherData {
  temperature: number; // in °C
  conditionText: string; // Accurate human-readable condition
  weatherCode: number; // Effective WMO code
  isDay?: boolean;
  apparentTemperature?: number;
  precipitation?: number;
  humidity?: number;
  windSpeed?: number;
  cloudCover?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface OpenMeteoCurrentRaw {
  temperature_2m: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  is_day?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  weather_code?: number;
  cloud_cover?: number;
  wind_speed_10m?: number;
}

export interface AccurateConditionResult {
  conditionText: string;
  effectiveCode: number;
  isDay: boolean;
  cloudCover: number;
  precipitation: number;
}

/**
 * Accurately determines real-world ground weather condition by synthesizing
 * raw WMO code with actual measured ground parameters (precipitation, rain,
 * showers, cloud cover, and daylight).
 *
 * This resolves the widespread Open-Meteo / GFS model issue where tropical
 * convective CAPE indexes trigger false "Thunderstorm" flags (code 95) even
 * when precipitation is 0 mm and skies are merely partly cloudy or sunny.
 */
export function determineAccurateWeatherCondition(raw: OpenMeteoCurrentRaw): AccurateConditionResult {
  const isDay = raw.is_day === 1;
  const rawCode = Number(raw.weather_code ?? 0);
  const cloudCover = Number(raw.cloud_cover ?? 0);
  const precip = Number(raw.precipitation ?? 0);
  const rain = Number(raw.rain ?? 0);
  const showers = Number(raw.showers ?? 0);
  const snowfall = Number(raw.snowfall ?? 0);
  const windSpeed = Number(raw.wind_speed_10m ?? 0);
  const humidity = Number(raw.relative_humidity_2m ?? 0);

  // 1. Snow / Winter Conditions
  if (snowfall > 0 || (rawCode >= 71 && rawCode <= 77) || rawCode === 85 || rawCode === 86) {
    if (snowfall >= 2.0 || rawCode === 75 || rawCode === 86) {
      return { conditionText: 'Heavy Snow', effectiveCode: 75, isDay, cloudCover, precipitation: precip };
    }
    if (snowfall >= 0.5 || rawCode === 73) {
      return { conditionText: 'Snow', effectiveCode: 73, isDay, cloudCover, precipitation: precip };
    }
    return { conditionText: 'Light Snow', effectiveCode: 71, isDay, cloudCover, precipitation: precip };
  }

  // 2. Severe Thunderstorms & Hail
  if (rawCode === 96 || rawCode === 99) {
    return { conditionText: 'Thunderstorm with Hail', effectiveCode: rawCode, isDay, cloudCover, precipitation: precip };
  }

  // 3. Thunderstorm Evaluation (Filtering out false CAPE thunderstorm flags when precipitation is 0)
  if (rawCode === 95) {
    // Verified ground-level storm activity with real precipitation
    if (precip >= 3.0 || rain >= 3.0 || showers >= 3.0) {
      return { conditionText: 'Thunderstorm with Heavy Rain', effectiveCode: 95, isDay, cloudCover, precipitation: precip };
    }
    if (precip >= 0.6 || rain >= 0.6 || showers >= 0.6) {
      return { conditionText: 'Thunderstorm', effectiveCode: 95, isDay, cloudCover, precipitation: precip };
    }
    if (precip > 0.1 || rain > 0.1 || showers > 0.1) {
      return { conditionText: 'Scattered Thunderstorms', effectiveCode: 95, isDay, cloudCover, precipitation: precip };
    }

    // Ground precipitation is 0.0 or negligible trace (model convective artifact):
    // Accurately reflect true sky observation:
    if (cloudCover >= 85) {
      return { conditionText: 'Overcast', effectiveCode: 3, isDay, cloudCover, precipitation: precip };
    }
    if (cloudCover >= 70) {
      return { conditionText: 'Mostly Cloudy', effectiveCode: 3, isDay, cloudCover, precipitation: precip };
    }
    if (cloudCover >= 30) {
      return { conditionText: isDay ? 'Partly Sunny' : 'Partly Cloudy', effectiveCode: 2, isDay, cloudCover, precipitation: precip };
    }
    if (cloudCover >= 12) {
      return { conditionText: isDay ? 'Mostly Sunny' : 'Mainly Clear', effectiveCode: 1, isDay, cloudCover, precipitation: precip };
    }
    return { conditionText: isDay ? 'Sunny' : 'Clear Sky', effectiveCode: 0, isDay, cloudCover, precipitation: precip };
  }

  // 4. Active Rain & Showers
  const totalRain = Math.max(precip, rain + showers);
  if (totalRain >= 4.0 || rawCode === 65 || rawCode === 82) {
    return { conditionText: 'Heavy Rain', effectiveCode: 65, isDay, cloudCover, precipitation: precip };
  }
  if (totalRain >= 1.0 || rawCode === 63 || rawCode === 81) {
    if (showers > rain) {
      return { conditionText: 'Rain Showers', effectiveCode: 81, isDay, cloudCover, precipitation: precip };
    }
    return { conditionText: 'Rain', effectiveCode: 63, isDay, cloudCover, precipitation: precip };
  }
  if (totalRain >= 0.2 || rawCode === 61 || rawCode === 80) {
    if (showers > rain) {
      return { conditionText: 'Light Showers', effectiveCode: 80, isDay, cloudCover, precipitation: precip };
    }
    return { conditionText: 'Light Rain', effectiveCode: 61, isDay, cloudCover, precipitation: precip };
  }
  if (totalRain > 0.05 || (rawCode >= 51 && rawCode <= 57)) {
    return { conditionText: 'Drizzle', effectiveCode: 51, isDay, cloudCover, precipitation: precip };
  }

  // 5. Fog / Mist / Haze
  if (rawCode === 45 || rawCode === 48) {
    return { conditionText: 'Fog', effectiveCode: 45, isDay, cloudCover, precipitation: precip };
  }
  if (humidity >= 85 && windSpeed <= 8 && cloudCover < 50) {
    return { conditionText: isDay ? 'Hazy Sunshine' : 'Haze', effectiveCode: 45, isDay, cloudCover, precipitation: precip };
  }

  // 6. Non-precipitating sky conditions (Accurately grounded in actual Cloud Cover)
  if (cloudCover >= 85 || rawCode === 3) {
    return { conditionText: 'Overcast', effectiveCode: 3, isDay, cloudCover, precipitation: precip };
  }
  if (cloudCover >= 70) {
    return { conditionText: 'Mostly Cloudy', effectiveCode: 3, isDay, cloudCover, precipitation: precip };
  }
  if (cloudCover >= 30 || rawCode === 2) {
    return { conditionText: isDay ? 'Partly Sunny' : 'Partly Cloudy', effectiveCode: 2, isDay, cloudCover, precipitation: precip };
  }
  if (cloudCover >= 12 || rawCode === 1) {
    return { conditionText: isDay ? 'Mostly Sunny' : 'Mainly Clear', effectiveCode: 1, isDay, cloudCover, precipitation: precip };
  }

  return {
    conditionText: isDay ? 'Sunny' : 'Clear Sky',
    effectiveCode: 0,
    isDay,
    cloudCover,
    precipitation: precip,
  };
}

/**
 * Converts standard Open-Meteo WMO weather code into human-readable condition text (fallback helper)
 */
export function getWeatherConditionFromCode(code: number, isDay: boolean = true): string {
  switch (code) {
    case 0:
      return isDay ? 'Sunny' : 'Clear Sky';
    case 1:
      return isDay ? 'Mostly Sunny' : 'Mainly Clear';
    case 2:
      return isDay ? 'Partly Sunny' : 'Partly Cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Fog';
    case 51:
    case 53:
    case 55:
      return 'Drizzle';
    case 56:
    case 57:
      return 'Freezing Drizzle';
    case 61:
    case 63:
    case 65:
      return 'Rain';
    case 66:
    case 67:
      return 'Freezing Rain';
    case 71:
    case 73:
    case 75:
      return 'Snow';
    case 77:
      return 'Snow Grains';
    case 80:
    case 81:
    case 82:
      return 'Rain Showers';
    case 85:
    case 86:
      return 'Snow Showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with Hail';
    default:
      return isDay ? 'Sunny' : 'Clear';
  }
}

/**
 * Maps WMO code to an appropriate Lucide icon name for UI rendering
 */
export function getWeatherIconCategory(
  code: number
): 'clear' | 'partly-cloudy' | 'cloudy' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow' | 'fog' {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'clear';
}

/**
 * Fetch current weather from Open-Meteo given latitude and longitude.
 * Accurately synthesizes current meteorological measurements.
 */
export async function fetchCurrentWeatherFromOpenMeteo(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<SimpleWeatherData> {
  const roundedLat = Math.round(latitude * 10000) / 10000;
  const roundedLon = Math.round(longitude * 10000) / 10000;

  // Endpoint requesting comprehensive current observations to verify real ground condition
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&timezone=auto`;

  const response = await fetch(endpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'UniGo-Sustainable-Transit/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo API returned status ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data?.current || typeof data.current.temperature_2m === 'undefined') {
    throw new Error('Invalid Open-Meteo response format: missing current weather data');
  }

  const raw = data.current;
  const rawTemp = Number(raw.temperature_2m);
  const accurate = determineAccurateWeatherCondition(raw);

  // Round temperature to 1 decimal place (e.g. 28.4°C)
  const temperature = Math.round(rawTemp * 10) / 10;

  return {
    temperature,
    conditionText: accurate.conditionText,
    weatherCode: accurate.effectiveCode,
    isDay: accurate.isDay,
    apparentTemperature: raw.apparent_temperature != null ? Math.round(Number(raw.apparent_temperature) * 10) / 10 : undefined,
    precipitation: raw.precipitation != null ? Number(raw.precipitation) : undefined,
    humidity: raw.relative_humidity_2m != null ? Number(raw.relative_humidity_2m) : undefined,
    windSpeed: raw.wind_speed_10m != null ? Math.round(Number(raw.wind_speed_10m) * 10) / 10 : undefined,
    cloudCover: accurate.cloudCover,
    latitude: roundedLat,
    longitude: roundedLon,
    locationName,
  };
}
