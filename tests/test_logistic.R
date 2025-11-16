# CSC 230 - Logistic Regression Service Testing Suite
# Run this to test your Logistic R service

library(httr)
library(jsonlite)

R_SERVICE_URL <- "http://localhost:8002"

# Helper functions
call_logistic <- function(data_path, formula, drop_na = TRUE, as_factor_fields = NULL, exponentiate = TRUE, include_margins = FALSE) {
  body <- list(
    data_path = data_path, 
    formula = formula, 
    drop_na = drop_na,
    exponentiate = exponentiate
  )
  if (!is.null(as_factor_fields)) body$as_factor_fields <- as_factor_fields
  if (include_margins) body$include_margins <- TRUE
  
  response <- POST(paste0(R_SERVICE_URL, "/logistic"), body = body, encode = "json", content_type_json())
  content(response)
}

test_count <- 0
passed_count <- 0
failed_count <- 0

start_test <- function(name) {
  test_count <<- test_count + 1
  cat(sprintf("\n[Test %d] %s\n", test_count, name))
}

pass_test <- function() {
  passed_count <<- passed_count + 1
  cat("  ✓ PASSED\n")
}

fail_test <- function(msg) {
  failed_count <<- failed_count + 1
  cat(sprintf("  ✗ FAILED: %s\n", msg))
}

# TEST 1: Basic Binary Outcome
test_binary_outcome <- function() {
  start_test("Binary outcome logistic regression")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "binary.csv")
    
    # Create binary outcome data
    df <- data.frame(
      voted = c(1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1),
      age = c(25, 30, 22, 45, 28, 35, 50, 40, 24, 55, 60, 32, 48, 27, 52),
      income = c(50000, 60000, 35000, 75000, 45000, 55000, 80000, 70000, 40000, 90000, 95000, 52000, 78000, 42000, 85000)
    )
    
    write.csv(df, csv_path, row.names = FALSE)
    result <- call_logistic(csv_path, "voted ~ age + income")
    
    if (!result$ok) {
      fail_test(paste("Unexpected error:", result$error))
      return()
    }
    
    # Check broom format
    if (is.null(result$tidy) || is.null(result$glance)) {
      fail_test("Missing broom output (tidy or glance)")
      return()
    }
    
    cat(sprintf("  - N: %d\n", result$n))
    cat(sprintf("  - Coefficients: %d\n", nrow(result$tidy)))
    cat(sprintf("  - AIC: %.2f\n", result$glance$AIC))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 2: Odds Ratios vs Log-Odds
