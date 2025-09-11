# r/Dockerfile
FROM rocker/plumber:latest

# Any extra packages you use
RUN R -e "install.packages(c('jsonlite','car'), repos='https://cloud.r-project.org')"

WORKDIR /app
COPY plumber.R ./
# COPY templates.R utils.R ./    # uncomment if you use them
COPY survey.csv /data/survey.csv

EXPOSE 8080
CMD ["R","-q","-e","pr <- plumber::pr('plumber.R'); pr$run(host='0.0.0.0', port=8080)"]
