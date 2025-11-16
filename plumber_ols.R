# plumber_ols.R - CSC 230 R Stats API (UTF-8, no BOM)
# OLS Regression Service - Port 8000

options(plumber.debug = TRUE)

#* @apiTitle CSC 230 OLS Regression API
#* @apiDescription Port 8000 - Ordinary Least Squares regression with broom output

library(plumber)
library(jsonlite)
library(broom)
library(readr)
library(readxl)
library(car)
library(sandwich)

# ---------------- CORS (so React/Postman/Swagger can call this) ----------------
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (req$REQUEST_METHOD == "OPTIONS") return(list())
  forward()
}

# ---------------- Helpers ----------------
`%||%` <- function(a, b) if (is.null(a)) b else a

# Parse raw JSON body; accept either {payload:{...}} or {...}
parse_body <- function(req) {
  b <- tryCatch(jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
                error = function(e) NULL)
  if (is.null(b)) return(NULL)
  if (!is.null(b$payload)) b$payload else b
}

# Enhanced read function supporting CSV and XLSX
read_df <- function(path) {
  if (!file.exists(path)) stop(sprintf("data_path not found: %s", path))
  
  # Detect file type and read accordingly
  if (grepl("\\.csv$", path, ignore.case = TRUE)) {
    readr::read_csv(path, show_col_types = FALSE)
  } else if (grepl("\\.xlsx?$", path, ignore.case = TRUE)) {
    readxl::read_excel(path)
  } else {
    stop("Unsupported file type. Use .csv or .xlsx")
  }
}

# Fit OLS using broom for standardized output
fit_ols <- function(df, formula_str) {
  f   <- stats::as.formula(formula_str)
  fit <- stats::lm(f, data = df)
  
  # Use broom for standardized JSON output
  tidy_results <- broom::tidy(fit, conf.int = TRUE)
  glance_results <- broom::glance(fit)
  
  list(
    ok            = TRUE,
    tidy          = tidy_results,
    glance        = glance_results,
    diagnostics   = list(
      residuals = as.numeric(residuals(fit)),
      fitted    = as.numeric(fitted(fit))
    ),
    fit           = fit   # kept internal for VIF calculation
  )
}

# ---------------- Health ----------------
#* @get /ping
#* @serializer json
function() list(status = "healthy", port = 8000, service = "OLS")

# ---------------- Preview (POST JSON) ----------------
#* @post /preview
#* @parser json
#* @param data_path:string Path to the CSV file to preview
#* @serializer json
function(req, res) {
  payload <- parse_body(req)
  if (is.null(payload)) return(list(ok = FALSE, error = "Invalid JSON body"))
  if (is.null(payload$data_path))
    return(list(ok = FALSE, error = "Provide 'data_path'"))
  
  df <- tryCatch(read_df(payload$data_path),
                 error = function(e) return(list(.err = e$message)))
  if (!is.null(df$.err)) return(list(ok = FALSE, error = df$.err))
  
  list(
    ok      = TRUE,
    n       = nrow(df),
    columns = as.list(names(df)),
    dtypes  = as.list(sapply(df, function(x) class(x)[1])),
    head    = utils::head(df, 5)
  )
}

