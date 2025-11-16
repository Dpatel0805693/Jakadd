# plumber_reserved.R - CSC 230 R Stats API
# Reserved Service - Port 8004 (Future Expansion)

options(plumber.debug = TRUE)

#* @apiTitle CSC 230 Reserved Service API
#* @apiDescription Port 8004 - Reserved for future statistical methods

library(plumber)

# ---------------- CORS ----------------
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  if (req$REQUEST_METHOD == "OPTIONS") return(list())
  forward()
}

# ---------------- Health Check ----------------
#* @get /ping
#* @serializer json
function() {
  list(
    status = "healthy", 
    port = 8004, 
    service = "Reserved"
  )
}

# ---------------- Service Info ----------------
#* @get /info
#* @serializer json
function() {
  list(
    message = "This service is reserved for future statistical methods",
    planned_features = list(
      "Probit Regression",
      "Poisson Regression",
      "Negative Binomial Regression",
      "Panel Data Models (Fixed Effects, Random Effects)",
      "Time Series Analysis",
      "Instrumental Variables (2SLS)"
    ),
    status = "Coming Soon",
    contact = "Contact your team lead for feature requests"
  )
}

# ---------------- Placeholder Endpoint ----------------
#* @post /analyze
#* @parser json
#* @serializer json
function(req) {
  list(
    ok = FALSE,
    error = "This service is not yet implemented. Please use /ols (port 8000) or /logistic (port 8002)",
    available_services = list(
      ols = "http://localhost:8000",
      logistic = "http://localhost:8002"
    )
  )
}
