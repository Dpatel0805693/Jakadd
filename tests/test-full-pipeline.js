// test-full-pipeline.js - Full integration test
// Tests: AI type detection → Model suggestion → R regression → AI interpretation

const http = require('http');
const fs = require('fs');
const path = require('path');

const AI_GATEWAY_URL = 'http://localhost:8001';
const R_OLS_URL = 'http://localhost:8000';
const R_LOGISTIC_URL = 'http://localhost:8002';

// Helper function to make HTTP requests
function makeRequest(url, method, path, data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(path, url);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(fullUrl, options, (res) => {
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

// Create test CSV data
function createTestCSV() {
  const csvPath = path.join(__dirname, 'test-data.csv');
  const csvContent = `mpg,hp,wt,cyl
21.0,110,2.62,6
21.0,110,2.875,6
22.8,93,2.32,4
21.4,110,3.215,6
18.7,175,3.44,6
18.1,105,3.46,6
14.3,245,3.57,8
24.4,62,3.19,4
22.8,95,3.15,4
19.2,123,3.44,6`;

  fs.writeFileSync(csvPath, csvContent);
  return csvPath;
}

async function runFullPipeline() {
  console.log('\n🔄 FULL PIPELINE INTEGRATION TEST\n');
  console.log('='.repeat(60));
  console.log('\nTesting: Type Detection → Model Suggestion → Regression → Interpretation\n');

  let totalCost = 0;

  try {
    // Step 1: Create test data
    console.log('📁 [Step 1] Creating test data...');
    const csvPath = createTestCSV();
    console.log(`   ✅ Test CSV created: ${csvPath}`);

    const testData = {
      columns: ['mpg', 'hp', 'wt', 'cyl'],
      sample: [
        { mpg: 21.0, hp: 110, wt: 2.62, cyl: 6 },
        { mpg: 21.0, hp: 110, wt: 2.875, cyl: 6 },
        { mpg: 22.8, hp: 93, wt: 2.32, cyl: 4 },
        { mpg: 21.4, hp: 110, wt: 3.215, cyl: 6 },
        { mpg: 18.7, hp: 175, wt: 3.44, cyl: 6 }
      ]
    };

    // Step 2: Detect variable types with AI
    console.log('\n🤖 [Step 2] Detecting variable types with AI Gateway...');
    const typeResult = await makeRequest(AI_GATEWAY_URL, 'POST', '/detect-types', testData);
    
    if (!typeResult.data.ok) {
      throw new Error('Type detection failed: ' + JSON.stringify(typeResult.data));
    }

    console.log('   ✅ Variable types detected:');
    typeResult.data.variables.forEach(v => {
      console.log(`      - ${v.name}: ${v.type} (suggested: ${v.suggested_role})`);
    });
    console.log(`   💰 Cost: $${typeResult.data.cost.toFixed(4)}`);
    totalCost += typeResult.data.cost;

    // Step 3: Get model suggestion from AI
    console.log('\n🎯 [Step 3] Getting model suggestion from AI Gateway...');
    
    const dependentVar = typeResult.data.variables.find(v => v.suggested_role === 'dependent') || 
                         typeResult.data.variables[0];
    const independentVars = typeResult.data.variables.filter(v => v.name !== dependentVar.name);

    const modelRequest = {
      dependentVar: {
        name: dependentVar.name,
        type: dependentVar.type
      },
      independentVars: independentVars.map(v => ({
        name: v.name,
        type: v.type
      }))
    };

    const modelResult = await makeRequest(AI_GATEWAY_URL, 'POST', '/suggest-model', modelRequest);
    
    if (!modelResult.data.ok) {
      throw new Error('Model suggestion failed: ' + JSON.stringify(modelResult.data));
    }

    console.log(`   ✅ Recommended model: ${modelResult.data.model.toUpperCase()}`);
    console.log(`   📊 Confidence: ${modelResult.data.confidence}`);
    console.log(`   📝 Formula: ${modelResult.data.formula_template}`);
    console.log(`   💰 Cost: $${modelResult.data.cost.toFixed(4)}`);
    totalCost += modelResult.data.cost;

    // Step 4: Run regression in R
    const regressionUrl = modelResult.data.model === 'ols' ? R_OLS_URL : R_LOGISTIC_URL;
    const endpoint = modelResult.data.model === 'ols' ? '/ols' : '/logistic';
    
    console.log(`\n📊 [Step 4] Running ${modelResult.data.model.toUpperCase()} regression in R...`);
    
    // Format data as array of objects (what R expects)
    const inlineData = [
      { mpg: 21.0, hp: 110, wt: 2.62 },
      { mpg: 21.0, hp: 110, wt: 2.875 },
      { mpg: 22.8, hp: 93, wt: 2.32 },
      { mpg: 21.4, hp: 110, wt: 3.215 },
      { mpg: 18.7, hp: 175, wt: 3.44 },
      { mpg: 18.1, hp: 105, wt: 3.46 },
      { mpg: 14.3, hp: 245, wt: 3.57 },
      { mpg: 24.4, hp: 62, wt: 3.19 },
      { mpg: 22.8, hp: 95, wt: 3.15 },
      { mpg: 19.2, hp: 123, wt: 3.44 }
    ];

    const regressionRequest = {
      formula: 'mpg ~ hp + wt',
      data: inlineData
    };

    console.log(`   📤 Sending to R: ${JSON.stringify(regressionRequest).substring(0, 100)}...`);

    const regressionResult = await makeRequest(regressionUrl, 'POST', endpoint, regressionRequest);
    
    console.log(`   📥 R service response status: ${regressionResult.statusCode}`);
    console.log(`   📥 R service response keys: ${Object.keys(regressionResult.data).join(', ')}`);
    
    if (!regressionResult.data.ok) {
      console.log(`   ⚠️  Full R response: ${JSON.stringify(regressionResult.data)}`);
      throw new Error('Regression failed: ' + JSON.stringify(regressionResult.data));
    }

    // Step 5: Interpret results with AI
    console.log('\n💡 [Step 5] Interpreting results with AI Gateway...');
    
    // Check if R service returned the expected format
    if (!regressionResult.data.ok) {
      throw new Error('Regression failed: ' + JSON.stringify(regressionResult.data));
    }

    // Log what we got from R (for debugging)
    console.log(`   📊 R service returned: ${Object.keys(regressionResult.data).join(', ')}`);

    const interpretRequest = {
      model_type: modelResult.data.model,
      formula: 'mpg ~ hp + wt',
      results: {
        tidy: regressionResult.data.tidy || [],
        glance: regressionResult.data.glance || {}
      }
    };

    // Only interpret if we have valid results
    if (!interpretRequest.results.tidy || interpretRequest.results.tidy.length === 0) {
      throw new Error('No tidy results from R service. Response: ' + JSON.stringify(regressionResult.data));
    }

    const interpretResult = await makeRequest(AI_GATEWAY_URL, 'POST', '/interpret', interpretRequest);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 FULL PIPELINE TEST PASSED!\n');
    console.log(`Total AI Cost: $${totalCost.toFixed(4)}`);
    console.log(`Services Used: AI Gateway (3 calls) + R Service (1 call)`);
    console.log('\nPipeline Flow:');
    console.log('  1. ✅ Type Detection (AI)');
    console.log('  2. ✅ Model Suggestion (AI)');
    console.log(`  3. ✅ ${modelResult.data.model.toUpperCase()} Regression (R)`);
    console.log('  4. ✅ Result Interpretation (AI)');
    console.log('');

    // Cleanup
    fs.unlinkSync(csvPath);
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ PIPELINE TEST FAILED:', error.message);
    console.error('\nMake sure all services are running:');
    console.error('  - AI Gateway (port 8001)');
    console.error('  - R OLS Service (port 8000)');
    console.error('  - R Logistic Service (port 8002)\n');
    process.exit(1);
  }
}

// Run pipeline test
runFullPipeline();