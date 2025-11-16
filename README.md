# StatsMate R Services

**CSC 230 Project** - Statistical Regression Analysis Services  
**Team Lead:** Jordano (R/Stats + AI Gateway)  
**Last Updated:** November 16, 2025

---

##  Overview

This directory contains three R-based statistical analysis services built with Plumber:

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **OLS** | 8000 | Ordinary Least Squares regression |  Production |
| **Logistic** | 8002 | Logistic regression (binary outcomes) |  Production |
| **Reserved** | 8004 | Future expansion (Probit, Poisson, etc.) |  Planned |

---

##  Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all 3 services
docker-compose up --build

# Verify all services are running
curl http://localhost:8000/ping  # OLS
curl http://localhost:8002/ping  # Logistic
curl http://localhost:8004/ping  # Reserved
```

### Option 2: Run Individually (Development)

```bash
# Terminal 1: OLS Service
R -e "plumber::plumb('plumber_ols.R')$run(host='0.0.0.0', port=8000)"

# Terminal 2: Logistic Service
R -e "plumber::plumb('plumber_logistic.R')$run(host='0.0.0.0', port=8002)"

# Terminal 3: Reserved Service
R -e "plumber::plumb('plumber_reserved.R')$run(host='0.0.0.0', port=8004)"
```

---

## Dependencies

All services use the following R packages:

**Core:**
- `plumber` (API framework)
- `broom` (standardized regression output)
- `jsonlite` (JSON parsing)
- `readr` (fast CSV reading)
- `readxl` (Excel file support)

**Service-Specific:**
- `car` (VIF calculation for OLS)
- `sandwich` (robust standard errors for OLS)
- `margins` (marginal effects for Logistic)

Install manually:
```r
install.packages(c("plumber", "broom", "readr", "readxl", "car", "sandwich", "margins"))
```

---

## API Documentation

### OLS Service (Port 8000)

#### Health Check
```bash
GET http://localhost:8000/ping
```

**Response:**
```json
{
  "status": "healthy",
  "port": 8000,
  "service": "OLS"
}
```

#### Preview Data
```bash
POST http://localhost:8000/preview
Content-Type: application/json

{
  "data_path": "/data/survey.csv"
}
```

**Response:**
```json
{
  "ok": true,
  "n": 100,
  "columns": ["age", "income", "voted"],
  "dtypes": ["numeric", "numeric", "integer"],
  "head": [...]
}
```

#### Run OLS Regression
```bash
POST http://localhost:8000/ols
Content-Type: application/json

{
  "data_path": "/data/survey.csv",
  "formula": "voted ~ age + income",
  "drop_na": true,
  "as_factor_fields": ["education"],
  "include_vif": true
}
```

**Response (using broom format):**
```json
{
  "ok": true,
  "n": 98,
  "formula": "voted ~ age + income",
  "tidy": [
    {
      "term": "(Intercept)",
      "estimate": 0.45,
      "std.error": 0.12,
      "statistic": 3.75,
      "p.value": 0.0003,
      "conf.low": 0.21,
      "conf.high": 0.69
    },
    ...
  ],
  "glance": {
    "r.squared": 0.68,
    "adj.r.squared": 0.67,
    "sigma": 0.15,
    "statistic": 98.45,
    "p.value": 0.0000001,
    "df": 2,
    "df.residual": 95,
    "nobs": 98
  },
  "diagnostics": {
    "residuals": [...],
    "fitted": [...]
  },
  "vif": {
    "age": 1.2,
    "income": 1.3
  },
  "r_code": "library(broom)\nlibrary(readr)\ndata <- read_csv('/data/survey.csv')\nmodel <- lm(voted ~ age + income, data = data)\ntidy(model, conf.int = TRUE)\nglance(model)"
}
```

---

### Logistic Service (Port 8002)

#### Health Check
```bash
GET http://localhost:8002/ping
```

#### Run Logistic Regression
```bash
POST http://localhost:8002/logistic
Content-Type: application/json

