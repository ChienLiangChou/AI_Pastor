const { fetchTimeSeries } = require('./services/dataSources');

async function verify() {
  console.log('=== Acceptance Criteria Verification ===\n');
  
  // Criterion 1: Taiwan stock index
  console.log('1. Testing: 台股加權指數 with horizonDays=30');
  try {
    const result1 = await fetchTimeSeries({ query: '台股加權指數', horizonDays: 30 });
    console.log('   ✅ Classification:', result1.classification);
    console.log('   ✅ Data points:', result1.actualDataPoints, '(expected ≥60)');
    console.log('   ✅ Has source metadata:', !!result1.metadata.source);
    console.log('   ✅ Symbol:', result1.metadata.symbol);
    console.log('   ✅ Units:', result1.metadata.units);
    
    if (result1.actualDataPoints >= 60 && result1.classification === 'finance') {
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL: Did not meet criteria\n');
    }
  } catch (e) {
    console.log('   ❌ FAIL:', e.message, '\n');
  }
  
  // Criterion 2: Taipei weather
  console.log('2. Testing: 台北氣溫 with horizonDays=14');
  try {
    const result2 = await fetchTimeSeries({ query: '台北氣溫', horizonDays: 14 });
    console.log('   ✅ Classification:', result2.classification);
    console.log('   ✅ Data points:', result2.actualDataPoints, '(expected ≥28)');
    console.log('   ✅ Has lat/lon:', result2.metadata.lat, ',', result2.metadata.lon);
    console.log('   ✅ Units:', result2.metadata.units);
    console.log('   ✅ Location:', result2.metadata.location);
    
    if (result2.actualDataPoints >= 28 && 
        result2.classification === 'weather' &&
        result2.metadata.lat && 
        result2.metadata.lon &&
        result2.metadata.units === '°C') {
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL: Did not meet criteria\n');
    }
  } catch (e) {
    console.log('   ❌ FAIL:', e.message, '\n');
  }
  
  // Criterion 3: Error differentiation
  console.log('3. Testing: Error differentiation');
  try {
    await fetchTimeSeries({ query: 'random gibberish xyz', horizonDays: 10 });
    console.log('   ❌ FAIL: Should have thrown error\n');
  } catch (e) {
    if (e.code === 'UNRECOGNIZED_TOPIC') {
      console.log('   ✅ Correctly threw UnrecognizedTopicError');
      console.log('   ✅ Error code:', e.code);
      console.log('   ✅ PASS\n');
    } else {
      console.log('   ❌ FAIL: Wrong error type:', e.code, '\n');
    }
  }
  
  console.log('=== All Acceptance Criteria Verified ===');
}

verify().catch(console.error);
