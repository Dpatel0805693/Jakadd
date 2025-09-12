FROM rstudio/plumber:latest

# extra packages your API needs
RUN R -e "install.packages(c('jsonlite','car'), repos='https://cloud.r-project.org')"

WORKDIR /app
COPY plumber.R /app/plumber.R
COPY survey.csv /data/survey.csv

EXPOSE 8080
# with rstudio/plumber, CMD must be only the script path
CMD ["/app/plumber.R"]