# ---------------- OLS (POST JSON) ----------------
#* @post /ols
#* @parser json
#* @param formula:string Regression formula (e.g. "y ~ x1 + x2")
#* @param data_path:string Path to CSV file (ignored if 'data' provided inline)
#* @param data:object Optional inline data frame as JSON array of objects
#* @param drop_na:boolean Optional; if true, drop rows with NA before fitting
#* @param as_factor_fields:array[string] Optional; coerce these columns to factor
#* @param include_vif:boolean Optional; include VIF vector (requires 'car' pkg)
#* @serializer json
function(req, res) {
  payload <- parse_body(req)
  if (is.null(payload)) return(list(ok = FALSE, error = "Invalid JSON body"))
  if (is.null(payload$formula)) return(list(ok = FALSE, error = "Missing 'formula'"))
  
  # Choose data source: inline data OR data_path
  df <- if (!is.null(payload$data)) {
    as.data.frame(payload$data, stringsAsFactors = FALSE)
  } else {
    if (is.null(payload$data_path))
      return(list(ok = FALSE, error = "Provide 'data_path' or inline 'data'"))
    p <- tryCatch(read_df(payload$data_path),
                  error = function(e) return(list(.err = e$message)))
    if (!is.null(p$.err)) return(list(ok = FALSE, error = p$.err))
    p
  }
  
  # Validate data
  if (nrow(df) == 0) {
    return(list(ok = FALSE, error = "Dataset is empty"))
  }
  if (nrow(df) < 3) {
    return(list(ok = FALSE, error = sprintf("Need at least 3 observations. Dataset has %d rows.", nrow(df))))
  }
  
  # Preprocessing
  opts <- payload$options %||% list()
  if (isTRUE(payload$drop_na) || isTRUE(opts$drop_na)) df <- stats::na.omit(df)
  asf <- payload$as_factor_fields %||% opts$as_factor_fields
  if (!is.null(asf)) for (col in asf) if (col %in% names(df)) df[[col]] <- factor(df[[col]])
  
  # Fit
  res_fit <- tryCatch(fit_ols(df, payload$formula),
                      error = function(e) list(ok = FALSE, error = paste("fit error:", e$message)))
  if (identical(res_fit$ok, FALSE)) return(res_fit)
  
  # Build output using broom results
  out <- list(
    ok       = TRUE,
    n        = nrow(df),
    formula  = payload$formula,
    tidy     = res_fit$tidy,
    glance   = res_fit$glance,
    diagnostics = res_fit$diagnostics
  )
  
  # Optional VIF
  if (isTRUE(payload$include_vif)) {
    out$vif <- tryCatch(
      {
        if (requireNamespace("car", quietly = TRUE)) as.list(car::vif(res_fit$fit))
        else "Install package 'car' (install.packages('car'))"
      },
      error = function(e) paste("VIF error:", e$message)
    )
  }
  
  # Generate reproducible R code
  out$r_code <- sprintf(
    "library(broom)\nlibrary(readr)\ndata <- read_csv('%s')\nmodel <- lm(%s, data = data)\ntidy(model, conf.int = TRUE)\nglance(model)",
    payload$data_path %||% "your_data.csv",
    payload$formula
  )
  
  out
}

# ---------------- Swagger-friendly GET wrapper (query-string) ----------------
#* @get /preview_qs
#* @param data_path:string Path to CSV (query)
#* @serializer json
function(data_path = "") {
  if (!nzchar(data_path)) return(list(ok = FALSE, error = "Provide 'data_path'"))
  df <- tryCatch(read_df(data_path), error = function(e) return(list(.err = e$message)))
  if (!is.null(df$.err)) return(list(ok = FALSE, error = df$.err))
  list(
    ok      = TRUE,
    n       = nrow(df),
    columns = as.list(names(df)),
    dtypes  = as.list(sapply(df, function(x) class(x)[1])),
    head    = utils::head(df, 5)
  )
}

#* @get /ols_qs
#* @param formula:string Regression formula, e.g. "Weight ~ Height + Age"
#* @param data_path:string Path to CSV (query)
#* @serializer json
function(formula = "", data_path = "") {
  if (!nzchar(formula))   return(list(ok = FALSE, error = "Missing 'formula'"))
  if (!nzchar(data_path)) return(list(ok = FALSE, error = "Provide 'data_path'"))
  df <- tryCatch(read_df(data_path), error = function(e) return(list(.err = e$message)))
  if (!is.null(df$.err)) return(list(ok = FALSE, error = df$.err))
  res_fit <- tryCatch(fit_ols(df, formula),
                      error = function(e) list(ok = FALSE, error = paste("fit error:", e$message)))
  if (identical(res_fit$ok, FALSE)) return(res_fit)
  
  list(
    ok      = TRUE,
    n       = nrow(df),
    formula = formula,
    tidy    = res_fit$tidy,
    glance  = res_fit$glance
  )
}
