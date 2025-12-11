# plumber_reserved.R - Reserved Service (Future Expansion)
# Port: 8004
library(plumber)

#* @apiTitle Reserved Service
#* @apiDescription Reserved for future statistical methods

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

# ---------------- Endpoints ----------------

#* Health check
#* @get /ping
function() {
  list(
    status = "healthy",
    service = "reserved",
    message = "This service is reserved for future expansion",
    timestamp = Sys.time()
  )
}

#* Placeholder endpoint
#* @get /info
function() {
  list(
    message = "This service is reserved for future statistical methods",
    available_soon = c("ANOVA", "Time Series", "Mixed Models")
  )
}