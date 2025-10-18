# Improved error handling wrapper
safe_ols <- function(df, formula_str, options = list()) {
  tryCatch({
    # Validate data
    if (nrow(df) == 0) {
      return(list(
        ok = FALSE,
        error = "Your dataset is empty. Please upload a file with data."
      ))
    }
    
    if (nrow(df) < 3) {
      return(list(
        ok = FALSE,
        error = sprintf("Need at least 3 observations for regression. Your file has only %d row(s).", nrow(df))
      ))
    }
    
    # Parse formula
    formula_obj <- tryCatch(
      as.formula(formula_str),
      error = function(e) {
        return(list(
          ok = FALSE,
          error = sprintf("Invalid formula syntax: '%s'. Use format: outcome ~ predictor1 + predictor2", formula_str)
        ))
      }
    )
    
    if (is.list(formula_obj) && !formula_obj$ok) {
      return(formula_obj)
    }
    
    # Check if columns exist
    vars <- all.vars(formula_obj)
    missing_vars <- vars[!vars %in% names(df)]
    
    if (length(missing_vars) > 0) {
      available <- paste(names(df), collapse = ", ")
      return(list(
        ok = FALSE,
        error = sprintf("Column(s) not found: %s. Available columns: %s", 
                       paste(missing_vars, collapse = ", "), 
                       available)
      ))
    }
    
    # Run regression (your existing code)
    # ... existing OLS code ...
    
  }, error = function(e) {
    list(ok = FALSE, error = paste("Regression error:", e$message))
  })
}
