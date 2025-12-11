// models/File.js
// File schema for uploaded datasets (CSV/XLSX)
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Performance optimization for userId queries
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
      enum: [
        "text/csv",
        "text/plain",  // Some systems use this for CSV
        "application/vnd.ms-excel",  // Windows/Excel CSV - THIS WAS MISSING!
        "application/csv",  // Alternative CSV MIME type
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  // .xlsx
        "application/vnd.ms-excel"  // Legacy .xls
      ],
    },
    preview: {
      columns: [String],
      rows: [[mongoose.Schema.Types.Mixed]],
      detectedTypes: {
        type: Map,
        of: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
fileSchema.index({ userId: 1, status: 1 });

export default mongoose.model("File", fileSchema);