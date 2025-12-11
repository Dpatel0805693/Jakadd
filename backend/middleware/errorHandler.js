// middleware/errorHandler.js
// Centralized error handling middleware

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Validation failed",
      details: errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: "DUPLICATE_ERROR",
      message: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Invalid resource ID",
    });
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "FILE_TOO_LARGE",
        message: "File size exceeds 5MB limit",
      });
    }
    return res.status(400).json({
      error: "UPLOAD_ERROR",
      message: err.message,
    });
  }

  // JWT errors (should be caught by auth middleware, but just in case)
  if (err.name === "JsonWebTokenError") {
    return res.status(403).json({
      error: "INVALID_TOKEN",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "TOKEN_EXPIRED",
      message: "Token has expired",
    });
  }

  // Custom application errors
  if (err.status) {
    return res.status(err.status).json({
      error: err.code || "APPLICATION_ERROR",
      message: err.message,
    });
  }

  // Default internal server error
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
};

export default errorHandler;
