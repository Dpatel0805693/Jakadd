// models/Analysis.js
// Analysis schema for storing analysis configurations and results

import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    dependentVar: {
      type: String,
      required: true,
    },
    independentVars: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one independent variable is required",
      },
    },
    modelType: {
      type: String,
      enum: ["ols", "logistic", "auto"],
      default: "auto",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "queued"],
      default: "pending",
    },
    queuePosition: {
      type: Number,
      default: null,
    },
    // Results from R service (stored after completion)
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // AI-generated interpretation
    interpretation: {
      type: String,
      default: null,
    },
    // Error information (if failed)
    error: {
      message: String,
      code: String,
      timestamp: Date,
    },
    // Processing metrics
    processingTime: {
      type: Number, // milliseconds
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
analysisSchema.index({ userId: 1, status: 1 });
analysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Analysis", analysisSchema);
