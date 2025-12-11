// routes/analyzeRoute.js - Main orchestration endpoint (ES Module version)
// FIXED: Reads CSV and sends inline data to R services
import express from 'express';
import axios from 'axios';
import fs from 'fs';
import processPool from '../processPool.js';
import queueManager from '../queueManager.js';

const router = express.Router();

// Service URLs from environment variables
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://ai-gateway:8001';
const R_OLS_URL = process.env.R_OLS_URL || 'http://r-ols:8000';
const R_LOGISTIC_URL = process.env.R_LOGISTIC_URL || 'http://r-logistic:8002';

// Parse CSV string to array of objects
function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      const val = values[idx];
      const num = parseFloat(val);
      row[header] = isNaN(num) ? val : num;
    });
    result.push(row);
  }
  return result;
}

// Main orchestration endpoint
router.post('/analyze', async (req, res) => {
  const { userId, fileId, data_path, dependentVar, independentVars, modelType } = req.body;

  // Validate inputs
  if (!data_path || !dependentVar || !independentVars) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['data_path', 'dependentVar', 'independentVars']
    });
  }

  const jobId = `job-${Date.now()}-${userId || 'anonymous'}`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 New analysis request: ${jobId}`);
  console.log(`   Dependent: ${dependentVar}`);
  console.log(`   Independent: ${independentVars.join(', ')}`);
  console.log(`   Data path: ${data_path}`);

  const startTime = Date.now();

  try {
    // Determine model type
    let suggestedModel = modelType || 'ols';
    if (suggestedModel === 'auto') {
      suggestedModel = 'ols'; // Default to OLS
    }
    console.log(`   Model type: ${suggestedModel}`);

    // Check for available process
    const availableProcess = processPool.getAvailableProcess();

    if (!availableProcess) {
      try {
        const position = queueManager.enqueue({
          id: jobId,
          userId: userId || 'anonymous',
          fileId,
          data_path,
          dependentVar,
          independentVars,
          modelType: suggestedModel
        });

        console.log(`⏸️  All processes busy - job queued at position ${position}`);

        return res.status(202).json({
          status: 'queued',
          jobId,
          position,
          message: `Analysis queued. Position ${position}`,
          estimatedWait: `${position * 10} seconds`
        });
      } catch (error) {
        console.log(`❌ Queue full - rejecting request`);
        return res.status(429).json({
          error: 'Queue full',
          message: 'Too many requests. Please try again in 10 seconds.',
          retryAfter: 10
        });
      }
    }

    // Mark process as busy
    processPool.markBusy(availableProcess.port, jobId);

    // READ THE CSV FILE AND PARSE IT
    console.log(`   📂 Reading file...`);
    const possiblePaths = [
      data_path,
      data_path.replace('/app/uploads', '/uploads'),
      `/uploads/${data_path.split('/').pop()}`,
      `./uploads/${data_path.split('/').pop()}`
    ];
    
    let csvContent = null;
    let usedPath = null;
    
    for (const tryPath of possiblePaths) {
      try {
        if (fs.existsSync(tryPath)) {
          csvContent = fs.readFileSync(tryPath, 'utf8');
          usedPath = tryPath;
          console.log(`   ✓ Found file at: ${tryPath}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    if (!csvContent) {
      console.log(`   ❌ File not found at any path`);
      processPool.markAvailable(availableProcess.port);
      return res.status(400).json({ 
        error: 'FILE_NOT_FOUND',
        message: `Cannot find file: ${data_path}`,
        triedPaths: possiblePaths
      });
    }

    // Parse CSV to JSON
    const inlineData = parseCSV(csvContent);
    console.log(`   ✓ Parsed ${inlineData.length} rows`);

    // Determine R service URL and endpoint
    let rServiceUrl;
    let rEndpoint;
    
    if (suggestedModel === 'logistic') {
      rServiceUrl = R_LOGISTIC_URL;
      rEndpoint = 'logistic';
      console.log(`   ✓ Routing to LOGISTIC service: ${rServiceUrl}`);
    } else {
      rServiceUrl = R_OLS_URL;
      rEndpoint = 'ols';
      console.log(`   ✓ Routing to OLS service: ${rServiceUrl}`);
    }
    
    // Call R service with INLINE DATA
    console.log(`   [1/2] Running ${suggestedModel} regression...`);
    
    const rResponse = await axios.post(
      `${rServiceUrl}/${rEndpoint}`, 
      {
        data: inlineData,  // Send data inline!
        dependent_var: dependentVar,
        independent_vars: independentVars
      }, 
      { timeout: 45000 }
    );

    console.log(`   ✓ R service response received`);

    // Check for R-side errors
    if (rResponse.data.error) {
      throw new Error(rResponse.data.error + ': ' + (rResponse.data.message || ''));
    }

    const rData = rResponse.data;

    // Results are already in tidy format from broom
    const tidy = rData.tidy || [];
    const glance = rData.glance || {};
    const diagnostics = rData.diagnostics || null;
    const r_code = rData.r_code || '';

    // Generate interpretation
    console.log(`   [2/2] Generating interpretation...`);
    const interpretation = generateInterpretation(suggestedModel, tidy, glance, dependentVar, independentVars);

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Analysis complete in ${processingTime}s`);
    console.log(`${'='.repeat(60)}\n`);

    // Mark process as available
    processPool.markAvailable(availableProcess.port);

    // Process next queued job if any
    if (queueManager.getSize() > 0) {
      const nextJob = queueManager.dequeue();
      console.log(`🔄 Processing next queued job: ${nextJob.id}`);
    }

    // Return combined results
    return res.status(200).json({
      status: 'complete',
      jobId,
      modelType: suggestedModel,
      results: {
        tidy: tidy,
        glance: glance,
        diagnostics: diagnostics,
        r_code: r_code
      },
      interpretation,
      processingTime: parseFloat(processingTime),
      rService: rServiceUrl
    });

  } catch (error) {
    // Mark process as available on error
    try {
      processPool.markAvailable(8000);
      processPool.markAvailable(8002);
    } catch (e) {}

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Analysis failed after ${processingTime}s:`, error.message);
    if (error.response?.data) {
      console.error(`   R response:`, JSON.stringify(error.response.data));
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Cannot connect to R analysis service.',
        service: error.config?.url
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Analysis timeout',
        message: 'Analysis took too long. Try with a smaller dataset.',
        processingTime: `${processingTime}s`
      });
    }

    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'Analysis error',
        message: error.response.data?.error || error.response.data?.message || 'Analysis failed',
        details: error.response.data
      });
    }

    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      jobId
    });
  }
});

