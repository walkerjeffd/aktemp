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

Load organizations, stations and files using cli

```sh
# NPS
aktemp organizations import r/export/nps/organization.csv
aktemp stations import -o NPS r/export/nps/stations.csv
aktemp files import -o NPS -d r/export/nps/files -c r/export/nps/config.json r/export/nps/filelist.csv

# UAA
aktemp organizations import r/export/uaa/organization.csv
aktemp stations import -o UAA r/export/uaa/stations.csv
aktemp files import -o UAA -d r/export/uaa/files -c r/export/uaa/config.json r/export/uaa/filelist.csv
```

Run batch processor

```sh
node batch/process.js files --all
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

## Web Application

- Explorer
  - [x] Stations Map
  - [x] Stations Table
  - [x] Station Detail
    - [x] Info
      - [ ] Add contact POC button
    - [x] Plots
      - [ ] Timeseries
        - [ ] Daily values
        - [ ] Zoomable
        - [ ] Filter by depth, dates?
      - [ ] Profiles
        - [ ] Filter by date?
    - [ ] Download CSV
  - [ ] Station filters
  - [ ] Map settings
  - [ ] Bulk download (cart)
- [ ] Auth
  - [ ] Sign up
  - [x] Log in
  - [ ] Account
- [ ] Admin
  - [ ] User management
  - [ ] Organizations management
- [ ] Manage Data
  - [x] Stations list
    - [x] Table
    - [ ] Map
  - [ ] Manage Station
    - [x] Create
    - [ ] Manage
      - [x] Edit
      - [x] Delete
      - [ ] Timeseries
      - [ ] Profiles
    - [ ] Batch import
  - [ ] Data files
    - [ ] Upload Form
      - [ ] Timeseries
      - [ ] Profiles
    - [ ] Batch import
  - [ ] QAQC
- [ ] User Guide
