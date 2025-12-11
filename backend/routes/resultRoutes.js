// routes/resultRoutes.js
// Result retrieval endpoints

import express from "express";
import authenticateToken from "../middleware/auth.js";
import Analysis from "../models/Analysis.js";
import File from "../models/File.js";

const router = express.Router();

// GET /api/result/:id - Get analysis results
router.get("/result/:id", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Verify ownership
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("fileId");

    if (!analysis) {
      return res.status(404).json({
        error: "ANALYSIS_NOT_FOUND",
        message: "Analysis not found or access denied",
      });
    }

    // Return different responses based on status
    if (analysis.status === "pending" || analysis.status === "processing") {
      return res.status(202).json({
        analysisId: analysis._id,
        status: analysis.status,
        message: "Analysis is still processing",
      });
    }

    if (analysis.status === "queued") {
      return res.status(202).json({
        analysisId: analysis._id,
        status: "queued",
        queuePosition: analysis.queuePosition,
        message: "Analysis is queued",
      });
    }

    if (analysis.status === "failed") {
      return res.status(500).json({
        analysisId: analysis._id,
        status: "failed",
        error: analysis.error,
        message: "Analysis failed",
      });
    }

    // Status is "completed"
    res.json({
      analysisId: analysis._id,
      status: "completed",
      file: {
        id: analysis.fileId._id,
        filename: analysis.fileId.filename,
        originalName: analysis.fileId.originalName,
      },
      configuration: {
        dependentVar: analysis.dependentVar,
        independentVars: analysis.independentVars,
        modelType: analysis.modelType,
      },
      results: analysis.results,
      interpretation: analysis.interpretation,
      processingTime: analysis.processingTime,
      completedAt: analysis.completedAt,
      createdAt: analysis.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/results - List all analyses for user
router.get("/results", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Only fetch analyses belonging to the authenticated user
    const analyses = await Analysis.find({
      userId: req.user.id,
    })
      .populate("fileId")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 analyses

    const analysisList = analyses.map((analysis) => ({
      id: analysis._id,
      status: analysis.status,
      file: {
        id: analysis.fileId?._id,
        filename: analysis.fileId?.filename,
        originalName: analysis.fileId?.originalName,
      },
      configuration: {
        dependentVar: analysis.dependentVar,
        independentVars: analysis.independentVars,
        modelType: analysis.modelType,
      },
      processingTime: analysis.processingTime,
      completedAt: analysis.completedAt,
      createdAt: analysis.createdAt,
    }));

    res.json({
      count: analysisList.length,
      analyses: analysisList,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
