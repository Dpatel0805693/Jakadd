# plumber_ols.R - OLS Regression Service
# Port: 8000

library(plumber)
library(broom)
library(readr)
library(readxl)

#* @apiTitle OLS Regression Service
#* @apiDescription Performs Ordinary Least Squares regression analysis

#* Health check
#* @get /ping
function() {
  list(
    status = "healthy",
    service = "ols",
    timestamp = Sys.time()
  )
}

#* Perform OLS regression
#* @param data_path Path to the data file
#* @param dependent_var Name of the dependent variable
#* @param independent_vars List of independent variable names (comma-separated or array)
#* @post /ols
function(req, res, data_path, dependent_var, independent_vars) {
  tryCatch({
    # Validate inputs
    if (missing(data_path) || missing(dependent_var) || missing(independent_vars)) {
      res$status <- 400
      return(list(error = "Missing required parameters"))
    }
    
    # Load data
    data <- NULL
    if (grepl("\\.csv$", data_path, ignore.case = TRUE)) {
      data <- read_csv(data_path, show_col_types = FALSE)
    } else if (grepl("\\.xlsx?$", data_path, ignore.case = TRUE)) {
      data <- read_excel(data_path)
    } else {
      res$status <- 400
      return(list(error = "Unsupported file format. Use CSV or XLSX."))
    }
    
    # Parse independent variables if comma-separated string
    if (is.character(independent_vars)) {
      if (grepl(",", independent_vars)) {
        independent_vars <- trimws(strsplit(independent_vars, ",")[[1]])
      } else {
        independent_vars <- c(independent_vars)
      }
    }
    
    # Verify columns exist
    missing_cols <- c()
    if (!dependent_var %in% names(data)) {
      missing_cols <- c(missing_cols, dependent_var)
    }
    for (var in independent_vars) {
      if (!var %in% names(data)) {
        missing_cols <- c(missing_cols, var)
      }
    }
    
    if (length(missing_cols) > 0) {
      res$status <- 400
      return(list(
        error = "Variables not found in data",
        missing_variables = missing_cols
      ))
    }
    
    # Build formula
    formula_str <- paste(dependent_var, "~", paste(independent_vars, collapse = " + "))
    model_formula <- as.formula(formula_str)
    
    # Fit OLS model
    model <- lm(model_formula, data = data)
    
    # Extract tidy results using broom
    tidy_results <- tidy(model, conf.int = TRUE)
    glance_results <- glance(model)
    
    # Generate R code for reproducibility
    r_code <- paste0(
      "# OLS Regression Analysis\n",
      "# Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "\n\n",
      "library(readr)\n",
      "library(broom)\n\n",
      "# Load data\n",
      "data <- read_csv('", basename(data_path), "')\n\n",
      "# Fit model\n",
      "model <- lm(", formula_str, ", data = data)\n\n",
      "# View results\n",
      "summary(model)\n",
      "tidy(model, conf.int = TRUE)\n",
      "glance(model)\n"
    )
    
    # Add diagnostics
    diagnostics <- list(
      residuals = as.numeric(residuals(model)),
      fitted = as.numeric(fitted(model)),
      standardized_residuals = as.numeric(rstandard(model))
    )
    
    # Return results
    list(
      status = "success",
      model_type = "ols",
      formula = formula_str,
      n_obs = nrow(data),
      tidy = tidy_results,
      glance = glance_results,
      diagnostics = diagnostics,
      r_code = r_code,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
  }, error = function(e) {
    res$status <- 500
    list(
      error = "Analysis failed",
      message = as.character(e$message)
    )
  })
}
#* Health check
#* @get /health
function() {
  list(
    status = "healthy",
    service = "r-ols",
    timestamp = Sys.time()
  )
}

#* Root endpoint
#* @get /
function() {
  list(
    message = "OLS Regression Service",
    version = "1.0.0",
    endpoints = list(
      health = "GET /health",
      analyze = "POST /analyze"
    )
  )
}
