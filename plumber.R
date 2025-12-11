# plumber.R  —  CSC 230 R Stats API  (UTF-8, no BOM)
options(plumber.debug = TRUE)

#* @apiTitle CSC 230 R Stats API
#* @apiDescription Endpoints: /ping (health), /preview (peek CSV), /ols (run OLS),
#* @apiDescription /ask_ai/structured (forward to Node AI), plus Swagger-friendly GET wrappers /preview_qs and /ols_qs.

library(plumber)
library(jsonlite)
library(httr)

# ---------------- CORS (so React/Postman/Swagger can call this) ----------------
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

# ---------------- Helpers ----------------
`%||%` <- function(a, b) if (is.null(a)) b else a

# Parse raw JSON body; accept either {payload:{...}} or {...}
parse_body <- function(req) {
  b <- tryCatch(jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
                error = function(e) NULL)
  if (is.null(b)) return(NULL)
  if (!is.null(b$payload)) b$payload else b
}

read_df <- function(path) {
  if (!file.exists(path)) stop(sprintf("data_path not found: %s", path))
  utils::read.csv(path, stringsAsFactors = FALSE)
}

fit_ols <- function(df, formula_str) {
  f   <- stats::as.formula(formula_str)
  fit <- stats::lm(f, data = df)
  s   <- summary(fit)
  
  coefs <- as.data.frame(s$coefficients)
  names(coefs) <- c("estimate","std_error","t_value","p_value")
  
  list(
    ok            = TRUE,
    r_squared     = unname(s$r.squared),
    adj_r_squared = unname(s$adj.r.squared),
    f_statistic   = unname(s$fstatistic[1]),
    df1           = unname(s$fstatistic[2]),
    df2           = unname(s$fstatistic[3]),
    coefficients  = coefs,
    fit           = fit   # kept internal; removed before response
  )
}

# ---------------- Health ----------------
#* @get /ping
#* @serializer json
function() list(status = "ok", service = "R/Plumber")

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
  
  # Preprocessing
  opts <- payload$options %||% list()
  if (isTRUE(payload$drop_na) || isTRUE(opts$drop_na)) df <- stats::na.omit(df)
  asf <- payload$as_factor_fields %||% opts$as_factor_fields
  if (!is.null(asf)) for (col in asf) if (col %in% names(df)) df[[col]] <- factor(df[[col]])
  
  # Fit
  res_fit <- tryCatch(fit_ols(df, payload$formula),
                      error = function(e) list(ok = FALSE, error = paste("fit error:", e$message)))
  if (identical(res_fit$ok, FALSE)) return(res_fit)
  
  out <- c(
    list(ok = TRUE, n = nrow(df), formula = payload$formula),
    res_fit[setdiff(names(res_fit), "fit")]
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
  
  # Don't leak the model object
  res_fit$fit <- NULL
  out
}

# ---------------- Swagger-friendly GET wrappers (query-string) ----------------
# These make Swagger "Try it out" easier since you can type into query fields.

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
  c(list(ok = TRUE, n = nrow(df), formula = formula), res_fit[setdiff(names(res_fit), "fit")])
}

# ---------------- AI Bridge (R → Node) ----------------
#* @post /ask_ai/structured
#* @parser json
#* @param user_input:string Prompt to send to the AI gateway
#* @serializer json
function(user_input = "Explain OLS assumptions in 3 bullets.") {
  payload <- list(
    system   = "Return only JSON with keys: title (string), bullets (array of strings).",
    messages = list(list(role = "user", content = user_input))
  )
  gw_url <- "http://localhost:8081/ai/complete"
  
  resp <- try(httr::POST(
    gw_url, encode = "json", body = payload,
    httr::add_headers("Content-Type"="application/json"),
    timeout(30)
  ), silent = TRUE)
  
  if (inherits(resp, "try-error"))
    return(list(ok = FALSE, error = "gateway_unreachable", detail = as.character(resp)))
  
  status <- httr::status_code(resp)
  txt    <- httr::content(resp, as = "text", encoding = "UTF-8")
  if (status >= 400) return(list(ok = FALSE, status = status, gateway_response = txt))
  
  # Try to parse gateway JSON; fallback to line bullets
  x <- tryCatch(jsonlite::fromJSON(txt, simplifyVector = FALSE), error = function(e) NULL)
  if (is.null(x)) {
    raw    <- if (!is.null(txt) && nzchar(txt)) txt else ""
    lines  <- unlist(strsplit(raw, "\n"))
    bullets <- trimws(gsub("^\\s*[-\\*]\\s*", "", lines[grepl("^\\s*(\\*|-)", lines)]))
    if (length(bullets) == 0) bullets <- list(raw)
    return(list(ok = TRUE, title = substr(user_input, 1, 80), bullets = bullets))
  }
  if (!is.null(x$title) && !is.null(x$bullets)) return(c(list(ok = TRUE), x))
  
  # Fallback coercion
  bullets <- if (is.list(x)) unlist(x) else as.character(x)
  list(ok = TRUE, title = substr(user_input, 1, 80), bullets = as.list(bullets))
}
