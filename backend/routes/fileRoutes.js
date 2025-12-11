// routes/fileRoutes.js
// File management endpoints: upload, list, get, delete

import express from "express";
import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import XLSX from "xlsx";
import authenticateToken from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import File from "../models/File.js";

const router = express.Router();

// POST /api/upload - Upload a new file
router.post("/upload", authenticateToken, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "NO_FILE",
        message: "No file uploaded",
      });
    }

    // Generate preview based on file type
    const preview = await generatePreview(req.file.path, req.file.mimetype);

    // Create file record in database
    const file = new File({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      preview,
    });

    await file.save();

    res.status(201).json({
      message: "File uploaded successfully",
      file: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        preview: file.preview,
        uploadedAt: file.createdAt,
      },
    });
  } catch (error) {
    // Clean up uploaded file if database save fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
});

// GET /api/files - List all files for the authenticated user
router.get("/files", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Only fetch files belonging to the authenticated user
    const files = await File.find({
      userId: req.user.id,
      status: "active",
    }).sort({ createdAt: -1 });

    const fileList = files.map((file) => ({
      _id: file._id,  // Use _id for consistency
      id: file._id,
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      createdAt: file.createdAt,  // Use createdAt instead of uploadedAt
      uploadedAt: file.createdAt,
      preview: file.preview,
    }));

    res.json({
      count: fileList.length,
      files: fileList,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/files/:id - Get specific file details
router.get("/files/:id", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Verify ownership
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: "active",
    });

    if (!file) {
      return res.status(404).json({
        error: "FILE_NOT_FOUND",
        message: "File not found or access denied",
      });
    }

    res.json({
      file: {
        _id: file._id,
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,  // Include path for download
        createdAt: file.createdAt,
        uploadedAt: file.createdAt,
        preview: file.preview,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/files/:id/download - Download file content
router.get("/files/:id/download", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Verify ownership
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: "active",
    });

    if (!file) {
      return res.status(404).json({
        error: "FILE_NOT_FOUND",
        message: "File not found or access denied",
      });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.path);
    } catch (err) {
      return res.status(404).json({
        error: "FILE_NOT_FOUND_ON_DISK",
        message: "File no longer exists on server",
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size);

    // Read and send file
    const fileContent = await fs.readFile(file.path);
    res.send(fileContent);

  } catch (error) {
    next(error);
  }
});

// DELETE /api/files/:id - Delete a file
router.delete("/files/:id", authenticateToken, async (req, res, next) => {
  try {
    // CRITICAL: Verify ownership
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: "active",
    });

    if (!file) {
      return res.status(404).json({
        error: "FILE_NOT_FOUND",
        message: "File not found or access denied",
      });
    }

    // Mark as deleted (soft delete)
    file.status = "deleted";
    await file.save();

    // Delete physical file
    await fs.unlink(file.path).catch((err) => {
      console.error("Failed to delete physical file:", err);
    });

    res.json({
      message: "File deleted successfully",
      id: file._id,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate preview
async function generatePreview(filePath, mimetype) {
  try {
    if (mimetype === "text/csv" || mimetype === "text/plain" || mimetype === "application/vnd.ms-excel" || mimetype === "application/csv") {
      // Parse CSV
      const content = await fs.readFile(filePath, "utf-8");
      const result = Papa.parse(content, { header: false });
      
      // Get first 6 rows (header + 5 data rows)
      const rows = result.data.slice(0, 6);
      const columns = rows[0] || [];
      
      // Detect types for each column
      const detectedTypes = {};
      if (rows.length > 1) {
        columns.forEach((col, idx) => {
          const values = rows.slice(1).map((row) => row[idx]).filter(Boolean);
          detectedTypes[col] = detectColumnType(values);
        });
      }

      return {
        columns,
        rows: rows.slice(0, 6),
        detectedTypes,
      };
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // Parse XLSX
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Get first 6 rows
      const rows = data.slice(0, 6);
      const columns = rows[0] || [];
      
      // Detect types
      const detectedTypes = {};
      if (rows.length > 1) {
        columns.forEach((col, idx) => {
          const values = rows.slice(1).map((row) => row[idx]).filter(val => val !== undefined && val !== null);
          detectedTypes[col] = detectColumnType(values);
        });
      }

      return {
        columns,
        rows,
        detectedTypes,
      };
    }

    return null;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
}

// Helper function to detect column type
function detectColumnType(values) {
  if (values.length === 0) return "unknown";

  // Check if all values are numeric
  const numericValues = values.filter((v) => !isNaN(parseFloat(v)));
  if (numericValues.length === values.length) {
    // Check if binary (only 0 and 1)
    const uniqueValues = [...new Set(values.map((v) => parseFloat(v)))];
    if (uniqueValues.length <= 2 && uniqueValues.every((v) => v === 0 || v === 1)) {
      return "binary";
    }
    return "continuous";
  }

  // Check if categorical
  const uniqueValues = new Set(values);
  if (uniqueValues.size < values.length * 0.5) {
    return "categorical";
  }

  return "text";
}

export default router;