// routes/analysisRoutes.js - UPDATED VERSION
// Analysis workflow with complete CRUD operations

import express from "express";
import axios from "axios";
import authenticateToken from "../middleware/auth.js";
import File from "../models/File.js";
import Analysis from "../models/Analysis.js";

const router = express.Router();

const INTEGRATION_API_URL =
  process.env.INTEGRATION_API_URL || "http://localhost:5001";

// POST /api/analyze - Start new analysis
router.post("/analyze", authenticateToken, async (req, res, next) => {
  try {
    const { fileId, dependentVar, independentVars, modelType } = req.body;

    // Validation
    if (!fileId || !dependentVar || !independentVars || independentVars.length === 0) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "fileId, dependentVar, and independentVars are required",
      });
    }

    // CRITICAL: Verify file ownership
    const file = await File.findOne({
      _id: fileId,
      userId: req.user.id,
      status: "active",
    });

    if (!file) {
      return res.status(404).json({
        error: "FILE_NOT_FOUND",
        message: "File not found or access denied",
      });
    }

    // Create analysis record (status: pending)
    const analysis = new Analysis({
      userId: req.user.id,
      fileId: file._id,
      dependentVar,
      independentVars,
      modelType: modelType || "auto",
      status: "pending",
    });

    await analysis.save();

    // Forward to Integration API (Amanda)
    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${INTEGRATION_API_URL}/integrate/analyze`,
        {
          analysisId: analysis._id.toString(),
          userId: req.user.id,
          data_path: `/uploads/${file.filename}`,
          dependentVar,
          independentVars,
          modelType: modelType || "auto",
        },
        {
          timeout: 60000, // 60 second timeout
        }
      );

      console.log('📊 Integration API Response:', JSON.stringify(response.data, null, 2));
      console.log('🔍 DEBUG: What Core API received from Integration API:');
      console.log('   - status:', response.data.status);
      console.log('   - results keys:', Object.keys(response.data.results || {}));
      console.log('   - results.tidy exists?:', !!response.data.results?.tidy);
      console.log('   - results.glance exists?:', !!response.data.results?.glance);
      console.log('   - results.r_code exists?:', !!response.data.results?.r_code);
      console.log('   - Full results:', JSON.stringify(response.data.results, null, 2));

      const processingTime = Date.now() - startTime;

      console.log('✅ Step 1: Calculated processing time:', processingTime); 
      console.log('🔍 DEBUG: response.data.status =', response.data.status); 
      console.log('🔍 DEBUG: Full response.data keys:', Object.keys(response.data)); 

      // Handle the complete status (immediate processing completed)
      if (response.data.status === "complete") {
        console.log('✅ Step 2: Status is complete - analysis finished!'); 
        console.log('💾 Step 3: Saving results to database...'); 
        
        // Save results to database
        analysis.status = "completed";
        analysis.results = response.data.results;
        analysis.interpretation = response.data.interpretation;
        analysis.processingTime = processingTime;
        analysis.completedAt = new Date();
        await analysis.save();
        
        console.log('✅ Step 4: Saved to database successfully!'); 
        console.log('📤 Step 5: Sending response to client...');
        
        // Return the complete results
        return res.status(200).json({
          message: "Analysis completed",
          analysisId: analysis._id,
          status: "completed",
          results: response.data.results,
          interpretation: response.data.interpretation,
          processingTime,
        });
      }
      
      // Handle queued status
      if (response.data.status === "queued") {
        console.log('📬 Step 2: Status is queued');
        analysis.status = "queued";
        analysis.queuePosition = response.data.queuePosition;
        await analysis.save();

        return res.status(202).json({
          message: "Analysis queued",
          analysisId: analysis._id,
          status: "queued",
          queuePosition: response.data.queuePosition,
          estimatedWait: response.data.estimatedWait,
        });
      }
      
      // Handle error status
      if (response.data.status === "error") {
        console.log('❌ Step 2: Status is error');
        analysis.status = "failed";
        analysis.error = {
          message: response.data.error || "Analysis failed",
          code: "ANALYSIS_ERROR",
          timestamp: new Date(),
        };
        await analysis.save();

        return res.status(500).json({
          error: "ANALYSIS_ERROR",
          message: response.data.error || "Analysis failed",
          analysisId: analysis._id,
        });
      }
      
      // Unknown status
      console.log('⚠️ WARNING: Unknown status received:', response.data.status);
      analysis.status = "failed";
      analysis.error = {
        message: `Unknown status received: ${response.data.status}`,
        code: "UNKNOWN_STATUS",
        timestamp: new Date(),
      };
      await analysis.save();

      return res.status(500).json({
        error: "UNKNOWN_STATUS",
        message: `Unexpected status: ${response.data.status}`,
        analysisId: analysis._id,
      });
      
    } catch (integrationError) {
      // Handle errors from Integration API
      if (integrationError.response?.status === 429) {
        analysis.status = "failed";
        analysis.error = {
          message: "System is at capacity. Please try again later.",
          code: "QUEUE_FULL",
          timestamp: new Date(),
        };
        await analysis.save();

        return res.status(429).json({
          error: "QUEUE_FULL",
          message: "System is at capacity. Please try again later.",
          analysisId: analysis._id,
        });
      }

      // Other integration errors
      analysis.status = "failed";
      analysis.error = {
        message:
          integrationError.response?.data?.message ||
          integrationError.message ||
          "Integration service error",
        code: "INTEGRATION_ERROR",
        timestamp: new Date(),
      };
      await analysis.save();

      return res.status(500).json({
        error: "INTEGRATION_ERROR",
        message: "Failed to process analysis request",
        analysisId: analysis._id,
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/analyze/:id/status - Check analysis status
router.get("/analyze/:id/status", authenticateToken, async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        error: "ANALYSIS_NOT_FOUND",
        message: "Analysis not found or access denied",
      });
    }

    res.json({
      analysisId: analysis._id,
      status: analysis.status,
      queuePosition: analysis.queuePosition,
      processingTime: analysis.processingTime,
      completedAt: analysis.completedAt,
      error: analysis.error,
      results: analysis.results,
      interpretation: analysis.interpretation,
      dependentVar: analysis.dependentVar,
      independentVars: analysis.independentVars,
      modelType: analysis.modelType,
    });
  } catch (error) {
    next(error);
  }
});

// ✨ NEW: GET /api/analyses - List all analyses for authenticated user
router.get("/analyses", authenticateToken, async (req, res, next) => {
  try {
    const analyses = await Analysis.find({
      userId: req.user.id,
    })
    .sort({ createdAt: -1 }) // Most recent first
    .limit(100); // Limit to 100 most recent

    res.json({
      analyses: analyses.map(a => ({
        _id: a._id,
        fileId: a.fileId,
        dependentVar: a.dependentVar,
        independentVars: a.independentVars,
        modelType: a.modelType,
        status: a.status,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
        processingTime: a.processingTime,
        error: a.error,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ✨ NEW: GET /api/analyses/:id - Get specific analysis details
router.get("/analyses/:id", authenticateToken, async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        error: "ANALYSIS_NOT_FOUND",
        message: "Analysis not found or access denied",
      });
    }

    res.json({
      analysis: {
        _id: analysis._id,
        fileId: analysis.fileId,
        dependentVar: analysis.dependentVar,
        independentVars: analysis.independentVars,
        modelType: analysis.modelType,
        status: analysis.status,
        results: analysis.results,
        interpretation: analysis.interpretation,
        processingTime: analysis.processingTime,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        error: analysis.error,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ✨ NEW: DELETE /api/analyses/:id - Delete an analysis
router.delete("/analyses/:id", authenticateToken, async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        error: "ANALYSIS_NOT_FOUND",
        message: "Analysis not found or access denied",
      });
    }

    await Analysis.deleteOne({ _id: req.params.id });

    res.json({
      message: "Analysis deleted successfully",
      analysisId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;