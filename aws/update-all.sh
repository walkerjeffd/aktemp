#!/bin/bash
# update all templates
# usage: ./update-all.sh

set -eu

./package-lambda.sh api
./update.sh
