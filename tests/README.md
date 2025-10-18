# R Service Testing

## How to Run Tests

### Step 1: Start R Service
```bash
# From r/ directory
R -e "plumber::plumb('plumber.R')$run(host='0.0.0.0', port=8000)"
```

### Step 2: Run Tests (in new terminal)
```bash
Rscript r/tests/test-ols.R
```

### Expected Output:
```
═══════════════════════════════════════════════════════════════
  CSC 230 - R SERVICE TEST SUITE
═══════════════════════════════════════════════════════════════

✓ R service is running

[Test 1] Basic OLS with mtcars
  - N: 32, R²: 0.8268
  ✓ PASSED

[Test 2] Small dataset (10 rows)
  ✓ PASSED

...

═══════════════════════════════════════════════════════════════
  SUMMARY
═══════════════════════════════════════════════════════════════
  Total:  8
  Passed: 8 ✓
  Failed: 0 ✗

  🎉 ALL TESTS PASSED!
═══════════════════════════════════════════════════════════════
```

## Test Coverage

✅ Basic OLS regression
✅ Small datasets (10 rows)
✅ Large datasets (10,000 rows) + performance
✅ Missing values (NA handling)
✅ Categorical variables
✅ VIF calculation
✅ Empty CSV (edge case)
✅ Invalid column names (edge case)
