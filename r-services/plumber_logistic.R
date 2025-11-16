# plumber_logistic.R - Logistic Regression Service
# Port: 8002

library(plumber)
library(broom)
library(readr)
library(readxl)
library(margins)

#* @apiTitle Logistic Regression Service
#* @apiDescription Performs logistic regression analysis with marginal effects

#* Health check
#* @get /ping
function() {
  list(
    status = "healthy",
    service = "logistic",
    timestamp = Sys.time()
  )
}

#* Perform Logistic regression
#* @param data_path Path to the data file
#* @param dependent_var Name of the dependent variable
#* @param independent_vars List of independent variable names (comma-separated or array)
#* @post /logistic
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
    
    # Convert dependent variable to binary if needed
    data[[dependent_var]] <- as.numeric(as.factor(data[[dependent_var]])) - 1
    
    # Check if binary
    unique_values <- unique(data[[dependent_var]])
    if (length(unique_values) != 2 || !all(unique_values %in% c(0, 1))) {
      res$status <- 400
      return(list(
        error = "Dependent variable must be binary (0/1)",
        unique_values = unique_values
      ))
    }
    
    # Build formula
    formula_str <- paste(dependent_var, "~", paste(independent_vars, collapse = " + "))
    model_formula <- as.formula(formula_str)
    
    # Fit logistic model
    model <- glm(model_formula, data = data, family = binomial(link = "logit"))
    
    # Check convergence
    if (!model$converged) {
      res$status <- 400
      return(list(error = "Model failed to converge"))
    }
    
    # Extract tidy results using broom
    tidy_results <- tidy(model, conf.int = TRUE, exponentiate = FALSE)
    glance_results <- glance(model)
    
    # Calculate marginal effects
    marginal_effects <- NULL
    tryCatch({
      marg <- margins(model)
      marginal_effects <- summary(marg)
      
      # For visualization: predicted probabilities
      if (length(independent_vars) == 1) {
        # For single predictor, create range
        var_name <- independent_vars[1]
        var_range <- seq(
          min(data[[var_name]], na.rm = TRUE),
          max(data[[var_name]], na.rm = TRUE),
          length.out = 50
        )
        
        # Create prediction data
        pred_data <- data.frame(x = var_range)
        names(pred_data) <- var_name
        
        # Get predictions with confidence intervals
        preds <- predict(model, newdata = pred_data, type = "response", se.fit = TRUE)
        
        marginal_effects_plot_data <- data.frame(
          x = var_range,
          predicted_prob = preds$fit,
          se = preds$se.fit,
          lower = preds$fit - 1.96 * preds$se.fit,
          upper = preds$fit + 1.96 * preds$se.fit
        )
      }
    }, error = function(e) {
      message("Marginal effects calculation failed: ", e$message)
    })
    
    # Generate R code for reproducibility
    r_code <- paste0(
      "# Logistic Regression Analysis\n",
      "# Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "\n\n",
      "library(readr)\n",
      "library(broom)\n\n",
      "# Load data\n",
      "data <- read_csv('", basename(data_path), "')\n\n",
      "# Fit model\n",
      "model <- glm(", formula_str, ", data = data, family = binomial(link = 'logit'))\n\n",
      "# View results\n",
      "summary(model)\n",
      "tidy(model, conf.int = TRUE)\n",
      "glance(model)\n",
      "\n# Odds ratios\n",
      "tidy(model, conf.int = TRUE, exponentiate = TRUE)\n"
    )
    
    # Return results
    result <- list(
      status = "success",
      model_type = "logistic",
      formula = formula_str,
      n_obs = nrow(data),
      tidy = tidy_results,
      glance = glance_results,
      r_code = r_code,
      timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S")
    )
    
    # Add marginal effects if calculated
    if (!is.null(marginal_effects)) {
      result$marginal_effects <- marginal_effects
    }
    
    if (exists("marginal_effects_plot_data")) {
      result$marginal_effects_plot_data <- marginal_effects_plot_data
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
