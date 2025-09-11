
# templates.R
# OLS template returning tidy and glance tables + code string
run_ols <- function(df, formula_str, options = list()) {
  fm <- as.formula(formula_str)
  fit <- lm(fm, data = df)
  # tidy + glance
  tidy_tbl <- broom::tidy(fit)
  glance_tbl <- broom::glance(fit)
  # optional: notes/diagnostics placeholder
  diagnostics <- list()
  if (isTRUE(options$include_vif)) {
    diagnostics$vif <- as.list(car::vif(fit))
  }
  list(
    tidy = tidy_tbl,
    glance = glance_tbl,
    diagnostics = diagnostics,
    code = paste0("lm(", formula_str, ", data = df)")
  )
}
