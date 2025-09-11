# r/Dockerfile
FROM rocker/r-ver:4.3.2

# Install plumber + dependencies explicitly
RUN R -e "install.packages(c('plumber','jsonlite','car','httpuv','later','promises','Rcpp','rlang'), \
          repos='https://cloud.r-project.org', dependencies=TRUE)"

WORKDIR /app
COPY plumber.R ./
# COPY templates.R utils.R ./    # uncomment if you use them
COPY survey.csv /data/survey.csv

EXPOSE 8080
CMD ["R","-e","pr <- plumber::pr('plumber.R'); pr$run(host='0.0.0.0', port=8080)"]
