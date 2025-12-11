# plumber_logistic.R - Logistic Regression Service
# Port: 8002
# FIXED: Handles confidence interval errors gracefully
library(plumber)
library(broom)
library(jsonlite)

#* @apiTitle Logistic Regression Service
#* @apiDescription Performs logistic regression analysis

# ---------------- CORS Filter ----------------
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  
  plumber::forward()
}

# ---------------- Helper to parse body ----------------
parse_body <- function(req) {
  body <- tryCatch(
    jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
    error = function(e) NULL
  )
  return(body)
}

# ---------------- Endpoints ----------------

#* Health check
#* @get /ping
function() {
  list(
    status = "healthy",
    service = "logistic",
    port = 8002,
    timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
  )
}

#* Perform Logistic regression
#* @post /logistic
function(req, res) {
  tryCatch({
    # Parse JSON body
    body <- parse_body(req)
    
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    # Get parameters
    inline_data <- body$data
    data_path <- body$data_path
    dependent_var <- body$dependent_var
    independent_vars <- body$independent_vars
    formula_str <- body$formula
    
    # Load data - prefer inline data over file path
    data <- NULL
    
    if (!is.null(inline_data) && length(inline_data) > 0) {
      # Convert inline JSON data to data frame
      data <- tryCatch({
        df <- do.call(rbind, lapply(inline_data, function(row) {
          as.data.frame(row, stringsAsFactors = FALSE)
        }))
        # Ensure numeric columns are numeric
        for (col in names(df)) {
          if (is.character(df[[col]])) {
            numeric_vals <- suppressWarnings(as.numeric(df[[col]]))
            if (!all(is.na(numeric_vals))) {
              df[[col]] <- numeric_vals
            }
          }
        }
        df
      }, error = function(e) {
        message("Error parsing inline data: ", e$message)
        NULL
      })
    } else if (!is.null(data_path)) {
      # Try to load from file
      data <- tryCatch({
        if (grepl("\\.csv$", data_path, ignore.case = TRUE)) {
          read.csv(data_path, stringsAsFactors = FALSE)
        } else if (grepl("\\.xlsx?$", data_path, ignore.case = TRUE)) {
          if (requireNamespace("readxl", quietly = TRUE)) {
            readxl::read_excel(data_path)
          } else {
            stop("readxl package not available")
          }
        } else {
          stop("Unsupported file format")
        }
      }, error = function(e) {
        message("Error loading file: ", e$message)
        NULL
      })
    }
    
    if (is.null(data) || nrow(data) == 0) {
      res$status <- 400
      return(list(error = "No data provided or data could not be loaded"))
    }
    
    # Build formula
    if (!is.null(formula_str)) {
      model_formula <- as.formula(formula_str)
      dependent_var <- all.vars(model_formula)[1]
    } else if (!is.null(dependent_var) && !is.null(independent_vars)) {
      if (is.list(independent_vars)) {
        independent_vars <- unlist(independent_vars)
      }
      formula_str <- paste(dependent_var, "~", paste(independent_vars, collapse = " + "))
      model_formula <- as.formula(formula_str)
    } else {
      res$status <- 400
      return(list(error = "Provide either 'formula' or 'dependent_var' + 'independent_vars'"))
    }
    
    # Verify columns exist
    formula_vars <- all.vars(model_formula)
    missing_vars <- setdiff(formula_vars, names(data))
    if (length(missing_vars) > 0) {
      res$status <- 400
      return(list(
        error = "Variables not found in data",
        missing = missing_vars,
        available = names(data)
      ))
    }
    
    # Convert dependent variable to binary if needed
    dep_values <- unique(data[[dependent_var]])
    if (length(dep_values) > 2) {
      res$status <- 400
      return(list(
        error = "Dependent variable must be binary for logistic regression",
        unique_values = as.character(dep_values)
      ))
    }
    
    # Ensure binary 0/1 encoding
    if (!all(dep_values %in% c(0, 1))) {
      data[[dependent_var]] <- as.numeric(as.factor(data[[dependent_var]])) - 1
    }
    
    # Fit logistic model - SUPPRESS WARNINGS and continue anyway
    model <- suppressWarnings(
      glm(model_formula, data = data, family = binomial(link = "logit"), 
          control = list(maxit = 100))
    )
    
    # Check convergence but don't fail
    converged <- model$converged
    convergence_warning <- NULL
    if (!converged) {
      convergence_warning <- "Model may have convergence issues (complete or quasi-complete separation detected). Results should be interpreted with caution."
    }
    
    # Extract tidy results - TRY with conf.int, fall back without
    tidy_results <- tryCatch({
      suppressWarnings(tidy(model, conf.int = TRUE, exponentiate = FALSE))
    }, error = function(e) {
      # Fall back to no confidence intervals
      suppressWarnings(tidy(model, conf.int = FALSE, exponentiate = FALSE))
    })
    
    # Extract glance results
    glance_results <- tryCatch({
      suppressWarnings(glance(model))
    }, error = function(e) {
      # Return minimal glance info
      list(
        null.deviance = model$null.deviance,
        deviance = model$deviance,
        AIC = AIC(model),
        nobs = nrow(data)
      )
    })
    
    # Add odds ratios (safely)
    tidy_results$odds_ratio <- exp(tidy_results$estimate)
    
    # Add conf.low and conf.high if missing (set to NA)
    if (!"conf.low" %in% names(tidy_results)) {
      tidy_results$conf.low <- NA
      tidy_results$conf.high <- NA
    }
    
    # Generate R code for reproducibility
    r_code <- paste0(
      "# Logistic Regression Analysis\n",
      "# Generated by StatsMate\n\n",
      "library(broom)\n\n",
      "# Load your data\n",
      "data <- read.csv('your_data.csv')\n\n",
      "# Fit logistic model\n",
      "model <- glm(", formula_str, ", data = data, family = binomial(link = 'logit'))\n\n",
      "# View results\n",
      "summary(model)\n",
      "tidy(model, conf.int = TRUE)\n",
      "glance(model)\n\n",
      "# Odds ratios\n",
      "exp(coef(model))\n",
      "exp(confint(model))\n"
    )
    
    # Build result
    result <- list(
      status = "success",
      model_type = "logistic",
      formula = formula_str,
      n_obs = nrow(data),
      converged = converged,
      tidy = tidy_results,
      glance = glance_results,
      r_code = r_code,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    # Add warning if there were convergence issues
    if (!is.null(convergence_warning)) {
      result$warning <- convergence_warning
    }
    
    return(result)
    
  }, error = function(e) {
    res$status <- 500
    list(
      error = "Analysis failed",
      message = as.character(e$message)
    )
  })
}

#* Health check endpoint
#* @get /health
function() {
  list(
    status = "healthy",
    service = "r-logistic",
    port = 8002,
    timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
  )
}