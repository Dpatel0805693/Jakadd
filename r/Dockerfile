FROM rstudio/plumber:latest

RUN R -e "install.packages(c('jsonlite','car'), repos='https://cloud.r-project.org')"

WORKDIR /app
COPY plumber.R /app/plumber.R
COPY survey.csv /data/survey.csv

EXPOSE 8080

# Ignore the base image's entrypoint and run our own command.
ENTRYPOINT []
CMD ["R","-q","-e","pr <- plumber::pr('/app/plumber.R'); pr$run(host='0.0.0.0', port=8080)"]
