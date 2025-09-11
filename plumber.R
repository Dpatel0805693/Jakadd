# plumber.R
#* @apiTitle CSC 230 R Stats API
#* @apiDescription OLS via JSON body. Endpoints: /ping, /preview, /ols

library(plumber)
library(jsonlite)

# --------- CORS (so React can call this) ----------
#* @filter cors
function(req, res){
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (req$REQUEST_METHOD == "OPTIONS") return(list())
  forward()
}

# ----------------- Helpers ------------------------
read_df <- function(path){
  if (!file.exists(path)) stop(sprintf("data_path not found: %s", path))
  read.csv(path, stringsAsFactors = FALSE)
}

fit_ols <- function(df, formula_str){
  f <- stats::as.formula(formula_str)
  fit <- stats::lm(f, data = df)
  s <- summary(fit)
  coefs <- as.data.frame(s$coefficients)
  names(coefs) <- c("estimate","std_error","t_value","p_value")
  list(
    r_squared     = unname(s$r.squared),
    adj_r_squared = unname(s$adj.r.squared),
    f_statistic   = unname(s$fstatistic[1]),
    df1           = unname(s$fstatistic[2]),
    df2           = unname(s$fstatistic[3]),
    coefficients  = coefs,
    fit           = fit   # returned internally for optional VIF; not serialized
  )
}

# ----------------- Health -------------------------
#* @get /ping
function() list(status = "ok")

# ------------- Preview for debugging --------------
#* @post /preview
#* @serializer json
#* @parser json
#* @param payload:object The request payload with { "data_path": "..." }
#* @requestBody @json
function(payload){
  if (is.null(payload$data_path)) return(list(ok=FALSE, error="Provide 'data_path'"))
  if (!file.exists(payload$data_path)) return(list(ok=FALSE, error=paste("not found:", payload$data_path)))
  df <- read_df(payload$data_path)
  list(
    ok = TRUE,
    n = nrow(df),
    columns = as.list(names(df)),
    dtypes = as.list(sapply(df, function(x) class(x)[1])),
    head = utils::head(df, 5)
  )
}

# ------------------- OLS --------------------------
#* @post /ols
#* @serializer json
#* @parser json
#* @param payload:object A JSON object with fields: data_path OR data[], formula, options{}
#* @requestBody @json
#* @response 200 A JSON object containing model summary and (optional) VIF
function(payload){
  # payload structure (examples shown in Swagger "Example Value"):
  # {
  #   "data_path": "C:\\\\Users\\\\Owner\\\\OneDrive\\\\Documents\\\\Test\\\\survey.csv",
  #   "formula": "vote_intent ~ age + education_years + incumbent_party_id",
  #   "options": {
  #     "include_vif": true,
  #     "drop_na": true,
  #     "as_factor_fields": ["incumbent_party_id"]
  #   }
  # }
  if (is.null(payload$data_path) && is.null(payload$data))
    return(list(ok=FALSE, error="Provide 'data_path' or inline 'data'"))
  if (is.null(payload$formula))
    return(list(ok=FALSE, error="Missing 'formula'"))
  
  df <- if (!is.null(payload$data_path)) {
    if (!file.exists(payload$data_path)) return(list(ok=FALSE, error=paste("not found:", payload$data_path)))
    read_df(payload$data_path)
  } else {
    as.data.frame(payload$data, stringsAsFactors = FALSE)
  }
  
  # preprocessing controls
  if (isTRUE(payload$options$drop_na)) df <- stats::na.omit(df)
  if (!is.null(payload$options$as_factor_fields)) {
    for (col in payload$options$as_factor_fields) if (col %in% names(df)) df[[col]] <- as.factor(df[[col]])
  }
  
  res <- tryCatch(fit_ols(df, payload$formula),
                  error = function(e) return(list(ok=FALSE, error=conditionMessage(e))))
  if (isFALSE(is.null(res$ok)) && isFALSE(res$ok)) return(res)
  
  out <- c(
    list(ok=TRUE, n=nrow(df), formula=payload$formula),
    res[setdiff(names(res), "fit")]
  )
  
  if (isTRUE(payload$options$include_vif)) {
    out$vif <- tryCatch({
      if (requireNamespace("car", quietly = TRUE)) as.list(car::vif(res$fit))
      else "Install package 'car' (install.packages('car'))"
    }, error = function(e) paste("VIF error:", e$message))
  }
  
  # don't leak the fit object
  out$fit <- NULL
  out
}