test_exponentiate <- function() {
  start_test("Exponentiate option (odds ratios vs log-odds)")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "binary2.csv")
    
    df <- data.frame(
      outcome = c(1, 0, 1, 1, 0, 1, 0, 1, 1, 0),
      x1 = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      x2 = c(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
    )
    
    write.csv(df, csv_path, row.names = FALSE)
    
    # Test with exponentiate=TRUE (odds ratios)
    result_or <- call_logistic(csv_path, "outcome ~ x1", exponentiate = TRUE)
    
    # Test with exponentiate=FALSE (log-odds)
    result_logodds <- call_logistic(csv_path, "outcome ~ x1", exponentiate = FALSE)
    
    if (!result_or$ok || !result_logodds$ok) {
      fail_test("One of the calls failed")
      return()
    }
    
    # Odds ratios should be > 0
    or_est <- result_or$tidy[[2]]$estimate  # Second row (x1 coefficient)
    logodds_est <- result_logodds$tidy[[2]]$estimate
    
    if (or_est <= 0) {
      fail_test("Odds ratio should be positive")
      return()
    }
    
    cat(sprintf("  - Odds Ratio: %.3f\n", or_est))
    cat(sprintf("  - Log-Odds: %.3f\n", logodds_est))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 3: Categorical Variables
test_categorical <- function() {
  start_test("Categorical predictor variables")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "categorical.csv")
    
    df <- data.frame(
      passed = c(1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0),
      study_hours = c(5, 7, 2, 8, 3, 6, 9, 1, 7, 2, 8, 6, 3, 9, 4),
      major = c("CS", "CS", "Math", "CS", "Math", "CS", "CS", "Math", "CS", "Math", 
                "CS", "CS", "Math", "CS", "Math")
    )
    
    write.csv(df, csv_path, row.names = FALSE)
    result <- call_logistic(csv_path, "passed ~ study_hours + major", as_factor_fields = c("major"))
    
    if (!result$ok) {
      fail_test(paste("Error:", result$error))
      return()
    }
    
    # Should have 3 coefficients: Intercept, study_hours, majorMath
    if (nrow(result$tidy) < 3) {
      fail_test("Expected at least 3 coefficients for categorical variable")
      return()
    }
    
    cat(sprintf("  - Coefficients: %d\n", nrow(result$tidy)))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 4: Missing Values
test_missing_values <- function() {
  start_test("Dataset with NA values")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "na_data.csv")
    
    df <- data.frame(
      outcome = c(1, 0, NA, 1, 0, 1, NA, 0, 1, 0),
      pred1 = c(10, 20, 30, NA, 50, 60, 70, NA, 90, 100),
      pred2 = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    )
    
    write.csv(df, csv_path, row.names = FALSE)
    result <- call_logistic(csv_path, "outcome ~ pred1 + pred2", drop_na = TRUE)
    
    if (!result$ok) {
      fail_test(paste("Error:", result$error))
      return()
    }
    
    # Should have 7 complete cases (10 - 3 with NA)
    if (result$n != 7) {
      fail_test(sprintf("Expected 7 cases after dropping NA, got %d", result$n))
      return()
    }
    
    cat(sprintf("  - Correctly dropped %d rows with NA\n", 10 - result$n))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 5: Model Fit Quality
test_model_fit <- function() {
  start_test("Model fit statistics (glance output)")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "fit_test.csv")
    
    set.seed(123)
    n <- 50
    x <- rnorm(n)
    prob <- plogis(0.5 + 2*x)  # True probability
    y <- rbinom(n, 1, prob)
    
    df <- data.frame(outcome = y, predictor = x)
    write.csv(df, csv_path, row.names = FALSE)
    
    result <- call_logistic(csv_path, "outcome ~ predictor")
    
    if (!result$ok) {
      fail_test(paste("Error:", result$error))
      return()
    }
    
    # Check glance output has expected fields
    required_fields <- c("AIC", "BIC", "deviance", "null.deviance", "df.residual")
    missing_fields <- required_fields[!required_fields %in% names(result$glance)]
    
    if (length(missing_fields) > 0) {
      fail_test(paste("Missing glance fields:", paste(missing_fields, collapse = ", ")))
      return()
    }
    
    cat(sprintf("  - AIC: %.2f\n", result$glance$AIC))
    cat(sprintf("  - Deviance: %.2f\n", result$glance$deviance))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# EDGE CASE: Perfect Separation
test_perfect_separation <- function() {
  start_test("EDGE CASE: Perfect separation (should warn)")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "perfect_sep.csv")
    
    # Create perfectly separable data
    df <- data.frame(
      outcome = c(0, 0, 0, 0, 0, 1, 1, 1, 1, 1),
      x = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    )
    
    write.csv(df, csv_path, row.names = FALSE)
    result <- call_logistic(csv_path, "outcome ~ x")
    
    # GLM might still fit but with warnings (captured in logs)
    # We just check it doesn't crash
    if (!result$ok) {
      cat("  - Correctly handled edge case\n")
      pass_test()
      return()
    }
    
    cat("  - Model fitted (may have warnings)\n")
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# RUN ALL TESTS
run_all_tests <- function() {
  cat("\n═══════════════════════════════════════════════════════════════\n")
  cat("  CSC 230 - LOGISTIC REGRESSION SERVICE TEST SUITE\n")
  cat("═══════════════════════════════════════════════════════════════\n")
  
  # Check service
  cat("\nChecking Logistic service...\n")
  tryCatch({
    response <- GET(paste0(R_SERVICE_URL, "/ping"))
    if (status_code(response) != 200) stop("Bad status")
    cat("✓ Logistic service is running\n")
  }, error = function(e) {
    cat("✗ Cannot connect. Start with: R -e \"plumber::plumb('plumber_logistic.R')$run(port=8002)\"\n")
    return()
  })
  
  cat("\n────────────────────────────────────────────────────────────────\n")
  
  # Run tests
  test_binary_outcome()
  test_exponentiate()
  test_categorical()
  test_missing_values()
  test_model_fit()
  test_perfect_separation()
  
  # Summary
  cat("\n═══════════════════════════════════════════════════════════════\n")
  cat("  SUMMARY\n")
  cat("═══════════════════════════════════════════════════════════════\n")
  cat(sprintf("  Total:  %d\n", test_count))
  cat(sprintf("  Passed: %d ✓\n", passed_count))
  cat(sprintf("  Failed: %d ✗\n", failed_count))
  
  if (failed_count == 0) {
    cat("\n  🎉 ALL TESTS PASSED!\n")
  }
  cat("═══════════════════════════════════════════════════════════════\n\n")
}

# Run tests
run_all_tests()
