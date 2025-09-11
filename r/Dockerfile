# r/Dockerfile
FROM rstudio/plumber:latest

# Any extra packages you need
RUN R -e "install.packages(c('jsonlite','car'), repos='https://cloud.r-project.org')"

WORKDIR /app
COPY plumber.R /app/plumber.R
# COPY templates.R utils.R /app/   # uncomment if you use them
COPY survey.csv /data/survey.csv

EXPOSE 8080

# IMPORTANT: with rstudio/plumber, CMD should be only the API file path
CMD ["plumber.R"]
