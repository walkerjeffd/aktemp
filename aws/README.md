# AKTEMP Cloud Infrastructure

The cloud infrastructure for AKTEMP is defined using a series of [AWS CloudFormation](https://aws.amazon.com/cloudformation/) templates. These templates are deployed using the AWS CLI and a series of custom bash scripts.

## Configuration

The cloud instracture build scripts are configured using a set of environmental variables, which can be defined in a `.env.*.local.sh` bash script (e.g. `.env.development.local.sh` or `.env.production.local.sh`). These files are not tracked by git.

Each `.env` script should define the following variables (see `.env.sh` for an template):

```sh
# stack names
export APP_NAME=aktemp
export ENV=dev # or prod
export STACK_NAME=${APP_NAME}-${ENV}

# optional prefix for all bucketnames (e.g. walkerenvres)
export BUCKET_PREFIX=

# bucket names
export DEPLOYMENT_BUCKET=${BUCKET_PREFIX}-${STACK_NAME}-deployment
export STORAGE_BUCKET=${BUCKET_PREFIX}-${STACK_NAME}-storage
export WEBSITE_BUCKET=${BUCKET_PREFIX}-${STACK_NAME}-website
```

The `.env` scripts can be loaded by `source`-ing the script:

```sh
source .env.development.local.sh
# or
source .env.production.local.sh
```

## Templates

A series of cloudformation templates are defined in the `templates/` directory. These templates should not need to be modified.

## Parameters

The input parameters for the cloudformation templates are defined using JSON parameter files in the `parameters/` directory. The repo includes an example file (e.g., `auth.template.json`) that defines the parameters for each template.

The parameters must be defined using the cloudformation key/value format:

```json
[
  {
    "ParameterKey": "string",
    "ParameterValue": "string"
  }
]
```

For each parameter file, create a local copy that includes the environment (`dev` or `prod`). For example:

```
cd parameters
cp auth.template.json auth.dev.local.json
cp auth.template.json auth.prod.local.json
```

Then edit the local files to define the parameters for each environment.

## Create Cloud Infrastructure

First, use `create-s3.sh` to create the S3 buckets

```sh
./create-s3.sh deployment ${DEPLOYMENT_BUCKET}
./create-s3.sh storage ${STORAGE_BUCKET}
./create-s3.sh website ${WEBSITE_BUCKET}
```

Then create the database, passing in the `db` parameter file:

```sh
./create-db.sh parameters/db.${ENV}.local.json
```

Lastly, create the user auth resources using the `auth` parameter file:

```sh
./create-auth.sh parameters/auth.${ENV}.local.json
```

Note that the S3, database, and user auth resources are created independently from the remaining resources to protect against accidental deletion.

Next, package the API lambda function, which uploads the `api/` source code to the deployment bucket and creates a local template (`lambda-api.local.json`) where the `Code` attribute points to the corresponding S3 bucket and key:

```
./package-lambda.sh api
```

Then validate, package, and create the remaining cloud infrastructure using the `root` template, which creates a nested stack of the remaining resources:

```sh
./validate.sh root

# package root stack (uploads templates to s3 and creates *.local.json template)
./package.sh

# create (use packaged template)
./create.sh parameters/root.${ENV}.local.json
```

## Updating Resources

Use the following scripts to update/deploy resources:

```
# repackage lambda function and root stack, then deploy everything
./update-all.sh

# repackage and deploy only the root stack (no lambda functions)
./update.sh

# only deploy the packaged template (do not re-package)
./deploy.sh
```

## Delete Resources

```sh
# delete entire root nested stack
./delete.sh

# delete buckets
./delete-s3.sh deployment ${DEPLOYMENT_BUCKET}
./delete-s3.sh website ${WEBSITE_BUCKET}
./delete-s3.sh storage ${STORAGE_BUCKET}
```