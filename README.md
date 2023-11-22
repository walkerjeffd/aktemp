Alaska Water Temperature Database (AKTEMP)
==========================================

Jeffrey D Walker, PhD <jeff@walkerenvres.com>  
[Walker Environmental Research LLC](https://walkerenvres.com)

Prepared for [Alaska Center for Conservation Science, University of Alaska Anchorage](https://accs.uaa.alaska.edu/) with funding from a [U.S. Environmental Protection Agency (USEPA) Exchange Network Grant](https://www.epa.gov/exchangenetwork/exchange-network-grant-program)

URL: https://aktemp.uaa.alaska.edu/

## About

This repo contains the source code for the [AKTEMP Water Temperature Database](https://aktemp.uaa.alaska.edu/). AKTEMP is a cloud-based database for storing, accessing, downloading, and exploring water temperature data for Alaska.

## Overview

The source code in this repo includes the following components:

- `api/`: REST API
- `app/`: front-end web application
- `aws/`: cloud infrastructure
- `cli/`: command line interface
- `db/`: relational database
- `demo/`: demo data
- `utils/`: utilities package

The root of the repo includes a `Dockerfile` that creates an image for running the AKTEMP CLI.

## Development Environment

AKTEMP requires [Node.js](https://nodejs.org/) (v18 or higher).

After installing node, install the root package dependencies:

```sh
npm install
```

## Configuration

Set up `.env` configuration files for each environment (development, production, test). These files are based on the [`dotenv-flow`](https://www.npmjs.com/package/dotenv-flow) conventions, which allow separate configures for each environment (e.g. `.env.development.local` and `.env.production.local`). Note that `.env.*.local` files are not tracked by git.

```sh
# AWS region
REGION=

# AWS S3 bucket name for storing uploaded files
STORAGE_BUCKET=
# *or* specify local storage path
STORAGE_PATH=

# AWS Batch job definition name and queue name
JOB_DEFINITION=
JOB_QUEUE=

# Email address for sending request notifications
AKTEMP_EMAIL=

# AWS Cognito user pool ID
USER_POOL_ID=

# AWS SNS topic ARN for sending admin notifications
NOTIFY_TOPIC=

# Database connection info
# Secret Name for fetching DB credentials from AWS Secrets Manager
DB_SECRET=
# *or* specify DB credentials directly
DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USER=
DB_PASSWORD=

# Google Recaptcha keys
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

## Database

AKTEMP is designed to use [PostgreSQL](https://www.postgresql.org/) as the database backend. The database schema is defined and managed using [Knex.js](https://knexjs.org/), which is a SQL query builder for Node.js.

See `db/README.md` for details on the database.

## Utilities Package

The `utils/` folder contains a package of utilities used by the AKTEMP CLI to manage data in the AKTEMP database. These utilities are also used by the AWS Batch jobs to process uploaded files.

See `utils/README.md` for details on the utilities package.

## Command Line Interface (CLI)

The AKTEMP CLI can be used to access and manage data in the AKTEMP database. The CLI can be used locally to upload files directly to AKTEMP. It is also used to run batch jobs for importing files uploaded by users using AWS Batch.

See `cli/README.md` for details on the CLI.

## API

The AKTEMP API is a REST API that provides access to the AKTEMP database.

See `api/README.md` for details on the API.

## Web Application

The AKTEMP website is a Vue.js single page application (SPA) that provides a web interface for accessing and downloading data from the AKTEMP database.

See `app/README.md` for details on the web application.

## Docker Container

The `Dockerfile` can be used to create a docker image for running the AKTEMP CLI. This image is used primarily to process uploaded files using AWS Batch.

### Configuration

Environment variables are used to configure the docker image. These variables can be defined using a separate set of `.env` files such as `.env.docker.development.local` and `.env.docker.production.local` (note: because they end in `.local` they will not be tracked by git).

The following variables are required

```sh
# AWS region (e.g. us-east-1)
REGION=
# AWS ECR repo (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/aktemp-batch)
AWS_REPO=
```

These variables can be loaded by `source`-ing the ``

```bash
source .env.docker.development.local
# or
source .env.docker.production.local
```

### Build Image

Use the `docker` CLI to build the image:

```sh
# build image (Intel chip)
docker build -t ${AWS_REPO} .

# build image (Mac M1 chip needs to specify platform to run in AWS Batch)
docker buildx build --platform=linux/amd64 -t ${AWS_REPO} .
```

### Deploy to AWS ECR

Use the AWS CLI to log in to the AWS ECR repo and push the image:

```sh
# log in
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${AWS_REPO}

# push to ecr repo
docker push ${AWS_REPO}
```

### Run Locally

To run the AKTEMP CLI via Docker locally, pass in the environmental variables file and mount your AWS credentials (e.g. `~/.aws`) to the container:

```sh
docker run -it --rm --env-file .env.development.local -v $HOME/.aws/:/home/node/.aws ${AWS_REPO} node index.js help
```

## Cloud Infrastructure

AKTEMP is designed to run on AWS cloud infrastructure.

See `aws/README.md` for details on creating and managing the cloud infrastructure.

## License

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa]. See `LICENSE` for details.

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg
