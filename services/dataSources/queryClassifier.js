const { search } = require('duck-duck-scrape');

const FINANCE_KEYWORDS = [
  // English
  'stock', 'stocks', 'share', 'shares', 'index', 'indices', 'market', 'nasdaq',
  'dow', 'sp500', 's&p', 'ftse', 'dax', 'nikkei', 'equity', 'equities',
  'ticker', 'trading', 'exchange', 'tsx', 'asx', 'hsi', 'kospi',
  // Chinese Traditional
  '股票', '股市', '股價', '指數', '加權', '上市', '上櫃', '台股', '美股',
  '港股', '陸股', '日股', '韓股', '盤勢', '大盤', '個股', '證券',
  '交易所', '櫃買', '恆生', '日經', '那斯達克', '道瓊', '標普',
  // Chinese Simplified
  '股票', '股市', '股价', '指数', '上市', '上柜', '台股', '美股',
  '港股', '陆股', '日股', '韩股', '盘势', '大盘', '个股', '证券'
];

const WEATHER_KEYWORDS = [
  // English
  'weather', 'temperature', 'temp', 'celsius', 'fahrenheit', 'rainfall',
  'precipitation', 'humidity', 'wind', 'forecast', 'climate', 'hot', 'cold',
  'sunny', 'cloudy', 'rain', 'snow', 'storm', 'degrees',
  // Chinese Traditional
  '天氣', '氣溫', '溫度', '降雨', '雨量', '濕度', '風速', '預報',
  '氣候', '熱', '冷', '晴', '陰', '雨', '雪', '暴風', '攝氏', '華氏',
  // Chinese Simplified
  '天气', '气温', '温度', '降雨', '雨量', '湿度', '风速', '预报',
  '气候', '热', '冷', '晴', '阴', '雨', '雪', '暴风', '摄氏', '华氏'
];

const LOCATION_KEYWORDS = [
  // Major cities - English
  'taipei', 'tokyo', 'beijing', 'shanghai', 'hong kong', 'seoul',
  'singapore', 'bangkok', 'hanoi', 'manila', 'jakarta', 'kuala lumpur',
  'new york', 'london', 'paris', 'berlin', 'sydney', 'toronto',
  // Major cities - Chinese Traditional
  '台北', '台中', '台南', '高雄', '新北', '桃園', '台灣',
  '東京', '北京', '上海', '香港', '首爾', '新加坡', '曼谷',
  '河內', '馬尼拉', '雅加達', '吉隆坡', '紐約', '倫敦', '巴黎',
  // Major cities - Chinese Simplified
  '台北', '台中', '台南', '高雄', '新北', '桃园', '台湾',
  '东京', '北京', '上海', '香港', '首尔', '新加坡', '曼谷',
  '河内', '马尼拉', '雅加达', '吉隆坡', '纽约', '伦敦', '巴黎'
];

function containsKeywords(query, keywords) {
  const lowerQuery = query.toLowerCase();
  return keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
}

async function classifyWithWebSearch(query) {
  try {
    const searchResults = await search(query, {
      safeSearch: 0,
      locale: 'wt-wt'
    });

    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
      return null;
    }

    const snippets = searchResults.results
      .slice(0, 5)
      .map(r => (r.title + ' ' + r.description).toLowerCase())
      .join(' ');

    if (containsKeywords(snippets, FINANCE_KEYWORDS)) {
      return 'finance';
    }

    if (containsKeywords(snippets, WEATHER_KEYWORDS) || containsKeywords(snippets, LOCATION_KEYWORDS)) {
      return 'weather';
    }

    return null;
  } catch (error) {
    console.warn('Web search classification failed:', error.message);
    return null;
  }
}

async function classifyQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const hasFinanceKeywords = containsKeywords(query, FINANCE_KEYWORDS);
  const hasWeatherKeywords = containsKeywords(query, WEATHER_KEYWORDS);
  const hasLocationKeywords = containsKeywords(query, LOCATION_KEYWORDS);

  if (hasFinanceKeywords && !hasWeatherKeywords) {
    return 'finance';
  }

  if ((hasWeatherKeywords || hasLocationKeywords) && !hasFinanceKeywords) {
    return 'weather';
  }

  const webClassification = await classifyWithWebSearch(query);
  if (webClassification) {
    return webClassification;
  }

  return 'unknown';
}

module.exports = {
  classifyQuery,
  FINANCE_KEYWORDS,
  WEATHER_KEYWORDS,
  LOCATION_KEYWORDS
};
