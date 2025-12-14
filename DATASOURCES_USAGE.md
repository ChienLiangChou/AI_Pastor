# Data Sources Usage Guide

This guide explains how to use the time-series data sources feature.

## Overview

The data sources module allows you to fetch time-series data for finance and weather queries. It automatically classifies queries, fetches data from appropriate sources, and returns normalized data with metadata.

## Installation

The required dependencies are already installed:

```bash
npm install
```

## Basic Usage

```javascript
const { fetchTimeSeries } = require('./services/dataSources');

// Fetch finance data
const financeData = await fetchTimeSeries({ 
  query: '台股加權指數', 
  horizonDays: 30 
});

// Fetch weather data
const weatherData = await fetchTimeSeries({ 
  query: '台北氣溫', 
  horizonDays: 14 
});
```

## API Reference

### `fetchTimeSeries({ query, horizonDays })`

Fetches time-series data based on the query.

**Parameters:**
- `query` (string): The query string (e.g., "台股加權指數", "台北氣溫")
- `horizonDays` (number): Number of days to fetch (will return at least 2× this amount)

**Returns:**
```javascript
{
  query: string,              // Original query
  classification: string,     // 'finance' or 'weather'
  horizonDays: number,        // Requested horizon
  actualDataPoints: number,   // Actual number of data points returned
  data: [                     // Array of data points
    {
      timestamp: string,      // ISO 8601 format
      value: number,          // Numeric value
      interpolated?: boolean  // True if data was interpolated
    },
    ...
  ],
  metadata: {
    source: string,           // Data source identifier
    fetchedAt: string,        // ISO 8601 timestamp
    classification: string,   // Same as top-level classification
    // Additional fields vary by source type
  }
}
```

## Supported Queries

### Finance Queries

Supports major stock indices and stocks:

**Asian Markets:**
- 台股加權指數, 台股 (Taiwan Weighted Index, ^TWII)
- 上證指數 (Shanghai Composite, 000001.SS)
- 深證成指 (Shenzhen Composite, 399001.SZ)
- 恆生指數 (Hang Seng Index, ^HSI)
- 日經指數 (Nikkei 225, ^N225)
- 韓國綜合指數 (KOSPI, ^KS11)

**US Markets:**
- NASDAQ (^IXIC)
- Dow Jones (^DJI)
- S&P 500 (^GSPC)

**European Markets:**
- FTSE 100 (^FTSE)
- DAX (^GDAXI)
- CAC 40 (^FCHI)

**Finance Metadata:**
```javascript
{
  source: 'yahoo-finance',
  symbol: '^TWII',
  units: 'points',
  frequency: 'daily',
  query: '台股加權指數',
  dataPoints: 60,
  requestedHorizon: 30
}
```

### Weather Queries

Supports major cities worldwide:

**Taiwan:**
- 台北, 台中, 台南, 高雄, 新北, 桃園

**Asia:**
- 東京, 北京, 上海, 香港, 首爾, 新加坡

**Global:**
- 紐約, 倫敦, 巴黎, 柏林, 雪梨

**Weather Metadata:**
```javascript
{
  source: 'weather-api',
  location: 'Taipei',
  lat: 25.033,
  lon: 121.5654,
  units: '°C',
  frequency: 'daily',
  query: '台北氣溫',
  dataPoints: 28,
  requestedHorizon: 14,
  synthetic: false
}
```

## Error Handling

The module throws two types of errors:

### 1. UnrecognizedTopicError

Thrown when the query cannot be classified as finance or weather.

```javascript
try {
  await fetchTimeSeries({ query: 'random text', horizonDays: 10 });
} catch (error) {
  if (error.code === 'UNRECOGNIZED_TOPIC') {
    // Handle unrecognized topic
    console.log('Cannot determine query type');
    // Return 400 Bad Request
  }
}
```

### 2. SourceUnavailableError

Thrown when the data source is temporarily unavailable (network issues, API limits, etc.).

```javascript
try {
  await fetchTimeSeries({ query: '台股加權指數', horizonDays: 30 });
} catch (error) {
  if (error.code === 'SOURCE_UNAVAILABLE') {
    // Handle transient failure
    console.log('Data source temporarily unavailable');
    // Return 503 Service Unavailable
  }
}
```

## Environment Variables

Optional environment variables can be configured in `.env`:

```bash
# Alpha Vantage API Key (optional, for enhanced financial data)
ALPHAVANTAGE_KEY=your_alpha_vantage_api_key

# Weather API Key (optional, for enhanced weather data)
WEATHER_API_KEY=your_weather_api_key

# Default location for weather queries (optional)
DEFAULT_LOCATION=taipei
```

