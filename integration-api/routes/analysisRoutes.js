// routes/analysisRoutes.js
// Analysis workflow: receive request, forward to Amanda's Integration API
// FIXED: Status check changed from 'completed' to 'complete'

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
          data_path: file.path,
          dependentVar,
          independentVars,
          modelType: modelType || "auto",
        },
        {
          timeout: 60000, // 60 second timeout
        }
      );

      const processingTime = Date.now() - startTime;

      // Check if queued or immediate processing
      // FIX: Check for both 'complete' and 'completed' for compatibility
      if (response.data.status === "queued") {
        // Request was queued
        analysis.status = "queued";
        analysis.queuePosition = response.data.queuePosition || response.data.position;
        await analysis.save();

        return res.status(202).json({
          message: "Analysis queued",
          analysisId: analysis._id,
          status: "queued",
          queuePosition: response.data.queuePosition || response.data.position,
          estimatedWait: response.data.estimatedWait,
        });
      } else if (response.data.status === "complete" || response.data.status === "completed") {
        // Immediate processing completed - FIXED: accept both 'complete' and 'completed'
        analysis.status = "completed";
        analysis.results = response.data.results;
        analysis.interpretation = response.data.interpretation;
        analysis.processingTime = processingTime;
        analysis.completedAt = new Date();
        await analysis.save();

        return res.status(200).json({
          message: "Analysis completed",
          analysisId: analysis._id,
          status: "completed",
          results: response.data.results,
          interpretation: response.data.interpretation,
          processingTime,
        });
      } else {
        // Unknown status - log and handle gracefully
        console.warn(`Unknown status from Integration API: ${response.data.status}`);
        
        // If we have results, consider it complete
        if (response.data.results) {
          analysis.status = "completed";
          analysis.results = response.data.results;
          analysis.interpretation = response.data.interpretation;
          analysis.processingTime = processingTime;
          analysis.completedAt = new Date();
          await analysis.save();

          return res.status(200).json({
            message: "Analysis completed",
            analysisId: analysis._id,
            status: "completed",
            results: response.data.results,
            interpretation: response.data.interpretation,
            processingTime,
          });
        }
        
        // Otherwise report error
        analysis.status = "failed";
        analysis.error = {
          message: `Unexpected status: ${response.data.status}`,
          code: "UNEXPECTED_STATUS",
          timestamp: new Date(),
        };
        await analysis.save();

        return res.status(500).json({
          error: "UNEXPECTED_STATUS",
          message: `Integration API returned unexpected status: ${response.data.status}`,
          analysisId: analysis._id,
        });
      }
    } catch (integrationError) {
      // Handle errors from Integration API
      if (integrationError.response?.status === 429) {
        // Queue is full
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
          integrationError.response?.data?.error ||
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
        details: integrationError.response?.data || null,
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/analyze/:id/status - Check analysis status
router.get("/analyze/:id/status", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Verify ownership
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
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analyze/:id/results - Get full analysis results
router.get("/analyze/:id/results", authenticateToken, async (req, res, next) => {
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

    if (analysis.status !== "completed") {
      return res.status(400).json({
        error: "ANALYSIS_NOT_COMPLETE",
        message: `Analysis status is: ${analysis.status}`,
        status: analysis.status,
      });
    }

    res.json({
      analysisId: analysis._id,
      status: analysis.status,
      modelType: analysis.modelType,
      dependentVar: analysis.dependentVar,
      independentVars: analysis.independentVars,
      results: analysis.results,
      interpretation: analysis.interpretation,
      processingTime: analysis.processingTime,
      completedAt: analysis.completedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;