// Generate plain-language interpretation
function generateInterpretation(modelType, tidy, glance, dependentVar, independentVars) {
  let text = `## ${modelType.toUpperCase()} Regression Results\n\n`;
  
  // Model fit for OLS
  const rSquared = glance['r.squared'] || glance.r_squared;
  if (modelType === 'ols' && rSquared !== undefined) {
    const rSquaredPercent = (rSquared * 100).toFixed(1);
    text += `**Model Fit:** This model explains **${rSquaredPercent}%** of the variance in ${dependentVar}. `;
    
    if (rSquared > 0.7) {
      text += `This is considered a strong fit.\n\n`;
    } else if (rSquared > 0.4) {
      text += `This is a moderate fit.\n\n`;
    } else {
      text += `This is a weak fit - other factors may be important.\n\n`;
    }
  } else if (modelType === 'logistic' && glance.AIC) {
    text += `**Model Fit:** AIC = ${glance.AIC.toFixed(2)}\n\n`;
  }

  // Coefficients interpretation
  if (tidy && tidy.length > 0) {
    text += `**Key Findings:**\n\n`;
    
    tidy.forEach(row => {
      const term = row.term;
      const estimate = row.estimate;
      const pValue = row['p.value'] || row.p_value;
      
      if (term === '(Intercept)') {
        text += `- **Intercept**: ${estimate?.toFixed(4) || 'N/A'} (baseline value)\n\n`;
      } else {
        const isSignificant = pValue !== null && pValue !== undefined && pValue < 0.05;
        const effect = estimate > 0 ? 'increases' : 'decreases';
        const absEffect = Math.abs(estimate || 0).toFixed(4);
        
        text += `- **${term}**: `;
        if (isSignificant) {
          text += `For every 1-unit increase, ${dependentVar} ${effect} by ${absEffect} (p = ${pValue?.toFixed(4) || 'N/A'}, statistically significant ✓)\n\n`;
        } else {
          text += `Effect of ${absEffect} (p = ${pValue?.toFixed(4) || 'N/A'}, not statistically significant)\n\n`;
        }
      }
    });
  }

  return text;
}

// Health check
router.get('/health', (req, res) => {
  const poolStatus = processPool.getStatus();
  const queueStatus = queueManager.getStatus();

  res.json({
    status: 'healthy',
    service: 'integration-api',
    processPool: poolStatus,
    queue: queueStatus,
    services: {
      rOls: R_OLS_URL,
      rLogistic: R_LOGISTIC_URL
    },
    timestamp: new Date().toISOString()
  });
});

// Queue status
router.get('/queue-status', (req, res) => {
  res.json({
    queue: queueManager.getStatus(),
    processPool: processPool.getStatus()
  });
});

export default router;
