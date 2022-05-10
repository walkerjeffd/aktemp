#!/bin/bash
# copy db/models to api and batch
# usage: ./copy-db-models

cp -r db/models/*.js api/db/models/
cp -r db/models/*.js batch/db/models/
