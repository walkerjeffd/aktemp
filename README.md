Alaska Stream Temperature Database (AKTEMP)
===========================================

Jeffrey D Walker, PhD <jeff@walkerenvres.com>  
[Walker Environmental Research LLC](https://walkerenvres.com)

## About

This repo contains the source code for the Alaska Stream Temperature Database (AKTEMP). The project is being developed by Jeff Walker (Walker Environmental Research LLC) in collaboration with Rebecca Shaftel and Marcus Geist (Univ. of Alaska, Anchorage) with funding from the US Environmental Protection Agency.

## Overview

This project contains the following components:

- `api/`: REST API
- `app/`: web application
- `aws/`: cloud infrastructure
- `batch/`: batch processor
- `cli/`: command line interface
- `db/`: relational database
- `r/`: R scripts
- `trigger/`: lambda function for handling AWS cognito triggers
- `worker`: lambda function for performing AWS tasks

## Development

### Install CLI

Link CLI

```
npm link
aktemp help
```

### Set Up Database

Configure database connection in `.env.development.local`

Create database

```sh
createdb aktemp
```

Run migration and seed

```sh
npm i -g knex       # install knex cli
knex migrate:latest
knex seed:run
```

### Import Datasets

Copy AKOATS files to `r/data/`

- `lake_data_for_JeffW.csv`: NPS data for lakes
- `littleSu_data_for_jeff.csv`: UAA data for streams

Run R targets

```r
source("_targets.R")
tar_make()
```

Load providers, stations and files using cli

```sh
# NPS
aktemp providers import r/export/nps/provider.csv
aktemp stations import -o NPS r/export/nps/stations.csv
aktemp files import -o NPS -d r/export/nps/files -c r/export/nps/config.json r/export/nps/filelist.csv

# UAA
aktemp providers import r/export/uaa/provider.csv
aktemp stations import -o UAA r/export/uaa/stations.csv
aktemp files import -o UAA -d r/export/uaa/files -c r/export/uaa/config.json r/export/uaa/filelist.csv
```

Run batch processor

```sh
aktemp files process --all
```

### API Dev Server

```
cd api
npm run start
```

### Web App Dev Server

```
cd app
npm run serve
```

## Docker

Docker deployment

```bash
# load env (REGION, AWS_REPO)
source .env.docker.dev.local
source .env.docker.prod.local

# log in
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_REPO}

# build image (Intel chip)
docker build -t ${AWS_REPO} .

# build image (Mac M1 chip)
# https://stackoverflow.com/questions/67361936/exec-user-process-caused-exec-format-error-in-aws-fargate-service
docker buildx build --platform=linux/amd64 -t ${AWS_REPO} .

# push to ecr repo
docker push ${AWS_REPO}

# run docker locally, pass in env variables and AWS credentials
docker run -it --rm --env-file .env.development.local -v $HOME/.aws/:/home/node/.aws ${AWS_REPO} node index.js help
```
