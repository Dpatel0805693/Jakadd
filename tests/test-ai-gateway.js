// test-ai-gateway.js - Integration tests for AI Gateway
// Tests all AI endpoints with real data

const http = require('http');

const AI_GATEWAY_URL = 'http://localhost:8001';

// Test data
const testData = {
  columns: ['age', 'income', 'education', 'employed'],
  sample: [
    { age: 25, income: 45000, education: 'Bachelor', employed: 1 },
    { age: 30, income: 60000, education: 'Master', employed: 1 },
    { age: 35, income: 55000, education: 'Bachelor', employed: 1 },
    { age: 28, income: 50000, education: 'PhD', employed: 0 },
    { age: 40, income: 75000, education: 'Master', employed: 1 }
  ]
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, AI_GATEWAY_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Tests
async function runTests() {
  console.log('\n🤖 AI GATEWAY INTEGRATION TESTS\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  try {
    console.log('\n[Test 1] Health Check');
    const result = await makeRequest('GET', '/ping');
    
    if (result.statusCode === 200 && result.data.status === 'healthy') {
      console.log('  ✅ PASSED - Service is healthy');
      console.log(`     Budget: $${result.data.budget.spent_this_month}/$${result.data.budget.monthly_limit}`);
      passed++;
    } else {
      console.log('  ❌ FAILED - Unexpected response:', result);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAILED - Error:', error.message);
    failed++;
  }

  // Test 2: Detect Variable Types
  try {
    console.log('\n[Test 2] Detect Variable Types');
    const result = await makeRequest('POST', '/detect-types', testData);
    
    if (result.statusCode === 200 && result.data.ok && result.data.variables) {
      console.log('  ✅ PASSED - Variable types detected');
      console.log(`     Variables analyzed: ${result.data.variables.length}`);
      result.data.variables.forEach(v => {
        console.log(`     - ${v.name}: ${v.type} (${v.suggested_role})`);
      });
      console.log(`     Cost: $${result.data.cost.toFixed(4)}`);
      passed++;
    } else {
      console.log('  ❌ FAILED - Unexpected response:', result);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAILED - Error:', error.message);
    failed++;
  }

  // Test 3: Suggest Model
  try {
    console.log('\n[Test 3] Suggest Model');
    const modelRequest = {
      dependentVar: { name: 'employed', type: 'binary' },
      independentVars: [
        { name: 'age', type: 'continuous' },
        { name: 'income', type: 'continuous' },
        { name: 'education', type: 'categorical' }
      ]
    };
    
    const result = await makeRequest('POST', '/suggest-model', modelRequest);
    
    if (result.statusCode === 200 && result.data.ok && result.data.model) {
      console.log('  ✅ PASSED - Model suggested');
      console.log(`     Recommended: ${result.data.model.toUpperCase()}`);
      console.log(`     Confidence: ${result.data.confidence}`);
      console.log(`     Formula: ${result.data.formula_template}`);
      console.log(`     Cost: $${result.data.cost.toFixed(4)}`);
      passed++;
    } else {
      console.log('  ❌ FAILED - Unexpected response:', result);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAILED - Error:', error.message);
    failed++;
  }

  // Test 4: Interpret Results (OLS)
  try {
    console.log('\n[Test 4] Interpret OLS Results');
    const interpretRequest = {
      model_type: 'ols',
      formula: 'mpg ~ hp + wt',
      results: {
        tidy: [
          { 
            term: '(Intercept)', 
            estimate: 37.227, 
            'std.error': 1.598, 
            statistic: 23.285, 
            'p.value': 0.000 
          },
          { 
            term: 'hp', 
            estimate: -0.032, 
            'std.error': 0.009, 
            statistic: -3.519, 
            'p.value': 0.001 
          },
          { 
            term: 'wt', 
            estimate: -3.878, 
            'std.error': 0.633, 
            statistic: -6.129, 
            'p.value': 0.000 
          }
        ],
        glance: {
          'r.squared': 0.827,
          'adj.r.squared': 0.815,
          sigma: 2.593,
          statistic: 69.211,
          'p.value': 0.000,
          df: 2,
          nobs: 32
        }
      }
    };
    
    const result = await makeRequest('POST', '/interpret', interpretRequest);
    
    if (result.statusCode === 200 && result.data.ok && result.data.summary) {
      console.log('  ✅ PASSED - Results interpreted');
      console.log(`     Summary: ${result.data.summary}`);
      console.log(`     Quality: ${result.data.model_quality.rating}`);
      console.log(`     Key findings: ${result.data.key_findings.length}`);
      console.log(`     Cost: $${result.data.cost.toFixed(4)}`);
      passed++;
    } else {
      console.log('  ❌ FAILED - Unexpected response:', result);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAILED - Error:', error.message);
    failed++;
  }

  // Test 5: Cache Stats
  try {
    console.log('\n[Test 5] Cache Statistics');
    const result = await makeRequest('GET', '/cache-stats');
    
    if (result.statusCode === 200 && result.data.ok) {
      console.log('  ✅ PASSED - Cache stats retrieved');
      console.log(`     Cache size: ${result.data.cache.size}/${result.data.cache.max}`);
      passed++;
    } else {
      console.log('  ❌ FAILED - Unexpected response:', result);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAILED - Error:', error.message);
    failed++;
  }

  // Test 6: Budget Stats
  try {
    console.log('\n[Test 6] Budget Statistics');
    const result = await makeRequest('GET', '/budget-stats');
    
    if (result.statusCode === 200 && result.data.ok) {
      console.log('  ✅ PASSED - Budget stats retrieved');
      console.log(`     Spent: $${result.data.budget.spent_this_month.toFixed(4)}`);
      console.log(`     Remaining: $${result.data.budget.remaining.toFixed(4)}`);
      console.log(`     Can make request: ${result.data.budget.can_make_request}`);
      passed++;
    } else {
      console.log('  ❌ FAILED - Unexpected response:', result);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAILED - Error:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${failed} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});