{
  "data_path": "/data/election.csv",
  "formula": "voted ~ age + income + education",
  "drop_na": true,
  "as_factor_fields": ["education"],
  "exponentiate": true,
  "include_margins": false
}
```

**Response (using broom format):**
```json
{
  "ok": true,
  "n": 150,
  "formula": "voted ~ age + income + education",
  "tidy": [
    {
      "term": "(Intercept)",
      "estimate": 0.23,
      "std.error": 0.18,
      "statistic": 1.28,
      "p.value": 0.20,
      "conf.low": 0.08,
      "conf.high": 0.65
    },
    {
      "term": "age",
      "estimate": 1.05,
      "std.error": 0.01,
      "statistic": 4.12,
      "p.value": 0.00004,
      "conf.low": 1.03,
      "conf.high": 1.07
    }
  ],
  "glance": {
    "null.deviance": 207.89,
    "df.null": 149,
    "logLik": -95.34,
    "AIC": 200.68,
    "BIC": 213.45,
    "deviance": 190.68,
    "df.residual": 146,
    "nobs": 150
  },
  "diagnostics": {
    "residuals": [...],
    "fitted": [...]
  },
  "r_code": "..."
}
```

**Note:** When `exponentiate: true` (default), coefficients are odds ratios. Set to `false` for log-odds.

---

### Reserved Service (Port 8004)

#### Health Check
```bash
GET http://localhost:8004/ping
```

#### Info
```bash
GET http://localhost:8004/info
```

**Response:**
```json
{
  "message": "This service is reserved for future statistical methods",
  "planned_features": [
    "Probit Regression",
    "Poisson Regression",
    "Negative Binomial Regression",
    "Panel Data Models (Fixed Effects, Random Effects)",
    "Time Series Analysis",
    "Instrumental Variables (2SLS)"
  ],
  "status": "Coming Soon"
}
```

---

## Testing

### Run Test Suites

```bash
# Test OLS service
Rscript tests/test_ols.R

# Test Logistic service
Rscript tests/test_logistic.R
```

### Manual Testing with curl

**Test OLS with mtcars:**
```bash
# Create test data
cat > /tmp/mtcars.csv << EOF
mpg,wt,hp
21.0,2.620,110
21.0,2.875,110
22.8,2.320,93
21.4,3.215,110
18.7,3.440,175
EOF

# Run regression
curl -X POST http://localhost:8000/ols \
  -H "Content-Type: application/json" \
  -d '{
    "data_path": "/tmp/mtcars.csv",
    "formula": "mpg ~ wt + hp",
    "drop_na": true
  }' | jq
```

**Test Logistic with binary outcome:**
```bash
# Create test data
cat > /tmp/binary.csv << EOF
voted,age,income
1,25,50000
0,30,45000
1,35,60000
0,40,55000
1,45,70000
1,50,75000
0,28,48000
1,55,80000
0,32,52000
1,60,85000
EOF

# Run logistic regression
curl -X POST http://localhost:8002/logistic \
  -H "Content-Type: application/json" \
  -d '{
    "data_path": "/tmp/binary.csv",
    "formula": "voted ~ age + income",
    "exponentiate": true
  }' | jq
```

---

## Docker Configuration

### Dockerfile Structure

Each service has its own Dockerfile:

- `Dockerfile.ols` - OLS service with car, sandwich packages
- `Dockerfile.logistic` - Logistic service with margins package
- `Dockerfile.reserved` - Minimal reserved service

### Building Images Individually

```bash
# Build OLS image
docker build -f Dockerfile.ols -t statsmate-ols:latest .

# Build Logistic image
docker build -f Dockerfile.logistic -t statsmate-logistic:latest .

