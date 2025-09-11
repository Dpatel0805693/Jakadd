
# utils.R
# Safe CSV reader; you can extend to excel/parquet later
read_df <- function(path) {
  if (!file.exists(path)) stop(paste("File not found:", path))
  df <- read.csv(path, stringsAsFactors = FALSE)
  df
}
