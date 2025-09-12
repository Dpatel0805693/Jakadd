FROM rstudio/plumber:latest
RUN R -e "install.packages(c('jsonlite','car'), repos='https://cloud.r-project.org')"

WORKDIR /app
COPY plumber.R /app/plumber.R
COPY survey.csv /data/survey.csv

EXPOSE 8080

# CMD is ONLY the script path (absolute is safest)
CMD ["/app/plumber.R"]

