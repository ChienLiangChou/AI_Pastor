const { fetchTimeSeries, UnrecognizedTopicError, SourceUnavailableError } = require('./services/dataSources');

async function testFinanceQuery() {
  console.log('\n=== Testing Finance Query: 台股加權指數 ===');
  try {
    const result = await fetchTimeSeries({ 
      query: '台股加權指數', 
      horizonDays: 30 
    });
    
    console.log('✅ Query:', result.query);
    console.log('✅ Classification:', result.classification);
    console.log('✅ Requested horizon:', result.horizonDays);
    console.log('✅ Actual data points:', result.actualDataPoints);
    console.log('✅ First data point:', result.data[0]);
    console.log('✅ Last data point:', result.data[result.data.length - 1]);
    console.log('✅ Metadata:', JSON.stringify(result.metadata, null, 2));
    
    if (result.actualDataPoints >= 60) {
      console.log('✅ SUCCESS: Got at least 60 data points (2x horizon)');
    } else {
      console.log(`⚠️  WARNING: Only got ${result.actualDataPoints} data points, expected at least 60`);
    }
    
    return true;
  } catch (error) {
    if (error.code === 'UNRECOGNIZED_TOPIC') {
      console.error('❌ FAILED: Topic not recognized');
    } else if (error.code === 'SOURCE_UNAVAILABLE') {
      console.error('❌ FAILED: Data source unavailable');
    } else {
      console.error('❌ FAILED:', error.message);
    }
    console.error(error);
    return false;
  }
}

async function testWeatherQuery() {
  console.log('\n=== Testing Weather Query: 台北氣溫 ===');
  try {
    const result = await fetchTimeSeries({ 
      query: '台北氣溫', 
      horizonDays: 14 
    });
    
    console.log('✅ Query:', result.query);
    console.log('✅ Classification:', result.classification);
    console.log('✅ Requested horizon:', result.horizonDays);
    console.log('✅ Actual data points:', result.actualDataPoints);
    console.log('✅ First data point:', result.data[0]);
    console.log('✅ Last data point:', result.data[result.data.length - 1]);
    console.log('✅ Metadata:', JSON.stringify(result.metadata, null, 2));
    
    if (result.metadata.lat && result.metadata.lon) {
      console.log(`✅ SUCCESS: Got location data (lat: ${result.metadata.lat}, lon: ${result.metadata.lon})`);
    } else {
      console.log('⚠️  WARNING: Missing location data');
    }
    
    if (result.metadata.units === '°C') {
      console.log('✅ SUCCESS: Temperature in Celsius');
    } else {
      console.log('⚠️  WARNING: Unexpected temperature unit:', result.metadata.units);
    }
    
    if (result.actualDataPoints >= 28) {
      console.log('✅ SUCCESS: Got at least 28 data points (2x horizon)');
    } else {
      console.log(`⚠️  WARNING: Only got ${result.actualDataPoints} data points, expected at least 28`);
    }
    
    return true;
  } catch (error) {
    if (error.code === 'UNRECOGNIZED_TOPIC') {
      console.error('❌ FAILED: Topic not recognized');
    } else if (error.code === 'SOURCE_UNAVAILABLE') {
      console.error('❌ FAILED: Data source unavailable');
    } else {
      console.error('❌ FAILED:', error.message);
    }
    console.error(error);
    return false;
  }
}

async function testUnrecognizedQuery() {
  console.log('\n=== Testing Unrecognized Query: random gibberish ===');
  try {
    await fetchTimeSeries({ 
      query: 'asdfghjkl random gibberish xyz123', 
      horizonDays: 10 
    });
    
    console.error('❌ FAILED: Should have thrown UnrecognizedTopicError');
    return false;
  } catch (error) {
    if (error.code === 'UNRECOGNIZED_TOPIC') {
      console.log('✅ SUCCESS: Correctly threw UnrecognizedTopicError');
      console.log('   Error message:', error.message);
      return true;
    } else {
      console.error('❌ FAILED: Wrong error type:', error.code);
      return false;
    }
  }
}

async function testErrorDifferentiation() {
  console.log('\n=== Testing Error Differentiation ===');
  
  console.log('Testing UnrecognizedTopicError...');
  try {
    await fetchTimeSeries({ query: 'completely unrelated topic xyz', horizonDays: 10 });
    console.error('❌ Should have thrown UnrecognizedTopicError');
  } catch (error) {
    if (error instanceof UnrecognizedTopicError) {
      console.log('✅ Correctly identified as UnrecognizedTopicError');
    } else {
      console.error('❌ Wrong error type');
    }
  }
  
  return true;
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Data Sources Test Suite                 ║');
  console.log('╚════════════════════════════════════════════╝');
  
  const results = [];
  
  results.push(await testFinanceQuery());
  results.push(await testWeatherQuery());
  results.push(await testUnrecognizedQuery());
  results.push(await testErrorDifferentiation());
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Test Summary                             ║');
  console.log('╚════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\nTests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
