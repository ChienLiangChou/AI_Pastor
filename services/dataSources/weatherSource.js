const axios = require('axios');

const LOCATION_MAP = {
  '台北': { lat: 25.0330, lon: 121.5654, name: 'Taipei' },
  'taipei': { lat: 25.0330, lon: 121.5654, name: 'Taipei' },
  
  '台中': { lat: 24.1477, lon: 120.6736, name: 'Taichung' },
  'taichung': { lat: 24.1477, lon: 120.6736, name: 'Taichung' },
  
  '台南': { lat: 22.9997, lon: 120.2270, name: 'Tainan' },
  'tainan': { lat: 22.9997, lon: 120.2270, name: 'Tainan' },
  
  '高雄': { lat: 22.6273, lon: 120.3014, name: 'Kaohsiung' },
  'kaohsiung': { lat: 22.6273, lon: 120.3014, name: 'Kaohsiung' },
  
  '新北': { lat: 25.0120, lon: 121.4659, name: 'New Taipei' },
  'new taipei': { lat: 25.0120, lon: 121.4659, name: 'New Taipei' },
  
  '桃園': { lat: 24.9937, lon: 121.3010, name: 'Taoyuan' },
  '桃园': { lat: 24.9937, lon: 121.3010, name: 'Taoyuan' },
  'taoyuan': { lat: 24.9937, lon: 121.3010, name: 'Taoyuan' },
  
  '東京': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  '东京': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  
  '北京': { lat: 39.9042, lon: 116.4074, name: 'Beijing' },
  'beijing': { lat: 39.9042, lon: 116.4074, name: 'Beijing' },
  
  '上海': { lat: 31.2304, lon: 121.4737, name: 'Shanghai' },
  'shanghai': { lat: 31.2304, lon: 121.4737, name: 'Shanghai' },
  
  '香港': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong' },
  'hong kong': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong' },
  
  '首爾': { lat: 37.5665, lon: 126.9780, name: 'Seoul' },
  '首尔': { lat: 37.5665, lon: 126.9780, name: 'Seoul' },
  'seoul': { lat: 37.5665, lon: 126.9780, name: 'Seoul' },
  
  '新加坡': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  
  '紐約': { lat: 40.7128, lon: -74.0060, name: 'New York' },
  '纽约': { lat: 40.7128, lon: -74.0060, name: 'New York' },
  'new york': { lat: 40.7128, lon: -74.0060, name: 'New York' },
  
  '倫敦': { lat: 51.5074, lon: -0.1278, name: 'London' },
  '伦敦': { lat: 51.5074, lon: -0.1278, name: 'London' },
  'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
  
  '巴黎': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  
  '柏林': { lat: 52.5200, lon: 13.4050, name: 'Berlin' },
  'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin' },
  
  '雪梨': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  '悉尼': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' }
};

function extractLocation(query) {
  const lowerQuery = query.toLowerCase().trim();
  
  for (const [key, location] of Object.entries(LOCATION_MAP)) {
    if (lowerQuery.includes(key.toLowerCase())) {
      return location;
    }
  }
  
  const defaultLocation = process.env.DEFAULT_LOCATION || 'taipei';
  return LOCATION_MAP[defaultLocation.toLowerCase()] || LOCATION_MAP['taipei'];
}

async function fetchWeatherFromOpenMeteo(lat, lon, horizonDays) {
  const dataPoints = horizonDays * 2;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dataPoints);
  const endDate = new Date();
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        daily: 'temperature_2m_mean',
        start_date: startDateStr,
        end_date: endDateStr,
        timezone: 'auto'
      },
      timeout: 10000
    });
    
    if (!response.data || !response.data.daily) {
      return null;
    }
    
    const { time, temperature_2m_mean } = response.data.daily;
    
    if (!time || !temperature_2m_mean) {
      return null;
    }
    
    return time.map((date, index) => ({
      timestamp: new Date(date).toISOString(),
      value: Number(temperature_2m_mean[index])
    }));
    
  } catch (error) {
    console.warn('Open-Meteo API failed:', error.message);
    return null;
  }
}

async function fetchWeatherFromWeatherAPI(lat, lon, horizonDays) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  const dataPoints = Math.min(horizonDays * 2, 14);
  
  try {
    const response = await axios.get('http://api.weatherapi.com/v1/history.json', {
      params: {
        key: apiKey,
        q: `${lat},${lon}`,
        days: dataPoints
      },
      timeout: 10000
    });
    
    if (!response.data || !response.data.forecast || !response.data.forecast.forecastday) {
      return null;
    }
    
    return response.data.forecast.forecastday.map(day => ({
      timestamp: new Date(day.date).toISOString(),
      value: Number(day.day.avgtemp_c)
    }));
    
  } catch (error) {
    console.warn('WeatherAPI failed:', error.message);
    return null;
  }
}

function generateSyntheticWeatherData(lat, lon, horizonDays) {
  const dataPoints = horizonDays * 2;
  const baseTemp = 15 + (lat > 0 ? -lat / 4 : lat / 4);
  const seasonalOffset = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 10;
  
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dataPoints);
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const dailyVariation = Math.sin((i / 7) * 2 * Math.PI) * 3;
    const randomNoise = (Math.random() - 0.5) * 2;
    const temperature = baseTemp + seasonalOffset + dailyVariation + randomNoise;
    
    data.push({
      timestamp: date.toISOString(),
      value: Number(temperature.toFixed(2)),
      synthetic: true
    });
  }
  
  return data;
}

async function fetchWeatherData(query, horizonDays) {
  const location = extractLocation(query);
  const { lat, lon, name } = location;
  
  let data = await fetchWeatherFromOpenMeteo(lat, lon, horizonDays);
  
  if (!data || data.length === 0) {
    data = await fetchWeatherFromWeatherAPI(lat, lon, horizonDays);
  }
  
  if (!data || data.length === 0) {
    console.warn('All weather APIs failed, using synthetic data');
    data = generateSyntheticWeatherData(lat, lon, horizonDays);
  }
  
  const dataPoints = horizonDays * 2;
  const normalizedData = data
    .filter(item => item.value != null && !isNaN(item.value))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-dataPoints);
  
  if (normalizedData.length === 0) {
    const error = new Error(`No weather data available for location: ${name}`);
    error.code = 'SOURCE_UNAVAILABLE';
    throw error;
  }
  
  return {
    data: normalizedData,
    metadata: {
      source: 'weather-api',
      location: name,
      lat: lat,
      lon: lon,
      units: '°C',
      frequency: 'daily',
      query: query,
      dataPoints: normalizedData.length,
      requestedHorizon: horizonDays,
      synthetic: normalizedData[0]?.synthetic || false
    }
  };
}

function interpolateData(data, targetPoints) {
  if (data.length >= targetPoints) {
    return data.slice(-targetPoints);
  }
  
  if (data.length === 0) {
    return [];
  }
  
  const interpolated = [...data];
  
  while (interpolated.length < targetPoints && interpolated.length > 0) {
    const lastValue = interpolated[interpolated.length - 1];
    const lastTimestamp = new Date(lastValue.timestamp);
    lastTimestamp.setDate(lastTimestamp.getDate() + 1);
    
    const avgValue = interpolated.reduce((sum, item) => sum + item.value, 0) / interpolated.length;
    
    interpolated.push({
      timestamp: lastTimestamp.toISOString(),
      value: Number(avgValue.toFixed(2)),
      interpolated: true
    });
  }
  
  return interpolated;
}

module.exports = {
  fetchWeatherData,
  interpolateData,
  extractLocation,
  LOCATION_MAP
};
