const YahooFinanceAPI = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceAPI({ suppressNotices: ['ripHistorical'] });

const SYMBOL_MAP = {
  '台股加權指數': '^TWII',
  '台股加权指数': '^TWII',
  '台股': '^TWII',
  'taiwan stock index': '^TWII',
  'twii': '^TWII',
  'taiwan weighted': '^TWII',
  
  '上證指數': '000001.SS',
  '上证指数': '000001.SS',
  'shanghai composite': '000001.SS',
  'shanghai index': '000001.SS',
  'sse': '000001.SS',
  
  '深證成指': '399001.SZ',
  '深证成指': '399001.SZ',
  'shenzhen composite': '399001.SZ',
  'shenzhen index': '399001.SZ',
  'szse': '399001.SZ',
  
  '恆生指數': '^HSI',
  '恒生指数': '^HSI',
  'hang seng': '^HSI',
  'hang seng index': '^HSI',
  'hsi': '^HSI',
  
  '日經指數': '^N225',
  '日经指数': '^N225',
  'nikkei': '^N225',
  'nikkei 225': '^N225',
  
  '韓國綜合指數': '^KS11',
  '韩国综合指数': '^KS11',
  'kospi': '^KS11',
  'korea composite': '^KS11',
  
  'nasdaq': '^IXIC',
  '那斯達克': '^IXIC',
  '那斯达克': '^IXIC',
  
  'dow': '^DJI',
  'dow jones': '^DJI',
  '道瓊': '^DJI',
  '道琼': '^DJI',
  
  's&p 500': '^GSPC',
  'sp500': '^GSPC',
  's&p500': '^GSPC',
  '標普500': '^GSPC',
  '标普500': '^GSPC',
  
  'ftse': '^FTSE',
  'ftse 100': '^FTSE',
  
  'dax': '^GDAXI',
  
  'cac 40': '^FCHI',
  
  'nifty': '^NSEI',
  'nifty 50': '^NSEI'
};

function extractSymbol(query) {
  const lowerQuery = query.toLowerCase().trim();
  
  for (const [key, symbol] of Object.entries(SYMBOL_MAP)) {
    if (lowerQuery.includes(key.toLowerCase())) {
      return symbol;
    }
  }
  
  const symbolPattern = /\b([A-Z]{1,5})\b/;
  const match = query.match(symbolPattern);
  if (match) {
    return match[1];
  }
  
  return '^TWII';
}

async function fetchFinanceData(query, horizonDays) {
  const symbol = extractSymbol(query);
  const dataPoints = horizonDays * 2;
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dataPoints - 30);
  
  try {
    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    if (!result || result.length === 0) {
      const error = new Error(`No data available for symbol: ${symbol}`);
      error.code = 'SOURCE_UNAVAILABLE';
      throw error;
    }
    
    const normalized = result
      .filter(item => item.close != null)
      .map(item => ({
        timestamp: item.date.toISOString(),
        value: Number(item.close)
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (normalized.length < horizonDays) {
      console.warn(`Only ${normalized.length} data points available for ${symbol}, requested ${horizonDays}`);
    }
    
    const latestDataPoints = normalized.slice(-dataPoints);
    
    return {
      data: latestDataPoints,
      metadata: {
        source: 'yahoo-finance',
        symbol: symbol,
        units: 'points',
        frequency: 'daily',
        query: query,
        dataPoints: latestDataPoints.length,
        requestedHorizon: horizonDays
      }
    };
    
  } catch (error) {
    if (error.code === 'SOURCE_UNAVAILABLE') {
      throw error;
    }
    
    const wrappedError = new Error(`Failed to fetch finance data: ${error.message}`);
    wrappedError.code = 'SOURCE_UNAVAILABLE';
    wrappedError.originalError = error;
    throw wrappedError;
  }
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
    
    interpolated.push({
      timestamp: lastTimestamp.toISOString(),
      value: lastValue.value,
      interpolated: true
    });
  }
  
  return interpolated;
}

module.exports = {
  fetchFinanceData,
  interpolateData,
  extractSymbol,
  SYMBOL_MAP
};
