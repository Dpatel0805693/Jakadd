# CSC 230 - R Service Testing Suite
# Run this to test your R service with 10+ datasets

library(httr)
library(jsonlite)

R_SERVICE_URL <- "http://localhost:8000"

# Helper functions
call_ols <- function(data_path, formula, drop_na = TRUE, as_factor_fields = NULL, include_vif = FALSE) {
  body <- list(data_path = data_path, formula = formula, drop_na = drop_na)
  if (!is.null(as_factor_fields)) body$as_factor_fields <- as_factor_fields
  if (include_vif) body$include_vif <- TRUE
  
  response <- POST(paste0(R_SERVICE_URL, "/ols"), body = body, encode = "json", content_type_json())
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

# TEST 1: Basic OLS
test_basic_ols <- function() {
  start_test("Basic OLS with mtcars")
  tryCatch({
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "mtcars.csv")
    write.csv(mtcars, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "mpg ~ wt + hp")
    if (!result$ok || length(result$coefficients) != 3) {
      fail_test("Unexpected result")
      return()
    }
    cat(sprintf("  - N: %d, R²: %.4f\n", result$n, result$r_squared))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 2: Small dataset
test_small_dataset <- function() {
  start_test("Small dataset (10 rows)")
  tryCatch({
    small <- data.frame(outcome = c(10,12,15,14,18,20,22,25,28,30), predictor = 1:10)
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "small.csv")
    write.csv(small, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "outcome ~ predictor")
    if (!result$ok || result$n != 10) {
      fail_test("Unexpected result")
      return()
    }
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 3: Large dataset with performance check
test_large_dataset <- function() {
  start_test("Large dataset (10,000 rows)")
  tryCatch({
    set.seed(456)
    large <- data.frame(outcome = rnorm(10000), pred1 = rnorm(10000), pred2 = rnorm(10000))
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "large.csv")
    write.csv(large, csv_path, row.names = FALSE)
    
    start_time <- Sys.time()
    result <- call_ols(csv_path, "outcome ~ pred1 + pred2")
    duration <- as.numeric(difftime(Sys.time(), start_time, units = "secs"))
    
    if (!result$ok || result$n != 10000) {
      fail_test("Unexpected result")
      return()
    }
    cat(sprintf("  - Duration: %.2fs\n", duration))
    if (duration > 5) cat("  ⚠ WARNING: Took >5 seconds\n")
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 4: Missing values
test_missing_values <- function() {
  start_test("Dataset with NA values")
  tryCatch({
    na_data <- data.frame(
      outcome = c(10, 12, NA, 14, 18, NA, 22, 25, 28, 30),
      pred = c(1, 2, 3, NA, 5, 6, 7, NA, 9, 10)
    )
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "na.csv")
    write.csv(na_data, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "outcome ~ pred", drop_na = TRUE)
    if (!result$ok || result$n != 7) {
      fail_test("Should have 7 complete cases")
      return()
    }
    cat("  - Correctly dropped 3 rows with NA\n")
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 5: Categorical variables
test_categorical <- function() {
  start_test("Categorical variables")
  tryCatch({
    cat_data <- data.frame(
      income = c(30000, 45000, 60000, 55000, 70000, 80000, 50000, 65000, 75000, 90000),
      education = c("HS", "HS", "BA", "BA", "MA", "MA", "HS", "BA", "MA", "PhD")
    )
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "cat.csv")
    write.csv(cat_data, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "income ~ education", as_factor_fields = c("education"))
    if (!result$ok || length(result$coefficients) < 2) {
      fail_test("Categorical not handled")
      return()
    }
    cat(sprintf("  - Coefficients: %d\n", length(result$coefficients)))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# TEST 6: VIF calculation
test_vif <- function() {
  start_test("VIF calculation")
  tryCatch({
    set.seed(789)
    n <- 100
    x1 <- rnorm(n)
    x2 <- x1 + rnorm(n, sd = 0.5)
    y <- 2*x1 + 3*x2 + rnorm(n)
    vif_data <- data.frame(outcome = y, pred1 = x1, pred2 = x2)
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "vif.csv")
    write.csv(vif_data, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "outcome ~ pred1 + pred2", include_vif = TRUE)
    if (!result$ok || is.null(result$vif)) {
      fail_test("VIF not returned")
      return()
    }
    cat(sprintf("  - VIF: pred1=%.2f, pred2=%.2f\n", result$vif$pred1, result$vif$pred2))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# EDGE CASE: Empty CSV
test_empty_csv <- function() {
  start_test("EDGE CASE: Empty CSV")
  tryCatch({
    empty <- data.frame(outcome = numeric(0), pred = numeric(0))
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "empty.csv")
    write.csv(empty, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "outcome ~ pred")
    if (result$ok) {
      fail_test("Should reject empty data")
      return()
    }
    cat("  - Correctly rejected\n")
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# EDGE CASE: Invalid column
test_invalid_column <- function() {
  start_test("EDGE CASE: Invalid column name")
  tryCatch({
    test_data <- data.frame(outcome = 1:10, pred = 1:10)
    temp_dir <- tempdir()
    csv_path <- file.path(temp_dir, "test.csv")
    write.csv(test_data, csv_path, row.names = FALSE)
    result <- call_ols(csv_path, "outcome ~ invalid")
    if (result$ok) {
      fail_test("Should fail for invalid column")
      return()
    }
    cat(sprintf("  - Error: %s\n", substr(result$error, 1, 50)))
    pass_test()
  }, error = function(e) fail_test(e$message))
}

# RUN ALL TESTS
run_all_tests <- function() {
  cat("\n═══════════════════════════════════════════════════════════════\n")
  cat("  CSC 230 - R SERVICE TEST SUITE\n")
  cat("═══════════════════════════════════════════════════════════════\n")
  
  # Check service
  cat("\nChecking R service...\n")
  tryCatch({
    response <- GET(paste0(R_SERVICE_URL, "/ping"))
    if (status_code(response) != 200) stop("Bad status")
    cat("✓ R service is running\n")
  }, error = function(e) {
    cat("✗ Cannot connect. Start with: R -e \"plumber::plumb('plumber.R')$run(port=8000)\"\n")
    return()
  })
  
  cat("\n───────────────────────────────────────────────────────────────\n")
  
  # Run tests
  test_basic_ols()
  test_small_dataset()
  test_large_dataset()
  test_missing_values()
  test_categorical()
  test_vif()
  test_empty_csv()
  test_invalid_column()
  
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
