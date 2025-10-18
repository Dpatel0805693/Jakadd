FROM rocker/r-ver:4.3.0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install R packages
RUN R -e "install.packages(c('plumber', 'jsonlite', 'broom', 'httr', 'car'), repos='https://cran.rstudio.com/')"

# Set working directory
WORKDIR /app

# Copy R service files
COPY plumber.R .
COPY templates.R .
COPY utils.R .

# Expose port
EXPOSE 8000

# Run plumber
CMD ["R", "-e", "plumber::plumb('plumber.R')$run(host='0.0.0.0', port=8000)"]
```

---

### **File 3: `r/.dockerignore`**
```
tests/
example_data/
.Rhistory
*.log
.DS_Store
