// server.js - AI Gateway for StatsMate
// Port 8001 - AI-powered statistical assistance

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import services
const typeDetector = require('./services/typeDetector');
const modelSuggester = require('./services/modelSuggester');
const resultInterpreter = require('./services/resultInterpreter');

// Import utilities
const cache = require('./utils/cache');
const costTracker = require('./utils/costTracker');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/ping', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    service: 'AI Gateway',
    timestamp: new Date().toISOString(),
    budget: {
      monthly_limit: process.env.MONTHLY_BUDGET || 10,
      spent_this_month: costTracker.getMonthlySpending()
    }
  });
});

// Detect variable types
app.post('/detect-types', async (req, res) => {
  try {
    const { columns, sample } = req.body;

    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing or invalid "columns" array' 
      });
    }

    if (!sample || !Array.isArray(sample)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing or invalid "sample" array' 
      });
    }

    // Check cache first
    const cacheKey = `types:${JSON.stringify({ columns, sample })}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ok: true, ...cached, cached: true });
    }

    // Check budget
    if (!costTracker.canMakeRequest()) {
      return res.status(429).json({
        ok: false,
        error: 'Monthly budget exceeded',
        budget: {
          limit: costTracker.getMonthlyLimit(),
          spent: costTracker.getMonthlySpending()
        }
      });
    }

    // Detect types
    const result = await typeDetector.detectTypes(columns, sample);

    // Track cost
    costTracker.trackRequest(result.cost || 0);

    // Cache result
    cache.set(cacheKey, result);

    res.json({ ok: true, ...result });

  } catch (error) {
    console.error('Error in /detect-types:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
});

// Suggest model (OLS vs Logistic)
app.post('/suggest-model', async (req, res) => {
  try {
    const { dependentVar, independentVars } = req.body;

    if (!dependentVar || !dependentVar.name || !dependentVar.type) {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid "dependentVar" (needs name and type)'
      });
    }

    if (!independentVars || !Array.isArray(independentVars)) {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid "independentVars" array'
      });
    }

    // Check cache
    const cacheKey = `model:${JSON.stringify({ dependentVar, independentVars })}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ok: true, ...cached, cached: true });
    }

    // Check budget
    if (!costTracker.canMakeRequest()) {
      return res.status(429).json({
        ok: false,
        error: 'Monthly budget exceeded',
        budget: {
          limit: costTracker.getMonthlyLimit(),
          spent: costTracker.getMonthlySpending()
        }
      });
    }

    // Suggest model
    const result = await modelSuggester.suggestModel(dependentVar, independentVars);

    // Track cost
    costTracker.trackRequest(result.cost || 0);

    // Cache result
    cache.set(cacheKey, result);

    res.json({ ok: true, ...result });

  } catch (error) {
    console.error('Error in /suggest-model:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Interpret regression results
app.post('/interpret', async (req, res) => {
  try {
    const { model_type, formula, results } = req.body;

    if (!model_type || !['ols', 'logistic'].includes(model_type)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid "model_type" (must be "ols" or "logistic")'
      });
    }

    if (!formula) {
      return res.status(400).json({
        ok: false,
        error: 'Missing "formula"'
      });
    }

    if (!results || !results.tidy) {
      return res.status(400).json({
        ok: false,
        error: 'Missing "results.tidy" (broom output required)'
      });
    }

    // Check cache
    const cacheKey = `interpret:${JSON.stringify({ model_type, formula, results })}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ok: true, ...cached, cached: true });
    }

    // Check budget
    if (!costTracker.canMakeRequest()) {
      return res.status(429).json({
        ok: false,
        error: 'Monthly budget exceeded',
        budget: {
          limit: costTracker.getMonthlyLimit(),
          spent: costTracker.getMonthlySpending()
        }
      });
    }

    // Interpret results
    const result = await resultInterpreter.interpret(model_type, formula, results);

    // Track cost
    costTracker.trackRequest(result.cost || 0);

    // Cache result
    cache.set(cacheKey, result);

    res.json({ ok: true, ...result });

  } catch (error) {
    console.error('Error in /interpret:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Cache stats (for monitoring)
app.get('/cache-stats', (req, res) => {
  res.json({
    ok: true,
    cache: cache.getStats()
  });
});

// Budget stats
app.get('/budget-stats', (req, res) => {
  res.json({
    ok: true,
    budget: {
      monthly_limit: costTracker.getMonthlyLimit(),
      spent_this_month: costTracker.getMonthlySpending(),
      remaining: costTracker.getRemainingBudget(),
      can_make_request: costTracker.canMakeRequest()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /ping',
      'POST /detect-types',
      'POST /suggest-model',
      'POST /interpret',
      'GET /cache-stats',
      'GET /budget-stats'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Gateway running on port ${PORT}`);
  console.log(`📊 Monthly budget: $${process.env.MONTHLY_BUDGET || 10}`);
  console.log(`💰 Current spending: $${costTracker.getMonthlySpending()}`);
  console.log(`🚀 Ready to assist with statistical analysis!`);
});

module.exports = app;