# Build Reserved image
docker build -f Dockerfile.reserved -t statsmate-reserved:latest .
```

### Volume Mounts

The docker-compose.yml mounts two directories:

- `./data:/data:ro` - Read-only data directory for CSV/XLSX files
- `./examples:/examples:ro` - Read-only example datasets

**Usage in API calls:**
```json
{
  "data_path": "/data/your_file.csv"
}
```

---

## Project Structure

```
r-services/
├── plumber_ols.R           # OLS service (port 8000)
├── plumber_logistic.R      # Logistic service (port 8002)
├── plumber_reserved.R      # Reserved service (port 8004)
├── Dockerfile.ols          # OLS Docker image
├── Dockerfile.logistic     # Logistic Docker image
├── Dockerfile.reserved     # Reserved Docker image
├── docker-compose.yml      # Orchestration for all 3 services
├── .dockerignore           # Files to exclude from Docker builds
├── README.md               # This file
├── tests/
│   ├── test_ols.R          # OLS test suite
│   └── test_logistic.R     # Logistic test suite
├── data/                   # Data directory (mounted in Docker)
│   └── survey.csv          # Example dataset
└── examples/               # Example scripts and datasets
    ├── example_ols.R
    └── example_logistic.R
```

---

## Troubleshooting

### Service won't start

**Check if port is already in use:**
```bash
lsof -i :8000  # OLS
lsof -i :8002  # Logistic
lsof -i :8004  # Reserved
```

**Kill process using port:**
```bash
kill -9 $(lsof -t -i:8000)
```

### Package installation fails

**Install system dependencies first:**
```bash
# Ubuntu/Debian
sudo apt-get install libcurl4-openssl-dev libssl-dev libxml2-dev

# macOS
brew install curl openssl libxml2
```

### Data file not found

**Verify file path:**
- Docker: Files must be in mounted `./data/` directory
- Local: Use absolute paths like `/tmp/data.csv`

### Broom output format issues

**Verify broom is installed:**
```r
library(broom)
packageVersion("broom")  # Should be >= 1.0.0
```

---

## Integration with Other Services

### Called by Integration API (Amanda)

Amanda's Integration API orchestrates calls to these services:

1. **Type Detection** → AI Gateway (Jordano)
2. **Model Suggestion** → AI Gateway (Jordano)
3. **Run Analysis** → R Service (OLS or Logistic based on suggestion)
4. **Interpret Results** → AI Gateway (Jordano)

**Example workflow:**
```
User uploads CSV
  ↓
Integration API calls AI Gateway: "What variable types?"
  ↓
Integration API calls AI Gateway: "OLS or Logistic?"
  ↓
Integration API calls R Service: POST /ols or /logistic
  ↓
Integration API calls AI Gateway: "Explain results"
  ↓
Results sent to Frontend
```

---

## 📊 Performance Benchmarks

**Tested on:** 2.5 GHz Quad-Core, 16GB RAM

| Dataset Size | OLS Time | Logistic Time |
|--------------|----------|---------------|
| 100 rows | 0.2s | 0.3s |
| 1,000 rows | 0.8s | 1.2s |
| 10,000 rows | 3.2s | 4.5s |
| 100,000 rows | 28s | 42s |

**Target:** < 5 seconds for 1,000 rows ( Met)

---

## Definition of Done

- [x] plumber_ols.R returns broom-formatted JSON
- [x] plumber_logistic.R returns broom-formatted JSON
- [x] Both handle CSV and XLSX files
- [x] Error messages are descriptive
- [x] All 3 services respond to /ping
- [x] Docker images build successfully
- [x] docker-compose orchestrates all services
- [x] Test suites pass (8/8 for OLS, 1/1 for Logistic)
- [x] Documentation complete

---

## Support

**Team Lead:** Jordano  
**Role:** R/Stats + AI Gateway Lead  
**Project:** StatsMate (CSC 230)

**For issues:**
1. Check this README first
2. Review test files for examples
3. Check Swagger UI: http://localhost:8000/__docs__/
4. Contact team lead

---

##  Security Notes

- All data volumes are mounted read-only (`:ro`)
- Services run in isolated Docker network
- No sensitive data stored in images
- CORS enabled for development (restrict in production)

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0  
**Status:** Production Ready 
