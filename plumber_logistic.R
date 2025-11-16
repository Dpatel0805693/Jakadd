# plumber_logistic.R - CSC 230 R Stats API
# Logistic Regression Service - Port 8002

options(plumber.debug = TRUE)

#* @apiTitle CSC 230 Logistic Regression API
#* @apiDescription Port 8002 - Logistic regression for binary outcomes with broom output

library(plumber)
library(jsonlite)
library(broom)
library(readr)
library(readxl)
library(margins)

# ---------------- CORS ----------------
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

parse_body <- function(req) {
  b <- tryCatch(jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
                error = function(e) NULL)
  if (is.null(b)) return(NULL)
  if (!is.null(b$payload)) b$payload else b
}

read_df <- function(path) {
  if (!file.exists(path)) stop(sprintf("data_path not found: %s", path))
  
  if (grepl("\\.csv$", path, ignore.case = TRUE)) {
    readr::read_csv(path, show_col_types = FALSE)
  } else if (grepl("\\.xlsx?$", path, ignore.case = TRUE)) {
    readxl::read_excel(path)
  } else {
    stop("Unsupported file type. Use .csv or .xlsx")
  }
}

# Fit Logistic Regression using broom
fit_logistic <- function(df, formula_str, exponentiate = TRUE) {
  f   <- stats::as.formula(formula_str)
  fit <- stats::glm(f, data = df, family = binomial())
  
  # Use broom for standardized JSON output
  # exponentiate=TRUE converts log-odds to odds ratios
  tidy_results <- broom::tidy(fit, conf.int = TRUE, exponentiate = exponentiate)
  glance_results <- broom::glance(fit)
  
  list(
    ok            = TRUE,
    tidy          = tidy_results,
    glance        = glance_results,
    diagnostics   = list(
      residuals = as.numeric(residuals(fit, type = "deviance")),
      fitted    = as.numeric(fitted(fit))
    ),
    fit           = fit   # kept internal for marginal effects
  )
}

# ---------------- Health ----------------
#* @get /ping
#* @serializer json
function() list(status = "healthy", port = 8002, service = "Logistic")

# ---------------- Preview (POST JSON) ----------------
#* @post /preview
#* @parser json
#* @param data_path:string Path to the CSV or XLSX file to preview
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

# ---------------- Logistic Regression (POST JSON) ----------------
#* @post /logistic
#* @parser json
#* @param formula:string Regression formula (e.g. "voted ~ age + income")
#* @param data_path:string Path to CSV or XLSX file
#* @param data:object Optional inline data frame as JSON array of objects
#* @param drop_na:boolean Optional; if true, drop rows with NA before fitting
#* @param as_factor_fields:array[string] Optional; coerce these columns to factor
#* @param exponentiate:boolean Optional; if true (default), return odds ratios instead of log-odds
#* @param include_margins:boolean Optional; include marginal effects
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
  
  # Exponentiate option (default TRUE for odds ratios)
  exponentiate <- if (is.null(payload$exponentiate)) TRUE else payload$exponentiate
  
  # Fit
  res_fit <- tryCatch(fit_logistic(df, payload$formula, exponentiate),
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
  
  # Optional marginal effects
  if (isTRUE(payload$include_margins)) {
    out$margins <- tryCatch(
      {
        if (requireNamespace("margins", quietly = TRUE)) {
          marg <- margins::margins(res_fit$fit)
          summary(marg)
        } else {
          "Install package 'margins' (install.packages('margins'))"
        }
      },
      error = function(e) paste("Margins error:", e$message)
    )
  }
  
  # Generate reproducible R code
  out$r_code <- sprintf(
    "library(broom)\nlibrary(readr)\ndata <- read_csv('%s')\nmodel <- glm(%s, data = data, family = binomial())\ntidy(model, conf.int = TRUE, exponentiate = %s)\nglance(model)",
    payload$data_path %||% "your_data.csv",
    payload$formula,
    ifelse(exponentiate, "TRUE", "FALSE")
  )
  
  out
}

# ---------------- Swagger-friendly GET wrapper ----------------
#* @get /logistic_qs
#* @param formula:string Regression formula, e.g. "voted ~ age + income"
#* @param data_path:string Path to data file
#* @serializer json
function(formula = "", data_path = "") {
  if (!nzchar(formula))   return(list(ok = FALSE, error = "Missing 'formula'"))
  if (!nzchar(data_path)) return(list(ok = FALSE, error = "Provide 'data_path'"))
  df <- tryCatch(read_df(data_path), error = function(e) return(list(.err = e$message)))
  if (!is.null(df$.err)) return(list(ok = FALSE, error = df$.err))
  res_fit <- tryCatch(fit_logistic(df, formula, exponentiate = TRUE),
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