**Note:** The system works without these keys:
- Finance data uses Yahoo Finance (no key required)
- Weather data uses Open-Meteo free API as default

## Examples

### Example 1: Finance Query

```javascript
const { fetchTimeSeries } = require('./services/dataSources');

async function getStockData() {
  try {
    const result = await fetchTimeSeries({ 
      query: '台股加權指數', 
      horizonDays: 30 
    });
    
    console.log(`Classification: ${result.classification}`);
    console.log(`Data points: ${result.actualDataPoints}`);
    console.log(`Symbol: ${result.metadata.symbol}`);
    console.log(`Latest value: ${result.data[result.data.length - 1].value}`);
    
    return result;
  } catch (error) {
    if (error.code === 'UNRECOGNIZED_TOPIC') {
      console.error('Query not recognized');
    } else if (error.code === 'SOURCE_UNAVAILABLE') {
      console.error('Data source unavailable');
    }
    throw error;
  }
}

getStockData();
```

### Example 2: Weather Query

```javascript
const { fetchTimeSeries } = require('./services/dataSources');

async function getWeatherData() {
  try {
    const result = await fetchTimeSeries({ 
      query: '台北氣溫', 
      horizonDays: 14 
    });
    
    console.log(`Location: ${result.metadata.location}`);
    console.log(`Coordinates: ${result.metadata.lat}, ${result.metadata.lon}`);
    console.log(`Data points: ${result.actualDataPoints}`);
    
    const avgTemp = result.data.reduce((sum, d) => sum + d.value, 0) / result.data.length;
    console.log(`Average temperature: ${avgTemp.toFixed(1)}${result.metadata.units}`);
    
    return result;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw error;
  }
}

getWeatherData();
```

### Example 3: Express API Endpoint

```javascript
const express = require('express');
const { fetchTimeSeries, UnrecognizedTopicError, SourceUnavailableError } = require('./services/dataSources');

const app = express();

app.get('/api/timeseries', async (req, res) => {
  const { query, horizonDays } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  const horizon = parseInt(horizonDays) || 30;
  
  try {
    const result = await fetchTimeSeries({ query, horizonDays: horizon });
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof UnrecognizedTopicError) {
      res.status(400).json({ 
        error: 'Unrecognized topic', 
        message: error.message 
      });
    } else if (error instanceof SourceUnavailableError) {
      res.status(503).json({ 
        error: 'Service unavailable', 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Testing

Run the test suite:

```bash
npm run test:datasources
```

The test suite verifies:
1. Finance queries return ≥60 data points for 30-day horizon
2. Weather queries return ≥28 data points for 14-day horizon with lat/lon
3. Unrecognized queries throw UnrecognizedTopicError
4. Error types are correctly differentiated

## Data Quality

### Data Fetching Strategy

- The system fetches at least **2× the requested horizon** to ensure sufficient data
- For finance: Fetches `horizonDays * 2` trading days
- For weather: Fetches `horizonDays * 2` calendar days

### Data Normalization

All data is normalized to:
```javascript
{
  timestamp: string,  // ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
  value: number,      // Numeric value (always a number)
  interpolated?: boolean  // Optional flag for interpolated data
}
```

### Units Consistency

- **Finance**: Always in index points or stock price
- **Weather**: Always in Celsius (°C)

### Interpolation

If insufficient data is available, the system will:
1. Use available historical data
2. Interpolate missing points using the last known value (finance) or average (weather)
3. Mark interpolated points with `interpolated: true` flag

## Limitations

1. **Finance Data**
   - Limited to daily frequency
   - Depends on Yahoo Finance availability
   - Some indices may have delayed data

2. **Weather Data**
   - Historical data only (no future forecasts in default mode)
   - Free APIs may have rate limits
   - Synthetic data used as fallback if all APIs fail

3. **Query Classification**
   - Uses keyword matching + web search
   - May fail for ambiguous queries
   - DuckDuckGo rate limits may affect classification

## Troubleshooting

### "UNRECOGNIZED_TOPIC" Error

**Cause:** Query doesn't match finance or weather keywords

**Solution:**
- Make query more specific (e.g., "台股加權指數" instead of "股票")
- Include location name for weather (e.g., "台北氣溫" instead of "天氣")

### "SOURCE_UNAVAILABLE" Error

**Cause:** Data source is down or rate-limited

**Solution:**
- Retry after a short delay
- Check internet connectivity
- Verify API keys if using optional services

### Low Data Point Count

**Cause:** Insufficient historical data available

**Solution:**
- Reduce `horizonDays` parameter
- Check if symbol/location is correct
- System will interpolate if necessary

## Support

For issues or questions:
1. Check this guide first
2. Run the test suite: `npm run test:datasources`
3. Review error messages and codes
4. Check console logs for detailed error information
