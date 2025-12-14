const { classifyQuery } = require('./queryClassifier');
const { fetchFinanceData, interpolateData: interpolateFinance } = require('./financeSource');
const { fetchWeatherData, interpolateData: interpolateWeather } = require('./weatherSource');

class UnrecognizedTopicError extends Error {
  constructor(message, query) {
    super(message);
    this.name = 'UnrecognizedTopicError';
    this.code = 'UNRECOGNIZED_TOPIC';
    this.query = query;
  }
}

class SourceUnavailableError extends Error {
  constructor(message, source, originalError) {
    super(message);
    this.name = 'SourceUnavailableError';
    this.code = 'SOURCE_UNAVAILABLE';
    this.source = source;
    this.originalError = originalError;
  }
}

async function fetchTimeSeries({ query, horizonDays = 30 }) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new UnrecognizedTopicError('Query must be a non-empty string', query);
  }
  
  if (!Number.isInteger(horizonDays) || horizonDays <= 0) {
    throw new Error('horizonDays must be a positive integer');
  }
  
  let classification;
  try {
    classification = await classifyQuery(query);
  } catch (error) {
    console.error('Query classification failed:', error);
    throw new UnrecognizedTopicError(
      `Failed to classify query: ${error.message}`,
      query
    );
  }
  
  if (classification === 'unknown') {
    throw new UnrecognizedTopicError(
      `Unable to recognize the topic of query: "${query}". Please try a finance or weather related query.`,
      query
    );
  }
  
  let result;
  try {
    if (classification === 'finance') {
      result = await fetchFinanceData(query, horizonDays);
      
      if (result.data.length < horizonDays) {
        console.warn(`Interpolating finance data from ${result.data.length} to ${horizonDays} points`);
        result.data = interpolateFinance(result.data, horizonDays);
      }
      
    } else if (classification === 'weather') {
      result = await fetchWeatherData(query, horizonDays);
      
      if (result.data.length < horizonDays) {
        console.warn(`Interpolating weather data from ${result.data.length} to ${horizonDays} points`);
        result.data = interpolateWeather(result.data, horizonDays);
      }
      
    } else {
      throw new UnrecognizedTopicError(
        `Unsupported classification: ${classification}`,
        query
      );
    }
    
  } catch (error) {
    if (error.code === 'UNRECOGNIZED_TOPIC') {
      throw error;
    }
    
    if (error.code === 'SOURCE_UNAVAILABLE') {
      throw new SourceUnavailableError(
        `Data source temporarily unavailable: ${error.message}`,
        classification,
        error
      );
    }
    
    throw new SourceUnavailableError(
      `Failed to fetch ${classification} data: ${error.message}`,
      classification,
      error
    );
  }
  
  if (!result || !result.data || result.data.length === 0) {
    throw new SourceUnavailableError(
      `No data returned for query: "${query}"`,
      classification,
      null
    );
  }
  
  return {
    query: query,
    classification: classification,
    horizonDays: horizonDays,
    actualDataPoints: result.data.length,
    data: result.data,
    metadata: {
      ...result.metadata,
      fetchedAt: new Date().toISOString(),
      classification: classification
    }
  };
}

module.exports = {
  fetchTimeSeries,
  UnrecognizedTopicError,
  SourceUnavailableError
};
