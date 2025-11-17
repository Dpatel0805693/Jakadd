# Integration Tests

Comprehensive tests for StatsMate services - R statistics and AI Gateway.

## Test Files

### 1. `test-ai-gateway.js`
Tests all AI Gateway endpoints individually:
- ✅ Health check
- ✅ Variable type detection
- ✅ Model suggestion (OLS vs Logistic)
- ✅ Result interpretation
- ✅ Cache statistics
- ✅ Budget tracking

**Run:**
```bash
node test-ai-gateway.js
```

**Requirements:**
- AI Gateway running on port 8001
- Valid OpenAI API key in .env

**Expected output:**
```
🤖 AI GATEWAY INTEGRATION TESTS
============================================================

[Test 1] Health Check
  ✅ PASSED - Service is healthy
     Budget: $0.0042/$10

[Test 2] Detect Variable Types
  ✅ PASSED - Variable types detected
     Variables analyzed: 4
     - age: continuous (independent)
     - income: continuous (dependent)
     - education: categorical (independent)
     - employed: binary (dependent)
     Cost: $0.0002

...

📊 RESULTS: 6 passed, 0 failed (6 total)
🎉 ALL TESTS PASSED!
```

---

### 2. `test-full-pipeline.js`
Tests the complete analysis workflow:
1. **Type Detection** - AI analyzes variable types
2. **Model Suggestion** - AI recommends OLS or Logistic
3. **Regression** - R service runs the analysis
4. **Interpretation** - AI explains results in plain language

**Run:**
```bash
node test-full-pipeline.js
```

**Requirements:**
- AI Gateway running on port 8001
- R OLS Service running on port 8000
- R Logistic Service running on port 8002
- Valid OpenAI API key in .env

**Expected output:**
```
🔄 FULL PIPELINE INTEGRATION TEST
============================================================

Testing: Type Detection → Model Suggestion → Regression → Interpretation

📁 [Step 1] Creating test data...
   ✅ Test CSV created

🤖 [Step 2] Detecting variable types with AI Gateway...
   ✅ Variable types detected:
      - mpg: continuous (suggested: dependent)
      - hp: continuous (suggested: independent)
      - wt: continuous (suggested: independent)
      - cyl: continuous (suggested: independent)
   💰 Cost: $0.0002

🎯 [Step 3] Getting model suggestion from AI Gateway...
   ✅ Recommended model: OLS
   📊 Confidence: high
   📝 Formula: mpg ~ hp + wt + cyl
   💰 Cost: $0.0002

📊 [Step 4] Running OLS regression in R...
   ✅ Regression completed successfully
   📈 R²: 0.8274
   🔢 Observations: 10

💡 [Step 5] Interpreting results with AI Gateway...
   ✅ Results interpreted successfully

   📋 Summary:
      This is an excellent model explaining 83% of MPG variation...

   ⭐ Model Quality: excellent
      High R² and all predictors significant

   🔑 Key Findings:
      1. Weight is the strongest predictor
      2. Horsepower significantly reduces efficiency
      3. Model is reliable for predictions

   💰 Cost: $0.0003

============================================================

🎉 FULL PIPELINE TEST PASSED!

Total AI Cost: $0.0007
Services Used: AI Gateway (3 calls) + R Service (1 call)

Pipeline Flow:
  1. ✅ Type Detection (AI)
  2. ✅ Model Suggestion (AI)
  3. ✅ OLS Regression (R)
  4. ✅ Result Interpretation (AI)
```

---

## Running All Tests

### Prerequisites
```bash
# Start all services with Docker Compose
cd ..
docker-compose up --build

# Or start services individually:
# Terminal 1: AI Gateway
cd ai-gateway && npm start

# Terminal 2: R OLS
cd r-services && R -e "plumber::pr('plumber_ols.R')$run(host='0.0.0.0', port=8000)"

# Terminal 3: R Logistic  
cd r-services && R -e "plumber::pr('plumber_logistic.R')$run(host='0.0.0.0', port=8002)"
```

### Run Tests
```bash
cd tests

# Test AI Gateway only
node test-ai-gateway.js

# Test full pipeline
node test-full-pipeline.js

# Both tests
npm test
```

---

## Cost Analysis

**Typical costs per test run:**
- Type Detection: ~$0.0002
- Model Suggestion: ~$0.0002  
- Result Interpretation: ~$0.0003
- **Total per pipeline: ~$0.0007**

With $10/month budget:
- ~14,000 pipeline tests per month
- ~500 tests per day
- More than sufficient for development and demo

---

## Troubleshooting

**"Connection refused" errors:**
- Ensure all services are running
- Check ports: 8000 (R OLS), 8001 (AI), 8002 (R Logistic)
- Verify with: `curl http://localhost:8001/ping`

**"Budget exceeded" errors:**
- Check spending: `curl http://localhost:8001/budget-stats`
- Costs reset monthly
- Default limit: $10/month

**"Invalid API key" errors:**
- Verify .env file has OPENAI_API_KEY
- Check key starts with "sk-"
- Test key at: https://platform.openai.com/api-keys

---

## Team Integration

These tests verify:
- ✅ **Jordano's services** (R + AI) work correctly
- ✅ **Amanda's integration** will receive correct data
- ✅ **Dhwani's frontend** can call these endpoints
- ✅ **End-to-end flow** is functional

Ready for Tuesday demo! 🚀